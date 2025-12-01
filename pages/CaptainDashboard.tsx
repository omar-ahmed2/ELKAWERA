import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getAllTeams,
    saveTeam,
    getAllPlayers,
    saveTeamInvitation,
    getPendingInvitationsForTeam,
    getTeamInvitations,
    updateInvitationStatus,
    subscribeToChanges
} from '../utils/db';
import { Team, Player, TeamInvitation } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Users, PlusCircle, Send, Trophy, TrendingUp, Calendar, UserPlus, CheckCircle, XCircle, Upload } from 'lucide-react';

export const CaptainDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [showInvitePlayerModal, setShowInvitePlayerModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Only captains can access
    useEffect(() => {
        if (user && user.role !== 'captain' && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const loadData = async () => {
        try {
            const allTeams = await getAllTeams();
            setTeams(allTeams);

            // Find team where current user is captain
            const captainTeam = allTeams.find(t => t.captainId === user?.id);
            setMyTeam(captainTeam || null);

            const allPlayers = await getAllPlayers();
            setPlayers(allPlayers);

            if (captainTeam) {
                const invitations = await getPendingInvitationsForTeam(captainTeam.id);
                setPendingInvitations(invitations);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading captain data:', error);
            setLoading(false);
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

    if (loading) {
        return <div className="text-center py-20">Loading captain dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Captain Dashboard</h1>
                    <p className="text-gray-400 mt-1">Manage your team and schedule matches</p>
                </div>
                {!myTeam && (
                    <button
                        onClick={() => setShowCreateTeamModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                    >
                        <PlusCircle size={20} />
                        Create Team
                    </button>
                )}
            </div>

            {myTeam ? (
                <>
                    {/* Team Overview */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                {myTeam.logoUrl && (
                                    <img src={myTeam.logoUrl} alt={myTeam.name} className="w-20 h-20 rounded-full object-cover border-4 border-elkawera-accent" />
                                )}
                                <div>
                                    <h2 className="text-3xl font-display font-bold">{myTeam.name}</h2>
                                    <p className="text-gray-400">{myTeam.shortName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowInvitePlayerModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-elkawera-accent/20 text-elkawera-accent border border-elkawera-accent rounded-lg hover:bg-elkawera-accent hover:text-black transition-colors font-bold"
                            >
                                <UserPlus size={16} />
                                Invite Players
                            </button>
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Users size={16} />
                                    <span className="text-xs uppercase font-bold">Players</span>
                                </div>
                                <p className="text-3xl font-display font-bold">{players.filter(p => p.teamId === myTeam.id).length}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <TrendingUp size={16} />
                                    <span className="text-xs uppercase font-bold">XP</span>
                                </div>
                                <p className="text-3xl font-display font-bold text-elkawera-accent">{myTeam.experiencePoints || 0}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Trophy size={16} />
                                    <span className="text-xs uppercase font-bold">Ranking</span>
                                </div>
                                <p className="text-3xl font-display font-bold text-yellow-400">#{myTeam.ranking || 'N/A'}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Send size={16} />
                                    <span className="text-xs uppercase font-bold">Pending Invites</span>
                                </div>
                                <p className="text-3xl font-display font-bold">{pendingInvitations.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pending Invitations */}
                    {pendingInvitations.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-display font-bold uppercase">Pending Invitations</h3>
                            <div className="grid gap-4">
                                {pendingInvitations.map(invitation => (
                                    <div key={invitation.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold">{invitation.playerName}</p>
                                            <p className="text-sm text-gray-400">Invited {new Date(invitation.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase">Pending</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Team Roster */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-display font-bold uppercase">Team Roster</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {players.filter(p => p.teamId === myTeam.id).map(player => (
                                <div key={player.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-elkawera-accent/20 flex items-center justify-center">
                                            <span className="text-xl font-display font-bold">{player.overallScore}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold">{player.name}</p>
                                            <p className="text-sm text-gray-400">{player.position}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {players.filter(p => p.teamId === myTeam.id).length === 0 && (
                                <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <Users size={48} className="mx-auto text-gray-600 mb-4" />
                                    <p className="text-gray-400">No players in your team yet</p>
                                    <button
                                        onClick={() => setShowInvitePlayerModal(true)}
                                        className="mt-4 px-4 py-2 bg-elkawera-accent text-black rounded-lg font-bold hover:bg-white transition-colors"
                                    >
                                        Invite Players
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/captain/schedule-match')}
                            className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-elkawera-accent/20 to-elkawera-accent/10 border border-elkawera-accent rounded-2xl hover:from-elkawera-accent/30 hover:to-elkawera-accent/20 transition-all group"
                        >
                            <Calendar size={24} className="text-elkawera-accent" />
                            <div className="text-left">
                                <p className="font-bold text-lg">Schedule External Match</p>
                                <p className="text-sm text-gray-400">Challenge another team</p>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/teams')}
                            className="flex items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                        >
                            <Trophy size={24} className="text-yellow-400" />
                            <div className="text-left">
                                <p className="font-bold text-lg">View All Teams</p>
                                <p className="text-sm text-gray-400">See rankings and stats</p>
                            </div>
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Users size={64} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Team Yet</h3>
                    <p className="text-gray-400 mb-6">Create your team to start managing players and scheduling matches</p>
                    <button
                        onClick={() => setShowCreateTeamModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all"
                    >
                        <PlusCircle size={20} />
                        Create Team
                    </button>
                </div>
            )}

            {/* Create Team Modal */}
            {showCreateTeamModal && (
                <CreateTeamModal
                    onClose={() => setShowCreateTeamModal(false)}
                    onCreated={() => {
                        setShowCreateTeamModal(false);
                        loadData();
                    }}
                />
            )}

            {/* Invite Player Modal */}
            {showInvitePlayerModal && myTeam && (
                <InvitePlayerModal
                    team={myTeam}
                    players={players}
                    onClose={() => setShowInvitePlayerModal(false)}
                    onInvited={() => {
                        setShowInvitePlayerModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
};

// Create Team Modal Component
const CreateTeamModal: React.FC<{
    onClose: () => void;
    onCreated: () => void;
}> = ({ onClose, onCreated }) => {
    const { user } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [shortName, setShortName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [creating, setCreating] = useState(false);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async () => {
        if (!teamName || !shortName) {
            alert('Please fill in team name and short name');
            return;
        }

        setCreating(true);

        try {
            const newTeam: Team = {
                id: uuidv4(),
                name: teamName,
                shortName: shortName.toUpperCase(),
                color: '#00FF9D',
                logoUrl: logoUrl || undefined,
                captainId: user?.id,
                experiencePoints: 0,
                ranking: 0,
                createdAt: Date.now(),
            };

            await saveTeam(newTeam);
            onCreated();
        } catch (error) {
            console.error('Error creating team:', error);
            alert('Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-md w-full p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-display font-bold uppercase">Create Team</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Team Name</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g., Thunder FC"
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Short Name (3-4 letters)</label>
                        <input
                            type="text"
                            value={shortName}
                            onChange={(e) => setShortName(e.target.value.slice(0, 4))}
                            placeholder="e.g., THU"
                            className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none uppercase"
                            maxLength={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Team Logo (Optional)</label>
                        <div className="flex items-center gap-4">
                            {logoUrl && (
                                <img src={logoUrl} alt="Logo preview" className="w-16 h-16 rounded-full object-cover border-2 border-elkawera-accent" />
                            )}
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                                <Upload size={16} />
                                <span className="text-sm font-bold">Upload Logo</span>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={creating || !teamName || !shortName}
                        className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {creating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Create Team
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Invite Player Modal Component
const InvitePlayerModal: React.FC<{
    team: Team;
    players: Player[];
    onClose: () => void;
    onInvited: () => void;
}> = ({ team, players, onClose, onInvited }) => {
    const { user } = useAuth();
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [sending, setSending] = useState(false);

    // Filter out players already in the team
    const availablePlayers = players.filter(p => !p.teamId || p.teamId !== team.id);

    const handleSend = async () => {
        if (selectedPlayers.length === 0) {
            alert('Please select at least one player');
            return;
        }

        setSending(true);

        try {
            for (const playerId of selectedPlayers) {
                const player = players.find(p => p.id === playerId);
                if (!player) continue;

                const invitation: TeamInvitation = {
                    id: uuidv4(),
                    teamId: team.id,
                    playerId: playerId,
                    playerName: player.name,
                    invitedBy: user?.id || '',
                    captainName: user?.name || '',
                    teamName: team.name,
                    status: 'pending',
                    createdAt: Date.now(),
                };

                await saveTeamInvitation(invitation);
            }

            onInvited();
        } catch (error) {
            console.error('Error sending invitations:', error);
            alert('Failed to send invitations');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-display font-bold uppercase">Invite Players</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <XCircle size={24} />
                    </button>
                </div>

                <p className="text-gray-400 mb-4">Select players to invite to {team.name}</p>

                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                    {availablePlayers.map(player => (
                        <label
                            key={player.id}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={selectedPlayers.includes(player.id)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedPlayers([...selectedPlayers, player.id]);
                                    } else {
                                        setSelectedPlayers(selectedPlayers.filter(id => id !== player.id));
                                    }
                                }}
                                className="w-5 h-5"
                            />
                            <div className="w-10 h-10 rounded-full bg-elkawera-accent/20 flex items-center justify-center">
                                <span className="text-sm font-display font-bold">{player.overallScore}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold">{player.name}</p>
                                <p className="text-sm text-gray-400">{player.position}</p>
                            </div>
                        </label>
                    ))}
                    {availablePlayers.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No available players to invite</p>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || selectedPlayers.length === 0}
                        className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {sending ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Send {selectedPlayers.length} Invitation{selectedPlayers.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
