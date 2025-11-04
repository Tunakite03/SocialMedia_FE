import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
   children?: ReactNode;
   fallback?: ReactNode;
}

interface State {
   hasError: boolean;
   error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
   public state: State = {
      hasError: false,
   };

   public static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
   }

   public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error('Uncaught error:', error, errorInfo);
   }

   public render() {
      if (this.state.hasError) {
         if (this.props.fallback) {
            return this.props.fallback;
         }

         return (
            <div className='min-h-screen flex items-center justify-center bg-background'>
               <div className='max-w-md w-full p-6 text-center'>
                  <div className='mb-4'>
                     <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center'>
                        <svg
                           className='w-8 h-8 text-destructive'
                           fill='none'
                           stroke='currentColor'
                           viewBox='0 0 24 24'
                        >
                           <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                           />
                        </svg>
                     </div>
                     <h1 className='text-xl font-semibold text-foreground mb-2'>Something went wrong</h1>
                     <p className='text-sm text-muted-foreground mb-4'>
                        We're sorry, but something unexpected happened. Please try refreshing the page.
                     </p>
                     {import.meta.env.DEV && this.state.error && (
                        <details className='text-left bg-muted p-3 rounded-md text-xs'>
                           <summary className='cursor-pointer font-medium'>Error Details</summary>
                           <pre className='mt-2 whitespace-pre-wrap'>{this.state.error.stack}</pre>
                        </details>
                     )}
                  </div>
                  <button
                     onClick={() => window.location.reload()}
                     className='bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors'
                  >
                     Refresh Page
                  </button>
               </div>
            </div>
         );
      }

      return this.props.children;
   }
}

export default ErrorBoundary;
