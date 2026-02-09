import { useEffect, useRef, useState, useCallback } from 'react';
import { livekitService } from '@/services/livekitService';
import { socketService } from '@/services/socketService';
import { Track, ConnectionQuality, type RemoteParticipant } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
   Mic,
   MicOff,
   Video,
   VideoOff,
   PhoneOff,
   Signal,
   Wifi,
   WifiOff,
   Loader2,
   Users,
   Clock,
   Maximize2,
   Minimize2,
   MessageSquare,
} from 'lucide-react';
import type { User } from '@/types';
import { RealTimeTranscriptionPanel } from './RealTimeTranscriptionPanel';
import { useEmotionDetection } from '@/hooks';
import { EmotionOverlay, EmotionDisplay } from './EmotionDetection';
import type { EmotionData } from '@/services/emotionDetectionService';
// import { LiveKitCallTranscription } from './LiveKitCallTranscription'; // For future use when LiveKit transcription is available

interface ConnectionBadgeProps {
   quality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

const ConnectionBadge = ({ quality }: ConnectionBadgeProps) => {
   const config = {
      excellent: {
         icon: Signal,
         color: 'text-emerald-300',
         bg: 'bg-emerald-500/20',
         border: 'border-emerald-400/40',
         label: 'Tuyệt vời',
         pulse: true,
      },
      good: {
         icon: Wifi,
         color: 'text-blue-300',
         bg: 'bg-blue-500/20',
         border: 'border-blue-400/40',
         label: 'Tốt',
         pulse: false,
      },
      poor: {
         icon: WifiOff,
         color: 'text-orange-300',
         bg: 'bg-orange-500/20',
         border: 'border-orange-400/40',
         label: 'Kém',
         pulse: false,
      },
      disconnected: {
         icon: WifiOff,
         color: 'text-red-300',
         bg: 'bg-red-500/20',
         border: 'border-red-400/40',
         label: 'Mất kết nối',
         pulse: true,
      },
   };

   const { icon: Icon, color, bg, border, label, pulse } = config[quality];

   return (
      <div
         className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-xl border shadow-lg transition-all duration-300',
            bg,
            border,
         )}
      >
         <div className='relative'>
            <Icon className={cn('w-3.5 h-3.5 relative z-10', color)} />
            {pulse && <span className={cn('absolute inset-0 rounded-full animate-ping', bg)} />}
         </div>
         <span className={cn('text-xs font-semibold tracking-wide', color)}>{label}</span>
      </div>
   );
};

interface LiveKitCallScreenProps {
   callId: string;
   callType: 'audio' | 'video';
   receiver?: User;
   onCallEnd?: () => void;
}

