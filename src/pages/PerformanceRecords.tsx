import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getPlayerById,
    getAllTeams,
    savePlayerWithStatsNotification
} from '@/utils/db';
import { Player, Team } from '@/types';
import { computeOverallWithPerformance } from '@/utils/calculation';
import {
    Save,
    RotateCcw,
    Zap,
    Award,
    Activity,
    LayoutDashboard,
    Bell,
    ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { showToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';

const StatStepper = ({ label, value, onChange, min = 0, max = 999 }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-[#00ff9d]/30 transition-all">
        <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">{label}</span>
            <span className="text-2xl font-display font-black text-white">{value}</span>
        </div>
        <div className="flex gap-2">
            <button
                onClick={() => onChange(Math.max(min, value - 1))}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-90"
            >
                -
            </button>
            <button
                onClick={() => onChange(Math.min(max, value + 1))}
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00ff9d]/20 hover:border-[#00ff9d]/30 transition-all active:scale-90"
            >
                +
            </button>
        </div>
    </div>
);

export const PerformanceRecords: React.FC = () => {
    const { playerId } = useParams<{ playerId: string }>();
    const { user } = useAuth();
    const { dir } = useSettings();
    const navigate = useNavigate();

    const [player, setPlayer] = useState<Player | null>(null);
    const [editData, setEditData] = useState<Player | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }

        const loadData = async () => {
            if (!playerId) return;
            try {
                const [p, t] = await Promise.all([
                    getPlayerById(playerId),
                    getAllTeams()
                ]);
                if (p) {
                    setPlayer(p);
                    setEditData({ ...p });
                }
                setTeams(t);
            } catch (err) {
                console.error("Error loading player data", err);
                showToast('Error loading player data', 'error');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [playerId, user, navigate]);

    const handleUpdateStat = (field: keyof Player, value: any) => {
        if (!editData) return;
        
        const updatedData = { ...editData, [field]: value };
        
        // Automatically recalculate overall rating when performance stats or base score change
        const performanceFields = [
            'goals', 'assists', 'defensiveContributions', 'cleanSheets',
            'saves', 'penaltySaves', 'ownGoals', 'goalsConceded', 'penaltyMissed',
            'baseScore'
        ];
        
        if (performanceFields.includes(field)) {
            // Calculate new overall based on performance using baseScore
            const baseScore = updatedData.baseScore || 50; // Default to 50 if not set
            const newOverall = computeOverallWithPerformance(
                baseScore,
                updatedData.position,
                {
                    goals: updatedData.goals,
                    assists: updatedData.assists,
                    defensiveContributions: updatedData.defensiveContributions,
                    cleanSheets: updatedData.cleanSheets,
                    saves: updatedData.saves,
                    penaltySaves: updatedData.penaltySaves,
                    ownGoals: updatedData.ownGoals,
                    goalsConceded: updatedData.goalsConceded,
                    penaltyMissed: updatedData.penaltyMissed
                }
            );
            updatedData.overallScore = newOverall;
        }
        
        setEditData(updatedData);
    };

    const handleSave = async () => {
        if (!player || !editData) return;
        setSaving(true);
        try {
            await savePlayerWithStatsNotification(player, editData);
            showToast(`Stats updated for ${editData.name}`, 'success');
            // Allow some time for toast before redirecting or just stay on page? 
            // Staying on page is better for continued editing.
            setPlayer(editData); // Update original state
            setTimeout(() => setSaving(false), 500);
        } catch (err) {
            console.error(err);
            showToast('Failed to update stats', 'error');
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-[#00ff9d]/20 border-t-[#00ff9d] rounded-full animate-spin"></div>
        </div>
    );

    if (!editData) return <div className="p-10 text-center">Player not found</div>;

    return (
        <div className="container mx-auto pb-20 px-4 sm:px-6 py-8" dir={dir}>
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} /> Back
            </button>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></span>
                        <span className="text-[#00ff9d] text-[10px] font-bold tracking-[0.3em] uppercase">Elite Control</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-display font-bold uppercase tracking-tighter text-white">
                        Performance <span className="text-[#00ff9d]">Records</span>
                    </h1>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 max-w-5xl mx-auto"
            >
                {/* Identity Hero */}
                <div className="bg-gradient-to-r from-[#00ff9d]/20 to-transparent border border-[#00ff9d]/30 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Activity size={120} />
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 relative z-10 items-center md:items-start">
                        <div className="w-24 h-24 rounded-2xl bg-black border-2 border-[#00ff9d] overflow-hidden shadow-[0_0_30px_rgba(0,255,157,0.2)]">
                            {editData.imageUrl ? <img src={editData.imageUrl} className="w-full h-full object-cover" alt={editData.name} /> : <div className="p-4 text-gray-800 w-full h-full flex items-center justify-center text-4xl font-bold">{editData.name.charAt(0)}</div>}
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-display font-black uppercase text-white tracking-widest leading-none mb-2">{editData.name}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className="px-3 py-1 rounded bg-[#00ff9d] text-black text-[10px] font-black uppercase tracking-widest">{editData.position} Unit</span>
                                <span className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase tracking-tighter">
                                    <LayoutDashboard size={12} /> {teams.find(t => t.id === editData.teamId)?.name || 'Unassigned Elite'}
                                </span>
                                <span className="text-[#00ff9d] text-xs font-mono">#{editData.id.slice(0, 6)}</span>
                            </div>
                        </div>
                        <div className="md:ml-auto text-center">
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Current Rating</div>
                            <div className="text-6xl font-display font-black text-[#00ff9d] drop-shadow-[0_0_15px_rgba(0,255,157,0.5)]">{editData.overallScore}</div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Evaluation Controls */}
                    <div className="space-y-4">
                        <div className="p-2 border-b border-white/5 flex items-center gap-2">
                            <Zap size={14} className="text-[#00ff9d]" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Performance Metrics</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <StatStepper label="Matches" value={editData.matchesPlayed} onChange={(v: any) => handleUpdateStat('matchesPlayed', v)} />
                            <div className="grid grid-cols-2 gap-3">
                                <StatStepper label="Goals" value={editData.goals} onChange={(v: any) => handleUpdateStat('goals', v)} />
                                <StatStepper label="Assists" value={editData.assists} onChange={(v: any) => handleUpdateStat('assists', v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <StatStepper label="Defensive Sub" value={editData.defensiveContributions} onChange={(v: any) => handleUpdateStat('defensiveContributions', v)} />
                                <StatStepper label="Clean Sheets" value={editData.cleanSheets} onChange={(v: any) => handleUpdateStat('cleanSheets', v)} />
                            </div>
                            {editData.position === 'GK' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <StatStepper label="Saves" value={editData.saves || 0} onChange={(v: any) => handleUpdateStat('saves', v)} />
                                    <StatStepper label="Pen. Saves" value={editData.penaltySaves} onChange={(v: any) => handleUpdateStat('penaltySaves', v)} />
                                </div>
                            )}
                            {/* Negative Performance Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                                <StatStepper label="Own Goals" value={editData.ownGoals || 0} onChange={(v: any) => handleUpdateStat('ownGoals', v)} />
                                <StatStepper label="Pen. Missed" value={editData.penaltyMissed || 0} onChange={(v: any) => handleUpdateStat('penaltyMissed', v)} />
                            </div>
                            {editData.position === 'GK' && (
                                <StatStepper label="Goals Conceded" value={editData.goalsConceded || 0} onChange={(v: any) => handleUpdateStat('goalsConceded', v)} />
                            )}
                        </div>

                        {/* Overall Rating Display */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calculated Overall Rating</span>
                                <span className={`text-xl font-display font-black ${editData.overallScore > 85 ? 'text-[#00ff9d]' : 'text-white'}`}>{editData.overallScore}</span>
                            </div>
                            <div className="text-[10px] text-gray-600 mb-2">Automatically calculated performance metrics</div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-[#00ff9d] to-[#00d1ff] transition-all duration-300"
                                    style={{ width: `${(editData.overallScore / 99) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-[8px] text-gray-600 font-bold uppercase tracking-tighter">
                                <span>Min (1)</span>
                                <span>Base: {editData.baseScore || 50}</span>
                                <span>Max (99)</span>
                            </div>
                        </div>
                    </div>

                    {/* Intelligence Center: Tier & Efficiency */}
                    <div className="space-y-4">
                        <div className="p-2 border-b border-white/5 flex items-center gap-2">
                            <Award size={14} className="text-[#00ff9d]" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Elite Milestone Analysis</span>
                        </div>

                        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#00ff9d]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            {/* Tier Meter */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Performance Tier</span>
                                    <span className="text-xs text-[#00ff9d] font-bold">
                                        {editData.overallScore >= 90 ? 'LEGENDARY UNIT' : editData.overallScore >= 80 ? 'WORLD CLASS' : 'RISING ELITE'}
                                    </span>
                                </div>
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(editData.overallScore / 99) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-[#00ff9d] to-[#00d1ff] shadow-[0_0_20px_rgba(0,255,157,0.4)] relative z-10"
                                    />
                                    <div className="absolute inset-y-0 left-[70%] w-px bg-white/10 z-0"></div>
                                    <div className="absolute inset-y-0 left-[85%] w-px bg-white/10 z-0"></div>
                                </div>
                                <div className="flex justify-between mt-2 text-[8px] text-gray-600 font-bold uppercase tracking-tighter">
                                    <span>Recruit</span>
                                    <span>Pro (70)</span>
                                    <span>Elite (85)</span>
                                    <span>99</span>
                                </div>
                            </div>

                            {/* Rank Context & KPI Analysis would go here - simplified for this view */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#00ff9d]/20 flex items-center justify-center text-[#00ff9d]">
                                            <Activity size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Goals Per Match</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{(editData.goals / (editData.matchesPlayed || 1)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#00d1ff]/20 flex items-center justify-center text-[#00d1ff]">
                                            <Zap size={14} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Assist Ratio</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{(editData.assists / (editData.matchesPlayed || 1)).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notification Preview */}
                        <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell size={14} className="text-[#00ff9d]" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase">System Push Preview</span>
                            </div>
                            <div className="text-xs text-white leading-relaxed">
                                "<span className="text-[#00ff9d] font-bold">Elite Stats Refreshed!</span> Your performance has been verified. Goals: <span className="text-[#00ff9d]">{editData.goals - (player?.goals || 0) >= 0 ? '+' : ''}{editData.goals - (player?.goals || 0)}</span>, Rating: <span className="text-[#00ff9d]">{editData.overallScore}</span>"
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Bar */}
                <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between sticky bottom-4">
                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Changes Staged</span>
                        <span className="text-xs text-white font-mono">Sync required for database persistence</span>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setEditData({ ...player! })}
                            className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-all font-bold flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-[2] md:flex-none px-12 py-3 bg-[#00ff9d] text-black rounded-xl font-bold hover:bg-white transition-all hover:shadow-[0_0_30px_rgba(0,255,157,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <><Save size={18} /> Update Performance</>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

