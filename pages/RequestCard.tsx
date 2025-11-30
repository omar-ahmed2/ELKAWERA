import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { savePlayerRegistrationRequest } from '../utils/db';
import { Position } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const RequestCard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || '');
    const [age, setAge] = useState<number>(user?.age || 18);
    const [height, setHeight] = useState<number>(user?.height || 175);
    const [weight, setWeight] = useState<number>(user?.weight || 70);
    const [strongFoot, setStrongFoot] = useState<'Left' | 'Right'>(user?.strongFoot || 'Right');
    const [position, setPosition] = useState<Position>(user?.position || 'ST');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');
        setSubmitting(true);

        try {
            // Create registration request for admins
            const registrationRequest = {
                id: uuidv4(),
                userId: user.id,
                name,
                email: user.email,
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
            setError(typeof err === 'string' ? err : 'Request failed. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm animate-fade-in-up">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Request Player Card</h1>
                        <p className="text-gray-400 text-sm">Submit your details to get a new card.</p>
                    </div>
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
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                            placeholder="e.g. Mohamed Salah"
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
                                <option value="ST">ST</option>
                                <option value="CF">CF</option>
                                <option value="LW">LW</option>
                                <option value="RW">RW</option>
                            </optgroup>
                            <optgroup label="Midfield">
                                <option value="CAM">CAM</option>
                                <option value="CM">CM</option>
                                <option value="CDM">CDM</option>
                                <option value="LM">LM</option>
                                <option value="RM">RM</option>
                            </optgroup>
                            <optgroup label="Defense">
                                <option value="CB">CB</option>
                                <option value="LB">LB</option>
                                <option value="RB">RB</option>
                                <option value="LWB">LWB</option>
                                <option value="RWB">RWB</option>
                            </optgroup>
                            <optgroup label="Goalkeeper">
                                <option value="GK">GK</option>
                            </optgroup>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : <><UserPlus size={20} /> Submit Request</>}
                    </button>
                </form>
            </div>
        </div>
    );
};
