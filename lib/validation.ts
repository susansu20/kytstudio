import { z } from 'zod'
import { bookingConfig, type BookingField } from './booking.config'

/**
 * Server-side validation, built dynamically from the field lists in
 * booking.config.ts — add a field there and it is validated automatically.
 */

function fieldSchema(f: BookingField): z.ZodTypeAny {
  let schema: z.ZodTypeAny
  switch (f.type) {
    case 'email':
      schema = z.string().trim().email('Enter a valid email').max(200)
      break
    case 'tel':
      schema = z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{8,20}$/, 'Enter a valid phone number')
      break
    case 'number':
      schema = z
        .string()
        .trim()
        .regex(/^\d{1,3}$/, 'Enter a number')
      break
    case 'select':
    case 'radio': {
      const valid = (f.options ?? []).filter((o) => !o.startsWith('—'))
      schema = valid.length ? z.enum(valid as [string, ...string[]]) : z.string().max(200)
      break
    }
    case 'textarea':
      schema = z.string().trim().max(2000)
      break
    case 'date':
      schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
      break
    case 'time':
      schema = z.string().regex(/^\d{2}:\d{2}$/, 'Enter a valid time')
      break
    case 'consent':
      return z.literal('true', {
        errorMap: () => ({ message: 'You need to agree to the house rules to book' }),
      })
    default:
      schema = z.string().trim().max(200)
  }
  if (f.required) {
    schema = (schema as z.ZodString).min?.(1, `${f.label} is required`) ?? schema
  } else {
    schema = z.union([schema, z.literal('')]).optional()
  }
  return schema
}

export function buildFieldsSchema(fields: readonly BookingField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields) shape[f.key] = fieldSchema(f)
  return z.object(shape)
}

export const bookingRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startHour: z.number().int().min(0).max(23),
  duration: z
    .number()
    .int()
    .min(bookingConfig.minDurationHours)
    .max(Math.max(...bookingConfig.durations)),
  fields: buildFieldsSchema(bookingConfig.fields),
})

export type BookingRequest = z.infer<typeof bookingRequestSchema>

export const afterHoursRequestSchema = z.object({
  fields: buildFieldsSchema(bookingConfig.afterHoursFields),
  // Honeypot — real users never fill this hidden field
  website: z.literal('').optional(),
})

export type AfterHoursRequest = z.infer<typeof afterHoursRequestSchema>
