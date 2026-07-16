import { Redis } from '@upstash/redis'

/**
 * Upstash Redis with an in-memory fallback for local dev.
 * The fallback only lives per server process — fine for previewing,
 * NOT safe for production (locks and rate limits need real Redis).
 */

interface SetOptions {
  nx?: boolean
  ex?: number
}

export interface KV {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown, opts?: SetOptions): Promise<'OK' | null>
  del(key: string): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
}

class MemoryKV implements KV {
  private store = new Map<string, { value: unknown; expiresAt?: number }>()

  private live(key: string) {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt !== undefined && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.live(key)
    return entry === undefined ? null : (entry.value as T)
  }

  async set(key: string, value: unknown, opts?: SetOptions): Promise<'OK' | null> {
    if (opts?.nx && this.live(key) !== undefined) return null
    this.store.set(key, {
      value,
      expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : undefined,
    })
    return 'OK'
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0
  }

  async incr(key: string): Promise<number> {
    const current = ((await this.get<number>(key)) ?? 0) + 1
    const existing = this.live(key)
    this.store.set(key, { value: current, expiresAt: existing?.expiresAt })
    return current
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.live(key)
    if (!entry) return 0
    entry.expiresAt = Date.now() + seconds * 1000
    return 1
  }
}

export const redisEnabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

let warned = false
function makeClient(): KV {
  if (redisEnabled) return Redis.fromEnv() as unknown as KV
  if (!warned && process.env.NODE_ENV === 'production') {
    console.warn('[kyt] UPSTASH_REDIS_* not set — using in-memory store. Configure Redis for production.')
    warned = true
  }
  return new MemoryKV()
}

// Survive dev hot-reload with a global singleton
const globalStore = globalThis as unknown as { __kytKV?: KV }
export const kv: KV = globalStore.__kytKV ?? (globalStore.__kytKV = makeClient())

/** Simple fixed-window rate limit. Returns true if the request is allowed. */
export async function rateLimit(bucket: string, limit: number): Promise<boolean> {
  const key = `kyt:rl:${bucket}:${Math.floor(Date.now() / 60_000)}`
  const count = await kv.incr(key)
  if (count === 1) await kv.expire(key, 90)
  return count <= limit
}

/** Acquire a short-lived lock; returns a release function, or null if already held. */
export async function acquireLock(name: string, ttlSeconds = 60): Promise<(() => Promise<void>) | null> {
  const key = `kyt:lock:${name}`
  const token = Math.random().toString(36).slice(2)
  const ok = await kv.set(key, token, { nx: true, ex: ttlSeconds })
  if (ok !== 'OK') return null
  return async () => {
    const current = await kv.get<string>(key)
    if (current === token) await kv.del(key)
  }
}
