
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser, subscribeToChanges, getAllPlayerRegistrationRequests } from '../utils/db';
import { User, PlayerRegistrationRequest } from '../types';
import { User as UserIcon, Trash2, Search, X, Shield, ArrowLeft, Clock, CheckCircle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { showToast } from '../components/Toast';

export const UserDatabase: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [requests, setRequests] = useState<PlayerRegistrationRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { t, dir } = useSettings();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        loadData();
        const unsubscribe = subscribeToChanges(() => {
            loadData();
        });
        return () => unsubscribe();
    }, [user, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [users, reqs] = await Promise.all([
                getAllUsers(),
                getAllPlayerRegistrationRequests()
            ]);
            setAllUsers(users);
            setRequests(reqs.filter(r => r.status === 'pending')); // Only show pending
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteUser = async () => {
        if (deleteUserId) {
            if (user && user.id === deleteUserId) {
                showToast("You cannot delete your own account while logged in.", "error");
                setDeleteUserId(null);
                return;
            }
            try {
                await deleteUser(deleteUserId);
                setDeleteUserId(null);
                loadData();
                showToast('User deleted successfully', 'success');
            } catch (error) {
                showToast('Failed to delete user', 'error');
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh] text-white">Loading database...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in" dir={dir}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-elkawera-accent mb-4 transition-colors text-sm font-bold uppercase tracking-wider"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-display font-bold uppercase tracking-tighter text-white mb-2">
                        User <span className="text-[#00ff9d]">Management</span>
                    </h1>
                    <p className="text-gray-400">Manage registered accounts and process new player card requests.</p>
                </div>

                <div className="flex gap-2 bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-[#00ff9d] text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield size={16} /> Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('requests')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-[#00ff9d] text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Clock size={16} /> Requests
                        {requests.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                {requests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <>
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-500`} size={20} />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-white placeholder-gray-600 focus:border-[#00ff9d] focus:outline-none transition-colors shadow-lg`}
                        />
                        {userSearchTerm && (
                            <button
                                onClick={() => setUserSearchTerm('')}
                                className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors`}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left rtl:text-right border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-xs uppercase font-bold text-gray-400">
                                        <th className="p-6">{t('dashboard.user_table.user')}</th>
                                        <th className="p-6">{t('dashboard.user_table.email')}</th>
                                        <th className="p-6">{t('dashboard.user_table.role')}</th>
                                        <th className="p-6">{t('dashboard.user_table.joined')}</th>
                                        <th className="p-6 text-right rtl:text-left">{t('dashboard.user_table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {allUsers
                                        .filter(u => {
                                            if (!userSearchTerm) return true;
                                            const searchLower = userSearchTerm.toLowerCase();
                                            return (
                                                u.name.toLowerCase().includes(searchLower) ||
                                                u.email.toLowerCase().includes(searchLower)
                                            );
                                        })
                                        .map(u => (
                                            <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-6 font-medium text-white flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#00ff9d]/10 flex items-center justify-center text-[#00ff9d] border border-[#00ff9d]/20">
                                                        <UserIcon size={20} />
                                                    </div>
                                                    {u.name}
                                                </td>
                                                <td className="p-6 text-gray-400">{u.email}</td>
                                                <td className="p-6">
                                                    <span className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                        u.role === 'captain' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                            u.role === 'scout' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                                                'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-gray-400 text-sm">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-6 text-right rtl:text-left relative">
                                                    {deleteUserId === u.id ? (
                                                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 border-2 border-red-500/50 rounded-xl px-4 py-2 shadow-[0_0_25px_rgba(220,38,38,0.5)] animate-scale-in">
                                                            <span className="text-white text-sm font-bold">{t('dashboard.user_table.delete_confirm')}</span>
                                                            <button
                                                                onClick={confirmDeleteUser}
                                                                className="px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                {t('dashboard.user_table.yes')}
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteUserId(null)}
                                                                className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                {t('dashboard.user_table.no')}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteUserId(u.id)}
                                                            className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                            title={t('dashboard.user_table.delete_user')}
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    {allUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center text-gray-500">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.length === 0 ? (
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-16 text-center">
                            <CheckCircle size={48} className="mx-auto text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Pending Requests</h3>
                            <p className="text-gray-500">All player card requests have been processed.</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[#00ff9d]/30 transition-colors">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-[#00ff9d]/10 flex items-center justify-center text-[#00ff9d] border border-[#00ff9d]/20">
                                        <FileText size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{req.name}</h3>
                                        <div className="flex gap-4 text-sm text-gray-400">
                                            <span className="flex items-center gap-1"><Shield size={12} /> {req.position}</span>
                                            <span>•</span>
                                            <span>{req.age} Years</span>
                                            <span>•</span>
                                            <span>{req.height}cm / {req.weight}kg</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button 
                                        className="flex-1 md:flex-none px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all text-sm uppercase tracking-wider"
                                        onClick={() => showToast('Reject functionality not implemented in this demo', 'info')}
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/create?requestId=${req.id}`)}
                                        className="flex-1 md:flex-none px-6 py-3 bg-[#00ff9d] text-black font-bold rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)] text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        Create Card <ArrowLeft className="rotate-180" size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
