import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss()],
   resolve: {
      alias: {
         '@': path.resolve(__dirname, './src'),
      },
   },
   server: {
      port: 3000,
      // Removed CORS headers - not needed for face-api.js
      // These headers were blocking Cloudinary images
   },
   build: {
      outDir: path.resolve(__dirname, './dist'),
   },
   css: {
      devSourcemap: true,
   },
   // Optimize WASM and ONNX model files
   optimizeDeps: {
      exclude: ['onnxruntime-web'],
   },
   assetsInclude: ['**/*.onnx', '**/*.wasm'],
});
