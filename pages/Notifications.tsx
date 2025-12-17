import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification,
    clearUserNotifications,
    confirmMatchRequestByOpponent,
    getTeamById,
    subscribeToChanges,
    updateInvitationStatus
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

    const handleClearAll = async () => {
        if (!user) return;
        if (window.confirm('Are you sure you want to clear all notifications?')) {
            await clearUserNotifications(user.id);
            setNotifications([]);
        }
    };

    const handleMatchRequestAction = async (notification: Notification, action: 'confirm') => {
        if (!notification.metadata?.requestId) return;

        // Optimistic UI Update: Mark as read immediately to hide buttons/visualize action
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));

        try {
            if (action === 'confirm') {
                if (!user?.id) throw new Error("User ID missing");
                // Pass empty array for lineup as handling it via notification doesn't select players yet. 
                // Ideally this flow should open a modal to select players, but for now passing empty to fix error/match rapid accept flow.
                await confirmMatchRequestByOpponent(notification.metadata.requestId, user.id, []);
                showToast('Match request confirmed! Admin notified.', 'success');

                // Ensure backend is synced
                await markNotificationAsRead(notification.id);
            }
        } catch (error) {
            console.error('Error handling match request:', error);
            showToast('Failed to confirm match request', 'error');
            // Revert optimistic update on failure (optional, but good practice)
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: false } : n));
        }
    };

    const handleInvitationAction = async (notification: Notification, action: 'accepted' | 'rejected') => {
        if (!notification.metadata?.invitationId) return;

        try {
            await updateInvitationStatus(notification.metadata.invitationId, action);
            showToast(`Invitation ${action}`, action === 'accepted' ? 'success' : 'info');
            await handleMarkAsRead(notification.id);
        } catch (error) {
            console.error('Error handling invitation:', error);
            showToast('Failed to update invitation', 'error');
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'match') return n.type.includes('match');
        if (filter === 'team') return n.type.includes('invitation');
        return true;
    });

    const getIcon = (type: NotificationType) => {
        if (type.includes('match')) return <Calendar className="text-elkawera-accent" />;
        if (type.includes('invitation') || type.includes('team')) return <Shield className="text-blue-400" />;
        if (type === 'scout_alert' || type === 'system_announcement') return <Shield className="text-elkawera-accent" />;
        if (type.includes('card')) return <Info className="text-yellow-400" />;
        return <Bell className="text-gray-400" />;
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4" dir={dir}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold uppercase text-[var(--text-primary)]">
                        {t('settings.notifications')}
                    </h1>
                    <p className="text-[var(--text-secondary)]">Manage your alerts and requests</p>
                </div>
                {notifications.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-bold flex items-center gap-2"
                    >
                        <Trash2 size={16} /> Clear All
                    </button>
                )}
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
                                : 'bg-[var(--bg-secondary)] border-elkawera-accent/50 shadow-lg shadow-elkawera-accent/5'
                                }`}
                            onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-full mt-1 ${notification.read ? 'bg-gray-800' : 'bg-black border border-[var(--border-color)]'}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-bold text-lg mb-1 ${notification.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap ml-2">
                                            {new Date(notification.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] text-sm mb-3">
                                        {notification.message}
                                    </p>

                                    {/* Action Buttons */}
                                    {notification.type === 'match_request' && !notification.read && (
                                        <div className="flex gap-3 mt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMatchRequestAction(notification, 'confirm');
                                                }}
                                                className="px-4 py-2 bg-elkawera-accent text-black font-bold rounded-lg text-sm hover:bg-white transition-colors flex items-center gap-2"
                                            >
                                                <CheckCircle size={14} /> Accept Challenge
                                            </button>
                                        </div>
                                    )}

                                    {notification.type === 'team_invitation' && !notification.read && (
                                        <div className="flex gap-3 mt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInvitationAction(notification, 'accepted');
                                                }}
                                                className="px-4 py-2 bg-elkawera-accent text-black font-bold rounded-lg text-sm hover:bg-white transition-colors flex items-center gap-2"
                                            >
                                                <CheckCircle size={14} /> Accept
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleInvitationAction(notification, 'rejected');
                                                }}
                                                className="px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded-lg text-sm hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
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
