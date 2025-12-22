import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMatchById, getAllTeams, getPlayerById } from '../utils/db';
import { Match, Team, Player, MatchEvent } from '../types';
import { ArrowLeft, Trophy, Calendar, Users, Award, Shield, Activity, Download, FileText } from 'lucide-react';
import { showToast } from '../components/Toast';
import { MatchReport } from '../components/MatchReport';
import { toPng } from 'html-to-image';
import { useRef } from 'react';

export const MatchDetails: React.FC = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [match, setMatch] = useState<Match | null>(null);
    const [homeTeam, setHomeTeam] = useState<Team | null>(null);
    const [awayTeam, setAwayTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

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

                setMatch(matchData);

                // Load teams
                const teams = await getAllTeams();
                const home = teams.find(t => t.id === matchData.homeTeamId);
                const away = teams.find(t => t.id === matchData.awayTeamId);
                setHomeTeam(home || null);
                setAwayTeam(away || null);

                // Load all players
                const allPlayerIds = [...matchData.homePlayerIds, ...matchData.awayPlayerIds];
                const playerPromises = allPlayerIds.map(id => getPlayerById(id));
                const loadedPlayers = await Promise.all(playerPromises);
                const validPlayers = loadedPlayers.filter(p => p !== undefined) as Player[];
                setPlayers(validPlayers);

                setLoading(false);
            } catch (error) {
                console.error('Error loading match details:', error);
                setLoading(false);
            }
        };

        loadMatchData();
    }, [matchId, navigate]);

    if (loading) {
        return <div className="text-center py-20">Loading match details...</div>;
    }

    if (!match || !homeTeam || !awayTeam) {
        return <div className="text-center py-20">Match data unavailable</div>;
    }

    // Helper to calculate stats from events
    const getPlayerStats = (playerId: string) => {
        const playerEvents = match.events.filter(e => e.playerId === playerId);
        return {
            goals: playerEvents.filter(e => e.type === 'goal').length,
            assists: playerEvents.filter(e => e.type === 'assist').length,
            defensiveContributions: playerEvents.filter(e => e.type === 'defensive_contribution').length,
            cleanSheets: playerEvents.some(e => e.type === 'clean_sheet'),
            penaltySaves: playerEvents.filter(e => e.type === 'penalty_save').length,
        };
    };

    const homePlayers = players.filter(p => match.homePlayerIds.includes(p.id));
    const awayPlayers = players.filter(p => match.awayPlayerIds.includes(p.id));

    const mvpPlayer = players.find(p => p.id === match.manOfTheMatch);

    const handleDownloadReport = async () => {
        if (!reportRef.current || !match) return;

        setDownloading(true);
        showToast('Generating high-resolution report...', 'info');

        try {
            // Give it a moment to ensure everything is rendered
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await toPng(reportRef.current, {
                quality: 1.0,
                pixelRatio: 2, // High resolution for professional print
                backgroundColor: '#000000',
            });

            // Dynamically load jsPDF from CDN for robustness
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(script);

            script.onload = () => {
                const { jsPDF } = (window as any).jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                pdf.save(`Match-Report-${match.id.slice(0, 8)}.pdf`);
                showToast('Match Report PDF downloaded successfully!', 'success');
                setDownloading(false);
            };

            script.onerror = () => {
                // Fallback to PNG if CDN fails
                const link = document.createElement('a');
                link.download = `Match-Report-${match.id.slice(0, 8)}.png`;
                link.href = dataUrl;
                link.click();
                showToast('Downloaded as PNG (PDF generator unavailable)', 'info');
                setDownloading(false);
            };

        } catch (error) {
            console.error('Error generating report:', error);
            showToast('Failed to generate report', 'error');
            setDownloading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/matches')}
                    className="p-2 bg-white/5 rounded-full hover:bg-white/10"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-bold uppercase">Match Overview</h1>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(match.finishedAt || match.createdAt).toLocaleDateString()}
                        <span className="text-gray-600">|</span>
                        <Users size={14} />
                        {players.length} Players
                    </p>
                </div>

                <div className="ml-auto">
                    <button
                        onClick={handleDownloadReport}
                        disabled={downloading}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
                            ${downloading
                                ? 'bg-gray-600 cursor-not-allowed text-white/50'
                                : 'bg-elkawera-accent text-black hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]'}
                        `}
                    >
                        {downloading ? (
                            <>
                                <Activity className="animate-spin" size={18} />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <FileText size={18} />
                                Download PDF Report
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Scoreboard */}
            <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-mesh opacity-10"></div>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Home Team */}
                    <div className="flex-1 text-center">
                        <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Home Team</div>
                        <div className="text-2xl md:text-4xl font-bold mb-4">{homeTeam.name}</div>
                        <div className="text-6xl md:text-8xl font-display font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {match.homeScore}
                        </div>
                    </div>

                    {/* VS / Status */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="px-6 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-bold uppercase border border-green-500/30">
                            Create for {match.isExternal ? 'External Captain' : 'Admin'}
                        </div>
                        <div className="text-4xl font-display font-bold text-white/20">VS</div>
                        <div className="text-sm text-gray-500">ID: {match.id.slice(0, 8)}</div>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 text-center">
                        <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Away Team</div>
                        <div className="text-2xl md:text-4xl font-bold mb-4">{awayTeam.name}</div>
                        <div className="text-6xl md:text-8xl font-display font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {match.awayScore}
                        </div>
                    </div>
                </div>

                {/* MVP Banner */}
                {mvpPlayer && (
                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center justify-center animate-pulse-slow">
                        <div className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2">Man of the Match</div>
                        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 px-6 py-3 rounded-full">
                            <Trophy className="text-yellow-400" size={24} />
                            <span className="text-xl font-bold text-white">{mvpPlayer.name}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Team Stats Comparison */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Home Stats */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-elkawera-accent uppercase flex items-center gap-2">
                        <Shield size={20} />
                        {homeTeam.name} Stats
                    </h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left">Player</th>
                                    <th className="px-4 py-3 text-center">G</th>
                                    <th className="px-4 py-3 text-center">A</th>
                                    <th className="px-4 py-3 text-center">Def</th>
                                    <th className="px-4 py-3 text-center">CS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {homePlayers.map(player => {
                                    const stats = getPlayerStats(player.id);
                                    // Only show if played (which they did if in list)
                                    // Highlight if they did something
                                    const hasStats = stats.goals > 0 || stats.assists > 0 || stats.defensiveContributions > 0 || stats.cleanSheets || stats.penaltySaves > 0;

                                    return (
                                        <tr key={player.id} className={`hover:bg-white/5 transition-colors ${hasStats ? 'bg-white/5' : ''}`}>
                                            <td className="px-4 py-3 font-medium">
                                                <button
                                                    onClick={() => navigate(`/player/${player.id}`)}
                                                    className="flex items-center gap-2 hover:text-elkawera-accent hover:underline text-left group"
                                                >
                                                    <span className="group-hover:translate-x-1 transition-transform">{player.name}</span>
                                                    {match.manOfTheMatch === player.id && <Trophy size={12} className="text-yellow-400" />}
                                                </button>
                                            </td>
                                            <td className={`px-4 py-3 text-center ${stats.goals > 0 ? 'text-green-400 font-bold' : 'text-gray-600'}`}>
                                                {stats.goals || '-'}
                                            </td>
                                            <td className={`px-4 py-3 text-center ${stats.assists > 0 ? 'text-blue-400 font-bold' : 'text-gray-600'}`}>
                                                {stats.assists || '-'}
                                            </td>
                                            <td className={`px-4 py-3 text-center ${stats.defensiveContributions > 0 ? 'text-yellow-400 font-bold' : 'text-gray-600'}`}>
                                                {stats.defensiveContributions || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {stats.cleanSheets ? <span className="text-green-400">Yes</span> : <span className="text-gray-600">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Away Stats */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-elkawera-accent uppercase flex items-center gap-2">
                        <Shield size={20} />
                        {awayTeam.name} Stats
                    </h2>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left">Player</th>
                                    <th className="px-4 py-3 text-center">G</th>
                                    <th className="px-4 py-3 text-center">A</th>
                                    <th className="px-4 py-3 text-center">Def</th>
                                    <th className="px-4 py-3 text-center">CS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {awayPlayers.map(player => {
                                    const stats = getPlayerStats(player.id);
                                    const hasStats = stats.goals > 0 || stats.assists > 0 || stats.defensiveContributions > 0 || stats.cleanSheets || stats.penaltySaves > 0;

                                    return (
                                        <tr key={player.id} className={`hover:bg-white/5 transition-colors ${hasStats ? 'bg-white/5' : ''}`}>
                                            <td className="px-4 py-3 font-medium">
                                                <button
                                                    onClick={() => navigate(`/player/${player.id}`)}
                                                    className="flex items-center gap-2 hover:text-elkawera-accent hover:underline text-left group"
                                                >
                                                    <span className="group-hover:translate-x-1 transition-transform">{player.name}</span>
                                                    {match.manOfTheMatch === player.id && <Trophy size={12} className="text-yellow-400" />}
                                                </button>
                                            </td>
                                            <td className={`px-4 py-3 text-center ${stats.goals > 0 ? 'text-green-400 font-bold' : 'text-gray-600'}`}>
                                                {stats.goals || '-'}
                                            </td>
                                            <td className={`px-4 py-3 text-center ${stats.assists > 0 ? 'text-blue-400 font-bold' : 'text-gray-600'}`}>
                                                {stats.assists || '-'}
                                            </td>
                                            <td className={`px-4 py-3 text-center ${stats.defensiveContributions > 0 ? 'text-yellow-400 font-bold' : 'text-gray-600'}`}>
                                                {stats.defensiveContributions || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {stats.cleanSheets ? <span className="text-green-400">Yes</span> : <span className="text-gray-600">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Match Timeline / Events Log (Optional future expansion) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-elkawera-accent" />
                    Match Events Summary
                </h3>
                <div className="space-y-4">
                    {match.events.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-4">Detailed event timeline not available for this match.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {/* Group by Type for summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-black/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-400">{match.events.filter(e => e.type === 'goal').length}</div>
                                    <div className="text-xs text-gray-400 uppercase">Total Goals</div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-400">{match.events.filter(e => e.type === 'assist').length}</div>
                                    <div className="text-xs text-gray-400 uppercase">Total Assists</div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-yellow-400">{match.events.filter(e => e.type === 'defensive_contribution').length}</div>
                                    <div className="text-xs text-gray-400 uppercase">Defensive Acts</div>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-red-400">{match.events.filter(e => e.type === 'penalty_save').length}</div>
                                    <div className="text-xs text-gray-400 uppercase">Penalty Saves</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Report Template for Capture */}
            <MatchReport
                match={match}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                players={players}
                reportRef={reportRef}
            />
        </div>
    );
};
