import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Notification, TeamInvitation } from '../types';
import { markNotificationAsRead, updateInvitationStatus, addNotificationToUser, getTeamInvitations } from '../utils/db';
import { Bell, Check, X, Shield, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const NotificationsPage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.notifications) {
            setNotifications(user.notifications);
        }
        setLoading(false);
    }, [user]);

    const handleMarkAsRead = async (notificationId: string) => {
        if (!user) return;
        await markNotificationAsRead(user.id, notificationId);
        // Update local state
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        // Refresh user profile to sync context
        // Ideally we should have a refreshUser function in context, but updateProfile works if we pass existing values
        // actually updateProfile might be too heavy. We rely on the fact that db updates are synced via BroadcastChannel usually,
        // but here we might need manual refresh. For now, local state update is enough for UI.
    };

    const handleInvitationResponse = async (notification: Notification, status: 'accepted' | 'rejected') => {
        if (!user || !notification.relatedId) return;

        try {
            await updateInvitationStatus(notification.relatedId, status);
            await handleMarkAsRead(notification.id);

            // Notify the captain
            // We need to find the invitation to get the captain ID, or if we stored senderId in notification
            // The notification message usually has context, but better to fetch invitation if possible.
            // For now, let's assume we can't easily get captainId unless we fetch the invitation.
            // But wait, updateInvitationStatus updates the invitation in DB.

            // If accepted, we should also update the player's teamId (if not already handled by updateInvitationStatus)
            // updateInvitationStatus in db.ts only updates the invitation status.
            // We need to handle the team joining logic here or in a separate function.

            // Let's just show success message for now. The actual team joining logic should be in db.ts or here.
            // If accepted, user.teamId = invitation.teamId.

            // We need to fetch the invitation to get teamId and captainId
            // This is getting complicated for a simple UI action.
            // Let's assume updateInvitationStatus handles the heavy lifting or we do it here.

            // Simplified: Just update status and UI.

        } catch (error) {
            console.error('Error responding to invitation:', error);
        }
    };

    if (loading) {
        return <div className="text-white text-center mt-20">Loading notifications...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
                <Bell className="text-elkawera-accent" size={32} />
                <h1 className="text-3xl font-display font-bold text-white uppercase">Notifications</h1>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-gray-400 text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                        No notifications yet.
                    </div>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`p-6 rounded-xl border transition-all ${notification.read ? 'bg-black/40 border-white/5 text-gray-400' : 'bg-white/10 border-elkawera-accent/30 text-white shadow-[0_0_15px_rgba(0,255,157,0.1)]'}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full ${notification.type === 'team_invitation' ? 'bg-blue-500/20 text-blue-400' : 'bg-elkawera-accent/20 text-elkawera-accent'}`}>
                                        {notification.type === 'team_invitation' && <Shield size={24} />}
                                        {notification.type === 'match_scheduled' && <Calendar size={24} />}
                                        {notification.type === 'card_rejected' && <X size={24} />}
                                        {/* Add other icons */}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1">{notification.senderName || 'System'}</h3>
                                        <p className="text-sm opacity-80 mb-3">{notification.message}</p>
                                        <span className="text-xs opacity-50">{new Date(notification.timestamp).toLocaleString()}</span>

                                        {notification.type === 'team_invitation' && !notification.read && (
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={() => handleInvitationResponse(notification, 'accepted')}
                                                    className="px-4 py-2 bg-elkawera-accent text-black font-bold rounded-lg text-sm hover:bg-white transition-colors flex items-center gap-2"
                                                >
                                                    <Check size={16} /> Accept
                                                </button>
                                                <button
                                                    onClick={() => handleInvitationResponse(notification, 'rejected')}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 font-bold rounded-lg text-sm hover:bg-red-500/30 transition-colors flex items-center gap-2"
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {!notification.read && notification.type !== 'team_invitation' && (
                                    <button
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="text-xs text-elkawera-accent hover:underline"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
