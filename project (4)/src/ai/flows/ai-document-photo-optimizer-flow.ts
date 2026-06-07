/**
 * @fileOverview An AI agent that analyzes a photo for ID standards and suggests optimal adjustments.
 * Optimized for client-side execution in static builds.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIDocumentPhotoOptimizerInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe("A photo as a data URI.")
});
export type AIDocumentPhotoOptimizerInput = z.infer<typeof AIDocumentPhotoOptimizerInputSchema>;

const AIDocumentPhotoOptimizerOutputSchema = z.object({
  brightness: z.number().describe('Suggested brightness level (50-150, 100 is neutral).'),
  contrast: z.number().describe('Suggested contrast level (50-150, 100 is neutral).'),
  saturation: z.number().describe('Suggested saturation level (0-200, 100 is neutral).'),
  lightingAnalysis: z.string().describe('Analysis of the photo\'s lighting.'),
  overallRecommendation: z.string().describe('Summary recommendation.'),
});
export type AIDocumentPhotoOptimizerOutput = z.infer<typeof AIDocumentPhotoOptimizerOutputSchema>;

const photoOptimizerPrompt = ai.definePrompt({
  name: 'documentPhotoOptimizerPrompt',
  input: { schema: AIDocumentPhotoOptimizerInputSchema },
  output: { schema: AIDocumentPhotoOptimizerOutputSchema },
  prompt: `You are an expert AI assistant specializing in optimizing photos for official ID documents.
Analyze the provided photo and provide specific suggested numeric values for Brightness, Contrast, and Saturation where 100 is neutral/no change.

If the photo is too dark, increase brightness (e.g., 115). If it lacks depth, increase contrast.

Photo: {{media url=photoDataUri}}`,
});

/**
 * Orchestrates the document photo optimization flow.
 * No longer a server action; runs on the client for static exports.
 */
export async function aiDocumentPhotoOptimizer(input: AIDocumentPhotoOptimizerInput): Promise<AIDocumentPhotoOptimizerOutput> {
  const { output } = await photoOptimizerPrompt(input);
  if (!output) throw new Error("AI failed to provide an analysis.");
  return output;
}
