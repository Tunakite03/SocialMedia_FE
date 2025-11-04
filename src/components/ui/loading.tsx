import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin rounded-full border-2 border-current border-t-transparent', {
   variants: {
      size: {
         sm: 'h-4 w-4',
         default: 'h-6 w-6',
         lg: 'h-8 w-8',
         xl: 'h-12 w-12',
      },
   },
   defaultVariants: {
      size: 'default',
   },
});

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
   className?: string;
}

export const LoadingSpinner = ({ size, className }: LoadingSpinnerProps) => {
   return <div className={cn(spinnerVariants({ size }), className)} />;
};

interface LoadingButtonProps {
   isLoading?: boolean;
   children: React.ReactNode;
   className?: string;
}

export const LoadingButton = ({ isLoading, children, className }: LoadingButtonProps) => {
   return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
         {isLoading && <LoadingSpinner size='sm' />}
         {children}
      </div>
   );
};
