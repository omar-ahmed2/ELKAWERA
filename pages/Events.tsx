import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllEvents, saveEvent, updateEvent, deleteEvent, subscribeToChanges, registerTeamForEvent, getAllTeams, updateEventRegistrationStatus, notifyAllUsers, getUserNotifications } from '../utils/db';
import { Event, EventStatus, EventCategory, Team } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
    Calendar, MapPin, Clock, PlusCircle, Edit3, Trash2,
    XCircle, CheckCircle, Trophy, Users, Star, Info, Bell
} from 'lucide-react';
import { EventMatchMaker } from '../components/EventMatchMaker';

export const Events: React.FC = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showMatchMaker, setShowMatchMaker] = useState(false);
    const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
    const lastCheckRef = React.useRef<number>(Date.now());

    const isAdmin = user?.role === 'admin';

    const checkNotifications = async () => {
        if (!user) return;
        const notifs = await getUserNotifications(user.id);
        const latest = notifs[0]; // sorted by desc createdAt in db.ts
        if (latest && latest.createdAt > lastCheckRef.current) {
            setToast({ title: latest.title, message: latest.message });
            lastCheckRef.current = latest.createdAt;
            setTimeout(() => setToast(null), 5000);
        }
    };

    const loadEvents = async () => {
        try {
            const allEvents = await getAllEvents();
            const sorted = allEvents.sort((a, b) => {
                const now = Date.now();
                const aIsFuture = a.date > now;
                const bIsFuture = b.date > now;
                if (aIsFuture && bIsFuture) return a.date - b.date;
                if (!aIsFuture && !bIsFuture) return b.date - a.date;
                return aIsFuture ? -1 : 1;
            });
            setEvents(sorted);
            setLoading(false);
        } catch (error) {
            console.error('Error loading events:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
        // Initial check to set watermark
        // checkNotifications(); // Don't show toast on load
        const unsubscribe = subscribeToChanges(() => {
            loadEvents();
            checkNotifications();
        });
        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            await deleteEvent(id);
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event');
        }
    };

    const handleEdit = (e: React.MouseEvent, event: Event) => {
        e.stopPropagation();
        setEditingEvent(event);
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingEvent(null);
        setShowModal(true);
    };

    const getStatusColor = (status: EventStatus) => {
        switch (status) {
            case 'upcoming': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'ongoing': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const getCategoryIcon = (category: EventCategory) => {
        switch (category) {
            case 'match': return <Trophy size={18} />;
            case 'tournament': return <Star size={18} />;
            case 'training': return <Users size={18} />;
            default: return <Info size={18} />;
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-elkawera-accent animate-pulse">Loading Events...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-5xl font-display font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                        League Events
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Stay updated with the latest tournaments, matches, and community gatherings.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                    >
                        <PlusCircle size={20} />
                        Add New Event
                    </button>
                )}
            </div>

            {/* Events Grid */}
            {events.length === 0 ? (
                <div className="text-center py-32 space-y-6 animate-fade-in-up">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                        <div className="absolute inset-0 bg-elkawera-accent/20 rounded-full animate-ping"></div>
                        <Calendar size={48} className="text-elkawera-accent relative z-10" />
                    </div>
                    <h2 className="text-4xl font-display font-bold text-white">No events yet... stay tuned!</h2>
                    <p className="text-xl text-gray-400 italic">Big things are coming. Get ready, champions!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-elkawera-accent/50 transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col h-full transform hover:-translate-y-1 duration-300 cursor-pointer"
                        >
                            {/* Event Image / Placeholder */}
                            <div className="h-48 bg-black/50 relative overflow-hidden">
                                {event.imageUrl ? (
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                                        <Trophy size={64} className="text-white/10" />
                                    </div>
                                )}
                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase border backdrop-blur-md ${getStatusColor(event.status)}`}>
                                    {event.status}
                                </div>
                                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold uppercase flex items-center gap-1 border border-white/10 text-white">
                                    {getCategoryIcon(event.category)}
                                    {event.category}
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-elkawera-accent transition-colors">{event.title}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-3">{event.description}</p>
                                </div>

                                <div className="mt-auto space-y-3 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <Calendar size={16} className="text-elkawera-accent" />
                                        <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <Clock size={16} className="text-elkawera-accent" />
                                        <span>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <MapPin size={16} className="text-elkawera-accent" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
                                        <button
                                            onClick={(e) => handleEdit(e, event)}
                                            className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit3 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, event.id)}
                                            className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer Message */}
            {events.length > 0 && (
                <div className="text-center pt-12 pb-6 border-t border-white/5">
                    <p className="text-gray-500 uppercase tracking-widest text-sm font-bold animate-pulse">More events coming soon...</p>
                </div>
            )}

            {/* Add/Edit Event Modal */}
            {showModal && (
                <EventFormModal
                    event={editingEvent}
                    onClose={() => setShowModal(false)}
                    onSave={() => {
                        setShowModal(false);
                        loadEvents();
                    }}
                />
            )}

            {/* Event Detail Modal (Preview) */}
            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onRegister={() => {
                        loadEvents(); // Refresh to show updated registration status
                    }}
                    onManageMatches={() => setShowMatchMaker(true)}
                />
            )}

            {/* Notification Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 bg-elkawera-accent text-black px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.4)] animate-slide-in-right border border-black/10 flex items-start gap-4">
                    <Bell size={24} className="mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-lg leading-tight uppercase">{toast.title}</h4>
                        <p className="font-medium opacity-80 mt-1">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="ml-2 hover:bg-black/10 rounded-full p-1"><XCircle size={18} /></button>
                </div>
            )}

            {/* Match Maker Modal */}
            {showMatchMaker && selectedEvent && (
                <EventMatchMaker
                    event={selectedEvent}
                    onClose={() => setShowMatchMaker(false)}
                    onUpdate={() => {
                        loadEvents();
                    }}
                />
            )}
        </div>
    );
};

const EventDetailModal: React.FC<{
    event: Event;
    onClose: () => void;
    onRegister: () => void;
    onManageMatches?: () => void;
}> = ({ event, onClose, onRegister, onManageMatches }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [captainTeam, setCaptainTeam] = useState<Team | null>(null);
    const [registering, setRegistering] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            if (user?.role === 'captain') {
                const teams = await getAllTeams();
                const myTeam = teams.find(t => t.captainId === user.id);
                setCaptainTeam(myTeam || null);
            }
        };
        fetchTeam();
    }, [user]);

    const isRegistered = captainTeam && event.registeredTeams?.some(t => t.teamId === captainTeam.id);
    const isAdmin = user?.role === 'admin';

    const handleRegister = async () => {
        if (!captainTeam) return;
        setRegistering(true);
        try {
            await registerTeamForEvent(event.id, {
                teamId: captainTeam.id,
                teamName: captainTeam.name,
                captainId: user?.id || '',
                captainName: user?.name || 'Unknown'
            });
            alert('Successfully registered for the event!');
            onRegister();
        } catch (error) {
            console.error(error);
            alert('Failed to register.');
        } finally {
            setRegistering(false);
        }
    };

    const handleStatusUpdate = async (teamId: string, status: 'approved' | 'rejected') => {
        try {
            await updateEventRegistrationStatus(event.id, teamId, status);
            onRegister(); // Refresh
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Failed to update status');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-4xl w-full max-h-[95vh] overflow-y-auto custom-scrollbar relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 rounded-full z-10 transition-colors"
                >
                    <XCircle size={24} />
                </button>

                {/* Hero Image */}
                <div className="h-64 md:h-80 bg-black/50 relative">
                    {event.imageUrl ? (
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                            <Trophy size={64} className="text-white/10" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-elkawera-dark to-transparent"></div>
                    <div className="absolute bottom-6 left-6 md:left-10 right-6">
                        <div className="flex gap-2 mb-3">
                            <span className="px-3 py-1 bg-elkawera-accent text-black font-bold text-xs uppercase rounded-full">
                                {event.category}
                            </span>
                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase rounded-full border border-white/10">
                                {event.status}
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase leading-none shadow-xl">{event.title}</h2>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-8">
                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-6 text-gray-300 border-b border-white/10 pb-8">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-elkawera-accent" size={24} />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                                <p className="font-bold text-lg">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="text-elkawera-accent" size={24} />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Time</p>
                                <p className="font-bold text-lg">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="text-elkawera-accent" size={24} />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                                <p className="font-bold text-lg">{event.location}</p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4 uppercase">Event Details</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                            {event.description}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-4 pt-4">
                        {user?.role === 'captain' && (
                            <div className="flex-1">
                                {isRegistered ? (
                                    <button disabled className="w-full py-4 bg-green-500/20 border border-green-500/50 text-green-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                        <CheckCircle size={20} /> Registered
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRegister}
                                        disabled={registering || !captainTeam}
                                        className="w-full py-4 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,157,0.3)] disabled:opacity-50 disabled:transform-none"
                                    >
                                        {registering ? 'Registering...' : 'Register Team for Event'}
                                    </button>
                                )}
                                {!captainTeam && <p className="text-xs text-red-400 mt-2 text-center">You need a team to register.</p>}
                            </div>
                        )}

                        {isAdmin && (
                            <div className="flex-1 space-y-3">
                                <button
                                    onClick={() => setShowParticipants(!showParticipants)}
                                    className="w-full py-4 bg-white/10 text-white font-bold uppercase rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Users size={20} /> {showParticipants ? 'Hide Participants' : 'View Registered Teams'}
                                </button>

                                <button
                                    onClick={() => {
                                        navigate(`/events/${event.id}/manage`);
                                    }}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold uppercase rounded-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg"
                                >
                                    <Trophy size={20} /> Manage Event & Matches
                                </button>
                                {event.status === 'ongoing' && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to mark this event as ended?')) return;
                                            try {
                                                await updateEvent({ ...event, status: 'ended' });
                                                onRegister();
                                                onClose();
                                            } catch (error) {
                                                console.error(error);
                                                alert('Failed to end event');
                                            }
                                        }}
                                        className="w-full py-4 bg-red-600/80 text-white font-bold uppercase rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <CheckCircle size={20} /> Mark as Ended
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Admin: Participants List */}
                    {isAdmin && showParticipants && (
                        <div className="bg-black/30 rounded-xl p-6 border border-white/10 animate-fade-in-up">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Trophy size={18} className="text-elkawera-accent" />
                                Registered Teams ({event.registeredTeams?.length || 0})
                            </h4>
                            {event.registeredTeams && event.registeredTeams.length > 0 ? (
                                <div className="space-y-2">
                                    {event.registeredTeams.map((reg, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/5">
                                            <div>
                                                <p className="font-bold text-white text-lg">{reg.teamName}</p>
                                                <p className="text-sm text-gray-400">Capt. {reg.captainName}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 text-xs rounded uppercase font-bold ${reg.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                    reg.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>{reg.status}</span>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(reg.registeredAt).toLocaleDateString()}</p>

                                                {reg.status === 'pending' && (
                                                    <div className="flex gap-2 mt-2 justify-end">
                                                        <button
                                                            onClick={() => handleStatusUpdate(reg.teamId, 'approved')}
                                                            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 text-xs rounded transition-colors"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(reg.teamId, 'rejected')}
                                                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs rounded transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No teams registered yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};




const EventFormModal: React.FC<{
    event: Event | null;
    onClose: () => void;
    onSave: () => void;
}> = ({ event, onClose, onSave }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    // Helper to format date for datetime-local (yyyy-MM-ddThh:mm)
    const formatDateForInput = (timestamp?: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        // We need local time string
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    const [date, setDate] = useState(formatDateForInput(event?.date));
    const [location, setLocation] = useState(event?.location || '');
    const [status, setStatus] = useState<EventStatus>(event?.status || 'upcoming');
    const [category, setCategory] = useState<EventCategory>(event?.category || 'match');
    const [imageUrl, setImageUrl] = useState(event?.imageUrl || '');
    const [saving, setSaving] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getMinDateForInput = () => {
        const now = new Date();
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !location) {
            alert('Please fill in all required fields.');
            return;
        }

        setSaving(true);
        try {
            const timestamp = new Date(date).getTime();
            if (isNaN(timestamp)) {
                throw new Error('Invalid Date');
            }

            const newEvent: Event = {
                id: event?.id || uuidv4(),
                title,
                description,
                date: timestamp,
                location,
                status,
                category,
                imageUrl,
                participants: event?.participants || [],
                createdBy: event?.createdBy || user?.id || '',
                createdByName: event?.createdByName || user?.name || '',
                createdAt: event?.createdAt || Date.now(),
                updatedAt: Date.now()
            };

            await saveEvent(newEvent);

            // Notify all users if it's a new event
            if (!event) {
                notifyAllUsers(
                    'New Event Added',
                    `Check out the new event: "${title}"`,
                    { eventId: newEvent.id }
                );
            }

            onSave();
        } catch (error: any) {
            console.error('Error saving event:', error);
            // More specific error message if possible
            const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Failed to save event. Database might not be ready.');

            if (errorMessage.includes('One of the specified object stores was not found')) {
                alert('Database Error: The "Events" storage is missing. This happens when the database update was blocked.\n\nPlease CLOSING ALL OTHER TABS of this application and RELOADING this page to fix it.');
            } else {
                alert(`Error: ${errorMessage}. Try reloading the page.`);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-display font-bold uppercase">{event ? 'Edit Event' : 'Add New Event'}</h2>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-1">Event Image</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-black/50 border border-white/20 rounded-lg overflow-hidden flex items-center justify-center">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-500">No Image</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-elkawera-accent file:text-black hover:file:bg-white"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Recommended: 16:9 aspect ratio</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-1">Event Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none text-white"
                                placeholder="e.g., Summer Tournament Finals"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none text-white h-24"
                                placeholder="Event details..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Date & Time</label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        min={getMinDateForInput()}
                                        // Open picker on click for better UX
                                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                                        className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                        required
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Location</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none text-white"
                                        placeholder="e.g., Cairo Stadium"
                                        required
                                    />
                                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value as EventCategory)}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none text-white"
                                >
                                    <option value="match">Match</option>
                                    <option value="tournament">Tournament</option>
                                    <option value="training">Training</option>
                                    <option value="social">Social</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value as EventStatus)}
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none text-white"
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-white/10 rounded-lg font-bold hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
