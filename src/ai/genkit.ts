import 'dotenv/config';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const geminiApiKey = process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    ...(geminiApiKey ? [googleAI({ apiKey: geminiApiKey })] : []),
  ],
});
