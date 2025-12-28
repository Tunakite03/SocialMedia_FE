import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Brain, Settings, Sparkles, GripVertical, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import groqService from '@/services/groqService';
import type { AIMessage } from '@/types';

interface AssistantChatPopupProps {
   isOpen: boolean;
   onClose?: () => void;
   buttonPosition?: { x: number; y: number };
}

const AssistantChatPopup = ({ isOpen, onClose, buttonPosition = { x: 0, y: 0 } }: AssistantChatPopupProps) => {
   const [messages, setMessages] = useState<AIMessage[]>([]);
   const [inputValue, setInputValue] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
   const [isMobile, setIsMobile] = useState(false);
   const [showClearConfirm, setShowClearConfirm] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [apiKey, setApiKey] = useState('');
   const [isInitialized, setIsInitialized] = useState(false);
   const [error, setError] = useState<string | null>(null);
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

   // Load saved popup position and API key
   useEffect(() => {
      const saved = localStorage.getItem('ai-popup-position');
      if (saved) {
         setPopupPosition(JSON.parse(saved));
      }

      // Load saved API key
      const savedApiKey = localStorage.getItem('groq-api-key');
      if (savedApiKey) {
         setApiKey(savedApiKey);
         try {
            groqService.initialize(savedApiKey);
            setIsInitialized(true);
         } catch (err) {
            console.error('Failed to initialize Groq service:', err);
            setError('Không thể khởi tạo dịch vụ. Vui lòng kiểm tra API key.');
         }
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
      if (isOpen && messages.length === 0 && isInitialized) {
         // Add greeting message
         const greeting: AIMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content:
               'Xin chào! Tôi là Otakumi Kunn, trợ lý AI của bạn. Tôi sử dụng Groq AI để trò chuyện với bạn. Hãy hỏi tôi bất cứ điều gì! 😊',
            timestamp: new Date(),
         };
         setMessages([greeting]);
      }
   }, [isOpen, isInitialized]);

   useEffect(() => {
      // Auto scroll to bottom
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [messages]);

   const handleSend = async () => {
      if (!inputValue.trim()) return;

      if (!isInitialized) {
         setError('Vui lòng cấu hình API key trước!');
         setShowSettings(true);
         return;
      }

      const userMessage: AIMessage = {
         id: Date.now().toString(),
         role: 'user',
         content: inputValue,
         timestamp: new Date(),
      };

      // Add user message
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);
      setError(null);

      try {
         // Call Groq API
         const response = await groqService.sendMessage(inputValue);

         const assistantMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
         };

         setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
         console.error('Error sending message:', err);
         setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');

         // Add error message
         const errorMessage: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '❌ Xin lỗi, tôi không thể phản hồi lúc này. Vui lòng thử lại sau.',
            timestamp: new Date(),
         };
         setMessages((prev) => [...prev, errorMessage]);
      } finally {
         setIsTyping(false);
      }
   };

   const handleClearClick = () => {
      setShowClearConfirm(true);
   };

   const handleClearConfirm = () => {
      setMessages([]);
      groqService.clearHistory();
      // Add greeting again if initialized
      if (isInitialized) {
         const greeting: AIMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Xin chào! Tôi là Otakumi Kunn, trợ lý AI của bạn. Hãy hỏi tôi bất cứ điều gì! 😊',
            timestamp: new Date(),
         };
         setMessages([greeting]);
      }
      setShowClearConfirm(false);
   };

   const handleSaveApiKey = () => {
      if (!apiKey.trim()) {
         setError('Vui lòng nhập API key');
         return;
      }

      try {
         localStorage.setItem('groq-api-key', apiKey);
         groqService.initialize(apiKey);
         setIsInitialized(true);
         setShowSettings(false);
         setError(null);

         // Add greeting message
         const greeting: AIMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Xin chào! Tôi là Otakumi Kunn, trợ lý AI của bạn. Tôi đã sẵn sàng trò chuyện với bạn! 😊',
            timestamp: new Date(),
         };
         setMessages([greeting]);
      } catch (err) {
         setError(err instanceof Error ? err.message : 'Không thể khởi tạo Groq service');
      }
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
                           onClick={() => setShowSettings(true)}
                           className='h-8 w-8'
                           title='Cài đặt'
                        >
                           <Settings className='h-4 w-4' />
                        </Button>
                        <Button
                           variant={'outline'}
                           size='icon'
                           onClick={handleClearClick}
                           className='h-8 w-8 '
                           title='Xóa lịch sử'
                           disabled={!isInitialized}
                        >
                           <Trash2 className='h-4 w-4' />
                        </Button>
                     </div>
                  </div>
                  {error && (
                     <div className='mt-2 flex items-center gap-2 text-sm text-destructive'>
                        <AlertCircle className='h-4 w-4' />
                        <span>{error}</span>
                     </div>
                  )}
                  {!isInitialized && (
                     <div className='mt-2 text-sm text-muted-foreground'>⚠️ Vui lòng cấu hình API key để sử dụng</div>
                  )}
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
                                 <p className='text-sm whitespace-pre-wrap wrap-break-word'>{message.content}</p>

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

         {/* Settings Dialog */}
         {showSettings && (
            <div className='fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4'>
               <Card className='w-full max-w-md'>
                  <CardHeader>
                     <CardTitle className='flex items-center gap-2'>
                        <Settings className='h-5 w-5' />
                        Cài đặt Groq API
                     </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                     <div>
                        <label className='text-sm font-medium mb-2 block'>Groq API Key</label>
                        <Input
                           type='password'
                           placeholder='Nhập Groq API key của bạn'
                           value={apiKey}
                           onChange={(e) => setApiKey(e.target.value)}
                           className='w-full'
                        />
                        <p className='text-xs text-muted-foreground mt-2'>
                           Lấy API key miễn phí tại{' '}
                           <a
                              href='https://console.groq.com/keys'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary underline'
                           >
                              console.groq.com
                           </a>
                        </p>
                     </div>

                     {error && (
                        <div className='flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md'>
                           <AlertCircle className='h-4 w-4' />
                           <span>{error}</span>
                        </div>
                     )}

                     <div className='flex gap-2 justify-end'>
                        <Button
                           variant='outline'
                           onClick={() => {
                              setShowSettings(false);
                              setError(null);
                           }}
                        >
                           Hủy
                        </Button>
                        <Button onClick={handleSaveApiKey}>Lưu</Button>
                     </div>
                  </CardContent>
               </Card>
            </div>
         )}
      </>
   );
};

export default AssistantChatPopup;
