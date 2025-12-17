import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getAllTeams,
    saveTeam,
    getAllPlayers,
    getAllUsers,
    saveTeamInvitation,
    getPendingInvitationsForTeam,
    getTeamInvitations,
    updateInvitationStatus,
    deleteTeamInvitation, // Added
    getCaptainStats,
    subscribeToChanges,
    getPlayerById,
    savePlayer,
    getAllMatchRequests, // Added
    saveMatchRequest, // Added just in case
    rejectMatchRequest, // Added
    getPlayersByTeamId, // Added
    getMatchesByTeam, // Added
    createNotification, // Added
    confirmMatchRequestByOpponent // Added
} from '../utils/db';
import { Team, Player, TeamInvitation, CaptainStats, User, MatchRequest, Match } from '../types'; // Added MatchRequest, Match
import { v4 as uuidv4 } from 'uuid';
import { Users, PlusCircle, Send, Trophy, TrendingUp, Calendar, UserPlus, CheckCircle, XCircle, Upload, Shield, Award, Star, Edit3, Trash2, HelpCircle } from 'lucide-react';
import { PlayerCard } from '../components/PlayerCard';

export const CaptainDashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState<Team[]>([]);
    const [myTeam, setMyTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]); // Added
    const [sentRequests, setSentRequests] = useState<MatchRequest[]>([]); // Added for Sent Challenges
    const [pastMatches, setPastMatches] = useState<Match[]>([]); // Added for Match History
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [showEditTeamModal, setShowEditTeamModal] = useState(false);
    const [showAcceptMatchModal, setShowAcceptMatchModal] = useState(false); // Added
    const [selectedRequest, setSelectedRequest] = useState<MatchRequest | null>(null); // Added
    const [captainStats, setCaptainStats] = useState<CaptainStats | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);

    // Only captains can access
    useEffect(() => {
        if (user && user.role !== 'captain' && user.role !== 'admin') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const loadData = async () => {
        try {
            const allTeams = await getAllTeams();
            setTeams(allTeams);

            // Find team where current user is captain
            const captainTeam = allTeams.find(t => t.captainId === user?.id);
            setMyTeam(captainTeam || null);

            const allPlayers = await getAllPlayers();
            console.log('═══════════════════════════════════════════════════');
            console.log('[Captain Dashboard] 📊 DATABASE INSPECTION');
            console.log('═══════════════════════════════════════════════════');
            console.log('[Captain Dashboard] Current User:', user?.name, '| ID:', user?.id);
            console.log('[Captain Dashboard] Total Players in DB:', allPlayers.length);
            console.log('[Captain Dashboard] Player Details:');
            allPlayers.forEach((p, i) => {
                console.log(`  ${i + 1}. ${p.name} | Position: ${p.position} | TeamID: ${p.teamId || 'NONE'} | Has Team: ${!!p.teamId ? '✅' : '❌'}`);
            });
            setPlayers(allPlayers);

            const users = await getAllUsers();
            setAllUsers(users);

            if (captainTeam) {
                console.log('─────────────────────────────────────────────────');
                console.log('[Captain Dashboard] ✅ CAPTAIN TEAM FOUND');
                console.log('[Captain Dashboard] Team Name:', captainTeam.name);
                console.log('[Captain Dashboard] Team ID:', captainTeam.id);
                console.log('[Captain Dashboard] Captain ID:', captainTeam.captainId);
                console.log('─────────────────────────────────────────────────');

                const teamPlayers = allPlayers.filter(p => p.teamId === captainTeam.id);
                console.log('[Captain Dashboard] 🎯 FILTERING PLAYERS');
                console.log('[Captain Dashboard] Looking for players with teamId =', captainTeam.id);
                console.log('[Captain Dashboard] Found', teamPlayers.length, 'players for team:', captainTeam.name);

                if (teamPlayers.length > 0) {
                    console.log('[Captain Dashboard] ✅ Team Players:');
                    teamPlayers.forEach((p, i) => {
                        console.log(`  ${i + 1}. ${p.name} (${p.position}) - OVR: ${p.overallScore}`);
                    });
                } else {
                    console.warn('[Captain Dashboard] ⚠️  NO PLAYERS FOUND FOR THIS TEAM!');
                    console.warn('[Captain Dashboard] Checking why...');

                    const playersWithNoTeam = allPlayers.filter(p => !p.teamId);
                    if (playersWithNoTeam.length > 0) {
                        console.warn(`[Captain Dashboard] ❌ ${playersWithNoTeam.length} players have NO teamId assigned:`);
                        playersWithNoTeam.forEach(p => console.warn(`   - ${p.name}`));
                        console.warn('[Captain Dashboard] 💡 SOLUTION: Assign these players to teams via Admin Dashboard');
                    }

                    const playersInOtherTeams = allPlayers.filter(p => p.teamId && p.teamId !== captainTeam.id);
                    if (playersInOtherTeams.length > 0) {
                        console.log(`[Captain Dashboard] ℹ️  ${playersInOtherTeams.length} players are in OTHER teams`);
                    }
                }
                console.log('═══════════════════════════════════════════════════');

                const invitations = await getPendingInvitationsForTeam(captainTeam.id);
                setPendingInvitations(invitations);

                // Fetch Incoming Match Requests
                const allRequests = await getAllMatchRequests();
                const myRequests = allRequests.filter(r =>
                    r.awayTeamId === captainTeam.id &&
                    r.status === 'pending_opponent' &&
                    !r.awayTeamLineup // Only show ones where we haven't responded yet (no lineup set)
                );
                setIncomingRequests(myRequests);

                // Fetch Sent/Active Requests (involved in)
                const activeRequests = allRequests.filter(r => {
                    // 1. I sent it
                    if (r.requestedBy === user?.id) return true;
                    // 2. I received it AND I have responded (it's not pending my action anymore)
                    if (r.awayTeamId === captainTeam.id && r.status !== 'pending_opponent') {
                        return true;
                    }
                    return false;
                });
                setSentRequests(activeRequests);

                // Fetch Past Matches
                const history = await getMatchesByTeam(captainTeam.id);
                // Sort by date desc
                history.sort((a, b) => b.createdAt - a.createdAt);
                setPastMatches(history);
            }

            // Load captain stats
            if (user) {
                const stats = await getCaptainStats(user.id);
                setCaptainStats(stats || null);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading captain data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        loadData();

        // Subscribe to real-time updates - this will trigger whenever a player card is saved
        const unsubscribe = subscribeToChanges(() => {
            console.log('[Captain Dashboard] Database updated, reloading data...');
            loadData();
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return <div className="text-center py-20">Loading captain dashboard...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Captain Dashboard</h1>
                    <p className="text-gray-400 mt-1">Manage your team and schedule matches</p>
                </div>
                {!myTeam && (
                    <button
                        onClick={() => setShowCreateTeamModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(0,255,157,0.3)]"
                    >
                        <PlusCircle size={20} />
                        Create Team
                    </button>
                )}
            </div>

            {myTeam ? (
                <>
                    {captainStats && (
                        <>
                            {/* Captain Rank Badge */}
                            <div className="bg-gradient-to-r from-yellow-500/20 via-elkawera-accent/20 to-blue-500/20 border border-elkawera-accent/30 rounded-2xl p-6 mb-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-elkawera-accent/20 border-2 border-elkawera-accent flex items-center justify-center">
                                            <Shield size={32} className="text-elkawera-accent" />
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase text-gray-400 font-bold tracking-wider">Captain Rank</p>
                                            <h3 className="text-2xl font-display font-bold text-elkawera-accent">{captainStats.rank}</h3>
                                            <p className="text-sm text-gray-400">{captainStats.rankPoints} Rank Points</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Trophy size={16} className="text-yellow-400" />
                                            <span className="text-sm text-gray-400">Record:</span>
                                            <span className="font-bold text-green-400">{captainStats.wins}W</span>
                                            <span className="font-bold text-gray-400">{captainStats.draws}D</span>
                                            <span className="font-bold text-red-400">{captainStats.losses}L</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-blue-400" />
                                            <span className="text-sm text-gray-400">Players Recruited:</span>
                                            <span className="font-bold">{captainStats.playersRecruited}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Rank Progress Bar */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>Progress to Next Rank</span>
                                        <span>
                                            {captainStats.rank === 'Bronze Captain' && '100 points for Silver'}
                                            {captainStats.rank === 'Silver Captain' && '300 points for Gold'}
                                            {captainStats.rank === 'Gold Captain' && '600 points for Elite'}
                                            {captainStats.rank === 'Elite Captain' && '1000 points for Master'}
                                            {captainStats.rank === 'Master Captain' && 'Max Rank Achieved!'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-elkawera-accent to-yellow-400 transition-all duration-500"
                                            style={{
                                                width: `${captainStats.rank === 'Master Captain' ? 100 :
                                                    captainStats.rank === 'Elite Captain' ? ((captainStats.rankPoints - 600) / 400 * 100) :
                                                        captainStats.rank === 'Gold Captain' ? ((captainStats.rankPoints - 300) / 300 * 100) :
                                                            captainStats.rank === 'Silver Captain' ? ((captainStats.rankPoints - 100) / 200 * 100) :
                                                                (captainStats.rankPoints / 100 * 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Team Overview */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                {myTeam.logoUrl && (
                                    <img src={myTeam.logoUrl} alt={myTeam.name} className="w-20 h-20 rounded-full object-cover border-4 border-elkawera-accent" />
                                )}
                                <div>
                                    <h2 className="text-3xl font-display font-bold">{myTeam.name}</h2>
                                    <p className="text-gray-400">{myTeam.shortName}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEditTeamModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors font-bold"
                                >
                                    <Edit3 size={16} />
                                    Edit Team
                                </button>
                            </div>
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Users size={16} />
                                    <span className="text-xs uppercase font-bold">Players</span>
                                </div>
                                <p className="text-3xl font-display font-bold">{players.filter(p => p.teamId === myTeam.id).length}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <TrendingUp size={16} />
                                    <span className="text-xs uppercase font-bold">XP</span>
                                </div>
                                <p className="text-3xl font-display font-bold text-elkawera-accent">{myTeam.experiencePoints || 0}</p>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10 relative group">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Trophy size={16} />
                                    <span className="text-xs uppercase font-bold">Ranking</span>
                                    <HelpCircle size={12} className="cursor-help text-gray-500 hover:text-white transition-colors" />
                                </div>
                                <p className="text-3xl font-display font-bold text-yellow-400">#{myTeam.ranking || 'Unranked'}</p>

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-black/90 border border-white/20 p-3 rounded text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                    <div className="font-bold text-white mb-1">Global Team Ranking</div>
                                    Calculated based on total Team XP earned from matches, tournament wins, and clean sheets.
                                </div>
                            </div>
                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <Send size={16} />
                                    <span className="text-xs uppercase font-bold">Pending Invites</span>
                                </div>
                                <p className="text-3xl font-display font-bold">{pendingInvitations.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pending Invitations */}
                    {pendingInvitations.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-display font-bold uppercase">Pending Invitations</h3>
                            <div className="grid gap-4">
                                {pendingInvitations.map(invitation => (
                                    <div key={invitation.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-white/20 transition-all">
                                        <div>
                                            <p className="font-bold">{invitation.playerName}</p>
                                            <p className="text-sm text-gray-400">Invited {new Date(invitation.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase">Pending</span>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Are you sure you want to cancel the invitation to ${invitation.playerName}?`)) {
                                                        await deleteTeamInvitation(invitation.id);
                                                        loadData();
                                                    }
                                                }}
                                                className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Cancel Invitation"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Match Requests (Challenges) */}
                    {incomingRequests.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-display font-bold uppercase text-elkawera-accent flex items-center gap-2">
                                <Trophy size={24} />
                                Match Challenges Received
                            </h3>
                            <div className="grid gap-4">
                                {incomingRequests.map(req => (
                                    <div key={req.id} className="bg-gradient-to-r from-elkawera-accent/10 to-transparent border border-elkawera-accent/30 rounded-xl p-6 relative overflow-hidden">
                                        <div className="flex items-center justify-between z-10 relative">
                                            <div>
                                                <p className="text-xs font-bold text-elkawera-accent uppercase mb-1">Incoming Challenge</p>
                                                <h4 className="text-xl font-bold">{req.homeTeamName}</h4>
                                                <p className="text-sm text-gray-400">Challenged by Captain {req.requestedByName}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (confirm('Reject this match request?')) {
                                                            await rejectMatchRequest(req.id, user!.id, 'Declined by captain');
                                                            loadData();
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-bold hover:bg-red-500/30 transition-colors"
                                                >
                                                    Decline
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setShowAcceptMatchModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-elkawera-accent text-black rounded-lg font-bold hover:bg-white transition-colors flex items-center gap-2"
                                                >
                                                    <CheckCircle size={16} />
                                                    Accept & Lineup
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* Match History */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-display font-bold uppercase">Match History</h3>
                        {pastMatches.length === 0 ? (
                            <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10 text-gray-500">
                                No matches played yet
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {pastMatches.map(match => {
                                    const isHome = match.homeTeamId === myTeam.id;
                                    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                                    const opponent = teams.find(t => t.id === opponentId);
                                    const myScore = isHome ? match.homeScore : match.awayScore;
                                    const opScore = isHome ? match.awayScore : match.homeScore;
                                    const result = myScore > opScore ? 'W' : myScore < opScore ? 'L' : 'D';
                                    const resultColor = result === 'W' ? 'text-green-400' : result === 'L' ? 'text-red-400' : 'text-yellow-400';

                                    return (
                                        <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`text-2xl font-display font-bold ${resultColor}`}>{result}</div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase">vs {opponent?.name || 'Unknown'}</p>
                                                    <h4 className="text-xl font-bold">{myScore} - {opScore}</h4>
                                                    <p className="text-xs text-gray-500">{new Date(match.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {match.isExternal && (
                                                <span className="px-2 py-1 bg-elkawera-accent/10 text-elkawera-accent rounded text-[10px] font-bold uppercase">Ranked Match</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Active Match Requests (Sent & Accepted) */}
                    {sentRequests.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-2xl font-display font-bold uppercase text-white flex items-center gap-2">
                                <Send size={24} />
                                Active Challenges
                            </h3>
                            <div className="grid gap-4">
                                {sentRequests.map(req => {
                                    let statusText = 'Pending Opponent';
                                    let statusColor = 'text-yellow-400 bg-yellow-400/10';

                                    // Status Logic
                                    if (req.status === 'rejected') {
                                        statusText = 'Rejected: ' + (req.rejectionReason || 'No reason');
                                        statusColor = 'text-red-400 bg-red-400/10';
                                    } else if (req.status === 'approved') {
                                        statusText = 'Match Approved & Started';
                                        statusColor = 'text-green-400 bg-green-400/10';
                                    } else if (req.status === 'pending_admin' || req.awayTeamLineup) {
                                        statusText = 'Waiting for Admin Approval';
                                        statusColor = 'text-blue-400 bg-blue-400/10';
                                    }

                                    // Display Logic
                                    const isMyRequest = req.requestedBy === user?.id;
                                    const opponentName = isMyRequest ? req.awayTeamName : req.homeTeamName;
                                    const label = isMyRequest ? `To: ${opponentName}` : `From: ${opponentName}`;

                                    return (
                                        <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
                                                <h4 className="text-xl font-bold">{req.homeTeamName} vs {req.awayTeamName}</h4>
                                                <p className="text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${statusColor}`}>
                                                {statusText}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Team Roster */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-display font-bold uppercase">Team Roster</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {players.filter(p => p.teamId === myTeam.id).map(player => (
                                <div
                                    key={player.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition-all group"
                                    onClick={() => setSelectedPlayer(player)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-elkawera-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="text-xl font-display font-bold">{player.overallScore}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold group-hover:text-elkawera-accent transition-colors">{player.name}</p>
                                            <p className="text-sm text-gray-400">{player.position}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {players.filter(p => p.teamId === myTeam.id).length === 0 && (
                                <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <Users size={48} className="mx-auto text-gray-600 mb-4" />
                                    <p className="text-gray-400">No players in your team yet</p>
                                    <p className="text-sm text-gray-500 mt-2">Go to Team Management to invite players</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <button
                            onClick={() => navigate('/teams')}
                            className="flex items-center justify-center gap-3 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group col-span-full"
                        >
                            <Trophy size={24} className="text-yellow-400" />
                            <div className="text-left">
                                <p className="font-bold text-lg">View All Teams</p>
                                <p className="text-sm text-gray-400">See rankings and stats</p>
                            </div>
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Users size={64} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No Team Yet</h3>
                    <p className="text-gray-400 mb-6">Create your team to start managing players and scheduling matches</p>
                    <button
                        onClick={() => setShowCreateTeamModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-elkawera-accent text-black font-bold rounded-full hover:bg-white transition-all"
                    >
                        <PlusCircle size={20} />
                        Create Team
                    </button>
                </div>
            )
            }

            {/* Create Team Modal */}
            {
                showCreateTeamModal && (
                    <CreateTeamModal
                        onClose={() => setShowCreateTeamModal(false)}
                        onCreated={() => {
                            setShowCreateTeamModal(false);
                            loadData();
                        }}
                    />
                )
            }


            {
                showEditTeamModal && myTeam && (
                    <EditTeamModal
                        team={myTeam}
                        players={players}
                        allUsers={allUsers}
                        teams={teams}
                        onClose={() => setShowEditTeamModal(false)}
                        onUpdated={() => {
                            setShowEditTeamModal(false);
                            loadData();
                        }}
                    />
                )
            }

            {/* Accept Match Modal */}
            {
                showAcceptMatchModal && selectedRequest && myTeam && (
                    <AcceptMatchModal
                        request={selectedRequest}
                        myTeam={myTeam}
                        onClose={() => setShowAcceptMatchModal(false)}
                        onAccepted={() => {
                            setShowAcceptMatchModal(false);
                            loadData();
                        }}
                    />
                )
            }

            {/* Player Preview Modal */}
            {selectedPlayer && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPlayer(null)}>
                    <div className="transform scale-100 transition-transform" onClick={e => e.stopPropagation()}>
                        <PlayerCard
                            player={selectedPlayer}
                            uniqueId={`preview-${selectedPlayer.id}`}
                            allowFlipClick={true}
                        />
                        <button
                            onClick={() => setSelectedPlayer(null)}
                            className="absolute -top-12 right-0 text-white hover:text-elkawera-accent transition-colors"
                        >
                            <XCircle size={32} />
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};

// Create Team Modal Component
const CreateTeamModal: React.FC<{
    onClose: () => void;
    onCreated: () => void;
}> = ({ onClose, onCreated }) => {
    const { user } = useAuth();
    const [teamName, setTeamName] = useState('');
    const [shortName, setShortName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const users = await getAllUsers();
            setAllUsers(users);
            const allPlayers = await getAllPlayers();
            setPlayers(allPlayers);
            const allTeams = await getAllTeams();
            setTeams(allTeams);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    // Filter out captains and current user
    const availableUsers = allUsers.filter(u => {
        if (u.id === user?.id) return false; // Don't show self
        if (u.role === 'captain') return false; // Don't show any captains
        return true;
    });

    const getUserStatus = (u: User) => {
        if (u.role === 'admin') return { label: 'Admin', color: 'text-red-400', bg: 'bg-red-500/20' };

        // Check if player in another team
        const playerCard = players.find(p => p.id === u.playerCardId);
        if (playerCard && playerCard.teamId) {
            const teamName = teams.find(t => t.id === playerCard.teamId)?.name;
            if (teamName) return { label: teamName, color: 'text-blue-400', bg: 'bg-blue-500/20' };
        }

        return null; // Free agent
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreate = async () => {
        if (!teamName || !shortName) {
            alert('Please fill in team name and short name');
            return;
        }

        setCreating(true);

        try {
            const newTeam: Team = {
                id: uuidv4(),
                name: teamName,
                shortName: shortName.toUpperCase(),
                color: '#00FF9D',
                logoUrl: logoUrl || undefined,
                captainId: user?.id || '',
                captainName: user?.name || '',
                experiencePoints: 0,
                ranking: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                totalMatches: 0,
                createdAt: Date.now(),
            };

            await saveTeam(newTeam);

            // Send invitations to selected players
            for (const userId of selectedPlayers) {
                const targetUser = allUsers.find(u => u.id === userId);
                if (!targetUser) continue;

                const invitation: TeamInvitation = {
                    id: uuidv4(),
                    teamId: newTeam.id,
                    playerId: userId,
                    playerName: targetUser.name,
                    invitedBy: user?.id || '',
                    captainName: user?.name || '',
                    teamName: newTeam.name,
                    status: 'pending',
                    createdAt: Date.now(),
                };

                await saveTeamInvitation(invitation);
            }

            onCreated();
        } catch (error) {
            console.error('Error creating team:', error);
            alert('Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-display font-bold uppercase">Create Team</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Team Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Team Name</label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g., Thunder FC"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Short Name (3-4 letters)</label>
                            <input
                                type="text"
                                value={shortName}
                                onChange={(e) => setShortName(e.target.value.slice(0, 4))}
                                placeholder="e.g., THU"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none uppercase"
                                maxLength={4}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Team Logo (Optional)</label>
                        <div className="flex items-center gap-4">
                            {logoUrl && (
                                <img src={logoUrl} alt="Logo preview" className="w-16 h-16 rounded-full object-cover border-2 border-elkawera-accent" />
                            )}
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                                <Upload size={16} />
                                <span className="text-sm font-bold">Upload Logo</span>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Player Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">
                            Add Players (Optional) - {selectedPlayers.length} selected
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto bg-black/30 rounded-lg p-3 border border-white/10">
                            {availableUsers.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No players available</p>
                            ) : (
                                availableUsers.map(u => {
                                    const status = getUserStatus(u);
                                    const playerCard = players.find(p => p.id === u.playerCardId);
                                    const overall = playerCard ? playerCard.overallScore : '-';

                                    return (
                                        <label
                                            key={u.id}
                                            className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedPlayers.includes(u.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        if (selectedPlayers.length >= 7) {
                                                            alert('Maximum 7 players can be added to a team');
                                                            return;
                                                        }
                                                        setSelectedPlayers([...selectedPlayers, u.id]);
                                                    } else {
                                                        setSelectedPlayers(selectedPlayers.filter(id => id !== u.id));
                                                    }
                                                }}
                                                className="w-4 h-4 accent-elkawera-accent"
                                            />
                                            <div className="w-8 h-8 rounded-full bg-elkawera-accent/20 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-display font-bold">{overall}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-sm truncate">{u.name}</p>
                                                    {status && (
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status.bg} ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            You can invite players now or add them later from your dashboard
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={creating || !teamName || !shortName}
                        className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {creating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Create Team
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Invite Player Modal Component
const InvitePlayerModal: React.FC<{
    team: Team;
    players: Player[];
    allUsers: User[];
    teams: Team[];
    currentUserId: string;
    onClose: () => void;
    onInvited: () => void;
}> = ({ team, players, allUsers, teams, currentUserId, onClose, onInvited }) => {
    const { user } = useAuth();
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [sending, setSending] = useState(false);

    // Filter out current user (captain) and all other captains
    // Also filter out users who are already in THIS team (as captain or player)
    // But we want to show users from OTHER teams with their club name
    const availableUsers = allUsers.filter(u => {
        if (u.id === currentUserId) return false; // Don't show self
        if (u.role === 'captain') return false; // Don't show any captains

        // Check if user is already in this team
        // 1. Is he the captain? (Already filtered by role check above)
        if (team.captainId === u.id) return false;

        // 2. Is he a player in this team?
        const playerCard = players.find(p => p.id === u.playerCardId);
        if (playerCard && playerCard.teamId === team.id) return false;

        return true;
    });

    const getUserStatus = (u: User) => {
        if (u.role === 'admin') return { label: 'Admin', color: 'text-red-400', bg: 'bg-red-500/20' };

        // Check if captain of another team
        const captainOfTeam = teams.find(t => t.captainId === u.id);
        if (captainOfTeam) return { label: captainOfTeam.name, color: 'text-elkawera-accent', bg: 'bg-elkawera-accent/20' };

        // Check if player in another team
        const playerCard = players.find(p => p.id === u.playerCardId);
        if (playerCard && playerCard.teamId) {
            const teamName = teams.find(t => t.id === playerCard.teamId)?.name;
            if (teamName) return { label: teamName, color: 'text-blue-400', bg: 'bg-blue-500/20' };
        }

        return null; // Free agent
    };

    const handleSend = async () => {
        if (selectedUsers.length === 0) {
            alert('Please select at least one player');
            return;
        }

        setSending(true);

        try {
            for (const userId of selectedUsers) {
                const targetUser = allUsers.find(u => u.id === userId);
                if (!targetUser) continue;

                const invitation: TeamInvitation = {
                    id: uuidv4(),
                    teamId: team.id,
                    playerId: userId, // Send to User ID
                    playerName: targetUser.name,
                    invitedBy: user?.id || '',
                    captainName: user?.name || '',
                    teamName: team.name,
                    status: 'pending',
                    createdAt: Date.now(),
                };

                await saveTeamInvitation(invitation);
            }

            onInvited();
            alert('Invitations sent successfully');
        } catch (error) {
            console.error('Error sending invitations:', error);
            alert('Failed to send invitations');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-display font-bold uppercase">Invite Players</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <XCircle size={24} />
                    </button>
                </div>

                <p className="text-gray-400 mb-4">Select players to invite to {team.name}</p>

                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                    {availableUsers.map(u => {
                        const status = getUserStatus(u);
                        const playerCard = players.find(p => p.id === u.playerCardId);
                        const overall = playerCard ? playerCard.overallScore : '-';

                        return (
                            <label
                                key={u.id}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(u.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedUsers([...selectedUsers, u.id]);
                                        } else {
                                            setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                                        }
                                    }}
                                    className="w-5 h-5 accent-elkawera-accent"
                                />
                                <div className="w-10 h-10 rounded-full bg-elkawera-accent/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-display font-bold">{overall}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold truncate">{u.name}</p>
                                        {status && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${status.bg} ${status.color}`}>
                                                {status.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{u.email}</p>
                                </div>
                            </label>
                        );
                    })}
                    {availableUsers.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No available players to invite</p>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || selectedUsers.length === 0}
                        className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {sending ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Send {selectedUsers.length} Invitation{selectedUsers.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Edit Team Modal Component
const EditTeamModal: React.FC<{
    team: Team;
    players: Player[];
    allUsers: User[];
    teams: Team[];
    onClose: () => void;
    onUpdated: () => void;
}> = ({ team, players, allUsers, teams, onClose, onUpdated }) => {
    const { user } = useAuth();
    const [teamName, setTeamName] = useState(team.name);
    const [shortName, setShortName] = useState(team.shortName);
    const [logoUrl, setLogoUrl] = useState(team.logoUrl || '');
    const [saving, setSaving] = useState(false);

    // Get current team players
    const teamPlayers = players.filter(p => p.teamId === team.id);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePlayer = async (playerId: string) => {
        if (!confirm('Are you sure you want to remove this player from the team?')) return;

        try {
            const player = await getPlayerById(playerId);
            if (player) {
                player.teamId = undefined;
                await savePlayer(player);
                onUpdated();
            }
        } catch (error) {
            console.error('Error removing player:', error);
            alert('Failed to remove player');
        }
    };

    const handleSave = async () => {
        if (!teamName || !shortName) {
            alert('Please fill in team name and short name');
            return;
        }

        setSaving(true);

        try {
            const updatedTeam: Team = {
                ...team,
                name: teamName,
                shortName: shortName.toUpperCase(),
                logoUrl: logoUrl || undefined,
            };

            await saveTeam(updatedTeam);
            onUpdated();
        } catch (error) {
            console.error('Error updating team:', error);
            alert('Failed to update team');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-display font-bold uppercase">Edit Team</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Team Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Team Name</label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g., Thunder FC"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Short Name (3-4 letters)</label>
                            <input
                                type="text"
                                value={shortName}
                                onChange={(e) => setShortName(e.target.value.slice(0, 4))}
                                placeholder="e.g., THU"
                                className="w-full bg-black/50 border border-white/20 rounded-lg p-3 focus:border-elkawera-accent focus:outline-none uppercase"
                                maxLength={4}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Team Logo</label>
                        <div className="flex items-center gap-4">
                            {logoUrl && (
                                <img src={logoUrl} alt="Logo preview" className="w-16 h-16 rounded-full object-cover border-2 border-elkawera-accent" />
                            )}
                            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors">
                                <Upload size={16} />
                                <span className="text-sm font-bold">Upload Logo</span>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Current Players */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">
                            Current Players ({teamPlayers.length}/7)
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto bg-black/30 rounded-lg p-3 border border-white/10">
                            {teamPlayers.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">No players in team yet</p>
                            ) : (
                                teamPlayers.map(player => (
                                    <div
                                        key={player.id}
                                        className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-elkawera-accent/20 flex items-center justify-center">
                                                <span className="text-sm font-display font-bold">{player.overallScore}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold">{player.name}</p>
                                                <p className="text-xs text-gray-400">{player.position}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemovePlayer(player.id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                            title="Remove player"
                                        >
                                            <Trash2 size={16} className="text-red-400" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Use the "Invite Players" button on the dashboard to add more players
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !teamName || !shortName}
                        className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Accept Match Modal Component
const AcceptMatchModal: React.FC<{
    request: MatchRequest;
    myTeam: Team;
    onClose: () => void;
    onAccepted: () => void;
}> = ({ request, myTeam, onClose, onAccepted }) => {
    const [squad, setSquad] = useState<Player[]>([]);
    const [selectedLineup, setSelectedLineup] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const loadSquad = async () => {
            const players = await getPlayersByTeamId(myTeam.id);
            setSquad(players);
        };
        loadSquad();
    }, [myTeam]);

    const togglePlayer = (playerId: string) => {
        setSelectedLineup(prev => {
            if (prev.includes(playerId)) {
                return prev.filter(id => id !== playerId);
            } else {
                if (prev.length >= 7) {
                    alert('You can only select up to 7 players');
                    return prev;
                }
                return [...prev, playerId];
            }
        });
    };

    const handleConfirm = async () => {
        if (selectedLineup.length < 5) return;
        if (!user) return;
        setSubmitting(true);

        try {
            await confirmMatchRequestByOpponent(request.id, user.id, selectedLineup);
            onAccepted();
        } catch (error) {
            console.error('Error accepting match:', error);
            alert('Failed to accept match');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-elkawera-dark border border-white/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-display font-bold uppercase">Accept Challenge</h2>
                        <p className="text-gray-400">Select your lineup to play against {request.homeTeamName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between mb-4">
                        <span className="font-bold text-gray-400">Match Opponent</span>
                        <span className="text-xl font-bold">{request.homeTeamName}</span>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold">Select Lineup ({selectedLineup.length}/7)</h3>
                        <span className="text-xs text-red-400 font-bold">Min 5 Players</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {squad.map(player => {
                            const isSelected = selectedLineup.includes(player.id);
                            return (
                                <div
                                    key={player.id}
                                    onClick={() => togglePlayer(player.id)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${isSelected
                                        ? 'bg-elkawera-accent/20 border-elkawera-accent'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-elkawera-accent text-black' : 'bg-white/10'}`}>
                                        <span className="text-xs font-bold">{player.overallScore}</span>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{player.name}</p>
                                        <p className="text-xs text-gray-500">{player.position}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={submitting || selectedLineup.length < 5}
                        className="flex-1 py-3 bg-elkawera-accent text-black rounded-lg hover:bg-white transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? 'Processing...' : 'Confirm & Send to Admin'}
                    </button>
                </div>
            </div>
        </div>
    );
};
