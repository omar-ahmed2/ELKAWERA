import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { EnhancedRegistrationForm } from '@/components/EnhancedRegistrationForm';
import { saveTeam, saveCaptainStats } from '@/utils/db';
import { Team, CaptainStats } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Upload } from 'lucide-react';

export const CaptainSignUp: React.FC = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [teamLogo, setTeamLogo] = useState<string | null>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('Logo file size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setTeamLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (formData: any) => {
        setIsSubmitting(true);
        setError('');

        try {
            // First, create captain account
            const newUser = await signUp(
                formData.name,
                formData.email,
                formData.password,
                formData.phone,
                formData.age,
                undefined,
                undefined,
                undefined,
                undefined,
                'captain'
            );

            // Only after successful account creation, create team and send data to admin
            const team: Team = {
                id: uuidv4(),
                name: formData.teamName,
                shortName: formData.teamAbbreviation.toUpperCase(),
                color: formData.teamColor,
                logoUrl: teamLogo || undefined,
                captainId: newUser.id,
                captainName: formData.name,
                experiencePoints: 0,
                ranking: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                totalMatches: 0,
                createdAt: Date.now()
            };
            await saveTeam(team);

            // Initialize captain stats
            const captainStats: CaptainStats = {
                userId: newUser.id,
                matchesManaged: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                playersRecruited: 0,
                verifiedMatches: 0,
                rank: 'Bronze Captain',
                rankPoints: 0,
                createdAt: Date.now()
            };
            await saveCaptainStats(captainStats);

            navigate('/captain/dashboard');
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
                    min="18"
                    max="70"
                    required
                    defaultValue={18}
                    className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                />
            </div>

            {/* Team Information */}
            <div className="space-y-4 pt-6 border-t border-white/10">
                <h2 className="text-xl font-bold text-elkawera-accent uppercase tracking-wide">Team Information</h2>

                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Team Name</label>
                    <input
                        type="text"
                        name="teamName"
                        required
                        className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                        placeholder="e.g. Thunder FC"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                        Abbreviation (2-4 chars)
                    </label>
                    <input
                        type="text"
                        name="teamAbbreviation"
                        required
                        minLength={2}
                        maxLength={4}
                        className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors uppercase"
                        placeholder="e.g. TFC"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Team Color</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            name="teamColor"
                            defaultValue="#00ff9d"
                            className="w-20 h-12 rounded-lg cursor-pointer bg-black/50 border border-white/20"
                        />
                        <span className="text-gray-300">#00ff9d</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                        Team Logo (Optional, max 2MB)
                    </label>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-3 bg-black/50 border border-white/20 rounded-xl cursor-pointer hover:border-elkawera-accent transition-colors">
                            <Upload size={18} className="text-gray-400" />
                            <span className="text-sm text-gray-300">Upload Logo</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </label>
                        {teamLogo && (
                            <img src={teamLogo} alt="Team Logo" className="w-12 h-12 rounded-lg object-cover border border-white/20" />
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <EnhancedRegistrationForm
            role="captain"
            onSubmit={handleSubmit}
            title="Captain Sign-Up"
            subtitle="Create your team and start your journey as a captain"
            additionalFields={additionalFields}
        />
    );
};

