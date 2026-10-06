const imageTypes = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/bmp': 'bmp', 'image/x-icon': 'ico',
  'image/svg+xml': 'svg', 'image/avif': 'avif',
} as const;

export type ImageMime = keyof typeof imageTypes;

function detectImageType(bytes: Uint8Array): ImageMime | null {
  const startsWith = (...prefix: number[]) => prefix.every((byte, index) => bytes[index] === byte);
  const header = new TextDecoder().decode(bytes.subarray(0, 512));
  if (startsWith(137, 80, 78, 71, 13, 10, 26, 10)) return 'image/png';
  if (startsWith(255, 216, 255)) return 'image/jpeg';
  if (/^GIF8[79]a/.test(header)) return 'image/gif';
  if (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') return 'image/webp';
  if (header.startsWith('BM')) return 'image/bmp';
  if (startsWith(0, 0, 1, 0)) return 'image/x-icon';
  if (header.slice(4, 8) === 'ftyp' && /avif|avis/.test(header.slice(8, 40))) return 'image/avif';
  if (/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|>)/i.test(header)) return 'image/svg+xml';
  return null;
}

export function decodeBase64Image(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Please enter an image Base64 string.');
  let encoded = trimmed;
  if (/^data:/i.test(trimmed)) {
    const match = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]*)$/i.exec(trimmed);
    if (!match) throw new Error('Use an image data URL with Base64 encoding.');
    encoded = match[2];
  }
  encoded = encoded.replace(/\s/g, '');
  if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 === 1 || (encoded.includes('=') && encoded.length % 4 !== 0)) {
    throw new Error('Invalid Base64 string.');
  }
  let binary: string;
  try { binary = atob(encoded); } catch { throw new Error('Invalid Base64 string.'); }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const mime = detectImageType(bytes);
  if (!mime) throw new Error('Unsupported image. Use PNG, JPEG, GIF, WebP, SVG, BMP, ICO or AVIF.');
  // Trust the file signature rather than a potentially incorrect data URL MIME type.
  const base64 = btoa(binary);
  return { blob: new Blob([bytes], { type: mime }), dataUrl: `data:${mime};base64,${base64}`, base64, extension: imageTypes[mime] };
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Files without a known browser MIME type can still be identified by their bytes.
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.slice(reader.result.indexOf(',') + 1)) : reject(new Error('Unable to read the image.'));
    reader.onerror = () => reject(new Error('Unable to read the image.'));
    reader.readAsDataURL(file);
  });
}

export function validateImage(dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('The image is damaged or cannot be displayed by this browser.'));
    image.src = dataUrl;
  });
}
