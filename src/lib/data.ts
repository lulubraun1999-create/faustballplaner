import type { Team, Player, Match, TeamStats } from './types';

// Using a simple in-memory store instead of Firestore for this example.
// In a real app, this would be replaced with Firestore queries.

const TEAMS: Team[] = [
  { id: 'tsg-pfeddersheim', name: 'TSG Pfeddersheim', city: 'Pfeddersheim', logoUrl: 'https://picsum.photos/seed/t1/100/100' },
  { id: 'tv-unterhaugstett', name: 'TV Unterhaugstett', city: 'Unterhaugstett', logoUrl: 'https://picsum.photos/seed/t2/100/100' },
  { id: 'tsv-calw', name: 'TSV Calw', city: 'Calw', logoUrl: 'https://picsum.photos/seed/t3/100/100' },
  { id: 'tv-schweinfurt-oberndorf', name: 'TV Schweinfurt-Oberndorf', city: 'Schweinfurt', logoUrl: 'https://picsum.photos/seed/t4/100/100' },
];

const PLAYERS: Player[] = [
  { id: 'player-1', name: 'Patrick Thomas', teamId: 'tsg-pfeddersheim', imageUrl: 'https://picsum.photos/seed/p1/400/400', position: 'Attacker', jerseyNumber: 10 },
  { id: 'player-2', name: 'Sebastian Thomas', teamId: 'tsg-pfeddersheim', imageUrl: 'https://picsum.photos/seed/p2/400/400', position: 'Defender', jerseyNumber: 5 },
  { id: 'player-3', name: 'Constantin Reutter', teamId: 'tv-unterhaugstett', imageUrl: 'https://picsum.photos/seed/p3/400/400', position: 'Attacker', jerseyNumber: 7 },
  { id: 'player-4', name: 'Robin Gensheimer', teamId: 'tv-unterhaugstett', imageUrl: 'https://picsum.photos/seed/p4/400/400', position: 'Setter', jerseyNumber: 2 },
  { id: 'player-5', name: 'Raphael Schlattinger', teamId: 'tsv-calw', imageUrl: 'https://picsum.photos/seed/p5/400/400', position: 'Attacker', jerseyNumber: 11 },
  { id: 'player-6', name: 'Philipp Kübler', teamId: 'tsv-calw', imageUrl: 'https://picsum.photos/seed/p6/400/400', position: 'Defender', jerseyNumber: 4 },
  { id: 'player-7', name: 'Fabian Sagstetter', teamId: 'tv-schweinfurt-oberndorf', imageUrl: 'https://picsum.photos/seed/p7/400/400', position: 'Setter', jerseyNumber: 1 },
  { id: 'player-8', name: 'Oliver Bauer', teamId: 'tv-schweinfurt-oberndorf', imageUrl: 'https://picsum.photos/seed/p8/400/400', position: 'Attacker', jerseyNumber: 9 },
];

let MATCHES: Match[] = [
  { id: 'match-1', team1Id: 'tsg-pfeddersheim', team2Id: 'tv-unterhaugstett', team1Score: 3, team2Score: 1, date: '2023-05-10T18:00:00Z' },
  { id: 'match-2', team1Id: 'tsv-calw', team2Id: 'tv-schweinfurt-oberndorf', team1Score: 3, team2Score: 2, date: '2023-05-11T18:00:00Z' },
  { id: 'match-3', team1Id: 'tsg-pfeddersheim', team2Id: 'tsv-calw', team1Score: 0, team2Score: 3, date: '2023-05-17T18:00:00Z' },
  { id: 'match-4', team1Id: 'tv-unterhaugstett', team2Id: 'tv-schweinfurt-oberndorf', team1Score: 3, team2Score: 0, date: '2023-05-18T18:00:00Z' },
];

// --- Data Access Functions ---

export async function getTeamsWithStats(): Promise<TeamStats[]> {
  const stats: TeamStats[] = TEAMS.map(team => {
    const teamMatches = MATCHES.filter(m => m.team1Id === team.id || m.team2Id === team.id);
    
    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;

    teamMatches.forEach(m => {
      if (m.team1Id === team.id) {
        setsWon += m.team1Score;
        setsLost += m.team2Score;
        if (m.team1Score > m.team2Score) {
          wins++;
        } else {
          losses++;
        }
      } else {
        setsWon += m.team2Score;
        setsLost += m.team1Score;
        if (m.team2Score > m.team1Score) {
          wins++;
        } else {
          losses++;
        }
      }
    });

    return {
      ...team,
      matchesPlayed: teamMatches.length,
      wins,
      losses,
      setsWon,
      setsLost,
      points: wins * 2, // 2 points for a win, 0 for a loss
    };
  });

  // Sort by points, then by set difference
  return stats.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    const setDiffA = a.setsWon - a.setsLost;
    const setDiffB = b.setsWon - b.setsLost;
    return setDiffB - setDiffA;
  });
}

export async function getAllTeams(): Promise<Team[]> {
  return TEAMS;
}

export async function getTeamById(id: string): Promise<Team | undefined> {
  return TEAMS.find(t => t.id === id);
}

export async function getAllPlayers(): Promise<Player[]> {
  return PLAYERS;
}

export async function getPlayerById(id: string): Promise<Player | undefined> {
  return PLAYERS.find(p => p.id === id);
}

export async function getPlayersByTeam(teamId: string): Promise<Player[]> {
  return PLAYERS.filter(p => p.teamId === teamId);
}

export async function getMatchesByTeam(teamId: string): Promise<Match[]> {
  return MATCHES.filter(m => m.team1Id === teamId || m.team2Id === teamId);
}

export async function addMatch(matchData: Omit<Match, 'id' | 'date'>): Promise<Match> {
  const newMatch: Match = {
    ...matchData,
    id: `match-${MATCHES.length + 1}`,
    date: new Date().toISOString(),
  };
  MATCHES.push(newMatch);
  return newMatch;
}
