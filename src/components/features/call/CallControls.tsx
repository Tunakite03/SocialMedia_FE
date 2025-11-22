import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, VolumeX, Maximize2, Minimize2, Settings } from 'lucide-react';

interface CallControlsProps {
   isAudioEnabled: boolean;
   isVideoEnabled: boolean;
   isSpeakerOn: boolean;
   isFullscreen: boolean;
   callType: 'audio' | 'video';
   onToggleAudio: () => void;
   onToggleVideo: () => void;
   onToggleSpeaker: () => void;
   onToggleFullscreen: () => void;
   onEndCall: () => void;
   className?: string;
}

export const CallControls = ({
   isAudioEnabled,
   isVideoEnabled,
   isSpeakerOn,
   isFullscreen,
   callType,
   onToggleAudio,
   onToggleVideo,
   onToggleSpeaker,
   onToggleFullscreen,
   onEndCall,
   className = '',
}: CallControlsProps) => {
   return (
      <div className={`card-liquid-glass px-6 py-4 flex items-center gap-4 ${className}`}>
         {/* Audio toggle */}
         <Button
            onClick={onToggleAudio}
            size='lg'
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            className={`rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift ${
               isAudioEnabled
                  ? 'bg-white/20 hover:bg-white/30 text-white border-white/20'
                  : 'bg-red-500/80 hover:bg-red-600/90 text-white border-red-400/50'
            }`}
         >
            {isAudioEnabled ? <Mic className='h-6 w-6' /> : <MicOff className='h-6 w-6' />}
         </Button>

         {/* Video toggle (only for video calls) */}
         {callType === 'video' && (
            <Button
               onClick={onToggleVideo}
               size='lg'
               title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
               className={`rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift ${
                  isVideoEnabled
                     ? 'bg-white/20 hover:bg-white/30 text-white border-white/20'
                     : 'bg-red-500/80 hover:bg-red-600/90 text-white border-red-400/50'
               }`}
            >
               {isVideoEnabled ? <Video className='h-6 w-6' /> : <VideoOff className='h-6 w-6' />}
            </Button>
         )}

         {/* Speaker toggle */}
         <Button
            onClick={onToggleSpeaker}
            size='lg'
            title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
            className={`rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift ${
               isSpeakerOn
                  ? 'bg-blue-500/80 hover:bg-blue-600/90 text-white border-blue-400/50'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/20'
            }`}
         >
            {isSpeakerOn ? <Volume2 className='h-6 w-6' /> : <VolumeX className='h-6 w-6' />}
         </Button>

         {/* Fullscreen toggle (only for video calls) */}
         {callType === 'video' && (
            <Button
               onClick={onToggleFullscreen}
               size='lg'
               title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
               className='rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift bg-white/20 hover:bg-white/30 text-white border-white/20'
            >
               {isFullscreen ? <Minimize2 className='h-6 w-6' /> : <Maximize2 className='h-6 w-6' />}
            </Button>
         )}

         {/* Settings/More options */}
         <Button
            size='lg'
            title='More options'
            className='rounded-full h-14 w-14 transition-all duration-300 anime-hover-lift bg-white/20 hover:bg-white/30 text-white border-white/20'
         >
            <Settings className='h-6 w-6' />
         </Button>

         {/* End call - prominently placed */}
         <div className='w-px h-8 bg-white/20 mx-2'></div>
         <Button
            onClick={onEndCall}
            size='lg'
            title='End call'
            className='rounded-full h-14 w-14 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 anime-hover-lift shadow-lg hover:shadow-xl border-none'
         >
            <PhoneOff className='h-6 w-6' />
         </Button>
      </div>
   );
};

export default CallControls;
