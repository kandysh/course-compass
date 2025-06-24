import { generateCourseDescriptionFlow } from '@/ai/flows/generate-course-description-flow';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(generateCourseDescriptionFlow);
