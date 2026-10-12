import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateImageBuffer } from '../utils/imageValidation.js';
import {
  extractPrescriptionWithGemini,
  GeminiNotConfiguredError,
} from '../services/geminiService.js';

describe('Prescription Image Validation Tests', () => {
  test('validates authentic JPEG magic bytes', () => {
    // JPEG starts with 0xFF 0xD8 0xFF
    const jpegBuffer = Buffer.alloc(100);
    jpegBuffer[0] = 0xff;
    jpegBuffer[1] = 0xd8;
    jpegBuffer[2] = 0xff;
    jpegBuffer[3] = 0xe0;

    const mime = validateImageBuffer(jpegBuffer);
    assert.equal(mime, 'image/jpeg');
  });

  test('validates authentic PNG magic bytes', () => {
    // PNG starts with 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
    ]);

    const mime = validateImageBuffer(pngBuffer);
    assert.equal(mime, 'image/png');
  });

  test('validates authentic WebP magic bytes', () => {
    // WebP has 'RIFF' at offset 0 and 'WEBP' at offset 8
    const webpBuffer = Buffer.alloc(20);
    webpBuffer.write('RIFF', 0, 'ascii');
    webpBuffer.write('WEBP', 8, 'ascii');

    const mime = validateImageBuffer(webpBuffer);
    assert.equal(mime, 'image/webp');
  });

  test('rejects empty buffer with clear error', () => {
    assert.throws(
      () => validateImageBuffer(Buffer.alloc(0)),
      /Image file is empty/
    );
  });

  test('rejects tiny buffer (< 12 bytes)', () => {
    assert.throws(
      () => validateImageBuffer(Buffer.from([0x01, 0x02, 0x03])),
      /buffer too small/
    );
  });

  test('rejects non-image spoofed content (e.g. text/exe)', () => {
    const textBuffer = Buffer.from('This is a text file claiming to be an image', 'utf-8');
    assert.throws(
      () => validateImageBuffer(textBuffer),
      /Invalid image format/
    );
  });

  test('rejects oversized image (> 5 MB)', () => {
    // 5.5 MB buffer
    const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024);
    assert.throws(
      () => validateImageBuffer(oversizedBuffer),
      /exceeds the 5 MB limit/
    );
  });
});

describe('Gemini Multimodal Service Configuration Tests', () => {
  test('throws GeminiNotConfiguredError when GEMINI_API_KEY is missing or placeholder', async () => {
    const prevKey = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = '';

      const validJpeg = Buffer.alloc(100);
      validJpeg[0] = 0xff;
      validJpeg[1] = 0xd8;
      validJpeg[2] = 0xff;

      await assert.rejects(
        async () => {
          await extractPrescriptionWithGemini(validJpeg, 'image/jpeg');
        },
        (err: any) => {
          assert.equal(err.name, 'GeminiNotConfiguredError');
          assert.equal(err.code, 'GEMINI_NOT_CONFIGURED');
          return true;
        }
      );
    } finally {
      process.env.GEMINI_API_KEY = prevKey;
    }
  });
});
