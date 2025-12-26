
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Trophy, MapPin, Users, Activity, Filter, ArrowRight } from 'lucide-react';
import { getAllMatches, getAllTeams, subscribeToChanges } from '../utils/db';
import { Match, Team, MatchStatus } from '../types';
import { useSettings } from '../context/SettingsContext';

export const Matches: React.FC = () => {
    const { t } = useSettings();
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Record<string, Team>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [allMatches, allTeams] = await Promise.all([
                getAllMatches(),
                getAllTeams()
            ]);

            setMatches(allMatches);

            const teamMap: Record<string, Team> = {};
            allTeams.forEach(team => {
                teamMap[team.id] = team;
            });
            setTeams(teamMap);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const unsubscribe = subscribeToChanges(fetchData);
        return () => unsubscribe();
    }, []);

    const getFilteredMatches = () => {
        // Sort matches: newest first
        const sorted = [...matches].sort((a, b) => b.createdAt - a.createdAt);

        if (activeTab === 'live') {
            return sorted.filter(m => m.status === 'running');
        } else if (activeTab === 'upcoming') {
            return sorted.filter(m => m.status === 'awaiting_confirmation'); // Or 'scheduled' if added later
        } else {
            // finished
            return sorted.filter(m => m.status === 'finished');
        }
    };

    const filteredMatches = getFilteredMatches();

    const getTeamName = (id: string) => teams[id]?.name || 'Unknown Team';
    const getTeamLogo = (id: string) => teams[id]?.logoUrl;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-display font-bold uppercase italic tracking-tighter text-[var(--text-primary)]">
                        Match Center
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2">
                        Follow live action and see recent results.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
                <button
                    onClick={() => setActiveTab('live')}
                    className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'live'
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Activity size={18} className={activeTab === 'live' ? 'animate-pulse' : ''} />
                    Live Now
                </button>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'upcoming'
                            ? 'bg-elkawera-accent text-black shadow-lg'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Calendar size={18} />
                    Upcoming
                </button>
                <button
                    onClick={() => setActiveTab('finished')}
                    className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'finished'
                            ? 'bg-white/10 text-white shadow-lg border border-white/10'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Trophy size={18} />
                    Results
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4"
                >
                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Loading matches...</div>
                    ) : filteredMatches.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                            <p className="text-gray-400">There are no matches scheduled in this category right now.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMatches.map(match => (
                                <div key={match.id} className="relative bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden hover:border-elkawera-accent/30 transition-all group">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 z-10">
                                        {match.status === 'running' && (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 rounded-full animate-pulse">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Live
                                            </span>
                                        )}

                                        {match.status === 'finished' && (
                                            <span className="px-3 py-1 bg-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-wider border border-white/10 rounded-full">
                                                FT
                                            </span>
                                        )}

                                        {match.status === 'awaiting_confirmation' && (
                                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider border border-yellow-500/20 rounded-full">
                                                Pending
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-8">
                                        {/* Teams */}
                                        <div className="flex items-center justify-between mb-8 mt-2">
                                            {/* Home */}
                                            <div className="flex flex-col items-center text-center w-1/3">
                                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 p-2 group-hover:scale-105 transition-transform">
                                                    {getTeamLogo(match.homeTeamId) ? (
                                                        <img src={getTeamLogo(match.homeTeamId)} alt="Home" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Users size={24} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="font-bold text-sm md:text-base leading-tight">{getTeamName(match.homeTeamId)}</div>
                                            </div>

                                            {/* Score / VS */}
                                            <div className="flex flex-col items-center justify-center w-1/3">
                                                {match.status === 'running' || match.status === 'finished' ? (
                                                    <div className="text-4xl font-display font-bold italic tracking-tighter">
                                                        <span className={match.homeScore > match.awayScore ? 'text-elkawera-accent' : 'text-white'}>{match.homeScore}</span>
                                                        <span className="text-gray-600 mx-2">-</span>
                                                        <span className={match.awayScore > match.homeScore ? 'text-elkawera-accent' : 'text-white'}>{match.awayScore}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl font-black text-white/20">VS</div>
                                                )}
                                                {match.status === 'running' && (
                                                    <div className="mt-2 text-xs font-bold text-red-500 animate-pulse">45'</div>
                                                )}
                                            </div>

                                            {/* Away */}
                                            <div className="flex flex-col items-center text-center w-1/3">
                                                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 p-2 group-hover:scale-105 transition-transform">
                                                    {getTeamLogo(match.awayTeamId) ? (
                                                        <img src={getTeamLogo(match.awayTeamId)} alt="Home" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Users size={24} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="font-bold text-sm md:text-base leading-tight">{getTeamName(match.awayTeamId)}</div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-center pt-6 border-t border-white/5 text-xs text-gray-500 gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                {formatDate(match.createdAt)}
                                            </div>
                                            {match.isExternal && (
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold uppercase text-[10px]">
                                                    Community
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
