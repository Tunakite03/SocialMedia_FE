# Otakomi Frontend 🚀

A modern, real-time communication platform built with React, TypeScript, TailwindCSS, and WebRTC.

## 📋 Overview

Otakomi is a comprehensive frontend application that provides real-time messaging, video/audio calling, and emotion analysis features. Built with modern web technologies for optimal performance and user experience.

## 🏗️ Architecture

### Frontend Stack

-  **ReactJS** - Component-based UI framework
-  **TypeScript** - Type-safe development
-  **TailwindCSS** - Utility-first CSS framework with custom 60%-30%-10% color scheme
-  **Vite** - Fast build tool and development server
-  **Zustand** - Lightweight state management
-  **React Router** - Client-side routing
-  **Shadcn/ui** - Modern component library

### Real-time Communication

-  **Socket.IO Client** - Real-time bidirectional communication
-  **WebRTC** - Peer-to-peer video/audio calling
-  **Emotion Analysis** - Real-time emotion detection during calls

### Key Features

-  🔐 **Authentication** - Login/Register with JWT tokens
-  💬 **Real-time Chat** - Instant messaging with typing indicators
-  📞 **Voice/Video Calls** - WebRTC-powered communication
-  😊 **Emotion Analysis** - AI-powered emotion detection
-  📱 **Responsive Design** - Mobile-first approach
-  🎨 **Modern UI** - Clean, accessible interface

## 🎨 Design System

The application follows a **60%-30%-10% color scheme**:

-  **60% Primary** - Light blue-gray backgrounds and main content areas
-  **30% Secondary** - Deep blue for navigation and supporting elements
-  **10% Accent** - Warm orange for highlights, CTAs, and important actions

## 🚀 Quick Start

### Prerequisites

-  Node.js 18+
-  npm or yarn
-  Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Otakomi_FE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── layout/         # Layout components (RouteGuards, etc.)
│   └── features/       # Feature-specific components
├── pages/              # Page components
│   ├── auth/           # Login, Register pages
│   ├── dashboard/      # Main dashboard
│   ├── chat/           # Chat interface
│   ├── profile/        # User profiles
│   └── error/          # Error pages
├── services/           # API and external services
│   ├── apiService.ts   # HTTP client
│   ├── authService.ts  # Authentication
│   ├── socketService.ts # Real-time communication
│   └── webRTCService.ts # Video/audio calls
├── store/              # Zustand state management
│   ├── authStore.ts    # Authentication state
│   ├── chatStore.ts    # Chat messages & rooms
│   ├── callStore.ts    # Call state management
│   └── notificationStore.ts # Notifications
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── router/             # Route configuration
```

## 🛠️ Available Scripts

-  `npm run dev` - Start development server
-  `npm run build` - Build for production
-  `npm run preview` - Preview production build
-  `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Application Configuration
VITE_APP_NAME=Otakomi
VITE_APP_VERSION=1.0.0

# WebRTC Configuration
VITE_STUN_SERVERS=stun:stun.l.google.com:19302

# Feature Flags
VITE_ENABLE_EMOTION_ANALYSIS=true
VITE_ENABLE_CALL_RECORDING=true
VITE_ENABLE_FACE_DETECTION=true
```

## 🎯 Core Features Implementation

### Authentication Flow

1. User enters credentials on login/register page
2. Frontend sends HTTPS request to backend API
3. On success, JWT token is stored and user is redirected
4. Socket.IO connection is established with the token
5. Protected routes require authentication

### Real-time Communication

1. Socket.IO maintains persistent connection with backend
2. Events: messages, calls, notifications, user status
3. WebRTC handles direct peer-to-peer media streaming
4. Emotion analysis processes video frames in real-time

### State Management

-  **Zustand stores** handle global application state
-  **Authentication state** persisted in localStorage
-  **Chat state** manages messages and typing indicators
-  **Call state** tracks ongoing calls and media streams

## 🔌 Integration Points

### Backend API

-  RESTful endpoints for CRUD operations
-  JWT authentication middleware
-  File upload handling
-  User management

### Socket.IO Events

-  `user:connect/disconnect` - User presence
-  `message:new/read` - Chat messages
-  `call:offer/answer/ice-candidate` - WebRTC signaling
-  `notification:new` - Real-time notifications

### WebRTC Signaling

-  Offer/Answer exchange through Socket.IO
-  ICE candidate sharing
-  Media stream management
-  Call state synchronization

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run E2E tests (when implemented)
npm run test:e2e
```

## 📦 Build and Deployment

### Development Build

```bash
npm run build
npm run preview
```

### Production Deployment

The application is configured for deployment on:

-  **Netlify** (included `netlify.toml`)
-  **Vercel**
-  **Static hosting services**

Build artifacts are generated in the `dist/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

-  Create an issue in the repository
-  Contact the development team
-  Check the documentation

---

Built with ❤️ using modern web technologies
