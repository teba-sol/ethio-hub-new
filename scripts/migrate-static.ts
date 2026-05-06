import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';

const CLOUD_NAME = 'dmhu32ya9';
const API_KEY = 'gNVn72-0QktfvO1CwBU_Kx4ljk0';
const UPLOAD_PRESET = 'ethio-hub';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads', 'avatars', 'festivalandproductimage');

const staticImages = [
  'festivalimage1.webp',
  'festivalimage2.avif',
  'event3.webp',
  'product image 1.webp',
  'clothproduct2.webp',
  'product3.webp',
];

async function uploadImage(filename: string) {
  const filePath = join(UPLOADS_DIR, filename);
  const buffer = readFileSync(filePath);
  const ext = filename.split('.').pop() || 'jpg';
  const timestamp = Math.round(Date.now() / 1000);
  
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: `image/${ext === 'avif' ? 'avif' : ext}` }));
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'ethio-hub/avatars/festivalandproductimage');
  formData.append('public_id', `ethio-hub/avatars/festivalandproductimage/${filename.replace(/\.[^.]+$/, '')}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData as any }
  );

  const result = await response.json();
  return result;
}

async function migrate() {
  console.log('Migrating static images to Cloudinary...\n');

  for (const image of staticImages) {
    try {
      console.log(`Uploading: ${image}...`);
      const result = await uploadImage(image);
      
      if (result.secure_url) {
        console.log(`  ✓ Success: ${result.secure_url}`);
      } else {
        console.log(`  ✗ Failed: ${result.error?.message}`);
      }
    } catch (e) {
      console.log(`  ✗ Error: ${e}`);
    }
  }

  console.log('\nDone! Check Cloudinary dashboard to verify.');
}

migrate();