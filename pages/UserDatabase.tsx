
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, deleteUser, subscribeToChanges } from '../utils/db';
import { User } from '../types';
import { User as UserIcon, Trash2, Search, X, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { showToast } from '../components/Toast';

export const UserDatabase: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
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
        loadUsers();
        const unsubscribe = subscribeToChanges(() => {
            loadUsers();
        });
        return () => unsubscribe();
    }, [user, navigate]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const users = await getAllUsers();
            setAllUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
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
                loadUsers();
                showToast('User deleted successfully', 'success');
            } catch (error) {
                showToast('Failed to delete user', 'error');
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh] text-white">Loading users...</div>;
    }

    return (
        <div className="space-y-8 animate-fade-in" dir={dir}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-elkawera-accent mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
                        <Shield className="text-elkawera-accent" /> {t('dashboard.user_db')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage all registered accounts in the system.</p>
                </div>

                <div className="bg-[var(--bg-secondary)] px-6 py-4 rounded-2xl border border-[var(--border-color)]">
                    <span className="text-xs uppercase font-bold text-[var(--text-secondary)] block mb-1">Total Users</span>
                    <span className="text-3xl font-display font-bold text-white">{allUsers.length}</span>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)]`} size={20} />
                <input
                    type="text"
                    placeholder={t('common.search')}
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className={`w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-elkawera-accent focus:outline-none transition-colors shadow-lg`}
                />
                {userSearchTerm && (
                    <button
                        onClick={() => setUserSearchTerm('')}
                        className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors`}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left rtl:text-right border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-primary)]/30 border-b border-[var(--border-color)] text-xs uppercase font-bold text-[var(--text-secondary)]">
                                <th className="p-6">{t('dashboard.user_table.user')}</th>
                                <th className="p-6">{t('dashboard.user_table.email')}</th>
                                <th className="p-6">{t('dashboard.user_table.role')}</th>
                                <th className="p-6">{t('dashboard.user_table.joined')}</th>
                                <th className="p-6 text-right rtl:text-left">{t('dashboard.user_table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
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
                                    <tr key={u.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors group">
                                        <td className="p-6 font-medium text-[var(--text-primary)] flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-elkawera-accent/10 flex items-center justify-center text-elkawera-accent border border-elkawera-accent/20">
                                                <UserIcon size={20} />
                                            </div>
                                            {u.name}
                                        </td>
                                        <td className="p-6 text-[var(--text-secondary)]">{u.email}</td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                u.role === 'captain' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                    u.role === 'scout' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-6 text-[var(--text-secondary)] text-sm">
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
                                                    className="p-3 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    title={t('dashboard.user_table.delete_user')}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            {allUsers.filter(u => {
                                if (!userSearchTerm) return true;
                                const searchLower = userSearchTerm.toLowerCase();
                                return (
                                    u.name.toLowerCase().includes(searchLower) ||
                                    u.email.toLowerCase().includes(searchLower)
                                );
                            }).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-[var(--text-secondary)]">
                                            {userSearchTerm
                                                ? `${t('common.no_data')} "${userSearchTerm}"`
                                                : t('common.no_data')}
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
