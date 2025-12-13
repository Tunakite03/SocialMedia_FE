import { Outlet } from 'react-router-dom';
import CallProvider from '@/contexts/CallProvider';

const AppLayout = () => {
   return (
      <CallProvider>
         <Outlet />
      
      </CallProvider>
   );
};

export default AppLayout;
