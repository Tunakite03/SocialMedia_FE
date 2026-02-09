import { useState } from 'react';
import {
   Moon,
   Sun,
   Globe,
   Palette,
   User,
   Bell,
   Shield,
   ArrowLeft,
   Edit,
   ChevronRight,
   Settings,
   HelpCircle,
   LogOut,
   Lock,
   Eye,
   Mail,
   Smartphone,
   MessageSquare,
   Heart,
   UserPlus,
   Camera,
   CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore, useAuthStore } from '@/store';
import { useProfile } from '@/hooks/useAuth';
import EditProfileModal from '@/components/features/profile/EditProfileModal';

// Toggle Switch Component
const ToggleSwitch = ({
   enabled,
   onChange,
   size = 'default',
}: {
   enabled: boolean;
   onChange: () => void;
   size?: 'small' | 'default';
}) => {
   const sizeClasses = size === 'small' ? 'w-9 h-5' : 'w-11 h-6';
   const dotSizeClasses = size === 'small' ? 'w-4 h-4' : 'w-5 h-5';
   const translateClasses = size === 'small' ? 'translate-x-4' : 'translate-x-5';

   return (
      <button
         onClick={onChange}
         className={`relative inline-flex ${sizeClasses} items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background ${
            enabled ? 'bg-primary' : 'bg-muted-foreground/30'
         }`}
      >
         <span
            className={`inline-block ${dotSizeClasses} transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
               enabled ? translateClasses : 'translate-x-0.5'
            }`}
         />
      </button>
   );
};

// Setting Item Component
const SettingItem = ({
   icon: Icon,
   title,
   description,
   rightElement,
   onClick,
   danger = false,
   iconBg = 'bg-primary/10',
   iconColor = 'text-primary',
}: {
   icon: React.ElementType;
   title: string;
   description?: string;
   rightElement?: React.ReactNode;
   onClick?: () => void;
   danger?: boolean;
   iconBg?: string;
   iconColor?: string;
}) => {
   return (
      <div
         onClick={onClick}
         className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
            onClick ? 'cursor-pointer hover:bg-muted/50 active:scale-[0.99]' : ''
         } ${danger ? 'hover:bg-red-500/10' : ''}`}
      >
         <div className='flex items-center gap-4'>
            <div
               className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-red-500/10' : iconBg}`}
            >
               <Icon
                  size={20}
                  className={danger ? 'text-red-500' : iconColor}
               />
            </div>
            <div>
               <p className={`font-medium ${danger ? 'text-red-500' : 'text-foreground'}`}>{title}</p>
               {description && <p className='text-sm text-muted-foreground mt-0.5'>{description}</p>}
            </div>
         </div>
         {rightElement ||
            (onClick && (
               <ChevronRight
                  size={20}
                  className='text-muted-foreground'
               />
            ))}
      </div>
   );
};

// Section Header Component
const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
   <div className='px-4 pt-6 pb-2'>
      <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>{title}</h3>
      {subtitle && <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>}
   </div>
);

