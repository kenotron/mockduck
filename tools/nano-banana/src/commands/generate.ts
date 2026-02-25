import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { generateImage } from '../gemini.js';

export interface GenerateArgs {
  prompt: string;
  output: string;
}

export async function runGenerate(args: GenerateArgs): Promise<void> {
  console.error(`Generating image for prompt: "${args.prompt}"...`);

  const result = await generateImage(args.prompt);

  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, Buffer.from(result.data, 'base64'));

  console.log(args.output);
  console.error(`Done. Saved to: ${args.output}`);
}
