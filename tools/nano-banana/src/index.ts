import { runGenerate } from './commands/generate.js';
import { runAnalyze } from './commands/analyze.js';
import { runGenerateFrom } from './commands/generate-from.js';
import { runCombine } from './commands/combine.js';
import { runOverlay } from './commands/overlay.js';

const USAGE = `
nano-banana — Gemini-powered image CLI for UI mockup workflows

USAGE
  nano-banana <command> [options]

COMMANDS
  generate <prompt> --output <path>
    Generate an image from a text prompt.

  analyze <image-path> [--prompt <text>]
    Analyze an image and return a text description.
    Default prompt: "Describe this image in detail."

  generate-from <image-path> <prompt> --output <path>
    Generate a new image using a reference image + prompt.

  combine <img1> <img2> [img3] --output <path> [--gap <px>]
    Combine 2-3 images side-by-side. No AI. Default gap: 16px.

  overlay <img1> <img2> [img3] --prompt <text> --output <path> [--gap <px>]
    Combine images, then use Gemini to generate an annotated version.

ENVIRONMENT
  GEMINI_API_KEY  Required. Get one at https://aistudio.google.com/apikey

EXAMPLES
  nano-banana generate "a dark-mode login form" --output login.png
  nano-banana analyze login.png --prompt "what framework would suit this?"
  nano-banana generate-from login.png "add a forgot password link" --output v2.png
  nano-banana combine login.png v2.png --output comparison.png
  nano-banana overlay login.png v2.png --prompt "annotate the UI changes" --output annotated.png
`.trim();

function parseArgs(argv: string[]): {
  command: string;
  positionals: string[];
  flags: Record<string, string | boolean>;
} {
  const positionals: string[] = [];
  const flags: Record<string, string | boolean> = {};
  let i = 0;

  const command = argv[i++] ?? '';

  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
    } else {
      positionals.push(arg);
      i += 1;
    }
  }

  return { command, positionals, flags };
}

function requireFlag(flags: Record<string, string | boolean>, name: string): string {
  const val = flags[name];
  if (typeof val !== 'string' || !val) {
    console.error(`Error: --${name} is required.`);
    process.exit(1);
  }
  return val;
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log(USAGE);
    process.exit(0);
  }

  const { command, positionals, flags } = parseArgs(argv);

  try {
    switch (command) {
      case 'generate': {
        const prompt = positionals[0];
        if (!prompt) { console.error('Error: <prompt> is required.'); process.exit(1); }
        await runGenerate({ prompt, output: requireFlag(flags, 'output') });
        break;
      }

      case 'analyze': {
        const imagePath = positionals[0];
        if (!imagePath) { console.error('Error: <image-path> is required.'); process.exit(1); }
        const prompt = typeof flags['prompt'] === 'string'
          ? flags['prompt']
          : 'Describe this image in detail.';
        await runAnalyze({ imagePath, prompt });
        break;
      }

      case 'generate-from': {
        const imagePath = positionals[0];
        const prompt = positionals[1];
        if (!imagePath) { console.error('Error: <image-path> is required.'); process.exit(1); }
        if (!prompt) { console.error('Error: <prompt> is required.'); process.exit(1); }
        await runGenerateFrom({ imagePath, prompt, output: requireFlag(flags, 'output') });
        break;
      }

      case 'combine': {
        if (positionals.length < 2) {
          console.error('Error: at least 2 image paths are required.');
          process.exit(1);
        }
        const gap = flags['gap'] ? parseInt(flags['gap'] as string, 10) : 16;
        await runCombine({ imagePaths: positionals, output: requireFlag(flags, 'output'), gap });
        break;
      }

      case 'overlay': {
        if (positionals.length < 2) {
          console.error('Error: at least 2 image paths are required.');
          process.exit(1);
        }
        const gap = flags['gap'] ? parseInt(flags['gap'] as string, 10) : 16;
        await runOverlay({
          imagePaths: positionals,
          prompt: requireFlag(flags, 'prompt'),
          output: requireFlag(flags, 'output'),
          gap,
        });
        break;
      }

      default:
        console.error(`Unknown command: "${command}"\n`);
        console.log(USAGE);
        process.exit(1);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${msg}`);
    process.exit(1);
  }
}

main();
