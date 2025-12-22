import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatchById, saveMatch, getPlayerById, getAllTeams } from '../utils/db';
import { Match, Player, Team } from '../types';
import { Trophy, ArrowLeft, Save } from 'lucide-react';
import { showToast } from '../components/Toast';

export const EndMatch: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [match, setMatch] = useState<Match | null>(null);
    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [awayTeam, setAwayTeam] = useState<Team | null>(null);
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [mvpId, setMvpId] = useState('');
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

                if (matchData.status !== 'running' && matchData.status !== 'awaiting_confirmation') {
                    showToast('This match has already ended', 'info');
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

                // Load players
                const homePlayerPromises = matchData.homePlayerIds.map(id => getPlayerById(id));
                const awayPlayerPromises = matchData.awayPlayerIds.map(id => getPlayerById(id));

                const homePlys = await Promise.all(homePlayerPromises);
                const awayPlys = await Promise.all(awayPlayerPromises);

                setHomePlayers(homePlys.filter(p => p !== undefined) as Player[]);
                setAwayPlayers(awayPlys.filter(p => p !== undefined) as Player[]);

                setLoading(false);
            } catch (error) {
                console.error('Error loading match:', error);
                showToast('Failed to load match data', 'error');
                navigate('/admin/matches');
            }
        };

        loadMatchData();
    }, [matchId, navigate]);

    const handleSubmit = async () => {
        if (!match) return;

        if (!mvpId) {
            showToast('Please select the Man of the Match', 'error');
            return;
        }

        setSaving(true);

        try {
            // Update match with final scores and MVP
            const updatedMatch: Match = {
                ...match,
                homeScore,
                awayScore,
                manOfTheMatch: mvpId,
                status: 'awaiting_confirmation',
                finishedAt: Date.now(),
            };

            await saveMatch(updatedMatch);

            // Redirect to player evaluation page
            navigate(`/admin/evaluation/${match.id}`);
        } catch (error) {
            console.error('Error ending match:', error);
            showToast('Failed to end match', 'error');
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20">Loading match data...</div>;
    }

    if (!match || !homeTeam || !awayTeam) {
        return <div className="text-center py-20">Match not found</div>;
    }

    const allPlayers = [...homePlayers, ...awayPlayers];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/matches')}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-bold uppercase">End Match</h1>
                    <p className="text-gray-400 mt-1">Enter final results and select MVP</p>
                </div>
            </div>

            {/* Match Overview */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="text-center flex-1">
                        <div className="text-sm text-gray-400 mb-2">HOME</div>
                        <div className="text-2xl font-bold">{homeTeam.name}</div>
                    </div>
                    <div className="text-3xl font-display font-bold text-white/20 px-8">VS</div>
                    <div className="text-center flex-1">
                        <div className="text-sm text-gray-400 mb-2">AWAY</div>
                        <div className="text-2xl font-bold">{awayTeam.name}</div>
                    </div>
                </div>

                {/* Score Entry */}
                <div className="bg-black/30 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-elkawera-accent mb-4">Final Score</h3>
                    <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                            <label className="block text-sm text-gray-400 mb-2">{homeTeam.shortName} Goals</label>
                            <input
                                type="number"
                                min="0"
                                value={homeScore}
                                onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-24 bg-black/50 border border-white/20 rounded-lg p-4 text-center text-4xl font-display font-bold focus:border-elkawera-accent focus:outline-none"
                            />
                        </div>
                        <div className="text-4xl font-display font-bold text-white/20">-</div>
                        <div className="text-center">
                            <label className="block text-sm text-gray-400 mb-2">{awayTeam.shortName} Goals</label>
                            <input
                                type="number"
                                min="0"
                                value={awayScore}
                                onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-24 bg-black/50 border border-white/20 rounded-lg p-4 text-center text-4xl font-display font-bold focus:border-elkawera-accent focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* MVP Selection */}
                <div className="bg-black/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-elkawera-accent mb-4 flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={24} />
                        Man of the Match
                    </h3>
                    <select
                        value={mvpId}
                        onChange={(e) => setMvpId(e.target.value)}
                        className="w-full bg-black/50 border border-white/20 rounded-lg p-4 focus:border-elkawera-accent focus:outline-none text-lg"
                    >
                        <option value="">Select MVP...</option>
                        <optgroup label={`${homeTeam.name} Players`}>
                            {homePlayers.map(player => (
                                <option key={player.id} value={player.id}>
                                    {player.name} ({player.position})
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label={`${awayTeam.name} Players`}>
                            {awayPlayers.map(player => (
                                <option key={player.id} value={player.id}>
                                    {player.name} ({player.position})
                                </option>
                            ))}
                        </optgroup>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">The MVP will receive a special recognition in the evaluation</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={() => navigate('/admin/matches')}
                    className="flex-1 py-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={saving || !mvpId}
                    className="flex-1 py-4 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Continue to Player Evaluation
                        </>
                    )}
                </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
                ℹ️ After submitting, you'll be redirected to the Player Evaluation page to rate each player's performance
            </div>
        </div>
    );
};
