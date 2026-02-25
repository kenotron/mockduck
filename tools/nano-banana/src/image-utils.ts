import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, extname } from 'path';
import { PNG } from 'pngjs';
import jpeg from 'jpeg-js';

export interface RawImage {
  data: Buffer;   // raw RGBA pixel data
  width: number;
  height: number;
}

export interface Base64Image {
  data: string;
  mimeType: string;
}

/** Detect mime type from file extension */
function mimeFromPath(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/png';
}

/** Load a PNG or JPEG file into raw RGBA pixels */
export async function loadImage(filePath: string): Promise<RawImage> {
  const buf = readFileSync(filePath);
  const mime = mimeFromPath(filePath);

  if (mime === 'image/jpeg') {
    const decoded = jpeg.decode(buf, { useTArray: false });
    return {
      data: decoded.data as unknown as Buffer,
      width: decoded.width,
      height: decoded.height,
    };
  }

  // Default: treat as PNG
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png.parse(buf, (err, img) => {
      if (err) return reject(err);
      resolve({ data: img.data as unknown as Buffer, width: img.width, height: img.height });
    });
  });
}

/** Encode raw RGBA pixels as a PNG buffer */
function encodeAsPng(raw: RawImage): Buffer {
  const png = new PNG({ width: raw.width, height: raw.height });
  raw.data.copy(png.data);
  return PNG.sync.write(png);
}

/**
 * Combine 2-3 images side-by-side and write the result as a PNG.
 * All images are composited on a white background.
 */
export async function combineImages(
  filePaths: string[],
  outputPath: string,
  gap: number = 16
): Promise<void> {
  if (filePaths.length < 2 || filePaths.length > 3) {
    throw new Error('combine requires 2 or 3 image paths.');
  }

  const images = await Promise.all(filePaths.map(loadImage));

  const totalWidth = images.reduce((sum, img) => sum + img.width, 0) + gap * (images.length - 1);
  const totalHeight = Math.max(...images.map((img) => img.height));

  // Allocate white RGBA canvas
  const canvas = Buffer.alloc(totalWidth * totalHeight * 4, 255);

  let offsetX = 0;
  for (const img of images) {
    // Blit this image onto the canvas row by row
    for (let row = 0; row < img.height; row++) {
      const srcStart = row * img.width * 4;
      const dstStart = (row * totalWidth + offsetX) * 4;
      img.data.copy(canvas, dstStart, srcStart, srcStart + img.width * 4);
    }
    offsetX += img.width + gap;
  }

  const result: RawImage = { data: canvas, width: totalWidth, height: totalHeight };
  const pngBuf = encodeAsPng(result);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, pngBuf);
}

/** Read a file and return base64 + mimeType */
export function toBase64(filePath: string): Base64Image {
  const buf = readFileSync(filePath);
  return {
    data: buf.toString('base64'),
    mimeType: mimeFromPath(filePath),
  };
}

/** Write base64 image data to a file */
export function writeBase64Image(base64: string, mimeType: string, outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
  // If outputPath has no extension, append one
  const finalPath = outputPath.includes('.') ? outputPath : `${outputPath}.${ext}`;
  writeFileSync(finalPath === outputPath ? outputPath : finalPath, Buffer.from(base64, 'base64'));
}
