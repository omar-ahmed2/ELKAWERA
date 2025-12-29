
import { Player, Team } from '../types';

interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'sub';
  player: string;
  teamId: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  homePossession: number;
  awayPossession: number;
  winnerId: string | null; // null for draw
}

const getSquadRating = (players: Player[]) => {
  if (players.length === 0) return 0;
  const total = players.reduce((sum, p) => sum + p.overallScore, 0);
  return total / players.length;
};

const getAttackRating = (players: Player[]) => {
  const attackers = players.filter(p => ['CF'].includes(p.position));
  if (attackers.length === 0) return getSquadRating(players); // Fallback
  return attackers.reduce((sum, p) => sum + p.overallScore, 0) / attackers.length;
};

const getDefenseRating = (players: Player[]) => {
  const defenders = players.filter(p => ['CB','GK'].includes(p.position));
  if (defenders.length === 0) return getSquadRating(players);
  return defenders.reduce((sum, p) => sum + p.overallScore, 0) / defenders.length;
};

export const simulateMatch = (homeTeam: Team, homeSquad: Player[], awayTeam: Team, awaySquad: Player[]): MatchResult => {
  const homeOVR = getSquadRating(homeSquad) + 2; // Home advantage
  const awayOVR = getSquadRating(awaySquad);
  
  const homeAtt = getAttackRating(homeSquad);
  const homeDef = getDefenseRating(homeSquad);
  
  const awayAtt = getAttackRating(awaySquad);
  const awayDef = getDefenseRating(awaySquad);

  // Base chances based on power difference
  const powerDiff = (homeOVR - awayOVR) / 2;
  
  let homeScore = 0;
  let awayScore = 0;
  const events: MatchEvent[] = [];

  // Simulate 90 minutes (18 chunks of 5 mins)
  for (let i = 0; i < 18; i++) {
    const minute = (i + 1) * 5;
    const roll = Math.random();

    // Goal Chance
    if (roll < 0.15) { // 15% chance of something happening every 5 mins
       const whoScoredRoll = Math.random();
       // Adjust scoring probability by Attack vs Defense
       const homeScoreProb = 0.5 + ((homeAtt - awayDef) * 0.01);
       
       if (whoScoredRoll < homeScoreProb) {
          homeScore++;
          // Pick a random scorer
          const scorer = homeSquad.length > 0 ? homeSquad[Math.floor(Math.random() * homeSquad.length)].name : 'Unknown';
          events.push({ minute, type: 'goal', player: scorer, teamId: homeTeam.id });
       } else {
          awayScore++;
          const scorer = awaySquad.length > 0 ? awaySquad[Math.floor(Math.random() * awaySquad.length)].name : 'Unknown';
          events.push({ minute, type: 'goal', player: scorer, teamId: awayTeam.id });
       }
    }
  }

  // Possession calculation
  const possessionBase = 50 + (powerDiff * 1.5);
  const homePossession = Math.min(Math.max(Math.round(possessionBase), 30), 70); // Clamp between 30-70

  return {
    homeScore,
    awayScore,
    events,
    homePossession,
    awayPossession: 100 - homePossession,
    winnerId: homeScore > awayScore ? homeTeam.id : awayScore > homeScore ? awayTeam.id : null
  };
};
