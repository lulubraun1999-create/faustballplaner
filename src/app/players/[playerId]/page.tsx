import { getPlayerById, getTeamById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Shirt, MapPin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function PlayerDetailPage({ params }: { params: { playerId: string } }) {
    const player = await getPlayerById(params.playerId);
    if (!player) {
        notFound();
    }
    const team = await getTeamById(player.teamId);

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden">
                <div className="relative h-48 w-full bg-gradient-to-r from-primary to-accent">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                         <Avatar className="h-36 w-36 border-4 border-background shadow-lg">
                            <AvatarImage src={player.imageUrl} alt={player.name} data-ai-hint="athlete portrait" />
                            <AvatarFallback className="text-4xl">{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
                <div className="pt-24 pb-12 px-6 text-center space-y-2">
                    <h1 className="text-4xl font-bold font-headline">{player.name}</h1>
                    <Badge variant="secondary" className="text-md">{player.position}</Badge>
                </div>
                <div className="border-t grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    <div className="p-6 flex flex-col items-center justify-center gap-2">
                        <Shirt className="h-8 w-8 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground">Jersey</span>
                        <span className="text-2xl font-bold font-headline">{player.jerseyNumber}</span>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center gap-2">
                        <Shield className="h-8 w-8 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground">Team</span>
                        {team ? (
                             <Link href={`/teams/${team.id}`} className="text-xl font-semibold font-headline hover:text-primary transition-colors">{team.name}</Link>
                        ) : (
                            <span className="text-xl font-semibold font-headline">N/A</span>
                        )}
                    </div>
                     <div className="p-6 flex flex-col items-center justify-center gap-2">
                        <MapPin className="h-8 w-8 text-muted-foreground"/>
                        <span className="text-sm text-muted-foreground">City</span>
                        <span className="text-xl font-semibold font-headline">{team?.city || 'N/A'}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
