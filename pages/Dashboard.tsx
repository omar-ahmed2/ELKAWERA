
import React, { useEffect, useState } from 'react';
import { getAllPlayers, deletePlayerAndNotifyUser, getAllTeams, getPlayerById, getUserById, getAllPlayerRegistrationRequests, clearUserNotifications, deletePlayerRegistrationRequest, subscribeToChanges, getAllUsers } from '../utils/db';
import { Player, Team, User, PlayerRegistrationRequest } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Activity, Download, Search, Filter, PlusCircle, Trophy, Sparkles, User as UserIcon, Clock, Bell, X, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PlayerCard } from '../components/PlayerCard';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!user) return;

    // Refresh user data to get latest notifications/card link
    const freshUser = await getUserById(user.id);
    if (freshUser) setCurrentUser(freshUser);

    if (user?.role === 'admin') {
      // Admins see all players
      const [p, t] = await Promise.all([getAllPlayers(), getAllTeams()]);
      // Sort players by score desc
      setPlayers(p.sort((a, b) => b.overallScore - a.overallScore));

      const tMap: Record<string, Team> = {};
      t.forEach(team => tMap[team.id] = team);
      setTeams(tMap);

      // Fetch and set pending requests
      const allRequests = await getAllPlayerRegistrationRequests();
      setRequests(allRequests.filter(r => r.status === 'pending'));

      // Load all admin cards
      const allUsers = await getAllUsers();
      const adminUsers = allUsers.filter(u => u.role === 'admin' && u.playerCardId);
      const cards: Player[] = [];
      for (const admin of adminUsers) {
        if (admin.playerCardId) {
          const card = await getPlayerById(admin.playerCardId);
          if (card) cards.push(card);
        }
      }
      setAdminCards(cards);

    } else if (user?.role === 'player') {
      // Check registration status
      const allRequests = await getAllPlayerRegistrationRequests();
      const myRequests = allRequests.filter(r => r.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
      if (myRequests.length > 0) {
        setRegistrationStatus(myRequests[0].status);
      } else {
        setRegistrationStatus(null);
      }

      // Check localStorage first for immediate update, then fetch from DB
      const storedUser = localStorage.getItem('elkawera_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.playerCardId) {
          const player = await getPlayerById(parsedUser.playerCardId);
          if (player) {
            setMyPlayer(player);
            return;
          }
        }
      }

      // Fallback to user object from context
      // Use freshUser if available, otherwise user from context
      const targetUser = freshUser || user;
      if (targetUser.playerCardId) {
        const player = await getPlayerById(targetUser.playerCardId);
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
    loadData();
    // Subscribe to real-time updates
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
      // Find the rejected request
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
    else if (filterPos === 'FWD' && ['ST', 'CF', 'LW', 'RW'].includes(p.position)) matchesPos = true;
    else if (filterPos === 'MID' && ['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p.position)) matchesPos = true;
    else if (filterPos === 'DEF' && ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)) matchesPos = true;
    else if (filterPos === 'GK' && p.position === 'GK') matchesPos = true;

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const getCategoryCount = (positions: string[]) => players.filter(p => positions.includes(p.position)).length;

  const positionCounts = [
    { name: 'FWD', count: getCategoryCount(['ST', 'CF', 'LW', 'RW']) },
    { name: 'MID', count: getCategoryCount(['CAM', 'CM', 'CDM', 'LM', 'RM']) },
    { name: 'DEF', count: getCategoryCount(['CB', 'LB', 'RB', 'LWB', 'RWB']) },
    { name: 'GK', count: getCategoryCount(['GK']) },
  ];

  // Highest Rated Player for Spotlight (admin only)
  const topPlayer = user?.role === 'admin' && players.length > 0 ? players[0] : null;

  // Player Dashboard View
  if (user?.role === 'player') {
    return (
      <div className="space-y-12 pb-12">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight">My Player Card</h1>
          <p className="text-gray-400 mt-1">Welcome, {user.name}</p>
        </div>

        {currentUser?.notifications && currentUser.notifications.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start justify-between animate-fade-in-up">
            <div className="flex gap-3">
              <Bell className="text-red-400 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-red-400 mb-1">Notification</h3>
                {currentUser.notifications.map(n => (
                  <p key={n.id} className="text-gray-300 text-sm">{n.message}</p>
                ))}
              </div>
            </div>
            <button onClick={handleDismissNotification} className="text-gray-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

        {myPlayer ? (
          <div className="flex flex-col items-center">
            <PlayerCard player={myPlayer} uniqueId={myPlayer.id} allowFlipClick={true} className="shadow-2xl" />
            <div className="mt-8 text-center">
              <p className="text-gray-400 mb-4">Your player card has been created by an admin.</p>
              <p className="text-sm text-gray-500">Only admins can update your card stats.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
            {registrationStatus === 'pending' ? (
              <>
                <Clock size={48} className="mx-auto text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Your Card is Pending</h2>
                <p className="text-gray-400 mb-4">An admin will create your player card soon.</p>
                <p className="text-sm text-gray-500">You'll be notified once your card is ready.</p>
              </>
            ) : registrationStatus === 'rejected' ? (
              <>
                <X size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Request Rejected</h2>
                <p className="text-gray-400 mb-6">Your previous request was rejected. Please review your details and try again.</p>
                <button
                  onClick={handleRetryRequest}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                >
                  <PlusCircle size={18} /> Create New Card
                </button>
              </>
            ) : (
              <>
                <UserIcon size={48} className="mx-auto text-gray-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Player Card Found</h2>
                <p className="text-gray-400 mb-6">You don't have a player card yet. Request one now!</p>
                <Link to="/request-card" className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                  <PlusCircle size={18} /> Create Player Card
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="space-y-12 pb-12">
      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Player Card?"
        message="This action cannot be undone. This player and their stats will be permanently removed from your database."
      />

      {/* Hero / Spotlight Section */}
      {topPlayer && (
        <div className="bg-gradient-to-r from-elkawera-green to-black rounded-3xl p-8 md:p-10 border border-elkawera-accent/30 shadow-[0_0_40px_rgba(0,255,157,0.1)] relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 w-96 h-96 bg-elkawera-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-elkawera-accent/20 text-elkawera-accent text-xs font-bold uppercase tracking-wider border border-elkawera-accent/30">
                <Sparkles size={14} /> Club Top Rated
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold uppercase text-white tracking-tight">
                {topPlayer.name}
              </h2>
              <div className="flex gap-6 text-sm text-gray-300">
                <div>
                  <span className="block font-bold text-2xl text-white">{topPlayer.overallScore}</span>
                  <span className="text-xs uppercase opacity-70">Overall</span>
                </div>
                <div>
                  <span className="block font-bold text-2xl text-white">{topPlayer.goals}</span>
                  <span className="text-xs uppercase opacity-70">Goals</span>
                </div>
                <div>
                  <span className="block font-bold text-2xl text-white">{topPlayer.matchesPlayed || 0}</span>
                  <span className="text-xs uppercase opacity-70">Matches</span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => navigate(`/stats?id=${topPlayer.id}`)}
                  className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Activity size={18} /> Update Performance
                </button>
              </div>
            </div>
            <div className="hidden md:block transform scale-75 origin-right hover:scale-90 transition-transform duration-500">
              <PlayerCard player={topPlayer} allowFlipClick={true} />
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Squad Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your player cards and track performance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportJSON} className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-sm font-bold transition-colors">
            <Download size={18} /> Backup Data
          </button>
          <Link to="/create" className="flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
            <PlusCircle size={18} /> Add New Card
          </Link>
        </div>
      </div>

      {/* Admins Cards Section */}
      {adminCards.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="text-elkawera-accent" /> Admin Team Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {adminCards.map(card => (
              <div key={card.id} className="transform hover:scale-105 transition-transform duration-300">
                <PlayerCard player={card} uniqueId={`admin-${card.id}`} />
                <div className="text-center mt-4">
                  <p className="text-white font-bold">{card.name}</p>
                  <p className="text-xs text-gray-400 uppercase">Administrator</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Requests Section */}
      {/* Add your Registration Requests UI here if needed */}

      {/* Stats & Filter Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Squad Composition</h3>
            <span className="text-elkawera-accent font-bold text-sm">{players.length} Total Cards</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={positionCounts}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
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

        {/* Filters */}
        <div className="lg:col-span-1 bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col gap-4 shadow-lg backdrop-blur-sm">
          <div>
            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Search Database</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Player Name, Country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-elkawera-accent focus:outline-none text-white transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Filter Position</label>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'FWD', 'MID', 'DEF', 'GK'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(pos)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${filterPos === pos ? 'bg-elkawera-accent text-black' : 'bg-black/30 text-gray-400 hover:text-white'}`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-3">
          Player Cards <span className="w-full h-px bg-white/10 block flex-1"></span>
        </h2>

        {filteredPlayers.length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-gray-500 text-lg">No players match your criteria.</p>
            <button onClick={() => { setFilterPos('ALL'); setSearchTerm('') }} className="text-elkawera-accent hover:underline mt-2">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 justify-items-center">
            {filteredPlayers.map((player, index) => (
              <div
                key={player.id}
                className="relative group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* The Card */}
                <PlayerCard
                  player={player}
                  uniqueId={player.id}
                  allowFlipClick={true}
                  className="shadow-2xl"
                >
                  {/* Hover Overlay with Actions */}
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
                        <Activity size={16} /> Update Stats
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/create?id=${player.id}`); }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white text-white hover:text-black font-bold uppercase text-xs rounded-xl transition-all border border-white/10"
                      >
                        <Edit2 size={16} /> Edit Card
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(player.id); }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold uppercase text-xs rounded-xl transition-all border border-red-500/20"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>

                    <p className="text-[10px] text-gray-500 uppercase tracking-widest absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity delay-150">
                      Click Card to Flip
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
