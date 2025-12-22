import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatchById, saveMatch, getPlayerById, savePlayer, getAllTeams, saveTeam, getCaptainStats, updateCaptainStats, awardRankPoints, updateTeamRankings } from '../utils/db'; // Updated imports
import { Match, Player, Team, PlayerEvaluation, MatchEvent } from '../types';
import { calculatePlayerOverallRating, getCardTypeFromScore } from '../utils/matchCalculations';
import { Trophy, ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { showToast } from '../components/Toast';

export const PlayerEvaluationPage: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [match, setMatch] = useState<Match | null>(null);
    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [awayTeam, setAwayTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [evaluations, setEvaluations] = useState<Record<string, PlayerEvaluation>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Only admins can access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        const loadMatchData = async () => {
            if (!matchId) return;

            try {
                const matchData = await getMatchById(matchId);
                if (!matchData) {
                    showToast('Match not found', 'error');
                    navigate('/admin/matches');
                    return;
                }

                if (matchData.status === 'finished') {
                    showToast('This match has already been evaluated', 'info');
                    navigate('/admin/matches');
                    return;
                }

                setMatch(matchData);

                // Load teams
                const teams = await getAllTeams();
                const home = teams.find(t => t.id === matchData.homeTeamId);
                const away = teams.find(t => t.id === matchData.awayTeamId);
                setHomeTeam(home || null);
                setAwayTeam(away || null);

                // Load all players
                const allPlayerIds = [...matchData.homePlayerIds, ...matchData.awayPlayerIds];
                const playerPromises = allPlayerIds.map(id => getPlayerById(id));
                const loadedPlayers = await Promise.all(playerPromises);
                const validPlayers = loadedPlayers.filter(p => p !== undefined) as Player[];
                setPlayers(validPlayers);

                // Initialize evaluations with default values
                const initialEvals: Record<string, PlayerEvaluation> = {};
                validPlayers.forEach(player => {
                    initialEvals[player.id] = {
                        matchId: matchId!,
                        playerId: player.id,
                        goals: 0,
                        assists: 0,
                        defensiveContributions: 0,
                        cleanSheets: false,
                        penaltySaves: 0,
                        saves: 0,
                    };
                });
                setEvaluations(initialEvals);

                setLoading(false);
            } catch (error) {
                console.error('Error loading match:', error);
                showToast('Failed to load match data', 'error');
                navigate('/admin/matches');
            }
        };

        loadMatchData();
    }, [matchId, navigate]);

    const updateEvaluation = (playerId: string, field: keyof PlayerEvaluation, value: any) => {
        setEvaluations(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [field]: value,
            },
        }));
    };

    const handleSubmit = async () => {
        if (!match) return;

        setSaving(true);

        try {
            const newEvents: MatchEvent[] = [];

            // Update each player's stats and overall rating
            for (const player of players) {
                const evaluation = evaluations[player.id];
                const teamId = match.homePlayerIds.includes(player.id) ? match.homeTeamId : match.awayTeamId;

                // Generate Events from Evaluation
                // Goals
                for (let i = 0; i < evaluation.goals; i++) {
                    newEvents.push({
                        id: uuidv4(),
                        matchId: match.id,
                        playerId: player.id,
                        teamId,
                        type: 'goal',
                        timestamp: Date.now()
                    });
                }
                // Assists
                for (let i = 0; i < evaluation.assists; i++) {
                    newEvents.push({
                        id: uuidv4(),
                        matchId: match.id,
                        playerId: player.id,
                        teamId,
                        type: 'assist',
                        timestamp: Date.now()
                    });
                }
                // Defensive Contributions
                for (let i = 0; i < evaluation.defensiveContributions; i++) {
                    newEvents.push({
                        id: uuidv4(),
                        matchId: match.id,
                        playerId: player.id,
                        teamId,
                        type: 'defensive_contribution',
                        timestamp: Date.now()
                    });
                }
                // Penalty Saves
                for (let i = 0; i < evaluation.penaltySaves; i++) {
                    newEvents.push({
                        id: uuidv4(),
                        matchId: match.id,
                        playerId: player.id,
                        teamId,
                        type: 'penalty_save',
                        timestamp: Date.now()
                    });
                }
                // Saves
                for (let i = 0; i < evaluation.saves; i++) {
                    newEvents.push({
                        id: uuidv4(),
                        matchId: match.id,
                        playerId: player.id,
                        teamId,
                        type: 'save',
                        timestamp: Date.now()
                    });
                }
                // Clean Sheet
                if (evaluation.cleanSheets) {
                    newEvents.push({
                        id: uuidv4(),
                        matchId: match.id,
                        playerId: player.id,
                        teamId,
                        type: 'clean_sheet',
                        timestamp: Date.now()
                    });
                }

                // Update player stats
                const updatedPlayer: Player = {
                    ...player,
                    goals: player.goals + evaluation.goals,
                    assists: player.assists + evaluation.assists,
                    defensiveContributions: player.defensiveContributions + evaluation.defensiveContributions,
                    cleanSheets: player.cleanSheets + (evaluation.cleanSheets ? 1 : 0),
                    penaltySaves: player.penaltySaves + evaluation.penaltySaves,
                    saves: (player.saves || 0) + evaluation.saves,
                    matchesPlayed: player.matchesPlayed + 1,
                    updatedAt: Date.now(),
                };

                // Calculate new overall rating using Fino's formula (placeholder for now)
                updatedPlayer.overallScore = calculatePlayerOverallRating(updatedPlayer, evaluation);

                // Update card case automatically based on new rating
                updatedPlayer.cardType = getCardTypeFromScore(updatedPlayer.overallScore);

                // Save updated player
                await savePlayer(updatedPlayer);
            }

            // Mark match as finished and save events
            const updatedMatch: Match = {
                ...match,
                status: 'finished',
                events: [...match.events, ...newEvents]
            };
            await saveMatch(updatedMatch);

            // ============================================
            // UPDATE TEAM STATS
            // ============================================
            if (homeTeam && awayTeam) {
                const isHomeWin = match.homeScore > match.awayScore;
                const isDraw = match.homeScore === match.awayScore;

                // Home Team
                const updatedHome = { ...homeTeam };
                updatedHome.totalMatches = (updatedHome.totalMatches || 0) + 1;
                if (isHomeWin) {
                    updatedHome.wins = (updatedHome.wins || 0) + 1;
                    updatedHome.experiencePoints = (updatedHome.experiencePoints || 0) + 100;
                } else if (isDraw) {
                    updatedHome.draws = (updatedHome.draws || 0) + 1;
                    updatedHome.experiencePoints = (updatedHome.experiencePoints || 0) + 50;
                } else {
                    updatedHome.losses = (updatedHome.losses || 0) + 1;
                    updatedHome.experiencePoints = (updatedHome.experiencePoints || 0) + 25;
                }
                await saveTeam(updatedHome);

                // Away Team
                const updatedAway = { ...awayTeam };
                updatedAway.totalMatches = (updatedAway.totalMatches || 0) + 1;
                if (!isHomeWin && !isDraw) { // Away Win
                    updatedAway.wins = (updatedAway.wins || 0) + 1;
                    updatedAway.experiencePoints = (updatedAway.experiencePoints || 0) + 100;
                } else if (isDraw) {
                    updatedAway.draws = (updatedAway.draws || 0) + 1;
                    updatedAway.experiencePoints = (updatedAway.experiencePoints || 0) + 50;
                } else {
                    updatedAway.losses = (updatedAway.losses || 0) + 1;
                    updatedAway.experiencePoints = (updatedAway.experiencePoints || 0) + 25;
                }
                await saveTeam(updatedAway);

                // Update Rankings
                await updateTeamRankings();

                // ============================================
                // UPDATE CAPTAIN STATS
                // ============================================
                // Helper to update a captain
                const updateCaptain = async (captainId: string, isWin: boolean, isDraw: boolean) => {
                    try {
                        const stats = await getCaptainStats(captainId);
                        if (stats) {
                            await updateCaptainStats(captainId, {
                                matchesManaged: (stats.matchesManaged || 0) + 1,
                                wins: isWin ? (stats.wins || 0) + 1 : stats.wins,
                                draws: isDraw ? (stats.draws || 0) + 1 : stats.draws,
                                losses: (!isWin && !isDraw) ? (stats.losses || 0) + 1 : stats.losses
                            });
                            // Award points (e.g., 50 for win, 20 for draw, 10 for participating)
                            const points = isWin ? 50 : isDraw ? 20 : 10;
                            await awardRankPoints(captainId, points, 'Match Limit Completed');
                        }
                    } catch (e) {
                        console.warn('Could not update captain stats for', captainId, e);
                    }
                };

                if (homeTeam.captainId) await updateCaptain(homeTeam.captainId, isHomeWin, isDraw);
                if (awayTeam.captainId) await updateCaptain(awayTeam.captainId, !isHomeWin && !isDraw, isDraw);
            }

            // Show success and redirect
            showToast('Player evaluations saved successfully! All player cards have been updated.', 'success');
            navigate('/admin/matches');
        } catch (error) {
            console.error('Error saving evaluations:', error);
            showToast('Failed to save evaluations', 'error');
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20">Loading match data...</div>;
    }

    if (!match || !homeTeam || !awayTeam) {
        return <div className="text-center py-20">Match not found</div>;
    }

    const homePlayers = players.filter(p => match.homePlayerIds.includes(p.id));
    const awayPlayers = players.filter(p => match.awayPlayerIds.includes(p.id));

    // Helper function to determine which fields to show based on position
    const getVisibleFields = (position: string) => {
        const isGK = position === 'GK';
        const isDEF = ['CB'].includes(position);
        const isFWD = ['CF'].includes(position);

        return {
            goals: isFWD || isDEF,
            assists: isFWD || isDEF,
            defensiveContributions: isDEF || isFWD,
            cleanSheets: isDEF || isFWD || isGK,
            penaltySaves: isGK,
            saves: isGK,
        };
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/matches')}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-bold uppercase">Player Evaluation</h1>
                    <p className="text-gray-400 mt-1">Rate each player's performance in this match</p>
                </div>
            </div>

            {/* Match Summary */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                        <div className="text-sm text-gray-400 mb-1">HOME</div>
                        <div className="text-xl font-bold">{homeTeam.name}</div>
                        <div className="text-3xl font-display font-bold text-elkawera-accent mt-2">{match.homeScore}</div>
                    </div>
                    <div className="text-2xl font-display font-bold text-white/20 px-8">-</div>
                    <div className="text-center flex-1">
                        <div className="text-sm text-gray-400 mb-1">AWAY</div>
                        <div className="text-xl font-bold">{awayTeam.name}</div>
                        <div className="text-3xl font-display font-bold text-elkawera-accent mt-2">{match.awayScore}</div>
                    </div>
                </div>
                {match.manOfTheMatch && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-yellow-400">
                        <Trophy size={16} />
                        <span className="text-sm">
                            MVP: {players.find(p => p.id === match.manOfTheMatch)?.name}
                        </span>
                    </div>
                )}
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-yellow-300">
                    ⚠️ <strong>Important:</strong> Enter only the raw match numbers. The system will automatically calculate and update each player's Overall Rating using Fino's formulas.
                </p>
            </div>

            {/* Home Team Evaluations */}
            <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold uppercase text-elkawera-accent">
                    {homeTeam.name} Players
                </h2>
                <div className="space-y-4">
                    {homePlayers.map(player => (
                        <PlayerEvaluationCard
                            key={player.id}
                            player={player}
                            evaluation={evaluations[player.id]}
                            visibleFields={getVisibleFields(player.position)}
                            onUpdate={(field, value) => updateEvaluation(player.id, field, value)}
                            isMVP={match.manOfTheMatch === player.id}
                        />
                    ))}
                </div>
            </div>

            {/* Away Team Evaluations */}
            <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold uppercase text-elkawera-accent">
                    {awayTeam.name} Players
                </h2>
                <div className="space-y-4">
                    {awayPlayers.map(player => (
                        <PlayerEvaluationCard
                            key={player.id}
                            player={player}
                            evaluation={evaluations[player.id]}
                            visibleFields={getVisibleFields(player.position)}
                            onUpdate={(field, value) => updateEvaluation(player.id, field, value)}
                            isMVP={match.manOfTheMatch === player.id}
                        />
                    ))}
                </div>
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-elkawera-dark/95 backdrop-blur-sm border-t border-white/10 p-6 -mx-6">
                <div className="max-w-6xl mx-auto flex gap-4">
                    <button
                        onClick={() => navigate('/admin/matches')}
                        className="flex-1 py-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 py-4 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Saving & Updating Cards...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Submit Evaluations & Update Player Cards
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Player Evaluation Card Component
const PlayerEvaluationCard: React.FC<{
    player: Player;
    evaluation: PlayerEvaluation;
    visibleFields: Record<string, boolean>;
    onUpdate: (field: keyof PlayerEvaluation, value: any) => void;
    isMVP: boolean;
}> = ({ player, evaluation, visibleFields, onUpdate, isMVP }) => {
    return (
        <div className={`bg-white/5 border ${isMVP ? 'border-yellow-400/50' : 'border-white/10'} rounded-xl p-6 ${isMVP ? 'shadow-[0_0_20px_rgba(250,204,21,0.2)]' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-elkawera-accent/20 flex items-center justify-center">
                        <span className="text-xl font-display font-bold">{player.overallScore}</span>
                    </div>
                    <div>
                        <div className="font-bold text-lg flex items-center gap-2">
                            {player.name}
                            {isMVP && <Trophy className="text-yellow-400" size={16} />}
                        </div>
                        <div className="text-sm text-gray-400">{player.position} • Current: {player.goals}G, {player.assists}A</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Goals */}
                {visibleFields.goals && (
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Goals ⚽</label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            value={evaluation.goals}
                            onChange={(e) => onUpdate('goals', Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-center text-xl font-bold focus:border-elkawera-accent focus:outline-none"
                        />
                    </div>
                )}

                {/* Assists */}
                {visibleFields.assists && (
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Assists 🎯</label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            value={evaluation.assists}
                            onChange={(e) => onUpdate('assists', Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-center text-xl font-bold focus:border-elkawera-accent focus:outline-none"
                        />
                    </div>
                )}

                {/* Defensive Contributions */}
                {visibleFields.defensiveContributions && (
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Def. Contrib. 🛡️</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={evaluation.defensiveContributions}
                            onChange={(e) => onUpdate('defensiveContributions', Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-center text-xl font-bold focus:border-elkawera-accent focus:outline-none"
                        />
                    </div>
                )}

                {/* Clean Sheets */}
                {visibleFields.cleanSheets && (
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Clean Sheet 🧤</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onUpdate('cleanSheets', true)}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${evaluation.cleanSheets
                                    ? 'bg-green-500 text-white'
                                    : 'bg-black/50 border border-white/20 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => onUpdate('cleanSheets', false)}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${!evaluation.cleanSheets
                                    ? 'bg-red-500 text-white'
                                    : 'bg-black/50 border border-white/20 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                No
                            </button>
                        </div>
                    </div>
                )}

                {/* Penalty Saves (GK only) */}
                {visibleFields.penaltySaves && (
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Penalty Saves 🥅</label>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            value={evaluation.penaltySaves}
                            onChange={(e) => onUpdate('penaltySaves', Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-center text-xl font-bold focus:border-elkawera-accent focus:outline-none"
                        />
                    </div>
                )}

                {/* Regular Saves (GK only) */}
                {visibleFields.saves && (
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2">Regular Saves 🧤</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={evaluation.saves}
                            onChange={(e) => onUpdate('saves', Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-center text-xl font-bold focus:border-elkawera-accent focus:outline-none"
                        />
                    </div>
                )}
            </div>

            <div className="mt-3 text-xs text-gray-500">
                Position-specific fields shown based on {player.position} position
            </div>
        </div>
    );
};
