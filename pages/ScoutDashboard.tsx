
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
            <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-purple-900/50 to-black/50 border border-purple-500/30 p-8 rounded-3xl backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">
                        Welcome back, <span className="text-purple-400">{user?.name}</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] flex items-center gap-2">
                        <Shield size={16} className="text-purple-400" />
                        {profile?.scoutType} Scout
                        {profile?.organization && <span className="text-[var(--text-secondary)]/70">• {profile.organization}</span>}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex gap-4">
                    {/* Stats Cards */}
                    <div className="bg-[var(--bg-primary)]/50 p-4 rounded-2xl border border-[var(--border-color)] text-center min-w-[100px]">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{profile?.totalPlayersViewed || 0}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Players Viewed</div>
                    </div>
                    <div className="bg-[var(--bg-primary)]/50 p-4 rounded-2xl border border-[var(--border-color)] text-center min-w-[100px]">
                        <div className="text-2xl font-bold text-[var(--text-primary)]">{profile?.totalTeamsViewed || 0}</div>
                        <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Teams Viewed</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recently Viewed Players */}
                <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-3xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <Users className="text-purple-400" /> Recently Viewed Players
                    </h2>
                    <div className="space-y-4">
                        {uniquePlayers.length > 0 ? (
                            uniquePlayers.map((activity) => (
                                <Link to={`/player/${activity.entityId}`} key={activity.id} className="block bg-[var(--bg-primary)]/40 hover:bg-[var(--bg-primary)]/60 p-4 rounded-xl border border-[var(--border-color)] transition-all flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                                            {activity.entityName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-[var(--text-primary)] font-bold group-hover:text-purple-400 transition-colors">{activity.entityName}</div>
                                            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                                                <Clock size={10} /> {new Date(activity.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <Eye size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                                </Link>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-8">No players viewed yet.</div>
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                        <Link to="/leaderboard" className="text-sm text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider">Browse All Players</Link>
                    </div>
                </div>

                {/* Recently Viewed Teams */}
                <div className="bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-3xl p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                        <Shield className="text-purple-400" /> Recently Viewed Teams
                    </h2>
                    <div className="space-y-4">
                        {uniqueTeams.length > 0 ? (
                            uniqueTeams.map((activity) => (
                                <div key={activity.id} className="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center text-gray-500 cursor-not-allowed">
                                    {/* Assuming team view isn't fully implemented or just generic */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white">
                                            T
                                        </div>
                                        <div>
                                            <div className="text-white font-bold">{activity.entityName}</div>
                                            <div className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-8">No teams viewed yet.</div>
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                        <Link to="/teams" className="text-sm text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider">Browse All Teams</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
