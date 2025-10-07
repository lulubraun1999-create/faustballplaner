'use server';

/**
 * @fileOverview A team statistics analysis AI agent.
 *
 * - analyzeTeamStats - A function that handles the team stats analysis process.
 * - AnalyzeTeamStatsInput - The input type for the analyzeTeamStats function.
 * - AnalyzeTeamStatsOutput - The return type for the analyzeTeamStats function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeTeamStatsInputSchema = z.object({
  teamName: z.string().describe('The name of the team to analyze.'),
  matchData: z.string().describe('Match data for the team, as a JSON string.'),
});
export type AnalyzeTeamStatsInput = z.infer<typeof AnalyzeTeamStatsInputSchema>;

const AnalyzeTeamStatsOutputSchema = z.object({
  strengths: z.string().describe('Identified strengths of the team.'),
  weaknesses: z.string().describe('Identified weaknesses of the team.'),
  suggestedImprovements: z.string().describe('Suggested improvements for the team.'),
});
export type AnalyzeTeamStatsOutput = z.infer<typeof AnalyzeTeamStatsOutputSchema>;

export async function analyzeTeamStats(input: AnalyzeTeamStatsInput): Promise<AnalyzeTeamStatsOutput> {
  return analyzeTeamStatsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeTeamStatsPrompt',
  input: {schema: AnalyzeTeamStatsInputSchema},
  output: {schema: AnalyzeTeamStatsOutputSchema},
  prompt: `You are an expert Faustball coach analyzing team statistics to identify areas for improvement.

  Analyze the following match data for the team "{{teamName}}":

  {{matchData}}

  Based on this data, identify the team's strengths and weaknesses, and suggest improvements to optimize training strategies and improve team performance.

  Strengths:
  {{strengths}}

  Weaknesses:
  {{weaknesses}}

  Suggested Improvements:
  {{suggestedImprovements}}`,
});

const analyzeTeamStatsFlow = ai.defineFlow(
  {
    name: 'analyzeTeamStatsFlow',
    inputSchema: AnalyzeTeamStatsInputSchema,
    outputSchema: AnalyzeTeamStatsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
