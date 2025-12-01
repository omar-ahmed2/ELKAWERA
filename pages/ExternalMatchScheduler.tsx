import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTeams, saveMatch, getPlayerById } from '../utils/db';
import { Team, Match } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Calendar, Users, Trophy, ArrowLeft, CheckCircle } from 'lucide-react';

export const ExternalMatchScheduler: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [selectedOpponent, setSelectedOpponent] = useState<string>('');
    const [scheduling, setScheduling] = useState(false);
    const [loading, setLoading] = useState(true);

    // Only captains can access
    useEffect(() => {
        if (user && user.role !== 'captain' && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const allTeams = await getAllTeams();
                setTeams(allTeams);

                // Find team where current user is captain
                const captainTeam = allTeams.find(t => t.captainId === user?.id);
                setMyTeam(captainTeam || null);

                setLoading(false);
            } catch (error) {
                console.error('Error loading teams:', error);
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const handleSchedule = async () => {
        if (!myTeam || !selectedOpponent) return;

        setScheduling(true);

        try {
            const opponentTeam = teams.find(t => t.id === selectedOpponent);
            if (!opponentTeam) throw new Error('Opponent team not found');

            // Create match object
            const newMatch: Match = {
                id: uuidv4(),
                homeTeamId: myTeam.id,
                awayTeamId: opponentTeam.id,
                homeScore: 0,
                awayScore: 0,
                status: 'running', // External matches start immediately for now
                homePlayerIds: [], // Will be populated when players join/verify
                awayPlayerIds: [],
                events: [],
                createdAt: Date.now(),
                startedAt: Date.now(),
                isExternal: true,
                createdBy: user?.id || '',
            };

            await saveMatch(newMatch);

            // Redirect to match verification/details page (to be implemented)
            // For now, go back to dashboard
            alert('Match scheduled successfully! You can now verify the result after the game.');
            navigate('/captain/dashboard');
        } catch (error) {
            console.error('Error scheduling match:', error);
            alert('Failed to schedule match');
        } finally {
            setScheduling(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20">Loading...</div>;
    }

    if (!myTeam) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">You need to create a team first</h2>
                <button
                    onClick={() => navigate('/captain/dashboard')}
                    className="px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const opponentTeams = teams.filter(t => t.id !== myTeam.id);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/captain/dashboard')}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-bold uppercase">Schedule External Match</h1>
                    <p className="text-gray-400 mt-1">Challenge another team to a match</p>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-12">
                    {/* My Team */}
                    <div className="text-center flex-1">
                        <div className="w-24 h-24 mx-auto bg-elkawera-accent/20 rounded-full flex items-center justify-center mb-4 border-4 border-elkawera-accent">
                            {myTeam.logoUrl ? (
                                <img src={myTeam.logoUrl} alt={myTeam.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold">{myTeam.shortName}</span>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold">{myTeam.name}</h2>
                        <p className="text-gray-400">Home Team</p>
                    </div>

                    <div className="text-4xl font-display font-bold text-white/20">VS</div>

                    {/* Opponent Selection */}
                    <div className="text-center flex-1">
                        {selectedOpponent ? (
                            <div className="mb-4">
                                {(() => {
                                    const team = teams.find(t => t.id === selectedOpponent);
                                    return (
                                        <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-4 border-4 border-white/20">
                                            {team?.logoUrl ? (
                                                <img src={team.logoUrl} alt={team.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold">{team?.shortName}</span>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-white/20">
                                <Users size={32} className="text-gray-600" />
                            </div>
                        )}

                        <select
                            value={selectedOpponent}
                            onChange={(e) => setSelectedOpponent(e.target.value)}
                            className="w-full max-w-xs bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none text-center"
                        >
                            <option value="">Select Opponent...</option>
                            {opponentTeams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Match Info */}
                <div className="bg-black/30 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={20} />
                        Match Rewards
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400 uppercase font-bold mb-1">Win</p>
                            <p className="text-2xl font-bold text-elkawera-accent">+100 XP</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400 uppercase font-bold mb-1">Draw</p>
                            <p className="text-2xl font-bold text-yellow-400">+50 XP</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg">
                            <p className="text-sm text-gray-400 uppercase font-bold mb-1">Loss</p>
                            <p className="text-2xl font-bold text-red-400">+25 XP</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                        * Players will also receive a small boost to their overall rating based on performance.
                    </p>
                </div>

                <button
                    onClick={handleSchedule}
                    disabled={scheduling || !selectedOpponent}
                    className="w-full py-4 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                    {scheduling ? (
                        <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            Scheduling Match...
                        </>
                    ) : (
                        <>
                            <Calendar size={24} />
                            Schedule Match
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
