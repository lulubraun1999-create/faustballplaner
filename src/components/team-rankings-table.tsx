import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TeamStats } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function TeamRankingsTable({ teams }: { teams: TeamStats[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-center">Rank</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">Played</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">Sets</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, index) => (
            <TableRow key={team.id}>
              <TableCell className="text-center font-bold text-lg">{index + 1}</TableCell>
              <TableCell>
                <Link href={`/teams/${team.id}`} className="flex items-center gap-4 group transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={team.logoUrl} alt={`${team.name} logo`} />
                    <AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold group-hover:text-primary">{team.name}</p>
                    <p className="text-sm text-muted-foreground">{team.city}</p>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-center">{team.matchesPlayed}</TableCell>
              <TableCell className="text-center text-green-600">{team.wins}</TableCell>
              <TableCell className="text-center text-red-600">{team.losses}</TableCell>
              <TableCell className="text-center">{`${team.setsWon}:${team.setsLost}`}</TableCell>
              <TableCell className="text-right font-bold text-lg">{team.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
