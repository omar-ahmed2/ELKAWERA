import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
import { getAllTeams, togglePlayerLike } from '../utils/db';
import { Heart, Users, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PlayerCardProps {
    player: Player;
    isFlipped?: boolean;
    onFlip?: () => void;
    className?: string;
    allowFlipClick?: boolean;
    uniqueId?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    isFlipped: externalFlipped,
    onFlip,
    className = "",
    allowFlipClick = true,
    uniqueId = "card",
    children,
    style
}) => {
    const [internalFlipped, setInternalFlipped] = useState(false);
    const [team, setTeam] = useState<Team | null>(null);
    const { user } = useAuth();
    const [likes, setLikes] = useState(player.likes || 0);
    const [isLiked, setIsLiked] = useState(false);

    const isFlipped = externalFlipped !== undefined ? externalFlipped : internalFlipped;

    useEffect(() => {
        if (player.teamId) {
            getAllTeams().then(teams => {
                const foundTeam = teams.find(t => t.id === player.teamId);
                setTeam(foundTeam || null);
            });
        } else {
            setTeam(null);
        }
        setLikes(player.likes || 0);
        if (user && player.likedBy) {
            setIsLiked(player.likedBy.includes(user.id));
        }
    }, [player, user]);

    const handleFlip = () => {
        if (allowFlipClick) {
            if (onFlip) onFlip();
            else setInternalFlipped(!internalFlipped);
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            console.log("Please log in to like players.");
            return;
        }
        const newIsLiked = !isLiked;
        const newLikes = newIsLiked ? likes + 1 : Math.max(0, likes - 1);
        setIsLiked(newIsLiked);
        setLikes(newLikes);
        try {
            await togglePlayerLike(player.id, user.id);
        } catch (error) {
            console.error("Failed to toggle like:", error);
            setIsLiked(!newIsLiked);
            setLikes(!newIsLiked ? likes + 1 : Math.max(0, likes - 1));
        }
    };

    const getThemeStyles = () => {
        const patternId = `pattern-${player.cardType}-${uniqueId}`;
        const foilId = `foil-${player.cardType}-${uniqueId}`;

        // Role-based Color Accents
        let roleAccentText = 'text-white';
        let roleAccentBg = 'bg-white';

        switch (player.position) {
            case 'GK': roleAccentText = 'text-emerald-400'; roleAccentBg = 'bg-emerald-400'; break;
            case 'CB': roleAccentText = 'text-blue-400'; roleAccentBg = 'bg-blue-400'; break;
            case 'CF': roleAccentText = 'text-rose-400'; roleAccentBg = 'bg-rose-400'; break;
            default: break;
        }

        // Reuse the existing elegant themes
        switch (player.cardType) {
            case 'Elite':
                return {
                    wrapper: 'bg-[#0f0404]',
                    bg: 'bg-gradient-to-br from-[#1a0505] via-[#450a0a] to-[#000000] bg-[length:300%_300%] animate-gradient-x',
                    border: 'border-[#fca5a5] border-opacity-60',
                    borderGlow: 'shadow-[0_0_40px_rgba(220,38,38,0.4),inset_0_0_20px_rgba(220,38,38,0.2)]',
                    borderInner: 'border-white/20',
                    text: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]',
                    textSecondary: 'text-[#fecaca]',
                    shadow: 'shadow-[0_0_100px_rgba(220,38,38,0.6),0_30px_90px_rgba(0,0,0,0.9)]',
                    overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-black/80',
                    badgeBg: 'bg-black/40 backdrop-blur-md',
                    badgeBorder: 'border-red-500/50',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <svg width="100%" height="100%" className="opacity-50 mix-blend-color-dodge">
                                <defs>
                                    <pattern id={patternId} width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                        <rect x="0" y="0" width="40" height="40" stroke="rgba(254,202,202,0.3)" strokeWidth="0.5" fill="none" />
                                        <rect x="40" y="40" width="40" height="40" stroke="rgba(254,202,202,0.3)" strokeWidth="0.5" fill="none" />
                                        <circle cx="40" cy="40" r="2" fill="white" className="animate-pulse" />
                                        <path d="M0 80 L80 0" stroke="rgba(254,202,202,0.2)" strokeWidth="1" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-red-900/40 to-transparent mix-blend-overlay"></div>
                        </div>
                    )
                };

            case 'Platinum':
                return {
                    // Reverted to darker/more professional look as requested in previous steps, just in case
                    wrapper: 'bg-[#020617]',
                    bg: 'bg-gradient-to-br from-[#0c1e3a] via-[#0ea5e9] to-[#1e3a5f] bg-[length:400%_400%] animate-gradient-x',
                    border: 'border-[#38bdf8]',
                    borderGlow: 'shadow-[0_0_30px_rgba(56,189,248,0.8),inset_0_0_30px_rgba(56,189,248,0.3)]',
                    borderInner: 'border-[#bae6fd]/60',
                    text: 'text-[#e0f2fe]',
                    textSecondary: 'text-[#7dd3fc]',
                    shadow: 'shadow-[0_0_80px_rgba(14,165,233,0.7),0_20px_60px_rgba(0,0,0,0.5)]',
                    overlay: 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/50 via-cyan-300/20 to-transparent',
                    badgeBg: 'bg-[#020617]/95',
                    badgeBorder: 'border-[#38bdf8]',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-40 mix-blend-overlay">
                                <defs>
                                    <pattern id={patternId} width="60" height="60" patternUnits="userSpaceOnUse">
                                        <path d="M30 0 L60 30 L30 60 L0 30 Z" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" fill="none" />
                                        <circle cx="30" cy="30" r="3" fill="rgba(255,255,255,0.6)" />
                                    </pattern>
                                    <linearGradient id={foilId} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="rgba(186,230,253,0.3)" />
                                        <stop offset="50%" stopColor="rgba(14,165,233,0.5)" />
                                        <stop offset="100%" stopColor="rgba(186,230,253,0.3)" />
                                    </linearGradient>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                                <path d="M0 0 L320 200 L0 400 Z" fill={`url(#${foilId})`} opacity="0.5" />
                                <path d="M320 0 L0 200 L320 400 Z" fill={`url(#${foilId})`} opacity="0.3" />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0ea5e9]/40 via-transparent to-[#38bdf8]/20 animate-pulse"></div>
                        </div>
                    )
                };

            case 'Gold':
                return {
                    wrapper: 'bg-[#422006]',
                    bg: 'bg-gradient-to-br from-[#854d0e] via-[#fbbf24] to-[#92400e] bg-[length:400%_400%] animate-gradient-x',
                    border: 'border-[#fde047]',
                    borderGlow: 'shadow-[0_0_30px_rgba(253,224,71,0.9),inset_0_0_30px_rgba(251,191,36,0.4)]',
                    borderInner: 'border-[#fef08a]/70',
                    text: 'text-[#422006]',
                    textSecondary: 'text-[#854d0e]',
                    shadow: 'shadow-[0_0_80px_rgba(234,179,8,0.8),0_20px_60px_rgba(0,0,0,0.5)]',
                    overlay: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-50/60 via-transparent to-yellow-900/50',
                    badgeBg: 'bg-[#fffbeb]/95',
                    badgeBorder: 'border-[#fde047]',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <svg width="100%" height="100%" viewBox="0 0 320 480" xmlns="http://www.w3.org/2000/svg" className="opacity-35 mix-blend-overlay">
                                <circle cx="160" cy="240" r="120" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
                                <circle cx="160" cy="240" r="200" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/50 via-transparent to-yellow-100/30"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent animate-shimmer-slow"></div>
                        </div>
                    )
                };

            case 'Silver':
            default:
                return {
                    wrapper: 'bg-[#111827]',
                    bg: 'bg-gradient-to-br from-[#374151] via-[#e5e7eb] to-[#4b5563] bg-[length:400%_400%] animate-gradient-x',
                    border: 'border-[#d1d5db]',
                    borderGlow: 'shadow-[0_0_25px_rgba(209,213,219,0.7),inset_0_0_25px_rgba(229,231,235,0.3)]',
                    borderInner: 'border-[#9ca3af]/60',
                    text: 'text-[#111827]',
                    textSecondary: 'text-[#374151]',
                    shadow: 'shadow-[0_0_70px_rgba(156,163,175,0.6),0_20px_60px_rgba(0,0,0,0.5)]',
                    overlay: 'bg-[linear-gradient(135deg,transparent_30%,rgba(255,255,255,0.6)_50%,transparent_70%)]',
                    badgeBg: 'bg-[#f3f4f6]/95',
                    badgeBorder: 'border-[#e5e7eb]',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-25 mix-blend-color-burn">
                                <defs>
                                    <pattern id={patternId} width="24" height="41.6" patternUnits="userSpaceOnUse" patternTransform="scale(2.5)">
                                        <path d="M12 0 L24 6.93 L24 20.8 L12 27.73 L0 20.8 L0 6.93 Z" fill="none" stroke="black" strokeWidth="0.8" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/40 via-gray-100/20 to-gray-900/40"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent w-[40%] skew-x-[-20deg] animate-sheen-slide mix-blend-overlay"></div>
                        </div>
                    )
                };
        }
    };

    const theme = getThemeStyles();

    const StatBox = ({ label, value }: { label: string; value: string | number }) => (
        <div className="flex flex-col items-center justify-center relative z-20 group/stat">
            {/* Small background for legibility */}
            <div className={`absolute inset-0 rounded bg-white/10 blur-[2px] opacity-0 group-hover/stat:opacity-100 transition-opacity`}></div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${theme.textSecondary} mb-0.5 relative`}>{label}</span>
            <span className={`text-xl font-display font-black leading-none ${theme.text} drop-shadow-sm relative`}>{value}</span>
        </div>
    );

    return (
        <div
            className={`group relative w-[320px] h-[480px] cursor-pointer perspective-1000 ${className} select-none transition-transform duration-300 hover:scale-[1.02] hover:-translate-y-2`}
            onClick={handleFlip}
            style={style}
        >
            {/* Outer Glow */}
            <div className={`absolute inset-0 rounded-[32px_32px_24px_24px] ${theme.shadow} transition-all duration-300 opacity-60 group-hover:opacity-100 -z-10 blur-2xl`}></div>

            {/* Flipper Container */}
            <div className={`relative w-full h-full transform-style-3d flip-transition ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* --- FRONT SIDE --- */}
                <div
                    id={`card-front-${uniqueId}`}
                    className={`absolute w-full h-full backface-hidden overflow-hidden flex flex-col shadow-2xl ${theme.bg}`}
                    style={{
                        borderRadius: '32px 32px 24px 24px',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                    }}
                >
                    {/* Border Effects */}
                    <div
                        className={`absolute inset-0 border-[5px] ${theme.border} ${theme.borderGlow} pointer-events-none z-50`}
                        style={{ borderRadius: '32px 32px 24px 24px' }}
                    ></div>
                    <div className={`absolute inset-2 border-2 ${theme.borderInner} z-10 pointer-events-none`} style={{ borderRadius: '28px 28px 20px 20px' }}></div>
                    <div className="absolute inset-0 pointer-events-none z-30 translate-x-[-150%] skew-x-12 group-hover:animate-shimmer transition-none bg-gradient-to-r from-transparent via-white/50 to-transparent w-[50%] h-full blur-sm mix-blend-soft-light"></div>

                    {/* Backgrounds */}
                    {theme.pattern}
                    <div className={`absolute inset-0 z-0 pointer-events-none ${theme.overlay} mix-blend-overlay`}></div>

                    {/* Header Content */}
                    <div className="relative p-5 pt-6 flex justify-between items-start z-20">
                        {/* Left: Overall Rating & Position & Team Logo (Replaces Country) */}
                        <div className="flex flex-col items-center space-y-1.5">
                            <span
                                className={`text-7xl font-display font-black leading-none tracking-tighter ${theme.text}`}
                                style={{
                                    textShadow: '0 3px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.2)',
                                    WebkitTextStroke: '1px rgba(0,0,0,0.1)'
                                }}
                            >
                                {player.overallScore}
                            </span>
                            <span className={`text-xl font-black uppercase tracking-widest opacity-95 ${theme.roleAccentText}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                {player.position}
                            </span>

                            <div className={`w-14 h-0.5 opacity-80 my-2 rounded-full ${theme.roleAccentBg}`}></div>

                            {/* Team Logo (Replaces Country) */}
                            {team && (
                                <div
                                    className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[10px] font-bold text-black border-2 border-white/90 overflow-hidden relative group-hover:scale-110 transition-transform`}
                                    title={team.name}
                                >
                                    {team.logoUrl ? (
                                        <img src={team.logoUrl} alt={team.shortName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <span style={{ color: team.color }}>{team.shortName}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Interaction (Elkawera logo removed) */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="z-30">
                                <button
                                    onClick={handleLike}
                                    className={`group/like flex flex-col items-center gap-1 p-3 rounded-2xl backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 ${isLiked
                                        ? 'bg-red-500/90 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                                        : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white border border-white/20'
                                        }`}
                                >
                                    <Heart
                                        size={20}
                                        fill={isLiked ? 'currentColor' : 'none'}
                                        className={`transition-all duration-300 ${isLiked ? 'animate-pulse' : 'group-hover/like:scale-110'}`}
                                    />
                                    <span className="text-xs font-bold leading-none">{likes}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Player Image - CENTERED */}
                    <div className="absolute inset-x-0 bottom-[130px] z-10 flex items-end justify-center pointer-events-none">
                        {player.imageUrl ? (
                            <img
                                src={player.imageUrl}
                                alt={player.name}
                                className="w-auto h-[320px] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105"
                                style={{
                                    maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
                                    filter: 'contrast(1.1) saturate(1.1)'
                                }}
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <Users size={180} className={`opacity-20 ${theme.text}`} />
                        )}
                    </div>

                    {/* Card Footer Info */}
                    <div className="mt-auto relative z-20 pb-5 px-5">
                        <div className="relative mb-4 text-center px-1">
                            <h2
                                className={`text-3xl font-display font-black uppercase leading-tight pb-1 px-1 ${theme.text}`}
                                style={{
                                    textShadow: '0 3px 6px rgba(0,0,0,0.4), 0 0 15px rgba(255,255,255,0.15)',
                                    wordBreak: 'break-word',
                                    letterSpacing: '0.02em'
                                }}
                            >
                                {player.name}
                            </h2>
                            <div className={`w-28 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 mx-auto mt-2 rounded-full ${theme.text}`}></div>
                        </div>

                        {/* Main Stats Grid - REPLACED with Matches, Clean Sheets, etc */}
                        <div className="grid grid-cols-6 gap-2.5 border-t-2 border-black/15 pt-3.5">
                            <StatBox label="MAT" value={player.matchesPlayed || 0} />
                            <StatBox label="CLN" value={player.cleanSheets || 0} />
                            <StatBox label="GOL" value={player.goals || 0} />
                            <StatBox label="AST" value={player.assists || 0} />
                            <StatBox label="DEF" value={player.defensiveContributions || 0} />
                            <StatBox label="SAV" value={player.penaltySaves || 0} />
                        </div>
                    </div>

                    {/* Decorative Bottom Edge */}
                    <div className={`h-3 w-full absolute bottom-0 left-0 bg-gradient-to-r from-transparent via-black/30 to-transparent`}></div>
                </div>

                {/* --- BACK SIDE --- */}
                <div
                    id={`card-back-${uniqueId}`}
                    className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-[24px] border-[6px] ${theme.border} overflow-hidden flex flex-col items-center justify-center shadow-2xl ${theme.bg}`}
                >
                    {theme.pattern}
                    <div className={`absolute inset-0 bg-black/10 pointer-events-none`}></div>

                    {/* Large Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] scale-150 rotate-12">
                        <img src="/elkawera.jpg" className="w-[300px] h-auto object-contain grayscale" alt="Watermark" />
                    </div>

                    {/* Content: Elkawera Logo + "Created by Elkawera" */}
                    <div className="relative z-10 flex flex-col items-center gap-8 animate-fadeIn">
                        {/* Main Logo Container */}
                        <div className="relative group/logo">
                            <div className={`absolute inset-0 rounded-full bg-white/40 blur-xl scale-110`}></div>
                            <div
                                className={`relative w-40 h-40 rounded-full border-[5px] border-white/50 shadow-2xl flex items-center justify-center bg-white overflow-hidden z-20`}
                            >
                                <img src="/elkawera.jpg" className="w-full h-full object-cover" alt="Elkawera" />
                            </div>
                        </div>

                        {/* Footer Text */}
                        <div className="text-center relative z-20">
                            <div className={`text-[10px] font-bold uppercase tracking-[0.4em] mb-2 opacity-60 ${theme.text}`}>Authentic</div>
                            <p
                                className={`text-xl font-display font-black uppercase tracking-widest ${theme.text}`}
                                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                            >
                                Created by Elkawera
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {children && (
                <div className="absolute inset-0 z-50 pointer-events-none [&>*]:pointer-events-auto">
                    {children}
                </div>
            )}
        </div>
    );
};
