const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_URL_BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

const FILES = [
   'tiny_face_detector_model-weights_manifest.json',
   'tiny_face_detector_model-shard1',
   'face_expression_model-weights_manifest.json',
   'face_expression_model-shard1',
   'face_landmark_68_model-weights_manifest.json',
   'face_landmark_68_model-shard1',
];

console.log('📦 Starting download of face-api.js models...\n');

// Create models directory
if (!fs.existsSync(MODELS_DIR)) {
   fs.mkdirSync(MODELS_DIR, { recursive: true });
   console.log('✓ Created models directory:', MODELS_DIR, '\n');
} else {
   console.log('✓ Models directory exists:', MODELS_DIR, '\n');
}

let completed = 0;
let failed = 0;

// Download files
FILES.forEach((file) => {
   const url = MODEL_URL_BASE + file;
   const dest = path.join(MODELS_DIR, file);

   // Check if file already exists
   if (fs.existsSync(dest)) {
      console.log(`⏭️  ${file} already exists, skipping...`);
      completed++;
      if (completed + failed === FILES.length) {
         printSummary();
      }
      return;
   }

   console.log(`⬇️  Downloading ${file}...`);

   const fileStream = fs.createWriteStream(dest);
   https
      .get(url, (response) => {
         if (response.statusCode !== 200) {
            console.error(`❌ Failed to download ${file}: HTTP ${response.statusCode}`);
            fs.unlink(dest, () => {});
            failed++;
            if (completed + failed === FILES.length) {
               printSummary();
            }
            return;
         }

         response.pipe(fileStream);
         fileStream.on('finish', () => {
            fileStream.close();
            const stats = fs.statSync(dest);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`✅ ${file} downloaded successfully (${fileSizeInMB} MB)`);
            completed++;
            if (completed + failed === FILES.length) {
               printSummary();
            }
         });

         fileStream.on('error', (err) => {
            fs.unlink(dest, () => {});
            console.error(`❌ Error writing ${file}:`, err.message);
            failed++;
            if (completed + failed === FILES.length) {
               printSummary();
            }
         });
      })
      .on('error', (err) => {
         fs.unlink(dest, () => {});
         console.error(`❌ Error downloading ${file}:`, err.message);
         failed++;
         if (completed + failed === FILES.length) {
            printSummary();
         }
      });
});

function printSummary() {
   console.log('\n═══════════════════════════════════════════');
   console.log('📊 Download Summary:');
   console.log(`   ✅ Completed: ${completed}/${FILES.length}`);
   if (failed > 0) {
      console.log(`  Failed: ${failed}/${FILES.length}`);
   }
   console.log('═══════════════════════════════════════════\n');

   if (failed === 0) {
      console.log('🎉 All models downloaded successfully!');
      console.log('You can now use emotion detection in your video calls.\n');
   } else {
      console.log(' Some models failed to download.');
      console.log('Please try running the script again or download manually.\n');
      process.exit(1);
   }
}
