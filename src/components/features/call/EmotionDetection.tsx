import { motion, AnimatePresence } from 'framer-motion';
import { emotionDetectionService, type EmotionData } from '@/services/emotionDetectionService';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface EmotionDisplayProps {
   emotion: EmotionData | null;
   compact?: boolean;
   showDetails?: boolean;
   className?: string;
}

/**
 * Component hiển thị cảm xúc hiện tại
 */
export const EmotionDisplay = ({ emotion, compact = false, showDetails = false, className }: EmotionDisplayProps) => {
   if (!emotion) {
      return null;
   }

   const icon = emotionDetectionService.getEmotionIcon(emotion.emotion);
   const color = getEmotionColorClass(emotion.emotion);

   if (compact) {
      return (
         <AnimatePresence mode='wait'>
            <motion.div
               key={emotion.emotion}
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={{ duration: 0.2 }}
               className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg relative overflow-visible',
                  color.bg,
                  color.border,
                  className,
               )}
               style={{ willChange: 'transform' }}
            >
               {/* Animated background pulse - simplified */}
               <motion.div
                  className='absolute inset-0 rounded-full opacity-20'
                  style={{
                     background: `radial-gradient(circle, ${color.text} 0%, transparent 70%)`,
                     willChange: 'opacity',
                  }}
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
               />

               {/* Floating emoji particles - reduced to 2 */}
               {[0, 1].map((i) => (
                  <motion.span
                     key={`particle-${i}`}
                     className='absolute text-sm pointer-events-none'
                     style={{
                        left: '50%',
                        top: '50%',
                        willChange: 'transform, opacity',
                     }}
                     animate={{
                        opacity: [0, 0.8, 0],
                        y: [-5, -50],
                        x: i === 0 ? [-10, -15] : [10, 15],
                        scale: [0.8, 0.4],
                     }}
                     transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 1,
                        ease: [0.4, 0, 0.2, 1], // cubic-bezier for smoothness
                     }}
                  >
                     {icon}
                  </motion.span>
               ))}

               {/* Animated icon - simplified */}
               <motion.span
                  className='text-lg relative z-10'
                  style={{ willChange: 'transform' }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{
                     duration: 1.5,
                     repeat: Infinity,
                     ease: 'easeInOut',
                  }}
               >
                  <span className='relative drop-shadow-lg'>{icon}</span>
               </motion.span>

               <span className={cn('text-xs font-semibold relative z-10', color.text)}>{emotion.emotion}</span>

               {/* Sparkle effect - optimized */}
               <motion.div
                  className='absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/80'
                  style={{ willChange: 'transform, opacity' }}
                  animate={{
                     scale: [0, 1.2, 0],
                     opacity: [0, 1, 0],
                  }}
                  transition={{
                     duration: 1.8,
                     repeat: Infinity,
                     ease: 'easeOut',
                  }}
               />
            </motion.div>
         </AnimatePresence>
      );
   }

   return (
      <AnimatePresence mode='wait'>
         <motion.div
            key={emotion.emotion}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className={cn(
               'flex flex-col gap-2 p-4 rounded-xl backdrop-blur-md border shadow-xl',
               color.bg,
               color.border,
               className,
            )}
         >
            <div className='flex items-center gap-3'>
               <span className='text-3xl'>{icon}</span>
               <div className='flex-1'>
                  <p className={cn('text-lg font-bold', color.text)}>{emotion.emotion}</p>
                  <p className={cn('text-sm opacity-80', color.text)}>Accuracy: {emotion.confidence}%</p>
               </div>
            </div>

            {showDetails && (
               <div className='space-y-1 mt-2'>
                  <p className='text-xs font-semibold opacity-60'>Emotion details:</p>
                  {Object.entries(emotion.allEmotions).map(([key, value]) => {
                     if (value < 10) return null; // Only show emotions with confidence > 10%
                     const emotionName = translateEmotionKey(key);
                     return (
                        <div
                           key={key}
                           className='flex items-center gap-2'
                        >
                           <span className='text-xs opacity-70 min-w-20'>{emotionName}</span>
                           <div className='flex-1 h-2 bg-black/20 rounded-full overflow-hidden'>
                              <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${value}%` }}
                                 className={cn('h-full rounded-full', color.progressBg)}
                              />
                           </div>
                           <span className='text-xs font-semibold opacity-80 min-w-[35px] text-right'>{value}%</span>
                        </div>
                     );
                  })}
               </div>
            )}
         </motion.div>
      </AnimatePresence>
   );
};

/**
 * Component hiển thị overlay cảm xúc trên video
 */
interface EmotionOverlayProps {
   emotion: EmotionData | null;
   faceDetected: boolean;
   isDetecting: boolean;
   videoRef: React.RefObject<HTMLVideoElement | null>;
   canvasRef: React.RefObject<HTMLCanvasElement>;
   position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const EmotionOverlay = ({
   emotion,
   faceDetected,
   isDetecting,
   canvasRef,
   position = 'top-right',
}: EmotionOverlayProps) => {
   const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
   };

   return (
      <div className='absolute inset-0 pointer-events-none'>
         {/* Canvas for face detection box */}
         <canvas
            ref={canvasRef}
            className='absolute inset-0 w-full h-full object-cover'
         />

         {/* Emotion badge */}
         <div className={cn('absolute pointer-events-auto', positionClasses[position])}>
            {isDetecting && !faceDetected && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='flex items-center gap-2 px-3 py-2 rounded-full bg-yellow-500/20 border border-yellow-400/40 backdrop-blur-md'
               >
                  <AlertTriangle className='w-4 h-4 text-yellow-300' />
                  <span className='text-xs font-semibold text-yellow-300'>Looking for face...</span>
               </motion.div>
            )}

            {emotion && faceDetected && (
               <EmotionDisplay
                  emotion={emotion}
                  compact
               />
            )}
         </div>
      </div>
   );
};

/**
 * Helper functions
 */
function getEmotionColorClass(emotion: string) {
   const colors: Record<string, { bg: string; border: string; text: string; progressBg: string }> = {
      Happy: {
         bg: 'bg-emerald-500/20',
         border: 'border-emerald-400/40',
         text: 'text-emerald-300',
         progressBg: 'bg-emerald-400',
      },
      Sad: {
         bg: 'bg-blue-500/20',
         border: 'border-blue-400/40',
         text: 'text-blue-300',
         progressBg: 'bg-blue-400',
      },
      Angry: {
         bg: 'bg-red-500/20',
         border: 'border-red-400/40',
         text: 'text-red-300',
         progressBg: 'bg-red-400',
      },
      Fearful: {
         bg: 'bg-purple-500/20',
         border: 'border-purple-400/40',
         text: 'text-purple-300',
         progressBg: 'bg-purple-400',
      },
      Disgusted: {
         bg: 'bg-amber-500/20',
         border: 'border-amber-400/40',
         text: 'text-amber-300',
         progressBg: 'bg-amber-400',
      },
      Surprised: {
         bg: 'bg-pink-500/20',
         border: 'border-pink-400/40',
         text: 'text-pink-300',
         progressBg: 'bg-pink-400',
      },
      Neutral: {
         bg: 'bg-gray-500/20',
         border: 'border-gray-400/40',
         text: 'text-gray-300',
         progressBg: 'bg-gray-400',
      },
   };

   return (
      colors[emotion] || {
         bg: 'bg-gray-500/20',
         border: 'border-gray-400/40',
         text: 'text-gray-300',
         progressBg: 'bg-gray-400',
      }
   );
}

function translateEmotionKey(key: string): string {
   const translations: Record<string, string> = {
      neutral: 'Neutral',
      happy: 'Happy',
      sad: 'Sad',
      angry: 'Angry',
      fearful: 'Fearful',
      disgusted: 'Disgusted',
      surprised: 'Surprised',
   };
   return translations[key] || key;
}
