
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getScoutProfile, getScoutActivity } from '../utils/db';
import { ScoutProfile, ScoutActivity } from '../types';
import { User, Activity, Shield, Users, Eye, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ScoutDashboard: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<ScoutProfile | null>(null);
    const [activities, setActivities] = useState<ScoutActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.id) {
                try {
                    const [profileData, activityData] = await Promise.all([
                        getScoutProfile(user.id),
                        getScoutActivity(user.id)
                    ]);
                    setProfile(profileData || null);
                    setActivities(activityData || []);
                } catch (error) {
                    console.error("Error fetching scout data", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="p-8 text-white">Loading Dashboard...</div>;

    const recentPlayers = activities
        .filter(a => a.entityType === 'player')
        .slice(0, 5); // Show last 5

    // Deduping recent players if needed, but simple list is fine for now.
    // Actually, let's dedupe by entityId to show unique recent views.
    const uniquePlayers = Array.from(new Map<string, ScoutActivity>(activities.filter(a => a.entityType === 'player').map(item => [item.entityId, item])).values()).slice(0, 5);
    const uniqueTeams = Array.from(new Map<string, ScoutActivity>(activities.filter(a => a.entityType === 'team').map(item => [item.entityId, item])).values()).slice(0, 5);

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
            {/* Welcome Section */}
            <div className="flex flex-col lg:flex-row justify-between items-center bg-[var(--bg-secondary)] border border-purple-500/30 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="text-center lg:text-left">
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)] mb-2">
                        Welcome back, <span className="text-purple-400">{user?.name}</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] flex items-center gap-2 justify-center lg:justify-start">
                        <Shield size={16} className="text-purple-400" />
                        {profile?.scoutType} Scout
                        {profile?.organization && <span className="text-[var(--text-secondary)]/70">• {profile.organization}</span>}
                    </p>
                </div>
                <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* Stats Cards */}
                    <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] text-center flex-1 sm:flex-none shadow-inner">
                        <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{profile?.totalPlayersViewed || 0}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Players Viewed</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)] text-center flex-1 sm:flex-none shadow-inner">
                        <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">{profile?.totalTeamsViewed || 0}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Teams Viewed</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                {/* Recently Viewed Players */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-4 md:p-6 shadow-lg">
                    <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-4 md:mb-6 flex items-center gap-2">
                        <Users className="text-purple-400" /> Recently Viewed Players
                    </h2>
                    <div className="space-y-3 md:space-y-4">
                        {uniquePlayers.length > 0 ? (
                            uniquePlayers.map((activity) => (
                                <Link to={`/player/${activity.entityId}`} key={activity.id} className="block bg-[var(--bg-primary)] hover:border-purple-400 p-3 md:p-4 rounded-xl border border-[var(--border-color)] transition-all flex flex-col sm:flex-row sm:justify-between items-start sm:items-center group shadow-sm">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                            {activity.entityName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-[var(--text-primary)] font-bold group-hover:text-purple-400 transition-colors truncate">{activity.entityName}</div>
                                            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                                <Clock size={10} /> {new Date(activity.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <Eye size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors mt-2 sm:mt-0 flex-shrink-0" />
                                </Link>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-6 md:py-8">No players viewed yet.</div>
                        )}
                    </div>
                    <div className="mt-4 md:mt-6 pt-4 border-t border-white/10 text-center">
                        <Link to="/leaderboard" className="text-sm text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider">Browse All Players</Link>
                    </div>
                </div>

                {/* Recently Viewed Teams */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-4 md:p-6 shadow-lg">
                    <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] mb-4 md:mb-6 flex items-center gap-2">
                        <Shield className="text-purple-400" /> Recently Viewed Teams
                    </h2>
                    <div className="space-y-3 md:space-y-4">
                        {uniqueTeams.length > 0 ? (
                            uniqueTeams.map((activity) => (
                                <div key={activity.id} className="bg-[var(--bg-primary)] p-3 md:p-4 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-gray-500 cursor-not-allowed">
                                    {/* Assuming team view isn't fully implemented or just generic */}
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                            T
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-white font-bold truncate">{activity.entityName}</div>
                                            <div className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-6 md:py-8">No teams viewed yet.</div>
                        )}
                    </div>
                    <div className="mt-4 md:mt-6 pt-4 border-t border-white/10 text-center">
                        <Link to="/teams" className="text-sm text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider">Browse All Teams</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
