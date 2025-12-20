
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = () => !!CLOUDINARY_CLOUD_NAME && !!CLOUDINARY_UPLOAD_PRESET;

interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment variables.');
  }

  const { folder = 'grouptherapy', resourceType = 'auto' } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function uploadToCloudinaryWithProgress(
  file: File,
  options: UploadOptions = {},
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment variables.');
  }

  const { folder = 'grouptherapy', resourceType = 'auto' } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Add chunk upload support for large files (>100MB)
    if (file.size > 100 * 1024 * 1024) {
      formData.append('chunk_size', '6000000'); // 6MB chunks
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (e) {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        const errorMsg = xhr.responseText || 'Upload failed';
        reject(new Error(errorMsg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timeout')));

    // Set timeout to 10 minutes for large files
    xhr.timeout = 600000;

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
    xhr.send(formData);
  });
}

export async function uploadImage(
  file: File,
  folder: string = 'images',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) {
    return uploadToCloudinaryWithProgress(file, { folder, resourceType: 'image' }, onProgress);
  }
  return uploadToCloudinary(file, { folder, resourceType: 'image' });
}

export async function uploadVideo(
  file: File,
  folder: string = 'videos',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) {
    return uploadToCloudinaryWithProgress(file, { folder, resourceType: 'video' }, onProgress);
  }
  return uploadToCloudinary(file, { folder, resourceType: 'video' });
}

export async function uploadAudio(
  file: File,
  folder: string = 'audio',
  onProgress?: (progress: number) => void
): Promise<string> {
  if (onProgress) {
    return uploadToCloudinaryWithProgress(file, { folder, resourceType: 'video' }, onProgress);
  }
  return uploadToCloudinary(file, { folder, resourceType: 'video' });
}
