import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InstagramLayout from '@/components/layout/InstagramLayout';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { usePostStore } from '@/store/postStore';
import { PrivacySelector } from '@/components/features/privacy/PrivacySelector';
import { Camera, Image as ImageIcon, X, FileText, Upload, ArrowLeft, Send } from 'lucide-react';
import type { PostFormData } from '@/types';

interface PreviewMedia {
   file: File;
   url: string;
   type: 'image' | 'video';
}

const CreatePage = () => {
   const navigate = useNavigate();
   const fileInputRef = useRef<HTMLInputElement>(null);

   // Form state
   const [content, setContent] = useState('');
   const [postType, setPostType] = useState<'TEXT' | 'IMAGE' | 'VIDEO'>('TEXT');
   const [isPublic, setIsPublic] = useState(true);
   const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);
   const [step, setStep] = useState<'select' | 'compose'>('select');
   const [dragActive, setDragActive] = useState(false);
   const [successMessage, setSuccessMessage] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);

   // Hooks
   const { createPost, loading: creatingPost } = usePostStore();

   // Handle drag and drop
   const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(true);
   }, []);

   const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
   }, []);

   const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (!file) return;

      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
         setError('Please select an image or video file');
         return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
         setError('File size must be less than 5MB');
         return;
      }

      const url = URL.createObjectURL(file);
      setPreviewMedia({
         file,
         url,
         type: isImage ? 'image' : 'video',
      });
      setPostType(isImage ? 'IMAGE' : 'VIDEO');
      setError(null); // Clear any previous errors
      setStep('compose');
   }, []);

   // Handle file selection
   const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
         setError('Please select an image or video file');
         return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
         setError('File size must be less than 5MB');
         return;
      }

      const url = URL.createObjectURL(file);
      setPreviewMedia({
         file,
         url,
         type: isImage ? 'image' : 'video',
      });
      setPostType(isImage ? 'IMAGE' : 'VIDEO');
      setError(null); // Clear any previous errors
      setStep('compose');
   }, []);

   // Handle media removal
   const handleRemoveMedia = useCallback(() => {
      if (previewMedia) {
         URL.revokeObjectURL(previewMedia.url);
         setPreviewMedia(null);
         setPostType('TEXT');
      }
   }, [previewMedia]);

   // Handle post creation
   const handleCreatePost = async () => {
      if (!content.trim() && !previewMedia) {
         setError('Please add some content or media to your post');
         return;
      }

      try {
         setError(null);

         // Create post data with mediaFile instead of uploading separately
         const postData: PostFormData = {
            content: content.trim(),
            type: postType,
            isPublic,
            mediaFile: previewMedia?.file, // Send file directly via FormData
         };

         await createPost(postData);

         // Show success message
         setSuccessMessage('Post created successfully!');

         // Clean up and navigate after a short delay
         setTimeout(() => {
            handleRemoveMedia();
            setContent('');
            setStep('select');
            navigate('/feed', { replace: true });
         }, 1500);
      } catch (error: any) {
         console.error('Failed to create post:', error);
         setError(error?.message || 'Failed to create post. Please try again.');
      }
   };

   // Handle different creation modes
   const handleModeSelect = (mode: 'text' | 'photo' | 'video') => {
      setError(null); // Clear any existing errors
      if (mode === 'text') {
         setPostType('TEXT');
         setStep('compose');
      } else {
         // Trigger file input for photo/video
         fileInputRef.current?.click();
      }
   };

   const canSubmit = (content.trim() || previewMedia) && !creatingPost;

   if (step === 'compose') {
      return (
         <InstagramLayout>
            <div className='p-4 max-w-2xl mx-auto text-foreground'>
               {/* Header */}
               <div className='flex items-center justify-between mb-6'>
                  <Button
                     variant='ghost'
                     size='icon'
                     onClick={() => {
                        handleRemoveMedia();
                        setContent('');
                        setStep('select');
                        setError(null);
                        setSuccessMessage(null);
                     }}
                     className='anime-hover-scale'
                  >
                     <ArrowLeft size={20} />
                  </Button>
                  <h1 className='text-xl font-bold font-anime'>Create Post</h1>
                  {/* Privacy Selector Component */}
                  <PrivacySelector
                     isPublic={isPublic}
                     onChange={setIsPublic}
                     variant='toggle'
                  />
               </div>

               {/* Success Message */}
               {successMessage && (
                  <div className='card-liquid-glass-blue p-4 mb-6 text-center anime-success'>
                     <p className='text-green-600 font-medium'>{successMessage}</p>
                  </div>
               )}

               {/* Error Message */}
               {error && (
                  <div className='card-liquid-glass-pink p-4 mb-6 text-center anime-shake'>
                     <p className='text-red-600 font-medium'>{error}</p>
                     <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setError(null)}
                        className='mt-2'
                     >
                        Dismiss
                     </Button>
                  </div>
               )}

               {/* Main content area */}
               <div className='space-y-6 bg-background'>
                  {/* Media preview */}
                  {previewMedia && (
                     <div className='card-liquid-glass-animate p-4 relative'>
                        <Button
                           variant='ghost'
                           size='icon-sm'
                           onClick={handleRemoveMedia}
                           className='absolute top-2 right-2 z-10 anime-hover-scale'
                        >
                           <X size={16} />
                        </Button>

                        {previewMedia.type === 'image' ? (
                           <img
                              src={previewMedia.url}
                              alt='Preview'
                              className='w-full max-h-96 object-cover rounded-lg'
                           />
                        ) : (
                           <video
                              src={previewMedia.url}
                              controls
                              className='w-full max-h-96 rounded-lg'
                           >
                              Your browser does not support video playback.
                           </video>
                        )}
                     </div>
                  )}

                  {/* Text content */}
                  <div className='card-liquid-glass p-4 flex flex-col'>
                     <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className='w-full flex-1 p-3 bg-transparent border-0 resize-none focus:outline-none placeholder:text-muted-foreground text-base min-h-32'
                        maxLength={500}
                     />
                     <div className='flex justify-between items-center mt-4 pt-3 border-t border-white/10'>
                        <div className='flex items-center gap-2'>
                           <span className='text-xs text-muted-foreground'>{content.length}/500</span>

                           {/* Add media button */}
                           {!previewMedia && (
                              <Button
                                 variant='ghost'
                                 size='sm'
                                 onClick={() => fileInputRef.current?.click()}
                                 className='anime-hover-scale'
                              >
                                 <Camera size={16} />
                                 Add Media
                              </Button>
                           )}
                        </div>

                        <Button
                           onClick={handleCreatePost}
                           disabled={!canSubmit}
                           className='anime-hover-lift anime-button-press'
                           size='sm'
                        >
                           {creatingPost ? (
                              <LoadingSpinner size='sm' />
                           ) : (
                              <>
                                 <Send size={14} />
                                 Share
                              </>
                           )}
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Hidden file input */}
            <input
               ref={fileInputRef}
               type='file'
               accept='image/*,video/*'
               onChange={handleFileSelect}
               className='hidden'
            />
         </InstagramLayout>
      );
   }

   // Selection step
   return (
      <InstagramLayout>
         <div className='text-center p-4'>
            <h1 className='text-2xl font-bold mb-8 font-anime'>Create new post</h1>
            {/* Error Message */}
            {error && (
               <div className='card-liquid-glass-pink p-4 mb-6 text-center anime-shake max-w-sm mx-auto'>
                  <p className='text-red-600 font-medium'>{error}</p>
                  <Button
                     variant='ghost'
                     size='sm'
                     onClick={() => setError(null)}
                     className='mt-2'
                  >
                     Dismiss
                  </Button>
               </div>
            )}

            <div className='space-y-6 max-w-sm mx-auto'>
               {/* Main upload area */}
               <div
                  className={`card-liquid-glass-animate p-8 text-center transition-all duration-300 ${
                     dragActive ? 'card-liquid-glass-blue scale-105' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
               >
                  <Camera
                     size={48}
                     className={`mx-auto mb-4 transition-all duration-300 ${
                        dragActive ? 'text-blue-500 anime-bounce' : 'text-primary anime-pulse'
                     }`}
                  />
                  <p className='text-muted-foreground mb-4 font-anime'>
                     {dragActive ? 'Drop your file here!' : 'Share your moments with the world'}
                  </p>
                  <Button
                     onClick={() => fileInputRef.current?.click()}
                     className='anime-hover-lift anime-button-press'
                     variant={dragActive ? 'default' : 'default'}
                  >
                     <Upload size={16} />
                     {dragActive ? 'Drop here' : 'Select from device'}
                  </Button>
               </div>

               {/* Creation options */}
               <div className='grid grid-cols-2 gap-3 '>
                  <Button
                     variant='outline'
                     onClick={() => handleModeSelect('text')}
                     className='card-liquid-glass p-4 h-auto anime-hover-scale anime-button-press'
                  >
                     <div className='flex items-center gap-3'>
                        <FileText
                           size={24}
                           className='text-primary'
                        />
                        <div className='text-left'>
                           <div className='font-semibold text-foreground'>Text Post</div>
                           <div className='text-sm text-muted-foreground'>Share your thoughts</div>
                        </div>
                     </div>
                  </Button>

                  <Button
                     variant='outline'
                     onClick={() => handleModeSelect('photo')}
                     className='card-liquid-glass p-4 h-auto anime-hover-scale anime-button-press'
                  >
                     <div className='flex items-center gap-3 '>
                        <ImageIcon
                           size={24}
                           className='text-primary'
                        />
                        <div className='text-left'>
                           <div className='font-semibold text-foreground'>Photo Post</div>
                           <div className='text-sm text-muted-foreground'>Share images</div>
                        </div>
                     </div>
                  </Button>

                  {/* <Button
                        variant='outline'
                        onClick={() => handleModeSelect('video')}
                        className='card-liquid-glass p-4 h-auto anime-hover-scale anime-button-press'
                     >
                        <div className='flex items-center gap-3'>
                           <Video
                              size={24}
                              className='text-primary'
                           />
                           <div className='text-left'>
                              <div className='font-semibold'>Video Post</div>
                              <div className='text-sm text-muted-foreground'>Share videos</div>
                           </div>
                        </div>
                     </Button> */}
               </div>
            </div>
         </div>

         {/* Hidden file input */}
         <input
            ref={fileInputRef}
            type='file'
            accept='image/*,video/*'
            onChange={handleFileSelect}
            className='hidden'
         />
      </InstagramLayout>
   );
};

export default CreatePage;
