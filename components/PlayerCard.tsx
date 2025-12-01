import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
import { getTeamById, getAllTeams, togglePlayerLike } from '../utils/db';
import { Activity, Shield, Zap, Target, Wind, Dumbbell, Eye, Heart, User as UserIcon, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PlayerCardProps {
  player: Player;
  isFlipped?: boolean;
  onFlip?: () => void;
  className?: string;
  allowFlipClick?: boolean;
  uniqueId?: string; // To handle multiple cards on screen for downloading
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
  const { user } = useAuth(); // Get user from auth context
  const [likes, setLikes] = useState(player.likes || 0);
  const [isLiked, setIsLiked] = useState(false);

  const isFlipped = externalFlipped !== undefined ? externalFlipped : internalFlipped;

  useEffect(() => {
    if (player.teamId) {
      // Changed to getAllTeams to match the instruction's implied change
      getAllTeams().then(teams => {
        const foundTeam = teams.find(t => t.id === player.teamId);
        setTeam(foundTeam || null);
      });
    } else {
      setTeam(null);
    }

    // Initialize likes and isLiked based on player data and current user
    setLikes(player.likes || 0);
    if (user && player.likedBy) {
      setIsLiked(player.likedBy.includes(user.id));
    }
  }, [player, user]); // Added user to dependency array

  const handleFlip = () => {
    if (allowFlipClick) {
      if (onFlip) onFlip();
      else setInternalFlipped(!internalFlipped);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip when clicking the like button
    if (!user) {
      // Optionally, show a message to the user to log in
      console.log("Please log in to like players.");
      return;
    }

    // Optimistic update
    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : Math.max(0, likes - 1); // Ensure likes don't go below 0

    setIsLiked(newIsLiked);
    setLikes(newLikes);

    try {
      await togglePlayerLike(player.id, user.id);
    } catch (error) {
      console.error("Failed to toggle like:", error);
      // Revert optimistic update if API call fails
      setIsLiked(!newIsLiked);
      setLikes(!newIsLiked ? likes + 1 : Math.max(0, likes - 1));
    }
  };

  const getThemeStyles = () => {
    const patternId = `pattern-${player.cardType}-${uniqueId}`;
    const foilId = `foil-${player.cardType}-${uniqueId}`;

    switch (player.cardType) {
      case 'Platinum':
        return {
          // Icy Blue / Holographic / Diamond Shards
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
          boxBg: 'bg-white/15',
          pattern: (
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Diamond pattern with foil effect */}
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
              {/* Animated light rays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0ea5e9]/40 via-transparent to-[#38bdf8]/20 animate-pulse"></div>
              {/* Crystalline shards */}
              <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rotate-45 blur-xl"></div>
              <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-tr from-cyan-400/20 to-transparent -rotate-12 blur-2xl"></div>
            </div>
          )
        };
      case 'Gold':
        return {
          // Rich Luxury Gold / Metallic Sunburst
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
          boxBg: 'bg-white/85',
          pattern: (
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Radial sunburst with metallic texture */}
              <svg width="100%" height="100%" viewBox="0 0 320 480" xmlns="http://www.w3.org/2000/svg" className="opacity-35 mix-blend-overlay">
                <defs>
                  <radialGradient id={foilId}>
                    <stop offset="0%" stopColor="rgba(254,240,138,0.6)" />
                    <stop offset="50%" stopColor="rgba(251,191,36,0.4)" />
                    <stop offset="100%" stopColor="rgba(133,77,14,0.3)" />
                  </radialGradient>
                </defs>
                {/* Sunburst rays */}
                {Array.from({ length: 16 }).map((_, i) => (
                  <path
                    key={i}
                    d={`M160 240 L${160 + 200 * Math.cos((i * 22.5 * Math.PI) / 180)} ${240 + 300 * Math.sin((i * 22.5 * Math.PI) / 180)} L${160 + 200 * Math.cos(((i + 0.5) * 22.5 * Math.PI) / 180)} ${240 + 300 * Math.sin(((i + 0.5) * 22.5 * Math.PI) / 180)} Z`}
                    fill={i % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}
                  />
                ))}
                {/* Concentric circles */}
                <circle cx="160" cy="240" r="120" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
                <circle cx="160" cy="240" r="160" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
                <circle cx="160" cy="240" r="200" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
              </svg>
              {/* Metallic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/50 via-transparent to-yellow-100/30"></div>
              {/* Animated gold shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent animate-shimmer-slow"></div>
            </div>
          )
        };
      case 'Silver':
      default:
        return {
          // Metallic Steel / Tech Hex with Chrome Finish
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
          boxBg: 'bg-white/85',
          pattern: (
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Hexagonal tech pattern */}
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-25 mix-blend-color-burn">
                <defs>
                  <pattern id={patternId} width="24" height="41.6" patternUnits="userSpaceOnUse" patternTransform="scale(2.5)">
                    <path d="M12 0 L24 6.93 L24 20.8 L12 27.73 L0 20.8 L0 6.93 Z" fill="none" stroke="black" strokeWidth="0.8" />
                    <circle cx="12" cy="13.86" r="2" fill="black" opacity="0.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
              </svg>
              {/* Chrome gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/40 via-gray-100/20 to-gray-900/40"></div>
              {/* Animated metallic sheen */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent w-[40%] skew-x-[-20deg] animate-sheen-slide mix-blend-overlay"></div>
              {/* Reflective highlights */}
              <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-white/30 to-transparent"></div>
            </div>
          )
        };
    }
  };

  const theme = getThemeStyles();
  const countryCode = player.country.length === 2 ? player.country.toLowerCase() : null;

  const StatBox = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col items-center justify-center relative z-20">
      <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textSecondary}`}>{label}</span>
      <span className={`text-2xl font-display font-bold leading-none ${theme.text} drop-shadow-sm`}>{value}</span>
    </div>
  );

  const StatRowBack = ({ label, value }: { label: string; value: number }) => (
    <div className={`flex justify-between items-center text-[11px] font-bold uppercase tracking-wider mb-1.5 border-b border-black/5 pb-0.5 ${theme.textSecondary}`}>
      <span>{label}</span>
      <span className={`${theme.text} text-sm`}>{value}</span>
    </div>
  );

  return (
    <div
      className={`group relative w-[320px] h-[480px] cursor-pointer perspective-1000 ${className} select-none transition-transform duration-300 hover:scale-105`}
      onClick={handleFlip}
      style={style}
    >
      {/* Outer Glow - Enhanced */}
      <div className={`absolute inset-0 rounded-[32px_32px_24px_24px] ${theme.shadow} transition-all duration-300 opacity-60 group-hover:opacity-100 -z-10 blur-2xl`}></div>

      {/* Flipper Container */}
      <div className={`relative w-full h-full transform-style-3d flip-transition ${isFlipped ? 'rotate-y-180' : ''} will-change-transform`}>

        {/* --- FRONT SIDE --- */}
        <div
          id={`card-front-${uniqueId}`}
          className={`absolute w-full h-full backface-hidden overflow-hidden flex flex-col shadow-2xl ${theme.bg}`}
          style={{
            borderRadius: '32px 32px 24px 24px',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          }}
        >
          {/* Premium curved border with gradient glow */}
          <div
            className={`absolute inset-0 border-[7px] ${theme.border} ${theme.borderGlow} pointer-events-none z-50`}
            style={{
              borderRadius: '32px 32px 24px 24px',
              background: `linear-gradient(135deg, ${player.cardType === 'Gold' ? 'rgba(253,224,71,0.15)' : player.cardType === 'Platinum' ? 'rgba(56,189,248,0.15)' : 'rgba(209,213,219,0.15)'} 0%, transparent 50%, ${player.cardType === 'Gold' ? 'rgba(251,191,36,0.15)' : player.cardType === 'Platinum' ? 'rgba(14,165,233,0.15)' : 'rgba(156,163,175,0.15)'} 100%)`,
              maskImage: 'linear-gradient(to bottom, black, black)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, black)',
            }}
          ></div>

          {/* Inner Border Ring - Enhanced */}
          <div
            className={`absolute inset-2 border-2 ${theme.borderInner} z-10 pointer-events-none`}
            style={{ borderRadius: '28px 28px 20px 20px' }}
          ></div>

          {/* Shimmer Animation - Enhanced */}
          <div className="absolute inset-0 pointer-events-none z-30 translate-x-[-150%] skew-x-12 group-hover:animate-shimmer transition-none bg-gradient-to-r from-transparent via-white/50 to-transparent w-[50%] h-full blur-sm mix-blend-soft-light"></div>

          {/* Background Drawings/Patterns */}
          {theme.pattern}
          <div className={`absolute inset-0 z-0 pointer-events-none ${theme.overlay} mix-blend-overlay`}></div>

          {/* Header Content */}
          <div className="relative p-5 pt-6 flex justify-between items-start z-20">
            {/* Left: Overall Rating & Position */}
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
              <span className={`text-xl font-black uppercase tracking-widest opacity-95 ${theme.text}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {player.position}
              </span>

              <div className={`w-14 h-0.5 bg-current opacity-50 my-2 rounded-full ${theme.text}`}></div>

              <div className="flex flex-col items-center gap-2.5">
                {/* Country Flag */}
                <div className={`w-11 h-8 rounded-md overflow-hidden shadow-lg relative border-2 ${theme.badgeBorder} ${theme.badgeBg} flex items-center justify-center backdrop-blur-sm`}>
                  {countryCode ? (
                    <img
                      src={`https://flagcdn.com/w80/${countryCode}.png`}
                      alt={player.country}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm">
                      {player.country.substring(0, 3).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Team Logo */}
                {team && (
                  <div className={`w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-xs font-bold text-black border-3 border-white/90 overflow-hidden relative group-hover:scale-110 transition-transform`} title={team.name}>
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.shortName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <span style={{ color: team.color }}>{team.shortName}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: ELKAWERA Logo */}
            <div className="flex flex-col items-center gap-3">
              {/* ELKAWERA Logo - Premium Circular Badge */}
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center group/logo"
                title="ELKAWERA"
              >
                {/* Outer glow effect */}
                <div className={`absolute inset-0 rounded-full ${player.cardType === 'Gold' ? 'bg-gradient-to-br from-yellow-400/30 to-yellow-600/30 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : player.cardType === 'Platinum' ? 'bg-gradient-to-br from-cyan-400/30 to-cyan-600/30 shadow-[0_0_20px_rgba(14,165,233,0.5)]' : 'bg-gradient-to-br from-gray-300/30 to-gray-500/30 shadow-[0_0_20px_rgba(156,163,175,0.5)]'} blur-sm`}></div>

                {/* Metallic border ring */}
                <div className={`absolute inset-0 rounded-full border-[3px] ${player.cardType === 'Gold' ? 'border-yellow-400/80' : player.cardType === 'Platinum' ? 'border-cyan-400/80' : 'border-gray-300/80'} shadow-lg`}></div>

                {/* Inner white circle background */}
                <div className="absolute inset-1 rounded-full shadow-inner "></div>

                {/* Logo image */}
                <img
                  src="/elkawera.jpg"
                  alt="ELKAWERA"
                  className="relative w-16 h-16 rounded-full object-contain z-10 drop-shadow-md group-hover/logo:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Like Button - Repositioned */}
              <div className="z-30">
                <button
                  onClick={handleLike}
                  className={`group/like flex flex-col items-center gap-1 p-3 rounded-2xl backdrop-blur-md transition-all duration-300 transform hover:scale-110 active:scale-95 ${isLiked
                    ? 'bg-red-500/90 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                    : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white border border-white/20'
                    }`}
                  title={isLiked ? 'Unlike' : 'Like this card'}
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

          {/* Player Image - Repositioned Higher */}
          <div className="absolute top-0 right-[-30px] w-[300px] h-[320px] z-10 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-3">
            {player.imageUrl ? (
              <img
                src={player.imageUrl}
                alt={player.name}
                className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] filter contrast-[1.15] saturate-[1.1]"
                style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-30">
                <Users size={180} className={theme.text} />
              </div>
            )}
          </div>

          {/* Card Footer Info - Name Repositioned Higher */}
          <div className="mt-auto relative z-20 pb-5 px-5">
            <div className="relative mb-4 text-center px-1">
              {/* Player Name - Moved up with enhanced typography */}
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

            {/* Main Stats Grid - Enhanced spacing */}
            <div className="grid grid-cols-6 gap-2.5 border-t-2 border-black/15 pt-3.5">
              <StatBox label="PAC" value={player.stats?.pace || 0} />
              <StatBox label="SHO" value={player.stats?.shooting || 0} />
              <StatBox label="PAS" value={player.stats?.passing || 0} />
              <StatBox label="DRI" value={player.stats?.dribbling || 0} />
              <StatBox label="DEF" value={player.stats?.defending || 0} />
              <StatBox label="PHY" value={player.stats?.physical || 0} />
            </div>
          </div>

          {/* Decorative Bottom Edge - Enhanced */}
          <div className={`h-3 w-full absolute bottom-0 left-0 bg-gradient-to-r from-transparent via-black/30 to-transparent`}></div>
          {/* Corner accent details */}
          <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-current opacity-20 rounded-bl-lg" style={{ borderColor: 'currentColor' }}></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-current opacity-20 rounded-br-lg" style={{ borderColor: 'currentColor' }}></div>
        </div>

        {/* --- BACK SIDE --- */}
        <div
          id={`card-back-${uniqueId}`}
          className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-[24px] border-[6px] ${theme.border} overflow-hidden flex flex-col shadow-2xl ${theme.bg}`}
        >
          {/* Inner Border Ring */}
          <div className={`absolute inset-1 rounded-[16px] border ${theme.borderInner} z-10 pointer-events-none`}></div>

          {/* Back Pattern */}
          {theme.pattern}
          {/* Dark overlay for readability */}
          <div className={`absolute inset-0 bg-black/20 pointer-events-none mix-blend-overlay`}></div>

          <div className="relative z-10 h-full flex flex-col p-5 pb-6">
            {/* Header */}
            <div className={`flex justify-between items-end mb-4 border-b border-current/20 pb-2 ${theme.text}`}>
              <div>
                <div className="flex items-center gap-2">
                  <Activity size={16} className="opacity-80" />
                  <h3 className="font-display font-bold text-lg uppercase tracking-widest drop-shadow-sm leading-none">Scouting</h3>
                </div>
                <span className="text-[9px] opacity-70 uppercase font-bold tracking-wider block mt-1 ml-0.5">Performance Report</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-display font-bold leading-none">{player.overallScore || 0}</div>
                <div className="text-[8px] font-bold uppercase opacity-70">{player.position}</div>
              </div>
            </div>

            {/* Main Stats Container */}
            <div className={`flex-grow rounded-xl ${theme.badgeBg} backdrop-blur-md border border-white/20 shadow-inner flex flex-col p-3 mb-3`}>

              {/* Detailed Stats List - Compact */}
              <div className="space-y-1 flex-grow justify-center flex flex-col">
                <StatRowBack label="Acceleration" value={player.stats?.acceleration || 0} />
                <StatRowBack label="Sprint Speed" value={player.stats?.pace || 0} />
                <StatRowBack label="Agility" value={player.stats?.agility || 0} />
                <StatRowBack label="Stamina" value={player.stats?.stamina || 0} />
                <StatRowBack label="Strength" value={player.stats?.physical || 0} />
                <StatRowBack label="Positioning" value={player.stats?.defending || 0} />
                <StatRowBack label="Vision" value={player.stats?.passing || 0} />
              </div>
            </div>

            {/* Performance & Bio Section - Enhanced with All Stats */}
            <div className="space-y-2">
              {/* Statistics Header */}
              <div className={`flex items-center gap-2 ${theme.text} opacity-90`}>
                <Target size={14} />
                <h4 className="text-xs font-bold uppercase tracking-wider">Season Statistics</h4>
              </div>

              {/* Main Stats Grid - 3 columns */}
              <div className="grid grid-cols-3 gap-2">
                {/* Goals */}
                <div className={`p-2 rounded-lg ${theme.badgeBg} border border-white/10 text-center flex flex-col justify-center shadow-sm`}>
                  <span className={`text-[9px] font-bold uppercase opacity-70 ${theme.text}`}>⚽ Goals</span>
                  <span className={`text-xl font-display font-bold ${theme.text}`}>{player.goals || 0}</span>
                </div>

                {/* Assists */}
                <div className={`p-2 rounded-lg ${theme.badgeBg} border border-white/10 text-center flex flex-col justify-center shadow-sm`}>
                  <span className={`text-[9px] font-bold uppercase opacity-70 ${theme.text}`}>🎯 Assists</span>
                  <span className={`text-xl font-display font-bold ${theme.text}`}>{player.assists || 0}</span>
                </div>

                {/* Matches */}
                <div className={`p-2 rounded-lg ${theme.boxBg} border border-white/20 text-center flex flex-col justify-center shadow-md backdrop-blur-sm`}>
                  <span className={`text-[9px] font-bold uppercase opacity-80 ${theme.text}`}>📊 Matches</span>
                  <span className={`text-xl font-display font-bold ${theme.text}`}>{player.matchesPlayed || 0}</span>
                </div>
              </div>

              {/* Secondary Stats Grid - 3 columns */}
              <div className="grid grid-cols-3 gap-2">
                {/* Defensive Contributions */}
                <div className={`p-2 rounded-lg ${theme.badgeBg} border border-white/10 text-center flex flex-col justify-center shadow-sm`}>
                  <span className={`text-[9px] font-bold uppercase opacity-70 ${theme.text}`}>🛡️ Def</span>
                  <span className={`text-xl font-display font-bold ${theme.text}`}>{player.defensiveContributions || 0}</span>
                </div>

                {/* Clean Sheets */}
                <div className={`p-2 rounded-lg ${theme.badgeBg} border border-white/10 text-center flex flex-col justify-center shadow-sm`}>
                  <span className={`text-[9px] font-bold uppercase opacity-70 ${theme.text}`}>🧤 Clean</span>
                  <span className={`text-xl font-display font-bold ${theme.text}`}>{player.cleanSheets || 0}</span>
                </div>

                {/* Penalty Saves */}
                <div className={`p-2 rounded-lg ${theme.badgeBg} border border-white/10 text-center flex flex-col justify-center shadow-sm`}>
                  <span className={`text-[9px] font-bold uppercase opacity-70 ${theme.text}`}>🥅 Saves</span>
                  <span className={`text-xl font-display font-bold ${theme.text}`}>{player.penaltySaves || 0}</span>
                </div>
              </div>

              {/* Physique - Full Width */}
              <div className={`p-2 rounded-lg ${theme.boxBg} border border-white/20 flex justify-around items-center shadow-md backdrop-blur-sm`}>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${theme.text}`}>{player.height}</span>
                  <span className={`text-[8px] font-bold uppercase opacity-80 ${theme.text}`}>cm</span>
                </div>
                <div className={`w-px h-6 bg-current opacity-20 ${theme.text}`}></div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${theme.text}`}>{player.weight}</span>
                  <span className={`text-[8px] font-bold uppercase opacity-80 ${theme.text}`}>kg</span>
                </div>
                <div className={`w-px h-6 bg-current opacity-20 ${theme.text}`}></div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${theme.text}`}>{player.age}</span>
                  <span className={`text-[8px] font-bold uppercase opacity-80 ${theme.text}`}>yrs</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-2 border-t border-current/10 flex justify-between items-center opacity-80">
              <div className="flex items-center gap-1.5">
                {team ? (
                  <>
                    {team.logoUrl && <img src={team.logoUrl} className="w-3.5 h-3.5 object-contain" crossOrigin="anonymous" />}
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${theme.text}`}>{team.shortName}</span>
                  </>
                ) : (
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${theme.text}`}>Free Agent</span>
                )}
              </div>
              <div className={`text-[8px] font-bold uppercase tracking-[0.2em] opacity-60 ${theme.text}`}>ELKAWERA</div>
            </div>
          </div>
        </div>

      </div>

      {/* Children Elements (Overlays etc.) - Rendered absolutely on top of the card container */}
      {
        children && (
          <div className="absolute inset-0 z-50 pointer-events-none [&>*]:pointer-events-auto">
            {children}
          </div>
        )
      }
    </div >
  );
};
