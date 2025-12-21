
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';
import { savePlayerRegistrationRequest } from '../utils/db';
import { Position } from '../types';
import { v4 as uuidv4 } from 'uuid';

import { UserRole } from '../types';

export const SignUp: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState<number>(18);
    const [height, setHeight] = useState<number>(175);
    const [weight, setWeight] = useState<number>(70);
    const [strongFoot, setStrongFoot] = useState<'Left' | 'Right'>('Right');
    const [position, setPosition] = useState<Position>('CF');
    const role: UserRole = 'player';
    const [error, setError] = useState('');
    const { signUp, user } = useAuth();
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
            // Create account with selected role
            const newUser = await signUp(name, email, password, age, height, weight, strongFoot, position, role);

            // Create registration request for admins (needed for both players and captains to get a card)
            const registrationRequest = {
                id: uuidv4(),
                userId: newUser.id,
                name,
                email,
                age,
                height,
                weight,
                strongFoot,
                position,
                status: 'pending' as const,
                createdAt: Date.now()
            };

            await savePlayerRegistrationRequest(registrationRequest);
            navigate('/dashboard');
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
                    <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Join the League</h1>
                    <p className="text-gray-400 mt-2">Create your account to get started.</p>
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
                            name="name"
                            autoComplete="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                            placeholder="e.g. Mohamed Salah"
                        />
                    </div>
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
                            placeholder="player@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Password</label>
                        <input
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Age</label>
                            <input
                                type="number"
                                min="16"
                                max="50"
                                required
                                value={age}
                                onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Height (cm)</label>
                            <input
                                type="number"
                                min="150"
                                max="220"
                                required
                                value={height}
                                onChange={(e) => setHeight(parseInt(e.target.value) || 175)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Weight (kg)</label>
                            <input
                                type="number"
                                min="50"
                                max="120"
                                required
                                value={weight}
                                onChange={(e) => setWeight(parseInt(e.target.value) || 70)}
                                className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Strong Foot</label>
                            <select
                                required
                                value={strongFoot}
                                onChange={(e) => setStrongFoot(e.target.value as 'Left' | 'Right')}
                                className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                            >
                                <option value="Right">Right</option>
                                <option value="Left">Left</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Position</label>
                        <select
                            required
                            value={position}
                            onChange={(e) => setPosition(e.target.value as Position)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                        >
                            <optgroup label="Forward">
                                <option value="CF">CF</option>
                            </optgroup>
                            <optgroup label="Defense">
                                <option value="CB">CB</option>
                            </optgroup>
                            <optgroup label="Goalkeeper">
                                <option value="GK">GK</option>
                            </optgroup>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2"
                    >
                        <UserPlus size={20} /> Register as {role}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account? <Link to="/login" className="text-elkawera-accent hover:underline font-bold">Sign In</Link>
                </div>
                <div className="mt-4 text-center text-sm text-gray-400">
                    Want to create a team? <Link to="/signup/captain" className="text-elkawera-accent hover:underline font-bold">Captain Sign-Up</Link>
                </div>
                <div className="mt-2 text-center text-sm text-gray-400">
                    Are you a scout? <Link to="/signup/scout" className="text-elkawera-accent hover:underline font-bold">Scout Sign-Up</Link>
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 text-center">
                    Your registration will be sent to admins. They will create your player card.
                </div>
            </div>
        </div>
    );
};
