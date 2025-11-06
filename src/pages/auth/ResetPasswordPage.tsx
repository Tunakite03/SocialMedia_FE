import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Sparkles, Heart, Eye, EyeOff, CheckIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useResetPassword } from '@/hooks';
import animeCityImg from '@/assets/anime/anime-city-5e869e.png';
import animeCharacterImg from '@/assets/anime/anime-character-4403e6.png';

const resetPasswordSchema = z
   .object({
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
   })
   .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
   });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
   const [searchParams] = useSearchParams();
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
   const { resetPassword, loading: isLoading } = useResetPassword();

   const token = searchParams.get('token');

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<ResetPasswordFormData>({
      resolver: zodResolver(resetPasswordSchema),
   });

   useEffect(() => {
      if (!token) {
         setError('Invalid or missing reset token. Please request a new password reset.');
      }
   }, [token]);

   const onSubmit = async (data: ResetPasswordFormData) => {
      if (!token) return;

      try {
         await resetPassword(token, data.newPassword);
         setIsSuccess(true);
      } catch (err: any) {
         console.error('Reset password error:', err);
      }
   };

   if (!token) {
      return (
         <div className='min-h-screen flex bg-linear-to-br from-destructive/5 via-background to-secondary/5 relative overflow-hidden'>
            <div className='flex-1 flex items-center justify-center relative z-10 p-4'>
               <div className='w-full max-w-md'>
                  <div className='card-anime p-8 text-center anime-slide-in-left'>
                     <div className='mx-auto w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-6'>
                        <Lock className='w-8 h-8 text-destructive' />
                     </div>

                     <h1 className='font-heading text-3xl text-gradient-anime mb-4'>Invalid Link</h1>

                     <p className='font-anime text-muted-foreground mb-6 leading-relaxed'>
                        This password reset link is invalid or has expired.
                     </p>

                     <Link to='/forgot-password'>
                        <button className='btn-anime-secondary w-full anime-hover-lift'>Request New Reset Link</button>
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   if (isSuccess) {
      return (
         <div className='min-h-screen flex bg-linear-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden'>
            {/* Animated background elements */}
            <div className='absolute inset-0 pointer-events-none'>
               <div className='absolute top-0 right-0 w-1/4 h-3/4 opacity-10 anime-float hidden lg:block'>
                  <img
                     src={animeCharacterImg}
                     alt='Anime Character'
                     className='object-fit'
                  />
               </div>

               <Sparkles className='absolute top-20 left-20 w-6 h-6 text-primary/40 anime-pulse' />
               <Heart className='absolute bottom-20 right-20 w-5 h-5 text-red-400/30 anime-bounce' />
            </div>

            <div className='flex-1 flex items-center justify-center relative z-10 p-4'>
               <div className='w-full max-w-md'>
                  <div className='card-anime p-8 text-center anime-slide-in-left'>
                     <div className='mx-auto w-16 h-16 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 anime-bounce'>
                        <CheckIcon className='w-8 h-8 text-white' />
                     </div>

                     <h1 className='font-heading text-3xl text-gradient-anime mb-4'>Password Reset! </h1>

                     <p className='font-anime text-muted-foreground mb-6 leading-relaxed'>
                        Your password has been successfully reset. You can now sign in with your new password.
                     </p>

                     <Link to='/login'>
                        <button className='btn-anime-primary flex items-center justify-center w-full anime-hover-lift'>
                           <ArrowLeft className='w-4 h-4 mr-2' />
                           Back to sign in
                        </button>
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className='min-h-screen flex bg-linear-to-br from-secondary/5 via-background to-primary/5 relative overflow-hidden'>
         {/* Animated background elements */}
         <div className='absolute inset-0 pointer-events-none'>
            <div className='absolute bottom-0 left-0 w-1/3 h-full opacity-10 anime-float hidden lg:block'>
               <img
                  src={animeCityImg}
                  alt='Anime City'
                  className='object-fit'
               />
            </div>

            <Sparkles
               className='absolute top-32 right-1/3 w-5 h-5 text-secondary/40 anime-pulse'
               style={{ animationDelay: '1s' }}
            />
            <Heart
               className='absolute bottom-32 left-1/3 w-4 h-4 text-red-400/30 anime-bounce'
               style={{ animationDelay: '2s' }}
            />
         </div>

         <div className='flex-1 flex items-center justify-center relative z-10 p-4'>
            <div className='w-full max-w-md'>
               <div className='card-anime p-8 anime-slide-in-left'>
                  <div className='text-center mb-8'>
                     <div className='mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 anime-pulse'>
                        <Lock className='w-8 h-8 text-white' />
                     </div>

                     <h1 className='font-heading text-3xl text-gradient-anime mb-2'>Reset your password 🔒</h1>

                     <p className='font-anime text-muted-foreground'>Enter your new password below</p>
                  </div>

                  <form
                     onSubmit={handleSubmit(onSubmit)}
                     className='space-y-6'
                  >
                     {error && (
                        <div className='bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm font-anime anime-shake'>
                           {error}
                        </div>
                     )}

                     <div
                        className='anime-slide-in-right'
                        style={{ animationDelay: '0.3s' }}
                     >
                        <Input
                           {...register('newPassword')}
                           type={showNewPassword ? 'text' : 'password'}
                           label='New Password'
                           placeholder='Enter your new password'
                           error={errors.newPassword?.message}
                           className='font-anime'
                           leftIcon={<Lock className='w-4 h-4' />}
                           rightIcon={
                              <button
                                 type='button'
                                 onClick={() => setShowNewPassword(!showNewPassword)}
                                 className='text-muted-foreground hover:text-foreground'
                              >
                                 {showNewPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                              </button>
                           }
                        />
                     </div>

                     <div
                        className='anime-slide-in-left'
                        style={{ animationDelay: '0.6s' }}
                     >
                        <Input
                           {...register('confirmPassword')}
                           type={showConfirmPassword ? 'text' : 'password'}
                           label='Confirm New Password'
                           placeholder='Confirm your new password'
                           error={errors.confirmPassword?.message}
                           className='font-anime'
                           leftIcon={<Lock className='w-4 h-4' />}
                           rightIcon={
                              <button
                                 type='button'
                                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                 className='text-muted-foreground hover:text-foreground'
                              >
                                 {showConfirmPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                              </button>
                           }
                        />
                     </div>

                     <div
                        className='anime-slide-in-right'
                        style={{ animationDelay: '0.9s' }}
                     >
                        <button
                           type='submit'
                           className='btn-anime-primary w-full anime-hover-lift disabled:opacity-50 disabled:cursor-not-allowed'
                           disabled={isLoading}
                        >
                           {isLoading ? (
                              <div className='flex items-center justify-center gap-2'>
                                 <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                                 Resetting password...
                              </div>
                           ) : (
                              'Reset Password'
                           )}
                        </button>
                     </div>
                  </form>

                  <div
                     className='mt-8 text-center anime-slide-in-left'
                     style={{ animationDelay: '1.2s' }}
                  >
                     <Link
                        to='/login'
                        className='text-sm font-anime text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 anime-hover-scale'
                     >
                        <ArrowLeft className='w-5 h-5' />
                        Back to sign in
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ResetPasswordPage;