const SettingsPage = () => {
   const { theme, language, setTheme, setLanguage } = useThemeStore();
   const { user, logout } = useAuthStore();
   const { profile } = useProfile();
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState('general');
   const [showEditProfileModal, setShowEditProfileModal] = useState(false);
   const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

   // Notification states
   const [notifications, setNotifications] = useState({
      push: true,
      email: false,
      comments: true,
      follows: true,
      likes: true,
      messages: true,
   });

   // Privacy states
   const [privacy, setPrivacy] = useState({
      privateAccount: false,
      showOnlineStatus: true,
      allowEmailSearch: false,
      twoFactor: false,
   });

   const tabs = [
      { id: 'general', label: 'Chung', icon: Palette },
      { id: 'account', label: 'Tài khoản', icon: User },
      { id: 'notifications', label: 'Thông báo', icon: Bell },
      { id: 'privacy', label: 'Quyền riêng tư', icon: Shield },
   ];

   const handleLogout = () => {
      setShowLogoutConfirm(true);
   };

   const confirmLogout = () => {
      logout();
      navigate('/auth/login');
   };

   return (
      <div className='min-h-screen bg-background'>
         {/* Header */}
         <div className='sticky top-0 z-50 liquid-glass border-b border-border/50'>
            <div className='max-w-6xl mx-auto px-4 sm:px-6'>
               <div className='flex items-center justify-between h-16'>
                  <div className='flex items-center gap-4'>
                     <button
                        onClick={() => navigate(-1)}
                        className='p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 active:scale-95'
                     >
                        <ArrowLeft
                           size={20}
                           className='text-foreground'
                        />
                     </button>
                     <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 rounded-xl bg-muted flex items-center justify-center'>
                           <Settings
                              size={18}
                              className='text-muted-foreground'
                           />
                        </div>
                        <div>
                           <h1 className='text-lg font-semibold text-foreground'>Cài đặt</h1>
                           <p className='text-xs text-muted-foreground hidden sm:block'>Quản lý tài khoản của bạn</p>
                        </div>
                     </div>
                  </div>
                  <button
                     onClick={() => navigate('/help')}
                     className='p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200'
                  >
                     <HelpCircle
                        size={20}
                        className='text-muted-foreground'
                     />
                  </button>
               </div>
            </div>
         </div>

         <div className='max-w-6xl mx-auto px-4 sm:px-6 py-6'>
            <div className='lg:grid lg:grid-cols-12 lg:gap-8'>
               {/* Sidebar */}
               <div className='lg:col-span-4 xl:col-span-3 mb-6 lg:mb-0'>
                  {/* Profile Card */}
                  <div className='card-liquid-glass p-5 mb-4'>
                     <div className='flex items-center gap-4'>
                        <div className='relative'>
                           <div className='w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background'>
                              {profile?.avatar || user?.avatar ? (
                                 <img
                                    src={profile?.avatar || user?.avatar}
                                    alt={profile?.displayName || user?.displayName || 'Avatar'}
                                    className='w-full h-full object-cover'
                                 />
                              ) : (
                                 <div className='w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xl'>
                                    {(
                                       profile?.displayName ||
                                       user?.displayName ||
                                       profile?.username ||
                                       user?.username ||
                                       'U'
                                    )
                                       .charAt(0)
                                       .toUpperCase()}
                                 </div>
                              )}
                           </div>
                           <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center ring-2 ring-background'>
                              <CheckCircle2
                                 size={14}
                                 className='text-white'
                              />
                           </div>
                        </div>
                        <div className='flex-1 min-w-0'>
                           <h3 className='font-semibold text-foreground truncate'>
                              {profile?.displayName || user?.displayName || profile?.username || user?.username}
                           </h3>
                           <p className='text-sm text-muted-foreground truncate'>
                              @{profile?.username || user?.username}
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => setShowEditProfileModal(true)}
                        className='w-full mt-4 py-2.5 px-4 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2'
                     >
                        <Edit size={16} />
                        Chỉnh sửa hồ sơ
                     </button>
                  </div>

                  {/* Navigation Tabs */}
                  <nav className='card-liquid-glass p-2 space-y-1'>
                     {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                           <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
                                 isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                              }`}
                           >
                              <div
                                 className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                    isActive ? 'bg-primary-foreground/20' : 'bg-muted'
                                 }`}
                              >
                                 <IconComponent size={18} />
                              </div>
                              <span className='font-medium'>{tab.label}</span>
                              {isActive && (
                                 <ChevronRight
                                    size={18}
                                    className='ml-auto'
                                 />
                              )}
                           </button>
                        );
                     })}

                     {/* Logout Button */}
                     <div className='pt-2 border-t border-border/50 mt-2'>
                        <button
                           onClick={handleLogout}
                           className='w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 text-red-500 hover:bg-red-500/10'
                        >
                           <div className='w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10'>
                              <LogOut size={18} />
                           </div>
                           <span className='font-medium'>Đăng xuất</span>
                        </button>
                     </div>
                  </nav>
               </div>

               {/* Content */}
               <div className='lg:col-span-8 xl:col-span-9'>
                  <div className='card-liquid-glass overflow-hidden'>
                     {/* Tab Content */}
                     {activeTab === 'general' && (
                        <div className='divide-y divide-border/50'>
                           {/* Header */}
                           <div className='p-6 bg-muted/30'>
                              <div className='flex items-center gap-3'>
                                 <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center'>
                                    <Palette
                                       size={24}
                                       className='text-primary'
                                    />
                                 </div>
                                 <div>
                                    <h2 className='text-xl font-semibold text-foreground'>Cài đặt chung</h2>
                                    <p className='text-sm text-muted-foreground'>Tùy chỉnh giao diện và ngôn ngữ</p>
                                 </div>
                              </div>
                           </div>

                           {/* Theme Settings */}
                           <div>
                              <SectionHeader
                                 title='Giao diện'
                                 subtitle='Chọn theme phù hợp với bạn'
                              />
                              <div className='p-4'>
                                 <div className='grid grid-cols-2 gap-3'>
                                    <button
                                       onClick={() => setTheme('light')}
                                       className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                                          theme === 'light'
                                             ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                                             : 'border-border hover:border-primary/50'
                                       }`}
                                    >
                                       <div className='flex flex-col items-center gap-3'>
                                          <div
                                             className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                                theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                             }`}
                                          >
                                             <Sun
                                                size={28}
                                                className={theme === 'light' ? '' : 'text-muted-foreground'}
                                             />
                                          </div>
                                          <div className='text-center'>
                                             <p className='font-semibold text-foreground'>Sáng</p>
                                             <p className='text-xs text-muted-foreground'>Dễ nhìn ban ngày</p>
                                          </div>
                                       </div>
                                       {theme === 'light' && (
                                          <div className='absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center'>
                                             <CheckCircle2
                                                size={14}
                                                className='text-white'
                                             />
                                          </div>
                                       )}
                                    </button>
                                    <button
                                       onClick={() => setTheme('dark')}
                                       className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
                                          theme === 'dark'
                                             ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                                             : 'border-border hover:border-primary/50'
                                       }`}
                                    >
                                       <div className='flex flex-col items-center gap-3'>
                                          <div
                                             className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                                theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                             }`}
                                          >
                                             <Moon
                                                size={28}
                                                className={theme === 'dark' ? '' : 'text-muted-foreground'}
                                             />
                                          </div>
                                          <div className='text-center'>
                                             <p className='font-semibold text-foreground'>Tối</p>
                                             <p className='text-xs text-muted-foreground'>Dễ nhìn ban đêm</p>
                                          </div>
                                       </div>
                                       {theme === 'dark' && (
                                          <div className='absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center'>
                                             <CheckCircle2
                                                size={14}
                                                className='text-white'
                                             />
                                          </div>
                                       )}
                                    </button>
                                 </div>
                              </div>
                           </div>

                           {/* Language Settings */}
                           <div>
                              <SectionHeader title='Ngôn ngữ & Khu vực' />
                              <div className='p-2'>
                                 <SettingItem
                                    icon={Globe}
                                    title='Ngôn ngữ hiển thị'
                                    description={language === 'vi' ? 'Tiếng Việt' : 'English'}
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <select
                                          value={language}
                                          onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
                                          className='px-4 py-2 border border-border rounded-xl bg-muted/50 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50'
                                       >
                                          <option value='vi'>🇻🇳 Tiếng Việt</option>
                                          <option value='en'>🇺🇸 English</option>
                                       </select>
                                    }
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'account' && (
                        <div className='divide-y divide-border/50'>
                           {/* Header */}
                           <div className='p-6 bg-muted/30'>
                              <div className='flex items-center gap-3'>
                                 <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center'>
                                    <User
                                       size={24}
                                       className='text-primary'
                                    />
                                 </div>
                                 <div>
                                    <h2 className='text-xl font-semibold text-foreground'>Thông tin tài khoản</h2>
                                    <p className='text-sm text-muted-foreground'>Quản lý thông tin cá nhân của bạn</p>
                                 </div>
                              </div>
                           </div>

                           {/* Profile Section */}
                           <div className='p-6'>
                              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
                                 <div className='relative group'>
                                    <div className='w-24 h-24 rounded-3xl overflow-hidden ring-4 ring-primary/10 shadow-xl'>
                                       {profile?.avatar || user?.avatar ? (
                                          <img
                                             src={profile?.avatar || user?.avatar}
                                             alt={profile?.displayName || user?.displayName || 'Avatar'}
                                             className='w-full h-full object-cover'
                                          />
                                       ) : (
                                          <div className='w-full h-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-3xl'>
                                             {(
                                                profile?.displayName ||
                                                user?.displayName ||
                                                profile?.username ||
                                                user?.username ||
                                                'U'
                                             )
                                                .charAt(0)
                                                .toUpperCase()}
                                          </div>
                                       )}
                                    </div>
                                    <button
                                       onClick={() => setShowEditProfileModal(true)}
                                       className='absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'
                                    >
                                       <Camera
                                          size={24}
                                          className='text-white'
                                       />
                                    </button>
                                 </div>
                                 <div className='flex-1'>
                                    <h3 className='text-2xl font-bold text-foreground'>
                                       {profile?.displayName ||
                                          user?.displayName ||
                                          profile?.username ||
                                          user?.username}
                                    </h3>
                                    <p className='text-muted-foreground'>@{profile?.username || user?.username}</p>
                                    {(profile?.bio || user?.bio) && (
                                       <p className='text-sm text-muted-foreground mt-2 italic max-w-md'>
                                          "{profile?.bio || user?.bio}"
                                       </p>
                                    )}
                                    <button
                                       onClick={() => setShowEditProfileModal(true)}
                                       className='mt-4 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-300 flex items-center gap-2'
                                    >
                                       <Edit size={16} />
                                       Chỉnh sửa hồ sơ
                                    </button>
                                 </div>
                              </div>
                           </div>

                           {/* Account Details */}
                           <div>
                              <SectionHeader title='Chi tiết tài khoản' />
                              <div className='p-2 space-y-1'>
                                 <SettingItem
                                    icon={User}
                                    title='Tên hiển thị'
                                    description={profile?.displayName || user?.displayName || 'Chưa có tên hiển thị'}
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                 />
                                 <SettingItem
                                    icon={User}
                                    title='Tên người dùng'
                                    description={'@' + (profile?.username || user?.username || 'username')}
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                 />
                                 <SettingItem
                                    icon={Mail}
                                    title='Email'
                                    description={profile?.email || user?.email || 'Chưa có email'}
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                 />
                                 <SettingItem
                                    icon={Smartphone}
                                    title='Ngày sinh'
                                    description={
                                       profile?.dateOfBirth || user?.dateOfBirth
                                          ? new Date(
                                               profile?.dateOfBirth || user?.dateOfBirth || ''
                                            ).toLocaleDateString('vi-VN')
                                          : 'Chưa cập nhật'
                                    }
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                 />
                              </div>
                           </div>

                           {/* Quick Actions */}
                           <div>
                              <SectionHeader title='Hành động nhanh' />
                              <div className='p-2 space-y-1'>
                                 <SettingItem
                                    icon={Lock}
                                    title='Đổi mật khẩu'
                                    description='Cập nhật mật khẩu của bạn'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    onClick={() => {}}
                                 />
                                 <SettingItem
                                    icon={Mail}
                                    title='Xác thực email'
                                    description='Xác thực địa chỉ email của bạn'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    onClick={() => {}}
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'notifications' && (
                        <div className='divide-y divide-border/50'>
                           {/* Header */}
                           <div className='p-6 bg-muted/30'>
                              <div className='flex items-center gap-3'>
                                 <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center'>
                                    <Bell
                                       size={24}
                                       className='text-primary'
                                    />
                                 </div>
                                 <div>
                                    <h2 className='text-xl font-semibold text-foreground'>Cài đặt thông báo</h2>
                                    <p className='text-sm text-muted-foreground'>Tùy chỉnh cách bạn nhận thông báo</p>
                                 </div>
                              </div>
                           </div>

                           {/* Push Notifications */}
                           <div>
                              <SectionHeader title='Thông báo chung' />
                              <div className='p-2 space-y-1'>
                                 <SettingItem
                                    icon={Smartphone}
                                    title='Thông báo push'
                                    description='Nhận thông báo trên thiết bị'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={notifications.push}
                                          onChange={() => setNotifications((prev) => ({ ...prev, push: !prev.push }))}
                                       />
                                    }
                                 />
                                 <SettingItem
                                    icon={Mail}
                                    title='Thông báo email'
                                    description='Nhận email về các hoạt động quan trọng'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={notifications.email}
                                          onChange={() => setNotifications((prev) => ({ ...prev, email: !prev.email }))}
                                       />
                                    }
                                 />
                              </div>
                           </div>

                           {/* Social Notifications */}
                           <div>
                              <SectionHeader title='Thông báo hoạt động' />
                              <div className='p-2 space-y-1'>
                                 <SettingItem
                                    icon={MessageSquare}
                                    title='Bình luận'
                                    description='Khi có người bình luận bài viết của bạn'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={notifications.comments}
                                          onChange={() =>
                                             setNotifications((prev) => ({ ...prev, comments: !prev.comments }))
                                          }
                                       />
                                    }
                                 />
                                 <SettingItem
                                    icon={Heart}
                                    title='Lượt thích'
                                    description='Khi có người thích bài viết của bạn'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={notifications.likes}
                                          onChange={() => setNotifications((prev) => ({ ...prev, likes: !prev.likes }))}
                                       />
                                    }
                                 />
                                 <SettingItem
                                    icon={UserPlus}
                                    title='Theo dõi mới'
                                    description='Khi có người bắt đầu theo dõi bạn'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={notifications.follows}
                                          onChange={() =>
                                             setNotifications((prev) => ({ ...prev, follows: !prev.follows }))
                                          }
                                       />
                                    }
                                 />
                                 <SettingItem
                                    icon={MessageSquare}
                                    title='Tin nhắn'
                                    description='Khi có tin nhắn mới'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={notifications.messages}
                                          onChange={() =>
                                             setNotifications((prev) => ({ ...prev, messages: !prev.messages }))
                                          }
                                       />
                                    }
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                    

                     {activeTab === 'privacy' && (
                        <div className='divide-y divide-border/50'>
                           {/* Header */}
                           <div className='p-6 bg-muted/30'>
                              <div className='flex items-center gap-3'>
                                 <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center'>
                                    <Shield
                                       size={24}
                                       className='text-primary'
                                    />
                                 </div>
                                 <div>
                                    <h2 className='text-xl font-semibold text-foreground'>Quyền riêng tư & Bảo mật</h2>
                                    <p className='text-sm text-muted-foreground'>
                                       Kiểm soát ai có thể xem nội dung của bạn
                                    </p>
                                 </div>
                              </div>
                           </div>

                           {/* Privacy Settings */}
                           <div>
                              <SectionHeader title='Quyền riêng tư tài khoản' />
                              <div className='p-2 space-y-1'>
                                 <SettingItem
                                    icon={Lock}
                                    title='Tài khoản riêng tư'
                                    description='Chỉ người theo dõi mới xem được bài viết'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={privacy.privateAccount}
                                          onChange={() =>
                                             setPrivacy((prev) => ({ ...prev, privateAccount: !prev.privateAccount }))
                                          }
                                       />
                                    }
                                 />
                                 <SettingItem
                                    icon={Eye}
                                    title='Hiển thị trạng thái online'
                                    description='Cho phép người khác biết khi bạn online'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={privacy.showOnlineStatus}
                                          onChange={() =>
                                             setPrivacy((prev) => ({
                                                ...prev,
                                                showOnlineStatus: !prev.showOnlineStatus,
                                             }))
                                          }
                                       />
                                    }
                                 />
                                 <SettingItem
                                    icon={Mail}
                                    title='Tìm kiếm bằng email'
                                    description='Người khác có thể tìm bạn qua email'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={privacy.allowEmailSearch}
                                          onChange={() =>
                                             setPrivacy((prev) => ({
                                                ...prev,
                                                allowEmailSearch: !prev.allowEmailSearch,
                                             }))
                                          }
                                       />
                                    }
                                 />
                              </div>
                           </div>

                           {/* Security Settings */}
                           <div>
                              <SectionHeader title='Bảo mật' />
                              <div className='p-2 space-y-1'>
                                 <SettingItem
                                    icon={Shield}
                                    title='Xác thực hai yếu tố'
                                    description='Thêm lớp bảo mật cho tài khoản'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    rightElement={
                                       <ToggleSwitch
                                          enabled={privacy.twoFactor}
                                          onChange={() =>
                                             setPrivacy((prev) => ({ ...prev, twoFactor: !prev.twoFactor }))
                                          }
                                       />
                                    }
                                 />
                                 <SettingItem
                                    icon={Lock}
                                    title='Phiên đăng nhập'
                                    description='Quản lý các thiết bị đã đăng nhập'
                                    iconBg='bg-muted'
                                    iconColor='text-muted-foreground'
                                    onClick={() => {}}
                                 />
                              </div>
                           </div>

                           {/* Danger Zone */}
                           <div>
                              <SectionHeader
                                 title='Vùng nguy hiểm'
                                 subtitle='Những hành động này không thể hoàn tác'
                              />
                              <div className='p-4'>
                                 <div className='p-4 rounded-2xl border-2 border-red-500/20 bg-red-500/5'>
                                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                                       <div>
                                          <h4 className='font-semibold text-red-500'>Xóa tài khoản</h4>
                                          <p className='text-sm text-muted-foreground mt-1'>
                                             Tất cả dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục
                                          </p>
                                       </div>
                                       <button className='px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap'>
                                          <LogOut size={16} />
                                          Xóa tài khoản
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Edit Profile Modal */}
         <EditProfileModal
            isOpen={showEditProfileModal}
            onClose={() => setShowEditProfileModal(false)}
            onSuccess={() => {
               window.location.reload();
            }}
         />

         {/* Logout Confirmation Modal */}
         {showLogoutConfirm && (
            <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
               <div className='card-liquid-glass max-w-md w-full p-6 animate-in fade-in zoom-in duration-200'>
                  <div className='flex flex-col items-center text-center gap-4'>
                     <div className='w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center'>
                        <LogOut
                           size={32}
                           className='text-red-500'
                        />
                     </div>
                     <div>
                        <h3 className='text-xl font-semibold text-foreground mb-2'>Xác nhận đăng xuất</h3>
                        <p className='text-muted-foreground'>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?</p>
                     </div>
                     <div className='flex gap-3 w-full mt-2'>
                        <button
                           onClick={() => setShowLogoutConfirm(false)}
                           className='flex-1 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-all duration-200'
                        >
                           Hủy
                        </button>
                        <button
                           onClick={confirmLogout}
                           className='flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2'
                        >
                           <LogOut size={16} />
                           Đăng xuất
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default SettingsPage;
