import { generateCourseThumbnailFlow } from '@/ai/flows/generate-course-thumbnail-flow';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(generateCourseThumbnailFlow);
