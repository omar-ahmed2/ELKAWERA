import { Player, Position } from '../types';

// computeOverall removed as attribute-based weightings are no longer used.
// Players now start with a manual base score which is enhanced by match performance.

export const getCardType = (overall: number): 'Silver' | 'Gold' | 'Elite' | 'Platinum' => {
  if (overall >= 90) return 'Platinum';
  if (overall >= 80) return 'Elite';
  if (overall >= 70) return 'Gold';
  return 'Silver';
};

interface PerformanceMetrics {
  goals?: number;
  assists?: number;
  defensiveContributions?: number;
  cleanSheets?: number;
  saves?: number;
  penaltySaves?: number; // Not used in specific formula yet but kept for completeness
  ownGoals?: number;
  goalsConceded?: number;
  penaltyMissed?: number;
  matchesPlayed?: number; // Not used in new formula but kept signature compatible conceptually
}

export const computeOverallWithPerformance = (
  baseScore: number,
  position: Position,
  perf: PerformanceMetrics
): number => {
  let bonus = 0;

  const goals = perf.goals || 0;
  const assists = perf.assists || 0;
  const defContrib = perf.defensiveContributions || 0;
  const cleanSheets = perf.cleanSheets || 0;
  const saves = perf.saves || 0;
  const ownGoals = perf.ownGoals || 0;
  const goalsConceded = perf.goalsConceded || 0;
  const penaltyMissed = perf.penaltyMissed || 0;

  // --- GENERAL RULES (All Players) ---
  // 2 penalty miss = -1 ovr
  if (penaltyMissed > 0) {
    bonus -= Math.floor(penaltyMissed / 2);
  }
  // 2 own goals = -1 ovr
  if (ownGoals > 0) {
    bonus -= Math.floor(ownGoals / 2);
  }

  // --- POSITION SPECIFIC RULES ---
  switch (position) {
    case 'CF':
      // 4 goals = +1 ovr
      bonus += Math.floor(goals / 4);
      // 3 assists = +1 ovr
      bonus += Math.floor(assists / 3);
      // 10 def contribution = +1
      bonus += Math.floor(defContrib / 10);
      break;

    case 'CB':
      // 8 def con = +1 ovr
      bonus += Math.floor(defContrib / 8);
      // 1 clean sheet = +1
      bonus += Math.floor(cleanSheets / 1); // effectively +cleanSheets
      break;

    case 'GK':
      // 6 saves = +1 ovr
      bonus += Math.floor(saves / 6);
      // 1 goal = +1 ovr
      bonus += Math.floor(goals / 1); // Rare but possible
      // 2 assists = +1 ovr
      bonus += Math.floor(assists / 2);
      // 4 goals conceeced = -1 ovr
      if (goalsConceded > 0) {
        bonus -= Math.floor(goalsConceded / 4);
      }
      // 1 penalty save = +1 ovr
      bonus += Math.floor(perf.penaltySaves || 0);
      break;
  }

  // Apply bonus to base score, cap at 99 (and maybe floor at 0 or base?)
  // Assuming OVR shouldn't drop below reasonable limit, but math allows for net negative bonus.
  // Standard FIFA/EAFC methodology caps min/max.
  let finalScore = baseScore + bonus;

  if (finalScore > 99) finalScore = 99;
  if (finalScore < 1) finalScore = 1;

  return Math.round(finalScore);
};
