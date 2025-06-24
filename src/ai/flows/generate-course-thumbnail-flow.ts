"use server";
/**
 * @fileOverview Genkit flow to generate course thumbnail images using AI.
 * The output is a data URI which can be stored in the thumbnail_url TEXT field.
 *
 * - generateCourseThumbnailFlow - The Genkit flow definition.
 * - GenerateCourseThumbnailInput - The input type for the flow.
 * - GenerateCourseThumbnailOutput - The return type for the flow.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateCourseThumbnailInputSchema = z.object({
  courseName: z
    .string()
    .describe("The name of the course for which to generate a thumbnail."),
});
export type GenerateCourseThumbnailInput = z.infer<
  typeof GenerateCourseThumbnailInputSchema
>;

const GenerateCourseThumbnailOutputSchema = z.object({
  imageDataUri: z.string().describe("The AI-generated image as a data URI."),
});
export type GenerateCourseThumbnailOutput = z.infer<
  typeof GenerateCourseThumbnailOutputSchema
>;

export const generateCourseThumbnailFlow = ai.defineFlow(
  {
    name: "generateCourseThumbnailFlow",
    outputSchema: GenerateCourseThumbnailOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      prompt: `Generate a visually appealing and relevant thumbnail image for an online course titled "${input.courseName}". The image should be suitable for a course catalog, professional, and engaging for potential students. Avoid including any text directly in the image. Focus on creating a clear, high-quality graphic suitable for a course thumbnail. Output a single image.`,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    if (!media?.url) {
      throw new Error(
        "AI failed to generate an image or return a valid data URI.",
      );
    }
    return { imageDataUri: media.url };
  },
);
