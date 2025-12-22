import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllMatches, getMatchesByStatus, saveMatch, getAllTeams, getPlayersByTeamId, subscribeToChanges, getAllMatchRequests, updateMatchRequestStatus, deleteMatch } from '../utils/db';
import { Match, Team, Player, MatchRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, PlayCircle, StopCircle, Trophy, Users, Clock, CheckCircle, XCircle, Inbox, ThumbsUp, ThumbsDown, Trash2, Eye, X, Check } from 'lucide-react';
import { showToast } from '../components/Toast';

export const AdminMatches: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<Match[]>([]);
    const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Only admins can access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const loadMatches = async () => {
        try {
            const allMatches = await getAllMatches();
            // Sort by status: running first, then awaiting confirmation, then finished
            const sorted = allMatches.sort((a, b) => {
                const statusOrder = { running: 0, awaiting_confirmation: 1, finished: 2 };
                return statusOrder[a.status] - statusOrder[b.status];
            });
            setMatches(sorted);

            const requests = await getAllMatchRequests();
            setMatchRequests(requests.filter(r => r.status === 'pending_admin'));

            setLoading(false);
        } catch (error) {
            console.error('Error loading matches:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMatches();
        getAllTeams().then(setTeams);

        // Subscribe to real-time updates
        const unsubscribe = subscribeToChanges(() => {
            loadMatches();
        });

        return () => unsubscribe();
    }, []);

    const runningMatches = matches.filter(m => m.status === 'running');
    const awaitingMatches = matches.filter(m => m.status === 'awaiting_confirmation');
    const finishedMatches = matches.filter(m => m.status === 'finished');

    if (loading) {
        return <div className="text-center py-20">Loading matches...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Match Management</h1>
                    <p className="text-gray-400 mt-1">Create and manage multiple matches simultaneously</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                >
                    <PlusCircle size={20} />
                    Create New Match
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase text-green-400 font-bold mb-1">Running Now</p>
                            <p className="text-4xl font-display font-bold text-white">{runningMatches.length}</p>
                        </div>
                        <PlayCircle className="text-green-400" size={40} />
                    </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase text-yellow-400 font-bold mb-1">Awaiting Confirmation</p>
                            <p className="text-4xl font-display font-bold text-white">{awaitingMatches.length}</p>
                        </div>
                        <Clock className="text-yellow-400" size={40} />
                    </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase text-blue-400 font-bold mb-1">Completed</p>
                            <p className="text-4xl font-display font-bold text-white">{finishedMatches.length}</p>
                        </div>
                        <CheckCircle className="text-blue-400" size={40} />
                    </div>
                </div>
            </div>

            {/* Pending Requests */}
            {matchRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2 text-elkawera-accent">
                        <Inbox size={24} />
                        Pending Requests
                    </h2>
                    <div className="grid gap-4">
                        {matchRequests.map(req => (
                            <MatchRequestCard key={req.id} request={req} onUpdate={loadMatches} />
                        ))}
                    </div>
                </div>
            )}

            {/* Running Matches */}
            {runningMatches.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                        <PlayCircle className="text-green-400" size={24} />
                        Running Matches
                    </h2>
                    <div className="grid gap-4">
                        {runningMatches.map(match => (
                            <MatchCard key={match.id} match={match} teams={teams} onUpdate={loadMatches} />
                        ))}
                    </div>
                </div>
            )}

            {/* Awaiting Confirmation */}
            {awaitingMatches.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                        <Clock className="text-yellow-400" size={24} />
                        Awaiting Confirmation
                    </h2>
                    <div className="grid gap-4">
                        {awaitingMatches.map(match => (
                            <MatchCard key={match.id} match={match} teams={teams} onUpdate={loadMatches} />
                        ))}
                    </div>
                </div>
            )}

            {/* Finished Matches */}
            {finishedMatches.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                        <Trophy className="text-blue-400" size={24} />
                        Completed Matches
                    </h2>
                    <div className="grid gap-4">
                        {finishedMatches.map(match => (
                            <MatchCard key={match.id} match={match} teams={teams} onUpdate={loadMatches} />
                        ))}
                    </div>
                </div>
            )}

            {matches.length === 0 && (
                <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Trophy size={64} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Matches Yet</h3>
                    <p className="text-gray-400 mb-6">Create your first match to get started</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all"
                    >
                        <PlusCircle size={20} />
                        Create Match
                    </button>
                </div>
            )}

            {/* Create Match Modal */}
            {showCreateModal && (
                <CreateMatchModal
                    teams={teams}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        loadMatches();
                    }}
                />
            )}
        </div>
    );
};

