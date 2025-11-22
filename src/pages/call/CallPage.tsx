import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallStore } from '@/store';
import { useCallManager } from '@/hooks/useCallManager';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
   Mic,
   MicOff,
   Video,
   VideoOff,
   PhoneOff,
   Phone,
   Volume2,
   VolumeX,
   Maximize2,
   Minimize2,
   Signal,
   Wifi,
   WifiOff,
} from 'lucide-react';
import { IncomingCallNotification } from '@/components/features/call/IncomingCallNotification';
import type { User } from '@/types';

const CallPage = () => {
   const navigate = useNavigate();
   const {
      isInCall,
      callType,
      receiver,
      localStream,
      remoteStream,
      isCallAccepted,
      isConnecting,
      errorMessage,
      callStartTime,
   } = useCallStore();
   const { endCurrentCall, hasIncomingCall, incomingCall, acceptIncomingCall, rejectIncomingCall } = useCallManager();

   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
   const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
   const [isFullscreen, setIsFullscreen] = useState(false);
   const [isSpeakerOn, setIsSpeakerOn] = useState(false);
   const [callDuration, setCallDuration] = useState(0);
   const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>(
      'excellent'
   );

   const audioRef = useRef<HTMLAudioElement>(null);
   const intervalRef = useRef<number | null>(null);

   // Call duration timer
   useEffect(() => {
      if (isCallAccepted && callStartTime) {
         intervalRef.current = setInterval(() => {
            const now = new Date();
            const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
            setCallDuration(duration);
         }, 1000);
      } else {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
         setCallDuration(0);
      }

      return () => {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
         }
      };
   }, [isCallAccepted, callStartTime]);

   // Ringtone and sound effects
   useEffect(() => {
      // Ringtone is now handled by IncomingCallNotification component
   }, [hasIncomingCall, isCallAccepted]);

   // Simulate connection quality (in real app, this would be based on WebRTC stats)
   useEffect(() => {
      if (isCallAccepted) {
         const interval = setInterval(() => {
            const qualities = ['excellent', 'good', 'poor'] as const;
            const randomQuality = qualities[Math.floor(Math.random() * qualities.length)];
            setConnectionQuality(randomQuality);
         }, 5000);

         return () => clearInterval(interval);
      }
   }, [isCallAccepted]);

   useEffect(() => {
      if (!isInCall && !hasIncomingCall) {
         navigate('/chat');
      }
   }, [isInCall, hasIncomingCall, navigate]);

   const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   };

   const handleEndCall = () => {
      // Ringtone is handled by IncomingCallNotification component
      endCurrentCall();
      navigate('/chat');
   };

   const handleToggleAudio = () => {
      if (localStream) {
         const audioTrack = localStream.getAudioTracks()[0];
         if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioEnabled(audioTrack.enabled);
         }
      }
   };

   const handleToggleVideo = () => {
      if (localStream) {
         const videoTrack = localStream.getVideoTracks()[0];
         if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(videoTrack.enabled);
         }
      }
   };

   const handleToggleSpeaker = () => {
      setIsSpeakerOn(!isSpeakerOn);
      if (audioRef.current) {
         (audioRef.current as any).setSinkId = isSpeakerOn ? 'default' : 'speaker';
      }
   };

   const handleToggleFullscreen = () => {
      setIsFullscreen(!isFullscreen);
   };

   const getDisplayUser = (): User | null => {
      if (hasIncomingCall && incomingCall) {
         return incomingCall.caller;
      }
      return receiver || null;
   };

   const displayUser = getDisplayUser();

   const getConnectionIcon = () => {
      switch (connectionQuality) {
         case 'excellent':
            return <Signal className='w-4 h-4 text-green-400' />;
         case 'good':
            return <Wifi className='w-4 h-4 text-yellow-400' />;
         case 'poor':
            return <WifiOff className='w-4 h-4 text-red-400' />;
         case 'disconnected':
            return <WifiOff className='w-4 h-4 text-gray-400' />;
         default:
            return <Signal className='w-4 h-4 text-green-400' />;
      }
   };

   if (!displayUser) {
      return (
         <div className='h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center'>
            <div className='card-liquid-glass p-8 text-center anime-pulse'>
               <div className='animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4'></div>
               <p className='text-white font-anime text-lg'>Initializing call...</p>
            </div>
         </div>
      );
   }

   return (
      <div className='h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden'>
         {/* Animated background particles */}
         <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            <div className='absolute -top-4 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse'></div>
            <div className='absolute -bottom-8 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000'></div>
            <div className='absolute top-1/2 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000'></div>
         </div>

         {/* Audio elements */}
         <audio
            ref={audioRef}
            autoPlay
         />

         {/* Incoming Call Notification */}
         <IncomingCallNotification
            caller={displayUser}
            callType={incomingCall?.type || 'audio'}
            onAccept={acceptIncomingCall}
            onReject={rejectIncomingCall}
            isVisible={hasIncomingCall && !isCallAccepted}
         />

         {/* Status Bar */}
         <div className='absolute top-4 left-4 right-4 z-20'>
            <div className='flex justify-between items-center'>
               {/* Connection indicator */}
               <div className='card-liquid-glass px-3 py-2 flex items-center gap-2'>
                  {getConnectionIcon()}
                  <span className='text-white text-sm font-anime capitalize'>{connectionQuality}</span>
               </div>

               {/* Call duration */}
               {isCallAccepted && (
                  <div className='card-liquid-glass px-4 py-2'>
                     <span className='text-white font-mono text-sm'>{formatDuration(callDuration)}</span>
                  </div>
               )}

               {/* Call type indicator */}
               <div className='card-liquid-glass px-3 py-2 flex items-center gap-2'>
                  {callType === 'video' ? (
                     <Video className='w-4 h-4 text-blue-400' />
                  ) : (
                     <Phone className='w-4 h-4 text-green-400' />
                  )}
                  <span className='text-white text-sm font-anime'>{callType === 'video' ? 'Video' : 'Voice'}</span>
               </div>
            </div>
         </div>

         {/* Main content */}
         <div className='flex-1 flex items-center justify-center relative z-10'>
            {/* Connecting state */}
            {isConnecting && (
               <div className='text-center anime-slide-in-bottom'>
                  <div className='card-liquid-glass p-8 max-w-md mx-auto'>
                     <div className='relative mb-6'>
                        <Avatar className='h-24 w-24 mx-auto ring-4 ring-purple-400/30 anime-pulse'>
                           <AvatarImage
                              src={displayUser.avatar || ''}
                              alt={displayUser.displayName || displayUser.username}
                           />
                           <AvatarFallback className='text-2xl bg-linear-to-br from-purple-500 to-pink-500 text-white'>
                              {(displayUser.displayName || displayUser.username).slice(0, 2).toUpperCase()}
                           </AvatarFallback>
                        </Avatar>
                        <div className='absolute -bottom-1 -right-1 w-8 h-8 bg-linear-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center anime-bounce'>
                           <Phone className='w-4 h-4 text-white' />
                        </div>
                     </div>
                     <h1 className='text-2xl font-anime font-semibold mb-2 text-white'>
                        Calling {displayUser.displayName || displayUser.username}
                     </h1>
                     <div className='flex items-center justify-center gap-2 mb-4'>
                        <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse'></div>
                        <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200'></div>
                        <div className='w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-400'></div>
                     </div>
                     <p className='text-purple-200 font-anime'>Connecting...</p>
                  </div>
               </div>
            )}

            {/* Active call state */}
            {isCallAccepted && (
               <div className={`w-full h-full relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
                  {/* Remote Video */}
                  {remoteStream && callType === 'video' && (
                     <div className='w-full h-full relative group'>
                        <video
                           autoPlay
                           playsInline
                           className='w-full h-full object-cover rounded-lg'
                           ref={(video) => {
                              if (video && remoteStream) {
                                 video.srcObject = remoteStream;
                              }
                           }}
                        />

                        {/* Video overlay info */}
                        <div className='absolute top-4 left-4 card-liquid-glass px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                           <span className='text-white text-sm font-anime'>
                              {displayUser.displayName || displayUser.username}
                           </span>
                        </div>

                        {/* Fullscreen toggle */}
                        <Button
                           onClick={handleToggleFullscreen}
                           variant='ghost'
                           size='icon'
                           className='absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 hover:bg-black/50 text-white'
                        >
                           {isFullscreen ? <Minimize2 className='w-5 h-5' /> : <Maximize2 className='w-5 h-5' />}
                        </Button>
                     </div>
                  )}

                  {/* Hidden Audio Element */}
                  {remoteStream && (
                     <audio
                        autoPlay
                        ref={(audio) => {
                           if (audio && remoteStream) {
                              audio.srcObject = remoteStream;
                           }
                        }}
                     />
                  )}

                  {/* Local Video (Picture-in-Picture) */}
                  {localStream && callType === 'video' && isVideoEnabled && (
                     <div className='absolute top-6 right-6 w-40 h-32 group'>
                        <video
                           autoPlay
                           playsInline
                           muted
                           className='w-full h-full object-cover rounded-xl border-2 border-white/30 shadow-xl'
                           ref={(video) => {
                              if (video && localStream) {
                                 video.srcObject = localStream;
                              }
                           }}
                        />
                        <div className='absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                           <div className='bg-black/50 rounded-full px-2 py-1'>You</div>
                        </div>
                     </div>
                  )}

                  {/* Audio Call UI */}
                  {callType === 'audio' && (
                     <div className='text-center anime-slide-in-bottom'>
                        <div className='card-liquid-glass p-8 max-w-lg mx-auto'>
                           <div className='relative mb-8'>
                              <Avatar className='h-40 w-40 mx-auto ring-8 ring-purple-400/30'>
                                 <AvatarImage
                                    src={displayUser.avatar || ''}
                                    alt={displayUser.displayName || displayUser.username}
                                 />
                                 <AvatarFallback className='text-6xl bg-linear-to-br from-purple-500 to-pink-500 text-white'>
                                    {(displayUser.displayName || displayUser.username).slice(0, 2).toUpperCase()}
                                 </AvatarFallback>
                              </Avatar>

                              {/* Audio visualization */}
                              <div className='absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1'>
                                 {[...Array(5)].map((_, i) => (
                                    <div
                                       key={i}
                                       className={`w-1 bg-linear-to-t from-green-400 to-blue-500 rounded-full animate-pulse`}
                                       style={{
                                          height: `${Math.random() * 16 + 8}px`,
                                          animationDelay: `${i * 0.1}s`,
                                       }}
                                    />
                                 ))}
                              </div>
                           </div>
                           <h1 className='text-3xl font-anime font-bold mb-3 text-white'>
                              {displayUser.displayName || displayUser.username}
                           </h1>
                           <p className='text-purple-200 font-anime text-lg'>📞 Voice call active</p>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* Error Message */}
            {errorMessage && (
               <div className='absolute top-20 left-1/2 transform -translate-x-1/2 z-30 anime-shake'>
                  <div className='bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-lg border border-red-400/30'>
                     <p className='font-anime'>{errorMessage}</p>
                  </div>
               </div>
            )}
         </div>

         {/* Call Controls */}
         {(isCallAccepted || isConnecting) && (
            <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20'>
               <div className='card-liquid-glass px-6 py-4 flex items-center gap-4'>
                  {/* Audio toggle */}
                  <Button
                     onClick={handleToggleAudio}
                     size='lg'
                     className={`rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift ${
                        isAudioEnabled
                           ? 'bg-white/20 hover:bg-white/30 text-white'
                           : 'bg-red-500/80 hover:bg-red-600/90 text-white'
                     }`}
                  >
                     {isAudioEnabled ? <Mic className='h-6 w-6' /> : <MicOff className='h-6 w-6' />}
                  </Button>

                  {/* Video toggle (only for video calls) */}
                  {callType === 'video' && (
                     <Button
                        onClick={handleToggleVideo}
                        size='lg'
                        className={`rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift ${
                           isVideoEnabled
                              ? 'bg-white/20 hover:bg-white/30 text-white'
                              : 'bg-red-500/80 hover:bg-red-600/90 text-white'
                        }`}
                     >
                        {isVideoEnabled ? <Video className='h-6 w-6' /> : <VideoOff className='h-6 w-6' />}
                     </Button>
                  )}

                  {/* Speaker toggle */}
                  <Button
                     onClick={handleToggleSpeaker}
                     size='lg'
                     className={`rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift ${
                        isSpeakerOn
                           ? 'bg-blue-500/80 hover:bg-blue-600/90 text-white'
                           : 'bg-white/20 hover:bg-white/30 text-white'
                     }`}
                  >
                     {isSpeakerOn ? <Volume2 className='h-6 w-6' /> : <VolumeX className='h-6 w-6' />}
                  </Button>

                  {/* End call */}
                  <Button
                     onClick={handleEndCall}
                     size='lg'
                     className='rounded-full h-14 w-14 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 anime-hover-lift shadow-lg hover:shadow-xl'
                  >
                     <PhoneOff className='h-6 w-6' />
                  </Button>
               </div>
            </div>
         )}
      </div>
   );
};

export default CallPage;
