import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.warn(
    'GEMINI_API_KEY is not set. Genkit-related functionality will be disabled.'
  );
}

export const ai = genkit({
  plugins: [
    ...(geminiApiKey ? [googleAI({apiKey: geminiApiKey})] : []),
  ],
});
