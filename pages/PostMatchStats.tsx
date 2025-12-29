
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPlayerById, savePlayer } from '../utils/db';
import { computeOverallWithPerformance, getCardType } from '../utils/calculation';
import { Player } from '../types';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Extracted components to prevent re-render focus loss
const StatInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: string) => void }) => (
  <div>
    <label className="block text-xs uppercase font-bold text-gray-400 mb-2">{label}</label>
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-xl font-bold text-white focus:border-elkawera-accent focus:outline-none text-center"
    />
  </div>
);



export const PostMatchStats: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [player, setPlayer] = useState<Player | null>(null);

  const [matchPerformance, setMatchPerformance] = useState({
    goals: 0,
    assists: 0,
    matches: 0,
    defensiveContributions: 0,
    cleanSheets: 0,
    saves: 0,
    penaltySaves: 0,
    ownGoals: 0,
    goalsConceded: 0,
    penaltyMissed: 0
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    if (id) {
      getPlayerById(id).then(p => {
        if (p) {
          setPlayer(p);

          setMatchPerformance({
            goals: p.goals || 0,
            assists: p.assists || 0,
            matches: p.matchesPlayed || 0,
            defensiveContributions: p.defensiveContributions || 0,
            cleanSheets: p.cleanSheets || 0,
            saves: p.saves || 0,
            penaltySaves: p.penaltySaves || 0,
            ownGoals: p.ownGoals || 0,
            goalsConceded: p.goalsConceded || 0,
            penaltyMissed: p.penaltyMissed || 0,
          });
        }
      });
    }
  }, [id, user, navigate]);



  const handlePerformanceChange = (key: keyof typeof matchPerformance, val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, '')) || 0;
    setMatchPerformance(prev => ({ ...prev, [key]: num }));
  };

  const saveStats = async () => {
    if (player) {
      const newScore = computeOverallWithPerformance(
        player.overallScore,
        player.position,
        {
          goals: matchPerformance.goals,
          assists: matchPerformance.assists,
          matchesPlayed: matchPerformance.matches,
          defensiveContributions: matchPerformance.defensiveContributions,
          cleanSheets: matchPerformance.cleanSheets,
          saves: matchPerformance.saves,
          penaltySaves: matchPerformance.penaltySaves,
          ownGoals: matchPerformance.ownGoals,
          goalsConceded: matchPerformance.goalsConceded,
          penaltyMissed: matchPerformance.penaltyMissed
        }
      );

      const newType = getCardType(newScore);


      const updatedPlayer: Player = {
        ...player,
        goals: matchPerformance.goals,

        assists: matchPerformance.assists,
        matchesPlayed: matchPerformance.matches,
        defensiveContributions: matchPerformance.defensiveContributions,
        cleanSheets: matchPerformance.cleanSheets,
        saves: matchPerformance.saves,
        penaltySaves: matchPerformance.penaltySaves,
        ownGoals: matchPerformance.ownGoals,
        goalsConceded: matchPerformance.goalsConceded,
        penaltyMissed: matchPerformance.penaltyMissed,
        overallScore: newScore,
        cardType: newType,
        updatedAt: Date.now()
      };

      await savePlayer(updatedPlayer);
      navigate('/dashboard');
    }
  };

  if (!player) return <div>Loading...</div>;


  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard')} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-display font-bold uppercase">Post-Match Analysis</h1>
          <p className="text-gray-400">Update stats for <span className="text-white font-bold">{player.name} ({player.position})</span></p>
        </div>
      </div>

      <div className="bg-white/5 p-8 rounded-2xl border border-white/10 mb-8">
        <h3 className="text-xl font-bold mb-6 text-elkawera-accent border-b border-white/10 pb-2">Season Stats</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <StatInput label="Matches Played" value={matchPerformance.matches} onChange={(v) => handlePerformanceChange('matches', v)} />
          <StatInput label="Goals" value={matchPerformance.goals} onChange={(v) => handlePerformanceChange('goals', v)} />
          <StatInput label="Assists" value={matchPerformance.assists} onChange={(v) => handlePerformanceChange('assists', v)} />
          <StatInput label="Def. Contributions" value={matchPerformance.defensiveContributions} onChange={(v) => handlePerformanceChange('defensiveContributions', v)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <StatInput label="Clean Sheets" value={matchPerformance.cleanSheets} onChange={(v) => handlePerformanceChange('cleanSheets', v)} />
          <StatInput label="Saves" value={matchPerformance.saves} onChange={(v) => handlePerformanceChange('saves', v)} />
          <StatInput label="Penalty Saves" value={matchPerformance.penaltySaves} onChange={(v) => handlePerformanceChange('penaltySaves', v)} />
          <StatInput label="Goals Conceded" value={matchPerformance.goalsConceded} onChange={(v) => handlePerformanceChange('goalsConceded', v)} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatInput label="Own Goals" value={matchPerformance.ownGoals} onChange={(v) => handlePerformanceChange('ownGoals', v)} />
          <StatInput label="Penalty Missed" value={matchPerformance.penaltyMissed} onChange={(v) => handlePerformanceChange('penaltyMissed', v)} />
        </div>
      </div>



      <div className="mt-8 flex justify-end">
        <div className="bg-black/30 p-4 rounded-lg mr-4 border border-white/10">
          <span className="text-gray-400 text-sm uppercase block">Projected Overall</span>
          <span className="text-3xl font-display font-bold text-white">
            {computeOverallWithPerformance(
              player.overallScore,
              player.position,
              {
                goals: matchPerformance.goals,
                assists: matchPerformance.assists,
                matchesPlayed: matchPerformance.matches,
                defensiveContributions: matchPerformance.defensiveContributions,
                cleanSheets: matchPerformance.cleanSheets,
                saves: matchPerformance.saves,
                penaltySaves: matchPerformance.penaltySaves,
                ownGoals: matchPerformance.ownGoals,
                goalsConceded: matchPerformance.goalsConceded,
                penaltyMissed: matchPerformance.penaltyMissed
              }
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
