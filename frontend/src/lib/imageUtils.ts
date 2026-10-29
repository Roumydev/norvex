import api from './api';

export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// رابط صورة العقار (عام، بدون توكن)
export const imageUrl = (id: string) => `${api.defaults.baseURL}/property-images/${id}`;

// نصغّرو الصورة في المتصفح قبل الرفع (أقصى 1280px، JPEG) باش تبقى خفيفة وتدخل في حد 2MB
export async function compressImage(file: File, maxSide = 1280, quality = 0.82): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.fillStyle = '#fff'; // PNG شفافة => خلفية بيضاء
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) throw new Error('toBlob failed');
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // إذا ما قدرناش نصغّرو، نبعتو الأصلي (الـbackend يتحقق منو)
  }
}
