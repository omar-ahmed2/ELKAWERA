
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPlayerById, savePlayer } from '../utils/db';
import { computeOverall, getCardType, computeOverallWithPerformance } from '../utils/calculation';
import { Player, PhysicalStats } from '../types';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PostMatchStats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PhysicalStats | null>(null);
  const [matchPerformance, setMatchPerformance] = useState({ goals: 0, assists: 0, matches: 0 });

  useEffect(() => {
    // Only admins can update player stats
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    if (id) {
      getPlayerById(id).then(p => {
        if (p) {
          setPlayer(p);
          setStats(p.stats);
          setMatchPerformance({ goals: p.goals || 0, assists: p.assists || 0, matches: p.matchesPlayed || 0 });
        }
      });
    }
  }, [id, user, navigate]);

  const handleStatChange = (key: keyof PhysicalStats, value: number) => {
    if (stats) {
      setStats({ ...stats, [key]: Number(value) });
    }
  };

  const saveStats = async () => {
    if (player && stats) {
      const baseScore = computeOverall(stats, player.position);
      const newScore = computeOverallWithPerformance(baseScore, matchPerformance.goals, matchPerformance.assists, matchPerformance.matches);
      const newType = getCardType(newScore);

      const updatedPlayer = {
        ...player,
        stats,
        goals: matchPerformance.goals,
        assists: matchPerformance.assists,
        matchesPlayed: matchPerformance.matches,
        overallScore: newScore,
        cardType: newType,
        updatedAt: Date.now()
      };

      await savePlayer(updatedPlayer);
      navigate('/dashboard');
    }
  };

  if (!player || !stats) return <div>Loading...</div>;

  const Slider = ({ label, statKey }: { label: string, statKey: keyof PhysicalStats }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <label className="text-sm uppercase font-bold text-gray-300">{label}</label>
        <span className="text-elkawera-accent font-mono font-bold">{stats[statKey]}</span>
      </div>
      <input
        type="range"
        min="1"
        max="99"
        value={stats[statKey]}
        onChange={(e) => handleStatChange(statKey, parseInt(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-elkawera-accent"
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-display font-bold uppercase">Post-Match Analysis</h1>
          <p className="text-gray-400">Update stats for <span className="text-white font-bold">{player.name}</span></p>
        </div>
      </div>

      <div className="bg-white/5 p-8 rounded-2xl border border-white/10 mb-8">
        <h3 className="text-xl font-bold mb-6 text-elkawera-accent border-b border-white/10 pb-2">Season Stats</h3>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <label className="block text-sm uppercase font-bold text-gray-300 mb-2">Total Goals</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              lang="en"
              value={matchPerformance.goals}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setMatchPerformance(prev => ({ ...prev, goals: parseInt(val) || 0 }));
              }}
              className="w-full bg-black/50 border border-white/20 rounded-lg p-4 text-2xl font-bold text-white focus:border-elkawera-accent focus:outline-none text-center"
            />
          </div>
          <div>
            <label className="block text-sm uppercase font-bold text-gray-300 mb-2">Total Assists</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              lang="en"
              value={matchPerformance.assists}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setMatchPerformance(prev => ({ ...prev, assists: parseInt(val) || 0 }));
              }}
              className="w-full bg-black/50 border border-white/20 rounded-lg p-4 text-2xl font-bold text-white focus:border-elkawera-accent focus:outline-none text-center"
            />
          </div>
          <div>
            <label className="block text-sm uppercase font-bold text-gray-300 mb-2">Matches Played</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              lang="en"
              value={matchPerformance.matches}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setMatchPerformance(prev => ({ ...prev, matches: parseInt(val) || 0 }));
              }}
              className="w-full bg-black/50 border border-white/20 rounded-lg p-4 text-2xl font-bold text-white focus:border-elkawera-accent focus:outline-none text-center"
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 bg-white/5 p-8 rounded-2xl border border-white/10">
        <div>
          <h3 className="text-xl font-bold mb-6 text-elkawera-accent border-b border-white/10 pb-2">Offensive & Skill</h3>
          <Slider label="Pace / Sprint Speed" statKey="pace" />
          <Slider label="Shooting" statKey="shooting" />
          <Slider label="Passing" statKey="passing" />
          <Slider label="Dribbling" statKey="dribbling" />
          <Slider label="Agility" statKey="agility" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-6 text-elkawera-accent border-b border-white/10 pb-2">Physical & Defensive</h3>
          <Slider label="Defending" statKey="defending" />
          <Slider label="Physical / Strength" statKey="physical" />
          <Slider label="Stamina" statKey="stamina" />
          <Slider label="Acceleration" statKey="acceleration" />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="bg-black/30 p-4 rounded-lg mr-4 border border-white/10">
          <span className="text-gray-400 text-sm uppercase block">Projected Overall</span>
          <span className="text-3xl font-display font-bold text-white">
            {computeOverallWithPerformance(
              computeOverall(stats, player.position),
              matchPerformance.goals,
              matchPerformance.assists,
              matchPerformance.matches
            )}
          </span>
        </div>
        <button
          onClick={saveStats}
          className="px-8 py-4 bg-elkawera-accent text-black font-bold uppercase rounded hover:bg-white transition-colors flex items-center gap-2"
        >
          <CheckCircle size={20} /> Confirm Updates
        </button>
      </div>
    </div>
  );
};
