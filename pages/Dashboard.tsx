import React, { useEffect, useState } from 'react';
import { getAllPlayers, deletePlayerAndNotifyUser, getAllTeams, getPlayerById, getUserById, getAllPlayerRegistrationRequests, clearUserNotifications, deletePlayerRegistrationRequest, subscribeToChanges, getAllMatchRequests, approveMatchRequest, rejectMatchRequest } from '../utils/db';
import { Player, Team, User, PlayerRegistrationRequest, MatchRequest } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Activity, Search, PlusCircle, Sparkles, User as UserIcon, Clock, Bell, X, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PlayerCard } from '../components/PlayerCard';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { showToast } from '../components/Toast';
import { AdminDashboard } from './AdminDashboard';

export const Dashboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [filterPos, setFilterPos] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const { user } = useAuth();
  const { t, dir } = useSettings();
  const navigate = useNavigate();

  const loadData = async () => {
    if (!user) return;

    const freshUser = await getUserById(user.id);
    if (freshUser) setCurrentUser(freshUser);

    if (user?.role === 'admin') {
      // Admin data loading is now handled in AdminDashboard.tsx
      return;
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

  const confirmDelete = async (id: string) => {
    await deletePlayerAndNotifyUser(id);
    setConfirmingDeleteId(null);
    loadData();
    showToast(t('dashboard.player_deleted'), 'success');
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

  // --- Render ---

  if (user?.role === 'captain' || user?.role === 'scout') {
    return <div className="flex justify-center items-center min-h-[60vh] text-white">Redirecting to your dashboard...</div>;
  }

  // NEW: Admin View
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // Player View
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

  return <div>Loading...</div>;
};
