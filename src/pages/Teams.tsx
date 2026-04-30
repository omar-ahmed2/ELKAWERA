import React, { useState, useEffect } from 'react';
import { Team, Player } from '@/types';
import { getAllTeams, saveTeam, deleteTeam, getPlayersByTeamId, removePlayerFromTeam, trackScoutActivity, savePlayer, savePlayerWithStatsNotification } from '@/utils/db';
import { PlusCircle, Trash2, Users, Shield, Upload, Edit3, ArrowLeft, Save, X, UserPlus, AlertTriangle, BarChart3, CheckCircle, TrendingUp, Activity, Target, Zap, Award } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { InvitePlayerModal } from '@/components/InvitePlayerModal';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { showToast } from '@/components/Toast';
import { computeOverallWithPerformance } from '@/utils/calculation';
import { motion } from 'framer-motion';

// StatStepper Component
const StatStepper = ({ label, value, onChange, min = 0, max = 99 }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:border-[#00ff9d]/30 transition-all">
        <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">{label}</span>
            <span className="text-xl font-display font-black text-white">{value}</span>
        </div>
        <div className="flex gap-1">
            <button
                onClick={() => onChange(Math.max(min, value - 1))}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all active:scale-90 text-sm"
            >
                -
            </button>
            <button
                onClick={() => onChange(Math.min(max, value + 1))}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#00ff9d]/20 hover:border-[#00ff9d]/30 transition-all active:scale-90 text-sm"
            >
                +
            </button>
        </div>
    </div>
);

export const Teams: React.FC = () => {
  const { user } = useAuth();
  const { t, dir } = useSettings();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [squad, setSquad] = useState<Player[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removePlayerId, setRemovePlayerId] = useState<string | null>(null);
  const [isUpdatingStats, setIsUpdatingStats] = useState(false);
  const [editedStats, setEditedStats] = useState<Record<string, Partial<Player>>>({});
  const [calculatedOverall, setCalculatedOverall] = useState<Record<string, number>>({});

  // Form State
  const [formData, setFormData] = useState<Partial<Team>>({
    name: '',
    shortName: '',
    color: '#00ff9d',
    logoUrl: undefined,
  });

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadSquad(selectedTeam.id);
      setFormData(selectedTeam); // Pre-fill form for editing
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedTeam && user?.role === 'scout') {
      trackScoutActivity(user.id, user.name, 'view_team', selectedTeam.id, selectedTeam.name, 'team').catch(console.error);
    }
  }, [selectedTeam, user]);

  const loadTeams = () => {
    getAllTeams().then(setTeams);
  };

  const loadSquad = (teamId: string) => {
    getPlayersByTeamId(teamId).then(setSquad);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.shortName) return;

    const teamToSave: Team = {
      id: selectedTeam ? selectedTeam.id : uuidv4(),
      name: formData.name!,
      shortName: formData.shortName!.substring(0, 3).toUpperCase(),
      color: formData.color || '#00ff9d',
      logoUrl: formData.logoUrl || undefined,
      captainId: selectedTeam ? selectedTeam.captainId : (user?.id || ''),
      captainName: selectedTeam ? selectedTeam.captainName : (user?.name || ''),
      experiencePoints: selectedTeam ? selectedTeam.experiencePoints : 0,
      ranking: selectedTeam ? selectedTeam.ranking : 0,
      wins: selectedTeam ? selectedTeam.wins : 0,
      draws: selectedTeam ? selectedTeam.draws : 0,
      losses: selectedTeam ? selectedTeam.losses : 0,
      totalMatches: selectedTeam ? selectedTeam.totalMatches : 0,
      createdAt: selectedTeam ? selectedTeam.createdAt : Date.now(),
    };

    await saveTeam(teamToSave);

    // Show success toast
    showToast(
      isEditing ? 'Team updated successfully!' : 'Team created successfully!',
      'success'
    );

    // Reset states
    setFormData({ name: '', shortName: '', color: '#00ff9d', logoUrl: undefined });
    setIsCreating(false);
    setIsEditing(false);

    if (selectedTeam) {
      setSelectedTeam(teamToSave); // Update current view
    }

    loadTeams();
  };

  const confirmDelete = async () => {
    if (deleteTeamId) {
      await deleteTeam(deleteTeamId);
      if (selectedTeam?.id === deleteTeamId) setSelectedTeam(null);
      setDeleteTeamId(null);
      loadTeams();
    }
  };

  const confirmRemovePlayer = async () => {
    if (removePlayerId) {
      await removePlayerFromTeam(removePlayerId);
      setRemovePlayerId(null);
      if (selectedTeam) {
        loadSquad(selectedTeam.id);
      }
      loadTeams();
      showToast('Player removed from team', 'success');
    }
  };

  const startCreating = () => {
    setSelectedTeam(null);
    setFormData({ name: '', shortName: '', color: '#00ff9d', logoUrl: undefined });
    setIsCreating(true);
  };

  const handleInviteSent = () => {
    // Reload squad to reflect any changes
    if (selectedTeam) {
      loadSquad(selectedTeam.id);
    }
  };

  const calculatePlayerOverall = (player: Player, stats: Partial<Player>): number => {
    const baseScore = player.baseScore || 50;
    return computeOverallWithPerformance(
      baseScore,
      player.position,
      {
        goals: stats.goals ?? player.goals,
        assists: stats.assists ?? player.assists,
        defensiveContributions: stats.defensiveContributions ?? player.defensiveContributions,
        cleanSheets: stats.cleanSheets ?? player.cleanSheets,
        saves: stats.saves ?? (player.saves || 0),
        penaltySaves: stats.penaltySaves ?? player.penaltySaves,
        ownGoals: stats.ownGoals ?? (player.ownGoals || 0),
        goalsConceded: stats.goalsConceded ?? (player.goalsConceded || 0),
        penaltyMissed: stats.penaltyMissed ?? (player.penaltyMissed || 0)
      }
    );
  };

  const handleToggleStatsMode = () => {
    if (isUpdatingStats) {
      // Cancel - reset edited stats
      setEditedStats({});
      setCalculatedOverall({});
      setIsUpdatingStats(false);
    } else {
      // Start editing - initialize with current squad stats
      const initialStats: Record<string, Partial<Player>> = {};
      const initialOverall: Record<string, number> = {};
      squad.forEach(player => {
        initialStats[player.id] = {
          goals: player.goals,
          assists: player.assists,
          defensiveContributions: player.defensiveContributions,
          cleanSheets: player.cleanSheets,
          saves: player.saves || 0,
          penaltySaves: player.penaltySaves,
          ownGoals: player.ownGoals || 0,
          goalsConceded: player.goalsConceded || 0,
          penaltyMissed: player.penaltyMissed || 0,
        };
        initialOverall[player.id] = player.overallScore;
      });
      setEditedStats(initialStats);
      setCalculatedOverall(initialOverall);
      setIsUpdatingStats(true);
    }
  };

  const handleStatChange = (player: Player, field: keyof Player, value: number) => {
    setEditedStats(prev => {
      const updatedStats = {
        ...prev,
        [player.id]: {
          ...prev[player.id],
          [field]: value
        }
      };
      
      // Recalculate overall rating
      const newOverall = calculatePlayerOverall(player, updatedStats[player.id]);
      setCalculatedOverall(prevOverall => ({
        ...prevOverall,
        [player.id]: newOverall
      }));
      
      return updatedStats;
    });
  };

  const handleSaveAllStats = async () => {
    try {
      for (const player of squad) {
        const updates = editedStats[player.id];
        const newOverall = calculatedOverall[player.id];
        if (updates) {
          const updatedPlayer: Player = {
            ...player,
            ...updates,
            overallScore: newOverall || player.overallScore,
            updatedAt: Date.now()
          };
          await savePlayerWithStatsNotification(player, updatedPlayer);
        }
      }
      showToast('All player stats updated successfully!', 'success');
      setIsUpdatingStats(false);
      setEditedStats({});
      setCalculatedOverall({});
      if (selectedTeam) {
        loadSquad(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error saving stats:', error);
      showToast('Failed to update some stats', 'error');
    }
  };

  // Separate teams for captain AND player view
  // Both captains and players can own teams (captainId = user.id)
  const yourTeams = (user?.role === 'captain' || user?.role === 'player')
    ? teams.filter(t => t.captainId === user.id)
    : [];
  const otherTeams = (user?.role === 'captain' || user?.role === 'player')
    ? teams.filter(t => t.captainId !== user.id)
    : teams;

  // Check if player already has a team (limit to 1 for players)
  const playerHasTeam = user?.role === 'player' && yourTeams.length > 0;
  const canCreateTeam = user?.role === 'captain' || (user?.role === 'player' && !playerHasTeam);

  // --- DETAIL VIEW ---
  if (selectedTeam && !isEditing) {
    const avgRating = squad.length > 0 ? Math.round(squad.reduce((acc, p) => acc + p.overallScore, 0) / squad.length) : 0;
    // Allow both captains and players to manage their own teams
    const isOwnTeam = user?.role === 'admin' || ((user?.role === 'captain' || user?.role === 'player') && selectedTeam.captainId === user?.id);
    const canScheduleMatch = squad.length >= 3 && squad.length <= 7;

    return (
      <div className="max-w-6xl mx-auto animate-fade-in-up" dir={dir}>
        <ConfirmationDialog
          isOpen={!!removePlayerId}
          onClose={() => setRemovePlayerId(null)}
          onConfirm={confirmRemovePlayer}
          title={t('teams.remove_player_confirm')}
          message={t('teams.remove_player_msg')}
        />

        <ConfirmationDialog
          isOpen={!!deleteTeamId}
          onClose={() => setDeleteTeamId(null)}
          onConfirm={confirmDelete}
          title={t('teams.delete_confirm_title')}
          message={t('teams.delete_confirm_msg').replace('{name}', selectedTeam.name)}
        />

        <InvitePlayerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          captainId={selectedTeam.captainId}
          captainName={selectedTeam.captainName}
          currentPlayerCount={squad.length}
          onInviteSent={handleInviteSent}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <button onClick={() => setSelectedTeam(null)} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} /> {t('teams.details.back')}
          </button>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {isOwnTeam && (
              <>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-elkawera-accent/20 text-elkawera-accent rounded hover:bg-elkawera-accent/30 transition-colors text-sm"
                >
                  <UserPlus size={16} /> {t('teams.details.invite')}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-secondary)]/80 transition-colors text-sm"
                >
                  <Edit3 size={16} /> {t('teams.details.edit')}
                </button>
                <button
                  onClick={() => setDeleteTeamId(selectedTeam.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors text-sm"
                >
                  <Trash2 size={16} /> {t('teams.details.delete')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Player Count Warning */}
        {isOwnTeam && !canScheduleMatch && (
          <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${squad.length < 3
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
            <AlertTriangle size={24} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold mb-1">
                {squad.length < 5 ? t('teams.min_players') : t('teams.max_players')}
              </div>
              <div className="text-sm opacity-90">
                {squad.length < 5
                  ? `${t('teams.min_players_msg')} (${squad.length}/5)`
                  : `${t('teams.max_players_msg')} (${squad.length}/7)`}
              </div>
            </div>
          </div>
        )}

        {/* Team Banner */}
        <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden p-6 sm:p-8 mb-8">
          <div className="absolute inset-0 opacity-30 bg-mesh mix-blend-overlay"></div>
          <div className="relative z-10 flex flex-col items-center md:items-start lg:flex-row lg:items-center gap-6 sm:gap-8">
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-white/20 flex-shrink-0"
              style={{ borderColor: selectedTeam.color }}
            >
              {selectedTeam.logoUrl ? (
                <img src={selectedTeam.logoUrl} className="w-full h-full object-cover rounded-full" alt={selectedTeam.name} />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold" style={{ color: selectedTeam.color }}>{selectedTeam.shortName}</span>
              )}
            </div>
            <div className="text-center md:text-left rtl:md:text-right flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold uppercase drop-shadow-lg text-[var(--text-primary)] truncate">{selectedTeam.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2 text-[var(--text-secondary)]">
                <span className="px-3 py-1 bg-black/40 rounded text-[10px] sm:text-sm font-bold tracking-widest">{selectedTeam.shortName}</span>
                <span className="flex items-center gap-1 text-[10px] sm:text-sm"><Users size={14} /> {squad.length} Players</span>
                <span className="text-[10px] sm:text-sm truncate max-w-[200px]">{t('teams.details.captain')}: {selectedTeam.captainName}</span>
              </div>
            </div>
            <div className="w-full lg:w-auto flex justify-center lg:justify-end gap-6 text-center border-t lg:border-t-0 lg:border-l border-[var(--border-color)] pt-4 lg:pt-0 lg:pl-6">
              <div>
                <div className="text-3xl sm:text-4xl font-display font-bold text-elkawera-accent">{avgRating}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60 text-[var(--text-secondary)]">{t('teams.details.avg_rating')}</div>
              </div>
              <div className="w-px bg-[var(--border-color)] hidden sm:block"></div>
              <div>
                <div className={`text-3xl sm:text-4xl font-display font-bold ${squad.length < 5 ? 'text-red-400' : squad.length > 7 ? 'text-yellow-400' : 'text-elkawera-accent'
                  }`}>{squad.length}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60 text-[var(--text-secondary)]">{t('teams.details.squad_size')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Squad List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-2">
            <h2 className="text-2xl font-display font-bold uppercase text-[var(--text-primary)]">{t('teams.details.squad_list')}</h2>
            <div className="flex gap-2 flex-wrap">
              {isOwnTeam && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-sm text-elkawera-accent hover:underline flex items-center gap-1"
                >
                  <UserPlus size={16} /> {t('teams.details.invite')}
                </button>
              )}
              {user?.role === 'admin' && (
                <button
                  onClick={handleToggleStatsMode}
                  className={`text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                    isUpdatingStats
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-elkawera-accent/20 text-elkawera-accent hover:bg-elkawera-accent/30'
                  }`}
                >
                  {isUpdatingStats ? <X size={16} /> : <BarChart3 size={16} />}
                  {isUpdatingStats ? 'Cancel Stats' : 'Quick Update Stats'}
                </button>
              )}
            </div>
          </div>

          {squad.length === 0 ? (
            <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-color)]">
              <p className="text-[var(--text-secondary)]">{t('teams.details.no_players')}</p>
              {isOwnTeam && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-elkawera-accent hover:underline mt-2 inline-block"
                >
                  {t('teams.details.invite_link')}
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Stats Save Bar (when in edit mode) */}
              {isUpdatingStats && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 bg-gradient-to-r from-elkawera-accent/20 to-[#00d1ff]/20 border border-elkawera-accent/40 rounded-xl backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <Activity size={20} className="text-elkawera-accent" />
                    <span className="text-sm font-bold text-white">Editing Performance Stats for <span className="text-elkawera-accent">{squad.length}</span> Players</span>
                  </div>
                  <button
                    onClick={handleSaveAllStats}
                    className="flex items-center gap-2 px-6 py-2.5 bg-elkawera-accent text-black rounded-lg font-bold hover:bg-white transition-colors shadow-lg shadow-elkawera-accent/20"
                  >
                    <CheckCircle size={18} /> Save All Changes
                  </button>
                </motion.div>
              )}

              {/* Normal View - Table */}
              {!isUpdatingStats && (
                <div className="grid gap-3">
                  <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-[var(--bg-secondary)] rounded-lg text-xs font-bold uppercase text-[var(--text-secondary)] tracking-wider border border-[var(--border-color)]">
                    <div className="col-span-1">{t('stats.overall')}</div>
                    <div className="col-span-5 md:col-span-4 rtl:pr-4">{t('teams.table.player')}</div>
                    <div className="col-span-2">{t('teams.table.pos')}</div>
                    <div className="col-span-2">{t('teams.table.tier')}</div>
                    <div className="col-span-2">{t('teams.table.age')}</div>
                    <div className="col-span-1 text-right rtl:text-left">{t('teams.table.action')}</div>
                  </div>

                  {squad.map(player => (
                    <div key={player.id} className="flex flex-col md:grid md:grid-cols-12 items-center px-4 sm:px-6 py-4 bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] rounded-lg hover:border-elkawera-accent/50 transition-colors group gap-4 md:gap-0">
                      <div className="hidden md:block col-span-1 font-display font-bold text-xl text-elkawera-accent">{player.overallScore}</div>

                      <div className="w-full md:col-span-4 flex items-center justify-between md:justify-start gap-4 rtl:pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-[var(--bg-primary)] overflow-hidden border border-[var(--border-color)]">
                            {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover" alt={player.name} /> : <Users size={16} className="m-2 text-gray-500" />}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)] text-sm sm:text-base">{player.name}</div>
                            <div className="md:hidden text-[10px] text-elkawera-accent font-bold uppercase">
                              {player.position} • {player.age} Years • Rating: {player.overallScore}
                            </div>
                          </div>
                        </div>
                        <span className="md:hidden text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-elkawera-accent/20 text-elkawera-accent border border-elkawera-accent/30">
                          {player.cardType}
                        </span>
                      </div>

                      <div className="hidden md:block col-span-2 font-mono text-sm text-[var(--text-secondary)]">{player.position}</div>
                      <div className="hidden md:block col-span-2">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${player.cardType === 'Platinum' ? 'bg-cyan-900/50 text-cyan-200' :
                          player.cardType === 'Gold' ? 'bg-yellow-900/50 text-yellow-200' :
                            'bg-gray-700/50 text-gray-300'
                          }`}>
                          {player.cardType}
                        </span>
                      </div>
                      <div className="hidden md:block col-span-2 text-sm text-[var(--text-secondary)]">{player.age}</div>
                      <div className="w-full md:col-span-1 text-right rtl:text-left flex items-center justify-between md:justify-end rtl:justify-start gap-2 border-t md:border-t-0 border-[var(--border-color)] pt-3 md:pt-0">
                        <span className="md:hidden text-xs text-[var(--text-secondary)] font-bold uppercase">{t('teams.table.action')}</span>
                        <div className="flex gap-2">
                          {isOwnTeam && (
                            <button
                              onClick={() => setRemovePlayerId(player.id)}
                              className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              title={t('teams.remove_player_confirm')}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <Link to={`/create?id=${player.id}`} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2">
                            <Edit3 size={16} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Mode - Performance Cards */}
              {isUpdatingStats && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {squad.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden hover:border-elkawera-accent/30 transition-all"
                    >
                      {/* Player Header */}
                      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[var(--bg-primary)] overflow-hidden border-2 border-elkawera-accent/30">
                              {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover" alt={player.name} /> : <Users size={20} className="m-3 text-gray-500" />}
                            </div>
                            <div>
                              <div className="font-bold text-[var(--text-primary)] text-base">{player.name}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="text-elkawera-accent font-mono">{player.position}</span>
                                <span>•</span>
                                <span>{player.age} Years</span>
                                <span>•</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${player.cardType === 'Platinum' ? 'bg-cyan-900/50 text-cyan-200' : player.cardType === 'Gold' ? 'bg-yellow-900/50 text-yellow-200' : 'bg-gray-700/50 text-gray-300'}`}>
                                  {player.cardType}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Rating</div>
                            <div className={`text-3xl font-display font-black drop-shadow-[0_0_10px_rgba(0,255,157,0.3)] ${
                              (calculatedOverall[player.id] || player.overallScore) >= 85 ? 'text-[#00ff9d]' : 
                              (calculatedOverall[player.id] || player.overallScore) >= 70 ? 'text-[#00d1ff]' : 'text-white'
                            }`}>
                              {calculatedOverall[player.id] || player.overallScore}
                            </div>
                            {calculatedOverall[player.id] && calculatedOverall[player.id] !== player.overallScore && (
                              <div className={`text-[10px] font-bold ${calculatedOverall[player.id] > player.overallScore ? 'text-green-400' : 'text-red-400'}`}>
                                {calculatedOverall[player.id] > player.overallScore ? '↑' : '↓'} {Math.abs(calculatedOverall[player.id] - player.overallScore)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics Grid */}
                      <div className="p-4 space-y-4">
                        {/* Section Title */}
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <Target size={14} className="text-elkawera-accent" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Performance Metrics</span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <StatStepper 
                            label="Goals" 
                            value={editedStats[player.id]?.goals ?? player.goals} 
                            onChange={(v: number) => handleStatChange(player, 'goals', v)} 
                          />
                          <StatStepper 
                            label="Assists" 
                            value={editedStats[player.id]?.assists ?? player.assists} 
                            onChange={(v: number) => handleStatChange(player, 'assists', v)} 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <StatStepper 
                            label="Defense Sub" 
                            value={editedStats[player.id]?.defensiveContributions ?? player.defensiveContributions} 
                            onChange={(v: number) => handleStatChange(player, 'defensiveContributions', v)} 
                          />
                          <StatStepper 
                            label="Clean Sheets" 
                            value={editedStats[player.id]?.cleanSheets ?? player.cleanSheets} 
                            onChange={(v: number) => handleStatChange(player, 'cleanSheets', v)} 
                          />
                        </div>

                        {/* Goalkeeper Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <StatStepper 
                            label="Saves" 
                            value={editedStats[player.id]?.saves ?? (player.saves || 0)} 
                            onChange={(v: number) => handleStatChange(player, 'saves', v)} 
                          />
                          <StatStepper 
                            label="Pen. Saves" 
                            value={editedStats[player.id]?.penaltySaves ?? player.penaltySaves} 
                            onChange={(v: number) => handleStatChange(player, 'penaltySaves', v)} 
                          />
                        </div>

                        {/* Negative Metrics Section */}
                        <div className="flex items-center gap-2 pt-2 pb-2 border-b border-white/5">
                          <TrendingUp size={14} className="text-red-400" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Penalty Metrics</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <StatStepper 
                            label="Goals Conceded" 
                            value={editedStats[player.id]?.goalsConceded ?? (player.goalsConceded || 0)} 
                            onChange={(v: number) => handleStatChange(player, 'goalsConceded', v)} 
                          />
                          <StatStepper 
                            label="Own Goals" 
                            value={editedStats[player.id]?.ownGoals ?? (player.ownGoals || 0)} 
                            onChange={(v: number) => handleStatChange(player, 'ownGoals', v)} 
                          />
                        </div>

                        <StatStepper 
                          label="Penalty Missed" 
                          value={editedStats[player.id]?.penaltyMissed ?? (player.penaltyMissed || 0)} 
                          onChange={(v: number) => handleStatChange(player, 'penaltyMissed', v)} 
                        />

                        {/* Rating Progress Bar */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating Impact</span>
                            <span className={`text-sm font-display font-bold ${
                              (calculatedOverall[player.id] || player.overallScore) > player.overallScore ? 'text-green-400' :
                              (calculatedOverall[player.id] || player.overallScore) < player.overallScore ? 'text-red-400' : 'text-gray-400'
                            }`}>
                              {(calculatedOverall[player.id] || player.overallScore) > player.overallScore ? '+ improving' :
                               (calculatedOverall[player.id] || player.overallScore) < player.overallScore ? '- declining' : 'unchanged'}
                            </span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-[#00ff9d] to-[#00d1ff]"
                              initial={{ width: 0 }}
                              animate={{ width: `${((calculatedOverall[player.id] || player.overallScore) / 99) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-[8px] text-gray-500 font-bold uppercase">
                            <span>Min (1)</span>
                            <span>Current: {calculatedOverall[player.id] || player.overallScore}</span>
                            <span>Max (99)</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN VIEW (Create / Edit Form or Grid) ---
  return (
    <div className="max-w-6xl mx-auto space-y-8" dir={dir}>
      {!isCreating && !isEditing && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold uppercase text-[var(--text-primary)]">{t('teams.title')}</h1>
            <p className="text-[var(--text-secondary)]">{t('teams.subtitle')}</p>
          </div>
          {canCreateTeam && (
            <button
              onClick={startCreating}
              className="flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors shadow-lg shadow-elkawera-accent/20"
            >
              <PlusCircle size={20} /> {t('teams.create_btn')}
            </button>
          )}
          {playerHasTeam && (
            <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-4 py-2 rounded-lg border border-[var(--border-color)]">
              <span className="text-yellow-400">⚠️</span> {t('teams.player_max_team_warning')}
            </div>
          )}
        </div>
      )}

      {(isCreating || isEditing) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-2xl animate-fade-in-down shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold uppercase text-[var(--text-primary)]">{isEditing ? t('teams.edit_title') : t('teams.create_title')}</h2>
            <button
              onClick={() => { setIsCreating(false); setIsEditing(false); }}
              className="p-2 hover:bg-[var(--bg-primary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid md:grid-cols-4 gap-8 items-start">
            <div className="md:col-span-3 space-y-6">
              <div>
                <label className="block text-xs uppercase text-[var(--text-secondary)] mb-2">{t('teams.form.name')}</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 focus:border-elkawera-accent focus:outline-none text-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                  placeholder="e.g. Manchester City"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase text-[var(--text-secondary)] mb-2">{t('teams.form.short_name')}</label>
                  <input
                    required
                    maxLength={3}
                    type="text"
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 focus:border-elkawera-accent focus:outline-none uppercase font-mono tracking-widest text-[var(--text-primary)]"
                    placeholder="MCI"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-[var(--text-secondary)] mb-2">{t('teams.form.color')}</label>
                  <div className="flex items-center gap-2 h-[58px]">
                    <div className="relative w-full h-full">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className="w-full h-full rounded-lg border border-[var(--border-color)] flex items-center justify-center font-mono text-sm font-bold text-shadow text-[var(--text-primary)]"
                        style={{ backgroundColor: formData.color }}
                      >
                        {formData.color}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs uppercase text-[var(--text-secondary)] mb-2">{t('teams.form.logo')}</label>
              <label className="cursor-pointer flex flex-col items-center justify-center bg-[var(--bg-primary)]/50 border border-[var(--border-color)] hover:border-elkawera-accent border-dashed rounded-xl h-[200px] w-full transition-all group overflow-hidden">
                {formData.logoUrl ? (
                  <div className="relative w-full h-full p-4">
                    <img src={formData.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold uppercase">{t('teams.form.change')}</div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Upload size={32} className="mx-auto mb-3 text-[var(--text-secondary)] group-hover:text-elkawera-accent transition-colors" />
                    <span className="text-xs text-[var(--text-secondary)]">{t('teams.form.upload_text')}</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>

            <div className="md:col-span-4 border-t border-[var(--border-color)] pt-6 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => { setIsCreating(false); setIsEditing(false); }}
                className="px-6 py-3 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors font-bold"
              >
                {t('teams.form.cancel')}
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-elkawera-accent text-black font-bold rounded-lg hover:bg-[var(--text-primary)] hover:text-white transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,157,0.2)]"
              >
                <Save size={18} /> {isEditing ? t('teams.form.update') : t('teams.form.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Your Teams Section - For Captains AND Players */}
      {(user?.role === 'captain' || user?.role === 'player') && yourTeams.length > 0 && !isCreating && !isEditing && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="text-elkawera-accent" size={24} />
            <h2 className="text-2xl font-display font-bold uppercase text-[var(--text-primary)]">{t('teams.your_teams')}</h2>
            {user?.role === 'player' && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                {t('teams.player_max_team_warning')}
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yourTeams.map(team => (
              <TeamCard key={team.id} team={team} onClick={() => setSelectedTeam(team)} isOwn={true} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Other Teams Section */}
      {!isCreating && !isEditing && (
        <div className="space-y-4">
          {(user?.role === 'captain' || user?.role === 'player') && (
            <div className="flex items-center gap-3">
              <Users className="text-[var(--text-secondary)]" size={24} />
              <h2 className="text-2xl font-display font-bold uppercase text-[var(--text-primary)]">{t('teams.other_teams')}</h2>
            </div>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTeams.length === 0 && yourTeams.length === 0 && (
              <div className="col-span-full text-center py-24 text-[var(--text-secondary)] border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-[var(--bg-secondary)]">
                <Shield size={64} className="mx-auto mb-6 opacity-30" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('teams.no_teams')}</h3>
                <p className="mb-6">
                  {user?.role === 'player'
                    ? t('teams.player_create_msg')
                    : t('teams.create_first_team')}
                </p>
                {canCreateTeam && (
                  <button onClick={startCreating} className="text-elkawera-accent hover:underline font-bold">{t('teams.link_create')}</button>
                )}
              </div>
            )}

            {otherTeams.map(team => (
              <TeamCard key={team.id} team={team} onClick={() => setSelectedTeam(team)} isOwn={false} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Team Card Component - Updated to accept t prop
const TeamCard: React.FC<{ team: Team; onClick: () => void; isOwn: boolean; t: (key: string) => string }> = ({ team, onClick, isOwn, t }) => {
  return (
    <div
      onClick={onClick}
      className={`relative group bg-[var(--bg-secondary)] border rounded-2xl overflow-hidden hover:-translate-y-1 transition-all cursor-pointer shadow-lg ${isOwn ? 'border-elkawera-accent/50 hover:border-elkawera-accent' : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]/30'
        }`}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-black shadow-lg overflow-hidden bg-white border-4 border-white/10"
            style={{ borderColor: team.color }}
          >
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <span style={{ color: team.color }}>{team.shortName}</span>
            )}
          </div>
          <div className="px-3 py-1 bg-black/50 rounded text-xs font-mono text-gray-400 group-hover:text-white transition-colors">
            {t('teams.card.details')} &rarr;
          </div>
        </div>

        <h3 className={`text-2xl font-display font-bold uppercase mb-1 truncate transition-colors ${isOwn ? 'text-elkawera-accent' : 'text-[var(--text-primary)] group-hover:text-elkawera-accent'
          }`}>{team.name}</h3>
        <div className="text-[var(--text-secondary)] text-sm flex items-center gap-2">
          <span style={{ color: team.color }}>●</span> {team.shortName}
        </div>
      </div>

      {/* Decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 pointer-events-none" />
      <div
        className={`absolute bottom-0 left-0 w-full transition-all ${isOwn ? 'h-2' : 'h-1.5 group-hover:h-2'
          }`}
        style={{ backgroundColor: team.color }}
      />
    </div>
  );
};

