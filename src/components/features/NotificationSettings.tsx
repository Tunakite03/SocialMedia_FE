import React, { useState, useEffect } from 'react';
import {
   Bell,
   Volume2,
   VolumeX,
   TestTube,
   Check,
   X,
   Wifi,
   WifiOff,
   Settings,
   Smartphone,
   Monitor,
   Headphones,
} from 'lucide-react';
import { useSocketNotification } from '@/components/providers/SocketNotificationProvider';
import { notificationSoundService } from '@/services';

interface NotificationSettingsProps {
   className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ className = '' }) => {
   const { connectionStatus, onlineUsers } = useSocketNotification();

   const [browserNotifications, setBrowserNotifications] = useState(false);
   const [soundEnabled, setSoundEnabled] = useState(true);
   const [soundVolume, setSoundVolume] = useState(0.3);
   const [testingSound, setTestingSound] = useState(false);
   const [testingBrowser, setTestingBrowser] = useState(false);

   // Check current notification permissions and sound settings
   useEffect(() => {
      if ('Notification' in window) {
         setBrowserNotifications(Notification.permission === 'granted');
      }
      setSoundEnabled(notificationSoundService.getEnabled());
      setSoundVolume(notificationSoundService.getVolume());
   }, []);

   // Handle browser notification permission
   const handleBrowserNotificationToggle = async () => {
      if (!('Notification' in window)) {
         alert('This browser does not support desktop notifications');
         return;
      }

      if (Notification.permission === 'granted') {
         // Cannot revoke permission programmatically
         alert('Browser notifications are enabled. To disable them, please go to your browser settings.');
         return;
      }

      if (Notification.permission === 'denied') {
         alert('Browser notifications are blocked. Please enable them in your browser settings.');
         return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      setBrowserNotifications(permission === 'granted');
   };

   // Handle sound settings
   const handleSoundToggle = () => {
      const newEnabled = !soundEnabled;
      setSoundEnabled(newEnabled);
      notificationSoundService.setEnabled(newEnabled);
   };

   const handleVolumeChange = (volume: number) => {
      setSoundVolume(volume);
      notificationSoundService.setVolume(volume);
   };

   // Test functions
   const testBrowserNotification = async () => {
      if (!browserNotifications) {
         alert('Browser notifications are not enabled');
         return;
      }

      setTestingBrowser(true);
      try {
         new Notification('Test Notification', {
            body: 'This is a test notification from OnWay',
            icon: '/images/logo.png',
            tag: 'test-notification',
         });
      } catch (error) {
         console.error('Failed to show test notification:', error);
      } finally {
         setTimeout(() => setTestingBrowser(false), 1000);
      }
   };

   const testNotificationSound = async () => {
      setTestingSound(true);
      try {
         await notificationSoundService.testSound();
      } catch (error) {
         console.error('Failed to play test sound:', error);
      } finally {
         setTimeout(() => setTestingSound(false), 1000);
      }
   };

   const getConnectionStatusColor = () => {
      switch (connectionStatus) {
         case 'connected':
            return 'text-green-500';
         case 'connecting':
            return 'text-yellow-500';
         case 'error':
            return 'text-red-500';
         default:
            return 'text-gray-500';
      }
   };

   const getConnectionStatusIcon = () => {
      switch (connectionStatus) {
         case 'connected':
            return <Wifi className='h-5 w-5' />;
         case 'connecting':
            return <Wifi className='h-5 w-5 animate-pulse' />;
         case 'error':
            return <WifiOff className='h-5 w-5' />;
         default:
            return <WifiOff className='h-5 w-5' />;
      }
   };

   return (
      <div className={`space-y-6 ${className}`}>
         {/* Header */}
         <div className='flex items-center gap-3 pb-4 border-b border-border'>
            <Bell className='h-6 w-6 text-primary' />
            <div>
               <h2 className='text-xl font-semibold text-foreground font-anime'>Notification Settings</h2>
               <p className='text-sm text-muted-foreground'>Manage how you receive notifications</p>
            </div>
         </div>

         {/* Real-time Connection Status */}
         <div className='card-liquid-glass p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
               <div className='flex items-center gap-3'>
                  {getConnectionStatusIcon()}
                  <div>
                     <h3 className='font-medium text-foreground'>Real-time Connection</h3>
                     <p className={`text-sm ${getConnectionStatusColor()}`}>
                        {connectionStatus === 'connected' && 'Connected - receiving live notifications'}
                        {connectionStatus === 'connecting' && 'Connecting to notification server...'}
                        {connectionStatus === 'error' && 'Connection failed - notifications may be delayed'}
                        {connectionStatus === 'disconnected' && 'Disconnected - no real-time notifications'}
                     </p>
                  </div>
               </div>

               <div className='text-right'>
                  <div className='text-sm text-muted-foreground'>Online Users</div>
                  <div className='text-lg font-semibold text-primary'>{onlineUsers.length}</div>
               </div>
            </div>

            {connectionStatus !== 'connected' && (
               <div className='mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md'>
                  <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                     Real-time notifications are not available. You'll still receive notifications when you refresh the
                     page.
                  </p>
               </div>
            )}
         </div>

         {/* Browser Notifications */}
         <div className='card-liquid-glass p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
               <div className='flex items-center gap-3'>
                  <Monitor className='h-5 w-5 text-muted-foreground' />
                  <div>
                     <h3 className='font-medium text-foreground'>Browser Notifications</h3>
                     <p className='text-sm text-muted-foreground'>Show notifications in your browser</p>
                  </div>
               </div>

               <div className='flex items-center gap-3'>
                  <button
                     onClick={testBrowserNotification}
                     disabled={!browserNotifications || testingBrowser}
                     className='btn-anime-secondary btn-sm flex items-center gap-2'
                  >
                     {testingBrowser ? <Check className='h-4 w-4 text-green-500' /> : <TestTube className='h-4 w-4' />}
                     Test
                  </button>

                  <button
                     onClick={handleBrowserNotificationToggle}
                     className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        browserNotifications ? 'bg-primary' : 'bg-gray-200'
                     }`}
                  >
                     <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                           browserNotifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                     />
                  </button>
               </div>
            </div>

            <div className='text-xs text-muted-foreground'>
               {Notification.permission === 'denied' && (
                  <div className='flex items-center gap-2 text-red-500'>
                     <X className='h-3 w-3' />
                     Notifications are blocked in browser settings
                  </div>
               )}
               {Notification.permission === 'granted' && (
                  <div className='flex items-center gap-2 text-green-500'>
                     <Check className='h-3 w-3' />
                     Permission granted
                  </div>
               )}
               {Notification.permission === 'default' && (
                  <div className='flex items-center gap-2 text-yellow-500'>
                     <Settings className='h-3 w-3' />
                     Click toggle to request permission
                  </div>
               )}
            </div>
         </div>

         {/* Sound Notifications */}
         <div className='card-liquid-glass p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-4'>
               <div className='flex items-center gap-3'>
                  <Headphones className='h-5 w-5 text-muted-foreground' />
                  <div>
                     <h3 className='font-medium text-foreground'>Sound Notifications</h3>
                     <p className='text-sm text-muted-foreground'>Play sounds when you receive notifications</p>
                  </div>
               </div>

               <div className='flex items-center gap-3'>
                  <button
                     onClick={testNotificationSound}
                     disabled={!soundEnabled || testingSound}
                     className='btn-anime-secondary btn-sm flex items-center gap-2'
                  >
                     {testingSound ? <Check className='h-4 w-4 text-green-500' /> : <TestTube className='h-4 w-4' />}
                     Test
                  </button>

                  <button
                     onClick={handleSoundToggle}
                     className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        soundEnabled ? 'bg-primary' : 'bg-gray-200'
                     }`}
                  >
                     <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                           soundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                     />
                  </button>
               </div>
            </div>

            {/* Volume Control */}
            {soundEnabled && (
               <div className='mt-4'>
                  <div className='flex items-center gap-3 mb-2'>
                     <VolumeX className='h-4 w-4 text-muted-foreground' />
                     <input
                        type='range'
                        min='0'
                        max='1'
                        step='0.1'
                        value={soundVolume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className='flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
                     />
                     <Volume2 className='h-4 w-4 text-muted-foreground' />
                  </div>
                  <div className='text-xs text-muted-foreground text-center'>
                     Volume: {Math.round(soundVolume * 100)}%
                  </div>
               </div>
            )}
         </div>

         {/* Notification Types */}
         <div className='card-liquid-glass p-4 rounded-lg'>
            <h3 className='font-medium text-foreground mb-4'>Notification Types</h3>

            <div className='space-y-3'>
               {[
                  { type: 'LIKE', label: 'Likes', description: 'When someone likes your post' },
                  { type: 'COMMENT', label: 'Comments', description: 'When someone comments on your post' },
                  { type: 'FOLLOW', label: 'Follows', description: 'When someone follows you' },
                  { type: 'MESSAGE', label: 'Messages', description: 'When you receive a message' },
                  { type: 'CALL', label: 'Calls', description: 'When someone calls you' },
                  { type: 'MENTION', label: 'Mentions', description: 'When someone mentions you' },
               ].map((item) => (
                  <div
                     key={item.type}
                     className='flex items-center justify-between py-2 border-b border-border last:border-b-0'
                  >
                     <div>
                        <div className='font-medium text-foreground'>{item.label}</div>
                        <div className='text-sm text-muted-foreground'>{item.description}</div>
                     </div>

                     <button className='relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'>
                        <span className='pointer-events-none inline-block h-5 w-5 translate-x-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out' />
                     </button>
                  </div>
               ))}
            </div>
         </div>

         {/* Additional Info */}
         <div className='card-liquid-glass-blue p-4 rounded-lg'>
            <div className='flex items-start gap-3'>
               <Smartphone className='h-5 w-5 text-blue-500 mt-0.5' />
               <div>
                  <h4 className='font-medium text-foreground mb-1'>Mobile App Notifications</h4>
                  <p className='text-sm text-muted-foreground'>
                     Install our mobile app for push notifications even when the browser is closed.
                  </p>
                  <button className='mt-2 btn-anime-primary btn-sm'>Download App</button>
               </div>
            </div>
         </div>
      </div>
   );
};
