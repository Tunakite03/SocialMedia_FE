import { useState, useRef, useEffect } from 'react';
import {
   X,
   Camera,
   User,
   Calendar,
   Type,
   MessageSquare,
   Save,
   Loader2,
   Image as ImageIcon,
   Trash2,
} from 'lucide-react';
import { useProfile } from '@/hooks/useAuth';

import type { ProfileFormData } from '@/types';

interface EditProfileModalProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess?: () => void;
}

const EditProfileModal = ({ isOpen, onClose, onSuccess }: EditProfileModalProps) => {
   const { profile, updateProfile, updateAvatar } = useProfile();
   const fileInputRef = useRef<HTMLInputElement>(null);

   // Form state
   const [formData, setFormData] = useState<ProfileFormData>({
      displayName: '',
      bio: '',
      dateOfBirth: '',
      avatar: '',
   });

   // UI state
   const [isLoading, setIsLoading] = useState(false);
   const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [success, setSuccess] = useState(false);
   const [previewAvatar, setPreviewAvatar] = useState<string>('');
   const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
   const [isDragging, setIsDragging] = useState(false);

   // Initialize form data when profile loads or modal opens
   useEffect(() => {
      if (profile && isOpen) {
         setFormData({
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
            avatar: profile.avatar || '',
         });
         setPreviewAvatar(profile.avatar || '');
      }
   }, [profile, isOpen]);

   // Reset form when modal closes
   useEffect(() => {
      if (!isOpen) {
         setError(null);
         setSuccess(false);
         setPreviewAvatar('');
         setFieldErrors({});
      }
   }, [isOpen]);

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
         ...prev,
         [name]: value,
      }));
      setError(null);

      // Real-time field validation
      const errors = { ...fieldErrors };

      if (name === 'displayName') {
         if (!value.trim()) {
            errors.displayName = 'Display name is required';
         } else if (value.trim().length < 2) {
            errors.displayName = 'Must be at least 2 characters';
         } else if (value.trim().length > 50) {
            errors.displayName = 'Must be less than 50 characters';
         } else {
            delete errors.displayName;
         }
      }

      if (name === 'bio') {
         if (value.length > 500) {
            errors.bio = 'Must be less than 500 characters';
         } else {
            delete errors.bio;
         }
      }

      if (name === 'dateOfBirth' && value) {
         const birthDate = new Date(value);
         const today = new Date();
         const minAge = new Date();
         minAge.setFullYear(today.getFullYear() - 13);

         if (birthDate > today) {
            errors.dateOfBirth = 'Cannot be in the future';
         } else if (birthDate > minAge) {
            errors.dateOfBirth = 'Must be at least 13 years old';
         } else {
            delete errors.dateOfBirth;
         }
      }

      setFieldErrors(errors);
   };

   const handleAvatarUpload = async (file: File) => {
      // Validate file
      if (!file.type.startsWith('image/')) {
         setError('Please select an image file');
         return;
      }

      if (file.size > 5 * 1024 * 1024) {
         setError('Image size should be less than 5MB');
         return;
      }

      try {
         setIsUploadingAvatar(true);
         setError(null);

         // Create preview
         const reader = new FileReader();
         reader.onload = (e) => {
            setPreviewAvatar(e.target?.result as string);
         };
         reader.readAsDataURL(file);

         // Upload avatar directly using useProfile hook
         const updatedUser = await updateAvatar(file);

         if (updatedUser) {
            setFormData((prev) => ({
               ...prev,
               avatar: updatedUser.avatar || '',
            }));
            setPreviewAvatar(updatedUser.avatar || '');
         }
      } catch (error) {
         console.error('Avatar upload error:', error);
         setError('Failed to upload avatar. Please try again.');
         setPreviewAvatar(profile?.avatar || '');
      } finally {
         setIsUploadingAvatar(false);
      }
   };

   const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      await handleAvatarUpload(file);

      // Reset file input
      if (event.target) {
         event.target.value = '';
      }
   };

   const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
   };

   const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
   };

   const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith('image/'));

      if (!imageFile) {
         setError('Please drop an image file');
         return;
      }

      await handleAvatarUpload(imageFile);
   };

   // Form validation
   const validateForm = () => {
      const errors: string[] = [];

      // Display name validation
      if (!formData.displayName?.trim()) {
         errors.push('Display name is required');
      } else if (formData.displayName.trim().length < 2) {
         errors.push('Display name must be at least 2 characters');
      } else if (formData.displayName.trim().length > 50) {
         errors.push('Display name must be less than 50 characters');
      }

      // Bio validation
      if (formData.bio && formData.bio.length > 500) {
         errors.push('Bio must be less than 500 characters');
      }

      // Date of birth validation
      if (formData.dateOfBirth) {
         const birthDate = new Date(formData.dateOfBirth);
         const today = new Date();
         const minAge = new Date();
         minAge.setFullYear(today.getFullYear() - 13); // Minimum 13 years old

         if (birthDate > today) {
            errors.push('Date of birth cannot be in the future');
         } else if (birthDate > minAge) {
            errors.push('You must be at least 13 years old');
         }

         const maxAge = new Date();
         maxAge.setFullYear(today.getFullYear() - 150); // Maximum 150 years old
         if (birthDate < maxAge) {
            errors.push('Please enter a valid date of birth');
         }
      }

      return errors;
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!profile) return;

      try {
         setIsLoading(true);
         setError(null);

         // Validate form
         const validationErrors = validateForm();
         if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
         }

         // Prepare profile data (exclude avatar since it's handled separately)
         const profileData = {
            displayName: formData.displayName,
            bio: formData.bio,
            dateOfBirth: formData.dateOfBirth,
         };

         // Update profile (without avatar)
         await updateProfile(profileData);

         setSuccess(true);
         setTimeout(() => {
            onSuccess?.();
            onClose();
         }, 1000);
      } catch (error: any) {
         console.error('Profile update error:', error);
         setError(error.message || 'Failed to update profile');
      } finally {
         setIsLoading(false);
      }
   };

   const triggerAvatarUpload = () => {
      fileInputRef.current?.click();
   };

   const removeAvatar = () => {
      // For now, just update local state since backend may not support avatar removal
      setFormData((prev) => ({
         ...prev,
         avatar: '',
      }));
      setPreviewAvatar('');
      // TODO: Implement avatar removal when backend supports it
   };

   if (!isOpen) return null;

   return (
      <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 anime-slide-in-up '>
         <div className=' w-full bg-background max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border-2 border-white/20'>
            {/* Header */}
            <div className='flex items-center justify-between p-6 border-b border-white/10'>
               <h2 className='text-2xl font-anime font-bold text-white flex items-center gap-3'>
                  <User
                     className='text-indigo-400'
                     size={28}
                  />
                  Edit Profile
               </h2>
               <button
                  onClick={onClose}
                  disabled={isLoading}
                  className='card-liquid-glass-accent p-2 rounded-full anime-hover-scale transition-all hover:bg-red-50 disabled:opacity-50'
               >
                  <X
                     size={24}
                     className='text-hsl(var(--muted-foreground)) hover:text-red-500'
                  />
               </button>
            </div>

            {/* Content */}
            <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
               <form
                  onSubmit={handleSubmit}
                  className='space-y-6'
               >
                  {/* Avatar Section */}
                  <div className='text-center'>
                     <div
                        className={`relative w-32 h-32 mx-auto mb-4 transition-all duration-300 ${
                           isDragging ? 'scale-105 animate-pulse' : ''
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                     >
                        <div
                           className={`w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg transition-all ${
                              isDragging ? 'ring-blue-400 bg-blue-50' : ''
                           }`}
                        >
                           {previewAvatar ? (
                              <img
                                 src={previewAvatar}
                                 alt='Profile preview'
                                 className='w-full h-full object-cover'
                              />
                           ) : (
                              <div className='w-full h-full bg-linear-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-3xl'>
                                 {formData.displayName?.charAt(0)?.toUpperCase() ||
                                    profile?.username?.charAt(0)?.toUpperCase() ||
                                    '?'}
                              </div>
                           )}
                        </div>

                        {/* Upload overlay */}
                        <button
                           type='button'
                           onClick={triggerAvatarUpload}
                           disabled={isUploadingAvatar || isLoading}
                           className='absolute inset-0 bg-black/0 hover:bg-black/60 transition-all duration-300 flex flex-col items-center justify-center rounded-full anime-hover-scale disabled:cursor-not-allowed group'
                           title='Change avatar'
                        >
                           {isUploadingAvatar ? (
                              <div className='bg-black/80 rounded-full p-4'>
                                 <Loader2
                                    size={24}
                                    className='text-white animate-spin'
                                 />
                              </div>
                           ) : isDragging ? (
                              <div className='bg-blue-500/80 rounded-full p-4'>
                                 <ImageIcon
                                    size={24}
                                    className='text-white'
                                 />
                              </div>
                           ) : (
                              <div className='opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-4'>
                                 <Camera
                                    size={24}
                                    className='text-white'
                                 />
                              </div>
                           )}
                        </button>

                        <input
                           ref={fileInputRef}
                           type='file'
                           accept='image/*'
                           onChange={handleFileInput}
                           className='hidden'
                        />
                     </div>
                     <p className='text-sm text-hsl(var(--muted-foreground)) font-anime mb-3'>
                        {isDragging ? (
                           <span className='text-blue-400 font-semibold'>Drop image here to upload</span>
                        ) : (
                           <>Click or drag & drop to change avatar (Max: 5MB)</>
                        )}
                     </p>

                     {/* Remove avatar button */}
                     {(previewAvatar || formData.avatar) && (
                        <button
                           type='button'
                           onClick={removeAvatar}
                           disabled={isUploadingAvatar || isLoading}
                           className='text-xs text-red-400 hover:text-red-500 font-anime flex items-center gap-1 mx-auto transition-colors disabled:opacity-50'
                        >
                           <Trash2 size={14} />
                           Remove Avatar
                        </button>
                     )}
                  </div>

                  {/* Display Name */}
                  <div className='space-y-2'>
                     <label className='flex items-center gap-2 text-sm font-medium text-white'>
                        <Type
                           size={16}
                           className='text-indigo-400'
                        />
                        Display Name
                     </label>
                     <input
                        type='text'
                        name='displayName'
                        value={formData.displayName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className={`w-full px-4 py-3 card-liquid-glass-accent rounded-xl text-hsl(var(--foreground)) placeholder-hsl(var(--muted-foreground)) focus:border-transparent transition-all disabled:opacity-50 font-anime ${
                           fieldErrors.displayName ? 'ring-2 ring-red-500' : ''
                        }`}
                        placeholder='Enter your display name'
                        maxLength={50}
                     />
                     {fieldErrors.displayName ? (
                        <p className='text-xs text-red-400 anime-shake'>{fieldErrors.displayName}</p>
                     ) : (
                        <p className='text-xs text-hsl(var(--muted-foreground))'>
                           {(formData.displayName || '').length}/50 characters
                        </p>
                     )}
                  </div>

                  {/* Bio */}
                  <div className='space-y-2'>
                     <label className='flex items-center gap-2 text-sm font-medium text-white'>
                        <MessageSquare
                           size={16}
                           className='text-purple-400'
                        />
                        Bio
                     </label>
                     <textarea
                        name='bio'
                        value={formData.bio}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        rows={4}
                        className={`w-full px-4 py-3 card-liquid-glass-accent rounded-xl text-hsl(var(--foreground)) placeholder-hsl(var(--muted-foreground))  focus:border-transparent transition-all disabled:opacity-50 font-anime resize-none ${
                           fieldErrors.bio ? 'ring-2 ring-red-500' : ''
                        }`}
                        placeholder='Tell us about yourself...'
                        maxLength={500}
                     />
                     {fieldErrors.bio ? (
                        <p className='text-xs text-red-400 anime-shake'>{fieldErrors.bio}</p>
                     ) : (
                        <p className='text-xs text-hsl(var(--muted-foreground))'>
                           {(formData.bio || '').length}/500 characters
                        </p>
                     )}
                  </div>

                  {/* Date of Birth */}
                  <div className='space-y-2'>
                     <label className='flex items-center gap-2 text-sm font-medium text-white'>
                        <Calendar
                           size={16}
                           className='text-pink-400'
                        />
                        Date of Birth
                     </label>
                     <input
                        type='date'
                        name='dateOfBirth'
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className={`w-full px-4 py-3 card-liquid-glass-accent rounded-xl text-hsl(var(--foreground)) placeholder-hsl(var(--muted-foreground)) transition-all disabled:opacity-50 font-anime ${
                           fieldErrors.dateOfBirth ? 'ring-2 ring-red-500' : ''
                        }`}
                        max={new Date().toISOString().split('T')[0]}
                     />
                     {fieldErrors.dateOfBirth && (
                        <p className='text-xs text-red-400 anime-shake'>{fieldErrors.dateOfBirth}</p>
                     )}
                  </div>

                  {/* Error Message */}
                  {error && (
                     <div className='p-4 bg-red-100 border border-red-300 rounded-xl anime-shake'>
                        <p className='text-red-800 text-sm font-anime'>{error}</p>
                     </div>
                  )}

                  {/* Success Message */}
                  {success && (
                     <div className='p-4 bg-green-100 border border-green-300 rounded-xl anime-bounce'>
                        <p className='text-green-800 text-sm font-anime'>Profile updated successfully!</p>
                     </div>
                  )}

                  {/* Action Buttons */}
                  <div className='flex gap-3 pt-4'>
                     <button
                        type='button'
                        onClick={onClose}
                        disabled={isLoading}
                        className='flex-1 py-3 px-4 card-liquid-glass-blue rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all text-hsl(var(--primary)) disabled:opacity-50'
                     >
                        Cancel
                     </button>
                     <button
                        type='submit'
                        disabled={isLoading || isUploadingAvatar}
                        className='flex-1 py-3 px-4 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-anime font-semibold anime-hover-lift anime-button-press transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                     >
                        {isLoading ? (
                           <>
                              <Loader2
                                 size={20}
                                 className='animate-spin'
                              />
                              Updating...
                           </>
                        ) : (
                           <>
                              <Save size={20} />
                              Save Changes
                           </>
                        )}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
};

export default EditProfileModal;
