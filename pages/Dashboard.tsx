import React, { useEffect, useState } from 'react';
import { getAllPlayers, deletePlayerAndNotifyUser, getAllTeams, getPlayerById, getUserById, getAllPlayerRegistrationRequests, clearUserNotifications, deletePlayerRegistrationRequest, subscribeToChanges, getAllUsers, getAllMatchRequests, approveMatchRequest, rejectMatchRequest } from '../utils/db';
import { Player, Team, User, PlayerRegistrationRequest, MatchRequest } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Activity, Download, Search, PlusCircle, Sparkles, User as UserIcon, Clock, Bell, X, Shield, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PlayerCard } from '../components/PlayerCard';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { showToast } from '../components/Toast';

export const Dashboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [filterPos, setFilterPos] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adminCards, setAdminCards] = useState<Player[]>([]);
  const [requests, setRequests] = useState<PlayerRegistrationRequest[]>([]);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const { user } = useAuth();
  const { t, dir } = useSettings();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!user) return;

    const freshUser = await getUserById(user.id);
    if (freshUser) setCurrentUser(freshUser);

    if (user?.role === 'admin') {
      const [p, tData] = await Promise.all([getAllPlayers(), getAllTeams()]);
      setPlayers(p.sort((a, b) => b.overallScore - a.overallScore));

      const tMap: Record<string, Team> = {};
      tData.forEach(team => tMap[team.id] = team);
      setTeams(tMap);

      const allRequests = await getAllPlayerRegistrationRequests();
      setRequests(allRequests.filter(r => r.status === 'pending'));

      const allUsersList = await getAllUsers();
      const adminUsers = allUsersList.filter(u => u.role === 'admin' && u.playerCardId);
      const cards: Player[] = [];
      for (const admin of adminUsers) {
        if (admin.playerCardId) {
          const card = await getPlayerById(admin.playerCardId);
          if (card) cards.push(card);
        }
      }
      setAdminCards(cards);

      const matches = await getAllMatchRequests();
      const readyMatches = matches.filter(m => m.homeTeamLineup && m.awayTeamLineup && (m.status === 'pending_admin' || m.status === 'pending_opponent'));
      setMatchRequests(readyMatches);

    } else if (user?.role === 'player') {
      const allRequests = await getAllPlayerRegistrationRequests();
      const myRequests = allRequests.filter(r => r.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
      if (myRequests.length > 0) {
        setRegistrationStatus(myRequests[0].status);
      } else {
        setRegistrationStatus(null);
      }

      const freshUserData = freshUser || user;
      if (freshUserData.playerCardId) {
        const player = await getPlayerById(freshUserData.playerCardId);
        if (player) {
          setMyPlayer(player);
        } else {
          setMyPlayer(null);
        }
      } else {
        setMyPlayer(null);
      }
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'captain') {
        navigate('/captain/dashboard');
      } else if (user.role === 'scout') {
        navigate('/scout/dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [user]);

  const confirmDelete = async () => {
    if (deleteId) {
      await deletePlayerAndNotifyUser(deleteId);
      setDeleteId(null);
      loadData();
    }
  };

  const handleDismissNotification = async () => {
    if (user) {
      await clearUserNotifications(user.id);
      loadData();
    }
  };

  const handleRetryRequest = async () => {
    if (user) {
      const allRequests = await getAllPlayerRegistrationRequests();
      const myRejectedRequest = allRequests.find(r => r.userId === user.id && r.status === 'rejected');
      if (myRejectedRequest) {
        await deletePlayerRegistrationRequest(myRejectedRequest.id);
      }
      navigate('/request-card');
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(players));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "elkawera_players.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const filteredPlayers = players.filter(p => {
    let matchesPos = false;
    if (filterPos === 'ALL') matchesPos = true;
    else if (filterPos === 'FWD' && ['CF'].includes(p.position)) matchesPos = true;
    else if (filterPos === 'DEF' && ['CB'].includes(p.position)) matchesPos = true;
    else if (filterPos === 'GK' && p.position === 'GK') matchesPos = true;

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const getCategoryCount = (positions: string[]) => players.filter(p => positions.includes(p.position)).length;

  const positionCounts = [
    { name: 'FWD', count: getCategoryCount(['CF']) },
    { name: 'DEF', count: getCategoryCount(['CB']) },
    { name: 'GK', count: getCategoryCount(['GK']) },
  ];

  const topPlayer = user?.role === 'admin' && players.length > 0 ? players[0] : null;

  if (user?.role === 'captain' || user?.role === 'scout') {
    return <div className="flex justify-center items-center min-h-[60vh] text-white">Redirecting to your dashboard...</div>;
  }

  if (user?.role === 'player') {
    return (
      <div className="space-y-12 pb-12" dir={dir}>
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight text-[var(--text-primary)]">{t('dashboard.my_card')}</h1>
          <p className="text-[var(--text-secondary)] mt-1">{t('dashboard.welcome')}, {user.name}</p>
        </div>

        {currentUser?.notifications && currentUser.notifications.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start justify-between animate-fade-in-up">
            <div className="flex gap-3">
              <Bell className="text-red-400 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-red-400 mb-1">{t('dashboard.notification')}</h3>
                {currentUser.notifications.map(n => (
                  <p key={n.id} className="text-[var(--text-primary)] text-sm">{n.message}</p>
                ))}
              </div>
            </div>
            <button onClick={handleDismissNotification} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

        {myPlayer ? (
          <div className="flex flex-col items-center">
            <PlayerCard player={myPlayer} uniqueId={myPlayer.id} allowFlipClick={true} className="shadow-2xl" />
            <div className="mt-8 text-center">
              <p className="text-[var(--text-secondary)] mb-4">{t('dashboard.created_by_admin')}</p>
              <p className="text-sm text-[var(--text-secondary)]">{t('dashboard.admin_update_only')}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 bg-[var(--bg-secondary)] rounded-3xl border border-dashed border-[var(--border-color)]">
            {registrationStatus === 'pending' ? (
              <>
                <Clock size={48} className="mx-auto text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('dashboard.pending_card')}</h2>
                <p className="text-[var(--text-secondary)] mb-4">{t('dashboard.pending_desc')}</p>
              </>
            ) : registrationStatus === 'rejected' ? (
              <>
                <X size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('dashboard.rejected_card')}</h2>
                <p className="text-[var(--text-secondary)] mb-6">{t('dashboard.rejected_desc')}</p>
                <button
                  onClick={handleRetryRequest}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                >
                  <PlusCircle size={18} /> {t('dashboard.retry_card')}
                </button>
              </>
            ) : (
              <>
                <UserIcon size={48} className="mx-auto text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('dashboard.no_card')}</h2>
                <p className="text-[var(--text-secondary)] mb-6">{t('dashboard.no_card_desc')}</p>
                <Link to="/request-card" className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                  <PlusCircle size={18} /> {t('dashboard.create_card')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const handleApproveMatch = async (req: MatchRequest) => {
    if (window.confirm(`${t('dashboard.approve_match_confirm')} ${req.homeTeamName} vs ${req.awayTeamName}?`)) {
      try {
        await approveMatchRequest(req.id, user?.id || 'admin');
        showToast(t('dashboard.match_approved'), 'success');
        setMatchRequests(prev => prev.filter(r => r.id !== req.id));
        navigate('/admin/matches');
      } catch (error) {
        console.error(error);
        showToast(t('errors.generic'), 'error');
      }
    }
  };

  const handleRejectMatch = async (req: MatchRequest) => {
    const reason = prompt(t('dashboard.reject_reason'));
    if (reason) {
      try {
        await rejectMatchRequest(req.id, user?.id || 'admin', reason);
        showToast(t('dashboard.match_rejected'), 'info');
        setMatchRequests(prev => prev.filter(r => r.id !== req.id));
      } catch (error) {
        console.error(error);
        showToast(t('errors.generic'), 'error');
      }
    }
  };

  return (
    <div className="space-y-12 pb-12" dir={dir}>
      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('dashboard.delete_confirm_title')}
        message={t('dashboard.delete_confirm_msg')}
      />

      {topPlayer && (
        <div className="bg-gradient-to-r from-elkawera-green to-[var(--bg-primary)] rounded-3xl p-8 md:p-10 border border-elkawera-accent/30 shadow-[0_0_40px_rgba(0,255,157,0.1)] relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-96 h-96 bg-elkawera-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-elkawera-accent/20 text-elkawera-accent text-xs font-bold uppercase tracking-wider border border-elkawera-accent/30">
                <Sparkles size={14} /> {t('dashboard.club_top_rated')}
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold uppercase text-white tracking-tight">
                {topPlayer.name}
              </h2>
              <div className="flex gap-6 text-sm text-gray-300">
                <div>
                  <span className="block font-bold text-2xl text-white">{topPlayer.overallScore}</span>
                  <span className="text-xs uppercase opacity-70">{t('dashboard.metrics.overall')}</span>
                </div>
                <div>
                  <span className="block font-bold text-2xl text-white">{topPlayer.goals}</span>
                  <span className="text-xs uppercase opacity-70">{t('dashboard.metrics.goals')}</span>
                </div>
                <div>
                  <span className="block font-bold text-2xl text-white">{topPlayer.matchesPlayed || 0}</span>
                  <span className="text-xs uppercase opacity-70">{t('dashboard.metrics.matches')}</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate(`/stats?id=${topPlayer.id}`)}
                  className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Activity size={18} /> {t('dashboard.update_performance')}
                </button>
              </div>
            </div>
            <div className="hidden md:block transform scale-75 origin-right hover:scale-90 transition-transform duration-500">
              <PlayerCard player={topPlayer} allowFlipClick={true} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight text-[var(--text-primary)]">{t('dashboard.title')}</h1>
          <p className="text-[var(--text-secondary)] mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportJSON} className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full hover:border-elkawera-accent text-sm font-bold transition-colors text-[var(--text-primary)]">
            <Download size={18} /> {t('dashboard.backup_data')}
          </button>
          <Link to="/admin/rankings" className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full hover:border-elkawera-accent text-sm font-bold transition-colors text-[var(--text-primary)]">
            <TrendingUp size={18} /> Team Rankings
          </Link>
          <Link to="/admin/users" className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full hover:border-elkawera-accent text-sm font-bold transition-colors text-[var(--text-primary)]">
            <UserIcon size={18} /> Users
          </Link>

          <Link
            to="/create"
            className="flex items-center gap-2 px-6 py-3 bg-elkawera-accent border border-elkawera-accent text-black font-bold rounded-full hover:bg-black hover:text-elkawera-accent transition-all duration-300 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
          >
            <PlusCircle size={18} /> {t('dashboard.add_new_card')}
          </Link>
        </div>
      </div>

      {adminCards.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <Shield className="text-elkawera-accent" /> {t('dashboard.admin_team_cards')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {adminCards.map(card => (
              <div key={card.id} className="transform hover:scale-105 transition-transform duration-300">
                <PlayerCard player={card} uniqueId={`admin-${card.id}`} />
                <div className="text-center mt-4">
                  <p className="text-[var(--text-primary)] font-bold">{card.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] uppercase">Administrator</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {matchRequests.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <Shield className="text-elkawera-accent" /> {t('dashboard.match_requests')}
          </h2>
          <div className="grid gap-4">
            {matchRequests.map(req => {
              const isReady = req.status === 'pending_admin';
              return (
                <div key={req.id} className={`bg-gradient-to-r ${isReady ? 'from-elkawera-accent/10 border-elkawera-accent/30' : 'from-yellow-500/10 border-yellow-500/30'} to-transparent border rounded-xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase ${isReady ? 'text-elkawera-accent' : 'text-yellow-500'}`}>
                        {isReady ? t('dashboard.ready_to_start') : 'Awaiting Opponent'}
                      </span>
                      {req.opponentApproved ? (
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Captains Agreed</span>
                      ) : (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Waiting for {req.awayTeamName}</span>
                      )}
                    </div>
                    <h4 className="text-xl font-bold text-[var(--text-primary)]">{req.homeTeamName} vs {req.awayTeamName}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{t('dashboard.lineups_submitted')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectMatch(req)}
                      className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <X size={18} />
                      {t('common.reject')}
                    </button>
                    <button
                      onClick={() => handleApproveMatch(req)}
                      disabled={!isReady}
                      className={`px-6 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 ${isReady
                        ? 'bg-elkawera-accent text-black hover:bg-[var(--text-primary)] hover:text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                        }`}
                      title={!isReady ? "Wait for opponent captain to approve" : "Approve Match"}
                    >
                      <CheckCircle size={18} />
                      {t('common.approve')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">{t('dashboard.squad_composition')}</h3>
            <span className="text-elkawera-accent font-bold text-sm">{players.length} {t('dashboard.total_cards')}</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={positionCounts}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  cursor={{ fill: 'var(--bg-secondary)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {positionCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#00ff9d' : '#333'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] flex flex-col gap-4 shadow-lg backdrop-blur-sm">
          <div>
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 block">{t('dashboard.search_db')}</label>
            <div className="relative">
              <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]`} size={18} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-[var(--bg-primary)] ${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 rounded-xl border border-[var(--border-color)] focus:border-elkawera-accent focus:outline-none text-[var(--text-primary)] transition-colors`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[var(--text-secondary)] mb-2 block">{t('dashboard.filter_pos')}</label>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'FWD', 'DEF', 'GK'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(pos)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterPos === pos ? 'bg-elkawera-accent text-black' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-3 text-[var(--text-primary)]">
          {t('dashboard.player_cards')} <span className="w-full h-px bg-[var(--border-color)] block flex-1"></span>
        </h2>

        {filteredPlayers.length === 0 ? (
          <div className="text-center py-32 bg-[var(--bg-secondary)] rounded-3xl border border-dashed border-[var(--border-color)]">
            <p className="text-[var(--text-secondary)] text-lg">{t('dashboard.no_match')}</p>
            <button onClick={() => { setFilterPos('ALL'); setSearchTerm('') }} className="text-elkawera-accent hover:underline mt-2">{t('dashboard.clear_filters')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 justify-items-center">
            {filteredPlayers.map((player, index) => (
              <div
                key={player.id}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PlayerCard
                  player={player}
                  uniqueId={player.id}
                  allowFlipClick={true}
                  className="shadow-2xl"
                >
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[24px] flex flex-col items-center justify-center gap-6 z-50 border border-white/20">

                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-2xl font-display font-bold text-white uppercase tracking-widest mb-1">{player.name}</h3>
                      <div className="h-0.5 w-12 bg-elkawera-accent mx-auto rounded-full"></div>
                    </div>

                    <div className="flex flex-col gap-3 w-full px-12 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/stats?id=${player.id}`); }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-elkawera-accent hover:text-black text-white font-bold uppercase text-xs rounded-xl transition-all border border-white/10 hover:border-elkawera-accent"
                      >
                        <Activity size={16} /> {t('dashboard.update_performance')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/create?id=${player.id}`); }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-black font-bold uppercase text-xs rounded-xl transition-all border border-white/10"
                      >
                        <Edit2 size={16} /> {t('dashboard.edit_card')}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(player.id); }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold uppercase text-xs rounded-xl transition-all border border-red-500/20"
                      >
                        <Trash2 size={16} /> {t('dashboard.delete_card')}
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-500 uppercase tracking-widest absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity delay-150">
                      {t('dashboard.flip_instruction')}
                    </p>
                  </div>
                </PlayerCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
