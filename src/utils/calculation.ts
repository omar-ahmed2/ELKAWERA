import { Player, Position } from '@/types';

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
  penaltySaves?: number;
  ownGoals?: number;
  goalsConceded?: number;
  penaltyMissed?: number;
  matchesPlayed?: number;
}

/**
 * Calculate overall rating bonus based on player performance
 * 
 * GENERAL RULES (All Players):
 * - 2 penalty miss = -1 ovr
 * - 2 own goals = -1 ovr
 * 
 * FORWARD (CF) RULES:
 * - 4 goals = +1 ovr
 * - 3 assists = +1 ovr
 * - 10 def contribution = +1 ovr
 * 
 * DEFENDER (CB) RULES:
 * - 8 def con = +1 ovr
 * - 1 clean sheet = +1 ovr
 * - 3 assists or goals = +1 ovr
 * 
 * GOALKEEPER (GK) RULES:
 * - 1 penalty save = +1 ovr
 * - 1 goal = +1 ovr
 * - 2 assists = +1 ovr
 * - 4 goals conceded = -1 ovr
 * - 6 saves = +1 ovr
 */
export const computeOverallWithPerformance = (
  baseScore: number,
  position: Position,
  perf: PerformanceMetrics
): number => {
  let bonus = 0;

  // Extract performance metrics with default values
  const goals = perf.goals || 0;
  const assists = perf.assists || 0;
  const defContrib = perf.defensiveContributions || 0;
  const cleanSheets = perf.cleanSheets || 0;
  const saves = perf.saves || 0;
  const penaltySaves = perf.penaltySaves || 0;
  const ownGoals = perf.ownGoals || 0;
  const goalsConceded = perf.goalsConceded || 0;
  const penaltyMissed = perf.penaltyMissed || 0;

  // ==================== GENERAL RULES (All Players) ====================
  // 2 penalty miss = -1 ovr
  bonus -= Math.floor(penaltyMissed / 2);
  
  // 2 own goals = -1 ovr
  bonus -= Math.floor(ownGoals / 2);

  // ==================== POSITION SPECIFIC RULES ====================
  switch (position) {
    case 'CF':
      bonus += calculateForwardBonus(goals, assists, defContrib);
      break;

    case 'CB':
      bonus += calculateDefenderBonus(defContrib, cleanSheets, goals, assists);
      break;

    case 'GK':
      bonus += calculateGoalkeeperBonus(goals, assists, saves, penaltySaves, goalsConceded);
      break;
  }

  // Apply bonus to base score with proper bounds
  let finalScore = baseScore + bonus;
  finalScore = Math.max(1, Math.min(99, finalScore)); // Clamp between 1-99

  return Math.round(finalScore);
};

/**
 * Calculate bonus for Forward (CF) players
 */
const calculateForwardBonus = (
  goals: number,
  assists: number,
  defContrib: number
): number => {
  let bonus = 0;
  
  // 4 goals = +1 ovr
  bonus += Math.floor(goals / 4);
  
  // 3 assists = +1 ovr
  bonus += Math.floor(assists / 3);
  
  // 10 def contribution = +1 ovr
  bonus += Math.floor(defContrib / 10);
  
  return bonus;
};

/**
 * Calculate bonus for Defender (CB) players
 */
const calculateDefenderBonus = (
  defContrib: number,
  cleanSheets: number,
  goals: number,
  assists: number
): number => {
  let bonus = 0;
  
  // 8 def con = +1 ovr
  bonus += Math.floor(defContrib / 8);
  
  // 1 clean sheet = +1 ovr
  bonus += cleanSheets;
  
  // 3 assists or goals = +1 ovr (combined total)
  const attackingContributions = goals + assists;
  bonus += Math.floor(attackingContributions / 3);
  
  return bonus;
};

/**
 * Calculate bonus for Goalkeeper (GK) players
 */
const calculateGoalkeeperBonus = (
  goals: number,
  assists: number,
  saves: number,
  penaltySaves: number,
  goalsConceded: number
): number => {
  let bonus = 0;
  
  // 1 penalty save = +1 ovr
  bonus += penaltySaves;
  
  // 1 goal = +1 ovr
  bonus += goals;
  
  // 2 assists = +1 ovr
  bonus += Math.floor(assists / 2);
  
  // 4 goals conceded = -1 ovr
  bonus -= Math.floor(goalsConceded / 4);
  
  // 6 saves = +1 ovr (normal saves, not penalty saves)
  bonus += Math.floor(saves / 6);
  
  return bonus;
};

