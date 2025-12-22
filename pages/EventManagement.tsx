import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEventById, updateEventRegistrationStatus, getAllTeams, updateEvent, registerTeamForEvent } from '../utils/db';
import { Event, Team, EventStatus } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Trophy, Users, Calendar, MapPin, Loader, AlertTriangle, PlusCircle } from 'lucide-react';
import { EventMatchMaker } from '../components/EventMatchMaker';
import { showToast } from '../components/Toast';

export const EventManagement: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [showMatchMaker, setShowMatchMaker] = useState(false);
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [confirmingEnd, setConfirmingEnd] = useState(false);
    const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);

    useEffect(() => {
        loadEvent();
    }, [eventId]);

    const loadEvent = async (showLoading = true) => {
        if (!eventId) return;
        if (showLoading) setLoading(true);
        try {
            const [ev, teamsData] = await Promise.all([
                getEventById(eventId),
                getAllTeams()
            ]);

            if (ev) {
                setEvent(ev);
            } else {
                showToast('Event not found', 'error');
                navigate('/events');
            }
            setAllTeams(teamsData);
        } catch (error) {
            console.error(error);
            showToast('Failed to load data', 'error');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleStatusUpdate = async (teamId: string, status: 'approved' | 'rejected') => {
        if (!event) return;

        // Optimistic Update
        const updatedTeams = event.registeredTeams?.map(team =>
            team.teamId === teamId ? { ...team, status } : team
        ) || [];

        setEvent({ ...event, registeredTeams: updatedTeams });

        try {
            await updateEventRegistrationStatus(event.id, teamId, status);
            loadEvent(false); // Silent refresh
        } catch (error) {
            console.error('Failed to update status:', error);
            showToast('Failed to update status', 'error');
            loadEvent(true); // Revert on error
        }
    };

    const handleEndEvent = async () => {
        if (!event) return;
        try {
            await updateEvent({ ...event, status: 'ended' });
            showToast('Event marked as ended', 'success');
            setConfirmingEnd(false);
            loadEvent();
        } catch (error) {
            console.error(error);
            showToast('Failed to end event', 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center bg-elkawera-black">
                <Loader className="animate-spin text-elkawera-accent" size={48} />
            </div>
        );
    }

    if (!event) return null;

    // Filter teams
    const pendingTeams = event.registeredTeams?.filter(r => r.status === 'pending') || [];
    const approvedTeams = event.registeredTeams?.filter(r => r.status === 'approved') || [];
    const rejectedTeams = event.registeredTeams?.filter(r => r.status === 'rejected') || [];

    const isAdmin = user?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-elkawera-black text-white">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>Only admins can manage events.</p>
                <button onClick={() => navigate('/events')} className="mt-4 text-elkawera-accent hover:underline">Back to Events</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-elkawera-black to-black text-white px-6 md:px-12">
            <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to All Events
            </button>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 sm:p-8 md:p-10 mb-10 shadow-2xl backdrop-blur-xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-elkawera-accent/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 flex flex-col items-start gap-8">
                    <div className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                            <h1 className="text-4xl xs:text-5xl md:text-6xl font-display font-bold uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-none">
                                {event.title}
                            </h1>
                            <span className={`w-fit px-4 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border shadow-lg ${event.status === 'ongoing' ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-green-500/20' :
                                event.status === 'ended' ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-red-500/20' :
                                    'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-blue-500/20'
                                }`}>
                                {event.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-3 sm:gap-6 text-gray-300">
                            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 text-xs sm:text-sm font-medium">
                                <Calendar size={16} className="text-elkawera-accent" />
                                {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 text-xs sm:text-sm font-medium">
                                <MapPin size={16} className="text-elkawera-accent" />
                                {event.location}
                            </div>
                            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 text-xs sm:text-sm font-medium">
                                <Users size={16} className="text-elkawera-accent" />
                                {event.registeredTeams?.length || 0} Teams
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
                        {event.status === 'ongoing' && (
                            <div className="flex-1 xs:flex-none">
                                {confirmingEnd ? (
                                    <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                        <button
                                            onClick={handleEndEvent}
                                            className="px-4 py-3 bg-red-600 text-white font-bold uppercase text-[10px] sm:text-xs rounded-xl hover:bg-red-700 transition-all shadow-lg"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setConfirmingEnd(false)}
                                            className="px-4 py-3 bg-white/10 text-white font-bold uppercase text-[10px] sm:text-xs rounded-xl hover:bg-white/20 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmingEnd(true)}
                                        className="w-full px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-bold uppercase text-xs sm:text-sm rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 group backdrop-blur-sm animate-in fade-in duration-300"
                                    >
                                        <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                                        End Event
                                    </button>
                                )}
                            </div>
                        )}
                        <button
                            onClick={() => setShowMatchMaker(true)}
                            className="flex-1 xs:flex-none px-6 sm:px-8 py-3 bg-gradient-to-r from-elkawera-accent to-emerald-400 text-black font-bold uppercase text-xs sm:text-sm rounded-xl hover:shadow-[0_0_30px_rgba(0,255,157,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-lg"
                        >
                            <Trophy size={20} className="animate-pulse" />
                            Match Maker
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Pending Column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                <AlertTriangle className="text-yellow-400" size={20} />
                            </div>
                            Pending Requests
                            <span className="text-sm font-sans font-normal text-gray-400 bg-white/5 px-2 py-1 rounded ml-2">
                                {pendingTeams.length}
                            </span>
                        </h2>
                    </div>

                    <div className="min-h-[200px] space-y-4">
                        {pendingTeams.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center text-gray-500">
                                <Users size={48} className="mb-4 opacity-20" />
                                <p>No pending registrations to review.</p>
                            </div>
                        ) : (
                            pendingTeams.map((reg, idx) => (
                                <div key={idx} className="group bg-gradient-to-r from-white/5 to-transparent border border-white/10 p-4 sm:p-5 rounded-2xl hover:border-yellow-500/30 transition-all hover:bg-white/10 flex flex-col xs:flex-row justify-between items-center gap-4 shadow-sm">
                                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-700 to-black border border-white/20 flex items-center justify-center font-bold text-lg sm:text-xl font-display shrink-0">
                                            {reg.teamName.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-yellow-400 transition-colors truncate">{reg.teamName}</h3>
                                            <div className="text-[10px] sm:text-sm text-gray-400 flex items-center gap-2 truncate">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                                Capt. {reg.captainName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 sm:gap-3 w-full xs:w-auto">
                                        <button
                                            onClick={() => handleStatusUpdate(reg.teamId, 'approved')}
                                            className="flex-1 xs:flex-none px-4 sm:px-5 py-2 sm:py-2.5 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 text-xs sm:text-sm"
                                        >
                                            <CheckCircle size={16} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(reg.teamId, 'rejected')}
                                            className="flex-1 xs:flex-none px-4 sm:px-5 py-2 sm:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Approved Column */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-display font-bold uppercase flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                                <CheckCircle className="text-green-400" size={20} />
                            </div>
                            Approved Teams
                            <span className="text-sm font-sans font-normal text-gray-400 bg-white/5 px-2 py-1 rounded ml-2">
                                {approvedTeams.length}
                            </span>
                        </h2>
                        <button
                            onClick={() => setShowAddTeamModal(true)}
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <PlusCircle size={16} /> Add Team
                        </button>
                    </div>

                    <div className="min-h-[200px] h-[500px] overflow-y-auto custom-scrollbar pr-2 space-y-4">
                        {approvedTeams.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center text-gray-500 h-full">
                                <Trophy size={48} className="mb-4 opacity-20" />
                                <p>No teams approved yet.</p>
                            </div>
                        ) : (
                            approvedTeams.map((reg, idx) => (
                                <div key={idx} className="group bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-green-500/30 transition-all flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-900/50 to-black border border-green-500/20 flex items-center justify-center font-bold text-xl font-display text-green-400">
                                            {reg.teamName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-green-400 transition-colors">{reg.teamName}</h3>
                                            <div className="text-sm text-gray-400">
                                                Capt. {reg.captainName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {removingTeamId === reg.teamId ? (
                                            <div className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                                                <button
                                                    onClick={() => { handleStatusUpdate(reg.teamId, 'rejected'); setRemovingTeamId(null); }}
                                                    className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setRemovingTeamId(null)}
                                                    className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setRemovingTeamId(reg.teamId)}
                                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-all animate-in fade-in duration-300"
                                                title="Remove Team"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Match Maker Modal */}
            {showMatchMaker && (
                <EventMatchMaker
                    event={event}
                    onClose={() => setShowMatchMaker(false)}
                    onUpdate={loadEvent}
                />
            )}

            {/* Add Team Modal */}
            {showAddTeamModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-elkawera-dark border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold uppercase">Add Team to Event</h3>
                            <button onClick={() => setShowAddTeamModal(false)} className="text-gray-400 hover:text-white">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {allTeams
                                .filter(t => !event.registeredTeams?.some(r => r.teamId === t.id))
                                .map(team => (
                                    <button
                                        key={team.id}
                                        onClick={async () => {
                                            try {
                                                await registerTeamForEvent(event.id, {
                                                    teamId: team.id,
                                                    teamName: team.name,
                                                    captainId: team.captainId,
                                                    captainName: team.captainName || 'Unknown'
                                                });
                                                await updateEventRegistrationStatus(event.id, team.id, 'approved');
                                                showToast(`${team.name} added to event`, 'success');
                                                loadEvent();
                                                setShowAddTeamModal(false);
                                            } catch (e) {
                                                console.error(e);
                                                showToast('Failed to add team', 'error');
                                            }
                                        }}
                                        className="w-full bg-white/5 hover:bg-elkawera-accent/20 border border-white/5 hover:border-elkawera-accent/50 p-4 rounded-xl flex items-center justify-between group transition-all"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-white group-hover:text-elkawera-accent">{team.name}</div>
                                            <div className="text-xs text-gray-400">Capt. {team.captainName || 'Unknown'}</div>
                                        </div>
                                        <PlusCircle size={20} className="text-gray-500 group-hover:text-elkawera-accent" />
                                    </button>
                                ))}
                            {allTeams.filter(t => !event.registeredTeams?.some(r => r.teamId === t.id)).length === 0 && (
                                <p className="text-center text-gray-500 py-4">No available teams to add.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
