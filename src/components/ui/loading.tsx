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

// Skeleton components for loading states
const skeletonVariants = cva('animate-pulse bg-gray-200 rounded', {
   variants: {
      variant: {
         default: '',
         circle: 'rounded-full',
         rounded: 'rounded-lg',
      },
   },
   defaultVariants: {
      variant: 'default',
   },
});

interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
   className?: string;
}

export const Skeleton = ({ variant, className }: SkeletonProps) => {
   return <div className={cn(skeletonVariants({ variant }), className)} />;
};

// User card skeleton for search results
export const UserCardSkeleton = () => {
   return (
      <div className='card-liquid-glass p-4 mb-4'>
         <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
               <Skeleton
                  variant='circle'
                  className='w-12 h-12'
               />
               <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                  <Skeleton className='h-3 w-48' />
                  <div className='flex items-center space-x-4 mt-2'>
                     <Skeleton className='h-3 w-16' />
                     <Skeleton className='h-3 w-16' />
                  </div>
               </div>
            </div>
            <Skeleton className='h-8 w-20 rounded-lg' />
         </div>
      </div>
   );
};

// Multiple user card skeletons
export const UserSearchSkeleton = ({ count = 3 }: { count?: number }) => {
   return (
      <div className='space-y-2'>
         {Array.from({ length: count }, (_, i) => (
            <UserCardSkeleton key={i} />
         ))}
      </div>
   );
};
