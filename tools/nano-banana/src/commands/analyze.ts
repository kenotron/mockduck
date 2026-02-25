import { toBase64 } from '../image-utils.js';
import { analyzeImage } from '../gemini.js';

export interface AnalyzeArgs {
  imagePath: string;
  prompt: string;
}

export async function runAnalyze(args: AnalyzeArgs): Promise<void> {
  console.error(`Analyzing: ${args.imagePath}`);

  const { data, mimeType } = toBase64(args.imagePath);
  const result = await analyzeImage(data, mimeType, args.prompt);

  console.log(result);
}
