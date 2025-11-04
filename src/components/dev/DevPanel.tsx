import { useAuthStore } from '@/store';

const DevPanel = () => {
   const { setDemoUser, logout, user } = useAuthStore();

   // Only show in development
   if (import.meta.env.PROD) {
      return null;
   }

   return (
      <div className='fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg z-50'>
         <h3 className='text-sm font-semibold text-yellow-800 mb-2'>Dev Panel</h3>
         <div className='space-y-2'>
            <button
               onClick={setDemoUser}
               className='w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600'
            >
               Set Demo User
            </button>
            <button
               onClick={logout}
               className='w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600'
            >
               Logout
            </button>
            {user && (
               <div className='text-xs text-gray-600 bg-white p-2 rounded'>
                  <div>User: {user.displayName}</div>
                  <div>Email: {user.email}</div>
               </div>
            )}
         </div>
      </div>
   );
};

export default DevPanel;
