"use server";
/**
 * @fileOverview Genkit flow to generate user avatar images using AI.
 * The output is a data URI which can be stored in the avatar_url TEXT field of the users table.
 *
 * - generateUserAvatarFlow - The Genkit flow definition.
 * - GenerateUserAvatarInput - The input type for the flow.
 * - GenerateUserAvatarOutput - The return type for the flow.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateUserAvatarInputSchema = z.object({
  username: z
    .string()
    .describe("The username of the user for whom to generate an avatar."),
});
export type GenerateUserAvatarInput = z.infer<
  typeof GenerateUserAvatarInputSchema
>;

const GenerateUserAvatarOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe("The AI-generated avatar image as a data URI."),
});
export type GenerateUserAvatarOutput = z.infer<
  typeof GenerateUserAvatarOutputSchema
>;

export const generateUserAvatarFlow = ai.defineFlow(
  {
    name: "generateUserAvatarFlow",
    inputSchema: GenerateUserAvatarInputSchema,
    outputSchema: GenerateUserAvatarOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      prompt: `Generate a unique, abstract, and professional avatar for a user named "${input.username}".
      The avatar should be suitable for a profile picture in an educational platform.
      It should be visually appealing and generic enough not to imply specific traits. Avoid including any text or letters directly in the image.
      Focus on creating a clean, modern, and friendly graphic. Output a single square image.`,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    if (!media?.url) {
      throw new Error(
        "AI failed to generate an avatar image or return a valid data URI.",
      );
    }
    return { imageDataUri: media.url };
  },
);
