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

    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeFolder);
    const filePath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFolder}/${filename}`;
    
    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, message: 'File upload failed due to a server error.' }, { status: 500 });
  }
}