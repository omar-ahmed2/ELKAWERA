
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllPlayers, getAllTeams, getPlayerById } from '../utils/db';
import { User, Shield, Users, Save, Calendar, Mail, Camera, Upload, RotateCcw } from 'lucide-react';
import { Player } from '../types';
import { PlayerCard } from '../components/PlayerCard';

export const Profile: React.FC = () => {
   const { user, updateProfile } = useAuth();
   const [stats, setStats] = useState({ players: 0, teams: 0 });
   const [isEditing, setIsEditing] = useState(false);
   const [name, setName] = useState(user?.name || '');
   const [imagePreview, setImagePreview] = useState<string | undefined>(user?.profileImageUrl);
   const [loading, setLoading] = useState(false);
   const [playerCard, setPlayerCard] = useState<Player | undefined>(undefined);
   const [isFlipped, setIsFlipped] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      const fetchData = async () => {
         const [p, t] = await Promise.all([getAllPlayers(), getAllTeams()]);
         setStats({ players: p.length, teams: t.length });

         if (user?.playerCardId) {
            try {
               const card = await getPlayerById(user.playerCardId);
               if (card) setPlayerCard(card);
            } catch (error) {
               console.error("Error fetching player card:", error);
            }
         }
      };
      fetchData();
   }, [user]);

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         if (file.size > 2 * 1024 * 1024) {
            alert("Image size must be less than 2MB");
            return;
         }
         const reader = new FileReader();
         reader.onloadend = () => {
            setImagePreview(reader.result as string);
         };
         reader.readAsDataURL(file);
      }
   };

   const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;

      setLoading(true);
      // Pass imagePreview. If it hasn't changed, it's the old url. If changed, it's new base64.
      await updateProfile(name, imagePreview);
      setLoading(false);
      setIsEditing(false);
   };

   if (!user) return null;

   const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
   });

   return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
         <div className="flex items-center justify-between">
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight">
               {user.role === 'admin' ? 'Manager Profile' : 'My Profile'}
            </h1>
         </div>

         <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Card / Player Card */}
            <div className="md:col-span-1 space-y-6">
               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-elkawera-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative mx-auto mb-4 w-32 h-32">
                     <div className="w-full h-full bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center border-4 border-white/10 shadow-lg overflow-hidden relative z-10">
                        {imagePreview ? (
                           <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                           <User size={48} className="text-white" />
                        )}
                     </div>

                     {isEditing && (
                        <button
                           onClick={() => fileInputRef.current?.click()}
                           className="absolute bottom-0 right-0 bg-elkawera-accent text-black p-2 rounded-full shadow-lg hover:bg-white transition-colors z-20 border-2 border-black"
                           title="Upload Photo"
                        >
                           <Camera size={16} />
                        </button>
                     )}
                     <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                     />
                  </div>

                  <h2 className="text-xl font-bold text-white mb-1 relative z-10">{user.name}</h2>
                  <p className="text-sm text-gray-400 mb-6 relative z-10 capitalize">{user.role}</p>

                  <div className="text-xs text-gray-500 uppercase tracking-widest border-t border-white/10 pt-4 relative z-10">
                     Member Since <br /> <span className="text-elkawera-accent font-bold">{joinDate}</span>
                  </div>
               </div>

               {/* Display Player Card if available */}
               {playerCard && (
                  <div className="relative">
                     <h3 className="text-sm font-bold uppercase text-gray-400 mb-3 text-center">My Player Card</h3>
                     <div className="flex justify-center">
                        <div className="scale-75 origin-top -mb-16">
                           <PlayerCard
                              player={playerCard}
                              uniqueId="profile-card"
                              isFlipped={isFlipped}
                              onFlip={() => setIsFlipped(!isFlipped)}
                           />
                        </div>
                     </div>
                     <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="absolute top-8 right-0 p-2 bg-black/60 rounded-full hover:bg-black/80 text-white z-20 border border-white/20"
                        title="Flip Card"
                     >
                        <RotateCcw size={14} />
                     </button>
                  </div>
               )}
            </div>

            {/* Settings & Stats */}
            <div className="md:col-span-2 space-y-6">

               {/* Stats Grid */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                        <Users size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-display font-bold text-white">{stats.players}</div>
                        <div className="text-xs uppercase text-gray-400 font-bold">Total Players</div>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                     <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                        <Shield size={24} />
                     </div>
                     <div>
                        <div className="text-2xl font-display font-bold text-white">{stats.teams}</div>
                        <div className="text-xs uppercase text-gray-400 font-bold">Active Teams</div>
                     </div>
                  </div>
               </div>

               {/* Edit Form */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold uppercase">Account Details</h3>
                     <button
                        onClick={() => {
                           setIsEditing(!isEditing);
                           // Reset image preview if canceling
                           if (isEditing) setImagePreview(user.profileImageUrl);
                        }}
                        className="text-xs text-elkawera-accent hover:underline uppercase font-bold"
                     >
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                     </button>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-6">
                     <div>
                        <label className="flex items-center gap-2 text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                           <User size={14} /> Name
                        </label>
                        <input
                           type="text"
                           value={name}
                           disabled={!isEditing}
                           onChange={(e) => setName(e.target.value)}
                           className={`w-full bg-black/50 border rounded-xl p-4 text-white focus:outline-none transition-colors ${isEditing ? 'border-elkawera-accent/50 focus:border-elkawera-accent' : 'border-white/10 text-gray-400 cursor-not-allowed'}`}
                        />
                     </div>

                     <div>
                        <label className="flex items-center gap-2 text-xs uppercase text-gray-400 mb-2 font-bold tracking-wider">
                           <Mail size={14} /> Email Address
                        </label>
                        <div className="w-full bg-black/30 border border-white/5 rounded-xl p-4 text-gray-500 cursor-not-allowed">
                           {user.email}
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2 ml-1">* Email cannot be changed.</p>
                     </div>

                     {/* Role Switcher (For Testing/Demo) */}
                     <div className="pt-4 border-t border-white/10">
                        <label className="flex items-center gap-2 text-xs uppercase text-elkawera-accent mb-2 font-bold tracking-wider">
                           <Shield size={14} /> Role (Debug/Test)
                        </label>
                        <select
                           value={user.role}
                           onChange={(e) => {
                              if (window.confirm(`Switch role to ${e.target.value}? Page will reload.`)) {
                                 updateProfile(user.name, undefined, e.target.value as any);
                                 setTimeout(() => window.location.reload(), 500);
                              }
                           }}
                           className="w-full bg-black/50 border border-elkawera-accent/30 rounded-xl p-3 text-white focus:outline-none focus:border-elkawera-accent"
                        >
                           <option value="player">Player</option>
                           <option value="captain">Captain</option>
                           <option value="admin">Admin</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-2 ml-1">
                           * Use this to switch roles and test different features (Captain Dashboard, Admin Matches, etc.)
                        </p>
                     </div>

                     {isEditing && (
                        <div className="pt-2 animate-fade-in-up">
                           <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-3 bg-elkawera-accent text-black font-bold uppercase rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2"
                           >
                              <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                           </button>
                        </div>
                     )}
                  </form>
               </div>
            </div>
         </div>
      </div>
   );
};
