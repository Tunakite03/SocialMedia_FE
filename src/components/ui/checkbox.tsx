import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const checkboxVariants = cva(
   'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
   {
      variants: {
         size: {
            default: 'h-4 w-4',
            sm: 'h-3 w-3',
            lg: 'h-5 w-5',
         },
      },
      defaultVariants: {
         size: 'default',
      },
   }
);

export interface CheckboxProps
   extends Omit<React.ComponentProps<'input'>, 'size'>,
      VariantProps<typeof checkboxVariants> {
   label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, size, label, id, ...props }, ref) => {
   const inputId = id || React.useId();

   return (
      <div className='flex items-center space-x-2'>
         <div className='relative'>
            <input
               type='checkbox'
               id={inputId}
               ref={ref}
               className={cn('peer sr-only')}
               {...props}
            />
            <div className={cn(checkboxVariants({ size, className }), 'cursor-pointer transition-colors')}>
               <Check
                  className={cn(
                     'h-3 w-3 text-current opacity-0 peer-checked:opacity-100 transition-opacity',
                     size === 'sm' && 'h-2 w-2',
                     size === 'lg' && 'h-4 w-4'
                  )}
               />
            </div>
         </div>
         {label && (
            <label
               htmlFor={inputId}
               className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
            >
               {label}
            </label>
         )}
      </div>
   );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
