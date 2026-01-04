import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import {
    Settings as SettingsIcon,
    Shield,
    Moon,
    Monitor,
    Globe,
    Download,
    Trash2,
    Save,
    LogOut,
    Check,
    Sun,
    Lock,
    Key,
    Smartphone,
    Laptop,
    Eye,
    EyeOff,
    AlertTriangle
} from 'lucide-react';
import { getPlayerById } from '../utils/db';
import { showToast } from '../components/Toast';
import Snowfall from 'react-snowfall';

export const Settings: React.FC = () => {
    const { user, signOut } = useAuth();
    const { language, theme, setLanguage, setTheme, snowEffect, setSnowEffect, t, dir } = useSettings();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    
    // Security State
    // State for password toggle or other simple UI interactions if needed in future
    // currently simplified as per request
    
    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            showToast(t('settings.save') + ' Success!', 'success');
        }, 800);
    };

    const handleExportData = async () => {
        if (!user) return;
        try {
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Header
            csvContent += "User ID,Name,Email,Role,Join Date,Phone,Age,Position,Team,Overall Score\n";

            // User Data
            let playerData: any = {};
            if (user.playerCardId) {
                playerData = await getPlayerById(user.playerCardId) || {};
            }

            const row = [
                user.id,
                user.name,
                user.email,
                user.role,
                new Date(user.createdAt).toLocaleDateString(),
                user.phoneNumber || '',
                user.age || '',
                playerData.position || user.position || '',
                playerData.teamName || '',
                playerData.overallScore || ''
            ].map(item => `"${item}"`).join(","); // Quote fields to handle commas

            csvContent += row + "\n";

            // Download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `elkawera_data_${user.name.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('Data exported to Excel (CSV) successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to export data', 'error');
        }
    };



    const tabs = [
        { id: 'general', label: t('settings.general'), icon: Monitor },
        { id: 'security', label: 'Privacy & Security', icon: Shield },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-fade-in-up" dir={dir}>
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
                                        <div className="w-5 h-5 flex items-center justify-center bg-cyan-400/20 rounded text-cyan-400">
                                            <Snowfall snowflakeCount={10} style={{ position: 'relative', width: 20, height: 20 }} />
                                        </div>
                                        {t('settings.snow')}
                                    </h2>
                                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                                        <div>
                                            <div className="font-bold text-[var(--text-primary)]">{t('settings.snow')}</div>
                                            <div className="text-xs text-[var(--text-secondary)]">{t('settings.snow.desc')}</div>
                                        </div>
                                        <button
                                            onClick={() => setSnowEffect(!snowEffect)}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${snowEffect ? 'bg-elkawera-accent' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${snowEffect ? (dir === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="mt-8 flex justify-end">
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
                        )}

                        {/* Privacy & Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-fade-in">
                                
                                {/* Security Information Section (Read-Only) */}
                                <div className="space-y-6">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                                            <Shield size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-400 mb-2">Platform Security Standards</h3>
                                            <p className="text-sm text-gray-300 leading-relaxed">
                                                At EL KAWERA, we prioritize your security and data privacy. Our platform is built with industry-standard security measures to ensure your information remains safe.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Lock className="text-elkawera-accent" size={20} />
                                                <h4 className="font-bold text-white">Data Encryption</h4>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                All sensitive user data is encrypted at rest and in transit using advanced cryptographic protocols (AES-256 and TLS 1.3).
                                            </p>
                                        </div>

                                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Check className="text-blue-400" size={20} />
                                                <h4 className="font-bold text-white">GDPR Compliance</h4>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                We adhere to strict data protection regulations. We do not sell your personal data to third parties.
                                            </p>
                                        </div>

                                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Eye className="text-purple-400" size={20} />
                                                <h4 className="font-bold text-white">Privacy Controls</h4>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                You have full control over your profile visibility. By default, only essential matchmaking data is shared.
                                            </p>
                                        </div>

                                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-3 mb-2">
                                                <SettingsIcon className="text-orange-400" size={20} />
                                                <h4 className="font-bold text-white">Regular Audits</h4>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Our systems undergo regular security audits and vulnerability assessments to stay ahead of potential threats.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Data & Danger Zone */}
                                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                                    {/* Export Data */}
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                            <Download size={18} className="text-green-500" /> Export Data
                                        </h2>
                                        <button
                                            onClick={handleExportData}
                                            className="w-full flex items-center justify-between p-4 bg-green-500/10 hover:bg-green-500/20 rounded-xl border border-green-500/20 transition-colors group"
                                        >
                                            <div className="text-left">
                                                <div className="font-bold text-green-400">Download Excel Sheet</div>
                                                <div className="text-xs text-green-500/70">Get a CSV copy of your profile data.</div>
                                            </div>
                                            <Download size={20} className="text-green-500" />
                                        </button>
                                    </div>

                                    {/* Delete Account */}
                                    <div>
                                        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2 text-red-500">
                                            <AlertTriangle size={18} /> Danger Zone
                                        </h2>
                                        <button
                                            onClick={() => showToast('Please contact administrator at support@elkawera.com', 'info')}
                                            className="w-full h-[74px] px-4 bg-red-500/5 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-between group"
                                        >
                                           <span>Delete My Account</span>
                                           <Trash2 size={20} className="group-hover:rotate-12 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
