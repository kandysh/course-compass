import { generateUserAvatarFlow } from '@/ai/flows/generate-user-avatar-flow';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(generateUserAvatarFlow);
