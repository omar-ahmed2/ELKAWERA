import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlayerById, getAllMatches, getAllTeams, trackScoutActivity } from '../utils/db';
import { Player, Match, Team } from '../types';
import { useAuth } from '../context/AuthContext';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerStatistics } from '../components/PlayerStatistics';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { showToast } from '../components/Toast';

export const PlayerPublicProfile: React.FC = () => {
    const { playerId } = useParams<{ playerId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [player, setPlayer] = useState<Player | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!playerId) return;

            try {
                const [playerData, allMatches, allTeams] = await Promise.all([
                    getPlayerById(playerId),
                    getAllMatches(),
                    getAllTeams()
                ]);

                if (!playerData) {
                    // Handle not found
                    showToast('Player not found', 'error');
                    navigate('/leaderboard');
                    return;
                }

                setPlayer(playerData);
                setMatches(allMatches);
                setTeams(allTeams);
                setLoading(false);
            } catch (error) {
                console.error("Error loading player profile:", error);
                setLoading(false);
            }
        };
        loadData();
    }, [playerId, navigate]);

    useEffect(() => {
        if (player && user?.role === 'scout') {
            trackScoutActivity(user.id, user.name, 'view_player', player.id, player.name, 'player').catch(console.error);
        }
    }, [player, user]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading Analysis...</div>;
    }

    if (!player) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
                <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-white">
                    Player Profile
                </h1>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left Column: Player Card */}
                <div className="lg:col-span-4 flex flex-col items-center">
                    <div className="relative mb-8 transform hover:scale-105 transition-transform duration-300">
                        <PlayerCard
                            player={player}
                            uniqueId="public-profile-card"
                            isFlipped={isFlipped}
                            onFlip={() => setIsFlipped(!isFlipped)}
                        />
                        <button
                            onClick={() => setIsFlipped(!isFlipped)}
                            className="absolute top-4 -right-4 p-3 bg-black/60 rounded-full hover:bg-black/80 text-white z-20 border border-white/20 shadow-xl backdrop-blur-sm"
                            title="Flip Card"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">{player.name}</h2>
                        <p className="text-gray-400 font-mono text-sm uppercase mb-4">{player.position}</p>

                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <div>
                                <div className="text-3xl font-display font-bold text-elkawera-accent">{player.overallScore}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">Overall</div>
                            </div>
                            <div>
                                <div className="text-3xl font-display font-bold text-blue-400">{player.goals + player.assists}</div>
                                <div className="text-xs text-gray-500 uppercase font-bold">G + A</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Advanced Statistics */}
                <div className="lg:col-span-8">
                    <PlayerStatistics player={player} matches={matches} teams={teams} />
                </div>
            </div>
        </div>
    );
};
