
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, Settings, ChevronDown, BarChart2, Gamepad2, User, Users, Bell, Trophy, Shield, Calendar, Shirt, Package, Target, TrendingUp, Info, MessageSquare, Home, Plus, LayoutDashboard, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAllPlayerRegistrationRequests, getAllKitRequests, subscribeToChanges, getUnreadCount } from '@/utils/db';
import { useSettings } from '@/context/SettingsContext';
import { AppSidebar } from './AppSidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingKitRequestsCount, setPendingKitRequestsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t, dir } = useSettings();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path
    ? "text-elkawera-accent bg-white/10"
    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]";

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  // Fetch pending requests count for admins and unread notifications
  useEffect(() => {
    const loadCounts = async () => {
      if (user && user.role === 'admin') {
        const requests = await getAllPlayerRegistrationRequests();
        const pending = requests.filter(r => r.status === 'pending');
        setPendingRequestsCount(pending.length);

        const kitRequests = await getAllKitRequests();
        const pendingKits = kitRequests.filter(r => r.status === 'pending');
        setPendingKitRequestsCount(pendingKits.length);
      }
      if (user) {
        const count = await getUnreadCount(user.id);
        setUnreadNotifications(count);
      }
    };

    loadCounts();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToChanges(() => {
      loadCounts();
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const showSidebar = user && ['admin', 'captain', 'player', 'scout'].includes(user.role);

  return (
    <div className={`${showSidebar ? 'h-screen overflow-hidden md:flex-row' : 'min-h-screen flex-col overflow-x-hidden'} flex font-sans bg-[var(--bg-primary)] bg-mesh bg-no-repeat bg-fixed bg-cover transition-colors duration-300 text-[var(--text-primary)]`} dir={dir}>

      {/* App Sidebar - Desktop Only for authenticated users */}
      {showSidebar && (
        <AppSidebar
          pendingRequestsCount={pendingRequestsCount}
          unreadNotifications={unreadNotifications}
          kitRequestsCount={pendingKitRequestsCount}
        />
      )}

      {/* Main Content Wrapper */}
      <div className={`flex flex-col flex-1 min-w-0 ${showSidebar ? 'h-full overflow-y-auto relative scroll-smooth' : ''}`}>
        {/* Navbar - hidden on desktop for sidebar users, visible otherwise */}
        <nav className={`sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/70 border-b border-[var(--border-color)] supports-[backdrop-filter]:bg-[var(--bg-primary)]/60 ${showSidebar ? 'md:hidden' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 rounded-full overflow-hidden border border-white/10">
                  <img
                    src="/elkawera.png"
                    alt="ELKAWERA"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-lg sm:text-2xl font-display font-bold italic tracking-tighter text-[var(--text-primary)] group-hover:scale-105 transition-transform duration-300">
                  ELKAWERA<span className="text-elkawera-accent">.</span>
                </span>
              </div>

              {/* Desktop Menu - Hide for Admins as they use Sidebar */}
              {!showSidebar && (
                <div className="hidden md:block">
                  <div className="ml-10 flex items-center space-x-1 lg:space-x-2 rtl:space-x-reverse rtl:ml-0 rtl:mr-10">
                    <Link to="/" className={`${isActive('/')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300`}>Home</Link>

                    {user && (
                      <>
                        {user.role !== 'captain' && user.role !== 'scout' && (
                          <>
                            <Link to="/dashboard" className={`${isActive('/dashboard')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300`}>{t('nav.dashboard')}</Link>
                            {user.role === 'player' && (
                              <Link to="/performance-hub" className={`${isActive('/performance-hub')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}>
                                <BarChart2 size={14} /> <span className="hidden lg:inline">Stats</span><span className="lg:hidden">Stats</span>
                              </Link>
                            )}
                          </>
                        )}

                        <Link to="/leaderboard" className={`${isActive('/leaderboard')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}><Trophy size={14} /> <span className="hidden lg:inline">{t('nav.leaderboard')}</span><span className="lg:hidden">Board</span></Link>
                        <Link to="/events" className={`${isActive('/events')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}><Calendar size={14} /> <span className="hidden lg:inline">Events</span><span className="lg:hidden">Events</span></Link>
                        <Link to="/teams" className={`${isActive('/teams')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300`}>{t('nav.teams')}</Link>
                        <Link to="/kits" className={`${isActive('/kits')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}><Shirt size={14} /> <span className="hidden lg:inline">Kits</span><span className="lg:hidden">Kits</span></Link>


                        {/* Notifications Bell */}
                        <Link to="/notifications" className={`${isActive('/notifications')} px-2 lg:px-3 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1 relative`}>
                          <Bell size={18} />
                          {unreadNotifications > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                              {unreadNotifications}
                            </span>
                          )}
                        </Link>

                        {user.role === 'captain' && (
                          <Link to="/captain/dashboard" className={`${isActive('/captain/dashboard')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}>
                            <Shield size={14} /> <span className="hidden lg:inline">Captain</span>
                          </Link>
                        )}
                        {user.role === 'scout' && (
                          <Link to="/scout/dashboard" className={`${isActive('/scout/dashboard')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}>
                            <Shield size={14} /> <span className="hidden lg:inline">Scout</span>
                          </Link>
                        )}
                      </>
                    )}

                    <Link to="/about" className={`${isActive('/about')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}>
                      <Info size={14} /> <span className="hidden lg:inline">{t('nav.about')}</span><span className="lg:hidden">About</span>
                    </Link>
                    <Link to="/contact" className={`${isActive('/contact')} px-3 lg:px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}>
                      <MessageSquare size={14} /> <span className="hidden lg:inline">{t('nav.contact')}</span><span className="lg:hidden">Contact</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Auth Buttons (Desktop) - Hide for Admins if in Sidebar? Yes, Sidebar has profile. */}
              {!showSidebar && (
                <div className="hidden md:flex items-center gap-2 lg:gap-4">
                  {user ? (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2 lg:gap-3 hover:bg-white/5 px-2 lg:px-3 py-2 rounded-full transition-all duration-300 border border-transparent hover:border-white/10"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center text-white shadow-sm overflow-hidden">
                          {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={14} />
                          )}
                        </div>
                        <span className="text-sm font-bold text-white hidden lg:block max-w-[120px] truncate">{user.name}</span>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Profile Dropdown */}
                      {profileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 z-50">
                          <div className="p-4 border-b border-[var(--border-color)]">
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                            <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
                            <span className="inline-block mt-2 px-2 py-1 bg-elkawera-accent/20 text-elkawera-accent text-[10px] font-bold uppercase rounded-md">
                              {user.role}
                            </span>
                          </div>
                          <div className="py-2">
                            <Link
                              to="/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] w-full text-left transition-colors"
                            >
                              <UserIcon size={16} /> {t('nav.profile')}
                            </Link>
                            <Link
                              to="/settings"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] w-full text-left transition-colors"
                            >
                              <Settings size={16} /> {t('nav.settings')}
                            </Link>
                            <div className="h-px bg-white/10 my-2"></div>
                            <button
                              onClick={() => { handleSignOut(); setProfileDropdownOpen(false); }}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-colors"
                            >
                              <LogOut size={16} /> {t('settings.signout')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 lg:gap-4">
                      <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-[var(--text-primary)] transition-colors">Sign In</Link>
                      <Link to="/signup" className="text-sm font-bold bg-white/10 border border-white/20 px-3 lg:px-5 py-2.5 rounded-full hover:bg-white hover:text-black transition-all">
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile menu button - Always Visible on Mobile */}
              <div className="md:hidden flex items-center gap-2">
                {/* Notifications on mobile */}
                {user && (
                  <Link to="/notifications" className="relative p-2">
                    <Bell size={20} className="text-gray-400" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                )}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] focus:outline-none transition-all"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[var(--bg-primary)] border-t border-[var(--border-color)] animate-in slide-in-from-top-5 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="px-4 pt-4 pb-6 space-y-4">
                {/* User Info on Mobile */}
                {user && (
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-white/20 flex items-center justify-center text-white shadow-sm overflow-hidden flex-shrink-0">
                        {user.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-elkawera-accent/20 text-elkawera-accent text-[10px] font-bold uppercase rounded">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {user ? (
                  <>
                    {/* MENU Section */}
                    <div className="space-y-2">
                      <div className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                        Menu
                      </div>
                      
                      <Link to="/" className="group block px-4 py-3 rounded-xl text-base font-bold text-[var(--text-primary)] hover:bg-white/5 hover:text-elkawera-accent transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <Home size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Home Page</span>
                      </Link>

                      {user.role !== 'captain' && user.role !== 'scout' && (
                        <>
                          <Link to="/dashboard" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                              <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <span>Dashboard CC</span>
                          </Link>
                          {user.role === 'player' && (
                            <Link to="/performance-hub" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                              <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                                <BarChart2 size={18} className="group-hover:scale-110 transition-transform" />
                              </div>
                              <span>Performance Hub</span>
                            </Link>
                          )}
                        </>
                      )}

                      <Link to="/leaderboard" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <Trophy size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Leaderboard</span>
                      </Link>
                      
                      <Link to="/events" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <Calendar size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Events</span>
                      </Link>

                      {user.role === 'admin' && (
                        <Link to="/new-players" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center justify-between border border-transparent hover:border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                              <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <span>New Players</span>
                          </div>
                          {pendingRequestsCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                              {pendingRequestsCount}
                            </span>
                          )}
                        </Link>
                      )}
                      
                      <Link to="/teams" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <Users size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Teams</span>
                      </Link>

                      {user.role !== 'admin' && (
                        <Link to="/kits" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <Shirt size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Official Kits</span>
                        </Link>
                      )}
                    </div>

                    {/* Role-specific Sections */}
                    {user.role === 'captain' && (
                      <div className="space-y-2">
                        <div className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                          Captain
                        </div>
                        <Link to="/captain/dashboard" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <Shield size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Captain Dashboard</span>
                        </Link>
                      </div>
                    )}
                    
                    {user.role === 'scout' && (
                      <div className="space-y-2">
                        <div className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                          Scout
                        </div>
                        <Link to="/scout/dashboard" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <Shield size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Scout Dashboard</span>
                        </Link>
                      </div>
                    )}
                    
                    {user.role === 'admin' && (
                      <div className="space-y-2">
                        <div className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                          Admin
                        </div>
                        <Link to="/admin/performance" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <TrendingUp size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Performance Center</span>
                        </Link>
                        <Link to="/admin/matches" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <Target size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Matches</span>
                        </Link>
                        <Link to="/admin/scouts" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <Shield size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Scouts</span>
                        </Link>
                        <Link to="/admin/users" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <Users size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Users</span>
                        </Link>
                        <Link to="/admin/kits" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <Shirt size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Kit Management</span>
                        </Link>
                        <Link to="/admin/kit-requests" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center justify-between border border-transparent hover:border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                              <Package size={18} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <span>Kit Requests</span>
                          </div>
                          {pendingKitRequestsCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                              {pendingKitRequestsCount}
                            </span>
                          )}
                        </Link>
                        <Link to="/compare" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                          <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                            <BarChart2 size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>Compare</span>
                        </Link>
                        <Link to="/create" className="group block px-4 py-3 rounded-xl text-base font-bold bg-elkawera-accent/20 text-elkawera-accent hover:bg-elkawera-accent hover:text-black transition-all duration-300 flex items-center gap-3 border border-elkawera-accent/30 hover:border-elkawera-accent shadow-lg hover:shadow-elkawera-accent/25">
                          <div className="w-8 h-8 rounded-lg bg-elkawera-accent/30 group-hover:bg-black/20 flex items-center justify-center transition-all duration-300">
                            <Plus size={18} className="group-hover:scale-110 transition-transform" />
                          </div>
                          <span>New Card</span>
                        </Link>
                      </div>
                    )}

                    {/* GENERAL Section */}
                    <div className="space-y-2">
                      <div className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                        General
                      </div>
                      <Link to="/profile" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <User size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Profile</span>
                      </Link>
                      <Link to="/settings" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <Settings size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Settings</span>
                      </Link>
                      <Link to="/about" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <Info size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>About US</span>
                      </Link>
                      <Link to="/contact" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Contact Us</span>
                      </Link>
                      
                      <button
                        onClick={handleSignOut}
                        className="group block w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-red-500/20"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-all duration-300">
                          <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest User Section */}
                    <div className="space-y-2">
                      <div className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                        Get Started
                      </div>
                      <Link to="/login" className="group block px-4 py-3 rounded-xl text-base font-bold text-white hover:bg-white/10 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/20">
                        <div className="w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-all duration-300">
                          <UserIcon size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Sign In</span>
                      </Link>
                      <Link to="/signup" className="group block px-4 py-3 rounded-xl text-base font-bold bg-elkawera-accent/20 text-elkawera-accent hover:bg-elkawera-accent hover:text-black transition-all duration-300 flex items-center gap-3 border border-elkawera-accent/30 hover:border-elkawera-accent shadow-lg hover:shadow-elkawera-accent/25">
                        <div className="w-8 h-8 rounded-lg bg-elkawera-accent/30 group-hover:bg-black/20 flex items-center justify-center transition-all duration-300">
                          <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Sign Up</span>
                      </Link>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="px-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3">
                        Info
                      </div>
                      <Link to="/about" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <Info size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>About US</span>
                      </Link>
                      <Link to="/contact" className="group block px-4 py-3 rounded-xl text-base font-medium text-gray-300 hover:text-[var(--text-primary)] hover:bg-white/5 transition-all duration-300 flex items-center gap-3 border border-transparent hover:border-white/10">
                        <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-elkawera-accent/20 flex items-center justify-center transition-all duration-300">
                          <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span>Contact Us</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        <main className={`flex-grow w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in-up ${showSidebar ? 'max-w-full' : 'max-w-7xl'}`}>
          {children}
        </main>

        <footer className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] mt-auto backdrop-blur-sm">
          <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-xs sm:text-sm font-medium">
              © {new Date().getFullYear()} ELKAWERA. Made With ELKAWERA TECH TEAM.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

