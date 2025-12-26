
import React, { useState, useEffect } from 'react';
import { getAllPlayers, getAllTeams } from '../utils/db';
import { Player, Team } from '../types';
import { Shield, User, Users, ChevronDown, Save } from 'lucide-react';

interface PositionSlot {
  id: string;
  label: string;
  top: string;
  left: string;
  player?: Player;
}

const FORMATIONS = {
  '4-4-2': [
    { id: 'GK', label: 'GK', top: '88%', left: '50%' },
    { id: 'LB', label: 'LB', top: '70%', left: '15%' },
    { id: 'LCB', label: 'CB', top: '75%', left: '35%' },
    { id: 'RCB', label: 'CB', top: '75%', left: '65%' },
    { id: 'RB', label: 'RB', top: '70%', left: '85%' },
    { id: 'LM', label: 'LM', top: '45%', left: '15%' },
    { id: 'LCM', label: 'CM', top: '50%', left: '35%' },
    { id: 'RCM', label: 'CM', top: '50%', left: '65%' },
    { id: 'RM', label: 'RM', top: '45%', left: '85%' },
    { id: 'LST', label: 'CF', top: '15%', left: '35%' },
    { id: 'RST', label: 'CF', top: '15%', left: '65%' },
  ],
  '4-3-3': [
    { id: 'GK', label: 'GK', top: '88%', left: '50%' },
    { id: 'LB', label: 'LB', top: '70%', left: '15%' },
    { id: 'LCB', label: 'CB', top: '75%', left: '35%' },
    { id: 'RCB', label: 'CB', top: '75%', left: '65%' },
    { id: 'RB', label: 'RB', top: '70%', left: '85%' },
    { id: 'CDM', label: 'CDM', top: '55%', left: '50%' },
    { id: 'LCM', label: 'CM', top: '45%', left: '30%' },
    { id: 'RCM', label: 'CM', top: '45%', left: '70%' },
    { id: 'LW', label: 'LW', top: '20%', left: '15%' },
    { id: 'CF', label: 'CF', top: '15%', left: '50%' },
    { id: 'RW', label: 'RW', top: '20%', left: '85%' },
  ],
};

export const Tactics: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [formation, setFormation] = useState<keyof typeof FORMATIONS>('4-4-2');
  const [lineup, setLineup] = useState<Record<string, Player>>({});
  const [draggingPlayer, setDraggingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    getAllPlayers().then(setPlayers);
    getAllTeams().then(setTeams);
  }, []);

  // Filter players by selected team
  const availablePlayers = selectedTeamId
    ? players.filter(p => p.teamId === selectedTeamId)
    : players;

  // Reset lineup when team changes
  useEffect(() => {
    setLineup({});
  }, [selectedTeamId]);

  const handleDragStart = (player: Player) => {
    setDraggingPlayer(player);
  };

  const handleDrop = (slotId: string) => {
    if (draggingPlayer) {
      // Remove player from any other slot first
      const newLineup = { ...lineup };
      Object.keys(newLineup).forEach(key => {
        if (newLineup[key].id === draggingPlayer.id) {
          delete newLineup[key];
        }
      });

      newLineup[slotId] = draggingPlayer;
      setLineup(newLineup);
      setDraggingPlayer(null);
    }
  };

  const handleRemovePlayer = (slotId: string) => {
    const newLineup = { ...lineup };
    delete newLineup[slotId];
    setLineup(newLineup);
  };

  const calculateSquadRating = () => {
    const playersInLineup = Object.values(lineup) as Player[];
    if (playersInLineup.length === 0) return 0;
    const total = playersInLineup.reduce((sum, p) => sum + p.overallScore, 0);
    return Math.round(total / 11); // Always divide by 11 for "true" squad rating
  };

  const activeFormation = FORMATIONS[formation];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight flex items-center gap-3">
            <Shield className="text-elkawera-accent" /> Tactics Board
          </h1>
          <p className="text-gray-400 mt-1">Drag and drop players to build your starting XI.</p>
        </div>
        <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/20">
          <span className="text-xs uppercase font-bold text-gray-400 block">Squad Rating</span>
          <span className="text-3xl font-display font-bold text-white">{calculateSquadRating()}</span>
        </div>
      </div>

      <div className="flex gap-8 flex-1 overflow-hidden">
        {/* Sidebar: Player List */}
        <div className="w-80 shrink-0 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 space-y-4">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full bg-black/50 border border-white/20 p-2 rounded-lg text-white text-sm focus:border-elkawera-accent focus:outline-none"
            >
              <option value="">All Players</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase">
              <span>Roster</span>
              <span>{availablePlayers.length} Avail</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
            {availablePlayers.map(player => {
              const isInLineup = (Object.values(lineup) as Player[]).some(p => p.id === player.id);
              return (
                <div
                  key={player.id}
                  draggable={!isInLineup}
                  onDragStart={() => handleDragStart(player)}
                  className={`p-3 rounded-lg border flex items-center justify-between transition-all ${isInLineup
                      ? 'bg-white/5 border-transparent opacity-50 cursor-not-allowed'
                      : 'bg-black/40 border-white/10 hover:border-elkawera-accent cursor-grab active:cursor-grabbing hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${player.cardType === 'Platinum' ? 'bg-cyan-900 text-cyan-200' :
                        player.cardType === 'Gold' ? 'bg-yellow-900 text-yellow-200' :
                          'bg-gray-700 text-gray-200'
                      }`}>
                      {player.overallScore}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white truncate w-32">{player.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{player.position}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pitch Area */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col">
          {/* Formation Selector */}
          <div className="absolute top-4 right-4 z-20">
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value as any)}
              className="bg-black/80 border border-white/20 text-white text-sm font-bold py-2 px-4 rounded-full focus:outline-none hover:bg-black"
            >
              <option value="4-4-2">4-4-2 Classic</option>
              <option value="4-3-3">4-3-3 Attack</option>
            </select>
          </div>

          {/* The Pitch */}
          <div className="flex-1 relative m-4 bg-[#1a472a] rounded-xl border-2 border-white/20 shadow-inner overflow-hidden">
            {/* Field Lines */}
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 border-b border-white/20"></div> {/* Halfway Line */}
              <div className="flex-1"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full"></div> {/* Center Circle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-b border-x border-white/20"></div> {/* Top Box */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t border-x border-white/20"></div> {/* Bottom Box */}

            {/* Slots */}
            {activeFormation.map((slot) => {
              const player = lineup[slot.id];
              return (
                <div
                  key={slot.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(slot.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all"
                  style={{ top: slot.top, left: slot.left }}
                >
                  {player ? (
                    <div className="group relative cursor-pointer" onClick={() => handleRemovePlayer(slot.id)}>
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-elkawera-accent shadow-[0_0_15px_rgba(0,255,157,0.5)] bg-black">
                        {player.imageUrl ? (
                          <img src={player.imageUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-elkawera-accent bg-elkawera-green"><User size={24} /></div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded text-[10px] font-bold text-white border border-white/20 whitespace-nowrap shadow-md">
                        {player.name.split(' ').pop()}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-elkawera-accent rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-white">
                        {player.overallScore}
                      </div>
                      {/* Hover Remove Icon */}
                      <div className="absolute inset-0 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <span className="text-xs font-bold">X</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center bg-black/20 hover:bg-white/10 transition-colors">
                      <span className="text-xs font-bold text-white/50">{slot.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
