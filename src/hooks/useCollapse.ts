import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useCollapse = (): boolean => {
   const [isCollapse, setIsCollapse] = useState<boolean>(false);
   const location = useLocation();
   const path = location.pathname;
   useEffect(() => {
      const checkIsCollapse = () => {
         // Collapse sidebar when on chat pages (exact '/chat' or '/chat/:roomId')
         setIsCollapse(path === '/chat' || path.startsWith('/chat/') || path === 'chat');
      };

      // Set initial value
      checkIsCollapse();
   }, [path]);

   return isCollapse;
};
