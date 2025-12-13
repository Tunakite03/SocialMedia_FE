import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Brain, TrendingUp, Sparkles, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import aiAssistantService from '@/services/aiAssistantService';
import type { AIMessage, AIEmotionType } from '@/types';

interface AssistantChatPopupProps {
   isOpen: boolean;
   onClose?: () => void;
   buttonPosition?: { x: number; y: number };
}

const emotionColors: Record<AIEmotionType, string> = {
   happy: 'bg-yellow-500',
   sad: 'bg-blue-500',
   angry: 'bg-red-500',
   anxious: 'bg-purple-500',
   excited: 'bg-orange-500',
   neutral: 'bg-gray-500',
   confused: 'bg-indigo-500',
   stressed: 'bg-pink-500',
};

const emotionEmojis: Record<AIEmotionType, string> = {
   happy: '😊',
   sad: '😢',
   angry: '😡',
   anxious: '😰',
   excited: '🤩',
   neutral: '😐',
   confused: '🤔',
   stressed: '😫',
};

const emotionLabels: Record<AIEmotionType, string> = {
   happy: 'Vui vẻ',
   sad: 'Buồn',
   angry: 'Tức giận',
   anxious: 'Lo lắng',
   excited: 'Phấn khích',
   neutral: 'Bình thường',
   confused: 'Bối rối',
   stressed: 'Căng thẳng',
};

