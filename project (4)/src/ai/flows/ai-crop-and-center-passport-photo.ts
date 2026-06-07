/**
 * @fileOverview This file implements a Genkit flow for automatically cropping and centering a photo.
 * Optimized for client-side execution in static builds.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AICropAndCenterPassportPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AICropAndCenterPassportPhotoInput = z.infer<
  typeof AICropAndCenterPassportPhotoInputSchema
>;

const AICropAndCenterPassportPhotoOutputSchema = z.object({
  croppedPhotoDataUri: z
    .string()
    .describe(
      "The automatically cropped and centered passport photo, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  message: z.string().optional().describe('Any message or feedback from the AI.'),
});
export type AICropAndCenterPassportPhotoOutput = z.infer<
  typeof AICropAndCenterPassportPhotoOutputSchema
>;

const cropPrompt = ai.definePrompt({
  name: 'aiCropAndCenterPassportPhotoPrompt',
  input: { schema: AICropAndCenterPassportPhotoInputSchema },
  output: { schema: AICropAndCenterPassportPhotoOutputSchema },
  prompt: `You are an expert at processing photos for official ID documents.

Your task is to take the provided image, automatically detect the face, and then precisely crop and center the photo to meet standard passport photo requirements.

Adhere to the following guidelines:
- The final image should have an aspect ratio suitable for common passport photos (e.g., 35x45mm).
- The head should occupy approximately 70-80% of the vertical frame height.
- The face must be centered horizontally and vertically.
- Return the processed image as a data URI.

Input Photo: {{media url=photoDataUri}}`,
});

/**
 * Orchestrates the passport photo cropping and centering flow.
 * No longer a server action; runs on the client for static exports.
 */
export async function aiCropAndCenterPassportPhoto(
  input: AICropAndCenterPassportPhotoInput
): Promise<AICropAndCenterPassportPhotoOutput> {
  const { output, media } = await ai.generate({
    model: 'googleai/gemini-2.5-flash-image',
    prompt: [
      { media: { url: input.photoDataUri } },
      { text: cropPrompt.prompt(input) },
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  if (!media || !media.length) {
    throw new Error('No image was returned by the AI model.');
  }

  const croppedPhotoDataUri = media[0].url;
  const message = output?.message || 'Photo successfully cropped and centered.';

  return {
    croppedPhotoDataUri: croppedPhotoDataUri,
    message: message,
  };
}
