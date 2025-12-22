
import React from 'react';
import { Match, Team, Player } from '../types';
import { Trophy, Shield, Activity, Calendar, MapPin, Users, Award } from 'lucide-react';

interface MatchReportProps {
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    players: Player[];
    reportRef: React.RefObject<HTMLDivElement>;
}

export const MatchReport: React.FC<MatchReportProps> = ({ match, homeTeam, awayTeam, players, reportRef }) => {
    const homePlayers = players.filter(p => match.homePlayerIds.includes(p.id));
    const awayPlayers = players.filter(p => match.awayPlayerIds.includes(p.id));
    const mvpPlayer = players.find(p => p.id === match.manOfTheMatch);

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

    return (
        <div className="absolute left-[-9999px] top-0">
            <div
                ref={reportRef}
                className="w-[1200px] bg-elkawera-black text-white p-12 relative overflow-hidden font-sans"
                style={{ minHeight: '1600px' }}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-elkawera-accent/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-center mb-16 border-b border-white/10 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2">
                            <img src="/elkawera.jpg" alt="ELKAWERA" className="w-12 h-12 object-contain rounded-full" crossOrigin="anonymous" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-display font-bold italic tracking-tighter">
                                ELKAWERA<span className="text-elkawera-accent">.</span>
                            </h1>
                            <p className="text-elkawera-accent uppercase tracking-[0.2em] text-xs font-bold">Official Match Report</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white/50">{new Date(match.finishedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div className="text-sm text-gray-500 uppercase tracking-widest mt-1">Match ID: {match.id.toUpperCase().slice(0, 8)}</div>
                    </div>
                </div>

                {/* Score Banner */}
                <div className="relative z-10 bg-gradient-to-br from-white/10 to-transparent border border-white/20 rounded-[40px] p-12 mb-16 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-12">
                        {/* Home */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="relative w-36 h-36 mb-6">
                                {/* Logo Glow/Backlight */}
                                <div className="absolute inset-0 bg-elkawera-accent/30 rounded-full blur-2xl animate-pulse"></div>
                                <div className="absolute inset-0 bg-white/10 rounded-full blur-md"></div>

                                <div className="relative w-full h-full rounded-full bg-black border-4 border-white/20 shadow-2xl overflow-hidden flex items-center justify-center ring-4 ring-black/50">
                                    {homeTeam.logoUrl ? (
                                        <img
                                            src={homeTeam.logoUrl}
                                            alt={homeTeam.name}
                                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <Shield size={72} className="text-white/10" />
                                    )}
                                </div>
                            </div>
                            <h2 className="text-3xl font-display font-black uppercase tracking-tighter text-center mb-2">{homeTeam.name}</h2>
                            <div className="px-4 py-1 bg-elkawera-accent/20 border border-elkawera-accent/30 rounded-full text-[10px] text-elkawera-accent font-black uppercase tracking-[0.4em]">Home Squad</div>
                        </div>

                        {/* Result */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-8">
                                <span className="text-9xl font-display font-bold text-white leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{match.homeScore}</span>
                                <span className="text-5xl font-display font-bold text-white/20">:</span>
                                <span className="text-9xl font-display font-bold text-white leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{match.awayScore}</span>
                            </div>
                            <div className="px-8 py-3 bg-white text-black font-black uppercase tracking-[0.3em] rounded-full text-sm">
                                {match.homeScore > match.awayScore ? `${homeTeam.name} WIN` : match.awayScore > match.homeScore ? `${awayTeam.name} WIN` : 'DRAW'}
                            </div>
                        </div>

                        {/* Away */}
                        <div className="flex-1 flex flex-col items-center">
                            <div className="relative w-36 h-36 mb-6">
                                {/* Logo Glow/Backlight */}
                                <div className="absolute inset-0 bg-elkawera-accent/30 rounded-full blur-2xl animate-pulse"></div>
                                <div className="absolute inset-0 bg-white/10 rounded-full blur-md"></div>

                                <div className="relative w-full h-full rounded-full bg-black border-4 border-white/20 shadow-2xl overflow-hidden flex items-center justify-center ring-4 ring-black/50">
                                    {awayTeam.logoUrl ? (
                                        <img
                                            src={awayTeam.logoUrl}
                                            alt={awayTeam.name}
                                            className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <Shield size={72} className="text-white/10" />
                                    )}
                                </div>
                            </div>
                            <h2 className="text-3xl font-display font-black uppercase tracking-tighter text-center mb-2">{awayTeam.name}</h2>
                            <div className="px-4 py-1 bg-elkawera-accent/20 border border-elkawera-accent/30 rounded-full text-[10px] text-elkawera-accent font-black uppercase tracking-[0.4em]">Away Squad</div>
                        </div>
                    </div>
                </div>

                {/* Man of the Match */}
                {mvpPlayer && (
                    <div className="relative z-10 mb-16">
                        <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent border-l-4 border-yellow-500 p-8 rounded-r-3xl">
                            <div className="flex items-center gap-8">
                                <div className="p-6 bg-yellow-500 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                                    <Award size={48} className="text-black" />
                                </div>
                                <div>
                                    <div className="text-yellow-500 font-bold uppercase tracking-[0.4em] text-sm mb-2">Man of the Match</div>
                                    <h2 className="text-5xl font-display font-bold uppercase italic">{mvpPlayer.name}</h2>
                                    <div className="mt-2 flex items-center gap-4 text-gray-400">
                                        <span className="px-3 py-1 bg-white/10 rounded-md text-xs font-bold uppercase tracking-widest">{mvpPlayer.position}</span>
                                        <span className="flex items-center gap-2">
                                            <Activity size={14} className="text-elkawera-accent" />
                                            Overall Rating: {mvpPlayer.overallScore}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Player Stats Tables */}
                <div className="relative z-10 grid grid-cols-2 gap-12">
                    {/* Home Team Table */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                            <div className="relative w-14 h-14">
                                <div className="absolute inset-0 bg-elkawera-accent/20 rounded-full blur-lg"></div>
                                <div className="relative w-full h-full rounded-full border-2 border-white/20 bg-black overflow-hidden flex items-center justify-center">
                                    {homeTeam.logoUrl ? (
                                        <img src={homeTeam.logoUrl} alt={homeTeam.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <Shield size={24} className="text-elkawera-accent" />
                                    )}
                                </div>
                            </div>
                            <h3 className="text-2xl font-display font-black uppercase tracking-tighter">{homeTeam.name}</h3>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-white/10 text-left">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Player</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">G</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">A</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">DEF</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">CS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {homePlayers.map(p => {
                                        const stats = getPlayerStats(p.id);
                                        return (
                                            <tr key={p.id}>
                                                <td className="px-6 py-4 font-bold">{p.name}</td>
                                                <td className={`px-4 py-4 text-center font-bold ${stats.goals > 0 ? 'text-green-400' : 'text-gray-600'}`}>{stats.goals || '-'}</td>
                                                <td className={`px-4 py-4 text-center font-bold ${stats.assists > 0 ? 'text-blue-400' : 'text-gray-600'}`}>{stats.assists || '-'}</td>
                                                <td className={`px-4 py-4 text-center font-bold ${stats.defensiveContributions > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{stats.defensiveContributions || '-'}</td>
                                                <td className="px-4 py-4 text-center">{stats.cleanSheets ? <div className="w-4 h-4 rounded-full bg-green-500 mx-auto shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Away Team Table */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                            <div className="relative w-14 h-14">
                                <div className="absolute inset-0 bg-elkawera-accent/20 rounded-full blur-lg"></div>
                                <div className="relative w-full h-full rounded-full border-2 border-white/20 bg-black overflow-hidden flex items-center justify-center">
                                    {awayTeam.logoUrl ? (
                                        <img src={awayTeam.logoUrl} alt={awayTeam.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <Shield size={24} className="text-elkawera-accent" />
                                    )}
                                </div>
                            </div>
                            <h3 className="text-2xl font-display font-black uppercase tracking-tighter">{awayTeam.name}</h3>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-white/10 text-left">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400">Player</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">G</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">A</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">DEF</th>
                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">CS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {awayPlayers.map(p => {
                                        const stats = getPlayerStats(p.id);
                                        return (
                                            <tr key={p.id}>
                                                <td className="px-6 py-4 font-bold">{p.name}</td>
                                                <td className={`px-4 py-4 text-center font-bold ${stats.goals > 0 ? 'text-green-400' : 'text-gray-600'}`}>{stats.goals || '-'}</td>
                                                <td className={`px-4 py-4 text-center font-bold ${stats.assists > 0 ? 'text-blue-400' : 'text-gray-600'}`}>{stats.assists || '-'}</td>
                                                <td className={`px-4 py-4 text-center font-bold ${stats.defensiveContributions > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{stats.defensiveContributions || '-'}</td>
                                                <td className="px-4 py-4 text-center">{stats.cleanSheets ? <div className="w-4 h-4 rounded-full bg-green-500 mx-auto shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end border-t border-white/10 pt-8">
                    <div className="max-w-md">
                        <p className="text-gray-500 text-xs leading-relaxed uppercase tracking-tighter italic">
                            ELKAWERA IS A REGISTERED PLAYER CARD MANAGEMENT PLATFORM FOR AMATEUR AND PROFESSIONAL FOOTBALL. ALL DATA PRESENTED IS VERIFIED BY LICENSED ELKAWERA SCRUTINEERS.
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-[0.3em] font-bold mb-1 underline decoration-elkawera-accent decoration-2 underline-offset-4">Verified Report</div>
                        <div className="text-xl font-display font-bold italic">ELKAWERA DIGITAL LABS</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
