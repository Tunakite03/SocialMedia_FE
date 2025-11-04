import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
   password: string;
   className?: string;
}

export const PasswordStrength = ({ password, className }: PasswordStrengthProps) => {
   const strength = useMemo(() => {
      if (!password)
         return {
            score: 0,
            label: '',
            color: '',
            checks: { length: false, lowercase: false, uppercase: false, number: false, special: false },
         };

      const checks = {
         length: password.length >= 8,
         lowercase: /[a-z]/.test(password),
         uppercase: /[A-Z]/.test(password),
         number: /\d/.test(password),
         special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };

      const score = Object.values(checks).filter(Boolean).length;

      const strengthMap = {
         0: { label: '', color: '' },
         1: { label: 'Very Weak', color: 'bg-red-500' },
         2: { label: 'Weak', color: 'bg-orange-500' },
         3: { label: 'Fair', color: 'bg-yellow-500' },
         4: { label: 'Good', color: 'bg-blue-500' },
         5: { label: 'Strong', color: 'bg-green-500' },
      };

      return { score, ...strengthMap[score as keyof typeof strengthMap], checks };
   }, [password]);

   if (!password) return null;

   return (
      <div className={cn('space-y-2', className)}>
         <div className='flex space-x-1'>
            {[1, 2, 3, 4, 5].map((level) => (
               <div
                  key={level}
                  className={cn(
                     'h-2 flex-1 rounded-full transition-colors',
                     level <= strength.score ? strength.color : 'bg-gray-200'
                  )}
               />
            ))}
         </div>

         {strength.score > 0 && (
            <div className='space-y-1'>
               <p className='text-xs font-medium text-muted-foreground'>
                  Password strength: <span className='text-foreground'>{strength.label}</span>
               </p>

               <div className='text-xs text-muted-foreground space-y-0.5'>
                  <div
                     className={cn(
                        'flex items-center gap-1',
                        strength.checks.length ? 'text-green-600' : 'text-gray-400'
                     )}
                  >
                     <span className='text-xs'>{strength.checks.length ? '✓' : '○'}</span>
                     At least 8 characters
                  </div>
                  <div
                     className={cn(
                        'flex items-center gap-1',
                        strength.checks.lowercase ? 'text-green-600' : 'text-gray-400'
                     )}
                  >
                     <span className='text-xs'>{strength.checks.lowercase ? '✓' : '○'}</span>
                     Lowercase letter
                  </div>
                  <div
                     className={cn(
                        'flex items-center gap-1',
                        strength.checks.uppercase ? 'text-green-600' : 'text-gray-400'
                     )}
                  >
                     <span className='text-xs'>{strength.checks.uppercase ? '✓' : '○'}</span>
                     Uppercase letter
                  </div>
                  <div
                     className={cn(
                        'flex items-center gap-1',
                        strength.checks.number ? 'text-green-600' : 'text-gray-400'
                     )}
                  >
                     <span className='text-xs'>{strength.checks.number ? '✓' : '○'}</span>
                     Number
                  </div>
                  <div
                     className={cn(
                        'flex items-center gap-1',
                        strength.checks.special ? 'text-green-600' : 'text-gray-400'
                     )}
                  >
                     <span className='text-xs'>{strength.checks.special ? '✓' : '○'}</span>
                     Special character
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
