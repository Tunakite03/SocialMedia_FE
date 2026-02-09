/**
 * Script to download FER+ ONNX emotion model
 * Run: node scripts/download-emotion-model.js
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FER+ model from ONNX Model Zoo
const MODEL_URL = 'https://github.com/onnx/models/raw/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx';
const MODEL_PATH = join(__dirname, '..', 'public', 'models', 'emotion-ferplus-8.onnx');

async function downloadModel() {
   try {
      console.log('📥 Downloading FER+ ONNX model...');
      console.log('URL:', MODEL_URL);
      console.log('Destination:', MODEL_PATH);

      // Ensure directory exists
      const modelDir = dirname(MODEL_PATH);
      if (!existsSync(modelDir)) {
         mkdirSync(modelDir, { recursive: true });
      }

      // Download model
      const response = await fetch(MODEL_URL);
      
      if (!response.ok) {
         throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      writeFileSync(MODEL_PATH, Buffer.from(buffer));

      console.log('✅ Model downloaded successfully!');
      console.log('📊 Size:', (buffer.byteLength / 1024 / 1024).toFixed(2), 'MB');
   } catch (error) {
      console.error('❌ Error downloading model:', error);
      process.exit(1);
   }
}

downloadModel();
