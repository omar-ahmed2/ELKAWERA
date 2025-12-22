import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTeams, saveMatchRequest, getPlayersByTeamId } from '../utils/db';
import { Team, MatchRequest, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Calendar, Users, Trophy, ArrowLeft, CheckCircle, User as UserIcon } from 'lucide-react';
import { showToast } from '../components/Toast';

export const ExternalMatchScheduler: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [squad, setSquad] = useState<Player[]>([]);
    const [selectedLineup, setSelectedLineup] = useState<string[]>([]);
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

                if (captainTeam) {
                    const players = await getPlayersByTeamId(captainTeam.id);
                    setSquad(players);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error loading teams:', error);
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    const togglePlayer = (playerId: string) => {
        setSelectedLineup(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            } else {
                if (prev.length >= 7) {
                    showToast('You can only select up to 7 players', 'error');
                    return prev;
                }
                return [...prev, playerId];
            }
        });
    };

    const handleSchedule = async () => {
        if (!myTeam || !selectedOpponent) return;

        if (selectedLineup.length < 5) {
            showToast('Please select at least 5 players for your lineup', 'error');
            return;
        }

        setScheduling(true);

        try {
            const opponentTeam = teams.find(t => t.id === selectedOpponent);
            if (!opponentTeam) throw new Error('Opponent team not found');

            // Create match REQUEST object
            const matchId = uuidv4();
            const newRequest: MatchRequest = {
                id: uuidv4(),
                matchId: matchId,
                requestedBy: user?.id || '',
                requestedByName: user?.name || '',
                homeTeamId: myTeam.id,
                homeTeamName: myTeam.name,
                homeTeamLineup: selectedLineup, // Included lineup
                awayTeamId: opponentTeam.id,
                awayTeamName: opponentTeam.name,
                status: 'pending_opponent',
                createdAt: Date.now(),
            };

            await saveMatchRequest(newRequest);

            showToast('Match request sent successfully! An admin will review your request shortly.', 'success');
            navigate('/captain/dashboard');
        } catch (error) {
            console.error('Error scheduling match:', error);
            showToast('Failed to send match request', 'error');
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
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
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

                {/* Lineup Selection */}
                <div className="bg-black/30 rounded-xl p-6 mb-8 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Users className="text-elkawera-accent" size={20} />
                            Select Lineup
                        </h3>
                        <span className={`text-sm font-bold ${selectedLineup.length < 5 ? 'text-red-400' : 'text-green-400'}`}>
                            {selectedLineup.length} / 7 Selected (Min 5)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {squad.map(player => {
                            const isSelected = selectedLineup.includes(player.id);
                            return (
                                <div
                                    key={player.id}
                                    onClick={() => togglePlayer(player.id)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${isSelected
                                        ? 'bg-elkawera-accent/20 border-elkawera-accent'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-elkawera-accent text-black' : 'bg-white/10'}`}>
                                        {isSelected ? <CheckCircle size={16} /> : <UserIcon size={16} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{player.name}</p>
                                        <p className="text-xs text-gray-500">{player.position} - OVR {player.overallScore}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {squad.length === 0 && (
                            <div className="col-span-full text-center text-gray-500 py-4">No players found in your squad.</div>
                        )}
                    </div>
                </div>

                {/* Match Rewards */}
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
                    disabled={scheduling || !selectedOpponent || selectedLineup.length < 5}
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
                            Send Match Request
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
