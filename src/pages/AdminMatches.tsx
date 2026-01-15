import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getAllMatches, getMatchesByStatus, saveMatch, getAllTeams, getPlayersByTeamId, subscribeToChanges, getAllMatchRequests, updateMatchRequestStatus, deleteMatch, getEventById, getAllEvents } from '@/utils/db';
import { Match, Team, Player, MatchRequest, Event } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, PlayCircle, StopCircle, Trophy, Users, Clock, CheckCircle, XCircle, Inbox, ThumbsUp, ThumbsDown, Trash2, Eye, X, Check, Calendar, MapPin, Sparkles } from 'lucide-react';
import { showToast } from '@/components/Toast';

export const AdminMatches: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<Match[]>([]);
    const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'regular' | 'events'>('regular');

    // Only admins can access
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const loadMatches = async () => {
        try {
            const allMatches = await getAllMatches();
            // Sort by status priority and date
            const sorted = allMatches.sort((a, b) => {
                // 1. Status Priority
                const statusOrder: Record<string, number> = {
                    running: 0,
                    scheduled: 1,
                    awaiting_confirmation: 2,
                    finished: 3,
                    cancelled: 4
                };

                const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
                if (statusDiff !== 0) return statusDiff;

                // 2. Date Sorting within status
                if (a.status === 'finished') {
                    // Newest finished first (fallback to createdAt)
                    const dateA = a.finishedAt || a.createdAt || 0;
                    const dateB = b.finishedAt || b.createdAt || 0;
                    return dateB - dateA;
                } else if (a.status === 'scheduled') {
                    // Soonest scheduled first (using createdAt as proxy if date not distinct)
                    return (a.createdAt || 0) - (b.createdAt || 0);
                }

                // For running/others: Newest created first
                return b.createdAt - a.createdAt;
            });
            setMatches(sorted);

            const requests = await getAllMatchRequests();
            setMatchRequests(requests.filter(r => r.status === 'pending_admin'));

            const allEvents = await getAllEvents();
            setEvents(allEvents);

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

    const regularMatchesList = matches.filter(m => !m.eventId);
    const eventMatchesList = matches.filter(m => !!m.eventId);

    const filterMatches = (list: Match[]) => {
        return {
            running: list.filter(m => m.status === 'running'),
            scheduled: list.filter(m => m.status === 'scheduled'),
            awaiting: list.filter(m => m.status === 'awaiting_confirmation'),
            finished: list.filter(m => m.status === 'finished')
        };
    };

    const displayMatches = filterMatches(activeTab === 'regular' ? regularMatchesList : eventMatchesList);

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

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`pb-3 px-4 font-bold uppercase tracking-wide transition-all ${activeTab === 'regular' ? 'text-elkawera-accent border-b-2 border-elkawera-accent' : 'text-gray-400 hover:text-white'}`}
                >
                    Regular Matches
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`pb-3 px-4 font-bold uppercase tracking-wide transition-all ${activeTab === 'events' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
                >
                    Event Matches
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase text-green-400 font-bold mb-1">Running Now</p>
                            <p className="text-4xl font-display font-bold text-white">{displayMatches.running.length}</p>
                        </div>
                        <PlayCircle className="text-green-400" size={40} />
                    </div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase text-purple-400 font-bold mb-1">Scheduled</p>
                            <p className="text-4xl font-display font-bold text-white">{displayMatches.scheduled.length}</p>
                        </div>
                        <Calendar className="text-purple-400" size={40} />
                    </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase text-yellow-400 font-bold mb-1">Awaiting</p>
                            <p className="text-4xl font-display font-bold text-white">{displayMatches.awaiting.length}</p>
                        </div>
                        <Clock className="text-yellow-400" size={40} />
                    </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase text-blue-400 font-bold mb-1">Completed</p>
                            <p className="text-4xl font-display font-bold text-white">{displayMatches.finished.length}</p>
                        </div>
                        <CheckCircle className="text-blue-400" size={40} />
                    </div>
                </div>
            </div>

            {/* Regular Matches View */}
            {activeTab === 'regular' && (
                <>
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

                    {displayMatches.running.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                                <PlayCircle className="text-green-400" size={24} />
                                Running Matches
                            </h2>
                            <div className="grid gap-4">
                                {displayMatches.running.map(match => (
                                    <MatchCard key={match.id} match={match} teams={teams} onUpdate={loadMatches} />
                                ))}
                            </div>
                        </div>
                    )}

                    {displayMatches.scheduled.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                                <Calendar className="text-purple-400" size={24} />
                                Scheduled Matches
                            </h2>
                            <div className="grid gap-4">
                                {displayMatches.scheduled.map(match => (
                                    <MatchCard key={match.id} match={match} teams={teams} onUpdate={loadMatches} />
                                ))}
                            </div>
                        </div>
                    )}

                    {displayMatches.awaiting.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                                <Clock className="text-yellow-400" size={24} />
                                Awaiting Confirmation
                            </h2>
                            <div className="grid gap-4">
                                {displayMatches.awaiting.map(match => (
                                    <MatchCard key={match.id} match={match} teams={teams} onUpdate={loadMatches} />
                                ))}
                            </div>
                        </div>
                    )}

                    {displayMatches.finished.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-2">
                                <Trophy className="text-blue-400" size={24} />
                                Completed Matches
                            </h2>
                            <div className="grid gap-4">
                                {displayMatches.finished.map(match => (
                                    <MatchCard key={match.id} match={match} teams={teams} onUpdate={loadMatches} />
                                ))}
                            </div>
                        </div>
                    )}

                    {regularMatchesList.length === 0 && (
                        <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Trophy size={64} className="mx-auto text-gray-600 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">No Regular Matches</h3>
                            <p className="text-gray-400 mb-6">Create a match or check event matches</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all"
                            >
                                <PlusCircle size={20} />
                                Create Match
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Event Matches View - Grouped by Event */}
            {activeTab === 'events' && (
                <div className="space-y-12">
                    {events.map(event => {
                        const eventMatches = matches.filter(m => m.eventId === event.id);
                        if (eventMatches.length === 0) return null;

                        const eventRunning = eventMatches.filter(m => m.status === 'running');
                        const eventScheduled = eventMatches.filter(m => m.status === 'scheduled');
                        const eventFinished = eventMatches.filter(m => m.status === 'finished');
                        const eventOther = eventMatches.filter(m => m.status !== 'running' && m.status !== 'scheduled' && m.status !== 'finished');

                        return (
                            <div key={event.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
                                {/* Event Header */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6 gap-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold uppercase rounded-full shadow-lg shadow-purple-500/20">
                                                {event.category}
                                            </span>
                                            <span className="text-gray-400 text-sm flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(event.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-display font-bold text-white uppercase tracking-tight">{event.title}</h2>
                                        <div className="flex items-center gap-2 text-gray-400 mt-1">
                                            <MapPin size={14} />
                                            {event.location}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-white">{eventMatches.length}</div>
                                            <div className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Total Matches</div>
                                        </div>
                                        {eventRunning.length > 0 && (
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-elkawera-accent animate-pulse">{eventRunning.length}</div>
                                                <div className="text-[10px] uppercase text-elkawera-accent font-bold tracking-widest">Live</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Event Sections */}
                                <div className="space-y-8">
                                    {eventRunning.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-green-400 uppercase mb-4 flex items-center gap-2">
                                                <PlayCircle size={20} /> Handling Now ({eventRunning.length})
                                            </h3>
                                            <div className="grid gap-4">
                                                {eventRunning.map(m => (
                                                    <MatchCard key={m.id} match={m} teams={teams} onUpdate={loadMatches} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {eventScheduled.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-purple-400 uppercase mb-4 flex items-center gap-2">
                                                <Calendar size={20} /> Upcoming ({eventScheduled.length})
                                            </h3>
                                            <div className="grid gap-4">
                                                {eventScheduled.map(m => (
                                                    <MatchCard key={m.id} match={m} teams={teams} onUpdate={loadMatches} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {eventFinished.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-blue-400 uppercase mb-4 flex items-center gap-2">
                                                <Trophy size={20} /> Completed ({eventFinished.length})
                                            </h3>
                                            <div className="grid gap-4">
                                                {eventFinished.map(m => (
                                                    <MatchCard key={m.id} match={m} teams={teams} onUpdate={loadMatches} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {eventOther.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                                <Clock size={20} /> Other ({eventOther.length})
                                            </h3>
                                            <div className="grid gap-4">
                                                {eventOther.map(m => (
                                                    <MatchCard key={m.id} match={m} teams={teams} onUpdate={loadMatches} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {events.every(e => matches.filter(m => m.eventId === e.id).length === 0) && (
                        <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <Sparkles size={64} className="mx-auto text-gray-600 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">No Event Matches</h3>
                            <p className="text-gray-400 mb-6">Create events and generate matches in the Event section.</p>
                        </div>
                    )}
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
    const [eventInfo, setEventInfo] = useState<Event | null>(null);
    const homeTeam = teams.find(t => t.id === match.homeTeamId);
    const awayTeam = teams.find(t => t.id === match.awayTeamId);

    // Load event info if this is an event match
    useEffect(() => {
        if (match.eventId) {
            getEventById(match.eventId).then(event => {
                if (event) setEventInfo(event);
            });
        }
    }, [match.eventId]);

    const handleEndMatch = () => {
        navigate(`/admin/end-match/${match.id}`);
    };

    const handleStartMatch = async () => {
        try {
            const updatedMatch: Match = {
                ...match,
                status: 'running',
                startedAt: Date.now()
            };
            await saveMatch(updatedMatch);
            showToast('Match started!', 'success');
            onUpdate();
        } catch (error) {
            console.error('Error starting match:', error);
            showToast('Failed to start match', 'error');
        }
    };

    const handleCancelMatch = async () => {
        // Here we can either delete or set to cancelled. 
        // Setting to cancelled is safer for records.
        try {
            const updatedMatch: Match = {
                ...match,
                status: 'cancelled'
            };
            await saveMatch(updatedMatch);
            showToast('Match cancelled', 'info');
            onUpdate();
        } catch (error) {
            console.error('Error cancelling match:', error);
            showToast('Failed to cancel match', 'error');
        }
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
            case 'scheduled':
                return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold uppercase flex items-center gap-1"><Calendar size={12} /> Scheduled</span>;
            case 'awaiting_confirmation':
                return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase flex items-center gap-1"><Clock size={12} /> Pending</span>;
            case 'finished':
                return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase flex items-center gap-1"><CheckCircle size={12} /> Finished</span>;
            case 'cancelled':
                return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold uppercase flex items-center gap-1"><XCircle size={12} /> Cancelled</span>;
        }
    };

    // Special styling for Event Matches
    const isEventMatch = !!match.eventId;
    const cardStyle = isEventMatch
        ? "bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/50 hover:border-purple-400"
        : "bg-white/5 border border-white/10 hover:border-elkawera-accent/50";

    return (
        <div className={`rounded-2xl p-6 transition-all ${cardStyle}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {getStatusBadge()}
                    {isEventMatch && (
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold uppercase shadow-lg shadow-purple-500/20 border border-white/20">
                            Event Match
                        </span>
                    )}
                    <span className="text-xs text-gray-500 font-mono">ID: {match.id.slice(0, 8)}</span>
                </div>

                <div className="flex gap-2">
                    {match.status === 'scheduled' && (
                        <>
                            <button
                                onClick={handleStartMatch}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-white transition-colors font-bold text-sm"
                            >
                                <PlayCircle size={16} />
                                Start Match
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold text-sm"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </>
                    )}

                    {(match.status === 'running' || match.status === 'awaiting_confirmation') && (
                        <>
                            <button
                                onClick={handleEndMatch}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-bold text-sm"
                            >
                                <StopCircle size={16} />
                                End Match
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors font-bold text-sm"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}

                    {(match.status === 'finished' || match.status === 'cancelled') && (
                        <>
                            {match.status === 'finished' && (
                                <button
                                    onClick={() => navigate(`/admin/match-details/${match.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-bold text-sm"
                                >
                                    <Eye size={16} />
                                    View Stats
                                </button>
                            )}
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors font-bold text-sm"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex-1 text-center">
                    <div className="text-sm text-gray-400 mb-2">HOME</div>
                    <div className="font-bold text-xl text-white">{homeTeam?.name || 'Unknown'}</div>
                    {match.status !== 'running' && match.status !== 'scheduled' && (
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
                    {match.status !== 'running' && match.status !== 'scheduled' && (
                        <div className="text-4xl font-display font-bold text-elkawera-accent mt-2">{match.awayScore}</div>
                    )}
                </div>
            </div>

            {/* Event Match Information */}
            {isEventMatch && eventInfo && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="text-purple-400" size={16} />
                        <h4 className="font-bold text-purple-300 uppercase text-sm">Event Details</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <p className="text-gray-400 mb-1">Event Name</p>
                            <p className="text-white font-semibold">{eventInfo.title}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Category</p>
                            <p className="text-white font-semibold capitalize">{eventInfo.category}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Event Date</p>
                            <p className="text-white font-semibold">{new Date(eventInfo.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 mb-1">Location</p>
                            <p className="text-white font-semibold">{eventInfo.location}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Scheduled Match Information */}
            {match.status === 'scheduled' && (match.scheduledTime || match.location) && (
                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-purple-400" size={16} />
                        <h4 className="font-bold text-purple-300 uppercase text-sm">Match Schedule</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        {match.scheduledTime && (
                            <div>
                                <p className="text-gray-400 mb-1">Scheduled Time</p>
                                <p className="text-white font-semibold">
                                    {new Date(match.scheduledTime).toLocaleString()}
                                </p>
                            </div>
                        )}
                        {match.location && (
                            <div>
                                <p className="text-gray-400 mb-1">Location</p>
                                <p className="text-white font-semibold flex items-center gap-1">
                                    <MapPin size={12} />
                                    {match.location}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
            {
                showDeleteConfirm && createPortal(
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-elkawera-dark border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
                            <h3 className="text-xl font-bold text-white mb-2">Delete Match?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete this match? This action cannot be undone.
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
                    , document.body)
            }
        </div >
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

    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    // ... items ...

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
            const scheduledTimestamp = (scheduledDate && scheduledTime)
                ? new Date(`${scheduledDate}T${scheduledTime}`).getTime()
                : undefined;

            const newMatch: Match = {
                id: uuidv4(),
                homeTeamId,
                awayTeamId,
                homeScore: 0,
                awayScore: 0,
                status: 'scheduled', // Start as scheduled
                homePlayerIds: selectedHomePlayers,
                awayPlayerIds: selectedAwayPlayers,
                events: [],
                createdAt: Date.now(),
                scheduledTime: scheduledTimestamp,
                isExternal: false,
                createdBy: user?.id || '',
            };

            await saveMatch(newMatch);
            showToast('Match scheduled successfully!', 'success');
            onCreated();
        } catch (error) {
            console.error('Error creating match:', error);
            showToast('Failed to create match', 'error');
        } finally {
            setCreating(false);
        }
    };

    return createPortal(
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

                    {/* Schedule Section */}
                    <div className="mt-6 border-t border-white/10 pt-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-elkawera-accent" />
                            Schedule (Optional)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Date</label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:border-elkawera-accent focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Time</label>
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:border-elkawera-accent focus:outline-none"
                                />
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
                                    <Calendar size={20} />
                                    Schedule Match
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

