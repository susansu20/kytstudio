import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        // Editorial: sharp corners, ink fill, accent only on interaction
        default: 'bg-ink text-paper hover:bg-accent',
        outline: 'border border-ink bg-transparent text-ink hover:border-accent hover:text-accent',
        ghost: 'text-ink underline underline-offset-4 decoration-line hover:decoration-accent hover:text-accent',
      },
      size: {
        default: 'h-12 px-8',
        sm: 'h-9 px-4',
        lg: 'h-14 px-10 text-base',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
