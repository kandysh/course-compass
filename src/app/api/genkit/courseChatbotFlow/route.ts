import { courseChatbotFlow } from '@/ai/flows/course-chatbot';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(courseChatbotFlow);
