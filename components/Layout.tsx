
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, Settings, ChevronDown, BarChart2, Gamepad2, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllPlayerRegistrationRequests, subscribeToChanges } from '../utils/db';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path
    ? "text-elkawera-accent bg-white/10"
    : "text-gray-400 hover:text-white hover:bg-white/5";

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  // Fetch pending requests count for admins
  useEffect(() => {
    const loadPendingCount = async () => {
      if (user && user.role === 'admin') {
        const requests = await getAllPlayerRegistrationRequests();
        const pending = requests.filter(r => r.status === 'pending');
        setPendingRequestsCount(pending.length);
      }
    };

    loadPendingCount();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToChanges(() => {
      loadPendingCount();
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-elkawera-black bg-mesh bg-no-repeat bg-fixed bg-cover overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-elkawera-black/70 border-b border-white/10 supports-[backdrop-filter]:bg-elkawera-black/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0 flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-2xl font-display font-bold italic tracking-tighter text-white group-hover:scale-105 transition-transform duration-300">
                ELKAWERA<span className="text-elkawera-accent">.</span>
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-2">
                <Link to="/" className={`${isActive('/')} px-4 py-2 rounded-full text-sm font-bold transition-all duration-300`}>Home</Link>

                {user && (
                  <>
                    <Link to="/dashboard" className={`${isActive('/dashboard')} px-4 py-2 rounded-full text-sm font-bold transition-all duration-300`}>Dashboard</Link>
                    {user.role === 'admin' && (
                      <Link to="/new-players" className={`${isActive('/new-players')} px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1 relative`}>
                        <User size={14} /> New Players
                        {pendingRequestsCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-lg">
                            {pendingRequestsCount}
                          </span>
                        )}
                      </Link>
                    )}
                    <Link to="/teams" className={`${isActive('/teams')} px-4 py-2 rounded-full text-sm font-bold transition-all duration-300`}>Teams</Link>
                    {user.role === 'admin' && (
                      <>
                        <Link to="/match-sim" className={`${isActive('/match-sim')} px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}>
                          <Gamepad2 size={14} /> Match Sim
                        </Link>
                        <Link to="/compare" className={`${isActive('/compare')} px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1`}>
                          <BarChart2 size={14} /> Compare
                        </Link>
                        <div className="w-px h-6 bg-white/10 mx-2"></div>
                        <Link to="/create" className="bg-elkawera-accent text-elkawera-black hover:bg-white px-5 py-2 rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                          + New Card
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Auth Buttons (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-white/5 px-3 py-2 rounded-full transition-all duration-300 border border-transparent hover:border-white/10"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/20 flex items-center justify-center text-white shadow-sm overflow-hidden">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={14} />
                      )}
                    </div>
                    <span className="text-sm font-bold text-white max-w-[100px] truncate">{user.name}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-[#111827] border border-white/10 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-100 z-50">
                      <div className="px-4 py-3 border-b border-white/5 mb-1">
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Signed in as</p>
                        <p className="text-sm text-white font-bold truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings size={16} /> My Profile
                      </Link>

                      <div className="border-t border-white/5 mt-1 pt-1">
                        <button
                          onClick={() => { handleSignOut(); setProfileDropdownOpen(false); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-colors"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">Sign In</Link>
                  <Link to="/signup" className="text-sm font-bold bg-white/10 border border-white/20 px-5 py-2.5 rounded-full hover:bg-white hover:text-black transition-all">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-elkawera-green focus:outline-none"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-elkawera-black border-b border-elkawera-green animate-in slide-in-from-top-5">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-elkawera-green">Home</Link>

              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-elkawera-green">Dashboard</Link>
                  {user.role === 'admin' && (
                    <Link to="/new-players" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-elkawera-green flex items-center justify-between">
                      New Players
                      {pendingRequestsCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link to="/teams" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-elkawera-green">Teams</Link>
                  {user.role === 'admin' && (
                    <>
                      <Link to="/match-sim" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-elkawera-green">Match Sim</Link>
                      <Link to="/compare" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-elkawera-green">Compare</Link>
                      <Link to="/create" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-elkawera-accent hover:bg-elkawera-green">Create Card</Link>
                    </>
                  )}
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-elkawera-green">My Profile</Link>
                  <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-elkawera-green">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-elkawera-green">Sign In</Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-elkawera-accent hover:bg-elkawera-green">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        {children}
      </main>

      <footer className="bg-elkawera-black border-t border-elkawera-green mt-auto backdrop-blur-sm">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} ELKAWERA. The Ultimate Player Card Manager.
          </p>
        </div>
      </footer>
    </div>
  );
};
