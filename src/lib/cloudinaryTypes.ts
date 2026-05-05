export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  gravity?: 'auto' | 'face' | 'center';
}