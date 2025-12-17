import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTeams } from '../utils/db';
import { Team } from '../types';
import { Trophy, TrendingUp, Shield, Users, ArrowLeft } from 'lucide-react';

export const AdminTeamRankings: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only admins can access
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        const loadTeams = async () => {
            try {
                const allTeams = await getAllTeams();
                // Sort by ranking (ASC) because #1 is better than #2, OR by XP (DESC)
                // Assuming ranking is strictly derived from XP, let's sort by XP DESC to be safe and dynamic
                const sortedTeams = allTeams.sort((a, b) => (b.experiencePoints || 0) - (a.experiencePoints || 0));

                // Assign rank dynamically for display if needed, or use stored rank
                // sortedTeams.forEach((t, i) => t.ranking = i + 1); 

                setTeams(sortedTeams);
                setLoading(false);
            } catch (error) {
                console.error('Error loading teams:', error);
                setLoading(false);
            }
        };

        loadTeams();
    }, [user, navigate]);

    if (loading) {
        return <div className="text-center py-20 text-white">Loading rankings...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-bold uppercase text-white tracking-tight">Team Global Rankings</h1>
                    <p className="text-gray-400 mt-1">Live ranking of all registered teams sorted by XP</p>
                </div>
            </div>

            {/* Top 3 Podium (Optional Visual Flair) */}
            {teams.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
                    {/* 2nd Place */}
                    <div className="bg-gradient-to-t from-gray-500/20 to-transparent border border-gray-500/30 rounded-t-2xl p-6 flex flex-col items-center text-center order-2 md:order-1 h-64 justify-end">
                        <div className="mb-4 relative">
                            {teams[1].logoUrl ? (
                                <img src={teams[1].logoUrl} alt={teams[1].name} className="w-20 h-20 rounded-full border-4 border-gray-400 object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-full border-4 border-gray-400 bg-gray-800 flex items-center justify-center">
                                    <Shield size={32} className="text-gray-400" />
                                </div>
                            )}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-400 text-black font-bold px-2 py-0.5 rounded-full text-xs">#2</div>
                        </div>
                        <h3 className="font-bold text-xl text-gray-300">{teams[1].name}</h3>
                        <p className="text-elkawera-accent font-bold mt-1">{teams[1].experiencePoints || 0} XP</p>
                    </div>

                    {/* 1st Place */}
                    <div className="bg-gradient-to-t from-yellow-500/20 to-transparent border border-yellow-500/30 rounded-t-3xl p-6 flex flex-col items-center text-center order-1 md:order-2 h-80 justify-end shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                        <Trophy size={48} className="text-yellow-400 mb-4 animate-bounce" />
                        <div className="mb-4 relative">
                            {teams[0].logoUrl ? (
                                <img src={teams[0].logoUrl} alt={teams[0].name} className="w-28 h-28 rounded-full border-4 border-yellow-400 object-cover" />
                            ) : (
                                <div className="w-28 h-28 rounded-full border-4 border-yellow-400 bg-gray-800 flex items-center justify-center">
                                    <Shield size={40} className="text-yellow-400" />
                                </div>
                            )}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-sm shadow-lg">#1</div>
                        </div>
                        <h3 className="font-bold text-3xl text-white">{teams[0].name}</h3>
                        <p className="text-elkawera-accent font-bold text-xl mt-2">{teams[0].experiencePoints || 0} XP</p>
                    </div>

                    {/* 3rd Place */}
                    <div className="bg-gradient-to-t from-orange-700/20 to-transparent border border-orange-700/30 rounded-t-2xl p-6 flex flex-col items-center text-center order-3 h-56 justify-end">
                        <div className="mb-4 relative">
                            {teams[2].logoUrl ? (
                                <img src={teams[2].logoUrl} alt={teams[2].name} className="w-20 h-20 rounded-full border-4 border-orange-600 object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-full border-4 border-orange-600 bg-gray-800 flex items-center justify-center">
                                    <Shield size={32} className="text-orange-600" />
                                </div>
                            )}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white font-bold px-2 py-0.5 rounded-full text-xs">#3</div>
                        </div>
                        <h3 className="font-bold text-xl text-orange-200">{teams[2].name}</h3>
                        <p className="text-elkawera-accent font-bold mt-1">{teams[2].experiencePoints || 0} XP</p>
                    </div>
                </div>
            )}

            {/* Rankings Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-black/20">
                                <th className="p-6 font-display font-bold text-gray-400 uppercase text-sm">Rank</th>
                                <th className="p-6 font-display font-bold text-gray-400 uppercase text-sm">Team</th>
                                <th className="p-6 font-display font-bold text-gray-400 uppercase text-sm text-center">XP</th>
                                <th className="p-6 font-display font-bold text-gray-400 uppercase text-sm text-center">Matches</th>
                                <th className="p-6 font-display font-bold text-gray-400 uppercase text-sm text-center">W / D / L</th>
                                <th className="p-6 font-display font-bold text-gray-400 uppercase text-sm text-center">Win Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {teams.map((team, index) => {
                                const winRate = team.totalMatches > 0 ? Math.round((team.wins / team.totalMatches) * 100) : 0;
                                return (
                                    <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-6">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-400 text-black' :
                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                        index === 2 ? 'bg-orange-600 text-white' :
                                                            'bg-white/10 text-gray-400'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                {team.logoUrl ? (
                                                    <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                        <Shield size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-white text-lg">{team.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono tracking-wider">CPT: {team.captainName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex items-center justify-center gap-2 font-display font-bold text-xl text-elkawera-accent">
                                                <TrendingUp size={16} />
                                                {team.experiencePoints || 0}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center font-bold text-gray-300">
                                            {team.totalMatches}
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex items-center justify-center gap-3 font-mono text-sm">
                                                <span className="text-green-400 font-bold">{team.wins}W</span>
                                                <span className="text-gray-400">{team.draws}D</span>
                                                <span className="text-red-400">{team.losses}L</span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="font-bold text-white">{winRate}%</span>
                                                <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${winRate}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {teams.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No active teams found.
                    </div>
                )}
            </div>
        </div>
    );
};
