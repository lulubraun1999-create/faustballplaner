import { getTeamsWithStats } from '@/lib/data';
import { TeamRankingsTable } from '@/components/team-rankings-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function Home() {
  const teams = await getTeamsWithStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">Team Standings</h1>
        <Button asChild>
          <Link href="/admin">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Match Result
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current Season Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamRankingsTable teams={teams} />
        </CardContent>
      </Card>
    </div>
  );
}
