import { Outlet } from 'react-router-dom';
import CallProvider from '@/contexts/CallProvider';
import CallDebugPanel from '@/components/debug/CallDebugPanel';

const AppLayout = () => {
   return (
      <CallProvider>
         <Outlet />
         {/* Debug Panel - only in development */}
         {import.meta.env.DEV && <CallDebugPanel />}
      </CallProvider>
   );
};

export default AppLayout;
