
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

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

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
