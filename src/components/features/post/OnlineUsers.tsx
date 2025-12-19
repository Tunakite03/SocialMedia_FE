import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface OnlineUser {
   id: string;
   username: string;
   displayName: string;
   avatar: string | null;
   lastSeen: string;
}

const OnlineUsers = () => {
   const { onlineUsers } = useNotificationSocket();
   const navigate = useNavigate();

   const handleUserClick = (username: string) => {
      navigate(`/profile/${username}`);
   };

   if (!onlineUsers || onlineUsers.length === 0) {
      return (
         <div className='bg-card rounded-lg shadow-sm p-4 mb-4 border border-border'>
            <div className='flex items-center justify-between mb-3'>
               <h2 className='text-sm font-semibold text-card-foreground'>Online Users</h2>
               <span className='text-xs text-muted-foreground'>0 online</span>
            </div>
            <p className='text-sm text-muted-foreground text-center py-2'>No users online right now</p>
         </div>
      );
   }

   return (
      <div className='bg-card rounded-lg shadow-sm p-4 mb-4 border border-border'>
         <div className='flex items-center justify-between mb-3'>
            <h2 className='text-sm font-semibold text-card-foreground'>Online Users</h2>
            <span className='text-xs text-muted-foreground'>{onlineUsers.length} online</span>
         </div>

         {/* Scrollable horizontal list */}
         <div className='flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground'>
            {onlineUsers.map((user: OnlineUser) => (
               <div
                  key={user.id}
                  onClick={() => handleUserClick(user.username)}
                  className='flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity'
               >
                  <div className='relative'>
                     <Avatar className='w-14 h-14 ring-2 ring-green-500'>
                        <AvatarImage
                           src={user.avatar || undefined}
                           alt={user.displayName}
                        />
                        <AvatarFallback className='bg-gradient-to-br from-purple-500 to-pink-500 text-white'>
                           {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                     </Avatar>
                     {/* Online indicator dot */}
                     <div className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full'></div>
                  </div>
                  <div className='text-center max-w-[60px]'>
                     <p className='text-xs font-medium text-card-foreground truncate'>{user.displayName}</p>
                     <p className='text-xs text-muted-foreground truncate'>@{user.username}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

export default OnlineUsers;
