import { getTeamById, getPlayersByTeam, getMatchesByTeam } from "@/lib/data";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { TeamStatsAnalysis } from "@/components/team-stats-analysis";

export default async function TeamDetailPage({ params }: { params: { teamId: string } }) {
    const team = await getTeamById(params.teamId);
    if (!team) {
        notFound();
    }

    const players = await getPlayersByTeam(params.teamId);
    const matches = await getMatchesByTeam(params.teamId);

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={team.logoUrl} alt={team.name} />
                    <AvatarFallback>{team.name.substring(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-4xl font-bold font-headline">{team.name}</h1>
                    <p className="text-lg text-muted-foreground">{team.city}</p>
                </div>
            </div>
            
            <TeamStatsAnalysis team={team} matches={matches} />

            <Card>
                <CardHeader>
                    <CardTitle>Player Roster</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {players.map(player => (
                            <Link href={`/players/${player.id}`} key={player.id} className="group">
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <Avatar className="h-20 w-20 transition-transform duration-300 group-hover:scale-105">
                                        <AvatarImage src={player.imageUrl} alt={player.name} data-ai-hint="athlete portrait" />
                                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold text-sm group-hover:text-primary">{player.name}</p>
                                    <p className="text-xs text-muted-foreground">{player.position}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
