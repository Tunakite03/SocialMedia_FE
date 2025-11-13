import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useAuth';
import { useUser, useUserPosts, useFollow, useFollowStatus } from '@/hooks/useUsers';
import { useFollowersModal, useFollowingModal } from '@/hooks/useFollowModal';
import { uploadService } from '@/services/uploadService';
import InstagramLayout from '@/components/layout/InstagramLayout';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Settings, Grid, Bookmark, Tag, LogOut, Camera, X, UserPlus, UserCheck, MessageCircle } from 'lucide-react';

const ProfilePage = () => {
   const { logout, user: currentUser } = useAuthStore();
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState('posts');
   const { id } = useParams<{ id: string }>();
   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
   const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

   const fileInputRef = useRef<HTMLInputElement>(null);

   // Determine if this is the current user's profile
   const isOwner = !id || id === currentUser?.id;

   // Get current user's profile data for personal profile
   const { profile: currentUserProfile, loading: currentUserLoading, updateProfile } = useProfile();

   // Get other user's profile data for external profiles
   const { user: otherUserProfile, loading: otherUserLoading, error: otherUserError } = useUser(id || '');

   // Get posts for the displayed user
   const { posts, loading: postsLoading } = useUserPosts(isOwner ? currentUserProfile?.id || '' : id || '');

   // Follow functionality for other users
   const { followUser, unfollowUser, loading: followLoading } = useFollow();

   // Check follow status for other users
   const { isFollowing, setIsFollowing } = useFollowStatus(!isOwner ? id || '' : '');

   // Determine which profile data to display
   const displayUser = isOwner ? currentUserProfile : otherUserProfile;
   const profileLoading = isOwner ? currentUserLoading : otherUserLoading;

   // Use custom modal hooks for followers/following
   const followersModal = useFollowersModal(displayUser?.id || '');
   const followingModal = useFollowingModal(displayUser?.id || '');

   const handleLogout = () => {
      setShowLogoutConfirm(true);
   };

   const confirmLogout = () => {
      logout();
      // Remove manual navigation - let ProtectedRoute handle redirect
   };

   const handleFollow = async () => {
      if (!displayUser?.id || followLoading) return;

      try {
         await followUser(displayUser.id);
         setIsFollowing(true);
      } catch (error) {
         console.error('Error following user:', error);
      }
   };

   const handleUnfollow = async () => {
      if (!displayUser?.id || followLoading) return;

      try {
         await unfollowUser(displayUser.id);
         setIsFollowing(false);
      } catch (error) {
         console.error('Error unfollowing user:', error);
      }
   };

   const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Basic validation
      if (!file.type.startsWith('image/')) {
         alert('Please select an image file');
         return;
      }

      if (file.size > 5 * 1024 * 1024) {
         // 5MB limit
         alert('Image size should be less than 5MB');
         return;
      }

      try {
         setIsUploadingAvatar(true);

         // Upload image to get URL
         const uploadResponse = await uploadService.uploadImage(file);

         if (uploadResponse.success && uploadResponse.data) {
            // Update user profile with new avatar URL using useProfile hook
            const updatedUser = await updateProfile({
               avatar: uploadResponse.data.url,
            });

            if (updatedUser) {
               alert('Avatar updated successfully!');
            }
         }
      } catch (error) {
         console.error('Avatar upload error:', error);
         alert('Failed to upload avatar. Please try again.');
      } finally {
         setIsUploadingAvatar(false);
         // Reset file input
         if (event.target) {
            event.target.value = '';
         }
      }
   };

   const triggerAvatarUpload = () => {
      fileInputRef.current?.click();
   };

   if (profileLoading) {
      return (
         <InstagramLayout>
            <div className='p-4 text-center'>
               <div className='card-liquid-glass-animate max-w-sm mx-auto p-8 rounded-2xl'>
                  <div className='relative mb-6'>
                     <div className='anime-spinner w-12 h-12 border-4 border-hsl(var(--primary)) border-t-transparent rounded-full mx-auto mb-4 anime-bounce'></div>
                     <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='text-3xl anime-pulse'>👤</div>
                     </div>
                  </div>
                  <div className='space-y-3'>
                     <h3 className='font-anime font-bold text-lg text-hsl(var(--primary)) anime-float'>
                        {isOwner ? 'Loading your profile...' : 'Loading profile...'}
                     </h3>
                     <p className='text-sm text-hsl(var(--muted-foreground)) font-anime'>Please wait a moment ✨</p>
                  </div>
               </div>
            </div>
         </InstagramLayout>
      );
   }

   // Handle case where user is not found (for other users' profiles)
   if (!isOwner && otherUserError) {
      return (
         <InstagramLayout>
            <div className='p-4 text-center'>
               <div className='card-liquid-glass-animate max-w-sm mx-auto p-8 rounded-2xl'>
                  <div className='text-6xl mb-6 anime-bounce'>😔</div>
                  <div className='space-y-4'>
                     <h3 className='font-anime font-bold text-xl text-hsl(var(--primary))'>User not found</h3>
                     <p className='text-hsl(var(--muted-foreground)) font-anime'>
                        The user you're looking for doesn't exist or may have been removed.
                     </p>
                     <div className='flex gap-3 justify-center mt-6'>
                        <button
                           onClick={() => navigate('/profile')}
                           className='card-liquid-glass-blue py-3 px-6 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'
                        >
                           ← Back to My Profile
                        </button>
                        <button
                           onClick={() => navigate('/search')}
                           className='card-liquid-glass-accent py-3 px-6 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'
                        >
                           🔍 Find Users
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </InstagramLayout>
      );
   }

   // Handle case where loading finished but no user found (invalid ID)
   if (!isOwner && !otherUserLoading && !otherUserProfile) {
      return (
         <InstagramLayout>
            <div className='p-4 text-center'>
               <div className='card-liquid-glass-animate max-w-sm mx-auto p-8 rounded-2xl'>
                  <div className='text-6xl mb-6 anime-bounce'>🔍</div>
                  <div className='space-y-4'>
                     <h3 className='font-anime font-bold text-xl text-hsl(var(--primary))'>User not found</h3>
                     <p className='text-hsl(var(--muted-foreground)) font-anime'>
                        The profile you're looking for doesn't exist. It may have been deleted or the link is incorrect.
                     </p>
                     <div className='flex gap-3 justify-center mt-6'>
                        <button
                           onClick={() => navigate('/profile')}
                           className='card-liquid-glass-blue py-3 px-6 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'
                        >
                           ← Back to My Profile
                        </button>
                        <button
                           onClick={() => navigate('/search')}
                           className='card-liquid-glass-accent py-3 px-6 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'
                        >
                           🔍 Find Users
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </InstagramLayout>
      );
   }

   // Handle general profile error (couldn't load data)
   if (!displayUser || !displayUser.username) {
      return (
         <InstagramLayout>
            <div className='p-4 text-center'>
               <div className='card-liquid-glass-animate max-w-sm mx-auto p-8 rounded-2xl'>
                  <div className='text-6xl mb-6 anime-bounce'>⚠️</div>
                  <div className='space-y-4'>
                     <h3 className='font-anime font-bold text-xl text-hsl(var(--primary))'>Profile Error</h3>
                     <p className='text-hsl(var(--muted-foreground)) font-anime'>
                        Unable to load profile information. This might be a temporary issue.
                     </p>
                     <div className='flex gap-3 justify-center mt-6'>
                        <button
                           onClick={() => window.location.reload()}
                           className='card-liquid-glass-blue py-3 px-6 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'
                        >
                           🔄 Try Again
                        </button>
                        <button
                           onClick={() => navigate('/feed')}
                           className='card-liquid-glass-accent py-3 px-6 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'
                        >
                           ← Back to Feed
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </InstagramLayout>
      );
   }

   // Get real data from API - profile có _count, currentUser thì không
   const userPosts = posts || [];
   const followersCount = (displayUser as any)?._count?.followers || 0;
   const followingCount = (displayUser as any)?._count?.following || 0;
   const postsCount = (displayUser as any)?._count?.posts || userPosts.length || 0;

   return (
      <InstagramLayout>
         <div className='min-h-screen bg-linear-to-b from-indigo-50/30 to-purple-50/30 md:mx-4'>
            {/* Profile Header Card */}
            <div className='card-liquid-glass'>
               {/* Header with username and actions */}
               <div className='flex items-center justify-between mb-4'>
                  <div className='flex items-center space-x-3 ml-auto'>
                     {isOwner && (
                        <>
                           <Link to='/settings'>
                              <button className='card-liquid-glass-blue p-2 rounded-full anime-hover-lift anime-button-press transition-all'>
                                 <Settings
                                    size={20}
                                    className='text-hsl(var(--primary))'
                                 />
                              </button>
                           </Link>
                           <button
                              onClick={handleLogout}
                              className='card-liquid-glass-accent p-2 rounded-full anime-hover-lift anime-button-press relative group transition-all hover:bg-red-50'
                              title='Logout'
                           >
                              <LogOut
                                 size={20}
                                 className='text-red-500 group-hover:text-red-600 transition-colors'
                              />
                           </button>
                        </>
                     )}
                  </div>
               </div>

               {/* Profile Info Section */}
               <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 items-start'>
                  {/* Avatar Section */}
                  <div className='flex flex-col items-center sm:items-start'>
                     <div className='relative w-24 h-24 rounded-full overflow-hidden shrink-0 ring-4 ring-white shadow-lg anime-float'>
                        {displayUser.avatar ? (
                           <img
                              src={displayUser.avatar}
                              alt={displayUser.displayName || displayUser.username}
                              className='w-full h-full object-cover'
                           />
                        ) : (
                           <div className='w-full h-full bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl'>
                              {displayUser.displayName
                                 ? displayUser.displayName.charAt(0).toUpperCase()
                                 : displayUser.username?.charAt(0).toUpperCase() || '?'}
                           </div>
                        )}
                        <div className='absolute -bottom-1 -right-1 w-8 h-8 bg-linear-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold anime-pulse'>
                           🌸
                        </div>

                        {/* Avatar upload overlay - only for owner */}
                        {isOwner && (
                           <button
                              onClick={triggerAvatarUpload}
                              disabled={isUploadingAvatar}
                              className='absolute inset-0 bg-black/0 hover:bg-black/60 transition-all duration-300 flex items-center justify-center rounded-full anime-hover-scale'
                              title='Change avatar'
                           >
                              <Camera
                                 size={24}
                                 className='text-white opacity-0 hover:opacity-100 transition-opacity'
                              />
                              {isUploadingAvatar && (
                                 <div className='absolute inset-0 bg-black/80 flex items-center justify-center rounded-full'>
                                    <div className='anime-spinner w-6 h-6 border-2 border-white border-t-transparent rounded-full'></div>
                                 </div>
                              )}
                           </button>
                        )}
                        {isOwner && (
                           <input
                              ref={fileInputRef}
                              type='file'
                              accept='image/*'
                              onChange={handleAvatarUpload}
                              className='hidden'
                           />
                        )}
                     </div>

                     {/* Display Name */}
                     <div className='text-center sm:text-left mt-3'>
                        <h2 className='font-anime font-semibold text-lg text-hsl(var(--primary))'>
                           {displayUser.displayName || displayUser.username}
                        </h2>
                        <p className='text-sm text-hsl(var(--muted-foreground))'>@{displayUser.username}</p>
                     </div>
                  </div>

                  {/* Stats Section */}
                  <div className='sm:col-span-2'>
                     <div className='grid grid-cols-3 gap-4 mb-4'>
                        <div className='text-center card-liquid-glass-blue p-3 rounded-xl anime-hover-scale cursor-pointer transition-all'>
                           <div className='text-xl font-bold text-hsl(var(--primary)) anime-bounce'>{postsCount}</div>
                           <div className='text-sm text-hsl(var(--muted-foreground)) font-anime'>Posts</div>
                        </div>
                        <div
                           className='text-center card-liquid-glass-purple p-3 rounded-xl anime-hover-scale cursor-pointer transition-all'
                           onClick={followersModal.openModal}
                        >
                           <div className='text-xl font-bold text-hsl(var(--primary)) anime-bounce'>
                              {followersCount}
                           </div>
                           <div className='text-sm text-hsl(var(--muted-foreground)) font-anime'>Followers</div>
                        </div>
                        <div
                           className='text-center card-liquid-glass-accent p-3 rounded-xl anime-hover-scale cursor-pointer transition-all'
                           onClick={followingModal.openModal}
                        >
                           <div className='text-xl font-bold text-hsl(var(--primary)) anime-bounce'>
                              {followingCount}
                           </div>
                           <div className='text-sm text-hsl(var(--muted-foreground)) font-anime'>Following</div>
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className='flex gap-3'>
                        {isOwner ? (
                           // Buttons for own profile
                           <>
                              <Link
                                 to='/settings'
                                 className='flex-1'
                              >
                                 <button className='w-full card-liquid-glass-accent py-3 px-4 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'>
                                    Edit Profile
                                 </button>
                              </Link>
                              <button className='card-liquid-glass-blue py-3 px-4 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary))'>
                                 Share
                              </button>
                           </>
                        ) : (
                           // Buttons for other users' profiles
                           <>
                              <button
                                 onClick={isFollowing ? handleUnfollow : handleFollow}
                                 disabled={followLoading}
                                 className={`flex-1 py-3 px-4 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all flex items-center justify-center gap-2 ${
                                    isFollowing
                                       ? 'card-liquid-glass-accent text-hsl(var(--primary))'
                                       : 'card-liquid-glass-blue text-hsl(var(--primary))'
                                 }`}
                              >
                                 {followLoading ? (
                                    <div className='anime-spinner w-5 h-5 border-2 border-current border-t-transparent rounded-full'></div>
                                 ) : (
                                    <>
                                       {isFollowing ? <UserCheck size={20} /> : <UserPlus size={20} />}
                                       {isFollowing ? 'Following' : 'Follow'}
                                    </>
                                 )}
                              </button>
                              <Link
                                 to={`/chat`}
                                 className=''
                              >
                                 <button className='card-liquid-glass-purple py-3 px-4 rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary)) flex items-center gap-2'>
                                    <MessageCircle size={20} />
                                    Message
                                 </button>
                              </Link>
                           </>
                        )}
                     </div>
                  </div>
               </div>

               {/* Bio Section */}
               <div className='mt-4 p-4 card-liquid-glass-accent rounded-xl anime-slide-in-left'>
                  <div className='text-sm text-hsl(var(--foreground)) leading-relaxed font-anime'>
                     {isOwner ? (
                        // Bio for own profile
                        <>
                           <div className='flex items-center gap-2 mb-2'>
                              <span className='text-lg'>🚀</span>
                              <span className='font-semibold'>Welcome to Otakomi!</span>
                           </div>
                           <div className='text-hsl(var(--muted-foreground))'>
                              Building connections through communication ✨
                              <br />
                              📧 {displayUser.email}
                           </div>
                        </>
                     ) : (
                        // Bio for other users
                        <>
                           <div className='flex items-center gap-2 mb-2'>
                              <span className='text-lg'>👋</span>
                              <span className='font-semibold'>{displayUser.displayName || displayUser.username}</span>
                           </div>
                           <div className='text-hsl(var(--muted-foreground))'>
                              {displayUser.bio ? displayUser.bio : <span className='italic'>No bio available</span>}
                              <br />
                              <span className='text-xs'>@{displayUser.username}</span>
                           </div>
                        </>
                     )}
                  </div>
               </div>
            </div>

            {/* Tabs with liquid glass styling */}
            <div className='liquid-glass overflow-hidden mt-4 text-foreground bg-background p-1'>
               <div className='flex bg-white/60 backdrop-blur-sm'>
                  <button
                     onClick={() => setActiveTab('posts')}
                     className={`flex-1 py-4 flex items-center justify-center gap-3 transition-all duration-500 rounded-2xl anime-hover-lift font-anime font-semibold ${
                        activeTab === 'posts' ? 'shadow-lg ' : ' '
                     }`}
                  >
                     <Grid
                        size={22}
                        className={activeTab === 'posts' ? 'text-foreground' : 'text-muted-foreground'}
                     />
                     <span
                        className={`${
                           activeTab === 'posts' ? 'text-foreground' : 'text-muted-foreground'
                        } text-sm sm:text-base`}
                     >
                        Posts
                     </span>
                  </button>
                  {/* Only show Saved and Tagged tabs for own profile */}
                  {isOwner && (
                     <>
                        <button
                           onClick={() => setActiveTab('saved')}
                           className={`flex-1 py-4 flex items-center justify-center gap-3 duration-500 rounded-2xl transition-all anime-hover-lift font-anime font-semibold ${
                              activeTab === 'saved' ? 'shadow-lg ' : ' '
                           }`}
                        >
                           <Bookmark
                              size={22}
                              className={activeTab === 'saved' ? 'text-foreground' : 'text-muted-foreground'}
                           />
                           <span
                              className={`${
                                 activeTab === 'saved' ? 'text-foreground' : 'text-muted-foreground'
                              } text-sm sm:text-base`}
                           >
                              Saved
                           </span>
                        </button>
                        <button
                           onClick={() => setActiveTab('tagged')}
                           className={`flex-1 py-4 flex items-center justify-center gap-3 duration-500 rounded-2xl transition-all anime-hover-lift font-anime font-semibold ${
                              activeTab === 'tagged' ? 'shadow-lg ' : ' '
                           }`}
                        >
                           <Tag
                              size={22}
                              className={activeTab === 'tagged' ? 'text-foreground' : 'text-muted-foreground'}
                           />
                           <span
                              className={`${
                                 activeTab === 'tagged' ? 'text-foreground' : 'text-muted-foreground'
                              } text-sm sm:text-base`}
                           >
                              Tagged
                           </span>
                        </button>
                     </>
                  )}
               </div>
            </div>

            {/* Posts Grid with enhanced styling */}
            <div className=''>
               {activeTab === 'posts' && (
                  <div className='grid grid-cols-3 md:grid-cols-4 gap-0.5'>
                     {postsLoading ? (
                        <div className='col-span-3 py-16 text-center'>
                           <div className='card-liquid-glass-animate max-w-sm mx-auto p-8 rounded-2xl'>
                              <div className='relative mb-6'>
                                 <div className='anime-spinner w-12 h-12 border-4 border-hsl(var(--primary)) border-t-transparent rounded-full mx-auto mb-4 anime-bounce'></div>
                                 <div className='absolute inset-0 flex items-center justify-center'>
                                    <div className='text-3xl anime-pulse'>📸</div>
                                 </div>
                              </div>
                              <div className='space-y-3'>
                                 <h3 className='font-anime font-bold text-lg text-hsl(var(--primary)) anime-float'>
                                    Loading your posts...
                                 </h3>
                                 <p className='text-sm text-hsl(var(--muted-foreground)) font-anime'>
                                    Gathering memories ✨
                                 </p>
                                 <div className='flex justify-center space-x-1 mt-4'>
                                    <div
                                       className='w-2 h-2 bg-hsl(var(--primary)) rounded-full anime-bounce'
                                       style={{ animationDelay: '0ms' }}
                                    ></div>
                                    <div
                                       className='w-2 h-2 bg-hsl(var(--secondary)) rounded-full anime-bounce'
                                       style={{ animationDelay: '200ms' }}
                                    ></div>
                                    <div
                                       className='w-2 h-2 bg-hsl(var(--accent)) rounded-full anime-bounce'
                                       style={{ animationDelay: '400ms' }}
                                    ></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : userPosts.length > 0 ? (
                        userPosts.map((post, index) => (
                           <div
                              key={post.id}
                              className='aspect-square  overflow-hidden anime-hover-scale cursor-pointer relative group transition-all duration-300'
                              style={{ animationDelay: `${index * 100}ms` }}
                           >
                              {post.mediaUrl ? (
                                 <img
                                    src={post.mediaUrl}
                                    alt={`Post ${post.id}`}
                                    className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ease-in-out'
                                    onError={(e) => {
                                       const target = e.target as HTMLImageElement;
                                       target.style.display = 'none';
                                       target.parentElement!.innerHTML = `<div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">�</div>`;
                                    }}
                                 />
                              ) : (
                                 <div className='w-full h-full bg-linear-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-3'>
                                    <p className='text-xs text-hsl(var(--primary)) text-center line-clamp-3 font-anime'>
                                       {post.content || 'No content'}
                                    </p>
                                 </div>
                              )}
                              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center'>
                                 <div className='text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center'>
                                    <div className='font-anime font-bold text-lg mb-1'>
                                       ❤️ {post._count?.reactions || 0}
                                    </div>
                                    <div className='text-sm'>💬 {post._count?.comments || 0}</div>
                                 </div>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className='col-span-3 py-16 text-center anime-float'>
                           <div className='text-6xl mb-6 anime-bounce'>📸</div>
                           <h3 className='text-xl font-anime font-bold text-hsl(var(--primary)) mb-2'>
                              {isOwner
                                 ? 'No posts yet'
                                 : `${displayUser.displayName || displayUser.username} hasn't posted yet`}
                           </h3>
                           <p className='font-anime mb-4'>
                              {isOwner ? 'Share your first post to get started!' : 'Check back later for new posts!'}
                           </p>
                           {isOwner && (
                              <Link to='/create'>
                                 <button className='card-liquid-glass-blue py-3 px-6 rounded-xl font-anime font-semibold anime-hover-lift transition-all'>
                                    ✨ Create Post
                                 </button>
                              </Link>
                           )}
                        </div>
                     )}
                  </div>
               )}

               {activeTab === 'saved' && (
                  <div className='col-span-3 py-16 text-center anime-float'>
                     <div className='w-20 h-20 mx-auto mb-6 card-liquid-glass-purple rounded-full flex items-center justify-center'>
                        <Bookmark
                           size={40}
                           className='text-hsl(var(--primary))'
                        />
                     </div>
                     <h3 className='text-xl font-anime font-bold text-hsl(var(--primary)) mb-2'>No saved posts yet</h3>
                     <p className='text-hsl(var(--muted-foreground)) font-anime'>Posts you save will appear here</p>
                  </div>
               )}

               {activeTab === 'tagged' && (
                  <div className='col-span-3 py-16 text-center anime-float'>
                     <div className='w-20 h-20 mx-auto mb-6 card-liquid-glass-accent rounded-full flex items-center justify-center'>
                        <Tag
                           size={40}
                           className='text-hsl(var(--primary))'
                        />
                     </div>
                     <h3 className='text-xl font-anime font-bold text-hsl(var(--primary)) mb-2'>No tagged posts yet</h3>
                     <p className='text-hsl(var(--muted-foreground)) font-anime'>
                        Posts you're tagged in will appear here
                     </p>
                  </div>
               )}
            </div>

            {/* Logout Confirmation Modal */}
            <ConfirmDialog
               isOpen={showLogoutConfirm}
               onClose={() => setShowLogoutConfirm(false)}
               onConfirm={confirmLogout}
               title='Xác nhận đăng xuất'
               message='Em không thoát nổi tôi đâu cô bé à!!!!!'
               confirmText='Thoát ly'
               cancelText='Noo'
               type='warning'
            />

            {/* Followers Modal with enhanced styling */}
            {followersModal.isOpen && (
               <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 anime-slide-in-left'>
                  <div className='card-liquid-glass-animate w-full max-w-md max-h-[70vh] overflow-hidden rounded-2xl border-2 border-white/20'>
                     <div className='flex items-center justify-between p-6 border-b border-white/10'>
                        <h2 className='text-xl font-anime font-bold text-white flex items-center gap-2'>Followers</h2>
                        <button
                           onClick={followersModal.closeModal}
                           className='card-liquid-glass-accent p-2 rounded-full anime-hover-scale transition-all hover:bg-red-50'
                        >
                           <X
                              size={22}
                              className='text-hsl(var(--muted-foreground)) hover:text-red-500'
                           />
                        </button>
                     </div>
                     <div className='p-4 overflow-y-auto max-h-96'>
                        {followersModal.loading ? (
                           <div className='text-center py-12 anime-float'>
                              <div className='anime-spinner w-8 h-8 border-3 border-hsl(var(--primary)) border-t-transparent rounded-full mx-auto mb-4'></div>
                              <p className='text-hsl(var(--muted-foreground)) font-anime text-lg'>
                                 Loading followers...
                              </p>
                           </div>
                        ) : followersModal.followers && followersModal.followers.length > 0 ? (
                           followersModal.followers.map((follower) => (
                              <div
                                 key={follower.id}
                                 className='flex items-center space-x-3 p-3 card-liquid-glass-accent rounded-xl mb-2 anime-hover-lift transition-all'
                              >
                                 <div className='w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-white'>
                                    {follower.avatar ? (
                                       <img
                                          src={follower.avatar}
                                          alt={follower.displayName || follower.username}
                                          className='w-full h-full object-cover'
                                       />
                                    ) : (
                                       <div className='w-full h-full bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg'>
                                          {follower.displayName?.charAt(0) || follower.username?.charAt(0) || '?'}
                                       </div>
                                    )}
                                 </div>
                                 <div className='flex-1 min-w-0'>
                                    <p className='font-anime font-semibold text-hsl(var(--primary)) truncate'>
                                       {follower.displayName || follower.username}
                                    </p>
                                    <p className='text-sm text-hsl(var(--muted-foreground)) truncate'>
                                       @{follower.username}
                                    </p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className='text-center py-12 text-hsl(var(--muted-foreground)) anime-float'>
                              <div className='text-4xl mb-4'>👤</div>
                              <p className='font-anime'>No followers yet</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {/* Following Modal with enhanced styling */}
            {followingModal.isOpen && (
               <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 anime-slide-in-right'>
                  <div className='card-liquid-glass-animate w-full max-w-md max-h-[70vh] overflow-hidden rounded-2xl border-2 border-white/20'>
                     <div className='flex items-center justify-between p-6 border-b border-white/10'>
                        <h2 className='text-xl font-anime font-bold text-white flex items-center gap-2'>Following</h2>
                        <button
                           onClick={followingModal.closeModal}
                           className='card-liquid-glass-accent p-2 rounded-full anime-hover-scale transition-all hover:bg-red-50'
                        >
                           <X
                              size={22}
                              className='text-hsl(var(--muted-foreground)) hover:text-red-500'
                           />
                        </button>
                     </div>
                     <div className='p-4 overflow-y-auto max-h-96 '>
                        {followingModal.loading ? (
                           <div className='text-center py-12 anime-float'>
                              <div className='anime-spinner w-8 h-8 border-3 border-hsl(var(--primary)) border-t-transparent rounded-full mx-auto mb-4'></div>
                              <p className='text-muted-foreground font-anime text-lg'>Loading following...</p>
                           </div>
                        ) : followingModal.following && followingModal.following.length > 0 ? (
                           followingModal.following.map((user) => (
                              <div
                                 key={user.id}
                                 className='flex items-center space-x-3 p-3 card-liquid-glass-accent rounded-xl mb-2 anime-hover-lift transition-all'
                              >
                                 <div className='w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-white'>
                                    {user.avatar ? (
                                       <img
                                          src={user.avatar}
                                          alt={user.displayName || user.username}
                                          className='w-full h-full object-cover'
                                       />
                                    ) : (
                                       <div className='w-full h-full bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center font-bold text-lg'>
                                          {user.displayName?.charAt(0) || user.username?.charAt(0) || '?'}
                                       </div>
                                    )}
                                 </div>
                                 <div className='flex-1 min-w-0'>
                                    <p className='font-anime font-semibold text-black truncate'>
                                       {user.displayName || user.username}
                                    </p>
                                    <p className='text-sm text-gray-600 truncate'>@{user.username}</p>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className='text-center py-12 text-hsl(var(--muted-foreground)) anime-float'>
                              <p className='font-anime'>Not following anyone yet</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </InstagramLayout>
   );
};

export default ProfilePage;
