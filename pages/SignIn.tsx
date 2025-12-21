
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, user } = useAuth();
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
      const loggedInUser = await signIn(email, password);
      if (loggedInUser) {
        if (loggedInUser.role === 'captain') navigate('/captain/dashboard');
        else if (loggedInUser.role === 'scout') navigate('/scout/dashboard');
        else navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Sign in to manage your ELKAWERA cards.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Email Address</label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
              placeholder="manager@elkawera.com"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Password</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2"
          >
            <LogIn size={20} /> Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="text-elkawera-accent hover:underline font-bold">Create Club Account</Link>
        </div>
      </div>
    </div>
  );
};