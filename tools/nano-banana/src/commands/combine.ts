import { combineImages } from '../image-utils.js';

export interface CombineArgs {
  imagePaths: string[];
  output: string;
  gap: number;
}

export async function runCombine(args: CombineArgs): Promise<void> {
  console.error(`Combining ${args.imagePaths.length} images side-by-side (gap: ${args.gap}px)...`);

  await combineImages(args.imagePaths, args.output, args.gap);

  console.log(args.output);
  console.error(`Done. Saved to: ${args.output}`);
}
