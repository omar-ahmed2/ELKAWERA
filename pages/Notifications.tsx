import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification,
    confirmMatchRequestByOpponent,
    getTeamById,
    subscribeToChanges,
    updateInvitationStatus,
    markAllNotificationsAsRead
} from '../utils/db';
import { Notification, NotificationType } from '../types';
import { Bell, Check, Trash2, Calendar, Shield, Info, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';

export const Notifications: React.FC = () => {
    const { user } = useAuth();
    const { t, dir } = useSettings();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'match' | 'team'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
        const unsubscribe = subscribeToChanges(() => {
            loadNotifications();
        });
        return () => unsubscribe();
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const data = await getUserNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            await markAllNotificationsAsRead(user.id);
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            console.error('Error marking all as read:', error);
            showToast('Failed to mark all as read', 'error');
            // Re-sync with DB on error
            loadNotifications();
        }
    };

    const handleMatchRequestAction = async (notification: Notification, action: 'confirm') => {
        if (!notification || !notification.metadata?.requestId) {
            if (notification?.id) await handleMarkAsRead(notification.id);
            return;
        }

        // Ensure it's marked read
        if (!notification.read) await handleMarkAsRead(notification.id);

        try {
            if (action === 'confirm' && user?.id) {
                await confirmMatchRequestByOpponent(notification.metadata.requestId, user.id, []);
                showToast('Match request confirmed! Admin notified.', 'success');
            }
        } catch (error) {
            console.error('Error handling match request:', error);
            showToast('Failed to confirm match request', 'error');
        }
    };

    const handleInvitationAction = async (notification: Notification, action: 'accepted' | 'rejected') => {
        if (!notification || !notification.metadata?.invitationId) {
            if (notification?.id) await handleMarkAsRead(notification.id);
            return;
        }

        // Ensure it's marked read
        if (!notification.read) await handleMarkAsRead(notification.id);

        try {
            await updateInvitationStatus(notification.metadata.invitationId, action);
            showToast(`Invitation ${action}`, action === 'accepted' ? 'success' : 'info');
        } catch (error) {
            console.error('Error handling invitation:', error);
            showToast('Failed to update invitation', 'error');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (!n || !n.type) return false;
        if (filter === 'unread') return !n.read;
        if (filter === 'match') return n.type.includes('match');
        if (filter === 'team') return n.type.includes('invitation');
        return true;
    });

    const getIcon = (type: NotificationType) => {
        const t = (type || '').toLowerCase();
        if (t.includes('match')) return <Calendar className="text-elkawera-accent" />;
        if (t.includes('invitation') || t.includes('team')) return <Shield className="text-blue-400" />;
        if (t === 'scout_alert' || t === 'system_announcement') return <Shield className="text-elkawera-accent" />;
        if (t.includes('card')) return <Info className="text-yellow-400" />;
        return <Bell className="text-gray-400" />;
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4" dir={dir}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase text-[var(--text-primary)]">
                        {t('settings.notifications')}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base">Manage your alerts and requests</p>
                </div>
                <div className="flex items-center">
                    {notifications.some(n => !n.read) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="px-4 py-2 bg-elkawera-accent text-black hover:bg-white rounded-xl transition-all text-xs sm:text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,157,0.3)] group"
                        >
                            <CheckCircle size={16} className="group-hover:scale-110 transition-transform" /> Mark All Read
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'unread', label: 'Unread' },
                    { id: 'match', label: 'Matches' },
                    { id: 'team', label: 'Team Invites' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === tab.id
                            ? 'bg-elkawera-accent text-black'
                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 text-[var(--text-secondary)]">Loading...</div>
            ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-color)]">
                    <Bell className="mx-auto h-12 w-12 text-[var(--text-secondary)] opacity-50 mb-4" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">No notifications</h3>
                    <p className="text-[var(--text-secondary)]">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`relative p-4 rounded-xl border transition-all ${notification.read
                                ? 'bg-[var(--bg-secondary)]/50 border-[var(--border-color)] opacity-70'
                                : 'bg-[var(--bg-secondary)] border-elkawera-accent/50 shadow-lg shadow-elkawera-accent/5 cursor-pointer hover:border-elkawera-accent'
                                }`}
                            onClick={async () => {
                                try {
                                    if (!notification || notification.read) return;
                                    await handleMarkAsRead(notification.id);
                                } catch (err) {
                                    console.error('Error handling notification click:', err);
                                }
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-2 sm:p-3 rounded-full mt-1 shrink-0 ${notification.read ? 'bg-gray-800' : 'bg-black border border-[var(--border-color)]'}`}>
                                    {React.cloneElement(getIcon(notification.type) as React.ReactElement, { size: 16, className: 'sm:size-[20px]' })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className={`font-bold text-base sm:text-lg mb-0.5 leading-tight truncate ${notification.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-[10px] sm:text-xs text-[var(--text-secondary)] whitespace-nowrap opacity-60">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] text-xs sm:text-sm mb-3">
                                        {notification.message}
                                    </p>

                                    {/* Action Buttons */}
                                    {notification.type === 'match_request' && !notification.read && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMatchRequestAction(notification, 'confirm');
                                                }}
                                                className="w-full sm:w-auto px-4 py-2 bg-elkawera-accent text-black font-bold rounded-lg text-xs sm:text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={14} /> Accept Challenge
                                            </button>
                                        </div>
                                    )}

                                    {notification.type === 'team_invitation' && !notification.read && (
                                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInvitationAction(notification, 'accepted');
                                                }}
                                                className="w-full sm:w-auto px-4 py-2 bg-elkawera-accent text-black font-bold rounded-lg text-xs sm:text-sm hover:bg-white transition-colors flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={14} /> Accept
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInvitationAction(notification, 'rejected');
                                                }}
                                                className="w-full sm:w-auto px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded-lg text-xs sm:text-sm hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={14} /> Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(notification.id);
                                    }}
                                    className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
