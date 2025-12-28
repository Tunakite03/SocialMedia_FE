import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallStore } from '@/store';
import { useCallManager } from '@/hooks/useCallManager';
import { webRTCService } from '@/services/webRTCService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
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
   Loader2,
   FileText,
   MoreVertical,
   Shield,
} from 'lucide-react';
import { IncomingCallNotification } from '@/components/features/call/IncomingCallNotification';
import { CallTranscript } from '@/components/features/call/CallTranscript';
import { CALL_ACCEPTANCE_TIMEOUT } from '@/config';
import type { User } from '@/types';

// Connection quality badge
const ConnectionBadge = ({ quality }: { quality: 'excellent' | 'good' | 'poor' | 'disconnected' }) => {
   const config = {
      excellent: {
         icon: Signal,
         color: 'text-emerald-400',
         bg: 'bg-emerald-500/10',
         border: 'border-emerald-500/20',
         label: 'Excellent',
      },
      good: {
         icon: Wifi,
         color: 'text-amber-400',
         bg: 'bg-amber-500/10',
         border: 'border-amber-500/20',
         label: 'Good',
      },
      poor: { icon: WifiOff, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Poor' },
      disconnected: {
         icon: WifiOff,
         color: 'text-gray-400',
         bg: 'bg-gray-500/10',
         border: 'border-gray-500/20',
         label: 'Disconnected',
      },
   };

   const { icon: Icon, color, bg, border, label } = config[quality];

   return (
      <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border', bg, border)}>
         <Icon className={cn('w-3 h-3', color)} />
         <span className={cn('text-[11px] font-semibold', color)}>{label}</span>
      </div>
   );
};

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
   const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
   const [callDuration, setCallDuration] = useState(0);
   const [timeoutCountdown, setTimeoutCountdown] = useState<number | null>(null);
   const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>(
      'excellent'
   );
   const [showControls, setShowControls] = useState(true);
   const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));

   const audioRef = useRef<HTMLAudioElement>(null);
   const callingRingtoneRef = useRef<HTMLAudioElement | null>(null);
   const intervalRef = useRef<number | null>(null);
   const countdownIntervalRef = useRef<number | null>(null);
   const controlsTimeoutRef = useRef<number | null>(null);
   const audioAnimationRef = useRef<number | null>(null);

   // Auto-hide controls
   const resetControlsTimeout = useCallback(() => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
         clearTimeout(controlsTimeoutRef.current);
      }
      if (isCallAccepted && callType === 'video') {
         controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
      }
   }, [isCallAccepted, callType]);

   // Animate audio waveform
   useEffect(() => {
      if (isCallAccepted && isAudioEnabled) {
         const animate = () => {
            setAudioLevels((prev) => prev.map((_, i) => Math.abs(Math.sin(Date.now() / 200 + i * 0.5)) * 100));
            audioAnimationRef.current = requestAnimationFrame(animate);
         };
         animate();
         return () => {
            if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
         };
      } else {
         setAudioLevels(Array(20).fill(0));
      }
   }, [isCallAccepted, isAudioEnabled]);

   // Call duration timer
   useEffect(() => {
      if (isCallAccepted && callStartTime) {
         intervalRef.current = setInterval(() => {
            const now = new Date();
            const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
            setCallDuration(duration);
         }, 1000);
      } else {
         if (intervalRef.current) clearInterval(intervalRef.current);
         setCallDuration(0);
      }
      return () => {
         if (intervalRef.current) clearInterval(intervalRef.current);
      };
   }, [isCallAccepted, callStartTime]);

   // Timeout countdown
   useEffect(() => {
      if (isConnecting && !isCallAccepted) {
         const startTime = Date.now();
         const timeoutDuration = CALL_ACCEPTANCE_TIMEOUT / 1000;
         setTimeoutCountdown(timeoutDuration);

         countdownIntervalRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = timeoutDuration - elapsed;
            if (remaining <= 0) {
               setTimeoutCountdown(0);
               if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current);
               }
            } else {
               setTimeoutCountdown(remaining);
            }
         }, 1000);
      } else {
         if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
         }
         setTimeoutCountdown(null);
      }
      return () => {
         if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      };
   }, [isConnecting, isCallAccepted]);

   // Calling ringtone
   useEffect(() => {
      if (!callingRingtoneRef.current) {
         callingRingtoneRef.current = new Audio('/sounds/phone-calling.mp3');
         callingRingtoneRef.current.loop = true;
         callingRingtoneRef.current.volume = 0.5;
      }

      const ringtone = callingRingtoneRef.current;
      if (isConnecting && !isCallAccepted && !hasIncomingCall) {
         ringtone.currentTime = 0;
         ringtone.play().catch((error) => {
            if (error.name !== 'AbortError') console.error('Failed to play ringtone:', error);
         });
      } else {
         ringtone.pause();
         ringtone.currentTime = 0;
      }
      return () => {
         if (ringtone) {
            ringtone.pause();
            ringtone.currentTime = 0;
         }
      };
   }, [isConnecting, isCallAccepted, hasIncomingCall]);

   // Simulate connection quality
   useEffect(() => {
      if (isCallAccepted) {
         const interval = setInterval(() => {
            const qualities = ['excellent', 'good', 'poor'] as const;
            setConnectionQuality(qualities[Math.floor(Math.random() * qualities.length)]);
         }, 5000);
         return () => clearInterval(interval);
      }
   }, [isCallAccepted]);

   useEffect(() => {
      if (!isInCall && !hasIncomingCall) navigate('/chat');
   }, [isInCall, hasIncomingCall, navigate]);

   const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   };

   const handleEndCall = () => {
      endCurrentCall();
      navigate('/chat');
   };

   const handleToggleAudio = () => {
      webRTCService.toggleAudio();
      setIsAudioEnabled(webRTCService.isAudioEnabled());
   };

   const handleToggleVideo = () => {
      webRTCService.toggleVideo();
      setIsVideoEnabled(webRTCService.isVideoEnabled());
   };

   const handleToggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);
   const handleToggleFullscreen = () => setIsFullscreen(!isFullscreen);
   const handleToggleTranscript = () => setIsTranscriptVisible(!isTranscriptVisible);

   const getDisplayUser = (): User | null => {
      if (hasIncomingCall && incomingCall) return incomingCall.caller;
      return receiver || null;
   };

   const displayUser = getDisplayUser();

   if (!displayUser) {
      return (
         <div className='min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-gray-950 flex items-center justify-center'>
            <Loader2 className='w-8 h-8 text-blue-400 animate-spin' />
         </div>
      );
   }

   return (
      <div
         className='min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-gray-950 flex flex-col relative overflow-hidden'
         onMouseMove={resetControlsTimeout}
         onClick={resetControlsTimeout}
      >
         {/* Background orbs */}
         <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            <div
               className='absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'
               style={{ animationDuration: '4s' }}
            />
            <div
               className='absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse'
               style={{ animationDuration: '5s', animationDelay: '1s' }}
            />
            <div
               className='absolute top-1/2 left-1/2 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl animate-pulse'
               style={{ animationDuration: '6s', animationDelay: '2s' }}
            />
         </div>

         <audio
            ref={audioRef}
            autoPlay
         />

         <IncomingCallNotification
            caller={displayUser}
            callType={incomingCall?.type || 'audio'}
            onAccept={acceptIncomingCall}
            onReject={rejectIncomingCall}
            isVisible={hasIncomingCall && !isCallAccepted}
         />

         <CallTranscript
            isVisible={isTranscriptVisible && isCallAccepted}
            isAudioEnabled={isAudioEnabled}
            onClose={() => setIsTranscriptVisible(false)}
         />

         {/* Top bar */}
         <div
            className={cn(
               'absolute top-0 left-0 right-0 z-20 px-6 py-4 transition-all duration-300',
               showControls || !isCallAccepted ? 'opacity-100' : 'opacity-0'
            )}
         >
            <div className='flex items-center justify-between'>
               <div className='flex items-center gap-3'>
                  <ConnectionBadge quality={connectionQuality} />
               </div>

               {isCallAccepted && (
                  <div className='flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10'>
                     <div className='w-2 h-2 rounded-full bg-red-500 animate-pulse' />
                     <span className='text-white font-mono text-sm font-semibold'>{formatDuration(callDuration)}</span>
                  </div>
               )}

               <div className='flex items-center gap-3'>
                  <div
                     className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border',
                        callType === 'video'
                           ? 'bg-blue-500/10 border-blue-500/20'
                           : 'bg-emerald-500/10 border-emerald-500/20'
                     )}
                  >
                     {callType === 'video' ? (
                        <Video className='w-3 h-3 text-blue-400' />
                     ) : (
                        <Phone className='w-3 h-3 text-emerald-400' />
                     )}
                     <span
                        className={cn(
                           'text-[11px] font-semibold',
                           callType === 'video' ? 'text-blue-400' : 'text-emerald-400'
                        )}
                     >
                        {callType === 'video' ? 'Video Call' : 'Voice Call'}
                     </span>
                  </div>
                  {isCallAccepted && (
                     <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-0'
                     >
                        <MoreVertical className='w-4 h-4' />
                     </Button>
                  )}
               </div>
            </div>
         </div>

         {/* Main content */}
         <div className='flex-1 flex items-center justify-center px-4 pt-20 pb-32'>
            {/* Connecting state */}
            {isConnecting && !isCallAccepted && (
               <div className='w-full max-w-sm mx-auto'>
                  <div className='relative bg-slate-900/60 backdrop-blur-2xl rounded-4xl border border-slate-700/50 p-8 shadow-2xl'>
                     {/* Avatar with pulse rings */}
                     <div className='relative mb-6 flex justify-center'>
                        <div className='absolute inset-0 flex items-center justify-center'>
                           <div
                              className='w-32 h-32 rounded-full border-2 border-blue-400/30 animate-ping'
                              style={{ animationDuration: '2s' }}
                           />
                        </div>
                        <div className='absolute inset-0 flex items-center justify-center'>
                           <div
                              className='w-36 h-36 rounded-full border border-blue-400/20 animate-ping'
                              style={{ animationDuration: '2.5s' }}
                           />
                        </div>
                        <Avatar className='h-28 w-28 ring-4 ring-white/10 shadow-2xl relative z-10'>
                           <AvatarImage
                              src={displayUser.avatar || ''}
                              className='object-cover'
                           />
                           <AvatarFallback className='text-3xl bg-linear-to-br from-blue-600 to-cyan-600 text-white font-bold'>
                              {(displayUser.displayName || displayUser.username).slice(0, 2).toUpperCase()}
                           </AvatarFallback>
                        </Avatar>
                        <div
                           className={cn(
                              'absolute -bottom-2 left-1/2 -translate-x-1/2 p-2.5 rounded-full shadow-lg',
                              callType === 'video' ? 'bg-blue-600' : 'bg-cyan-600'
                           )}
                        >
                           {callType === 'video' ? (
                              <Video className='w-4 h-4 text-white' />
                           ) : (
                              <Phone className='w-4 h-4 text-white' />
                           )}
                        </div>
                     </div>

                     <h1 className='text-2xl font-bold text-white text-center mb-1'>
                        {displayUser.displayName || displayUser.username}
                     </h1>
                     <p className='text-white/40 text-center text-sm mb-6'>@{displayUser.username}</p>

                     <div className='flex items-center justify-center gap-1 mb-2'>
                        {[0, 1, 2].map((i) => (
                           <div
                              key={i}
                              className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce'
                              style={{ animationDelay: `${i * 0.15}s` }}
                           />
                        ))}
                     </div>
                     <p className='text-white/60 text-center text-sm mb-6'>Calling...</p>

                     {timeoutCountdown !== null && timeoutCountdown > 0 && (
                        <div className='flex justify-center'>
                           <div className='relative inline-flex'>
                              <svg
                                 className='w-20 h-20 transform -rotate-90'
                                 viewBox='0 0 120 120'
                              >
                                 <circle
                                    cx='60'
                                    cy='60'
                                    r='54'
                                    stroke='currentColor'
                                    strokeWidth='4'
                                    fill='none'
                                    className='text-white/10'
                                 />
                                 <circle
                                    cx='60'
                                    cy='60'
                                    r='54'
                                    stroke={timeoutCountdown <= 10 ? '#ef4444' : '#3b82f6'}
                                    strokeWidth='4'
                                    fill='none'
                                    strokeLinecap='round'
                                    className='transition-all duration-1000'
                                    style={{
                                       strokeDasharray: 2 * Math.PI * 54,
                                       strokeDashoffset:
                                          2 * Math.PI * 54 * (1 - timeoutCountdown / (CALL_ACCEPTANCE_TIMEOUT / 1000)),
                                    }}
                                 />
                              </svg>
                              <span
                                 className={cn(
                                    'absolute inset-0 flex items-center justify-center text-xl font-bold',
                                    timeoutCountdown <= 10 ? 'text-red-400' : 'text-white/80'
                                 )}
                              >
                                 {timeoutCountdown}s
                              </span>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* Error state */}
            {errorMessage && !isConnecting && (
               <div className='w-full max-w-sm mx-auto'>
                  <div className='bg-slate-900/70 backdrop-blur-2xl rounded-4xl border border-red-500/30 p-8 text-center'>
                     <div className='w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center'>
                        <PhoneOff className='w-8 h-8 text-red-400' />
                     </div>
                     <h1 className='text-2xl font-bold text-white mb-2'>Call Failed</h1>
                     <p className='text-red-300/80 mb-6'>{errorMessage}</p>
                     <Button
                        onClick={handleEndCall}
                        className='bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-8 py-2 rounded-full'
                     >
                        Close
                     </Button>
                  </div>
               </div>
            )}

            {/* Active call */}
            {isCallAccepted && (
               <div className={cn('w-full h-full', isFullscreen ? 'fixed inset-0 z-50' : '')}>
                  {/* Video call */}
                  {remoteStream && callType === 'video' && (
                     <div className='w-full h-full relative'>
                        <video
                           autoPlay
                           playsInline
                           className='w-full h-full object-cover'
                           ref={(video) => {
                              if (video && remoteStream) video.srcObject = remoteStream;
                           }}
                        />
                        <div className='absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/20 pointer-events-none' />

                        {remoteStream && (
                           <audio
                              autoPlay
                              ref={(audio) => {
                                 if (audio && remoteStream) audio.srcObject = remoteStream;
                              }}
                           />
                        )}

                        {/* Local video PiP */}
                        {localStream && isVideoEnabled && (
                           <div className='absolute top-20 right-6 w-40 aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20'>
                              <video
                                 autoPlay
                                 playsInline
                                 muted
                                 className='w-full h-full object-cover'
                                 ref={(video) => {
                                    if (video && localStream) video.srcObject = localStream;
                                 }}
                              />
                              <div className='absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm'>
                                 <span className='text-white text-[10px] font-medium'>You</span>
                              </div>
                           </div>
                        )}

                        {localStream && !isVideoEnabled && (
                           <div className='absolute top-20 right-6 w-40 aspect-video rounded-2xl bg-slate-900/90 border-2 border-white/10 flex items-center justify-center'>
                              <VideoOff className='w-6 h-6 text-white/40' />
                           </div>
                        )}

                        <Button
                           onClick={handleToggleFullscreen}
                           className={cn(
                              'absolute top-20 right-52 h-10 w-10 rounded-xl bg-black/30 hover:bg-black/50 text-white border border-white/10 transition-opacity',
                              showControls ? 'opacity-100' : 'opacity-0'
                           )}
                        >
                           {isFullscreen ? <Minimize2 className='w-4 h-4' /> : <Maximize2 className='w-4 h-4' />}
                        </Button>
                     </div>
                  )}

                  {/* Audio call */}
                  {callType === 'audio' && (
                     <div className='w-full max-w-md mx-auto'>
                        <div className='bg-slate-900/60 backdrop-blur-2xl rounded-[28px] border border-slate-700/50 p-8 shadow-2xl'>
                           <div className='relative mb-8 flex justify-center'>
                              <div
                                 className='absolute inset-0 flex items-center justify-center'
                                 style={{
                                    filter: `blur(20px)`,
                                    opacity: isAudioEnabled ? 0.6 : 0.2,
                                 }}
                              >
                                 <div className='w-40 h-40 rounded-full bg-linear-to-r from-blue-500 via-cyan-500 to-blue-600' />
                              </div>

                              <Avatar className='h-32 w-32 ring-4 ring-white/10 shadow-2xl relative z-10'>
                                 <AvatarImage
                                    src={displayUser.avatar || ''}
                                    className='object-cover'
                                 />
                                 <AvatarFallback className='text-5xl bg-linear-to-br from-blue-600 to-cyan-600 text-white font-bold'>
                                    {(displayUser.displayName || displayUser.username).slice(0, 2).toUpperCase()}
                                 </AvatarFallback>
                              </Avatar>

                              <div className='absolute -bottom-1 right-1/2 translate-x-12'>
                                 <div className='w-5 h-5 rounded-full bg-emerald-500 border-4 border-slate-900 shadow-lg' />
                              </div>
                           </div>

                           <h1 className='text-2xl font-bold text-white text-center mb-1'>
                              {displayUser.displayName || displayUser.username}
                           </h1>
                           <p className='text-white/40 text-center text-sm mb-8'>@{displayUser.username}</p>

                           {/* Waveform */}
                           <div className='flex items-center justify-center gap-0.5 h-12 mb-4'>
                              {audioLevels.map((level, i) => (
                                 <div
                                    key={i}
                                    className='w-1 rounded-full bg-linear-to-t from-blue-500 via-cyan-400 to-blue-600 transition-all duration-75'
                                    style={{
                                       height: isAudioEnabled ? `${(level / 100) * 40 + 4}px` : '4px',
                                       opacity: isAudioEnabled ? 0.8 : 0.3,
                                    }}
                                 />
                              ))}
                           </div>

                           <div className='flex items-center justify-center gap-2 text-cyan-400'>
                              <Phone className='w-3.5 h-3.5' />
                              <span className='text-sm font-medium'>Voice call in progress</span>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}
         </div>

         {/* Bottom controls */}
         {(isCallAccepted || isConnecting) && (
            <div
               className={cn(
                  'absolute bottom-0 left-0 right-0 z-20 pb-8 pt-16 bg-linear-to-t from-black/60 via-black/30 to-transparent transition-opacity duration-300',
                  showControls || !isCallAccepted ? 'opacity-100' : 'opacity-0'
               )}
            >
               <div className='flex items-center justify-center gap-4'>
                  {/* Mute */}
                  <div className='flex flex-col items-center gap-2'>
                     <Button
                        onClick={handleToggleAudio}
                        className={cn(
                           'h-14 w-14 rounded-full transition-all duration-200',
                           !isAudioEnabled
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                              : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/10'
                        )}
                     >
                        {isAudioEnabled ? <Mic className='w-5 h-5' /> : <MicOff className='w-5 h-5' />}
                     </Button>
                     <span className='text-xs text-white/70 font-medium'>Mute</span>
                  </div>

                  {/* Video */}
                  {callType === 'video' && (
                     <div className='flex flex-col items-center gap-2'>
                        <Button
                           onClick={handleToggleVideo}
                           className={cn(
                              'h-14 w-14 rounded-full transition-all duration-200',
                              !isVideoEnabled
                                 ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                                 : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/10'
                           )}
                        >
                           {isVideoEnabled ? <Video className='w-5 h-5' /> : <VideoOff className='w-5 h-5' />}
                        </Button>
                        <span className='text-xs text-white/70 font-medium'>Video</span>
                     </div>
                  )}

                  {/* Speaker */}
                  <div className='flex flex-col items-center gap-2'>
                     <Button
                        onClick={handleToggleSpeaker}
                        className={cn(
                           'h-14 w-14 rounded-full transition-all duration-200',
                           isSpeakerOn
                              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/10'
                        )}
                     >
                        {isSpeakerOn ? <Volume2 className='w-5 h-5' /> : <VolumeX className='w-5 h-5' />}
                     </Button>
                     <span className='text-xs text-white/70 font-medium'>Speaker Off</span>
                  </div>

                  {/* End call */}
                  <div className='flex flex-col items-center gap-2'>
                     <Button
                        onClick={handleEndCall}
                        className='h-16 w-16 rounded-full bg-linear-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-xl shadow-red-500/40 transition-all'
                     >
                        <PhoneOff className='w-6 h-6' />
                     </Button>
                     <span className='text-xs text-white/70 font-medium'>End Call</span>
                  </div>

                  {/* Transcript */}
                  {isCallAccepted && (
                     <div className='flex flex-col items-center gap-2'>
                        <Button
                           onClick={handleToggleTranscript}
                           className={cn(
                              'h-14 w-14 rounded-full transition-all duration-200',
                              isTranscriptVisible
                                 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                 : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/10'
                           )}
                        >
                           <FileText className='w-5 h-5' />
                        </Button>
                        <span className='text-xs text-white/70 font-medium'>Transcript</span>
                     </div>
                  )}

                  {/* More */}
                  <div className='flex flex-col items-center gap-2'>
                     <Button className='h-14 w-14 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/10'>
                        <MoreVertical className='w-5 h-5' />
                     </Button>
                     <span className='text-xs text-white/70 font-medium'>More</span>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default CallPage;
