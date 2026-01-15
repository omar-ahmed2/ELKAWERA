import React, { useState, useEffect, useRef } from 'react';
import { Event, Team, Match, MatchStatus } from '@/types';
import { getAllTeams, saveMatch, updateEvent, notifyAllUsers, getPlayersByTeamId, createNotification } from '@/utils/db';
import { v4 as uuidv4 } from 'uuid';
import { XCircle, RefreshCw, Trophy, ArrowRight, Save, Calendar, Clock, Trash2, PlusCircle, Users } from 'lucide-react';

interface EventMatchMakerProps {
    event: Event;
    onClose: () => void;
    onUpdate: () => void;
}

interface QueuedMatch {
    id: string; // Temporary ID
    homeTeam: Team;
    awayTeam: Team;
    date?: string; // ISO string
    time?: string; // ISO string
}

export const EventMatchMaker: React.FC<EventMatchMakerProps> = ({ event, onClose, onUpdate }) => {
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
    const [wheelTeams, setWheelTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<QueuedMatch[]>([]);
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState<Team | null>(null);
    const [pendingWinner, setPendingWinner] = useState<Team | null>(null); // State to hold winner before confirmation

    // Wheel animation ref
    const wheelRef = useRef<HTMLDivElement>(null);
    const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const rotationRef = useRef(0);

    // Current pairing state
    const [currentHome, setCurrentHome] = useState<Team | null>(null);

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        const teams = await getAllTeams();
        setAllTeams(teams);

        // Filter valid teams from event registration
        const validRegistrations = event.registeredTeams?.filter(r => r.status === 'approved') || [];
        const validTeamIds = validRegistrations.map(r => r.teamId);

        const teamsInEvent = teams.filter(t => validTeamIds.includes(t.id));
        setAvailableTeams(teamsInEvent);
    };

    // --- Wheel Logic ---

    const addToWheel = (team: Team) => {
        setWheelTeams(prev => [...prev, team]);
        setAvailableTeams(prev => prev.filter(t => t.id !== team.id));
    };

    const removeFromWheel = (team: Team) => {
        setAvailableTeams(prev => [...prev, team]);
        setWheelTeams(prev => prev.filter(t => t.id !== team.id));
    };

    const addAllToWheel = () => {
        setWheelTeams(prev => [...prev, ...availableTeams]);
        setAvailableTeams([]);
    };

    const spinWheel = () => {
        if (wheelTeams.length < 1) return;
        setSpinning(true);
        setWinner(null);
        setPendingWinner(null);

        // Pre-determine winner
        const randomIndex = Math.floor(Math.random() * wheelTeams.length);
        const win = wheelTeams[randomIndex];

        // Determine slice angles
        const sliceAngle = 360 / wheelTeams.length;

        // Center angle of the winning slice (approx middle of the wedge)
        const winnerCenterAngle = (sliceAngle * randomIndex) + (sliceAngle / 2);

        // Current rotation
        const currentRotation = rotationRef.current;

        // Calculate target: At least 5 spins (1800 deg)
        // We want final position such that: (rotation + winnerCenterAngle) % 360 aligned to Top (0/360)
        // Essentially: Target = K * 360 - winnerCenterAngle

        const minSpins = 5;
        const baseRotation = currentRotation + (minSpins * 360);

        // Find nearest valid target >= baseRotation
        // target + winnerCenterAngle must be multiple of 360
        const targetRotation = Math.ceil((baseRotation + winnerCenterAngle) / 360) * 360 - winnerCenterAngle;

        rotationRef.current = targetRotation;

        if (wheelRef.current) {
            wheelRef.current.style.transition = 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
            wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
        }

        spinTimeoutRef.current = setTimeout(() => {
            setSpinning(false);
            setPendingWinner(win);
        }, 3000);
    };

    const addToMatch = (team: Team) => {
        if (!currentHome) {
            setCurrentHome(team);
        } else {
            const newMatch: QueuedMatch = {
                id: uuidv4(),
                homeTeam: currentHome,
                awayTeam: team,
                date: undefined,
                time: undefined
            };
            setMatches(prev => [...prev, newMatch]);
            setCurrentHome(null);
        }
        setAvailableTeams(prev => prev.filter(t => t.id !== team.id));
    };

    const confirmWinner = () => {
        if (!pendingWinner) return;

        if (!currentHome) {
            setCurrentHome(pendingWinner);
        } else {
            // Pair formed!
            const newMatch: QueuedMatch = {
                id: uuidv4(),
                homeTeam: currentHome,
                awayTeam: pendingWinner,
                date: undefined,
                time: undefined
            };
            setMatches(prev => [...prev, newMatch]);
            setCurrentHome(null);
        }

        // Remove from wheel permanently (it's now in a match or partial match)
        setWheelTeams(prev => prev.filter(t => t.id !== pendingWinner.id));
        setPendingWinner(null);

        // Reset wheel rotation
        if (wheelRef.current) {
            wheelRef.current.style.transition = 'none';
            wheelRef.current.style.transform = 'rotate(0deg)';
        }
    };

    const rejectWinner = () => {
        // Keep in wheel, just reset
        setPendingWinner(null);
        if (wheelRef.current) {
            wheelRef.current.style.transition = 'none';
            wheelRef.current.style.transform = 'rotate(0deg)';
        }
    };

    const returnTeamToWheel = (team: Team, matchId?: string) => {
        setWheelTeams(prev => [...prev, team]);
        if (matchId) {
            // If checking a match, we might be disbanding it
            setMatches(prev => prev.filter(m => m.id !== matchId));
            // If we disband a match, we need to return BOTH teams
            const match = matches.find(m => m.id === matchId);
            if (match) {
                if (match.homeTeam.id !== team.id) setWheelTeams(p => [...p, match.homeTeam]);
                if (match.awayTeam.id !== team.id) setWheelTeams(p => [...p, match.awayTeam]);
            }
        } else {
            // Just returning the current home selection
            setCurrentHome(null);
        }
    };

    const disbandMatch = (match: QueuedMatch) => {
        setMatches(prev => prev.filter(m => m.id !== match.id));
        setWheelTeams(prev => [...prev, match.homeTeam, match.awayTeam]);
    };

    const saveSchedule = async () => {
        if (matches.length === 0) {
            alert('No matches to save.');
            return;
        }

        if (wheelTeams.length % 2 !== 0 && wheelTeams.length > 0) {
            if (!confirm(`There are ${wheelTeams.length} teams still on the wheel (odd number). One team will not be matched. Continue?`)) return;
        } else if (!confirm('This will create real matches and notify all participants. Continue?')) {
            return;
        }

        try {
            for (const m of matches) {
                // Get players for lineups
                const homePlayers = await getPlayersByTeamId(m.homeTeam.id);
                const awayPlayers = await getPlayersByTeamId(m.awayTeam.id);

                const realMatch: Match = {
                    id: uuidv4(),
                    eventId: event.id,
                    homeTeamId: m.homeTeam.id,
                    awayTeamId: m.awayTeam.id,
                    homeScore: 0,
                    awayScore: 0,
                    status: 'scheduled', // Start as scheduled
                    homePlayerIds: homePlayers.map(p => p.id),
                    awayPlayerIds: awayPlayers.map(p => p.id),
                    events: [],
                    createdAt: Date.now(),
                    isExternal: false,
                    createdBy: event.createdBy,
                    startedAt: m.date ? new Date(`${m.date}T${m.time || '00:00'}`).getTime() : undefined
                };

                await saveMatch(realMatch);

                // Notify Captains specifically
                const homeCaptainId = m.homeTeam.captainId;
                const awayCaptainId = m.awayTeam.captainId;

                const dateText = m.date || 'To Be Announced';
                const timeText = m.time || '';
                const locationText = event.location || 'Unknown Location';

                const notificationBase = {
                    type: 'match_approved' as const,
                    read: false,
                    createdAt: Date.now(),
                    metadata: { eventId: event.id, matchId: realMatch.id }
                };

                if (homeCaptainId) {
                    await createNotification({
                        ...notificationBase,
                        id: uuidv4(),
                        userId: homeCaptainId,
                        title: 'Match Scheduled',
                        message: `Your match vs ${m.awayTeam.name} is confirmed. Date: ${dateText} ${timeText}. Location: ${locationText}. Check event page for details.`
                    });
                }

                if (awayCaptainId) {
                    await createNotification({
                        ...notificationBase,
                        id: uuidv4(),
                        userId: awayCaptainId,
                        title: 'Match Scheduled',
                        message: `Your match vs ${m.homeTeam.name} is confirmed. Date: ${dateText} ${timeText}. Location: ${locationText}. Check event page for details.`
                    });
                }
            }

            // Update Event to mark as scheduled
            const updatedEvent = {
                ...event,
                schedulePublished: true,
                status: 'ongoing' as const,
                updatedAt: Date.now()
            };

            await updateEvent(updatedEvent);

            await notifyAllUsers(
                'Event Schedule Published',
                `The matches for ${event.title} have been announced! Check the event page.`,
                { eventId: event.id }
            );

            onUpdate();
            onClose();
            alert('Schedule published successfully!');

        } catch (error) {
            console.error(error);
            alert('Failed to save schedule');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col z-50 overflow-hidden font-sans">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-elkawera-accent flex items-center justify-center shadow-[0_0_20px_rgba(0,255,157,0.4)]">
                        <Trophy className="text-black" size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-display font-bold uppercase text-white tracking-wide">Match Generator</h2>
                        <p className="text-gray-400 text-sm">Automated Schedule Creation System</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <XCircle size={32} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900/50 via-black to-black -z-10"></div>

                {/* Left: Available Teams */}
                <div className="w-1/4 min-w-[300px] border-r border-white/10 p-6 overflow-y-auto bg-black/20 backdrop-blur-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold uppercase text-gray-400 text-sm tracking-wider flex items-center gap-2">
                            <Users size={16} /> Available Teams
                        </h3>
                        {availableTeams.length > 0 && (
                            <button onClick={addAllToWheel} className="text-xs font-bold text-elkawera-accent hover:text-white transition-colors bg-elkawera-accent/10 px-3 py-1 rounded-full border border-elkawera-accent/20 hover:bg-elkawera-accent/20">
                                Add All
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {availableTeams.length === 0 ? (
                            <div className="text-center py-10 text-gray-600 italic">No teams available</div>
                        ) : (
                            availableTeams.map(team => (
                                <div key={team.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-white/10 transition-all group hover:border-white/20 hover:shadow-lg">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-xs font-bold">
                                            {team.name.charAt(0)}
                                        </div>
                                        <span className="font-bold truncate text-sm">{team.name}</span>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button
                                            onClick={() => addToMatch(team)}
                                            title="Add to Match manually"
                                            className="w-8 h-8 rounded-full bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-black flex items-center justify-center transition-all"
                                        >
                                            <PlusCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => addToWheel(team)}
                                            title="Add to Wheel"
                                            className="w-8 h-8 rounded-full bg-elkawera-accent/20 hover:bg-elkawera-accent text-elkawera-accent hover:text-black flex items-center justify-center transition-all"
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold uppercase text-gray-400 text-sm tracking-wider flex items-center gap-2">
                                <RefreshCw size={16} /> On Wheel ({wheelTeams.length})
                            </h3>
                            {wheelTeams.length > 0 && (
                                <button onClick={() => {
                                    setAvailableTeams(prev => [...prev, ...wheelTeams]);
                                    setWheelTeams([]);
                                }} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                            )}
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                            {wheelTeams.map(team => (
                                <div key={team.id} className="bg-gradient-to-r from-elkawera-accent/5 to-transparent border border-elkawera-accent/20 p-2 rounded-lg flex justify-between items-center hover:bg-elkawera-accent/10 transition-colors">
                                    <span className="font-bold text-xs text-elkawera-accent/80 truncate pl-2">{team.name}</span>
                                    <button onClick={() => removeFromWheel(team)} className="text-gray-500 hover:text-red-400 p-1">
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center: The Wheel Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    {/* Status Badge */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 border border-white/10 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-gray-400 backdrop-blur-md">
                        {matches.length} Matches Created
                    </div>

                    <div className="relative mb-12 transform scale-100 transition-transform duration-500">
                        {/* Wheel Glow */}
                        <div className={`absolute inset-0 bg-elkawera-accent/20 blur-[100px] rounded-full transition-opacity duration-1000 ${spinning ? 'opacity-100 scale-125' : 'opacity-30 scale-100'}`}></div>

                        {/* Wheel Visual */}
                        <div
                            ref={wheelRef}
                            className="w-[450px] h-[450px] rounded-full relative shadow-2xl bg-[#0a0a0a] overflow-hidden flex items-center justify-center ring-4 ring-gray-800"
                        >
                            {/* SVG Wheel */}
                            <svg viewBox="-1 -1 2 2" className="w-full h-full absolute inset-0 pointer-events-none" style={{ transform: 'rotate(-90deg)' }}>
                                {wheelTeams.map((team, i) => {
                                    const total = wheelTeams.length;
                                    const startPercent = i / total;
                                    const endPercent = (i + 1) / total;

                                    const x1 = Math.cos(2 * Math.PI * startPercent);
                                    const y1 = Math.sin(2 * Math.PI * startPercent);
                                    const x2 = Math.cos(2 * Math.PI * endPercent);
                                    const y2 = Math.sin(2 * Math.PI * endPercent);

                                    // Make large arc flag 1 if slice is > 50% (only happens if 1 team, which we handle separately or is invalid for wheel)
                                    const largeArcFlag = total === 1 ? 1 : 0;

                                    // Valid SVG Path for slice
                                    const pathData = [
                                        `M 0 0`,
                                        `L ${x1} ${y1}`,
                                        `A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                        `Z`
                                    ].join(' ');

                                    // Color Logic
                                    const defaultColors = ['#dc2626', '#16a34a', '#2563eb', '#eab308', '#7c3aed', '#db2777'];
                                    const fillColor = team.color || defaultColors[i % defaultColors.length]; // Fallback to palette

                                    // Text Position (Midpoint outer)
                                    const midAngle = 2 * Math.PI * (i + 0.5) / total;

                                    return (
                                        <g key={team.id}>
                                            <path d={pathData} fill={fillColor} stroke="#1a1a1a" strokeWidth="0.01" />
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Text Overlay (Separate to avoid rotation weirdness if we want) OR inside SVG? 
                                Inside SVG with rotation transform is easier for alignment.
                            */}
                            {wheelTeams.map((team, i) => {
                                const total = wheelTeams.length;
                                const angle = (360 / total) * (i + 0.5); // Midpoint in degrees
                                return (
                                    <div
                                        key={team.id}
                                        className="absolute top-1/2 left-1/2 w-1/2 h-0 origin-left flex items-center"
                                        style={{
                                            transform: `rotate(${angle - 90}deg)`, // -90 because we rotated SVG parent -90, need to align
                                            zIndex: 10
                                        }}
                                    >
                                        <div
                                            className="ml-8 text-white font-bold uppercase text-[10px] tracking-widest whitespace-nowrap drop-shadow-md flex items-center gap-2"
                                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                        >
                                            {team.logoUrl && <img src={team.logoUrl} alt="" className="w-4 h-4 rounded-full bg-white/20" />}
                                            {team.shortName || team.name.substring(0, 15)}
                                        </div>
                                    </div>
                                );
                            })}

                            {wheelTeams.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
                                    <Trophy size={64} className="text-gray-700 mb-2 opacity-50" />
                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Add Teams</p>
                                </div>
                            )}

                            {/* Center Hub */}
                            <div className="absolute w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-full z-20 shadow-[0_0_20px_black] border-4 border-gray-700 flex items-center justify-center">
                                <div className="absolute text-elkawera-accent">
                                    <Trophy size={32} className={spinning ? 'animate-pulse' : ''} />
                                </div>
                            </div>
                        </div>

                        {/* Pointer */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                            <div className="w-6 h-10 bg-gradient-to-b from-red-600 to-red-800 rounded-b-full transform"></div>
                            <div className="w-8 h-2 bg-gray-800 absolute -top-1 -left-1 rounded"></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="w-full max-w-md mx-auto h-32 flex items-center justify-center">
                        {!pendingWinner ? (
                            <button
                                onClick={spinWheel}
                                disabled={spinning || wheelTeams.length === 0}
                                className="group relative px-16 py-5 bg-elkawera-accent text-black font-black text-2xl uppercase rounded-full shadow-[0_0_30px_rgba(0,255,157,0.3)] hover:shadow-[0_0_50px_rgba(0,255,157,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {spinning ? 'Spinning...' : 'SPIN WHEEL'}
                                </span>
                                <div className="absolute inset-0 bg-white/30 skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
                            </button>
                        ) : (
                            <div className="bg-black/80 backdrop-blur-xl rounded-3xl p-8 border border-elkawera-accent/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-scale-in text-center w-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-elkawera-accent to-transparent"></div>
                                <p className="text-gray-400 uppercase text-xs font-bold tracking-widest mb-3">Winner Selected</p>
                                <h3 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-elkawera-accent mb-6 drop-shadow-sm">{pendingWinner.name}</h3>
                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={confirmWinner}
                                        className="px-8 py-3 bg-green-500 text-black font-bold uppercase rounded-xl hover:bg-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all transform hover:-translate-y-1"
                                    >
                                        Select Team
                                    </button>
                                    <button
                                        onClick={rejectWinner}
                                        className="px-8 py-3 bg-white/10 text-white font-bold uppercase rounded-xl hover:bg-white/20 transition-all border border-white/10"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Matches Panel */}
                <div className="w-1/4 min-w-[320px] border-l border-white/10 p-6 overflow-y-auto bg-black/20 backdrop-blur-sm flex flex-col">
                    <h3 className="font-bold uppercase text-gray-400 mb-6 text-sm tracking-widest border-b border-white/10 pb-4">
                        Match Builder
                    </h3>

                    {/* Current Match Slot - Redesigned */}
                    <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-5 mb-8 shadow-inner">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] uppercase font-bold text-elkawera-accent tracking-widest">Current Slot</span>
                            {currentHome && <button onClick={() => setCurrentHome(null)} className="text-[10px] text-red-400 hover:underline">Clear</button>}
                        </div>

                        <div className="space-y-3">
                            {/* Home Slot */}
                            <div className={`p-4 rounded-xl border transition-all relative ${currentHome ? 'bg-elkawera-accent/10 border-elkawera-accent/50 shadow-[0_0_15px_rgba(0,255,157,0.1)]' : 'bg-black/40 border-dashed border-white/10'}`}>
                                {currentHome ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-elkawera-accent text-black flex items-center justify-center font-bold text-xs">H</div>
                                        <span className="font-bold">{currentHome.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center text-gray-600 text-xs font-bold uppercase py-2">
                                        Waiting for Spin...
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center -my-2 relative z-10">
                                <div className="bg-black border border-white/20 rounded-full w-8 h-8 flex items-center justify-center text-[10px] font-bold text-gray-400">VS</div>
                            </div>

                            {/* Away Slot (Placeholder) */}
                            <div className="p-4 rounded-xl bg-black/40 border border-dashed border-white/10 text-center">
                                <span className="text-gray-600 text-xs font-bold uppercase italic">Opponent</span>
                            </div>
                        </div>
                    </div>

                    {/* Matches List */}
                    <div className="flex-1 space-y-4 mb-6">
                        {matches.length === 0 && (
                            <div className="text-center text-gray-600 text-sm py-10">
                                No matches generated yet.
                            </div>
                        )}
                        {matches.map((match, idx) => (
                            <div key={match.id} className="bg-white/5 border border-white/5 rounded-xl p-4 relative group hover:bg-white/10 transition-colors">
                                <button
                                    onClick={() => disbandMatch(match)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                >
                                    <XCircle size={14} />
                                </button>

                                <div className="flex justify-between items-center mb-3 text-sm">
                                    <span className="font-bold text-white">{match.homeTeam.name}</span>
                                    <span className="text-xs text-elkawera-accent px-1">VS</span>
                                    <span className="font-bold text-white text-right">{match.awayTeam.name}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="bg-black/30 rounded px-2 py-1 flex items-center gap-2 border border-white/5">
                                        <Calendar size={12} className="text-gray-500" />
                                        <input
                                            type="date"
                                            className="bg-transparent border-none text-[10px] text-gray-300 w-full focus:outline-none"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setMatches(prev => prev.map(m => m.id === match.id ? { ...m, date: val } : m));
                                            }}
                                        />
                                    </div>
                                    <div className="bg-black/30 rounded px-2 py-1 flex items-center gap-2 border border-white/5">
                                        <Clock size={12} className="text-gray-500" />
                                        <input
                                            type="time"
                                            className="bg-transparent border-none text-[10px] text-gray-300 w-full focus:outline-none"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setMatches(prev => prev.map(m => m.id === match.id ? { ...m, time: val } : m));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/10">
                        <button
                            onClick={saveSchedule}
                            disabled={matches.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-elkawera-accent to-emerald-500 text-black font-bold uppercase rounded-xl hover:shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm tracking-wide"
                        >
                            <Save size={18} /> Publish Schedule
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

