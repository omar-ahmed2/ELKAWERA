
import React, { useState, useEffect } from 'react';
import { KitRequest, KitRequestStatus } from '../types';
import { getAllKitRequests, updateKitRequestStatus, addKitRequestMessage } from '../utils/db';
import { showToast } from '../components/Toast';
import { Filter, Search, Package, CheckCircle, Clock, Archive, Truck, AlertCircle, X, ExternalLink, Send, Mail, Phone } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminKitRequests: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<KitRequest[]>([]);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'ALL' | KitRequestStatus>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<KitRequest | null>(null);

    const handleOpenDetail = (req: KitRequest) => {
        setSelectedRequest(req);
        setAdminNotes('');
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await getAllKitRequests();
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
            showToast('Failed to load requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [adminNotes, setAdminNotes] = useState('');

    const [sendingMessage, setSendingMessage] = useState(false);

    const handleSendMessage = async () => {
        if (!selectedRequest || !adminNotes.trim()) {
            showToast('Please enter a message', 'error');
            return;
        }

        setSendingMessage(true);
        try {
            await addKitRequestMessage(selectedRequest.id, adminNotes);
            showToast('Message sent successfully', 'success');
            setAdminNotes('');
            loadRequests();
            setSelectedRequest(prev => prev ? { ...prev, adminNotes } : null);
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message', 'error');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: KitRequestStatus) => {
        try {
            await updateKitRequestStatus(id, newStatus, adminNotes);
            showToast(`Request marked as ${newStatus}`, 'success');
            setAdminNotes('');
            loadRequests();
            if (selectedRequest && selectedRequest.id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status: newStatus, adminNotes } : null);
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const filteredRequests = requests.filter(req => {
        if (filterStatus !== 'ALL' && req.status !== filterStatus) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                req.userName.toLowerCase().includes(term) ||
                req.teamName?.toLowerCase().includes(term) ||
                req.kitName?.toLowerCase().includes(term) ||
                req.id.toLowerCase().includes(term)
            );
        }
        return true;
    });

    const getStatusColor = (status: KitRequestStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
            case 'processing': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
            case 'ready': return 'bg-green-500/20 text-green-500 border-green-500/30';
            case 'delivered': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'archived': return 'bg-gray-800 text-gray-600 border-gray-700';
            default: return 'bg-white/10 text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                    <Package className="text-elkawera-accent" /> Kit Requests
                </h1>
                <div className="flex items-center gap-4 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => loadRequests()}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
                        title="Refresh"
                    >
                        <Clock size={16} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search user, team, or kit..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-elkawera-accent outline-none"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {(['ALL', 'pending', 'processing', 'ready', 'delivered', 'archived'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all border ${filterStatus === status
                                ? 'bg-elkawera-accent text-black border-elkawera-accent'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {status === 'ALL' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        No requests found.
                    </div>
                ) : (
                    filteredRequests.map(req => (
                        <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 hover:border-white/20 transition-all">
                            {/* Visual Indicator */}
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-black/40 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-white/5">
                                {req.type === 'official_kit' ? (
                                    <Package className="text-elkawera-accent opacity-50" size={32} />
                                ) : (
                                    req.customImageUrl ? (
                                        <img src={req.customImageUrl} alt="Custom" className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="text-blue-400 opacity-50" size={32} />
                                    )
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(req.status)}`}>
                                        {req.status}
                                    </span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs font-bold text-gray-300 uppercase">{req.type.replace('_', ' ')}</span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>

                                <h3 className="font-bold text-white text-lg truncate">
                                    {req.type === 'official_kit' ? req.kitName : 'Custom Design Request'}
                                </h3>

                                <div className="text-sm text-gray-400 mt-1">
                                    <span className="text-elkawera-accent font-bold">{req.userName}</span>
                                    <span className="opacity-50 mx-1">|</span>
                                    <span className="italic">{req.userRole}</span>
                                    {req.teamName && <> <span className="opacity-50 mx-1">|</span> {req.teamName} </>}
                                </div>

                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                                    <span className="bg-white/10 px-2 py-1 rounded">Size: <b>{req.selectedSize}</b></span>
                                    <span className="bg-white/10 px-2 py-1 rounded">Qty: <b>{req.quantity}</b></span>
                                </div>
                            </div>

                            <div className="flex md:flex-col items-center justify-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-4 mt-2 md:mt-0">
                                <button
                                    onClick={() => handleOpenDetail(req)}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold text-white transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
                                >
                                    <ExternalLink size={14} /> Details
                                </button>

                                {req.status === 'pending' && (
                                    <button
                                        onClick={() => handleStatusChange(req.id, 'processing')}
                                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-bold transition-colors w-full md:w-auto"
                                    >
                                        Process
                                    </button>
                                )}
                                {req.status === 'processing' && (
                                    <button
                                        onClick={() => handleStatusChange(req.id, 'ready')}
                                        className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-bold transition-colors w-full md:w-auto"
                                    >
                                        Mark Ready
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedRequest(null)}>
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Request Details</h2>
                            <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Header Info */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-wrap gap-4 justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold">Request ID</p>
                                    <p className="font-mono text-gray-300 text-xs">{selectedRequest.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 uppercase font-bold">Status</p>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status}</span>
                                </div>
                            </div>

                            {/* Contact & User Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-sm text-gray-500 uppercase font-bold mb-1 font-display">User & Team</p>
                                    <p className="font-bold text-white text-lg">{selectedRequest.userName}</p>
                                    <p className="text-sm text-elkawera-accent mb-1">{selectedRequest.userRole}</p>
                                    <p className="text-xs text-gray-400">{selectedRequest.teamName || 'No Team'}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <p className="text-sm text-gray-500 uppercase font-bold mb-2 font-display">Contact Details</p>
                                    <div className="space-y-2">
                                        <a
                                            href={`mailto:${selectedRequest.contactEmail}`}
                                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            <Mail size={14} /> {selectedRequest.contactEmail}
                                        </a>
                                        <a
                                            href={`tel:${selectedRequest.contactPhone}`}
                                            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                                        >
                                            <Phone size={14} /> {selectedRequest.contactPhone}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <h3 className="font-bold text-white mb-4 border-b border-white/10 pb-2">Order Info</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Item</p>
                                        <p className="font-bold text-white">{selectedRequest.type === 'official_kit' ? selectedRequest.kitName : 'Custom Design'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Specs</p>
                                        <p className="font-bold text-white">Size: {selectedRequest.selectedSize} | Qty: {selectedRequest.quantity}</p>
                                    </div>
                                </div>

                                {selectedRequest.type === 'custom_design' && selectedRequest.customImageUrl && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 mb-2">Custom Design</p>
                                        <div className="bg-black/50 rounded-lg overflow-hidden border border-white/10">
                                            <img src={selectedRequest.customImageUrl} alt="Custom Design" className="w-full max-h-64 object-contain" />
                                        </div>
                                    </div>
                                )}

                                {selectedRequest.notes && (
                                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                        <p className="text-xs text-yellow-500 font-bold mb-1">User Notes</p>
                                        <p className="text-sm text-gray-300 italic">"{selectedRequest.notes}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="border-t border-white/10 pt-4">
                                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Internal Notes / Message to User</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={e => setAdminNotes(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-elkawera-accent outline-none min-h-[80px] mb-2 text-sm"
                                    placeholder="Add a message for the user (optional)..."
                                />
                                <div className="flex justify-end mb-6">
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sendingMessage || !adminNotes.trim()}
                                        className="px-4 py-2 bg-elkawera-accent text-black font-bold rounded-lg hover:bg-white transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={14} /> {sendingMessage ? 'Sending...' : 'Send Message Only'}
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 uppercase font-bold mb-3">Update Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {(['pending', 'processing', 'ready', 'delivered', 'archived'] as const).map(status => (
                                        <button
                                            key={status}
                                            onClick={() => handleStatusChange(selectedRequest.id, status)}
                                            disabled={selectedRequest.status === status}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${selectedRequest.status === status
                                                ? 'bg-white/20 text-white border-white/30 cursor-default opacity-50'
                                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
