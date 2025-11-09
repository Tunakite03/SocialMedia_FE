import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/store';
import InstagramLayout from '@/components/layout/InstagramLayout';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Settings, Grid, Bookmark, Tag, LogOut } from 'lucide-react';

const ProfilePage = () => {
   const { userId } = useParams<{ userId: string }>();
   const { user: currentUser, logout } = useAuthStore();
   const [activeTab, setActiveTab] = useState('posts');
   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

   // For demo purposes, using current user. In real app, fetch user by userId
   const user = currentUser;
   const isOwnProfile = !userId || userId === currentUser?.id;

   const handleLogout = () => {
      setShowLogoutConfirm(true);
   };

   const confirmLogout = () => {
      logout();
      // Remove manual navigation - let ProtectedRoute handle redirect
   };

   // Additional safety checks for user data
   if (!user || !user.email || !user.username) {
      return (
         <InstagramLayout>
            <div className='p-4 text-center'>
               <h1 className='text-xl font-bold mb-4'>Loading...</h1>
               <p className='text-gray-500'>Please wait while we load your profile.</p>
            </div>
         </InstagramLayout>
      );
   }

   // Mock data for posts
   const posts = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      image: `/api/placeholder/150/150?random=${i}`,
      likes: Math.floor(Math.random() * 1000) + 100,
      comments: Math.floor(Math.random() * 50) + 5,
   }));

   if (!user) {
      return (
         <InstagramLayout>
            <div className='p-4 text-center'>
               <h1 className='text-xl font-bold mb-4'>User Not Found</h1>
               <p className='text-gray-500'>The user you're looking for doesn't exist.</p>
            </div>
         </InstagramLayout>
      );
   }

   return (
      <InstagramLayout>
         <div className='bg-white'>
            {/* Profile Header */}
            <div className='p-4 border-b border-gray-200'>
               <div className='flex items-center justify-between mb-6'>
                  <h1 className='text-xl font-semibold anime-bounce'>{user.username}</h1>
                  <div className='flex items-center space-x-2 lg:hidden'>
                     <Link to='/settings'>
                        <button className='p-2 anime-hover-lift anime-button-press'>
                           <Settings
                              size={24}
                              className='text-black'
                           />
                        </button>
                     </Link>
                     {isOwnProfile && (
                        <button
                           onClick={handleLogout}
                           className='p-2 anime-hover-lift anime-button-press relative group'
                           title='Logout'
                        >
                           <LogOut
                              size={24}
                              className='text-black group-hover:text-red-500 transition-colors'
                           />
                           <span className='absolute -bottom-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                              Logout
                           </span>
                        </button>
                     )}
                  </div>
               </div>

               <div className='flex items-start space-x-4 mb-6'>
                  {/* Avatar with anime effects */}
                  <div className='w-20 h-20 rounded-full bg-gray-200 overflow-hidden shrink-0 ring-2 ring-black anime-float relative'>
                     {user.avatar ? (
                        <img
                           src={user.avatar}
                           alt={user.displayName || user.username}
                           className='w-full h-full object-cover'
                        />
                     ) : (
                        <div className='w-full h-full bg-linear-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-semibold text-xl'>
                           {user.displayName
                              ? user.displayName.charAt(0).toUpperCase()
                              : user.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                     )}
                     <span className='absolute -bottom-1 -right-1 text-2xl anime-bounce'>🌸</span>
                  </div>

                  {/* Stats with anime styling */}
                  <div className='flex-1'>
                     <div className='flex justify-around text-center mb-4'>
                        <div className='anime-hover-scale cursor-pointer'>
                           <div className='font-semibold text-lg'>{posts.length}</div>
                           <div className='text-gray-500 text-sm'>Posts</div>
                        </div>
                        <div className='anime-hover-scale cursor-pointer'>
                           <div className='font-semibold text-lg'>1,234</div>
                           <div className='text-gray-500 text-sm'>Followers</div>
                        </div>
                        <div className='anime-hover-scale cursor-pointer'>
                           <div className='font-semibold text-lg'>567</div>
                           <div className='text-gray-500 text-sm'>Following</div>
                        </div>
                     </div>

                     {/* Action Buttons with anime effects */}
                     <div className='space-y-2'>
                        {isOwnProfile ? (
                           <button className='w-full bg-gray-100 text-black py-2 px-4 rounded-lg text-sm font-semibold anime-hover-lift anime-button-press transition-all border-2 border-gray-200'>
                              ✏️ Edit Profile
                           </button>
                        ) : (
                           <div className='flex space-x-2'>
                              <button className='flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm font-semibold anime-hover-lift anime-button-press transition-all'>
                                 💙 Follow
                              </button>
                              <button className='flex-1 bg-gray-100 text-black py-2 px-4 rounded-lg text-sm font-semibold anime-hover-lift anime-button-press transition-all border-2 border-gray-200'>
                                 💬 Message
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Bio with anime styling */}
               <div className='mb-4 p-3 bg-gray-50 rounded-lg anime-slide-in-left'>
                  <div className='font-semibold text-sm mb-1 flex items-center gap-2'>
                     <span>🌟</span>
                     {user.displayName || user.username}
                  </div>
                  <div className='text-sm text-gray-600 leading-relaxed'>
                     Welcome to Otakomi! 🚀
                     <br />
                     Building connections through communication ✨
                     <br />
                     📧 {user.email}
                  </div>
               </div>
            </div>

            {/* Tabs with anime styling */}
            <div className='flex border-b border-gray-200 bg-gray-50'>
               <button
                  onClick={() => setActiveTab('posts')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all anime-hover-lift ${
                     activeTab === 'posts' ? 'border-b-2 border-black bg-white' : ''
                  }`}
               >
                  <Grid
                     size={20}
                     className={activeTab === 'posts' ? 'text-black' : 'text-gray-400'}
                  />
                  <span className='text-sm hidden sm:inline'>Posts</span>
               </button>
               {isOwnProfile && (
                  <button
                     onClick={() => setActiveTab('saved')}
                     className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all anime-hover-lift ${
                        activeTab === 'saved' ? 'border-b-2 border-black bg-white' : ''
                     }`}
                  >
                     <Bookmark
                        size={20}
                        className={activeTab === 'saved' ? 'text-black' : 'text-gray-400'}
                     />
                     <span className='text-sm hidden sm:inline'>Saved</span>
                  </button>
               )}
               <button
                  onClick={() => setActiveTab('tagged')}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 transition-all anime-hover-lift ${
                     activeTab === 'tagged' ? 'border-b-2 border-black bg-white' : ''
                  }`}
               >
                  <Tag
                     size={20}
                     className={activeTab === 'tagged' ? 'text-black' : 'text-gray-400'}
                  />
                  <span className='text-sm hidden sm:inline'>Tagged</span>
               </button>
            </div>

            {/* Posts Grid with anime effects */}
            <div className='grid grid-cols-3 gap-1 p-0'>
               {activeTab === 'posts' &&
                  posts.map((post, index) => (
                     <div
                        key={post.id}
                        className='aspect-square bg-gray-100 anime-hover-scale cursor-pointer relative overflow-hidden group'
                        style={{ animationDelay: `${index * 100}ms` }}
                     >
                        <img
                           src={post.image}
                           alt={`Post ${post.id}`}
                           className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-110'
                           onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">📸</div>`;
                           }}
                        />
                        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center'>
                           <div className='text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-semibold'>
                              ❤️ {post.likes}
                           </div>
                        </div>
                     </div>
                  ))}

               {activeTab === 'saved' && (
                  <div className='col-span-3 py-12 text-center anime-float'>
                     <Bookmark
                        size={48}
                        className='mx-auto mb-4 text-gray-300'
                     />
                     <p className='text-gray-500'>No saved posts yet</p>
                  </div>
               )}

               {activeTab === 'tagged' && (
                  <div className='col-span-3 py-12 text-center anime-float'>
                     <Tag
                        size={48}
                        className='mx-auto mb-4 text-gray-300'
                     />
                     <p className='text-gray-500'>No tagged posts yet</p>
                  </div>
               )}
            </div>

            {/* Logout Confirmation Modal */}
            <ConfirmDialog
               isOpen={showLogoutConfirm}
               onClose={() => setShowLogoutConfirm(false)}
               onConfirm={confirmLogout}
               title='Xác nhận đăng xuất'
               message='Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?'
               confirmText='Đăng xuất'
               cancelText='Hủy'
               type='warning'
            />
         </div>
      </InstagramLayout>
   );
};

export default ProfilePage;
