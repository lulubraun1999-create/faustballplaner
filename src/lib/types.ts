export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  city: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  imageUrl: string;
  position: 'Attacker' | 'Defender' | 'Setter';
  jerseyNumber: number;
}

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  team1Score: number;
  team2Score: number;
  date: string; // ISO string
}

export interface TeamStats extends Team {
  matchesPlayed: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  points: number;
}
