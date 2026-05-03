import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'festivals';

    if (!file || !file.name) {
      return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
    }

    const allowedFolders = ['festivals', 'avatars', 'products', 'hotels'];
    const safeFolder = allowedFolders.includes(folder) ? folder : 'festivals';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to local first
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
    const filePath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    const localUrl = `/uploads/${safeFolder}/${filename}`;
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const uploadPreset = 'ethio-hub';

    let cloudinaryUrl = '';
    let cloudinarySuccess = false;

    // Upload to Cloudinary using unsigned preset
    if (cloudName && apiKey) {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        
        const formDataUpload = new FormData();
        formDataUpload.append('file', new Blob([buffer], { type: file.type }));
        formDataUpload.append('api_key', apiKey);
        formDataUpload.append('timestamp', timestamp.toString());
        formDataUpload.append('upload_preset', uploadPreset);
        formDataUpload.append('folder', `ethio-hub/${safeFolder}`);

        const cloudResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: 'POST',
          body: formDataUpload,
        });

        const cloudResult = await cloudResponse.json();
        
        if (cloudResult.secure_url) {
          cloudinaryUrl = cloudResult.secure_url;
          cloudinarySuccess = true;
          console.log('Uploaded to Cloudinary:', cloudinaryUrl);
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError);
      }
    }
    
    return NextResponse.json({
      success: true,
      url: cloudinarySuccess && cloudinaryUrl ? cloudinaryUrl : localUrl,
      localUrl: localUrl,
      cloudinaryUrl: cloudinaryUrl,
      source: cloudinarySuccess ? 'cloudinary' : 'local',
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, message: 'File upload failed due to a server error.' }, { status: 500 });
  }
}