import { GoogleGenAI } from '@google/genai';

const MODEL_VISION = 'gemini-2.0-flash';
const MODEL_IMAGE_GEN = 'gemini-2.0-flash-preview-image-generation';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set.\n' +
      'Export it before running: export GEMINI_API_KEY="your-key-here"\n' +
      'Get a key at: https://aistudio.google.com/apikey'
    );
  }
  return new GoogleGenAI({ apiKey });
}

export interface ImageResult {
  data: string;   // base64
  mimeType: string;
}

/**
 * Generate an image from a text prompt.
 * Optionally pass a reference image (base64 + mimeType) for image-to-image generation.
 */
export async function generateImage(
  prompt: string,
  refImageBase64?: string,
  refMime?: string
): Promise<ImageResult> {
  const ai = getClient();

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  if (refImageBase64 && refMime) {
    parts.push({ inlineData: { data: refImageBase64, mimeType: refMime } });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: MODEL_IMAGE_GEN,
    contents: [{ parts }],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates returned from Gemini image generation.');
  }

  const contentParts = candidates[0].content?.parts ?? [];
  for (const part of contentParts) {
    if (part.inlineData?.data && part.inlineData?.mimeType) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
  }

  // Surface any text the model returned for debugging
  const textParts = contentParts
    .filter((p) => p.text)
    .map((p) => p.text)
    .join('\n');

  throw new Error(
    `Gemini did not return an image.\n` +
    (textParts ? `Model said: ${textParts}` : 'No additional info from model.')
  );
}

/**
 * Analyze an image and return a text description.
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  prompt: string = 'Describe this image in detail.'
): Promise<string> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL_VISION,
    contents: [
      {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt },
        ],
      },
    ],
  });

  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates returned from Gemini.');
  }

  const text = candidates[0].content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Gemini returned no text analysis.');
  }

  return text;
}
