import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPlayers, getAllTeams } from '../utils/db';
import { Player, Team, Position } from '../types';
import { PlayerCard } from '../components/PlayerCard';
import { Search, Trophy, TrendingUp, Shield, Activity, X, User as UserIcon, Users, ChevronDown, Filter, Edit } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

type PlayerSortMetric = 'OVERALL' | 'GOALS' | 'ASSISTS' | 'DEFENSE' | 'SAVES';
type TeamSortMetric = 'OVERALL' | 'WINS' | 'LOSSES' | 'DRAWS';

export const Leaderboard: React.FC = () => {
    const navigate = useNavigate();
    const { t, dir } = useSettings();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'players' | 'teams'>('players');
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamMap, setTeamMap] = useState<Record<string, Team>>({});

    const [playerSort, setPlayerSort] = useState<PlayerSortMetric>('OVERALL');
    const [teamSort, setTeamSort] = useState<TeamSortMetric>('OVERALL');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<Position | 'ALL'>('ALL');
    const [ageFilter, setAgeFilter] = useState<'ALL' | '8 : 12' | '12 : 15' | '15 : 18' | '18+'>('ALL');
    const [showAgeDropdown, setShowAgeDropdown] = useState(false);

    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allPlayers, allTeams] = await Promise.all([
                getAllPlayers(),
                getAllTeams()
            ]);
            setPlayers(allPlayers);
            setTeams(allTeams);

            const tMap: Record<string, Team> = {};
            allTeams.forEach(t => tMap[t.id] = t);
            setTeamMap(tMap);

        } catch (error) {
            console.error("Failed to load leaderboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const getTeamAverageAge = (teamId: string) => {
        const squad = players.filter(p => p.teamId === teamId);
        if (squad.length === 0) return 0;
        const total = squad.reduce((sum, p) => sum + (p.age || 0), 0);
        return total / squad.length;

    };

    const filterByAge = (age: number) => {
        if (ageFilter === 'ALL') return true;
        if (!age) return false;

        if (ageFilter === '8 : 12') return age >= 8 && age <= 12;
        if (ageFilter === '12 : 15') return age >= 12 && age <= 15;
        if (ageFilter === '15 : 18') return age >= 15 && age <= 18;
        if (ageFilter === '18+') return age >= 18;
        return true;
    };

    const getSortedPlayers = () => {
        let sorted = [...players];
        if (searchTerm) {
            sorted = sorted.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (selectedPosition !== 'ALL') {
            sorted = sorted.filter(p => p.position === selectedPosition);
        }

        // Age Filter
        sorted = sorted.filter(p => filterByAge(p.age));

        return sorted.sort((a, b) => {
            let valA = 0, valB = 0;
            switch (playerSort) {
                case 'OVERALL': valA = a.overallScore; valB = b.overallScore; break;
                case 'GOALS': valA = a.goals || 0; valB = b.goals || 0; break;
                case 'ASSISTS': valA = a.assists || 0; valB = b.assists || 0; break;
                case 'DEFENSE': valA = a.defensiveContributions || 0; valB = b.defensiveContributions || 0; break;
                case 'SAVES': valA = (a.penaltySaves || 0) + (a.cleanSheets || 0) + (a.saves || 0); valB = (b.penaltySaves || 0) + (b.cleanSheets || 0) + (b.saves || 0); break;
            }
            if (valB !== valA) return valB - valA;
            return b.wins - a.wins;
        });
    };

    const getSortedTeams = () => {
        let sorted = [...teams];
        if (searchTerm) {
            sorted = sorted.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // Age Filter (Average)
        sorted = sorted.filter(t => filterByAge(getTeamAverageAge(t.id)));

        return sorted.sort((a, b) => {
            let valA = 0, valB = 0;
            switch (teamSort) {
                case 'OVERALL': valA = getTeamAverageRating(a.id); valB = getTeamAverageRating(b.id); break;
                case 'WINS': valA = a.wins ?? 0; valB = b.wins ?? 0; break;
                case 'LOSSES': valA = a.losses ?? 0; valB = b.losses ?? 0; break;
                case 'DRAWS': valA = a.draws ?? 0; valB = b.draws ?? 0; break;
            }
            if (valB !== valA) return valB - valA;
            return (b.wins ?? 0) - (a.wins ?? 0);
        });
    };

    const getTeamAverageRating = (teamId: string) => {
        const squad = players.filter(p => p.teamId === teamId);
        if (squad.length === 0) return 0;
        const total = squad.reduce((sum, p) => sum + p.overallScore, 0);
        return Math.round(total / squad.length);
    };

    const getTeamSquad = (teamId: string) => {
        return players.filter(p => p.teamId === teamId);
    };

    const renderPlayerRow = (player: Player, index: number) => {
        const team = player.teamId ? teamMap[player.teamId] : null;
        const isExpanded = selectedPlayerId === player.id;
        return (
            <div key={player.id} className="mb-3">
                <div
                    className={`group flex items-center justify-between p-3 sm:p-4 bg-[var(--bg-secondary)] border ${isExpanded ? 'border-elkawera-accent' : 'border-[var(--border-color)]'} hover:border-elkawera-accent hover:border-1 dark:hover:border-elkawera-accent/30 rounded-xl cursor-pointer transition-all animate-fade-in-up hover:scale-[1.01] shadow-sm`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                        setSelectedTeamId(null);
                        setSelectedPlayerId(isExpanded ? null : player.id);
                    }}
                >
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <span className={`text-base sm:text-xl font-bold w-6 sm:w-10 text-center ${index < 3 ? 'text-elkawera-accent' : 'text-[var(--text-secondary)]'}`}>
                            {index + 1}
                        </span>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden border border-[var(--border-color)] relative shrink-0">
                            {player.imageUrl ? (
                                <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-full h-full p-2 text-gray-500" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[var(--text-primary)] font-bold text-sm sm:text-lg leading-tight group-hover:text-elkawera-accent transition-colors truncate">
                                {player.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] sm:text-sm text-[var(--text-secondary)] truncate">
                                {team ? (
                                    <>
                                        {team.logoUrl ? (
                                            <img src={team.logoUrl} alt={team.name} className="w-3 h-3 sm:w-4 sm:h-4 object-contain" />
                                        ) : (
                                            <Shield size={10} className="sm:size-[12px]" />
                                        )}
                                        <span className="truncate">{team.name}</span>
                                    </>
                                ) : (
                                    <span className="opacity-70 italic">Free Agent</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right rtl:text-left shrink-0">
                        <div className="text-xl sm:text-2xl font-display font-bold text-elkawera-accent">
                            {playerSort === 'OVERALL' && player.overallScore}
                            {playerSort === 'GOALS' && (player.goals || 0)}
                            {playerSort === 'ASSISTS' && (player.assists || 0)}
                            {playerSort === 'DEFENSE' && (player.defensiveContributions || 0)}
                            {playerSort === 'SAVES' && ((player.penaltySaves || 0) + (player.saves || 0) + (player.cleanSheets || 0))}
                        </div>
                        <div className="text-[8px] sm:text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold">
                            {t(`stats.${playerSort.toLowerCase()}`)}
                        </div>
                    </div>
                </div>
                {isExpanded && (
                    <div className="mt-2 p-2 sm:p-6 bg-[var(--bg-primary)] border border-elkawera-accent/30 rounded-2xl animate-in slide-in-from-top-4 duration-300 overflow-hidden shadow-inner w-full">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="flex-shrink-0 transform scale-75 sm:scale-95 origin-center">
                                <PlayerCard player={player} allowFlipClick={true} />
                            </div>
                            <div className="flex-1 w-full space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] text-center">
                                        <span className="block text-xl font-bold text-elkawera-accent">{player.overallScore}</span>
                                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{t('stats.overall')}</span>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] text-center">
                                        <span className="block text-xl font-bold text-[var(--text-primary)]">{player.matchesPlayed || 0}</span>
                                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{t('stats.matches')}</span>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] text-center">
                                        <span className="block text-xl font-bold text-[var(--text-primary)]">{player.goals || 0}</span>
                                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{t('stats.goals')}</span>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] text-center">
                                        <span className="block text-xl font-bold text-[var(--text-primary)]">{player.assists || 0}</span>
                                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">{t('stats.assists')}</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/player/${player.id}`); }}
                                        className="flex-1 min-w-[150px] py-3 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-elkawera-accent/20"
                                    >
                                        <TrendingUp size={16} /> {t('common.view_details')}
                                    </button>
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/create?id=${player.id}`); }}
                                            className="flex-1 min-w-[150px] py-3 bg-blue-600 text-white font-bold uppercase rounded-xl hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/20"
                                        >
                                            <Edit size={16} /> Quick Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedPlayerId(null); }}
                                        className="py-3 px-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold uppercase rounded-xl hover:bg-[var(--border-color)] transition-colors text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTeamRow = (team: Team, index: number) => {
        const isExpanded = selectedTeamId === team.id;
        return (
            <div key={team.id} className="mb-3">
                <div
                    className={`group flex items-center justify-between p-3 sm:p-4 bg-[var(--bg-secondary)] border ${isExpanded ? 'border-elkawera-accent' : 'border-[var(--border-color)]'} hover:border-elkawera-accent hover:border-1 dark:hover:border-elkawera-accent/30 rounded-xl cursor-pointer transition-all animate-fade-in-up hover:scale-[1.01] shadow-sm`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => {
                        setSelectedPlayerId(null);
                        setSelectedTeamId(isExpanded ? null : team.id);
                    }}
                >
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <span className={`text-base sm:text-xl font-bold w-6 sm:w-10 text-center ${index < 3 ? 'text-elkawera-accent' : 'text-[var(--text-secondary)]'}`}>
                            {index + 1}
                        </span>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-[var(--border-color)] shrink-0">
                            {team.logoUrl ? (
                                <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                            ) : (
                                <Shield className="text-gray-500" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[var(--text-primary)] font-bold text-sm sm:text-lg group-hover:text-elkawera-accent transition-colors truncate">{team.name}</h3>
                            <p className="text-[10px] sm:text-sm text-[var(--text-secondary)] truncate">Captain: {team.captainName}</p>
                        </div>
                    </div>
                    <div className="text-right rtl:text-left flex flex-col items-end rtl:items-start gap-1 shrink-0">
                        <div className="text-xl sm:text-2xl font-display font-bold text-elkawera-accent">
                            {teamSort === 'OVERALL' && getTeamAverageRating(team.id)}
                            {teamSort === 'WINS' && (team.wins ?? 0)}
                            {teamSort === 'LOSSES' && (team.losses ?? 0)}
                            {teamSort === 'DRAWS' && (team.draws ?? 0)}
                        </div>
                        <div className="text-[8px] sm:text-xs text-[var(--text-secondary)] uppercase tracking-wider font-bold">
                            {t(`stats.${teamSort.toLowerCase()}`)}
                        </div>
                        <div className="text-[8px] sm:text-[10px] font-mono text-[var(--text-secondary)] mt-1 flex gap-1">
                            <span className={teamSort === 'WINS' ? 'text-[var(--text-primary)] font-bold' : ''}>{team.wins ?? 0}W</span> -
                            <span className={teamSort === 'DRAWS' ? 'text-[var(--text-primary)] font-bold' : ''}> {team.draws ?? 0}D</span> -
                            <span className={teamSort === 'LOSSES' ? 'text-[var(--text-primary)] font-bold' : ''}> {team.losses ?? 0}L</span>
                        </div>
                    </div>
                </div>
                {isExpanded && (
                    <div className="mt-2 p-4 sm:p-6 bg-[var(--bg-primary)] border border-elkawera-accent/30 rounded-2xl animate-in slide-in-from-top-4 duration-300 overflow-hidden w-full">
                        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border-color)] overflow-hidden shrink-0 shadow-lg">
                                {team.logoUrl ? (
                                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Shield size={48} className="text-[var(--text-secondary)] opacity-50" />
                                )}
                            </div>
                            <div className="flex-1 w-full">
                                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-elkawera-accent" /> {t('leaderboard.clubs_ranking')} Details
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] text-center">
                                        <span className="block text-xl font-bold text-elkawera-accent">{getTeamAverageRating(team.id)}</span>
                                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">OVR</span>
                                    </div>
                                    <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 text-center">
                                        <span className="block text-xl font-bold text-green-500">{team.wins || 0}</span>
                                        <span className="text-[10px] text-green-500/70 uppercase font-bold">{t('stats.wins')}</span>
                                    </div>
                                    <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-center">
                                        <span className="block text-xl font-bold text-red-500">{team.losses || 0}</span>
                                        <span className="text-[10px] text-red-500/70 uppercase font-bold">{t('stats.losses')}</span>
                                    </div>
                                    <div className="bg-gray-500/10 p-3 rounded-xl border border-gray-500/20 text-center">
                                        <span className="block text-xl font-bold text-gray-400">{team.draws || 0}</span>
                                        <span className="text-[10px] text-gray-400/70 uppercase font-bold">{t('stats.draws')}</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h5 className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 tracking-widest">Squad Players</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {getTeamSquad(team.id).map(p => (
                                            <div
                                                key={p.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTeamId(null);
                                                    setSelectedPlayerId(p.id);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:border-elkawera-accent transition-all cursor-pointer group/item"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gray-800 overflow-hidden">
                                                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <UserIcon size={12} className="m-1.5" />}
                                                </div>
                                                <span className="text-xs font-bold group-hover/item:text-elkawera-accent transition-colors">{p.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedTeamId(null); }}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold uppercase rounded-xl hover:bg-[var(--border-color)] transition-colors text-xs"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto pb-20 px-4 sm:px-6" dir={dir}>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold uppercase italic text-[var(--text-primary)] tracking-tighter">
                        {t('leaderboard.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2">{t('leaderboard.subtitle')}</p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`} size={18} />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 text-[var(--text-primary)] focus:outline-none focus:border-elkawera-accent transition-colors`}
                    />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-[var(--bg-secondary)] rounded-xl inline-flex mb-8 border border-[var(--border-color)]">
                <button
                    onClick={() => setActiveTab('players')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'players' ? 'bg-elkawera-accent text-black shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    {t('leaderboard.players_ranking')}
                </button>
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'teams' ? 'bg-elkawera-accent text-black shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    {t('leaderboard.clubs_ranking')}
                </button>
            </div>

            {/* Filter Group */}
            <div className="flex flex-col gap-3 mb-4">
                {/* Age Filter Dropdown */}
                <div className="relative mb-2">
                    <button
                        onClick={() => setShowAgeDropdown(!showAgeDropdown)}
                        className="flex items-center gap-3 px-5 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:border-elkawera-accent transition-all min-w-[200px] justify-between group shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-elkawera-accent" />
                            <div className="text-left">
                                <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Common Ages</span>
                                <span className="block text-sm font-bold text-[var(--text-primary)]">
                                    {ageFilter === 'ALL' ? 'All Groups' : `${ageFilter} Years`}
                                </span>
                            </div>
                        </div>
                        <ChevronDown size={18} className={`text-[var(--text-secondary)] transition-transform duration-300 ${showAgeDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showAgeDropdown && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowAgeDropdown(false)} />
                            <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {(['ALL', '8 : 12', '12 : 15', '15 : 18', '18+'] as const).map(age => (
                                    <button
                                        key={age}
                                        onClick={() => {
                                            setAgeFilter(age);
                                            setShowAgeDropdown(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors hover:bg-[var(--border-color)] flex items-center justify-between ${ageFilter === age ? 'text-elkawera-accent bg-elkawera-accent/5' : 'text-[var(--text-primary)]'
                                            }`}
                                    >
                                        {age === 'ALL' ? 'All Groups' : `${age} Years`}
                                        {ageFilter === age && <div className="w-2 h-2 rounded-full bg-elkawera-accent" />}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {activeTab === 'players' && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-[var(--border-color)]">
                        {(['ALL', 'CF', 'CB', 'GK'] as const).map(pos => (
                            <button
                                key={pos}
                                onClick={() => setSelectedPosition(pos)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${selectedPosition === pos
                                    ? 'bg-elkawera-accent text-black'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                {t(`pos.${pos.toLowerCase()}`) || pos}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    {activeTab === 'players' ? (
                        ['OVERALL', 'GOALS', 'ASSISTS', 'DEFENSE', 'SAVES'].map((metric) => (
                            <button
                                key={metric}
                                onClick={() => setPlayerSort(metric as PlayerSortMetric)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${playerSort === metric
                                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                {metric === 'OVERALL' && <Trophy size={14} />}
                                {metric === 'GOALS' && <Activity size={14} />}
                                {metric === 'ASSISTS' && <TrendingUp size={14} />}
                                {t(`stats.${metric.toLowerCase()}`)}
                            </button>
                        ))
                    ) : (
                        ['OVERALL', 'WINS', 'LOSSES', 'DRAWS'].map((metric) => (
                            <button
                                key={metric}
                                onClick={() => setTeamSort(metric as TeamSortMetric)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${teamSort === metric
                                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                {metric === 'OVERALL' && <Trophy size={14} />}
                                {t(`stats.${metric.toLowerCase()}`)}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* List Content */}
            {loading ? (
                <div className="text-center py-20 text-[var(--text-secondary)] animate-pulse">{t('common.loading')}</div>
            ) : (
                <div className="space-y-1">
                    {activeTab === 'players'
                        ? getSortedPlayers().map((p, i) => renderPlayerRow(p, i))
                        : getSortedTeams().map((t, i) => renderTeamRow(t, i))
                    }
                    {((activeTab === 'players' && players.length === 0) || (activeTab === 'teams' && teams.length === 0)) && (
                        <div className="text-center py-20 text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]">
                            {t('common.no_data')}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
