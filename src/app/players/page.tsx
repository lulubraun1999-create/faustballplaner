import { getAllPlayers, getAllTeams } from "@/lib/data";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Team } from "@/lib/types";

export default async function PlayersPage() {
    const players = await getAllPlayers();
    const teams = await getAllTeams();
    const teamMap = new Map<string, Team>(teams.map(t => [t.id, t]));

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline sm:text-4xl">All Players</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
                {players.map((player) => {
                    const team = teamMap.get(player.teamId);
                    return (
                        <Link href={`/players/${player.id}`} key={player.id} className="group">
                            <Card className="p-4 transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:border-primary overflow-hidden">
                                <div className="flex flex-col items-center text-center space-y-3">
                                    <Avatar className="h-28 w-28">
                                        <AvatarImage src={player.imageUrl} alt={player.name} data-ai-hint="athlete portrait" />
                                        <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <h2 className="text-md font-semibold font-headline">{player.name}</h2>
                                        <p className="text-sm text-muted-foreground">{team?.name || 'No team'}</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
