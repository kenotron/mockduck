import { writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { combineImages, toBase64 } from '../image-utils.js';
import { generateImage } from '../gemini.js';

export interface OverlayArgs {
  imagePaths: string[];
  prompt: string;
  output: string;
  gap: number;
}

export async function runOverlay(args: OverlayArgs): Promise<void> {
  const tempPath = join(tmpdir(), `nano-banana-combined-${Date.now()}.png`);

  try {
    // Step 1: Combine images side-by-side
    console.error(`Combining ${args.imagePaths.length} images...`);
    await combineImages(args.imagePaths, tempPath, args.gap);

    // Step 2: Load combined image as base64
    const { data: combinedBase64, mimeType: combinedMime } = toBase64(tempPath);

    // Step 3: Send to Gemini for annotated image generation
    console.error(`Sending to Gemini with prompt: "${args.prompt}"...`);
    const result = await generateImage(args.prompt, combinedBase64, combinedMime);

    // Step 4: Write output
    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, Buffer.from(result.data, 'base64'));

    console.log(args.output);
    console.error(`Done. Saved to: ${args.output}`);
  } finally {
    // Clean up temp file
    try { unlinkSync(tempPath); } catch { /* ignore */ }
  }
}
