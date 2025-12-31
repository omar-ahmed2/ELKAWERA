
import React, { useState, useEffect } from 'react';
import { getAllScoutProfiles, getAllScoutActivity, getAllUsers } from '../utils/db';
import { ScoutProfile, ScoutActivity, User } from '../types';
import { Search, Shield, Activity, User as UserIcon, Calendar, Clock, AlertTriangle } from 'lucide-react';

export const AdminScoutControl: React.FC = () => {
    const [scouts, setScouts] = useState<(ScoutProfile & { user: User })[]>([]);
    const [activities, setActivities] = useState<ScoutActivity[]>([]);
    const [selectedScout, setSelectedScout] = useState<(ScoutProfile & { user: User }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profiles, allActivities, allUsers] = await Promise.all([
                    getAllScoutProfiles(),
                    getAllScoutActivity(),
                    getAllUsers()
                ]);

                // Join User data with Scout Profile
                const enrichedScouts = profiles.map(profile => {
                    const user = allUsers.find(u => u.id === profile.userId);
                    return user ? { ...profile, user } : null;
                }).filter(Boolean) as (ScoutProfile & { user: User })[];

                setScouts(enrichedScouts);
                setActivities(allActivities);
            } catch (err) {
                console.error("Failed to load scout data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredScouts = scouts.filter(s =>
        s.user.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.user.email.toLowerCase().includes(filter.toLowerCase())
    );

    const getScoutActivities = (scoutId: string) => {
        return activities.filter(a => a.scoutId === scoutId).sort((a, b) => b.timestamp - a.timestamp);
    };

    const selectedScoutActivities = selectedScout ? getScoutActivities(selectedScout.userId) : [];

    // Analytics Helpers
    const getMostViewedEntity = (scoutActivities: ScoutActivity[]) => {
        if (scoutActivities.length === 0) return { name: 'N/A', count: 0 };
        const counts: Record<string, { name: string, count: number }> = {};
        scoutActivities.forEach(a => {
            if (!counts[a.entityId]) counts[a.entityId] = { name: a.entityName, count: 0 };
            counts[a.entityId].count++;
        });
        return Object.values(counts).sort((a, b) => b.count - a.count)[0];
    };

    if (loading) return <div className="p-8 text-white">Loading Scout Control...</div>;

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sidebar: Scout List */}
            <div className="w-full lg:w-1/3 bg-white/5 border border-white/10 rounded-3xl p-4 lg:p-6 flex flex-col lg:h-[calc(100vh-120px)] h-auto">
                <h2 className="text-lg lg:text-xl font-bold text-white mb-4 lg:mb-6 flex items-center gap-2">
                    <Shield className="text-purple-400" /> Scout Directory
                </h2>

                <div className="relative mb-4 lg:mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search scouts..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500"
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 max-h-96 lg:max-h-full">
                    {filteredScouts.map(scout => (
                        <button
                            key={scout.userId}
                            onClick={() => setSelectedScout(scout)}
                            className={`w-full text-left p-3 lg:p-4 rounded-xl border transition-all flex items-center gap-3 ${selectedScout?.userId === scout.userId ? 'bg-purple-900/40 border-purple-500/50' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                        >
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-white flex-shrink-0">
                                {scout.user.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-white font-bold text-sm lg:text-base truncate">{scout.user.name}</div>
                                <div className="text-xs text-gray-400">{scout.scoutType}</div>
                            </div>
                            {/* Activity Indicator */}
                            {scout.totalProfilesViewed > 50 && (
                                <AlertTriangle size={14} className="ml-auto text-yellow-500 flex-shrink-0" title="High Activity" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Panel: Scout Details */}
            <div className="w-full lg:w-2/3 bg-white/5 border border-white/10 rounded-3xl p-4 lg:p-8 overflow-y-auto lg:h-[calc(100vh-120px)] h-auto">
                {selectedScout ? (
                    <div className="space-y-6 lg:space-y-8 animate-fade-in">
                        {/* Identity Header */}
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start border-b border-white/10 pb-4 lg:pb-6">
                            <div className="text-center lg:text-left">
                                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{selectedScout.user.name}</h1>
                                <div className="flex flex-col gap-1 text-gray-400 text-sm">
                                    <span className="flex items-center gap-2 justify-center lg:justify-start"><UserIcon size={14} /> {selectedScout.user.email}</span>
                                    {selectedScout.phone && <span className="flex items-center gap-2 justify-center lg:justify-start"><Calendar size={14} /> {selectedScout.phone}</span>}
                                    <span className="flex items-center gap-2 justify-center lg:justify-start"><Shield size={14} /> {selectedScout.scoutType} • {selectedScout.organization || 'No Org'}</span>
                                    <span className="flex items-center gap-2 text-green-400 justify-center lg:justify-start"><Clock size={14} /> Active since {new Date(selectedScout.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="text-center lg:text-right mt-4 lg:mt-0">
                                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedScout.user.role === 'scout' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    Active
                                </div>
                                <div className="mt-2 text-xs text-gray-500">Last Active: {selectedScout.lastActive ? new Date(selectedScout.lastActive).toLocaleString() : 'Never'}</div>
                            </div>
                        </div>

                        {/* Analytics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                <div className="text-gray-400 text-xs uppercase mb-1">Total Views</div>
                                <div className="text-xl lg:text-2xl font-bold text-white">{selectedScout.totalProfilesViewed}</div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                <div className="text-gray-400 text-xs uppercase mb-1">Players Viewed</div>
                                <div className="text-xl lg:text-2xl font-bold text-white">{selectedScout.totalPlayersViewed}</div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                <div className="text-gray-400 text-xs uppercase mb-1">Top Interest</div>
                                <div className="text-sm lg:text-lg font-bold text-purple-400 truncate">{getMostViewedEntity(selectedScoutActivities).name}</div>
                                <div className="text-xs text-gray-500">{getMostViewedEntity(selectedScoutActivities).count} views</div>
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Activity size={18} className="text-purple-400" /> Activity Log
                            </h3>
                            <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                                {/* Mobile Card View */}
                                <div className="lg:hidden">
                                    <div className="space-y-2 p-4">
                                        {selectedScoutActivities.length > 0 ? (
                                            selectedScoutActivities.slice(0, 20).map(activity => (
                                                <div key={activity.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleString()}</span>
                                                        <span className="text-xs text-purple-400 uppercase">{activity.entityType}</span>
                                                    </div>
                                                    <div className="text-white font-medium text-sm mb-1">
                                                        {activity.actionType === 'view_player' ? 'Viewed Profile' : 'Viewed Team'}
                                                    </div>
                                                    <div className="text-purple-400 text-sm truncate">{activity.entityName}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500 py-8">No activity recorded yet.</div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Desktop Table View */}
                                <div className="hidden lg:block">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-gray-400 uppercase text-xs">
                                            <tr>
                                                <th className="p-4">Time</th>
                                                <th className="p-4">Action</th>
                                                <th className="p-4">Entity</th>
                                                <th className="p-4">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {selectedScoutActivities.length > 0 ? (
                                                selectedScoutActivities.slice(0, 50).map(activity => (
                                                    <tr key={activity.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 text-gray-400">{new Date(activity.timestamp).toLocaleString()}</td>
                                                        <td className="p-4 text-white font-medium">{activity.actionType === 'view_player' ? 'Viewed Profile' : 'Viewed Team'}</td>
                                                        <td className="p-4 text-purple-400">{activity.entityName}</td>
                                                        <td className="p-4 text-gray-500 uppercase text-xs">{activity.entityType}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-gray-500">No activity recorded yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-500 p-8">
                        <Shield size={64} className="mb-4 opacity-20" />
                        <p className="text-center">Select a scout to view details and analytics</p>
                    </div>
                )}
            </div>
        </div>
    );
};
