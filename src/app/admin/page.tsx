import { AddMatchForm } from '@/components/add-match-form';
import { getAllTeams } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminPage() {
  const teams = await getAllTeams();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline sm:text-4xl">Admin Panel</h1>
        <Card>
          <CardHeader>
            <CardTitle>Add Match Result</CardTitle>
            <CardDescription>Enter the scores for a completed match. The team standings will be updated automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddMatchForm teams={teams} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
