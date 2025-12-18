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
        const noiseId = `noise-${player.cardType}-${uniqueId}`;

        // Role-based Color Accents
        let roleAccentText = 'text-white';
        let roleAccentBg = 'bg-white';

        switch (player.position) {
            case 'GK': roleAccentText = 'text-emerald-400'; roleAccentBg = 'bg-emerald-400'; break;
            case 'CB': roleAccentText = 'text-blue-400'; roleAccentBg = 'bg-blue-400'; break;
            case 'CF': roleAccentText = 'text-rose-400'; roleAccentBg = 'bg-rose-400'; break;
            default: break;
        }

        switch (player.cardType) {
            case 'Platinum':
                return {
                    wrapper: 'bg-[#020617]',
                    bg: 'bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#010816] bg-[length:400%_400%] animate-gradient-x',
                    border: 'border-[#38bdf8] border-opacity-80',
                    borderGlow: 'shadow-[0_0_40px_rgba(14,165,233,0.5),inset_0_0_30px_rgba(14,165,233,0.3)]',
                    borderInner: 'border-cyan-400/40',
                    text: 'text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
                    textSecondary: 'text-cyan-400/80',
                    shadow: 'shadow-[0_0_100px_rgba(14,165,233,0.4),0_30px_60px_rgba(0,0,0,0.9)]',
                    overlay: 'bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.3),transparent_70%)]',
                    badgeBg: 'bg-black/60 backdrop-blur-xl',
                    badgeBorder: 'border-cyan-500/50',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            {/* Obsidian Texture */}
                            <svg width="100%" height="100%" className="absolute inset-0 opacity-20 mix-blend-overlay">
                                <filter id={noiseId}>
                                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                                    <feColorMatrix type="saturate" values="0" />
                                </filter>
                                <rect width="100%" height="100%" filter={`url(#${noiseId})`} />
                            </svg>
                            {/* Flowing Energy Patterns */}
                            <div className="absolute inset-0 opacity-40 bg-[length:400%_400%] animate-energy-flow bg-gradient-to-br from-transparent via-cyan-500/10 via-transparent to-transparent"></div>
                            {/* Neon Circuitry */}
                            <svg width="100%" height="100%" className="opacity-30 mix-blend-screen">
                                <defs>
                                    <pattern id={patternId} width="100" height="100" patternUnits="userSpaceOnUse">
                                        <path d="M0 50 L20 50 L30 40 L70 40 L80 50 L100 50" stroke="#38bdf8" strokeWidth="0.5" fill="none" className="animate-pulse" />
                                        <circle cx="30" cy="40" r="1.5" fill="#38bdf8" />
                                        <circle cx="70" cy="40" r="1.5" fill="#38bdf8" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                            </svg>
                            {/* Animated Sheen */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent w-[30%] -skew-x-20 animate-shimmer-fast"></div>
                        </div>
                    )
                };

            case 'Elite':
                return {
                    wrapper: 'bg-[#0f0404]',
                    bg: 'bg-gradient-to-br from-[#1a0505] via-[#450a0a] to-[#000000] bg-[length:300%_300%] animate-gradient-x',
                    border: 'border-red-600 border-opacity-70',
                    borderGlow: 'shadow-[0_0_50px_rgba(220,38,38,0.6),inset_0_0_20px_rgba(220,38,38,0.3)]',
                    borderInner: 'border-red-500/30',
                    text: 'text-white drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]',
                    textSecondary: 'text-red-400',
                    shadow: 'shadow-[0_0_120px_rgba(220,38,38,0.5),0_40px_80px_rgba(0,0,0,0.9)]',
                    overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/30 via-transparent to-black/90',
                    badgeBg: 'bg-red-950/40 backdrop-blur-md',
                    badgeBorder: 'border-red-500/40',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            {/* Aggressive Sharp Lines */}
                            <svg width="100%" height="100%" className="opacity-40 mix-blend-color-dodge">
                                <defs>
                                    <pattern id={patternId} width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                                        <path d="M0 0 L60 120 M120 0 L60 120" stroke="red" strokeWidth="2" fill="none" opacity="0.5" />
                                        <path d="M0 60 L120 60" stroke="red" strokeWidth="0.5" fill="none" opacity="0.3" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                            </svg>
                            {/* Pulsing Red Energy Hub */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] bg-[radial-gradient(circle,rgba(220,38,38,0.2)_0%,transparent_100%)] animate-pulse-slow"></div>
                            {/* Glitch Layer */}
                            <div className="absolute inset-0 opacity-10 animate-glitch bg-red-500/20 mix-blend-overlay"></div>
                            {/* Animated Red Particles */}
                            <svg width="100%" height="100%" className="absolute inset-0 animate-pulse">
                                <defs>
                                    <pattern id={`${patternId}-particles`} width="50" height="50" patternUnits="userSpaceOnUse">
                                        <circle cx="25" cy="25" r="1" fill="#ef4444" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId}-particles)`} />
                            </svg>
                        </div>
                    )
                };

            case 'Gold':
                return {
                    wrapper: 'bg-[#422006]',
                    bg: 'bg-gradient-to-br from-[#b45309] via-[#fbbf24] to-[#78350f] bg-[length:400%_400%] animate-gradient-x',
                    border: 'border-[#fde047]',
                    borderGlow: 'shadow-[0_0_40px_rgba(253,224,71,0.8),inset_0_0_40px_rgba(251,191,36,0.3)]',
                    borderInner: 'border-yellow-200/50',
                    text: 'text-[#422006] drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]',
                    textSecondary: 'text-[#92400e]',
                    shadow: 'shadow-[0_0_90px_rgba(234,179,8,0.7),0_30px_70px_rgba(0,0,0,0.6)]',
                    overlay: 'bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),transparent_80%)]',
                    badgeBg: 'bg-white/95 backdrop-blur-md',
                    badgeBorder: 'border-yellow-400',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            {/* Golden Sunburst */}
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,255,255,0.05)_10deg,transparent_20deg)] animate-rotate-slow"></div>
                            {/* Luxurious Texture */}
                            <svg width="100%" height="100%" className="opacity-30 mix-blend-overlay">
                                <defs>
                                    <pattern id={patternId} width="60" height="60" patternUnits="userSpaceOnUse">
                                        <circle cx="30" cy="30" r="25" stroke="white" strokeWidth="0.5" fill="none" />
                                        <path d="M30 5 L30 55 M5 30 L55 30" stroke="white" strokeWidth="0.2" fill="none" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                            </svg>
                            {/* Sparkles */}
                            <div className="absolute top-1/4 left-1/4 w-4 h-4 text-yellow-100/60 animate-sparkle">✦</div>
                            <div className="absolute top-1/2 right-1/3 w-3 h-3 text-yellow-100/40 animate-sparkle" style={{ animationDelay: '0.5s' }}>✦</div>
                            <div className="absolute bottom-1/4 right-1/4 w-5 h-5 text-yellow-100/50 animate-sparkle" style={{ animationDelay: '1.2s' }}>✦</div>
                            {/* Golden Sweep */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-[40%] -skew-x-20 animate-shimmer-fast"></div>
                        </div>
                    )
                };

            case 'Silver':
            default:
                return {
                    wrapper: 'bg-[#111827]',
                    bg: 'bg-gradient-to-br from-[#374151] via-[#9ca3af] to-[#4b5563] bg-[length:400%_400%] animate-gradient-x',
                    border: 'border-[#d1d5db] border-opacity-90',
                    borderGlow: 'shadow-[0_0_30px_rgba(209,213,219,0.5),inset_0_0_20px_rgba(229,231,235,0.3)]',
                    borderInner: 'border-[#f3f4f6]/60',
                    text: 'text-[#111827] drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]',
                    textSecondary: 'text-[#374151]',
                    shadow: 'shadow-[0_0_80px_rgba(156,163,175,0.5),0_20px_50px_rgba(0,0,0,0.4)]',
                    overlay: 'bg-[linear-gradient(135deg,transparent_20%,rgba(255,255,255,0.3)_50%,transparent_80%)]',
                    badgeBg: 'bg-[#f3f4f6]/95 backdrop-blur-sm',
                    badgeBorder: 'border-[#d1d5db]',
                    roleAccentText, roleAccentBg,
                    pattern: (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            {/* Metallic Brushed Texture */}
                            <div className="absolute inset-0 opacity-10 bg-[length:200%_200%] animate-energy-flow bg-gradient-to-tr from-black via-white to-black"></div>
                            {/* Clean Geometric Patterns */}
                            <svg width="100%" height="100%" className="opacity-20 mix-blend-multiply">
                                <defs>
                                    <pattern id={patternId} width="20" height="20" patternUnits="userSpaceOnUse">
                                        <rect width="10" height="10" fill="white" fillOpacity="0.5" />
                                        <rect x="10" y="10" width="10" height="10" fill="white" fillOpacity="0.5" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                            </svg>
                            {/* Cool Light Reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer"></div>
                            {/* Energy Scanning Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent animate-energy-flow" style={{ animationDuration: '3s' }}></div>
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
                        <div className="flex flex-col items-center gap-3" data-download-ignore="true">
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
