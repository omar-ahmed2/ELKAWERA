import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
    Settings as SettingsIcon,
    Bell,
    Shield,
    Moon,
    Monitor,
    Globe,
    Download,
    Trash2,
    Volume2,
    Save,
    LogOut,
    Check,
    Sun
} from 'lucide-react';
import { getAllPlayers, getPlayerById } from '../utils/db';
import { showToast } from '../components/Toast';

export const Settings: React.FC = () => {
    const { user, signOut } = useAuth();
    const { language, theme, setLanguage, setTheme, t, dir } = useSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    // Preferences State (Notifications and Privacy still local for now/mocked)
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        browserNotifications: false,
        soundEffects: true,
        publicProfile: true,
    });

    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            showToast(t('settings.save') + ' Success!', 'success');
        }, 800);
    };

    const togglePref = (key: keyof typeof preferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExportData = async () => {
        if (!user) return;
        try {
            const data: any = { user };
            if (user.playerCardId) {
                data.playerCard = await getPlayerById(user.playerCardId);
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `elkawera_data_${user.name.replace(/\s+/g, '_')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            showToast('Failed to export data', 'error');
        }
    };

    const tabs = [
        { id: 'general', label: t('settings.general'), icon: Monitor },
        { id: 'notifications', label: t('settings.notifications'), icon: Bell },
        { id: 'privacy', label: t('settings.privacy'), icon: Shield },
    ];

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in-up" dir={dir}>
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <SettingsIcon size={32} className="text-elkawera-accent animate-spin-slow" />
                </div>
                <div>
                    <h1 className="text-4xl font-display font-bold uppercase tracking-tight text-[var(--text-primary)]">
                        {t('settings.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)]">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-1 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wider ${activeTab === tab.id
                                ? 'bg-elkawera-accent text-black shadow-lg shadow-elkawera-accent/20'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}

                    <div className="h-px bg-[var(--border-color)] my-4 mx-2"></div>

                    <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm uppercase tracking-wider text-red-500 hover:bg-red-500/10"
                    >
                        <LogOut size={18} />
                        {t('settings.signout')}
                    </button>
                </div>

                {/* Content Area */}
                <div className="md:col-span-3">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8 min-h-[500px] relative overflow-hidden">
                        {/* Background Deco */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-elkawera-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        {/* General Tab */}
                        {activeTab === 'general' && (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                        <Globe size={20} className="text-blue-400" /> {t('settings.language')}
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${language === 'en' ? 'bg-[var(--bg-secondary)] border-elkawera-accent' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                                        >
                                            <span className="font-bold text-[var(--text-primary)]">English (UK)</span>
                                            {language === 'en' && <Check size={18} className="text-elkawera-accent" />}
                                        </button>
                                        <button
                                            onClick={() => setLanguage('ar')}
                                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${language === 'ar' ? 'bg-[var(--bg-secondary)] border-elkawera-accent' : 'bg-black/20 border-white/10 hover:border-white/30'}`}
                                        >
                                            <span className="font-bold font-sans text-[var(--text-primary)]">العربية</span>
                                            {language === 'ar' && <Check size={18} className="text-elkawera-accent" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                        <Moon size={20} className="text-purple-400" /> {t('settings.theme')}
                                    </h2>
                                    <div className="grid grid-cols-2 gap-2 bg-black/20 rounded-xl p-1">
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-bold text-sm ${theme === 'dark' ? 'bg-[var(--bg-secondary)] text-white shadow' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            <Moon size={16} /> {t('settings.dark')}
                                        </button>
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-bold text-sm ${theme === 'light' ? 'bg-white text-black shadow' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            <Sun size={16} /> {t('settings.light')}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                        <Volume2 size={20} className="text-green-400" /> {t('settings.sound')}
                                    </h2>
                                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                        <div>
                                            <div className="font-bold text-[var(--text-primary)]">UI Sound Effects</div>
                                            <div className="text-xs text-[var(--text-secondary)]">{t('settings.sound.desc')}</div>
                                        </div>
                                        <button
                                            onClick={() => togglePref('soundEffects')}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.soundEffects ? 'bg-elkawera-accent' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${preferences.soundEffects ? (dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Bell size={20} className="text-yellow-400" /> {t('settings.notifications')}
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                        <div>
                                            <div className="font-bold text-[var(--text-primary)]">Email Notifications</div>
                                            <div className="text-xs text-[var(--text-secondary)]">Receive match invites and weekly summaries via email.</div>
                                        </div>
                                        <button
                                            onClick={() => togglePref('emailNotifications')}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.emailNotifications ? 'bg-elkawera-accent' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${preferences.emailNotifications ? (dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                        <div>
                                            <div className="font-bold text-[var(--text-primary)]">Browser Push Notifications</div>
                                            <div className="text-xs text-[var(--text-secondary)]">Get instant alerts on your desktop when active.</div>
                                        </div>
                                        <button
                                            onClick={() => togglePref('browserNotifications')}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.browserNotifications ? 'bg-elkawera-accent' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${preferences.browserNotifications ? (dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === 'privacy' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Shield size={20} className="text-elkawera-accent" /> {t('settings.privacy')}
                                </h2>

                                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 mb-8">
                                    <div>
                                        <div className="font-bold text-[var(--text-primary)]">Public Profile</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Allow other users to search for you and view your stats.</div>
                                    </div>
                                    <button
                                        onClick={() => togglePref('publicProfile')}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${preferences.publicProfile ? 'bg-elkawera-accent' : 'bg-gray-700'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${preferences.publicProfile ? (dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
                                    </button>
                                </div>

                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Download size={20} className="text-blue-400" /> Your Data
                                </h2>

                                <button
                                    onClick={handleExportData}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors group mb-8"
                                >
                                    <div className="text-left">
                                        <div className="font-bold text-[var(--text-primary)]">Export My Data</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Download a copy of your profile and player stats JSON.</div>
                                    </div>
                                    <Download size={20} className="text-gray-400 group-hover:text-white" />
                                </button>

                                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-red-500">
                                    <Trash2 size={20} /> Danger Zone
                                </h2>

                                <div className="p-4 border border-red-500/30 bg-red-500/5 rounded-xl">
                                    <div className="font-bold text-red-500 mb-2">Delete Account</div>
                                    <p className="text-xs text-[var(--text-secondary)] mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                                    <button
                                        onClick={() => showToast('Please contact administrator at support@elkawera.com to request account deletion.', 'info')}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/50 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="absolute bottom-6 right-6">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-3 bg-white text-black font-bold uppercase rounded-full hover:bg-elkawera-accent transition-colors shadow-lg flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} /> {t('settings.save')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
