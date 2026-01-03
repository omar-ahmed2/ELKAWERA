import React, { useEffect, useState } from 'react';
import { 
  Users, Activity, Shield, AlertCircle, TrendingUp, Calendar, 
  UserPlus, FileText, Settings, Bell, ChevronRight, Clock, Target, CreditCard
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getAllPlayers, getAllTeams, getAllUsers, getAllMatchRequests, getAllPlayerRegistrationRequests 
} from '../utils/db';
import { useSettings } from '../context/SettingsContext';

import { BackupButton } from '../components/BackupButton';

// --- Components ---

const StatCard = ({ icon: Icon, label, value, trend, trendUp, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#00ff9d]/50 transition-colors"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#00ff9d]/10 transition-colors"></div>
    
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-4xl font-display font-bold text-white mt-2 mb-1">{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-[#00ff9d]' : 'text-red-400'}`}>
            {trendUp ? <TrendingUp size={12} /> : <Activity size={12} />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-[#00ff9d]/30 group-hover:text-[#00ff9d] transition-all">
        <Icon size={24} />
      </div>
    </div>
  </motion.div>
);

const ActionButton = ({ icon: Icon, label, desc, to, delay, badge }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Link 
      to={to}
      className="flex flex-col h-full bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-[#00ff9d] hover:shadow-[0_0_30px_rgba(0,255,157,0.1)] transition-all group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#00ff9d]/0 group-hover:bg-[#00ff9d]/5 transition-colors duration-500"></div>
      
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-[#00ff9d]/10 rounded-xl flex items-center justify-center text-[#00ff9d] mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon size={24} />
        </div>
        {badge > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {badge} New
          </span>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#00ff9d] transition-colors">{label}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
      
      <div className="mt-auto pt-6 flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest group-hover:text-[#00ff9d] transition-colors">
        Access Module <ChevronRight size={14} className="ml-1" />
      </div>
    </Link>
  </motion.div>
);

const TickerItem = ({ text, time }: any) => (
  <div className="flex items-center gap-4 px-6 border-r border-white/10">
    <span className="text-[#00ff9d] font-mono text-xs">{time}</span>
    <span className="text-gray-300 text-sm font-medium whitespace-nowrap">{text}</span>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    users: 0,
    players: 0,
    matches: 0,
    teams: 0,
    pending: 0
  });
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [topTeams, setTopTeams] = useState<any[]>([]);
  
  const { t } = useSettings();

  useEffect(() => {
    const fetchData = async () => {
      const [u, p, t, m, reqs] = await Promise.all([
        getAllUsers(),
        getAllPlayers(),
        getAllTeams(),
        getAllMatchRequests(),
        getAllPlayerRegistrationRequests()
      ]);
      
      setStats({
        users: u.length,
        players: p.length,
        teams: t.length,
        matches: m.length,
        pending: reqs.filter((r: any) => r.status === 'pending').length
      });

      // Specific Function: Global Performance Monitoring
      setTopPlayers([...p].sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 3));
      setTopTeams([...t].sort((a, b) => (b.wins || 0) - (a.wins || 0)).slice(0, 3));
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-20 text-white font-sans selection:bg-[#00ff9d] selection:text-black">
      
      {/* --- Top Bar / Header --- */}
      <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></span>
            <span className="text-[#00ff9d] text-xs font-bold tracking-[0.2em] uppercase">System Online</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
            Command <span className="text-stroke-1 text-[#00ff9d]">Center</span>
          </h1>
        </div>
        
        <div className="hidden md:flex gap-4 items-center">
           <BackupButton variant="full" className="!bg-white/10 !border !border-white/20 !hover:border-[#00ff9d]" />
           <div className="text-right pl-4 border-l border-white/10">
             <div className="text-sm text-gray-400 font-mono">{new Date().toLocaleDateString()}</div>
             <div className="text-xl font-bold font-mono">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
           </div>
        </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={Users} 
          label="Total Users" 
          value={stats.users} 
          trend="+12% this week" 
          trendUp={true} 
          delay={0.1} 
        />
        <StatCard 
          icon={Target} 
          label="Active Players" 
          value={stats.players} 
          trend="+5 new today" 
          trendUp={true} 
          delay={0.2} 
        />
        <StatCard 
          icon={Shield} 
          label="Registered Teams" 
          value={stats.teams} 
          trend="Stable" 
          trendUp={true} 
          delay={0.3} 
        />
        <StatCard 
          icon={Activity} 
          label="Matches Played" 
          value={stats.matches} 
          trend="High activity" 
          trendUp={true} 
          delay={0.4} 
        />
      </div>

      {/* --- Main Action Module --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        
        {/* Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
           <ActionButton 
             icon={UserPlus} 
             label="Player Management" 
             desc="Create, edit, or remove player cards. Manage stats and profiles."
             to="/admin/users"
             delay={0.5}
           />
           <ActionButton 
             icon={Calendar} 
             label="Match Control" 
             desc="Approve match requests, set schedules, and verify match results."
             to="/admin/matches"
             delay={0.6}
           />
           <ActionButton 
             icon={FileText} 
             label="Scout Reports" 
             desc="View scout activities, rankings, and recruitment analysis."
             to="/admin/scouts"
             delay={0.7}
           />
           <ActionButton 
             icon={CreditCard} 
             label="Kit Requests" 
             desc="Manage team kit orders and custom design submissions."
             to="/admin/kit-requests"
             delay={0.8}
           />
        </div>

        {/* Elite Rankings Module */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        >
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <TrendingUp size={16} className="text-[#00ff9d]" /> Elite Rankings
            </h3>
            <span className="text-[10px] bg-[#00ff9d]/20 text-[#00ff9d] px-2 py-1 rounded">GLOBAL</span>
          </div>
          
          <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Top Players */}
            <div>
              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Top Goalscorers</h4>
              <div className="space-y-4">
                {topPlayers.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-gray-400'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#00ff9d] transition-colors">{p.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{p.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-[#00ff9d]">{p.goals} G</p>
                      <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-[#00ff9d]" style={{ width: `${(p.goals / (topPlayers[0]?.goals || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Teams */}
            <div>
              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Dominant Clubs</h4>
              <div className="space-y-4">
                {topTeams.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#00ff9d]/50 transition-colors overflow-hidden">
                         {t.logoUrl ? <img src={t.logoUrl} className="w-full h-full object-cover" alt="" /> : <Shield size={14} className="text-gray-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#00ff9d] transition-colors">{t.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{t.wins} Wins</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-bold text-blue-400">{t.experiencePoints} XP</p>
                      <p className="text-[8px] text-gray-600 uppercase">Power Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-white/[0.02] border-t border-white/10 text-center">
            <Link to="/admin/rankings" className="text-xs text-gray-400 hover:text-white transition-colors uppercase tracking-widest font-bold">
              View Detailed Team Global Rankings
            </Link>
          </div>
        </motion.div>
      </div>

    </div>
  );
};
