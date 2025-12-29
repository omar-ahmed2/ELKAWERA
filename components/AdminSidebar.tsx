
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
    const [collapsed, setCollapsed] = useState(window.innerWidth < 1280);
    const [isHovered, setIsHovered] = useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1280) {
                setCollapsed(true);
            } else {
                setCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isActive = (path: string) => location.pathname === path
        ? "bg-elkawera-accent text-elkawera-black shadow-[0_0_20px_rgba(0,255,157,0.4)]"
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5";

    const handleSignOut = () => {
        signOut();
        navigate('/');
    };

    // Effective expanded state
    const isExpanded = !collapsed || isHovered;

    const NavItem = ({ to, icon: Icon, label, count, badgeColor = "bg-red-500" }: { to: string, icon: any, label: string, count?: number, badgeColor?: string }) => (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium group relative overflow-hidden ${isActive(to)}`}
        >
            <div className={`flex-shrink-0 transition-transform duration-300 ${!isExpanded ? 'mx-auto scale-110' : 'group-hover:scale-110'}`}>
                <Icon size={20} />
            </div>

            <span className={`truncate transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 -ml-4'}`}>
                {label}
            </span>

            {/* Tooltip for collapsed state when NOT hovered */}
            {collapsed && !isHovered && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-black/90 text-white text-[10px] rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {label}
                </div>
            )}

            {count !== undefined && count > 0 && (
                <span className={`absolute flex items-center justify-center transition-all duration-300 ${!isExpanded
                    ? 'top-2 right-2 w-4 h-4 text-[10px] rounded-full'
                    : 'right-4 px-2 py-0.5 rounded-full text-[10px] font-bold'
                    } ${badgeColor} text-white animate-pulse shadow-lg z-10`}>
                    {(!isExpanded && count > 9) ? '•' : count}
                </span>
            )}

            {/* Active Indicator Glow */}
            {location.pathname === to && (
                <div className="absolute inset-0 bg-elkawera-accent/5 pointer-events-none" />
            )}
        </Link>
    );

    return (
        <aside
            onMouseEnter={() => collapsed && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`hidden md:flex flex-col h-screen sticky top-0 bg-[var(--bg-primary)]/95 backdrop-blur-xl border-r border-[var(--border-color)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-x-hidden z-40 ${isExpanded ? 'w-64' : 'w-20'}`}
        >
            {/* Logo Section */}
            <div className="p-4 flex items-center justify-between border-b border-[var(--border-color)] min-h-[73px]">
                <div
                    className={`flex items-center gap-3 cursor-pointer overflow-hidden transition-all duration-500 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}
                    onClick={() => navigate('/')}
                >
                    <div className="relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10 p-0.5">
                        <img src="/elkawera2.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <span className="text-xl font-display font-bold italic tracking-tighter text-[var(--text-primary)] truncate">
                        ELKAWERA<span className="text-elkawera-accent">.</span>
                    </span>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setCollapsed(!collapsed);
                    }}
                    className={`p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 ${!isExpanded ? 'mx-auto rotate-180' : ''}`}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1 custom-scrollbar scroll-smooth">
                {/* Main Section */}
                <div className={`px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 mt-2 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    Menu
                </div>

                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/leaderboard" icon={Trophy} label="Leaderboard" />
                <NavItem to="/events" icon={Calendar} label="Events" />
                <NavItem to="/new-players" icon={UserPlus} label="New Players" count={pendingRequestsCount} />
                <NavItem to="/teams" icon={Users} label="Teams" />

                {/* Admin Section */}
                <div className={`px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 mt-6 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    Admin
                </div>
                {!isExpanded && <div className="h-px bg-white/5 my-4 mx-4 transition-all duration-300"></div>}

                <NavItem to="/admin/matches" icon={Target} label="Matches" />
                <NavItem to="/admin/scouts" icon={Shield} label="Scouts" />
                <NavItem to="/admin/users" icon={Users} label="Users" />
                <NavItem to="/admin/kits" icon={Shirt} label="Kit Management" />
                <NavItem to="/admin/kit-requests" icon={Package} label="Kit Requests" count={kitRequestsCount} />
                <NavItem to="/compare" icon={BarChart2} label="Compare" />
                <NavItem to="/create" icon={Plus} label="New Card" />

                {/* Utils */}
                <div className={`px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 mt-6 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    General
                </div>
                {!isExpanded && <div className="h-px bg-white/5 my-4 mx-4 transition-all duration-300"></div>}

                <NavItem to="/" icon={Home} label="Home Page" />
                <NavItem to="/notifications" icon={Bell} label="Notifications" count={unreadNotifications} />
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-[var(--border-color)] bg-black/20">
                <NavItem to="/profile" icon={User} label="Profile" />
                <NavItem to="/settings" icon={Settings} label="Settings" />

                <button
                    onClick={handleSignOut}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-red-500/80 hover:text-red-400 hover:bg-red-500/10 mt-1 relative overflow-hidden group ${!isExpanded ? 'justify-center' : ''}`}
                >
                    <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <LogOut size={20} />
                    </div>
                    <span className={`truncate transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto ml-0' : 'opacity-0 w-0 -ml-4'}`}>
                        Sign Out
                    </span>
                </button>
            </div>
        </aside>
    );
};
