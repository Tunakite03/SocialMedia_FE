import { useState } from 'react';
import { Moon, Sun, Globe, Palette, User, Bell, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore, useAuthStore } from '@/store';

const SettingsPage = () => {
   const { theme, language, setTheme, setLanguage } = useThemeStore();
   const { user } = useAuthStore();
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState('general');

   const tabs = [
      { id: 'general', label: 'Chung', icon: Palette, description: 'Giao diện và ngôn ngữ' },
      { id: 'account', label: 'Tài khoản', icon: User, description: 'Thông tin cá nhân' },
      { id: 'notifications', label: 'Thông báo', icon: Bell, description: 'Cài đặt thông báo' },
      { id: 'privacy', label: 'Quyền riêng tư', icon: Shield, description: 'Bảo mật và riêng tư' },
   ];

   return (
      <div className='min-h-screen bg-background'>
         {/* Header */}
         <div className='bg-card border-b border-border'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
               <div className='flex items-center justify-between h-16'>
                  <div className='flex items-center space-x-4'>
                     <div
                        onClick={() => navigate(-1)}
                        className='p-2 hover:bg-muted rounded-full transition-colors'
                     >
                        <ArrowLeft
                           size={20}
                           className='text-muted-foreground'
                        />
                     </div>
                     <h1 className='text-2xl font-bold text-foreground'>Settings</h1>
                  </div>
               </div>
            </div>
         </div>

         <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='lg:grid lg:grid-cols-12 lg:gap-x-8'>
               {/* Sidebar */}
               <div className='lg:col-span-3 '>
                  <nav className='space-y-1 liquid-glass rounded-lg shadow p-4'>
                     {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                           <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`w-full flex items-start space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                 activeTab === tab.id
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:bg-muted'
                              }`}
                           >
                              <IconComponent
                                 size={20}
                                 className={activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}
                              />
                              <div>
                                 <p className='font-medium'>{tab.label}</p>
                                 <p className='text-sm text-muted-foreground'>{tab.description}</p>
                              </div>
                           </button>
                        );
                     })}
                  </nav>
               </div>

               {/* Content */}
               <div className='mt-8 lg:mt-0 lg:col-span-9 '>
                  <div className='liquid-glass shadow rounded-lg'>
                     {/* Tab Content */}
                     {activeTab === 'general' && (
                        <div className='p-6'>
                           <h2 className='text-xl font-semibold text-foreground mb-6'>Cài đặt chung</h2>

                           {/* Theme Settings */}
                           <div className='space-y-6'>
                              <div className='border-b border-border pb-6'>
                                 <h3 className='text-lg font-medium text-foreground mb-4'>Giao diện</h3>
                                 <div className='space-y-4'>
                                    <div className='flex items-center justify-between'>
                                       <div className='flex items-center space-x-3'>
                                          {theme === 'light' ? (
                                             <Sun
                                                size={20}
                                                className='text-yellow-500'
                                             />
                                          ) : (
                                             <Moon
                                                size={20}
                                                className='text-blue-500'
                                             />
                                          )}
                                          <div>
                                             <p className='text-foreground font-medium'>Chế độ hiển thị</p>
                                             <p className='text-sm text-muted-foreground'>
                                                Chọn giao diện sáng hoặc tối
                                             </p>
                                          </div>
                                       </div>
                                       <div className='flex space-x-2'>
                                          <button
                                             onClick={() => setTheme('light')}
                                             className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                                                theme === 'light'
                                                   ? 'bg-primary/10 border-primary/30 text-primary'
                                                   : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                                             }`}
                                          >
                                             <Sun size={16} />
                                             <span>Sáng</span>
                                          </button>
                                          <button
                                             onClick={() => setTheme('dark')}
                                             className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                                                theme === 'dark'
                                                   ? 'bg-primary/10 border-primary/30 text-primary'
                                                   : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                                             }`}
                                          >
                                             <Moon size={16} />
                                             <span>Tối</span>
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Language Settings */}
                              <div>
                                 <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Ngôn ngữ</h3>
                                 <div className='space-y-4'>
                                    <div className='flex items-center justify-between'>
                                       <div className='flex items-center space-x-3'>
                                          <Globe
                                             size={20}
                                             className='text-green-500'
                                          />
                                          <div>
                                             <p className='text-foreground font-medium'>Ngôn ngữ hiển thị</p>
                                             <p className='text-sm text-muted-foreground'>
                                                Chọn ngôn ngữ cho giao diện ứng dụng
                                             </p>
                                          </div>
                                       </div>
                                       <select
                                          value={language}
                                          onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
                                          className='px-4 py-2 border border-border rounded-lg bg-background text-foreground'
                                       >
                                          <option value='vi'>Tiếng Việt</option>
                                          <option value='en'>English</option>
                                       </select>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'account' && (
                        <div className='p-6'>
                           <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-6'>
                              Thông tin tài khoản
                           </h2>
                           <div className='space-y-6'>
                              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-6'>
                                 <div className='flex items-center space-x-6'>
                                    <div className='w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden'>
                                       {user?.avatar ? (
                                          <img
                                             src={user.avatar}
                                             alt={user.displayName || user.username}
                                             className='w-full h-full object-cover'
                                          />
                                       ) : (
                                          <div className='w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-2xl'>
                                             {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                                          </div>
                                       )}
                                    </div>
                                    <div className='flex-1'>
                                       <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                                          {user?.displayName || user?.username}
                                       </h3>
                                       <p className='text-gray-600 dark:text-gray-400'>@{user?.username}</p>
                                       <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>{user?.email}</p>
                                       <button className='mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'>
                                          Chỉnh sửa hồ sơ
                                       </button>
                                    </div>
                                 </div>
                              </div>

                              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                 <div className='space-y-2'>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                       Tên hiển thị
                                    </label>
                                    <input
                                       type='text'
                                       value={user?.displayName || ''}
                                       className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                       placeholder='Nhập tên hiển thị'
                                    />
                                 </div>
                                 <div className='space-y-2'>
                                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                                       Tên người dùng
                                    </label>
                                    <input
                                       type='text'
                                       value={user?.username || ''}
                                       className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                       placeholder='Nhập tên người dùng'
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'notifications' && (
                        <div className='p-6'>
                           <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-6'>
                              Cài đặt thông báo
                           </h2>
                           <div className='space-y-6'>
                              {[
                                 {
                                    title: 'Thông báo push',
                                    description: 'Nhận thông báo về hoạt động mới trên điện thoại',
                                    enabled: true,
                                 },
                                 {
                                    title: 'Thông báo email',
                                    description: 'Nhận thông báo qua email về các hoạt động quan trọng',
                                    enabled: false,
                                 },
                                 {
                                    title: 'Thông báo bình luận',
                                    description: 'Thông báo khi có người bình luận bài viết của bạn',
                                    enabled: true,
                                 },
                                 {
                                    title: 'Thông báo theo dõi',
                                    description: 'Thông báo khi có người theo dõi bạn',
                                    enabled: true,
                                 },
                              ].map((notification, index) => (
                                 <div
                                    key={index}
                                    className='flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0'
                                 >
                                    <div>
                                       <p className='text-gray-900 dark:text-white font-medium'>{notification.title}</p>
                                       <p className='text-sm text-gray-500 dark:text-gray-400'>
                                          {notification.description}
                                       </p>
                                    </div>
                                    <label className='relative inline-flex items-center cursor-pointer'>
                                       <input
                                          type='checkbox'
                                          className='sr-only peer'
                                          defaultChecked={notification.enabled}
                                       />
                                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     {activeTab === 'privacy' && (
                        <div className='p-6'>
                           <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-6'>
                              Quyền riêng tư & Bảo mật
                           </h2>
                           <div className='space-y-6'>
                              {[
                                 {
                                    title: 'Tài khoản riêng tư',
                                    description: 'Chỉ những người bạn theo dõi mới có thể xem bài viết của bạn',
                                    enabled: false,
                                 },
                                 {
                                    title: 'Hiển thị trạng thái online',
                                    description: 'Cho phép người khác biết khi bạn đang online',
                                    enabled: true,
                                 },
                                 {
                                    title: 'Cho phép tìm kiếm bằng email',
                                    description: 'Người khác có thể tìm thấy bạn bằng địa chỉ email',
                                    enabled: false,
                                 },
                                 {
                                    title: 'Xác thực hai yếu tố',
                                    description: 'Thêm lớp bảo mật cho tài khoản của bạn',
                                    enabled: false,
                                 },
                              ].map((privacy, index) => (
                                 <div
                                    key={index}
                                    className='flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0'
                                 >
                                    <div>
                                       <p className='text-gray-900 dark:text-white font-medium'>{privacy.title}</p>
                                       <p className='text-sm text-gray-500 dark:text-gray-400'>{privacy.description}</p>
                                    </div>
                                    <label className='relative inline-flex items-center cursor-pointer'>
                                       <input
                                          type='checkbox'
                                          className='sr-only peer'
                                          defaultChecked={privacy.enabled}
                                       />
                                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                 </div>
                              ))}

                              <div className='pt-6 border-t border-gray-200 dark:border-gray-700'>
                                 <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                                    Vùng nguy hiểm
                                 </h3>
                                 <div className='space-y-4'>
                                    <button className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'>
                                       Xóa tài khoản
                                    </button>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                       Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default SettingsPage;
