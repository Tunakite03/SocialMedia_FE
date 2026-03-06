import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin as useGoogleOAuth } from '@react-oauth/google';
import { useAuthStore } from '@/store';
import { useRegister, useGoogleLogin } from '@/hooks';
import { Input } from '@/components/ui/input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { Eye, EyeOff, Github, UserPlus, Heart, Stars, Sparkles } from 'lucide-react';
import animeCityImg from '@/assets/anime/anime-city-5e869e.png';
import animeCharacterImg from '@/assets/anime/anime-character-4403e6.png';
import { Button } from '@/components/ui/button';

const registerSchema = z
   .object({
      email: z.string().email('Invalid email address'),
      username: z.string().min(3, 'Username must be at least 3 characters'),
      displayName: z.string().min(2, 'Display name must be at least 2 characters'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      confirmPassword: z.string(),
   })
   .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
   });

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirm, setShowConfirm] = useState(false);
   const navigate = useNavigate();
   const { login } = useAuthStore();
   const { register: registerUser, loading: isLoading, error } = useRegister();
   const { googleLogin, loading: googleLoading, error: googleError } = useGoogleLogin();

   const handleGoogleSignup = useGoogleOAuth({
      onSuccess: async (tokenResponse) => {
         try {
            const result = await googleLogin(tokenResponse.access_token);
            login(result.user, result.accessToken, result.refreshToken);
            navigate('/');
         } catch (err) {
            console.error('Google signup error:', err);
         }
      },
      onError: () => {
         console.error('Google signup failed');
      },
   });

   const {
      register,
      handleSubmit,
      formState: { errors },
      watch,
   } = useForm<RegisterFormData>({
      resolver: zodResolver(registerSchema),
   });

   const passwordVal = watch('password');

   const onSubmit = async (data: RegisterFormData) => {
      try {
         // Remove confirmPassword from payload before sending to API
         const { confirmPassword, ...registerData } = data;
         const result = await registerUser(registerData);

         // Update auth store
         login(result.user, result.accessToken, result.refreshToken);

         // Connect to socket
         // socketService.connect(result.accessToken);

         // Navigate to dashboard
         navigate('/');
      } catch (err: any) {
         console.error('Registration error:', err);
      }
   };
   return (
      <div className='min-h-screen flex bg-linear-to-br from-secondary/5 via-background to-primary/5 relative overflow-hidden'>
         {/* Animated background elements */}
         <div className='absolute inset-0 pointer-events-none'>
            {/* Anime character on the right */}
            <div className='absolute top-0 right-0 w-1/4 h-3/4 opacity-15 anime-float hidden lg:block'>
               <img
                  src={animeCharacterImg}
                  alt='Anime Character'
                  className=' object-fit object-left'
               />
            </div>

            {/* Anime city background on the left */}
            <div
               className='absolute bottom-0 left-0 w-1/3 h-full opacity-10 anime-float hidden lg:block'
               style={{ animationDelay: '1s' }}
            >
               <img
                  src={animeCityImg}
                  alt='Anime City'
                  className='object-fit object-right'
               />
            </div>

            {/* Floating decorative elements */}
            <Sparkles className='absolute top-16 right-20 w-8 h-8  anime-bounce'></Sparkles>
            <Sparkles className='absolute top-32 left-32 w-6 h-6  anime-float'></Sparkles>

            {/* Sparkle effects */}
            <Sparkles
               className='absolute top-24 right-1/3 w-5 h-5 text-primary/40 anime-pulse'
               style={{ animationDelay: '2s' }}
            />
            <Stars
               className='absolute bottom-32 left-1/3 w-4 h-4 text-secondary/40 anime-bounce'
               style={{ animationDelay: '1.5s' }}
            />
            <Heart
               className='absolute top-1/2 left-16 w-3 h-3 text-red-400/30 anime-pulse'
               style={{ animationDelay: '3s' }}
            />
         </div>

         {/* Main content */}
         <div className='flex-1 flex items-center justify-center relative z-10 p-4 py-8'>
            <div className='w-full max-w-md space-y-6'>
               {/* Enhanced header */}
               <div className='text-center anime-slide-in-left'>
                  <div className='mb-4 relative'>
                     <h1 className='font-heading text-4xl md:text-5xl text-gradient-anime mb-2'>Join with Us! 🌸</h1>
                  </div>
               </div>

               {/* Enhanced form card */}
               <div
                  className='card-anime p-6 '
                  style={{ animationDelay: '0.3s' }}
               >
                  <form
                     onSubmit={handleSubmit(onSubmit)}
                     className='space-y-5'
                  >
                     {error && (
                        <div className='bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm font-anime anime-shake'>
                           {error}
                        </div>
                     )}

                     {googleError && (
                        <div className='bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm font-anime anime-shake'>
                           {googleError}
                        </div>
                     )}

                     <div className='space-y-4'>
                        <div className=''>
                           <Input
                              {...register('email')}
                              type='email'
                              label='Email'
                              placeholder='Enter your email'
                              error={errors.email?.message}
                              className='font-anime'
                           />
                        </div>

                        <div className=''>
                           <Input
                              {...register('username')}
                              type='text'
                              label='Username'
                              placeholder='Choose a cool username'
                              error={errors.username?.message}
                              className='font-anime'
                           />
                        </div>

                        <div className=''>
                           <Input
                              {...register('displayName')}
                              type='text'
                              label='Display Name'
                              placeholder='How should we call you?'
                              error={errors.displayName?.message}
                              className='font-anime'
                           />
                        </div>

                        <div className=''>
                           <Input
                              {...register('password')}
                              type={showPassword ? 'text' : 'password'}
                              label='Password'
                              placeholder='Create a strong password'
                              error={errors.password?.message}
                              className='font-anime'
                              rightIcon={
                                 <button
                                    type='button'
                                    tabIndex={-1}
                                    onClick={() => setShowPassword((s) => !s)}
                                    className='p-1 text-muted-foreground hover:text-foreground anime-hover-scale'
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                 >
                                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                                 </button>
                              }
                           />

                           <div className='mt-2'>
                              <PasswordStrength password={passwordVal || ''} />
                           </div>
                        </div>

                        <div className=''>
                           <Input
                              {...register('confirmPassword')}
                              type={showConfirm ? 'text' : 'password'}
                              label='Confirm Password'
                              placeholder='Confirm your password'
                              error={errors.confirmPassword?.message}
                              className='font-anime'
                              rightIcon={
                                 <button
                                    type='button'
                                    tabIndex={-1}
                                    onClick={() => setShowConfirm((s) => !s)}
                                    className='p-1 text-muted-foreground hover:text-foreground anime-hover-scale'
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                 >
                                    {showConfirm ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                                 </button>
                              }
                           />
                        </div>
                     </div>

                     <div
                        className='space-y-4 anime-slide-in-right'
                        style={{ animationDelay: '0.5s' }}
                     >
                        <button
                           type='submit'
                           className='btn-anime-primary w-full anime-hover-lift disabled:opacity-50 disabled:cursor-not-allowed'
                           disabled={isLoading}
                        >
                           {isLoading ? (
                              <div className='flex items-center justify-center gap-2'>
                                 <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                                 Creating account...
                              </div>
                           ) : (
                              <div className='flex items-center justify-center gap-2'>
                                 <UserPlus className='w-4 h-4' />
                                 Create account
                              </div>
                           )}
                        </button>

                        <div className='flex items-center gap-3 my-4'>
                           <div className='flex-1 h-px bg-border' />
                           <span className='text-xs font-anime text-muted-foreground'>or sign up with</span>
                           <div className='flex-1 h-px bg-border' />
                        </div>

                        <div className='flex gap-3'>
                           <Button
                              variant='outline'
                              type='button'
                              className='flex-1 anime-hover-lift'
                              onClick={() => {
                                 /* TODO: social signup */
                              }}
                           >
                              <Github className='w-4 h-4 mr-2' />
                              GitHub
                           </Button>
                           <Button
                              variant='outline'
                              type='button'
                              className='flex-1 anime-hover-lift'
                              disabled={googleLoading}
                              onClick={() => handleGoogleSignup()}
                           >
                              <UserPlus className='w-4 h-4 mr-2' />
                              {googleLoading ? 'Signing up...' : 'Google'}
                           </Button>
                        </div>
                     </div>
                  </form>
               </div>

               {/* Enhanced footer */}
               <div
                  className='text-center anime-slide-in-left'
                  style={{ animationDelay: '0.7s' }}
               >
                  <p className='text-sm font-anime text-muted-foreground'>
                     Already have an account?{' '}
                     <Link
                        to='/login'
                        className='font-medium text-gradient-anime hover:opacity-80 transition-opacity anime-hover-scale'
                     >
                        Welcome back, otaku! ✨
                     </Link>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default RegisterPage;
