import { Bell, Home, MessageCircle, PlusSquare, Search, User } from 'lucide-react';

export const navItems = [
   {
      icon: Home,
      label: 'Home',
      path: '/feed',
      activeKey: '/feed',
   },
   {
      icon: Search,
      label: 'Search',
      path: '/search',
      activeKey: '/search',
   },
   {
      icon: PlusSquare,
      label: 'Posts',
      path: '/create',
      activeKey: '/create',
   },
   {
      icon: Bell,
      label: 'Notifications',
      path: '/activity',
      activeKey: '/activity',
   },
   {
      icon: MessageCircle,
      label: 'Messages',
      path: '/chat',
      activeKey: '/chat',
   },
   {
      icon: User,
      label: 'Profile',
      path: '/profile',
      activeKey: '/profile',
   },
];
