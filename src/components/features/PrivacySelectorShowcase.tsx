import React, { useState } from 'react';
import { PrivacySelector } from './PrivacySelector';

/**
 * Privacy Selector - UI Variants Showcase
 *
 * This component demonstrates both variants of the PrivacySelector:
 * 1. Toggle Switch - Compact and quick
 * 2. Dropdown Menu - Detailed and informative
 */

export const PrivacySelectorShowcase: React.FC = () => {
   const [isPublicToggle, setIsPublicToggle] = useState(true);
   const [isPublicDropdown, setIsPublicDropdown] = useState(false);

   return (
      <div className='p-8 max-w-4xl mx-auto space-y-12'>
         <div>
            <h1 className='text-3xl font-bold font-anime mb-2'>Privacy Selector Showcase</h1>
            <p className='text-muted-foreground'>Two beautiful ways to let users choose post privacy</p>
         </div>

         {/* Toggle Variant Section */}
         <section className='space-y-4'>
            <div>
               <h2 className='text-xl font-semibold font-anime mb-1'>Variant 1: Toggle Switch</h2>
               <p className='text-sm text-muted-foreground'>
                  Compact, quick, and perfect for tight spaces. Click to instantly switch between Public and Private.
               </p>
            </div>

            <div className='card-liquid-glass p-6 space-y-4'>
               <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Current State:</span>
                  <span
                     className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isPublicToggle
                           ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                           : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                     }`}
                  >
                     {isPublicToggle ? '🌐 Public' : '🔒 Private'}
                  </span>
               </div>

               <div className='py-8 flex justify-center'>
                  <PrivacySelector
                     isPublic={isPublicToggle}
                     onChange={setIsPublicToggle}
                     variant='toggle'
                  />
               </div>

               <div className='text-xs text-muted-foreground space-y-1'>
                  <p>✓ Single click toggle</p>
                  <p>✓ Visual indicator (blue ↔ amber)</p>
                  <p>✓ Smooth animated transitions</p>
               </div>
            </div>
         </section>

         {/* Dropdown Variant Section */}
         <section className='space-y-4'>
            <div>
               <h2 className='text-xl font-semibold font-anime mb-1'>Variant 2: Dropdown Menu</h2>
               <p className='text-sm text-muted-foreground'>
                  Detailed and informative. Shows descriptions to help users make informed choices.
               </p>
            </div>

            <div className='card-liquid-glass p-6 space-y-4'>
               <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Current State:</span>
                  <span
                     className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isPublicDropdown
                           ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                           : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                     }`}
                  >
                     {isPublicDropdown ? '🌐 Public' : '🔒 Private'}
                  </span>
               </div>

               <div className='py-8 flex justify-center'>
                  <PrivacySelector
                     isPublic={isPublicDropdown}
                     onChange={setIsPublicDropdown}
                     variant='dropdown'
                  />
               </div>

               <div className='text-xs text-muted-foreground space-y-1'>
                  <p>✓ Click to open dropdown</p>
                  <p>✓ Descriptive explanations</p>
                  <p>✓ Detailed privacy information</p>
                  <p>✓ Click outside to close</p>
               </div>
            </div>
         </section>

         {/* Comparison Table */}
         <section className='space-y-4'>
            <h2 className='text-xl font-semibold font-anime'>Comparison</h2>

            <div className='overflow-x-auto'>
               <table className='w-full text-sm border-collapse'>
                  <thead>
                     <tr className='bg-muted/50'>
                        <th className='border border-border px-4 py-2 text-left font-semibold'>Feature</th>
                        <th className='border border-border px-4 py-2 text-center font-semibold'>Toggle</th>
                        <th className='border border-border px-4 py-2 text-center font-semibold'>Dropdown</th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr>
                        <td className='border border-border px-4 py-2'>Speed</td>
                        <td className='border border-border px-4 py-2 text-center'>⚡ Instant</td>
                        <td className='border border-border px-4 py-2 text-center'>⚡ 1 extra click</td>
                     </tr>
                     <tr className='bg-muted/30'>
                        <td className='border border-border px-4 py-2'>Space Required</td>
                        <td className='border border-border px-4 py-2 text-center'>📦 Small</td>
                        <td className='border border-border px-4 py-2 text-center'>📦 Medium</td>
                     </tr>
                     <tr>
                        <td className='border border-border px-4 py-2'>User Education</td>
                        <td className='border border-border px-4 py-2 text-center'>📚 Icon only</td>
                        <td className='border border-border px-4 py-2 text-center'>📚 With descriptions</td>
                     </tr>
                     <tr className='bg-muted/30'>
                        <td className='border border-border px-4 py-2'>Mobile Friendly</td>
                        <td className='border border-border px-4 py-2 text-center'>✅ Yes</td>
                        <td className='border border-border px-4 py-2 text-center'>✅ Yes</td>
                     </tr>
                     <tr>
                        <td className='border border-border px-4 py-2'>Best For</td>
                        <td className='border border-border px-4 py-2 text-center'>Headers, toolbars</td>
                        <td className='border border-border px-4 py-2 text-center'>Forms, detailed UI</td>
                     </tr>
                  </tbody>
               </table>
            </div>
         </section>

         {/* Code Examples */}
         <section className='space-y-4'>
            <h2 className='text-xl font-semibold font-anime'>Usage Examples</h2>

            <div className='space-y-4'>
               {/* Toggle Example */}
               <div className='card-liquid-glass p-4'>
                  <h3 className='font-semibold text-sm mb-3'>Toggle Variant</h3>
                  <pre className='bg-background/50 p-3 rounded text-xs overflow-x-auto'>
                     {`<PrivacySelector
   isPublic={isPublic}
   onChange={setIsPublic}
   variant='toggle'
/>`}
                  </pre>
               </div>

               {/* Dropdown Example */}
               <div className='card-liquid-glass p-4'>
                  <h3 className='font-semibold text-sm mb-3'>Dropdown Variant</h3>
                  <pre className='bg-background/50 p-3 rounded text-xs overflow-x-auto'>
                     {`<PrivacySelector
   isPublic={isPublic}
   onChange={setIsPublic}
   variant='dropdown'
/>`}
                  </pre>
               </div>

               {/* With State */}
               <div className='card-liquid-glass p-4'>
                  <h3 className='font-semibold text-sm mb-3'>Complete Example</h3>
                  <pre className='bg-background/50 p-3 rounded text-xs overflow-x-auto'>
                     {`const [isPublic, setIsPublic] = useState(true);

return (
   <div className='flex items-center gap-4'>
      <label className='text-sm font-medium'>
         Privacy Setting
      </label>
      <PrivacySelector
         isPublic={isPublic}
         onChange={setIsPublic}
         variant='dropdown'
      />
   </div>
);`}
                  </pre>
               </div>
            </div>
         </section>

         {/* Integration Notes */}
         <section className='space-y-4'>
            <h2 className='text-xl font-semibold font-anime'>Integration Notes</h2>

            <div className='card-liquid-glass p-4 space-y-3 text-sm'>
               <div>
                  <h4 className='font-semibold mb-1'>✅ When to use Toggle:</h4>
                  <ul className='list-disc list-inside text-muted-foreground space-y-1'>
                     <li>In post headers (compact space)</li>
                     <li>Quick settings changes</li>
                     <li>Users already understand privacy levels</li>
                     <li>Mobile interfaces with space constraints</li>
                  </ul>
               </div>

               <div>
                  <h4 className='font-semibold mb-1'>✅ When to use Dropdown:</h4>
                  <ul className='list-disc list-inside text-muted-foreground space-y-1'>
                     <li>In forms where clarity is important</li>
                     <li>Onboarding flows</li>
                     <li>New users who need guidance</li>
                     <li>Desktop interfaces with more space</li>
                  </ul>
               </div>
            </div>
         </section>

         {/* Features Highlight */}
         <section className='space-y-4'>
            <h2 className='text-xl font-semibold font-anime'>Key Features</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
               <div className='card-liquid-glass p-4'>
                  <div className='flex items-start gap-3'>
                     <span className='text-xl'>🎨</span>
                     <div>
                        <h3 className='font-semibold text-sm'>Beautiful Design</h3>
                        <p className='text-xs text-muted-foreground mt-1'>
                           Anime-inspired with liquid glass effects and smooth animations
                        </p>
                     </div>
                  </div>
               </div>

               <div className='card-liquid-glass p-4'>
                  <div className='flex items-start gap-3'>
                     <span className='text-xl'>♿</span>
                     <div>
                        <h3 className='font-semibold text-sm'>Accessible</h3>
                        <p className='text-xs text-muted-foreground mt-1'>Semantic HTML with proper ARIA attributes</p>
                     </div>
                  </div>
               </div>

               <div className='card-liquid-glass p-4'>
                  <div className='flex items-start gap-3'>
                     <span className='text-xl'>🚀</span>
                     <div>
                        <h3 className='font-semibold text-sm'>Performant</h3>
                        <p className='text-xs text-muted-foreground mt-1'>
                           Lightweight with CSS transitions, no animation jank
                        </p>
                     </div>
                  </div>
               </div>

               <div className='card-liquid-glass p-4'>
                  <div className='flex items-start gap-3'>
                     <span className='text-xl'>📱</span>
                     <div>
                        <h3 className='font-semibold text-sm'>Responsive</h3>
                        <p className='text-xs text-muted-foreground mt-1'>Works perfectly on all screen sizes</p>
                     </div>
                  </div>
               </div>

               <div className='card-liquid-glass p-4'>
                  <div className='flex items-start gap-3'>
                     <span className='text-xl'>🌓</span>
                     <div>
                        <h3 className='font-semibold text-sm'>Dark Mode</h3>
                        <p className='text-xs text-muted-foreground mt-1'>Automatic theme detection and adjustment</p>
                     </div>
                  </div>
               </div>

               <div className='card-liquid-glass p-4'>
                  <div className='flex items-start gap-3'>
                     <span className='text-xl'>♻️</span>
                     <div>
                        <h3 className='font-semibold text-sm'>Reusable</h3>
                        <p className='text-xs text-muted-foreground mt-1'>Works anywhere you need privacy selection</p>
                     </div>
                  </div>
               </div>
            </div>
         </section>
      </div>
   );
};

export default PrivacySelectorShowcase;
