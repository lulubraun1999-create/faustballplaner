import { getAllTeams } from "@/lib/data";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function TeamsPage() {
    const teams = await getAllTeams();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline sm:text-4xl">All Teams</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {teams.map((team) => (
                    <Link href={`/teams/${team.id}`} key={team.id} className="group">
                        <Card className="p-4 transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:border-primary">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={team.logoUrl} alt={team.name} />
                                    <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold font-headline">{team.name}</h2>
                                    <p className="text-sm text-muted-foreground">{team.city}</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
