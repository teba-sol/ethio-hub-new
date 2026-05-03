import 'dotenv/config';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dmhu32ya9';
const API_KEY = process.env.CLOUDINARY_API_KEY || 'gNVn72-0QktfvO1CwBU_Kx4ljk0';

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

interface ImageResult {
  localPath: string;
  cloudinaryUrl: string;
  success: boolean;
  error?: string;
}

const results: ImageResult[] = [];

async function uploadToCloudinary(filePath: string, folder: string): Promise<ImageResult> {
  try {
    const fileBuffer = readFileSync(filePath);
    const filename = filePath.split(/[\\/]/).pop() || 'image';
    const ext = filename.split('.').pop() || 'jpg';
    
    // Determine resource type
    const isVideo = ['mp4', 'webm', 'mov'].includes(ext.toLowerCase());
    const resourceType = isVideo ? 'video' : 'image';
    
    const timestamp = Math.round(Date.now() / 1000);
    
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { 
      type: isVideo ? `video/${ext}` : `image/${ext}` 
    }));
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('folder', `ethio-hub/${folder}`);
    formData.append('public_id', `${folder}/${filename.replace(/\.[^.]+$/, '')}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData as any,
      }
    );

    const result = await response.json();

    if (result.secure_url) {
      return {
        localPath: filePath,
        cloudinaryUrl: result.secure_url,
        success: true,
      };
    } else {
      return {
        localPath: filePath,
        cloudinaryUrl: '',
        success: false,
        error: result.error?.message || 'Upload failed',
      };
    }
  } catch (error) {
    return {
      localPath: filePath,
      cloudinaryUrl: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function getAllFiles(dir: string, baseDir: string = ''): Promise<string[]> {
  const files: string[] = [];
  const items = readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const relativePath = baseDir ? `${baseDir}/${item.name}` : item.name;
    
    if (item.isDirectory()) {
      const subFiles = await getAllFiles(join(dir, item.name), relativePath);
      files.push(...subFiles);
    } else {
      const ext = item.name.split('.').pop()?.toLowerCase() || '';
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];
      const videoExts = ['mp4', 'webm', 'mov'];
      
      if ([...imageExts, ...videoExts].includes(ext)) {
        files.push(relativePath);
      }
    }
  }
  
  return files;
}

async function migrate() {
  console.log('='.repeat(50));
  console.log('CLOUDINARY MIGRATION SCRIPT');
  console.log('='.repeat(50));
  console.log(`Cloud Name: ${CLOUD_NAME}`);
  console.log(`Uploads Dir: ${UPLOADS_DIR}`);
  console.log('');

  // Get all image files
  const files = await getAllFiles(UPLOADS_DIR);
  console.log(`Found ${files.length} files to upload`);
  console.log('');

  // Process in batches of 5
  const batchSize = 5;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`Processing ${i + 1}-${Math.min(i + batchSize, files.length)} of ${files.length}...`);
    
    const promises = batch.map(async (file) => {
      const fullPath = join(UPLOADS_DIR, file);
      const folder = file.split(/[\\/]/)[0];
      const result = await uploadToCloudinary(fullPath, folder);
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`  ✓ ${file}`);
      } else {
        failCount++;
        console.log(`  ✗ ${file}: ${result.error}`);
      }
    });
    
    await Promise.all(promises);
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('MIGRATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Total: ${files.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  // Save results to JSON
  writeFileSync(
    join(process.cwd(), 'cloudinary-migration-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('');
  console.log('Results saved to cloudinary-migration-results.json');
}

migrate().catch(console.error);