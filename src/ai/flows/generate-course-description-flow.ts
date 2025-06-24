"use server";
/**
 * @fileOverview Genkit flow to generate course descriptions using AI.
 *
 * - generateCourseDescriptionFlow - The Genkit flow definition.
 * - GenerateCourseDescriptionInput - The input type for the flow.
 * - GenerateCourseDescriptionOutput - The return type for the flow.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

const GenerateCourseDescriptionInputSchema = z.object({
  courseName: z.string().describe("The name of the course."),
});
export type GenerateCourseDescriptionInput = z.infer<
  typeof GenerateCourseDescriptionInputSchema
>;

const GenerateCourseDescriptionOutputSchema = z.object({
  description: z.string().describe("The AI-generated course description."),
});
export type GenerateCourseDescriptionOutput = z.infer<
  typeof GenerateCourseDescriptionOutputSchema
>;

const prompt = ai.definePrompt({
  name: "generateCourseDescriptionPrompt",
  input: { schema: GenerateCourseDescriptionInputSchema },
  output: { schema: GenerateCourseDescriptionOutputSchema },
  prompt: `You are an expert curriculum developer and copywriter.
Given the course name: "{{{courseName}}}", generate a compelling and informative course description.
The description should be suitable for a course catalog, highlighting key learning outcomes and benefits for students.
Keep the description concise, ideally 2-4 sentences long.
Focus on making the course sound engaging and valuable.
Output only the description text.`,
});

export const generateCourseDescriptionFlow = ai.defineFlow(
  {
    name: "generateCourseDescriptionFlow",
    inputSchema: GenerateCourseDescriptionInputSchema,
    outputSchema: GenerateCourseDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.description) {
      throw new Error("AI failed to generate a description.");
    }
    return output;
  },
);
