'use server';
/**
 * @fileOverview An AI chatbot for answering student questions about course materials.
 *
 * - courseChatbotFlow - The Genkit flow definition.
 * - CourseChatbotInput - The input type for the courseChatbot function.
 * - CourseChatbotOutput - The return type for the courseChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CourseChatbotInputSchema = z.object({
  question: z.string().describe('The student question about the course materials.'),
  context: z.string().describe('The context from the course documentation.'),
});
export type CourseChatbotInput = z.infer<typeof CourseChatbotInputSchema>;

const CourseChatbotOutputSchema = z.object({
  answer: z.string().describe('The answer to the student question.'),
});
export type CourseChatbotOutput = z.infer<typeof CourseChatbotOutputSchema>;

const prompt = ai.definePrompt({
  name: 'courseChatbotPrompt',
  input: {schema: CourseChatbotInputSchema},
  output: {schema: CourseChatbotOutputSchema},
  prompt: `You are an AI chatbot that helps students with questions about course materials.
  Use the context provided to answer the question accurately and helpfully.

  Context: {{{context}}}

  Question: {{{question}}}
  `,
});

export const courseChatbotFlow =  ai.defineFlow(
  {
    name: 'courseChatbotFlow',
    inputSchema: CourseChatbotInputSchema,
    outputSchema: CourseChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output?.answer) {
        throw new Error("AI failed to generate a valid answer.");
    }
    return output;
  }
);
