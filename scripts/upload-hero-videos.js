import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLOUD_NAME = 'dmhu32ya9';
const UPLOAD_PRESET = 'ethio-hub';

const videos = [
  '14742585_1080_1920_24fps.mp4',
  '3967184-uhd_4096_2160_24fps.mp4',
  '20719516-uhd_3840_2160_25fps.mp4',
];

async function uploadVideo(filename) {
  const filePath = path.join(__dirname, '../public/uploads/videos', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats.size;
  console.log(`Uploading ${filename} (${(fileSizeInBytes / 1024 / 1024).toFixed(2)} MB)...`);
  
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'video/mp4' });
  
  formData.append('file', blob);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'ethio-hub/hero-videos');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();
    if (result.secure_url) {
      console.log(`Successfully uploaded ${filename}: ${result.secure_url}`);
      return result.secure_url;
    } else {
      console.error(`Failed to upload ${filename}:`, result.error);
    }
  } catch (error) {
    console.error(`Error uploading ${filename}:`, error.message);
  }
}

async function main() {
  const results = {};
  for (const video of videos) {
    const url = await uploadVideo(video);
    if (url) {
      results[video] = url;
    }
  }
  console.log('\nResults:');
  console.log(JSON.stringify(results, null, 2));
  
  if (Object.keys(results).length > 0) {
      fs.writeFileSync(path.join(__dirname, 'upload-results.json'), JSON.stringify(results, null, 2));
  }
}

main();
