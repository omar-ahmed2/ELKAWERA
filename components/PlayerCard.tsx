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

    switch (player.cardType) {
      case 'Platinum':
        return {
          // Icy Blue / Holographic / Shards
          wrapper: 'bg-[#020617]',
          bg: 'bg-gradient-to-br from-[#0f172a] via-[#0ea5e9] to-[#0f172a] bg-[length:400%_400%] animate-gradient-x',
          border: 'border-[#38bdf8] animate-platinum-glow',
          borderInner: 'border-[#bae6fd]/50',
          text: 'text-[#e0f2fe]',
          textSecondary: 'text-[#7dd3fc]',
          shadow: 'shadow-[0_0_60px_rgba(14,165,233,0.6)]',
          overlay: 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-cyan-400/10 to-transparent',
          badgeBg: 'bg-[#020617]/90', // High opacity for download legibility
          badgeBorder: 'border-[#38bdf8]',
          boxBg: 'bg-white/10', // Distinct background for matches/physique
          pattern: (
            <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                <path d="M0 0 L320 150 L0 300 Z" fill={`url(#${patternId})`} opacity="0.4" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0ea5e9]/30 to-transparent"></div>
            </div>
          )
        };
      case 'Gold':
        return {
          // Rich Luxury Gold / Sunburst
          wrapper: 'bg-[#422006]',
          bg: 'bg-gradient-to-br from-[#713f12] via-[#facc15] to-[#713f12] bg-[length:400%_400%] animate-gradient-x',
          border: 'border-[#fde047]',
          borderInner: 'border-[#fef08a]/60',
          text: 'text-[#422006]',
          textSecondary: 'text-[#854d0e]',
          shadow: 'shadow-[0_0_60px_rgba(234,179,8,0.6)]',
          overlay: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-100/50 via-transparent to-yellow-900/40 animate-gold-pulse',
          badgeBg: 'bg-[#fffbeb]/90', // High opacity
          badgeBorder: 'border-[#fde047]',
          boxBg: 'bg-white/80', // Distinct background
          pattern: (
            <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 320 480" xmlns="http://www.w3.org/2000/svg">
                <path d="M160 240 L0 0 L320 0 Z" fill="white" opacity="0.2" />
                <path d="M160 240 L320 0 L320 480 Z" fill="black" opacity="0.1" />
                <path d="M160 240 L0 480 L320 480 Z" fill="white" opacity="0.2" />
                <path d="M160 240 L0 0 L0 480 Z" fill="black" opacity="0.1" />
                <circle cx="160" cy="240" r="100" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
                <circle cx="160" cy="240" r="140" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
                <circle cx="160" cy="240" r="180" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/40 via-transparent to-yellow-100/20"></div>
            </div>
          )
        };
      case 'Silver':
      default:
        return {
          // Metallic Steel / Tech Hex
          wrapper: 'bg-[#111827]',
          bg: 'bg-gradient-to-br from-[#1f2937] via-[#e5e7eb] to-[#1f2937] bg-[length:400%_400%] animate-gradient-x',
          border: 'border-[#d1d5db]',
          borderInner: 'border-[#9ca3af]/50',
          text: 'text-[#111827]',
          textSecondary: 'text-[#374151]',
          shadow: 'shadow-[0_0_50px_rgba(156,163,175,0.5)]',
          overlay: 'bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.5)_50%,transparent_70%)]',
          badgeBg: 'bg-[#f3f4f6]/90', // High opacity
          badgeBorder: 'border-[#e5e7eb]',
          boxBg: 'bg-white/80', // Distinct background
          pattern: (
            <>
              <div className="absolute inset-0 z-0 opacity-20 mix-blend-color-burn pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id={patternId} width="20" height="34.6" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                      <path d="M10 0 L20 5.77 L20 17.32 L10 23.09 L0 17.32 L0 5.77 Z" fill="none" stroke="black" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#${patternId})`} />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/30 to-transparent"></div>
              </div>
              <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/60 to-transparent w-[40%] skew-x-[-20deg] animate-sheen-slide mix-blend-overlay"></div>
            </>
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
      className={`group relative w-[320px] h-[480px] cursor-pointer perspective-1000 ${className} rounded-[24px] select-none transition-transform duration-300 hover:scale-105`}
      onClick={handleFlip}
      style={style}
    >
      {/* Outer Glow */}
      <div className={`absolute inset-4 rounded-[24px] ${theme.shadow} transition-all duration-300 opacity-70 group-hover:opacity-100 group-hover:shadow-2xl -z-10 blur-xl`}></div>

      {/* Flipper Container */}
      <div className={`relative w-full h-full transform-style-3d flip-transition ${isFlipped ? 'rotate-y-180' : ''} will-change-transform`}>

        {/* --- FRONT SIDE --- */}
        <div
          id={`card-front-${uniqueId}`}
          className={`absolute w-full h-full backface-hidden rounded-[24px] border-[6px] ${theme.border} overflow-hidden flex flex-col shadow-2xl ${theme.bg}`}
        >
          {/* Inner Border Ring */}
          <div className={`absolute inset-1 rounded-[16px] border ${theme.borderInner} z-10 pointer-events-none`}></div>

          {/* Shimmer Animation (Standard) */}
          <div className="absolute inset-0 pointer-events-none z-30 translate-x-[-150%] skew-x-12 group-hover:animate-shimmer transition-none bg-gradient-to-r from-transparent via-white/40 to-transparent w-[50%] h-full blur-sm mix-blend-soft-light"></div>

          {/* Background Drawings/Patterns */}
          {theme.pattern}
          <div className={`absolute inset-0 z-0 pointer-events-none ${theme.overlay} mix-blend-overlay`}></div>

          {/* Header Content */}
          <div className="relative p-6 pt-8 flex justify-between items-start z-20">
            <div className="flex flex-col items-center space-y-1">
              <span className={`text-6xl font-display font-bold leading-none tracking-tighter drop-shadow-md ${theme.text}`} style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{player.overallScore}</span>
              <span className={`text-2xl font-bold uppercase tracking-wide opacity-90 drop-shadow-sm ${theme.text}`}>{player.position}</span>

              <div className={`w-12 h-0.5 bg-current opacity-40 my-3 rounded-full ${theme.text}`}></div>

              <div className="flex flex-col items-center gap-3">
                {/* Country Flag */}
                <div className={`w-10 h-7 rounded-sm overflow-hidden shadow-md relative border ${theme.badgeBorder} ${theme.badgeBg} flex items-center justify-center`}>
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
                  <div className={`w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xs font-bold text-black border-2 border-white/80 overflow-hidden relative group-hover:scale-110 transition-transform`} title={team.name}>
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.shortName} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <span style={{ color: team.color }}>{team.shortName}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Like Button - Enhanced */}
            <div className="absolute top-4 right-4 z-30">
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

          {/* Player Image */}
          <div className="absolute top-10 right-[-30px] w-[300px] h-[300px] z-10 transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
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

          {/* Card Footer Info */}
          <div className="mt-auto relative z-20 pb-6 px-5">
            <div className="relative mb-5 text-center px-1">
              {/* Updated Typography for Name: leading-none and pb-2 prevent clipping */}
              <h2
                className={`text-3xl font-display font-bold uppercase leading-none pb-2 px-1 ${theme.text}`}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.25)', wordBreak: 'break-word' }}
              >
                {player.name}
              </h2>
              <div className={`w-24 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 mx-auto mt-2 ${theme.text}`}></div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-6 gap-2 border-t border-black/10 pt-3">
              <StatBox label="PAC" value={player.stats?.pace || 0} />
              <StatBox label="SHO" value={player.stats?.shooting || 0} />
              <StatBox label="PAS" value={player.stats?.passing || 0} />
              <StatBox label="DRI" value={player.stats?.dribbling || 0} />
              <StatBox label="DEF" value={player.stats?.defending || 0} />
              <StatBox label="PHY" value={player.stats?.physical || 0} />
            </div>
          </div>

          {/* Decorative Bottom Edge */}
          <div className={`h-2 w-full absolute bottom-0 left-0 bg-gradient-to-r from-transparent via-black/20 to-transparent`}></div>
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

            {/* Performance & Bio Section */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              {/* Goals */}
              <div className={`p-1.5 rounded-lg ${theme.badgeBg} border border-white/10 text-center flex flex-col justify-center shadow-sm`}>
                <span className={`text-[8px] font-bold uppercase opacity-70 ${theme.text}`}>Goals</span>
                <span className={`text-lg font-display font-bold ${theme.text}`}>{player.goals || 0}</span>
              </div>

              {/* Assists */}
              <div className={`p-1.5 rounded-lg ${theme.badgeBg} border border-white/10 text-center flex flex-col justify-center shadow-sm`}>
                <span className={`text-[8px] font-bold uppercase opacity-70 ${theme.text}`}>Assists</span>
                <span className={`text-lg font-display font-bold ${theme.text}`}>{player.assists || 0}</span>
              </div>

              {/* Matches */}
              <div className={`p-1.5 rounded-lg ${theme.boxBg} border border-white/20 text-center flex flex-col justify-center shadow-md backdrop-blur-sm`}>
                <span className={`text-[8px] font-bold uppercase opacity-80 ${theme.text}`}>Matches</span>
                <span className={`text-lg font-display font-bold ${theme.text}`}>{player.matchesPlayed || 0}</span>
              </div>

              {/* Physique */}
              <div className={`p-1.5 rounded-lg ${theme.boxBg} border border-white/20 flex flex-col justify-center items-center gap-0.5 shadow-md backdrop-blur-sm`}>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${theme.text}`}>{player.height}</span>
                  <span className={`text-[7px] font-bold uppercase opacity-80 ${theme.text}`}>cm</span>
                </div>
                <div className="w-6 h-px bg-current opacity-20 my-0.5"></div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${theme.text}`}>{player.weight}</span>
                  <span className={`text-[7px] font-bold uppercase opacity-80 ${theme.text}`}>kg</span>
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
      {children && (
        <div className="absolute inset-0 z-50 pointer-events-none [&>*]:pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  );
};
