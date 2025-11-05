import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Github, LogIn, Stars, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store';
import { authService } from '@/services/authService';
import { socketService } from '@/services/socketService';
import animeCityImg from '@/assets/anime/anime-city-5e869e.png';
import animeCharacterImg from '@/assets/anime/anime-character-4403e6.png';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
   email: z.string().email('Invalid email address'),
   password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [showPassword, setShowPassword] = useState(false);
   const navigate = useNavigate();
   const { login } = useAuthStore();

   const {
      register,
      handleSubmit,
      formState: { errors },
   } = useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
   });

   const onSubmit = async (data: LoginFormData) => {
      setIsLoading(true);
      setError(null);

      try {
         const response = await authService.login(data);

         if (response.success) {
            // Update auth store
            login(response.data.user, response.data.token);

            // Connect to socket
            socketService.connect(response.data.token);

            // Navigate to dashboard
            navigate('/');
         } else {
            setError(response.error || 'Login failed');
         }
      } catch (err) {
         setError('Network error. Please try again.');
         console.error('Login error:', err);
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <div className='min-h-screen flex bg-linear-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden'>
         {/* Animated background elements */}
         <div className='absolute inset-0 pointer-events-none'>
            {/* Floating anime city background */}
            <div className='absolute top-0 right-0 w-1/3 h-full opacity-10 anime-float hidden lg:block'>
               <img
                  src={animeCityImg}
                  alt='Anime City'
                  className='object-fit object-left'
               />
            </div>

            {/* Anime character on the left */}
            <div
               className='absolute bottom-0 left-0 w-1/4 h-3/4 opacity-15 anime-float hidden lg:block'
               style={{ animationDelay: '1s' }}
            >
               <img
                  src={animeCharacterImg}
                  alt='Anime Character'
                  className=' object-fit object-right'
               />
            </div>

            {/* Floating decorative elements */}
            <Sparkles className='absolute top-20 left-20 w-5 h-5   anime-bounce'></Sparkles>
            <Sparkles className='absolute bottom-32 right-20 w-5 h-5  anime-pulse'></Sparkles>

            {/* Sparkle effects */}
            <Sparkles
               className='absolute top-25 left-1/3 w-5 h-5 text-black anime-pulse'
               style={{ animationDelay: '2s' }}
            />
            <Stars
               className='absolute bottom-40 right-1/3 w-4 h-4 text-black anime-bounce'
               style={{ animationDelay: '1.5s' }}
            />
         </div>

         {/* Main content */}
         <div className='flex-1 flex items-center justify-center relative z-10 p-4'>
            <div className='w-full max-w-md space-y-8'>
               {/* Enhanced header */}
               <div className='text-center anime-slide-in-left'>
                  <div className='mb-4 relative'>
                     <p className='font-anime text-lg text-muted-foreground'>Sign in to continue your anime journey</p>
                  </div>
               </div>

               {/* Enhanced form card */}
               <div
                  className='card-anime p-8 anime-slide-in-right'
                  style={{ animationDelay: '0.3s' }}
               >
                  <form
                     onSubmit={handleSubmit(onSubmit)}
                     className='space-y-6'
                  >
                     {error && (
                        <div className='bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm font-anime anime-shake'>
                           {error}
                        </div>
                     )}

                     <div className='space-y-4'>
                        <div
                           className='anime-slide-in-left'
                           style={{ animationDelay: '0.6s' }}
                        >
                           <Input
                              {...register('email')}
                              type='email'
                              label='Email'
                              placeholder='Enter your email'
                              error={errors.email?.message}
                              className='font-anime'
                           />
                        </div>

                        <div
                           className='anime-slide-in-right'
                           style={{ animationDelay: '0.7s' }}
                        >
                           <Input
                              {...register('password')}
                              type={showPassword ? 'text' : 'password'}
                              label='Password'
                              placeholder='Enter your password'
                              error={errors.password?.message}
                              className='font-anime'
                              rightIcon={
                                 <button
                                    type='button'
                                    onClick={() => setShowPassword((s) => !s)}
                                    className='p-1 text-muted-foreground hover:text-foreground anime-hover-scale'
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                 >
                                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                                 </button>
                              }
                           />
                        </div>
                     </div>

                     <div
                        className='flex items-center justify-end gap-4 anime-slide-in-left'
                        style={{ animationDelay: '0.8s' }}
                     >
                        <Link
                           to='/forgot-password'
                           className='text-sm font-anime text-muted-foreground hover:text-primary transition-colors anime-hover-scale'
                        >
                           Forgot password?
                        </Link>
                     </div>

                     <div
                        className='space-y-4 anime-slide-in-right'
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
                                 Signing in...
                              </div>
                           ) : (
                              <div className='flex items-center justify-center gap-2'>
                                 <LogIn className='w-4 h-4' />
                                 Sign in
                              </div>
                           )}
                        </button>

                        <div className='flex items-center gap-3 my-4'>
                           <div className='flex-1 h-px bg-border' />
                           <span className='text-xs font-anime text-muted-foreground'>or continue with</span>
                           <div className='flex-1 h-px bg-border' />
                        </div>

                        <div className='flex gap-3'>
                           <Button
                              variant='outline'
                              type='button'
                              className='flex-1 '
                              onClick={() => {
                                 /* TODO: social login */
                              }}
                           >
                              <Github className='w-4 h-4 mr-2' />
                              GitHub
                           </Button>
                           <Button
                              variant='outline'
                              type='button'
                              className='flex-1 '
                              onClick={() => {
                                 /* TODO: social login */
                              }}
                           >
                              <LogIn className='w-4 h-4 mr-2' />
                              Google
                           </Button>
                        </div>
                     </div>
                  </form>
               </div>

               {/* Enhanced footer */}
               <div
                  className='text-center anime-slide-in-left'
                  style={{ animationDelay: '1.2s' }}
               >
                  <p className='text-sm font-anime text-muted-foreground'>
                     Don't have an account?{' '}
                     <Link
                        to='/register'
                        className='font-medium text-black hover:opacity-80 transition-opacity anime-hover-scale'
                     >
                        Join our anime community! 🌸
                     </Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default LoginPage;
