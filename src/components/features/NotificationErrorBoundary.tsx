import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface NotificationErrorBoundaryState {
   hasError: boolean;
   error?: Error;
}

interface NotificationErrorBoundaryProps {
   children: React.ReactNode;
   fallback?: React.ReactNode;
}

export class NotificationErrorBoundary extends React.Component<
   NotificationErrorBoundaryProps,
   NotificationErrorBoundaryState
> {
   constructor(props: NotificationErrorBoundaryProps) {
      super(props);
      this.state = { hasError: false };
   }

   static getDerivedStateFromError(error: Error): NotificationErrorBoundaryState {
      return { hasError: true, error };
   }

   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Notification component error:', error, errorInfo);
   }

   render() {
      if (this.state.hasError) {
         if (this.props.fallback) {
            return this.props.fallback;
         }

         return (
            <div className='card-liquid-glass p-4 border border-red-200 bg-red-50/10'>
               <div className='flex items-center gap-3 text-red-600'>
                  <AlertTriangle className='h-5 w-5 shrink-0' />
                  <div>
                     <p className='text-sm font-medium'>Failed to load notification</p>
                     <p className='text-xs text-muted-foreground mt-1'>
                        There was an error displaying this notification
                     </p>
                  </div>
               </div>
            </div>
         );
      }

      return this.props.children;
   }
}
