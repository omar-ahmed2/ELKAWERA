import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Shield, Upload } from 'lucide-react';
import { savePlayerRegistrationRequest } from '../utils/db';
import { Position, UserRole } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number>(18);

  // Player specific state
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(70);
  const [strongFoot, setStrongFoot] = useState<'Left' | 'Right'>('Right');
  const [position, setPosition] = useState<Position>('ST');

  // Captain specific state
  const [teamName, setTeamName] = useState('');
  const [teamAbbr, setTeamAbbr] = useState('');
  const [teamLogo, setTeamLogo] = useState<string>('');

  const [role, setRole] = useState<UserRole>('player');
  const [error, setError] = useState('');
  const { signUp, signUpCaptain, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTeamLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (role === 'captain') {
        // Captain Sign Up Flow
        await signUpCaptain(name, email, password, age, teamName, teamAbbr, teamLogo);
      } else {
        // Player Sign Up Flow
        const newUser = await signUp(name, email, password, age, height, weight, strongFoot, position, role);

        // Create registration request for admins
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
      }
      navigate('/dashboard');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12">
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
          {/* Role Selection Tabs */}
          <div className="flex bg-black/30 p-1 rounded-xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => setRole('player')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase transition-all duration-300 ${role === 'player' ? 'bg-elkawera-accent text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Player
            </button>
            <button
              type="button"
              onClick={() => setRole('captain')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase transition-all duration-300 ${role === 'captain' ? 'bg-elkawera-accent text-black shadow-[0_0_15px_rgba(0,255,157,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Captain
            </button>
          </div>

          {/* Common Fields */}
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

          {/* Player Specific Fields */}
          {role === 'player' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          )}

          {/* Captain Specific Fields */}
          {role === 'captain' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-elkawera-accent/5 border border-elkawera-accent/20 rounded-xl">
                <h3 className="text-elkawera-accent font-bold uppercase text-sm mb-4 flex items-center gap-2">
                  <Shield size={16} /> Team Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Team Name</label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                      placeholder="e.g. Cairo Warriors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Team Abbreviation (3-4 chars)</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={teamAbbr}
                      onChange={(e) => setTeamAbbr(e.target.value.toUpperCase())}
                      className="w-full bg-black/50 border border-white/20 rounded-xl p-4 text-white focus:border-elkawera-accent focus:outline-none transition-colors"
                      placeholder="e.g. CWR"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">Team Logo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="team-logo-upload"
                      />
                      <label
                        htmlFor="team-logo-upload"
                        className="flex items-center justify-center w-full p-4 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-elkawera-accent hover:bg-white/5 transition-all group"
                      >
                        {teamLogo ? (
                          <div className="flex items-center gap-3">
                            <img src={teamLogo} alt="Team Logo" className="w-10 h-10 rounded-full object-cover" />
                            <span className="text-sm text-white">Logo Selected</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-white">
                            <Upload size={20} />
                            <span className="text-xs font-bold uppercase">Upload Logo</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(0,255,157,0.3)] flex items-center justify-center gap-2"
          >
            <UserPlus size={20} /> {role === 'captain' ? 'Create Team & Account' : 'Register as Player'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-elkawera-accent hover:underline font-bold">Sign In</Link>
        </div>

        {role === 'player' && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 text-center">
            Your registration will be sent to admins. They will create your player card.
          </div>
        )}
        {role === 'captain' && (
          <div className="mt-4 p-3 bg-elkawera-accent/10 border border-elkawera-accent/30 rounded-lg text-xs text-elkawera-accent text-center">
            You will be assigned as the Team Captain. You can then invite players and manage your team.
          </div>
        )}
      </div>
    </div>
  );
};
