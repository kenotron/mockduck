import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { generateImage } from '../gemini.js';
import { toBase64 } from '../image-utils.js';

export interface GenerateFromArgs {
  imagePath: string;
  prompt: string;
  output: string;
}

export async function runGenerateFrom(args: GenerateFromArgs): Promise<void> {
  console.error(`Generating from reference "${args.imagePath}" with prompt: "${args.prompt}"...`);

  const { data: refData, mimeType: refMime } = toBase64(args.imagePath);
  const result = await generateImage(args.prompt, refData, refMime);

  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, Buffer.from(result.data, 'base64'));

  console.log(args.output);
  console.error(`Done. Saved to: ${args.output}`);
}