// Match Request Card Component
const MatchRequestCard: React.FC<{ request: MatchRequest; onUpdate: () => void }> = ({ request, onUpdate }) => {
    const [processing, setProcessing] = useState(false);
    const [confirmingApprove, setConfirmingApprove] = useState(false);
    const [confirmingReject, setConfirmingReject] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (status === 'rejected' && !rejectReason.trim()) {
            showToast('Please provide a reason', 'error');
            return;
        }

        setProcessing(true);
        try {
            if (status === 'rejected') {
                await updateMatchRequestStatus(request.id, 'rejected', rejectReason);
                showToast('Match request rejected', 'info');
            } else {
                await updateMatchRequestStatus(request.id, 'approved');
                showToast('Match request approved and started!', 'success');
            }
            onUpdate();
        } catch (error) {
            console.error(error);
            showToast('Failed to update match request', 'error');
        } finally {
            setProcessing(false);
            setConfirmingApprove(false);
            setConfirmingReject(false);
        }
    };

    return (
        <div className="bg-white/5 border border-elkawera-accent/30 rounded-2xl p-6 hover:border-elkawera-accent transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-elkawera-accent/20 text-elkawera-accent rounded-full text-xs font-bold uppercase flex items-center gap-1">
                        <Inbox size={12} /> Request
                    </span>
                    <span className="text-xs text-gray-500 font-mono">From: {request.requestedByName}</span>
                </div>
                <div className="text-xs text-gray-400">
                    {new Date(request.createdAt).toLocaleString()}
                </div>
            </div>

            <div className="flex items-center justify-between mb-6">
                <div className="flex-1 text-center">
                    <div className="font-bold text-xl text-white">{request.homeTeamName}</div>
                </div>
                <div className="px-8">
                    <div className="text-2xl font-display font-bold text-white/20">VS</div>
                </div>
                <div className="flex-1 text-center">
                    <div className="font-bold text-xl text-white">{request.awayTeamName}</div>
                </div>
            </div>

            <div className="flex flex-col gap-3 justify-end border-t border-white/10 pt-4">
                {!confirmingApprove && !confirmingReject && (
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setConfirmingReject(true)}
                            disabled={processing}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            <ThumbsDown size={16} /> Reject
                        </button>
                        <button
                            onClick={() => setConfirmingApprove(true)}
                            disabled={processing}
                            className="flex items-center gap-2 px-4 py-2 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold text-sm disabled:opacity-50"
                        >
                            <ThumbsUp size={16} /> Approve & Start
                        </button>
                    </div>
                )}

                {confirmingApprove && (
                    <div className="bg-elkawera-accent/10 border border-elkawera-accent/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                        <p className="text-sm font-bold text-elkawera-accent mb-3">Approve this match request? It will start immediately.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction('approved')}
                                disabled={processing}
                                className="px-6 py-2 bg-elkawera-accent text-black font-bold rounded-lg hover:bg-white transition-all text-xs"
                            >
                                {processing ? 'Starting...' : 'Confirm & Start'}
                            </button>
                            <button
                                onClick={() => setConfirmingApprove(false)}
                                className="px-6 py-2 bg-white/5 text-white font-bold rounded-lg text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {confirmingReject && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-in slide-in-from-top-2">
                        <p className="text-sm font-bold text-red-500 mb-3">Reason for rejection:</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full bg-black/40 border border-red-500/30 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500 mb-3"
                            placeholder="Type reason..."
                            rows={2}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction('rejected')}
                                disabled={processing}
                                className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all text-xs"
                            >
                                Confirm Reject
                            </button>
                            <button
                                onClick={() => { setConfirmingReject(false); setRejectReason(''); }}
                                className="px-6 py-2 bg-white/5 text-white font-bold rounded-lg text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Match Card Component
const MatchCard: React.FC<{ match: Match; teams: Team[]; onUpdate: () => void }> = ({ match, teams, onUpdate }) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);

    const handleEndMatch = () => {
        navigate(`/admin/end-match/${match.id}`);
    };

    const handleDeleteMatch = async () => {
        try {
            await deleteMatch(match.id);
            setShowDeleteConfirm(false);
            onUpdate();
            showToast('Match deleted', 'info');
        } catch (error) {
            console.error('Error deleting match:', error);
            showToast('Failed to delete match', 'error');
        }
    };

    const getStatusBadge = () => {
        switch (match.status) {
            case 'running':
                return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold uppercase flex items-center gap-1"><PlayCircle size={12} /> Live</span>;
            case 'awaiting_confirmation':
                return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase flex items-center gap-1"><Clock size={12} /> Pending</span>;
            case 'finished':
                return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase flex items-center gap-1"><CheckCircle size={12} /> Finished</span>;
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-elkawera-accent/50 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {getStatusBadge()}
                    <span className="text-xs text-gray-500 font-mono">ID: {match.id.slice(0, 8)}</span>
                </div>
                {(match.status === 'running' || match.status === 'awaiting_confirmation') && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleEndMatch}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold text-sm"
                        >
                            <StopCircle size={16} />
                            End Match
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold text-sm"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                )}
                {match.status === 'finished' && (
                    <button
                        onClick={() => navigate(`/admin/match-details/${match.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-bold text-sm"
                    >
                        <Eye size={16} />
                        View Stats
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex-1 text-center">
                    <div className="text-sm text-gray-400 mb-2">HOME</div>
                    <div className="font-bold text-xl text-white">{homeTeam?.name || 'Unknown'}</div>
                    {match.status !== 'running' && (
                        <div className="text-4xl font-display font-bold text-elkawera-accent mt-2">{match.homeScore}</div>
                    )}
                </div>

                {/* VS */}
                <div className="px-8">
                    <div className="text-2xl font-display font-bold text-white/20">VS</div>
                </div>

                {/* Away Team */}
                <div className="flex-1 text-center">
                    <div className="text-sm text-gray-400 mb-2">AWAY</div>
                    <div className="font-bold text-xl text-white">{awayTeam?.name || 'Unknown'}</div>
                    {match.status !== 'running' && (
                        <div className="text-4xl font-display font-bold text-elkawera-accent mt-2">{match.awayScore}</div>
                    )}
                </div>
            </div>

            {/* Match Info */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <Users size={12} />
                        {match.homePlayerIds.length + match.awayPlayerIds.length} Players
                    </span>
                    <span>Created {new Date(match.createdAt).toLocaleDateString()}</span>
                </div>
                {match.manOfTheMatch && (
                    <span className="text-yellow-400 flex items-center gap-1">
                        <Trophy size={12} />
                        MVP Selected
                    </span>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-elkawera-dark border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Active Match?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete this active match? This action cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-2 bg-white/10 rounded hover:bg-white/20 transition-colors font-bold text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMatch}
                                className="flex-1 py-2 bg-red-500 hover:bg-red-600 transition-colors font-bold text-white rounded"
                            >
                                Delete Match
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Create Match Modal Component
const CreateMatchModal: React.FC<{
    teams: Team[];
    onClose: () => void;
    onCreated: () => void;
}> = ({ teams, onClose, onCreated }) => {
    const { user } = useAuth();
    const [homeTeamId, setHomeTeamId] = useState('');
    const [awayTeamId, setAwayTeamId] = useState('');
    const [homePlayers, setHomePlayers] = useState<Player[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
    const [selectedHomePlayers, setSelectedHomePlayers] = useState<string[]>([]);
    const [selectedAwayPlayers, setSelectedAwayPlayers] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (homeTeamId) {
            getPlayersByTeamId(homeTeamId).then(setHomePlayers);
        } else {
            setHomePlayers([]);
        }
    }, [homeTeamId]);

    useEffect(() => {
        if (awayTeamId) {
            getPlayersByTeamId(awayTeamId).then(setAwayPlayers);
        } else {
            setAwayPlayers([]);
        }
    }, [awayTeamId]);

    const handleCreate = async () => {
        if (!homeTeamId || !awayTeamId || selectedHomePlayers.length === 0 || selectedAwayPlayers.length === 0) {
            showToast('Please select both teams and at least one player from each team', 'error');
            return;
        }

        if (homeTeamId === awayTeamId) {
            showToast('Home and away teams must be different', 'error');
            return;
        }

        setCreating(true);

        try {
            const newMatch: Match = {
                id: uuidv4(),
                homeTeamId,
                awayTeamId,
                homeScore: 0,
                awayScore: 0,
                status: 'running',
                homePlayerIds: selectedHomePlayers,
                awayPlayerIds: selectedAwayPlayers,
                events: [],
                createdAt: Date.now(),
                startedAt: Date.now(),
                isExternal: false,
                createdBy: user?.id || '',
            };

            await saveMatch(newMatch);
            showToast('Match created and started!', 'success');
            onCreated();
        } catch (error) {
            console.error('Error creating match:', error);
            showToast('Failed to create match', 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-display font-bold uppercase">Create New Match</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Home Team */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-elkawera-accent">Home Team</h3>
                            <select
                                value={homeTeamId}
                                onChange={(e) => {
                                    setHomeTeamId(e.target.value);
                                    setSelectedHomePlayers([]);
                                }}
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none"
                            >
                                <option value="">Select Home Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>

                            {homePlayers.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-400">Select Players ({selectedHomePlayers.length} selected)</p>
                                    <div className="max-h-64 overflow-y-auto space-y-2 bg-black/30 rounded-lg p-3">
                                        {homePlayers.map(player => (
                                            <label key={player.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedHomePlayers.includes(player.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedHomePlayers([...selectedHomePlayers, player.id]);
                                                        } else {
                                                            setSelectedHomePlayers(selectedHomePlayers.filter(id => id !== player.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{player.name} ({player.position})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Away Team */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-elkawera-accent">Away Team</h3>
                            <select
                                value={awayTeamId}
                                onChange={(e) => {
                                    setAwayTeamId(e.target.value);
                                    setSelectedAwayPlayers([]);
                                }}
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none"
                            >
                                <option value="">Select Away Team</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                            </select>

                            {awayPlayers.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-400">Select Players ({selectedAwayPlayers.length} selected)</p>
                                    <div className="max-h-64 overflow-y-auto space-y-2 bg-black/30 rounded-lg p-3">
                                        {awayPlayers.map(player => (
                                            <label key={player.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAwayPlayers.includes(player.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedAwayPlayers([...selectedAwayPlayers, player.id]);
                                                        } else {
                                                            setSelectedAwayPlayers(selectedAwayPlayers.filter(id => id !== player.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">{player.name} ({player.position})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                            disabled={creating || !homeTeamId || !awayTeamId || selectedHomePlayers.length === 0 || selectedAwayPlayers.length === 0}
                            className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {creating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <PlayCircle size={20} />
                                    Start Match
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
