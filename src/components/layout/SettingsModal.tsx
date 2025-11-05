import { useState } from 'react';
import { X, Moon, Sun, Globe, Palette, User, Bell, Shield, LogOut } from 'lucide-react';
import { useThemeStore, useAuthStore } from '@/store';

interface SettingsModalProps {
   isOpen: boolean;
   onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
   const { theme, language, setTheme, setLanguage } = useThemeStore();
   const { user, logout } = useAuthStore();
   const [activeTab, setActiveTab] = useState('general');

   if (!isOpen) return null;

   const handleLogout = () => {
      logout();
      onClose();
   };

   const tabs = [
      { id: 'general', label: 'Chung', icon: Palette },
      { id: 'account', label: 'Tài khoản', icon: User },
      { id: 'notifications', label: 'Thông báo', icon: Bell },
      { id: 'privacy', label: 'Quyền riêng tư', icon: Shield },
   ];

   return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
         <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden'>
            <div className='flex h-full'>
               {/* Sidebar */}
               <div className='w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700'>
                  <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
                     <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Cài đặt</h2>
                  </div>
                  <nav className='p-2'>
                     {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                           <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                 activeTab === tab.id
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                           >
                              <IconComponent size={20} />
                              <span>{tab.label}</span>
                           </button>
                        );
                     })}
                     <hr className='my-4 border-gray-200 dark:border-gray-700' />
                     <button
                        onClick={handleLogout}
                        className='w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
                     >
                        <LogOut size={20} />
                        <span>Đăng xuất</span>
                     </button>
                  </nav>
               </div>

               {/* Content */}
               <div className='flex-1 flex flex-col'>
                  {/* Header */}
                  <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
                     <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
                        {tabs.find((tab) => tab.id === activeTab)?.label}
                     </h3>
                     <button
                        onClick={onClose}
                        className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors'
                     >
                        <X
                           size={20}
                           className='text-gray-500 dark:text-gray-400'
                        />
                     </button>
                  </div>

                  {/* Content Area */}
                  <div className='flex-1 p-6 overflow-y-auto'>
                     {activeTab === 'general' && (
                        <div className='space-y-6'>
                           {/* Theme Settings */}
                           <div>
                              <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Giao diện</h4>
                              <div className='space-y-4'>
                                 <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                       {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                                       <div>
                                          <p className='text-gray-900 dark:text-white font-medium'>Chế độ tối</p>
                                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                                             Chuyển đổi giữa chế độ sáng và tối
                                          </p>
                                       </div>
                                    </div>
                                    <div className='flex space-x-2'>
                                       <button
                                          onClick={() => setTheme('light')}
                                          className={`p-2 rounded-lg border transition-colors ${
                                             theme === 'light'
                                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                          }`}
                                       >
                                          <Sun size={16} />
                                       </button>
                                       <button
                                          onClick={() => setTheme('dark')}
                                          className={`p-2 rounded-lg border transition-colors ${
                                             theme === 'dark'
                                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                          }`}
                                       >
                                          <Moon size={16} />
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Language Settings */}
                           <div>
                              <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Ngôn ngữ</h4>
                              <div className='space-y-4'>
                                 <div className='flex items-center justify-between'>
                                    <div className='flex items-center space-x-3'>
                                       <Globe size={20} />
                                       <div>
                                          <p className='text-gray-900 dark:text-white font-medium'>Ngôn ngữ hiển thị</p>
                                          <p className='text-sm text-gray-500 dark:text-gray-400'>
                                             Chọn ngôn ngữ cho ứng dụng
                                          </p>
                                       </div>
                                    </div>
                                    <select
                                       value={language}
                                       onChange={(e) => setLanguage(e.target.value as 'vi' | 'en')}
                                       className='px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                    >
                                       <option value='vi'>Tiếng Việt</option>
                                       <option value='en'>English</option>
                                    </select>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'account' && (
                        <div className='space-y-6'>
                           <div>
                              <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                                 Thông tin tài khoản
                              </h4>
                              <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4'>
                                 <div className='flex items-center space-x-4'>
                                    <div className='w-16 h-16 rounded-full bg-gray-200 overflow-hidden'>
                                       {user?.avatar ? (
                                          <img
                                             src={user.avatar}
                                             alt={user.displayName || user.username}
                                             className='w-full h-full object-cover'
                                          />
                                       ) : (
                                          <div className='w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-xl'>
                                             {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                                          </div>
                                       )}
                                    </div>
                                    <div>
                                       <h3 className='font-semibold text-gray-900 dark:text-white'>
                                          {user?.displayName || user?.username}
                                       </h3>
                                       <p className='text-gray-500 dark:text-gray-400'>@{user?.username}</p>
                                       <p className='text-sm text-gray-500 dark:text-gray-400'>{user?.email}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'notifications' && (
                        <div className='space-y-6'>
                           <div>
                              <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                                 Cài đặt thông báo
                              </h4>
                              <div className='space-y-4'>
                                 <div className='flex items-center justify-between'>
                                    <div>
                                       <p className='text-gray-900 dark:text-white font-medium'>Thông báo push</p>
                                       <p className='text-sm text-gray-500 dark:text-gray-400'>
                                          Nhận thông báo về hoạt động mới
                                       </p>
                                    </div>
                                    <label className='relative inline-flex items-center cursor-pointer'>
                                       <input
                                          type='checkbox'
                                          className='sr-only peer'
                                          defaultChecked
                                       />
                                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'privacy' && (
                        <div className='space-y-6'>
                           <div>
                              <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Quyền riêng tư</h4>
                              <div className='space-y-4'>
                                 <div className='flex items-center justify-between'>
                                    <div>
                                       <p className='text-gray-900 dark:text-white font-medium'>Tài khoản riêng tư</p>
                                       <p className='text-sm text-gray-500 dark:text-gray-400'>
                                          Chỉ những người bạn theo dõi mới có thể xem bài viết của bạn
                                       </p>
                                    </div>
                                    <label className='relative inline-flex items-center cursor-pointer'>
                                       <input
                                          type='checkbox'
                                          className='sr-only peer'
                                       />
                                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
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

export default SettingsModal;