export const LiveKitCallScreen = ({ callId, callType, receiver, onCallEnd }: LiveKitCallScreenProps) => {
   const localVideoRef = useRef<HTMLVideoElement>(null);
   const remoteVideosRef = useRef<Map<string, HTMLDivElement>>(new Map());
   const mountedRef = useRef(true);
   const isConnectingRef = useRef(false);
   const connectionStatusRef = useRef<'connecting' | 'connected' | 'failed'>('connecting');

   const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
   const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
   const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
   // const [currentRoom, setCurrentRoom] = useState<any>(null); // For future LiveKit transcription

   // Keep ref in sync with state for use in callbacks
   useEffect(() => {
      connectionStatusRef.current = connectionStatus;
   }, [connectionStatus]);
   const [callDuration, setCallDuration] = useState(0);
   const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>(
      'excellent',
   );
   const [showControls, setShowControls] = useState(true);
   const [isFullscreen, setIsFullscreen] = useState(false);
   const [showTranscript, setShowTranscript] = useState(false);
   const [remoteEmotion, setRemoteEmotion] = useState<EmotionData | null>(null);
   const [receiverInfo, setReceiverInfo] = useState<{ id: string; identity: string } | null>(null);

   // Emotion detection for local video
   const {
      currentEmotion,
      isDetecting: isEmotionDetecting,
      faceDetected,
      canvasRef: emotionCanvasRef,
   } = useEmotionDetection(localVideoRef.current, {
      enabled: isVideoEnabled && connectionStatus === 'connected',
      intervalMs: 1000,
      onEmotionChange: (emotion) => {
         // Gửi emotion qua socket cho người nhận
         if (receiverInfo?.id && callId) {
            socketService.sendEmotion(callId, receiverInfo.id, emotion.emotion, emotion.confidence);
         } else {
            console.warn('[Emotion] ⚠️ Cannot send - missing info:', {
               hasReceiverId: !!receiverInfo?.id,
               hasCallId: !!callId,
               receiverInfo,
            });
         }
      },
   });

   const durationIntervalRef = useRef<number | null>(null);
   const controlsTimeoutRef = useRef<number | null>(null);

   // Get receiver info from participants
   useEffect(() => {
      if (participants.length > 0 && !receiverInfo) {
         const firstParticipant = participants[0];
         setReceiverInfo({
            id: receiver?.id || firstParticipant.identity,
            identity: firstParticipant.identity,
         });
         console.log('[Emotion] Receiver info set:', {
            id: receiver?.id || firstParticipant.identity,
            identity: firstParticipant.identity,
         });

         // TEST: Set a fake emotion to verify rendering
         setTimeout(() => {
            console.log('[Emotion] 🧪 TEST: Setting fake emotion');
            setRemoteEmotion({
               emotion: 'Happy',
               confidence: 95,
               allEmotions: {
                  neutral: 95,
                  happy: 0,
                  sad: 0,
                  angry: 0,
                  fearful: 0,
                  disgusted: 0,
                  surprised: 5,
               },
               timestamp: Date.now(),
            });
         }, 1000);
      }
   }, [participants, receiver, receiverInfo]);

   // Listen for remote emotion from socket
   useEffect(() => {
      console.log('[Emotion] Setting up listener for callId:', callId);

      const handleRemoteEmotion = (data: any) => {
         console.log('[Emotion] ✅ Received from remote:', data);
         console.log('[Emotion] Current callId:', callId, '| Data callId:', data.callId);

         if (data.callId === callId) {
            // Normalize emotion string from backend (Vietnamese to English)
            const normalizeEmotion = (emotion: string): string => {
               const emotionMap: Record<string, string> = {
                  'BÌNH THƯỜNG': 'Neutral',
                  'VUI VẺ': 'Happy',
                  BUỒN: 'Sad',
                  'TỨC GIẬN': 'Angry',
                  'SỢ HÃI': 'Fearful',
                  'GHÊ TỞM': 'Disgusted',
                  'NGẠC NHIÊN': 'Surprised',
                  // English variants
                  NEUTRAL: 'Neutral',
                  HAPPY: 'Happy',
                  SAD: 'Sad',
                  ANGRY: 'Angry',
                  FEARFUL: 'Fearful',
                  DISGUSTED: 'Disgusted',
                  SURPRISED: 'Surprised',
               };

               // Normalize case
               const normalized = emotionMap[emotion.toUpperCase()] || emotion;
               console.log('[Emotion] Normalized:', emotion, '->', normalized);
               return normalized;
            };

            const normalizedEmotion = normalizeEmotion(data.emotion);

            console.log('[Emotion] ✅ CallId matched! Setting remote emotion:', normalizedEmotion);
            const newEmotionData = {
               emotion: normalizedEmotion,
               confidence: data.confidence,
               allEmotions: {
                  neutral: 0,
                  happy: 0,
                  sad: 0,
                  angry: 0,
                  fearful: 0,
                  disgusted: 0,
                  surprised: 0,
               },
               timestamp: Date.now(),
            };
            setRemoteEmotion(newEmotionData);
            console.log('[Emotion] 🎭 State updated with:', newEmotionData);
         } else {
            console.log('[Emotion] ❌ CallId mismatch! Ignoring emotion.');
         }
      };

      socketService.on('call:emotion', handleRemoteEmotion);
      console.log('[Emotion] Listener registered for call:emotion event');

      return () => {
         console.log('[Emotion] Cleaning up listener for callId:', callId);
         socketService.off('call:emotion', handleRemoteEmotion);
      };
   }, [callId]);

   // Auto-hide controls
   const resetControlsTimeout = useCallback(() => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
         clearTimeout(controlsTimeoutRef.current);
      }
      if (connectionStatus === 'connected' && callType === 'video') {
         controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000) as any as number;
      }
   }, [connectionStatus, callType]);

   // Effect to handle local video attachment when video is toggled
   useEffect(() => {
      if (!localVideoRef.current) return;

      const attachVideo = () => {
         const localParticipant = livekitService.getLocalParticipant();
         if (!localParticipant || !localVideoRef.current) return;

         const videoTrack = localParticipant.getTrackPublication(Track.Source.Camera);

         if (isVideoEnabled && videoTrack?.track) {
            // Detach first to avoid multiple attachments
            videoTrack.track.detach();
            // Attach to the video element
            videoTrack.track.attach(localVideoRef.current);
            console.log('[LiveKitCallScreen] Local video track attached in effect');
         }
      };

      // Small delay to ensure track is published after toggle
      const timeoutId = setTimeout(() => {
         attachVideo();
      }, 150);

      // Also listen for track published event in case track is not ready yet
      const localParticipant = livekitService.getLocalParticipant();
      if (localParticipant && isVideoEnabled) {
         const handleTrackPublished = (publication: any) => {
            if (publication.source === Track.Source.Camera && localVideoRef.current) {
               publication.track?.detach();
               publication.track?.attach(localVideoRef.current);
               console.log('[LiveKitCallScreen] Local video track attached via published event in effect');
            }
         };

         localParticipant.on('localTrackPublished', handleTrackPublished);

         return () => {
            clearTimeout(timeoutId);
            localParticipant.off('localTrackPublished', handleTrackPublished);
         };
      }

      return () => clearTimeout(timeoutId);
   }, [isVideoEnabled]);

   useEffect(() => {
      mountedRef.current = true;

      // Listen for call:accepted event (for caller waiting for receiver to join)
      const handleCallAccepted = (data: any) => {
         console.log('[LiveKitCallScreen] Received call:accepted event:', data);
         // Event received but we don't need to do anything - participant will join LiveKit directly
      };

      socketService.on('call:accepted', handleCallAccepted);

      const initCall = async () => {
         // Prevent duplicate connections from React Strict Mode
         if (isConnectingRef.current) {
            console.log('[LiveKitCallScreen] Already connecting, skipping duplicate mount');
            return;
         }

         isConnectingRef.current = true;

         try {
            // Check if still mounted before starting
            if (!mountedRef.current) {
               console.log('[LiveKitCallScreen] Unmounted before connection start');
               return;
            }

            setConnectionStatus('connecting');

            // Setup callbacks
            livekitService.onParticipantConnected = handleParticipantConnected;
            livekitService.onParticipantDisconnected = handleParticipantDisconnected;
            livekitService.onTrackSubscribed = handleTrackSubscribed;
            livekitService.onTrackUnsubscribed = handleTrackUnsubscribed;
            livekitService.onDisconnected = handleDisconnected;
            livekitService.onConnectionQualityChanged = handleConnectionQualityChanged;

            // Join call with appropriate media settings
            const room = await livekitService.joinCall(callId, {
               enableVideo: callType === 'video',
               enableAudio: true,
            });

            // Store room for future LiveKit transcription
            // setCurrentRoom(room);

            // Check if still mounted after async operation
            if (!mountedRef.current) {
               console.log('[LiveKitCallScreen] Component unmounted during connection, cleaning up');
               await livekitService.leaveCall();
               return;
            }

            // Check if there are already participants (caller joins after receiver)
            // or if we need to wait (caller joins first)
            const hasRemoteParticipants = room.remoteParticipants.size > 0;

            if (hasRemoteParticipants) {
               setConnectionStatus('connected');
               console.log('[LiveKitCallScreen] Joined room with existing participants');
            } else {
               // Stay in connecting state until someone joins
               console.log('[LiveKitCallScreen] Waiting for other participant to join...');
            }

            // Log current media state
            console.log('[LiveKitCallScreen] Call connected, media state:', {
               isMicEnabled: room.localParticipant.isMicrophoneEnabled,
               isCameraEnabled: room.localParticipant.isCameraEnabled,
               callType,
               remoteParticipants: room.remoteParticipants.size,
            });

            // Attach local video
            attachLocalVideo(room);

            // Update participants
            updateParticipants();

            // Start duration timer
            durationIntervalRef.current = setInterval(() => {
               if (mountedRef.current) {
                  setCallDuration((prev) => prev + 1);
               }
            }, 1000) as any as number;
         } catch (error) {
            console.error('Failed to join call:', error);
            if (mountedRef.current) {
               setConnectionStatus('failed');
               alert('Không thể kết nối cuộc gọi. Vui lòng thử lại.');
               onCallEnd?.();
            }
         } finally {
            isConnectingRef.current = false;
         }
      };

      initCall();

      return () => {
         mountedRef.current = false;
         socketService.off('call:accepted', handleCallAccepted);
         if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
         }
         if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
         }
         // Only disconnect if we actually connected
         if (!isConnectingRef.current) {
            livekitService.leaveCall();
         }
      };
   }, [callId]);

   const attachLocalVideo = (room: any) => {
      const videoTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
      if (videoTrack?.track && localVideoRef.current) {
         videoTrack.track.attach(localVideoRef.current);
         console.log('[LiveKitCallScreen] Local video track attached successfully');
      } else {
         // If track is not ready yet, wait for it
         console.log('[LiveKitCallScreen] Local video track not ready, waiting for LocalTrackPublished event');
         room.localParticipant.on('localTrackPublished', (publication: any) => {
            if (publication.source === Track.Source.Camera && localVideoRef.current) {
               publication.track?.attach(localVideoRef.current);
               console.log('[LiveKitCallScreen] Local video track attached via LocalTrackPublished event');
            }
         });
      }
   };

   const handleParticipantConnected = (participant: RemoteParticipant) => {
      console.log('[LiveKitCallScreen] ===== PARTICIPANT CONNECTED =====');
      console.log('[LiveKitCallScreen] Participant identity:', participant.identity);
      console.log('[LiveKitCallScreen] Participant name:', participant.name);
      console.log('[LiveKitCallScreen] Current connection status:', connectionStatus);

      updateParticipants();

      // If this is the first participant joining, it means the other person accepted
      // Update connection status from connecting to connected
      if (mountedRef.current && connectionStatus === 'connecting') {
         console.log('[LiveKitCallScreen] Updating status from connecting to connected');
         setConnectionStatus('connected');
         console.log('[LiveKitCallScreen] Other participant joined, call is now active');
      } else {
         console.log('[LiveKitCallScreen] Status already connected or component unmounted');
      }
   };

   const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      console.log('[LiveKitCallScreen] Participant disconnected:', participant.identity);
      console.log('[LiveKitCallScreen] Current connection status (ref):', connectionStatusRef.current);

      // Remove participant's video element
      const videoElement = remoteVideosRef.current.get(participant.identity);
      if (videoElement) {
         videoElement.remove();
         remoteVideosRef.current.delete(participant.identity);
      }
      updateParticipants();

      // For 1-1 call: when the other person leaves, end the call automatically
      // Check if there are no more remote participants
      const remainingParticipants = livekitService.getParticipants();
      console.log('[LiveKitCallScreen] Remaining participants:', remainingParticipants.length);

      // Use ref instead of state to avoid stale closure issue
      if (remainingParticipants.length === 0 && connectionStatusRef.current === 'connected') {
         console.log('[LiveKitCallScreen] Other participant left, ending call automatically...');
         // Small delay to ensure cleanup happens properly
         setTimeout(() => {
            if (mountedRef.current) {
               onCallEnd?.();
            }
         }, 500);
      }
   };

   const handleTrackSubscribed = (track: Track, _publication: any, participant: RemoteParticipant) => {
      console.log(`[LiveKitCallScreen] Track subscribed:`, {
         kind: track.kind,
         source: track.source,
         participant: participant.identity,
      });

      if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
         const container = document.getElementById('remote-videos');
         let participantDiv = document.getElementById(`participant-${participant.identity}`);

         if (!participantDiv) {
            participantDiv = document.createElement('div');
            participantDiv.id = `participant-${participant.identity}`;
            participantDiv.className = 'participant-video w-full h-full bg-gray-900 rounded-lg overflow-hidden';
            container?.appendChild(participantDiv);
         }

         const element = track.attach();
         (element as HTMLMediaElement).style.width = '100%';
         (element as HTMLMediaElement).style.height = '100%';
         (element as HTMLMediaElement).style.objectFit = 'cover';

         // For audio tracks, hide the element but keep it in DOM
         if (track.kind === Track.Kind.Audio) {
            (element as HTMLMediaElement).style.display = 'none';
            console.log('[LiveKitCallScreen] Audio track attached and hidden');
         }

         participantDiv.appendChild(element);
         remoteVideosRef.current.set(participant.identity, participantDiv as HTMLDivElement);
      }
   };

   const handleTrackUnsubscribed = (track: Track) => {
      track.detach();
   };

   const handleDisconnected = (reason?: string) => {
      console.log('Call disconnected:', reason);
      onCallEnd?.();
   };

   const handleConnectionQualityChanged = (quality: ConnectionQuality, _participant: RemoteParticipant) => {
      // Map LiveKit ConnectionQuality to our quality type
      const qualityMap: Record<ConnectionQuality, 'excellent' | 'good' | 'poor' | 'disconnected'> = {
         [ConnectionQuality.Excellent]: 'excellent',
         [ConnectionQuality.Good]: 'good',
         [ConnectionQuality.Poor]: 'poor',
         [ConnectionQuality.Lost]: 'disconnected',
         [ConnectionQuality.Unknown]: 'good',
      };
      setConnectionQuality(qualityMap[quality] || 'good');
   };

   const updateParticipants = () => {
      const participantList = livekitService.getParticipants();
      setParticipants(participantList);
   };

   const handleToggleVideo = async () => {
      console.log('[LiveKitCallScreen] Toggling video, current state:', isVideoEnabled);
      const enabled = await livekitService.toggleVideo();
      console.log('[LiveKitCallScreen] Video toggled to:', enabled);
      setIsVideoEnabled(enabled);
   };

   const handleToggleAudio = async () => {
      console.log('[LiveKitCallScreen] Toggling audio, current state:', isAudioEnabled);
      const enabled = await livekitService.toggleAudio();
      console.log('[LiveKitCallScreen] Audio toggled to:', enabled);
      setIsAudioEnabled(enabled);
   };

   const handleEndCall = async () => {
      await livekitService.leaveCall();
      onCallEnd?.();
   };

   const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
         document.documentElement.requestFullscreen();
         setIsFullscreen(true);
      } else {
         document.exitFullscreen();
         setIsFullscreen(false);
      }
   };

   const toggleTranscript = () => {
      setShowTranscript((prev) => !prev);
   };

   const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   };

   return (
      <div
         className='fixed inset-0 z-50 bg-linear-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col'
         onMouseMove={resetControlsTimeout}
         onClick={resetControlsTimeout}
      >
         {/* Animated Background */}
         <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            <div className='absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse' />
            <div
               className='absolute bottom-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse'
               style={{ animationDelay: '1s' }}
            />
         </div>

         {/* Header */}
         <div
            className={cn(
               'absolute top-0 left-0 right-0 z-10 transition-all duration-500 transform',
               showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
            )}
         >
            <div className='flex justify-between items-start p-6 bg-linear-to-b from-black/60 via-black/30 to-transparent backdrop-blur-xl'>
               {/* User Info Section */}
               <div className='flex items-center gap-4 animate-in slide-in-from-left duration-500'>
                  <div className='relative'>
                     <Avatar className='w-12 h-12 ring-2 ring-white/20 shadow-xl'>
                        <AvatarImage src={receiver?.avatar} />
                        <AvatarFallback className='bg-linear-to-br from-blue-500 to-purple-600 text-white font-semibold'>
                           {receiver?.displayName?.[0]}
                        </AvatarFallback>
                     </Avatar>
                     {connectionStatus === 'connected' && (
                        <span className='absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-gray-950 rounded-full animate-pulse' />
                     )}
                  </div>
                  <div className='space-y-1'>
                     <h3 className='text-white font-semibold text-lg tracking-tight'>
                        {receiver?.displayName || 'Cuộc gọi'}
                     </h3>
                     <div className='flex items-center gap-2'>
                        {connectionStatus === 'connecting' && (
                           <div className='flex items-center gap-2 text-amber-300'>
                              <Loader2 className='w-3.5 h-3.5 animate-spin' />
                              <span className='text-sm font-medium'>Đang kết nối...</span>
                           </div>
                        )}
                        {connectionStatus === 'connected' && (
                           <div className='flex items-center gap-2 text-emerald-300'>
                              <Clock className='w-3.5 h-3.5' />
                              <span className='text-sm font-medium tabular-nums'>{formatDuration(callDuration)}</span>
                           </div>
                        )}
                        {connectionStatus === 'failed' && (
                           <span className='text-sm font-medium text-red-300'>Kết nối thất bại</span>
                        )}
                     </div>
                  </div>
               </div>
               {/* Remote Emotion Display */}
               {participants.length > 0 && remoteEmotion && (
                  <EmotionDisplay
                     emotion={remoteEmotion}
                     compact
                  />
               )}
               {/* Status Indicators */}
               <div className='flex items-center gap-3 animate-in slide-in-from-right duration-500'>
                  <ConnectionBadge quality={connectionQuality} />

                  <div className='flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg'>
                     <Users className='w-3.5 h-3.5 text-blue-300' />
                     <span className='text-white text-sm font-semibold tabular-nums'>{participants.length + 1}</span>
                  </div>
                  <Button
                     size='icon'
                     variant='ghost'
                     className='w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg'
                     onClick={toggleFullscreen}
                  >
                     {isFullscreen ? (
                        <Minimize2 className='w-4 h-4 text-white' />
                     ) : (
                        <Maximize2 className='w-4 h-4 text-white' />
                     )}
                  </Button>
               </div>
            </div>
         </div>

         {/* Video Container */}
         <div className='flex-1 relative'>
            {/* Local Video (Small) */}
            <div
               className={cn(
                  'absolute top-24 right-6 w-36 h-48 sm:w-44 sm:h-56 lg:w-52 lg:h-64 rounded-2xl overflow-hidden bg-linear-to-br from-gray-800 to-gray-900 shadow-2xl z-20 border border-white/10 transition-all duration-500 transform',
                  showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
               )}
            >
               {isVideoEnabled ? (
                  <div className='relative w-full h-full'>
                     <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className='w-full h-full object-cover scale-x-[-1]'
                     />
                     {/* Emotion Detection Overlay */}
                     <EmotionOverlay
                        emotion={currentEmotion}
                        faceDetected={faceDetected}
                        isDetecting={isEmotionDetecting}
                        videoRef={localVideoRef}
                        canvasRef={emotionCanvasRef}
                        position='top-left'
                     />
                  </div>
               ) : (
                  <div className='w-full h-full flex flex-col items-center justify-center text-white space-y-3 bg-linear-to-br from-slate-800 to-slate-900'>
                     <div className='p-4 rounded-full bg-white/10 backdrop-blur-xl'>
                        <VideoOff className='w-8 h-8' />
                     </div>
                     <p className='text-sm font-medium'>Camera đã tắt</p>
                  </div>
               )}
               {/* User label */}
               <div className='absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3'>
                  <p className='text-white text-xs font-semibold truncate'>Bạn</p>
               </div>
            </div>

            {/* Remote Videos (Large) */}
            <div
               id='remote-videos'
               className='w-full h-full flex items-center justify-center p-6 relative z-0'
            >
               {participants.length === 0 && (
                  <div className='text-center text-white space-y-6 animate-in fade-in zoom-in duration-700'>
                     <div className='relative inline-block'>
                        <div className='w-24 h-24 rounded-full bg-linear-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl'>
                           <Loader2 className='w-12 h-12 animate-spin text-blue-300' />
                        </div>
                        <span className='absolute inset-0 rounded-full bg-blue-500/20 animate-ping' />
                     </div>
                     <div className='space-y-2'>
                        <p className='text-xl font-semibold'>Đang đợi người khác tham gia...</p>
                        <p className='text-sm text-gray-400'>Cuộc gọi sẽ bắt đầu khi họ kết nối</p>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* Controls */}
         <div
            className={cn(
               'absolute bottom-0 left-0 right-0 z-10 transition-all duration-500 transform',
               showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            )}
         >
            <div className='flex justify-center items-center gap-6 p-8 bg-linear-to-t from-black/80 via-black/40 to-transparent backdrop-blur-2xl'>
               {/* Toggle Video */}
               <div className='group relative'>
                  <Button
                     size='icon'
                     className={cn(
                        'w-15 h-15 rounded-full shadow-xl shadow-black/40 transition-all duration-300 transform hover:scale-110 active:scale-95 border-2',
                        isVideoEnabled
                           ? 'bg-slate-700/60 hover:bg-slate-600/70 backdrop-blur-xl border-slate-500/50 hover:border-slate-400/60 hover:shadow-slate-500/30'
                           : 'bg-linear-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 border-red-400/50 hover:border-red-300/60 shadow-red-600/40 hover:shadow-red-500/50',
                     )}
                     onClick={handleToggleVideo}
                  >
                     {isVideoEnabled ? (
                        <Video className='w-7 h-7 text-white drop-shadow-lg' />
                     ) : (
                        <VideoOff className='w-7 h-7 text-white drop-shadow-lg' />
                     )}
                  </Button>
                  <span className='absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                     {isVideoEnabled ? 'Tắt camera' : 'Bật camera'}
                  </span>
               </div>

               {/* Toggle Audio */}
               <div className='group relative'>
                  <Button
                     size='icon'
                     className={cn(
                        'w-15 h-15 rounded-full shadow-xl shadow-black/40 transition-all duration-300 transform hover:scale-110 active:scale-95 border-2',
                        isAudioEnabled
                           ? 'bg-slate-700/60 hover:bg-slate-600/70 backdrop-blur-xl border-slate-500/50 hover:border-slate-400/60 hover:shadow-slate-500/30'
                           : 'bg-linear-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 border-red-400/50 hover:border-red-300/60 shadow-red-600/40 hover:shadow-red-500/50',
                     )}
                     onClick={handleToggleAudio}
                  >
                     {isAudioEnabled ? (
                        <Mic className='w-7 h-7 text-white drop-shadow-lg' />
                     ) : (
                        <MicOff className='w-7 h-7 text-white drop-shadow-lg' />
                     )}
                  </Button>
                  <span className='absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                     {isAudioEnabled ? 'Tắt mic' : 'Bật mic'}
                  </span>
               </div>

               {/* Toggle Transcript */}
               <div className='group relative'>
                  <Button
                     size='icon'
                     className={cn(
                        'w-15 h-15 rounded-full shadow-xl shadow-black/40 transition-all duration-300 transform hover:scale-110 active:scale-95 border-2',
                        showTranscript
                           ? 'bg-linear-to-br from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 border-purple-400/50 hover:border-purple-300/60 shadow-purple-600/40 hover:shadow-purple-500/50'
                           : 'bg-slate-700/60 hover:bg-slate-600/70 backdrop-blur-xl border-slate-500/50 hover:border-slate-400/60 hover:shadow-slate-500/30',
                     )}
                     onClick={toggleTranscript}
                  >
                     <MessageSquare className='w-7 h-7 text-white drop-shadow-lg' />
                  </Button>
                  <span className='absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap'>
                     {showTranscript ? 'Ẩn transcript' : 'Hiện transcript'}
                  </span>
               </div>

               {/* End Call */}
               <div className='group relative'>
                  <div className='absolute inset-0 rounded-full bg-red-500/30 blur-xl animate-pulse'></div>
                  <Button
                     size='icon'
                     className='relative w-15 h-15 rounded-full bg-linear-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 shadow-2xl shadow-red-600/50 hover:shadow-red-500/60 transition-all duration-300 transform hover:scale-110 hover:rotate-12 active:scale-95 active:rotate-0 border-2 border-red-400/50 hover:border-red-300/70'
                     onClick={handleEndCall}
                  >
                     <PhoneOff className='w-6 h-6 text-white drop-shadow-2xl' />
                  </Button>
                  <span className='absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-red-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold'>
                     Kết thúc
                  </span>
               </div>
            </div>
         </div>

         {/* Transcript Panel - Using Web Speech API (LiveKit account doesn't have transcription feature) */}
         <RealTimeTranscriptionPanel
            callId={callId}
            isVisible={showTranscript}
            isAudioEnabled={isAudioEnabled}
            onClose={() => setShowTranscript(false)}
            language='vi-VN'
         />

         {/* Alternative: LiveKit Transcription (uncomment when LiveKit transcription is available)
         {showTranscript && (
            <div className='fixed right-4 top-20 bottom-24 w-[420px] max-w-[90vw] z-50'>
               <LiveKitCallTranscription 
                  room={currentRoom}
                  enabled={showTranscript && isAudioEnabled}
                  onClose={() => setShowTranscript(false)}
               />
            </div>
         )}
         */}
      </div>
   );
};
