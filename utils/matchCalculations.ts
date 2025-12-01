import { Player, PlayerEvaluation, Match } from '../types';

// ============================================
// PLAYER RATING CALCULATIONS
// ============================================

/**
 * Calculate player's overall rating based on match evaluation
 * 
 * ⚠️ PLACEHOLDER IMPLEMENTATION
 * This is a placeholder for Fino's rating formulas.
 * Omar will integrate the actual formulas when Fino provides them.
 * 
 * @param player - The player object
 * @param evaluation - The match evaluation data
 * @returns Updated overall score
 */
export function calculatePlayerOverallRating(
    player: Player,
    evaluation: PlayerEvaluation
): number {
    // TODO: Replace with Fino's actual formula
    // This is a simple placeholder that slightly adjusts the rating

    const baseRating = player.overallScore;
    let adjustment = 0;

    // Simple placeholder logic
    if (evaluation.goals > 0) adjustment += evaluation.goals * 0.5;
    if (evaluation.assists > 0) adjustment += evaluation.assists * 0.3;
    if (evaluation.defensiveContributions > 0) adjustment += evaluation.defensiveContributions * 0.2;
    if (evaluation.cleanSheets) adjustment += 1;
    if (evaluation.penaltySaves > 0) adjustment += evaluation.penaltySaves * 0.8;

    // Cap the adjustment to prevent massive jumps
    adjustment = Math.min(adjustment, 3);

    const newRating = Math.min(99, Math.max(40, baseRating + adjustment));

    return Math.round(newRating);
}

/**
 * Calculate experience points for external matches
 * 
 * @param matchResult - win, draw, or loss
 * @returns Experience points to award
 */
export function calculateExperienceBoost(
    matchResult: 'win' | 'draw' | 'loss'
): number {
    const xpMap = {
        win: 100,
        draw: 50,
        loss: 25
    };
    return xpMap[matchResult];
}

/**
 * Calculate small rating boost for external matches
 * 
 * @param matchResult - win, draw, or loss
 * @param performanceScore - Average team performance (0-100)
 * @returns Rating boost amount
 */
export function calculateRatingBoost(
    matchResult: 'win' | 'draw' | 'loss',
    performanceScore: number
): number {
    const baseBoost = performanceScore / 100;

    if (matchResult === 'win') {
        return baseBoost * 0.5; // Max 0.5 point boost for wins
    } else if (matchResult === 'draw') {
        return baseBoost * 0.25; // Max 0.25 point boost for draws
    } else {
        return baseBoost * 0.1; // Max 0.1 point boost for losses
    }
}

/**
 * Calculate team strength ranking based on player ratings
 * 
 * @param playerRatings - Array of player overall scores
 * @returns Team strength score
 */
export function calculateTeamStrength(playerRatings: number[]): number {
    if (playerRatings.length === 0) return 0;

    const avgRating = playerRatings.reduce((sum, rating) => sum + rating, 0) / playerRatings.length;
    const squadDepth = Math.min(playerRatings.length / 11, 1); // Bonus for having full squad

    return Math.round(avgRating * (0.8 + (squadDepth * 0.2)));
}

/**
 * Determine match result from team's perspective
 * 
 * @param teamScore - The team's score
 * @param opponentScore - The opponent's score
 * @returns Match result
 */
export function getMatchResult(teamScore: number, opponentScore: number): 'win' | 'draw' | 'loss' {
    if (teamScore > opponentScore) return 'win';
    if (teamScore === opponentScore) return 'draw';
    return 'loss';
}

/**
 * Check if match verifications have discrepancies
 * 
 * @param homeVerification - Home team verification
 * @param awayVerification - Away team verification
 * @returns Array of discrepancy descriptions
 */
export function detectVerificationDiscrepancies(
    homeVerification: { submittedScore?: { home: number; away: number } },
    awayVerification: { submittedScore?: { home: number; away: number } }
): string[] {
    const discrepancies: string[] = [];

    if (!homeVerification.submittedScore || !awayVerification.submittedScore) {
        return discrepancies;
    }

    const homeReportedHome = homeVerification.submittedScore.home;
    const homeReportedAway = homeVerification.submittedScore.away;
    const awayReportedHome = awayVerification.submittedScore.home;
    const awayReportedAway = awayVerification.submittedScore.away;

    if (homeReportedHome !== awayReportedHome) {
        discrepancies.push(`Home score mismatch: Home team reported ${homeReportedHome}, Away team reported ${awayReportedHome}`);
    }

    if (homeReportedAway !== awayReportedAway) {
        discrepancies.push(`Away score mismatch: Home team reported ${homeReportedAway}, Away team reported ${awayReportedAway}`);
    }

    return discrepancies;
}

/**
 * Validate player evaluation data
 * 
 * @param evaluation - Player evaluation to validate
 * @param playerPosition - Player's position
 * @returns Validation errors (empty if valid)
 */
export function validatePlayerEvaluation(
    evaluation: PlayerEvaluation,
    playerPosition: string
): string[] {
    const errors: string[] = [];

    // Check for negative numbers
    if (evaluation.goals < 0) errors.push('Goals cannot be negative');
    if (evaluation.assists < 0) errors.push('Assists cannot be negative');
    if (evaluation.defensiveContributions < 0) errors.push('Defensive contributions cannot be negative');
    if (evaluation.penaltySaves < 0) errors.push('Penalty saves cannot be negative');

    // Position-specific validation
    if (playerPosition !== 'GK' && evaluation.penaltySaves > 0) {
        errors.push('Only goalkeepers can have penalty saves');
    }

    // Reasonable limits
    if (evaluation.goals > 10) errors.push('Goals seem unreasonably high (max 10 per match)');
    if (evaluation.assists > 10) errors.push('Assists seem unreasonably high (max 10 per match)');
    if (evaluation.defensiveContributions > 20) errors.push('Defensive contributions seem unreasonably high (max 20 per match)');
    if (evaluation.penaltySaves > 5) errors.push('Penalty saves seem unreasonably high (max 5 per match)');

    return errors;
}
