/**
 * Image Validation Utility
 * Validates actual binary magic bytes for JPEG, PNG, and WebP,
 * enforcing maximum file size and rejecting spoofed or corrupted images.
 */

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageValidationResult {
  isValid: boolean;
  mimeType: AllowedMimeType;
  error?: string;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageBuffer(buffer: Buffer): AllowedMimeType {
  if (!buffer || buffer.length === 0) {
    throw new Error('Image file is empty (0 bytes). Please upload a valid image.');
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `Image file size exceeds the 5 MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`
    );
  }

  if (buffer.length < 12) {
    throw new Error('Image buffer too small to contain valid image headers.');
  }

  // 1. JPEG check: Starts with 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 2. PNG check: Starts with 0x89 'PNG' 0x0D 0x0A 0x1A 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 && // 'P'
    buffer[2] === 0x4e && // 'N'
    buffer[3] === 0x47 && // 'G'
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // 3. WebP check: Starts with 'RIFF' and offset 8-12 is 'WEBP'
  const riffHeader = buffer.subarray(0, 4).toString('ascii');
  const webpHeader = buffer.subarray(8, 12).toString('ascii');
  if (riffHeader === 'RIFF' && webpHeader === 'WEBP') {
    return 'image/webp';
  }

  throw new Error(
    'Invalid image format. Only authentic JPEG, PNG, and WebP images are permitted. File header signature did not match supported types.'
  );
}
