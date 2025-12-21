
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Briefcase, Building2, MapPin } from 'lucide-react';
import { registerScout } from '../utils/db';
import { ScoutType } from '../types';

export const ScoutSignUp: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [scoutType, setScoutType] = useState<ScoutType>('Independent');
    const [organization, setOrganization] = useState('');

    const [error, setError] = useState('');
    const { user, signIn } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'captain') navigate('/captain/dashboard');
            else if (user.role === 'scout') navigate('/scout/dashboard');
            else navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await registerScout(name, email, phone, password, scoutType, organization);
            // Auto login after registration
            await signIn(email, password);
            navigate('/scout/dashboard');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(typeof err === 'string' ? err : 'Registration failed');
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Scout Registration</h1>
                    <p className="text-gray-400 mt-2">Discover talent. Track performance. Build the future.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            placeholder="e.g. Hassan Ahmed"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            placeholder="scout@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            placeholder="+20 1xxxxxxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4">
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider flex items-center gap-2">
                            <Briefcase size={14} /> Scout Type
                        </label>
                        <select
                            value={scoutType}
                            onChange={(e) => setScoutType(e.target.value as ScoutType)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                        >
                            <option value="Independent">Independent Scout</option>
                            <option value="Club">Club / Academy Scout</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider flex items-center gap-2">
                            {scoutType === 'Club' ? <Building2 size={14} /> : <MapPin size={14} />}
                            {scoutType === 'Club' ? 'Club / Academy Name' : 'City / Region'} (Optional)
                        </label>
                        <input
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none transition-colors"
                            placeholder={scoutType === 'Club' ? "e.g. Al Ahly Academy" : "e.g. Cairo"}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase rounded-xl transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
                    >
                        <UserPlus size={20} /> Register as Scout
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-purple-400 hover:underline font-bold">Sign In</Link>
                </div>
                <div className="mt-4 text-center text-sm text-gray-400 space-x-4">
                    <Link to="/signup" className="text-gray-500 hover:text-white transition-colors">Player Sign-Up</Link>
                    <span>|</span>
                    <Link to="/signup/captain" className="text-gray-500 hover:text-white transition-colors">Captain Sign-Up</Link>
                </div>
            </div>
        </div>
    );
};
