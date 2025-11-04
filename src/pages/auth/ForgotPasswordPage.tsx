import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, Sparkles, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/authService';
import animeCityImg from '@/assets/anime/anime-city-5e869e.png';
import animeCharacterImg from '@/assets/anime/anime-character-4403e6.png';

const forgotPasswordSchema = z.object({
   email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [isSuccess, setIsSuccess] = useState(false);

   const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
   } = useForm<ForgotPasswordFormData>({
      resolver: zodResolver(forgotPasswordSchema),
   });

   const email = watch('email');

   const onSubmit = async (data: ForgotPasswordFormData) => {
      setIsLoading(true);
      setError(null);

      try {
         const response = await authService.forgotPassword(data.email);

         if (response.success) {
            setIsSuccess(true);
         } else {
            setError(response.error || 'Failed to send reset email');
         }
      } catch (err) {
         setError('Network error. Please try again.');
         console.error('Forgot password error:', err);
      } finally {
         setIsLoading(false);
      }
   };

   if (isSuccess) {
      return (
         <div className='min-h-screen flex bg-linear-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden'>
            {/* Animated background elements */}
            <div className='absolute inset-0 pointer-events-none'>
               <div className='absolute top-0 right-0 w-1/4 h-3/4 opacity-10 anime-float hidden lg:block'>
                  <img
                     src={animeCharacterImg}
                     alt='Anime Character'
                     className='w-full h-full object-cover'
                  />
               </div>

               <Sparkles className='absolute top-20 left-20 w-6 h-6 text-primary/40 anime-pulse' />
               <Heart className='absolute bottom-20 right-20 w-5 h-5 text-red-400/30 anime-bounce' />
            </div>

            <div className='flex-1 flex items-center justify-center relative z-10 p-4'>
               <div className='w-full max-w-md'>
                  <div className='card-anime p-8 text-center anime-slide-in-left'>
                     <div className='mx-auto w-16 h-16 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-6 anime-bounce'>
                        <CheckCircle className='w-8 h-8 text-white' />
                     </div>

                     <h1 className='font-heading text-3xl text-gradient-anime mb-4'>Check your email! ✨</h1>

                     <p className='font-anime text-muted-foreground mb-6 leading-relaxed'>
                        We've sent a password reset link to <strong className='text-primary'>{email}</strong>
                     </p>

                     <div className='space-y-4'>
                        <p className='text-sm font-anime text-muted-foreground'>
                           Didn't receive the email? Check your spam folder or{' '}
                           <button
                              onClick={() => setIsSuccess(false)}
                              className='text-primary hover:opacity-80 font-medium anime-hover-scale'
                           >
                              try again
                           </button>
                        </p>

                        <Link to='/login'>
                           <button className='btn-anime-secondary w-full anime-hover-lift'>
                              <ArrowLeft className='w-4 h-4 mr-2' />
                              Back to sign in
                           </button>
                        </Link>
                     </div>
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
                  className='w-full h-full object-cover'
               />
            </div>

            <div className='absolute top-16 right-16 w-6 h-6 bg-primary/20 rounded-full anime-bounce'></div>
            <div className='absolute bottom-20 left-20 w-8 h-8 bg-secondary/15 rounded-full anime-pulse'></div>

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
                     <div className='mx-auto w-16 h-16 bg-linear-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6 anime-pulse'>
                        <Mail className='w-8 h-8 text-white' />
                     </div>

                     <h1 className='font-heading text-3xl text-gradient-anime mb-2'>Forgot password? 🤔</h1>

                     <p className='font-anime text-muted-foreground'>No worries, we'll send you reset instructions</p>
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
                           {...register('email')}
                           type='email'
                           label='Email'
                           placeholder='Enter your email address'
                           error={errors.email?.message}
                           className='font-anime'
                           leftIcon={<Mail className='w-4 h-4' />}
                        />
                     </div>

                     <div
                        className='anime-slide-in-left'
                        style={{ animationDelay: '0.6s' }}
                     >
                        <button
                           type='submit'
                           className='btn-anime-primary w-full anime-hover-lift disabled:opacity-50 disabled:cursor-not-allowed'
                           disabled={isLoading}
                        >
                           {isLoading ? (
                              <div className='flex items-center justify-center gap-2'>
                                 <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                                 Sending instructions...
                              </div>
                           ) : (
                              'Send reset instructions'
                           )}
                        </button>
                     </div>
                  </form>

                  <div
                     className='mt-8 text-center anime-slide-in-right'
                     style={{ animationDelay: '0.9s' }}
                  >
                     <Link
                        to='/login'
                        className='text-sm font-anime text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 anime-hover-scale'
                     >
                        <ArrowLeft className='w-3 h-3' />
                        Back to sign in
                     </Link>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ForgotPasswordPage;
