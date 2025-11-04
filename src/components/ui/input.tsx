import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
   'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
   {
      variants: {
         variant: {
            default: 'border-input',
            error: 'border-destructive focus-visible:ring-destructive',
            success: 'border-green-500 focus-visible:ring-green-500',
         },
         size: {
            default: 'h-10',
            sm: 'h-9',
            lg: 'h-11',
         },
      },
      defaultVariants: {
         variant: 'default',
         size: 'default',
      },
   }
);

export interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {
   label?: string;
   error?: string;
   leftIcon?: React.ReactNode;
   rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
   ({ className, variant, size, label, error, leftIcon, rightIcon, type, ...props }, ref) => {
      const hasError = !!error;
      const finalVariant = hasError ? 'error' : variant;

      return (
         <div className='space-y-2'>
            {label && (
               <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                  {label}
               </label>
            )}
            <div className='relative'>
               {leftIcon && (
                  <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>{leftIcon}</div>
               )}
               <input
                  type={type}
                  className={cn(
                     inputVariants({ variant: finalVariant, size, className }),
                     leftIcon && 'pl-10',
                     rightIcon && 'pr-10'
                  )}
                  ref={ref}
                  {...props}
               />
               {rightIcon && (
                  <div className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground'>{rightIcon}</div>
               )}
            </div>
            {error && <p className='text-sm text-destructive font-medium'>{error}</p>}
         </div>
      );
   }
);
Input.displayName = 'Input';

export { Input, inputVariants };
