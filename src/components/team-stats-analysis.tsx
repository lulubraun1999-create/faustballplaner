"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { analyzeTeamStats } from '@/ai/flows/analyze-team-stats';
import type { AnalyzeTeamStatsOutput } from '@/ai/flows/analyze-team-stats';
import type { Team, Match } from '@/lib/types';
import { Loader2, Lightbulb, ShieldAlert, Wrench, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  team: Team;
  matches: Match[];
}

export function TeamStatsAnalysis({ team, matches }: Props) {
  const [analysis, setAnalysis] = useState<AnalyzeTeamStatsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const matchData = JSON.stringify(
        matches.map(m => {
            const isTeam1 = m.team1Id === team.id;
            const opponentId = isTeam1 ? m.team2Id : m.team1Id;
            const score = isTeam1 ? `${m.team1Score}-${m.team2Score}` : `${m.team2Score}-${m.team1Score}`;
            const result = (isTeam1 && m.team1Score > m.team2Score) || (!isTeam1 && m.team2Score > m.team1Score) ? 'Win' : 'Loss';

            return { opponentId, score, result, date: m.date };
        })
      );
      
      const result = await analyzeTeamStats({ teamName: team.name, matchData });
      setAnalysis(result);
    } catch (e) {
      setError('Failed to generate analysis. The AI model may be unavailable. Please try again later.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-card to-secondary/30">
      <CardHeader>
        <CardTitle>AI-Powered Performance Analysis</CardTitle>
        <CardDescription>
          Get an in-depth analysis of {team.name}'s performance, including strengths, weaknesses, and suggested improvements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-start">
            <Button onClick={handleAnalyze} disabled={isLoading} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isLoading ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
                </>
            ) : (
                'Analyze Performance'
            )}
            </Button>
        </div>
        
        {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {analysis && (
          <div className="grid md:grid-cols-3 gap-4 pt-4 animate-in fade-in-50 duration-500">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <Lightbulb className="h-8 w-8 text-green-500" />
                <CardTitle className="text-lg font-headline">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.strengths}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <ShieldAlert className="h-8 w-8 text-yellow-500" />
                <CardTitle className="text-lg font-headline">Weaknesses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.weaknesses}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <Wrench className="h-8 w-8 text-blue-500" />
                <CardTitle className="text-lg font-headline">Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.suggestedImprovements}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
