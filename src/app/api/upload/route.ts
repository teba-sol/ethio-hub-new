import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'festivals';

    if (!file || !file.name) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file provided.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        message: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid file type. Only images and videos are allowed.' 
      }, { status: 400 });
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = 'ethio-hub';

    if (!cloudName) {
      return NextResponse.json({ 
        success: false, 
        message: 'Cloudinary configuration missing.' 
      }, { status: 500 });
    }

    // Upload to Cloudinary using unsigned preset
    try {
      const bytes = await file.arrayBuffer();
      const formDataUpload = new FormData();
      formDataUpload.append('file', new Blob([bytes], { type: file.type }));
      formDataUpload.append('upload_preset', uploadPreset);
      formDataUpload.append('folder', `ethio-hub/${folder}`);

      const cloudResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formDataUpload,
      });

      const cloudResult = await cloudResponse.json();

      if (cloudResult.secure_url) {
        console.log('Uploaded to Cloudinary:', cloudResult.secure_url);
        return NextResponse.json({
          success: true,
          url: cloudResult.secure_url,
          publicId: cloudResult.public_id,
        });
      } else {
        // Cloudinary returned an error
        const errorMsg = cloudResult.error?.message || 'Upload failed';
        return NextResponse.json({ 
          success: false, 
          message: `Cloudinary upload failed: ${errorMsg}` 
        }, { status: 500 });
      }
    } catch (cloudinaryError: any) {
      console.error('Cloudinary upload failed:', cloudinaryError);
      
      // Determine error type for better user message
      let userMessage = 'Upload failed. ';
      if (cloudinaryError.message?.includes('network') || cloudinaryError.code === 'ECONNREFUSED') {
        userMessage += 'Please check your internet connection and try again.';
      } else if (cloudinaryError.message?.includes('timeout')) {
        userMessage += 'Connection timeout. Please try again.';
      } else {
        userMessage += 'Please try again or contact support if the issue persists.';
      }
      
      return NextResponse.json({ 
        success: false, 
        message: userMessage 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'File upload failed due to a server error.' 
    }, { status: 500 });
  }
}