const AssistantChatPopup = ({ isOpen, onClose, buttonPosition = { x: 0, y: 0 } }: AssistantChatPopupProps) => {
   const [messages, setMessages] = useState<AIMessage[]>([]);
   const [inputValue, setInputValue] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
   const [isMobile, setIsMobile] = useState(false);
   const [showClearConfirm, setShowClearConfirm] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const popupRef = useRef<HTMLDivElement>(null);

   // Detect mobile screen
   useEffect(() => {
      const checkMobile = () => {
         setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
   }, []);

   // Load saved popup position
   useEffect(() => {
      const saved = localStorage.getItem('ai-popup-position');
      if (saved) {
         setPopupPosition(JSON.parse(saved));
      }
   }, []);

   const handleHeaderMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0 || isMobile) return; // Disable drag on mobile
      setIsDragging(true);
      setDragStart({
         x: e.clientX - popupPosition.x,
         y: e.clientY - popupPosition.y,
      });
      e.preventDefault();
   };

   const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 500;

      setPopupPosition({
         x: Math.max(-200, Math.min(maxX, newX)),
         y: Math.max(0, Math.min(maxY, newY)),
      });
   };

   const handleMouseUp = () => {
      if (isDragging) {
         setIsDragging(false);
         localStorage.setItem('ai-popup-position', JSON.stringify(popupPosition));
      }
   };

   useEffect(() => {
      if (isDragging) {
         document.addEventListener('mousemove', handleMouseMove);
         document.addEventListener('mouseup', handleMouseUp);
         return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
         };
      }
   }, [isDragging, dragStart, popupPosition]);

   useEffect(() => {
      if (isOpen && messages.length === 0) {
         // Add greeting message
         const greeting: AIMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: aiAssistantService.getGreeting(),
            timestamp: new Date(),
         };
         setMessages([greeting]);
         aiAssistantService.addMessage(greeting);
      }
   }, [isOpen]);

   useEffect(() => {
      // Auto scroll to bottom
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [messages]);

   const handleSend = async () => {
      if (!inputValue.trim()) return;

      const userMessage: AIMessage = {
         id: Date.now().toString(),
         role: 'user',
         content: inputValue,
         timestamp: new Date(),
      };

      // Add user message
      setMessages((prev) => [...prev, userMessage]);
      aiAssistantService.addMessage(userMessage);
      setInputValue('');
      setIsTyping(true);

      // Simulate AI thinking delay
      setTimeout(() => {
         // Analyze emotion
         const emotion = aiAssistantService.analyzeEmotion(inputValue);

         // Generate response
         const responseContent = aiAssistantService.generateResponse(inputValue, emotion);

         const assistantMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date(),
            emotion,
         };

         setMessages((prev) => [...prev, assistantMessage]);
         aiAssistantService.addMessage(assistantMessage);
         setIsTyping(false);
      }, 1000 + Math.random() * 1000);
   };

   const handleClearClick = () => {
      setShowClearConfirm(true);
   };

   const handleClearConfirm = () => {
      setMessages([]);
      aiAssistantService.clearMessages();
      // Add greeting again
      const greeting: AIMessage = {
         id: Date.now().toString(),
         role: 'assistant',
         content: aiAssistantService.getGreeting(),
         timestamp: new Date(),
      };
      setMessages([greeting]);
      aiAssistantService.addMessage(greeting);
   };

   if (!isOpen) return null;

   return (
      <>
         {/* Mobile Overlay */}
         {isMobile && <div className='fixed inset-0 bg-black/50 z-40 animate-fade-in' />}

         <div
            ref={popupRef}
            className={
               isMobile
                  ? 'fixed inset-0 z-50 flex items-end animate-slide-up-mobile'
                  : 'fixed bottom-0 right-0 z-50 w-[400px] max-w-[calc(100vw-3rem)]'
            }
            style={
               isMobile
                  ? undefined
                  : {
                       transform: `translate(${buttonPosition.x + popupPosition.x}px, ${
                          buttonPosition.y + popupPosition.y
                       }px)`,
                       transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                    }
            }
         >
            <Card
               size={'sm'}
               className={
                  isMobile
                     ? 'shadow-none border-0 rounded-b-none h-[85vh] flex flex-col'
                     : 'shadow-2xl border-2 overflow-hidden'
               }
            >
               {/* Header */}
               <CardHeader
                  className='text-foreground pb-4 shrink-0'
                  onMouseDown={handleHeaderMouseDown}
                  style={{
                     cursor: isDragging ? 'grabbing' : isMobile ? 'default' : 'grab',
                  }}
               >
                  <div className='flex justify-end'>
                     <Button
                        size='icon'
                        onClick={onClose}
                        className='h-8 w-8 '
                        title='Đóng trợ lý'
                     >
                        <X className='h-4 w-4' />
                     </Button>
                  </div>
                  <div className='flex items-center justify-between'>
                     {!isMobile && <GripVertical className='h-4 w-4 opacity-60 mr-1' />}
                     <CardTitle className='flex items-center gap-2 text-lg'>
                        <Brain className='h-5 w-5' />
                        Otakumi Kunn
                        <Sparkles className='h-4 w-4 animate-pulse' />
                     </CardTitle>
                     <div className='flex items-center gap-2'>
                        <Button
                           variant={'outline'}
                           size='icon'
                           onClick={handleClearClick}
                           className='h-8 w-8 '
                           title='Xóa lịch sử'
                        >
                           <Trash2 className='h-4 w-4' />
                        </Button>
                     </div>
                  </div>
               </CardHeader>

               {/* Messages */}
               <CardContent className={isMobile ? 'p-0 flex-1 flex flex-col overflow-hidden' : 'p-0'}>
                  <ScrollArea
                     className={isMobile ? 'flex-1 p-4' : 'h-[450px] p-4'}
                     ref={scrollRef}
                  >
                     <div className='space-y-4'>
                        {messages.map((message) => (
                           <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                           >
                              <div
                                 className={`
                                 max-w-[85%] rounded-2xl px-4 py-2.5
                                 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                              `}
                              >
                                 {/* Message content */}
                                 <p className='text-sm whitespace-pre-wrap break-words'>{message.content}</p>

                                 {/* Emotion Analysis */}
                                 {message.emotion && (
                                    <div className='mt-3 pt-3 border-t border-border/50'>
                                       <div className='flex items-center gap-2 mb-2'>
                                          <TrendingUp className='h-3.5 w-3.5 text-muted-foreground' />
                                          <span className='text-xs font-semibold text-muted-foreground'>
                                             Phân tích cảm xúc:
                                          </span>
                                       </div>

                                       {/* Primary emotion */}
                                       <div className='flex items-center gap-2 mb-2'>
                                          <span className='text-2xl'>{emotionEmojis[message.emotion.primary]}</span>
                                          <Badge className={`${emotionColors[message.emotion.primary]} text-white`}>
                                             {emotionLabels[message.emotion.primary]}
                                          </Badge>
                                          <span className='text-xs text-muted-foreground'>
                                             ({Math.round(message.emotion.confidence * 100)}%)
                                          </span>
                                       </div>

                                       {/* Suggestions */}
                                       {message.emotion.suggestions && message.emotion.suggestions.length > 0 && (
                                          <div className='mt-2'>
                                             <p className='text-xs font-semibold text-muted-foreground mb-1'>
                                                💡 Gợi ý:
                                             </p>
                                             <ul className='text-xs space-y-1 text-muted-foreground'>
                                                {message.emotion.suggestions.map((suggestion, idx) => (
                                                   <li
                                                      key={idx}
                                                      className='flex items-start gap-1.5'
                                                   >
                                                      <span className='text-primary mt-0.5'>•</span>
                                                      <span>{suggestion}</span>
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       )}
                                    </div>
                                 )}

                                 {/* Timestamp */}
                                 <p className='text-[10px] opacity-60 mt-1.5'>
                                    {new Date(message.timestamp).toLocaleTimeString('vi-VN', {
                                       hour: '2-digit',
                                       minute: '2-digit',
                                    })}
                                 </p>
                              </div>
                           </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                           <div className='flex justify-start'>
                              <div className='bg-muted rounded-2xl px-4 py-3'>
                                 <div className='flex gap-1.5'>
                                    <div
                                       className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'
                                       style={{ animationDelay: '0ms' }}
                                    ></div>
                                    <div
                                       className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'
                                       style={{ animationDelay: '150ms' }}
                                    ></div>
                                    <div
                                       className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'
                                       style={{ animationDelay: '300ms' }}
                                    ></div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  </ScrollArea>

                  <Separator />

                  {/* Input */}
                  <div className={isMobile ? 'p-4 pb-6 bg-muted/30 shrink-0' : 'p-4 bg-muted/30'}>
                     <div className='flex gap-2'>
                        <Input
                           value={inputValue}
                           onChange={(e) => setInputValue(e.target.value)}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault();
                                 handleSend();
                              }
                           }}
                           placeholder='Chia sẻ cảm xúc của bạn...'
                           disabled={isTyping}
                           className='flex-1'
                        />
                        <Button
                           onClick={handleSend}
                           disabled={!inputValue.trim() || isTyping}
                           size='icon'
                           className='shrink-0'
                        >
                           <Send className='h-4 w-4' />
                        </Button>
                     </div>
                     <p className='text-[10px] text-muted-foreground mt-2 text-center hidden md:block'>
                        Nhấn Enter để gửi • Shift + Enter để xuống dòng
                     </p>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Animations */}
         <style>{`
            @keyframes slide-up {
               from {
                  opacity: 0;
                  transform: translateY(20px);
               }
               to {
                  opacity: 1;
                  transform: translateY(0);
               }
            }

            @keyframes slide-up-mobile {
               from {
                  transform: translateY(100%);
               }
               to {
                  transform: translateY(0);
               }
            }

            @keyframes fade-in {
               from {
                  opacity: 0;
               }
               to {
                  opacity: 1;
               }
            }

            .animate-slide-up {
               animation: slide-up 0.3s ease-out;
            }

            .animate-slide-up-mobile {
               animation: slide-up-mobile 0.3s ease-out;
            }

            .animate-fade-in {
               animation: fade-in 0.2s ease-out;
            }
         `}</style>

         {/* Confirm Dialog */}
         <ConfirmDialog
            isOpen={showClearConfirm}
            onClose={() => setShowClearConfirm(false)}
            onConfirm={handleClearConfirm}
            title='Xóa lịch sử trò chuyện'
            message='Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với Otakumi Kunn? Hành động này không thể hoàn tác.'
            confirmText='Xóa lịch sử'
            cancelText='Hủy bỏ'
            type='danger'
         />
      </>
   );
};

export default AssistantChatPopup;
