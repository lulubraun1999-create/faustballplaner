'use server';

/**
 * @fileOverview An AI agent to generate a brief summary of a Faustball match.
 *
 * - generateMatchSummary - A function that generates the match summary.
 * - GenerateMatchSummaryInput - The input type for the generateMatchSummary function.
 * - GenerateMatchSummaryOutput - The return type for the generateMatchSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMatchSummaryInputSchema = z.object({
  team1Name: z.string().describe('The name of the first team.'),
  team2Name: z.string().describe('The name of the second team.'),
  scoreTeam1: z.number().describe('The score of the first team.'),
  scoreTeam2: z.number().describe('The score of the second team.'),
  keyMoments: z.string().describe('Description of the key moments in the match.'),
  playerPerformances: z.string().describe('Description of the player performances in the match.'),
});
export type GenerateMatchSummaryInput = z.infer<typeof GenerateMatchSummaryInputSchema>;

const GenerateMatchSummaryOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the match.'),
});
export type GenerateMatchSummaryOutput = z.infer<typeof GenerateMatchSummaryOutputSchema>;

export async function generateMatchSummary(
  input: GenerateMatchSummaryInput
): Promise<GenerateMatchSummaryOutput> {
  return generateMatchSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMatchSummaryPrompt',
  input: {schema: GenerateMatchSummaryInputSchema},
  output: {schema: GenerateMatchSummaryOutputSchema},
  prompt: `You are an expert Faustball commentator.

  Based on the provided information, generate a brief summary of the match, highlighting key moments and player performances.

  Team 1: {{team1Name}}
  Team 2: {{team2Name}}
  Score - Team 1: {{scoreTeam1}}, Team 2: {{scoreTeam2}}
  Key Moments: {{keyMoments}}
  Player Performances: {{playerPerformances}}

  Summary:`,
});

const generateMatchSummaryFlow = ai.defineFlow(
  {
    name: 'generateMatchSummaryFlow',
    inputSchema: GenerateMatchSummaryInputSchema,
    outputSchema: GenerateMatchSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
