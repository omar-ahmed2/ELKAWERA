import React, { useState } from 'react';
import { TeamInvitation } from '../types';
import { updateInvitationStatus, addPlayerToTeam } from '../utils/db';
import { CheckCircle, XCircle, Shield, User } from 'lucide-react';

interface PlayerInvitationCardProps {
    invitation: TeamInvitation;
    onRespond: () => void;
}

export const PlayerInvitationCard: React.FC<PlayerInvitationCardProps> = ({ invitation, onRespond }) => {
    const [processing, setProcessing] = useState(false);

    const handleAccept = async () => {
        setProcessing(true);
        try {
            // Update invitation status
            await updateInvitationStatus(invitation.id, 'accepted');

            // Add player to team
            await addPlayerToTeam(invitation.playerId, invitation.teamId);

            onRespond();
        } catch (error) {
            console.error('Error accepting invitation:', error);
            alert('Failed to accept invitation');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        try {
            await updateInvitationStatus(invitation.id, 'rejected');
            onRespond();
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            alert('Failed to reject invitation');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-elkawera-accent/20 flex items-center justify-center border-2 border-elkawera-accent">
                    <Shield size={32} className="text-elkawera-accent" />
                </div>
                <div>
                    <h3 className="text-xl font-display font-bold">{invitation.teamName}</h3>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <User size={14} />
                        <span>Invited by Captain {invitation.captainName}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Received {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
                <button
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold flex items-center justify-center gap-2"
                >
                    <XCircle size={18} />
                    Reject
                </button>
                <button
                    onClick={handleAccept}
                    disabled={processing}
                    className="flex-1 md:flex-none px-6 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-all font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                >
                    {processing ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <CheckCircle size={18} />
                            Join Team
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
