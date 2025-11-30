import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getPlayerById, savePlayer, getAllTeams, getPlayerRegistrationRequestById, updatePlayerRegistrationRequest, getUserById, updateUser, getUserByPlayerCardId } from '../utils/db';
import { computeOverall, getCardType, computeOverallWithPerformance } from '../utils/calculation';
import { Player, INITIAL_STATS, Position, CardType, Team } from '../types';
import { PlayerCard } from '../components/PlayerCard';
import { Upload, Save, ArrowLeft, Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { COUNTRIES } from '../utils/countries';
import { downloadElementAsPNG } from '../utils/download';
import { useAuth } from '../context/AuthContext';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const CreatePlayer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const requestId = searchParams.get('requestId');
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState<Player>({
    id: '',
    name: '',
    age: 18,
    height: 180,
    weight: 75,
    position: 'ST',
    country: 'FR',
    cardType: 'Silver',
    teamId: '',
    imageUrl: null,
    overallScore: 60,
    stats: { ...INITIAL_STATS },
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  useEffect(() => {
    // Only admins can create/edit players
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    // Load teams first
    getAllTeams().then(setTeams);

    if (editId) {
      setLoading(true);
      getPlayerById(editId).then(player => {
        if (player) setFormData(player);
        setLoading(false);
      });
    } else if (requestId) {
      // Load data from registration request
      setLoading(true);
      getPlayerRegistrationRequestById(requestId).then(request => {
        if (request) {
          const newId = generateId();
          setFormData(prev => ({
            ...prev,
            id: newId,
            name: request.name,
            age: request.age,
            height: request.height,
            weight: request.weight,
            position: request.position,
            country: 'EG', // Default to Egypt
            createdAt: Date.now(),
            updatedAt: Date.now(),
            // Ensure all required fields are set
            stats: { ...INITIAL_STATS },
            goals: 0,
            assists: 0,
            matchesPlayed: 0,
            overallScore: 60,
            cardType: 'Silver',
            imageUrl: null,
          }));
        }
        setLoading(false);
      }).catch(error => {
        console.error('Error loading registration request:', error);
        setLoading(false);
      });
    } else {
      setFormData(prev => ({ ...prev, id: generateId() }));
    }
  }, [editId, requestId, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' ? Number(value) : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        setSaveError('Player name is required');
        setSaving(false);
        return;
      }

      // Ensure ID is set - use a local variable to avoid async state update issues
      const playerId = formData.id || generateId();

      const baseScore = computeOverall(formData.stats, formData.position);
      const score = computeOverallWithPerformance(
        baseScore,
        formData.goals || 0,
        formData.assists || 0,
        formData.matchesPlayed || 0
      );

      // Ensure all required fields are present and valid
      const playerToSave: Player = {
        id: playerId,
        name: formData.name.trim(),
        age: formData.age || 18,
        height: formData.height || 175,
        weight: formData.weight || 70,
        position: formData.position || 'ST',
        country: formData.country || 'EG',
        teamId: formData.teamId || undefined,
        cardType: formData.cardType || 'Silver',
        imageUrl: formData.imageUrl || null,
        overallScore: score,
        stats: formData.stats || { ...INITIAL_STATS },
        goals: formData.goals || 0,
        assists: formData.assists || 0,
        matchesPlayed: formData.matchesPlayed || 0,
        createdAt: formData.createdAt || Date.now(),
        updatedAt: Date.now()
      };

      // Validate all required fields before saving
      if (!playerToSave.id || !playerToSave.name || !playerToSave.position || !playerToSave.country) {
        throw new Error('Missing required fields. Please fill in all required information.');
      }

      // Save the player card to database
      await savePlayer(playerToSave);

      // Handle different scenarios: new card from request, or editing existing card
      if (requestId) {
        // New card being created from registration request
        const request = await getPlayerRegistrationRequestById(requestId);
        if (!request) {
          throw new Error('Registration request not found');
        }

        // Update registration request status to confirmed
        await updatePlayerRegistrationRequest({
          ...request,
          status: 'approved' // This marks it as confirmed/approved
        });

        // Link player card to user account - player will see it immediately
        const userAccount = await getUserById(request.userId);
        if (!userAccount) {
          throw new Error('User account not found');
        }

        const updatedUser = {
          ...userAccount,
          playerCardId: playerToSave.id
        };

        // Update user account with player card ID
        await updateUser(updatedUser);

        // Verify the update was successful
        const verifyUser = await getUserById(request.userId);
        if (!verifyUser || verifyUser.playerCardId !== playerToSave.id) {
          console.warn('User account update may not have persisted, but player card was saved.');
        }

        // Update localStorage for the player if they're currently logged in
        // This ensures they see the card immediately without needing to refresh
        const storedUser = localStorage.getItem('elkawera_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.id === request.userId) {
              localStorage.setItem('elkawera_user', JSON.stringify(updatedUser));
            }
          } catch (e) {
            console.warn('Could not update localStorage:', e);
          }
        }

        setSaveSuccess(true);

        // Show success message and navigate after a short delay
        setTimeout(() => {
          navigate('/new-players');
        }, 1500);
      } else if (editId) {
        // Editing an existing player card - update the player's account
        const userWithCard = await getUserByPlayerCardId(playerToSave.id);
        if (userWithCard) {
          // Update user's localStorage if they're logged in
          const storedUser = localStorage.getItem('elkawera_user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser.id === userWithCard.id) {
                // Update localStorage to trigger refresh
                localStorage.setItem('elkawera_user', JSON.stringify({
                  ...parsedUser,
                  playerCardId: playerToSave.id
                }));
              }
            } catch (e) {
              console.warn('Could not update localStorage:', e);
            }
          }
        }

        setSaveSuccess(true);

        // Show success message and navigate after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Regular create (not from request)
        setSaveSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error saving player card:', error);
      const errorMessage = error?.message || 'Failed to save player card. Please try again.';
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Live preview update - use manually selected card type
  const baseScore = computeOverall(formData.stats, formData.position);
  const previewPlayer = {
    ...formData,
    overallScore: computeOverallWithPerformance(
      baseScore,
      formData.goals || 0,
      formData.assists || 0,
      formData.matchesPlayed || 0
    ),
    // Use the manually selected cardType for preview
    cardType: formData.cardType,
  };

  // Simplified Download Handler
  // The updated downloadElementAsPNG utility handles the transform stripping,
  // so we don't need to physically flip the card in the UI to get a correct download.
  const handleDownload = (side: 'front' | 'back') => {
    const id = side === 'front' ? 'card-front-preview' : 'card-back-preview';
    downloadElementAsPNG(id, `${formData.name}_${side}`);
  };

  if (loading) return <div className="text-center py-20">Loading Player Data...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold uppercase">{editId ? 'Edit Player Card' : requestId ? 'Card Builder' : 'Create New Player'}</h1>
            {requestId && (
              <p className="text-gray-400 mt-1">Design and customize the player card before confirmation</p>
            )}
          </div>
        </div>
        {requestId && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-lg">
            <span className="text-xs uppercase font-bold text-yellow-400 block">Pending Approval</span>
            <span className="text-sm text-yellow-300">Card will be sent to player after confirmation</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Form Section */}
        <div className="space-y-8 bg-white/5 p-8 rounded-2xl border border-white/10">

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-elkawera-accent border-b border-white/10 pb-2 flex-1">Basic Info</h3>
              {requestId && (
                <div className="text-xs text-gray-400 uppercase font-bold">
                  Card Builder Mode
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 focus:border-elkawera-accent focus:outline-none text-white"
                  placeholder="e.g. Lionel Messi"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full bg-black/50 border border-white/20 rounded p-3 bg-black focus:border-elkawera-accent focus:outline-none text-white"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} className="w-full bg-black/50 border border-white/20 rounded p-3 text-white" />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Hgt (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full bg-black/50 border border-white/20 rounded p-3 text-white" />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Wgt (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="w-full bg-black/50 border border-white/20 rounded p-3 text-white" />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-400 mb-1">Pos</label>
                <select name="position" value={formData.position} onChange={handleInputChange} className="w-full bg-black/50 border border-white/20 rounded p-3 bg-black text-white">
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

            <div className="bg-gradient-to-r from-elkawera-accent/10 to-transparent border border-elkawera-accent/30 rounded-xl p-4 mb-4">
              <label className="block text-xs uppercase text-elkawera-accent mb-3 font-bold">Card Tier & Style</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, cardType: 'Silver' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.cardType === 'Silver'
                    ? 'border-gray-400 bg-gray-900/50 shadow-lg scale-105'
                    : 'border-white/20 bg-black/30 hover:border-white/40'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className={`text-sm font-bold ${formData.cardType === 'Silver' ? 'text-white' : 'text-gray-400'}`}>Silver</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, cardType: 'Gold' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.cardType === 'Gold'
                    ? 'border-yellow-400 bg-yellow-900/50 shadow-lg scale-105'
                    : 'border-white/20 bg-black/30 hover:border-white/40'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🥇</div>
                    <div className={`text-sm font-bold ${formData.cardType === 'Gold' ? 'text-yellow-300' : 'text-gray-400'}`}>Gold</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, cardType: 'Platinum' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.cardType === 'Platinum'
                    ? 'border-cyan-400 bg-cyan-900/50 shadow-lg scale-105'
                    : 'border-white/20 bg-black/30 hover:border-white/40'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">💎</div>
                    <div className={`text-sm font-bold ${formData.cardType === 'Platinum' ? 'text-cyan-300' : 'text-gray-400'}`}>Platinum</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Assign Team</label>
              <select
                name="teamId"
                value={formData.teamId || ''}
                onChange={handleInputChange}
                className="w-full bg-black/50 border border-white/20 rounded p-3 bg-black focus:border-elkawera-accent focus:outline-none text-white"
              >
                <option value="">-- No Team --</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name} ({team.shortName})</option>
                ))}
              </select>
              <div className="mt-1 text-right">
                <Link to="/teams" className="text-xs text-elkawera-accent hover:underline">+ Create New Team</Link>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-gray-400 mb-1">Player Image</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center justify-center bg-black/50 border border-white/20 hover:border-elkawera-accent border-dashed rounded h-12 px-4 w-full transition-colors">
                  <Upload size={16} className="mr-2 text-gray-400" />
                  <span className="text-sm text-gray-300">Choose File...</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {saveError && (
            <div className="p-4 bg-red-500/10 rounded border border-red-500/30 text-sm text-red-300 flex items-center gap-2">
              <AlertCircle size={16} />
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 bg-green-500/10 rounded border border-green-500/30 text-sm text-green-300 flex items-center gap-2">
              <CheckCircle size={16} />
              <strong>Success!</strong> Player card has been created and sent to the player's account.
            </div>
          )}

          {requestId && !saveSuccess && (
            <div className="p-4 bg-blue-500/10 rounded border border-blue-500/30 text-sm text-blue-300">
              ✨ <strong>Card Builder Mode:</strong> Customize all aspects of this player card. The card will be sent to the player once you confirm.
            </div>
          )}

          {!editId && !requestId && (
            <div className="p-4 bg-elkawera-green/20 rounded border border-elkawera-green/50 text-sm text-gray-300">
              ⚠️ Physical stats and goal records can be added after the first match in the "Post-Match Stats" section.
            </div>
          )}

          {/* Season Stats Section - Show for Card Builder and Edit modes */}
          {(requestId || editId) && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-elkawera-accent border-b border-white/10 pb-2">Season Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-2">Goals</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    lang="en"
                    value={formData.goals || 0}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, goals: parseInt(val) || 0 }));
                    }}
                    className="w-full bg-black/50 border border-white/20 rounded p-3 text-white text-center text-lg font-bold focus:border-elkawera-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-2">Assists</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    lang="en"
                    value={formData.assists || 0}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, assists: parseInt(val) || 0 }));
                    }}
                    className="w-full bg-black/50 border border-white/20 rounded p-3 text-white text-center text-lg font-bold focus:border-elkawera-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-2">Matches</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    lang="en"
                    value={formData.matchesPlayed || 0}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setFormData(prev => ({ ...prev, matchesPlayed: parseInt(val) || 0 }));
                    }}
                    className="w-full bg-black/50 border border-white/20 rounded p-3 text-white text-center text-lg font-bold focus:border-elkawera-accent focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">These stats contribute to the overall card rating</p>
            </div>
          )}

          {/* Stats Section - Show for Card Builder mode or when editing */}
          {(requestId || editId) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-xl font-bold text-elkawera-accent">Performance Stats</h3>
                {editId && (
                  <Link to={`/stats?id=${formData.id}`} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">Edit in Detail</Link>
                )}
              </div>

              {/* Stats Sliders for Card Builder */}
              {requestId && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Pace: {formData.stats.pace}</label>
                    <input type="range" min="1" max="99" value={formData.stats.pace} onChange={(e) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, pace: parseInt(e.target.value) } }))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Shooting: {formData.stats.shooting}</label>
                    <input type="range" min="1" max="99" value={formData.stats.shooting} onChange={(e) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, shooting: parseInt(e.target.value) } }))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Passing: {formData.stats.passing}</label>
                    <input type="range" min="1" max="99" value={formData.stats.passing} onChange={(e) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, passing: parseInt(e.target.value) } }))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Dribbling: {formData.stats.dribbling}</label>
                    <input type="range" min="1" max="99" value={formData.stats.dribbling} onChange={(e) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, dribbling: parseInt(e.target.value) } }))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Defending: {formData.stats.defending}</label>
                    <input type="range" min="1" max="99" value={formData.stats.defending} onChange={(e) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, defending: parseInt(e.target.value) } }))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-400 mb-2">Physical: {formData.stats.physical}</label>
                    <input type="range" min="1" max="99" value={formData.stats.physical} onChange={(e) => setFormData(prev => ({ ...prev, stats: { ...prev.stats, physical: parseInt(e.target.value) } }))} className="w-full" />
                  </div>
                </div>
              )}

              {/* Stats Display for Edit Mode */}
              {editId && (
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>Pace: <span className="text-white">{formData.stats.pace}</span></div>
                  <div>Shooting: <span className="text-white">{formData.stats.shooting}</span></div>
                  <div>Goals: <span className="text-white text-elkawera-accent font-bold">{formData.goals}</span></div>
                  <div>Assists: <span className="text-white text-elkawera-accent font-bold">{formData.assists}</span></div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || saveSuccess}
            className={`w-full py-4 font-bold uppercase rounded transition-all flex items-center justify-center gap-2 ${requestId
              ? 'bg-green-500 hover:bg-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              : 'bg-elkawera-accent text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle size={20} /> Card Sent Successfully!
              </>
            ) : (
              <>
                <Save size={20} /> {requestId ? 'Confirm & Send to Player' : editId ? 'Update Player Card' : 'Save Player Card'}
              </>
            )}
          </button>

          {requestId && !saveSuccess && (
            <p className="text-xs text-center text-gray-400 mt-2">
              This will finalize the card and send it to the player's account immediately
            </p>
          )}

        </div>

        {/* Preview Section */}
        <div className="flex flex-col items-center justify-start space-y-6">
          <h3 className="text-lg font-bold uppercase text-gray-500">Live Preview</h3>

          <div className="relative">
            <PlayerCard
              player={previewPlayer}
              uniqueId="preview"
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              allowFlipClick={false}
            />

            {/* Flip Control */}
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="absolute top-4 right-4 p-2 bg-black/60 rounded-full hover:bg-black/80 text-white z-50 border border-white/20"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleDownload('front')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors text-sm"
            >
              <Download size={16} /> Front
            </button>
            <button
              onClick={() => handleDownload('back')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded hover:bg-white/20 transition-colors text-sm"
            >
              <Download size={16} /> Back
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 max-w-xs mt-4">
            Click buttons to download specific card faces.
          </div>
        </div>
      </div>
    </div>
  );
};
