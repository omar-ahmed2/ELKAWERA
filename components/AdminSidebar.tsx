
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    LayoutDashboard,
    Trophy,
    UserPlus,
    Users,
    Bell,
    Shield,
    Target,
    BarChart2,
    Plus,
    User,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Shirt,
    Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminSidebarProps {
    pendingRequestsCount: number;
    unreadNotifications: number;
    kitRequestsCount: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ pendingRequestsCount, unreadNotifications, kitRequestsCount }) => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (path: string) => location.pathname === path
        ? "bg-elkawera-accent text-elkawera-black shadow-[0_0_15px_rgba(0,255,157,0.3)]"
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)]/10";

    const handleSignOut = () => {
        signOut();
        navigate('/');
    };

    const NavItem = ({ to, icon: Icon, label, count, badgeColor = "bg-red-500" }: { to: string, icon: any, label: string, count?: number, badgeColor?: string }) => (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group relative ${isActive(to)}`}
        >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && (
                <span className="truncate">{label}</span>
            )}
            {/* Tooltip for collapsed state */}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {label}
                </div>
            )}
            {count !== undefined && count > 0 && (
                <span className={`absolute ${collapsed ? 'top-2 right-2 w-2 h-2 rounded-full p-0' : 'right-4 px-2 py-0.5 rounded-full text-xs font-bold'} ${badgeColor} text-white flex items-center justify-center animate-pulse`}>
                    {collapsed ? '' : count}
                </span>
            )}
        </Link>
    );

    return (
        <aside
            className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-r border-[var(--border-color)] transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
        >
            {/* Logo Section */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)]">
                <div
                    className={`flex items-center gap-3 cursor-pointer overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}
                    onClick={() => navigate('/')}
                >
                    <div className="relative w-8 h-8 rounded-full shadow-lg flex items-center justify-center flex-shrink-0">
                        <img src="/elkawera.jpg" alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <span className="text-xl font-display font-bold italic tracking-tighter text-[var(--text-primary)] truncate">
                        ELKAWERA<span className="text-elkawera-accent">.</span>
                    </span>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ${collapsed ? 'mx-auto' : ''}`}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {/* Main Section */}
                {!collapsed && <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-2">Menu</p>}

                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/leaderboard" icon={Trophy} label="Leaderboard" />
                <NavItem to="/events" icon={Calendar} label="Events" />
                <NavItem to="/new-players" icon={UserPlus} label="New Players" count={pendingRequestsCount} />
                <NavItem to="/teams" icon={Users} label="Teams" />

                {/* Admin Section */}
                {!collapsed && <p className="px-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 mt-6">Admin</p>}
                {!collapsed && collapsed && <div className="h-px bg-[var(--border-color)] my-4 mx-2"></div>}

                <NavItem to="/admin/matches" icon={Target} label="Matches" />
                <NavItem to="/admin/scouts" icon={Shield} label="Scouts" />
                <NavItem to="/admin/users" icon={Users} label="Users" />
                <NavItem to="/admin/kits" icon={Shirt} label="Kit Management" />
                <NavItem to="/admin/kit-requests" icon={Package} label="Kit Requests" count={kitRequestsCount} />
                <NavItem to="/compare" icon={BarChart2} label="Compare" />
                <NavItem to="/create" icon={Plus} label="New Card" />

                {/* Utils */}
                {!collapsed && <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-6">General</p>}
                {!collapsed && collapsed && <div className="h-px bg-white/10 my-4 mx-2"></div>}

                <NavItem to="/" icon={Home} label="Home Page" />
                <NavItem to="/notifications" icon={Bell} label="Notifications" count={unreadNotifications} />
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-[var(--border-color)]">
                <NavItem to="/profile" icon={User} label="Profile" />
                <NavItem to="/settings" icon={Settings} label="Settings" />

                <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-1 ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
};
