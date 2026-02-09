import { Outlet } from 'react-router-dom';
import { LiveKitCallProvider } from '@/contexts/LiveKitCallProvider';

const AppLayout = () => {
   return (
      <LiveKitCallProvider>
         <Outlet />
      </LiveKitCallProvider>
   );
};

export default AppLayout;
