import type { ReactNode } from 'react';
import DesktopSidebarCollapse from './DesktopSideBarCollapse';

interface ChatLayoutProps {
   children: ReactNode;
   showTopNav?: boolean;
   showBottomNav?: boolean;
}

const ChatLayout = ({ children }: ChatLayoutProps) => {
   return (
      <div className='min-h-screen bg-background w-full scrollbar-overlay'>
         {/* Desktop Sidebar - only on lg+ */}
         <div className='hidden lg:block'>
            <DesktopSidebarCollapse />
         </div>

         <main className={`lg:ml-16  scrollbar-overlay`}>
            <div className='w-full mx-auto'>
               {/* Main content */}
               {children}
            </div>
         </main>
      </div>
   );
};

export default ChatLayout;
