
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedRegistrationForm } from '@/components/EnhancedRegistrationForm';
import { savePlayerRegistrationRequest } from '@/utils/db';
import { Position } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/types';

export const SignUp: React.FC = () => {
    const { signUp, user } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.role === 'captain') navigate('/captain/dashboard');
            else if (user.role === 'scout') navigate('/scout/dashboard');
            else navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (formData: any) => {
        setIsSubmitting(true);
        setError('');

        try {
            // First, create the user account
            const newUser = await signUp(
                formData.name,
                formData.email,
                formData.password,
                formData.phone,
                formData.age,
                formData.height,
                formData.weight,
                formData.strongFoot,
                formData.position,
                'player'
            );

            // Only after successful account creation, send registration request to admin
            const registrationRequest = {
                id: uuidv4(),
                userId: newUser.id,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                age: formData.age,
                height: formData.height,
                weight: formData.weight,
                strongFoot: formData.strongFoot,
                position: formData.position,
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
        } finally {
            setIsSubmitting(false);
        }
    };

    const additionalFields = (
        <>
            <div>
                <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Age</label>
                <input
                    type="number"
                    name="age"
                    min="16"
                    max="50"
                    required
                    defaultValue={18}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Height (cm)</label>
                <input
                    type="number"
                    name="height"
                    min="150"
                    max="220"
                    required
                    defaultValue={175}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Weight (kg)</label>
                <input
                    type="number"
                    name="weight"
                    min="50"
                    max="120"
                    required
                    defaultValue={70}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                />
            </div>
            <div>
                <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Strong Foot</label>
                <select
                    name="strongFoot"
                    required
                    defaultValue="Right"
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                >
                    <option value="Right">Right</option>
                    <option value="Left">Left</option>
                </select>
            </div>
            <div>
                <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Position</label>
                <select
                    name="position"
                    required
                    defaultValue="CF"
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
        </>
    );

    return (
        <EnhancedRegistrationForm
            role="player"
            onSubmit={handleSubmit}
            title="Join the League"
            subtitle="Create your player account to get started."
            additionalFields={additionalFields}
        />
    );
};

