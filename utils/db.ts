import { User, Player, CardType, Position, Match, MatchStatus, MatchEvent, PlayerEvaluation, Team, TeamInvitation, MatchVerification, MatchDispute, Notification, UserRole, PlayerRegistrationRequest, CaptainStats, CaptainRank, MatchRequest, Event as AppEvent, ScoutProfile, ScoutActivity, Kit, KitRequest, KitRequestStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getCardTypeFromScore } from './matchCalculations';

const DB_NAME = 'ElkaweraDB';
const DB_VERSION = 22; // Bumped for Kits system
const PLAYER_STORE = 'players';
const TEAM_STORE = 'teams';
const USER_STORE = 'users';
const REGISTRATION_STORE = 'registrations';
const MATCH_STORE = 'matches';
const MATCH_VERIFICATION_STORE = 'match_verifications';
const TEAM_INVITATION_STORE = 'team_invitations';
const MATCH_DISPUTE_STORE = 'match_disputes';
const NOTIFICATION_STORE = 'notifications';
const CAPTAIN_STATS_STORE = 'captain_stats';
const MATCH_REQUEST_STORE = 'match_requests';
const EVENT_STORE = 'events';
const SCOUT_PROFILE_STORE = 'scout_profiles';
const SCOUT_ACTIVITY_STORE = 'scout_activity';
const KITS_STORE = 'kits';
const KIT_REQUESTS_STORE = 'kit_requests';

// Broadcast Channel for Real-time Sync
const syncChannel = new BroadcastChannel('elkawera_sync');

export const notifyChanges = () => {
  syncChannel.postMessage({ type: 'DB_UPDATE' });
  window.dispatchEvent(new Event('elkawera_db_update'));
};

// Listen for updates from other tabs
export const subscribeToChanges = (callback: () => void) => {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'DB_UPDATE') {
      callback();
    }
  };
  const localHandler = () => callback();

  syncChannel.addEventListener('message', handler);
  window.addEventListener('elkawera_db_update', localHandler);

  return () => {
    syncChannel.removeEventListener('message', handler);
    window.removeEventListener('elkawera_db_update', localHandler);
  };
};

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB open error:', error);
        reject(new Error(`Database error: ${error?.message || error?.name || 'Unknown error'}`));
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('Database opened successfully');
        resolve(db);
      };

      request.onblocked = () => {
        console.warn('Database is blocked. Please close other tabs with this application open.');
        reject(new Error('Database is blocked by another connection. Please close other tabs and try again.'));
      };

      request.onupgradeneeded = (event) => {
        try {
          console.log('Database upgrade needed, current version:', event.oldVersion, '-> new version:', event.newVersion);
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = (event.target as IDBOpenDBRequest).transaction!;

          // Players Store
          if (!db.objectStoreNames.contains(PLAYER_STORE)) {
            console.log('Creating players store...');
            const playerStore = db.createObjectStore(PLAYER_STORE, { keyPath: 'id' });
            playerStore.createIndex('teamId', 'teamId', { unique: false });
          } else {
            const playerStore = transaction.objectStore(PLAYER_STORE);
            if (!playerStore.indexNames.contains('teamId')) {
              playerStore.createIndex('teamId', 'teamId', { unique: false });
            }
          }

          // Teams Store
          if (!db.objectStoreNames.contains(TEAM_STORE)) {
            console.log('Creating teams store...');
            db.createObjectStore(TEAM_STORE, { keyPath: 'id' });
          }

          // Users Store
          if (!db.objectStoreNames.contains(USER_STORE)) {
            console.log('Creating users store...');
            const userStore = db.createObjectStore(USER_STORE, { keyPath: 'id' });
            userStore.createIndex('email', 'email', { unique: true });
          }

          // Player Registration Requests Store
          if (!db.objectStoreNames.contains(REGISTRATION_STORE)) {
            console.log('Creating registration requests store...');
            const regStore = db.createObjectStore(REGISTRATION_STORE, { keyPath: 'id' });
            regStore.createIndex('userId', 'userId', { unique: false });
            regStore.createIndex('status', 'status', { unique: false });
          }

          // Matches Store
          if (!db.objectStoreNames.contains(MATCH_STORE)) {
            console.log('Creating matches store...');
            const matchStore = db.createObjectStore(MATCH_STORE, { keyPath: 'id' });
            matchStore.createIndex('status', 'status', { unique: false });
            matchStore.createIndex('createdBy', 'createdBy', { unique: false });
            matchStore.createIndex('homeTeamId', 'homeTeamId', { unique: false });
            matchStore.createIndex('awayTeamId', 'awayTeamId', { unique: false });
          }

          // Match Verifications Store
          if (!db.objectStoreNames.contains(MATCH_VERIFICATION_STORE)) {
            console.log('Creating match verifications store...');
            const verificationStore = db.createObjectStore(MATCH_VERIFICATION_STORE, { keyPath: 'id' });
            verificationStore.createIndex('matchId', 'matchId', { unique: false });
            verificationStore.createIndex('teamId', 'teamId', { unique: false });
          }

          // Team Invitations Store
          if (!db.objectStoreNames.contains(TEAM_INVITATION_STORE)) {
            console.log('Creating team invitations store...');
            const invitationStore = db.createObjectStore(TEAM_INVITATION_STORE, { keyPath: 'id' });
            invitationStore.createIndex('teamId', 'teamId', { unique: false });
            invitationStore.createIndex('playerId', 'playerId', { unique: false });
            invitationStore.createIndex('status', 'status', { unique: false });
          }

          // Match Disputes Store
          if (!db.objectStoreNames.contains(MATCH_DISPUTE_STORE)) {
            console.log('Creating match disputes store...');
            const disputeStore = db.createObjectStore(MATCH_DISPUTE_STORE, { keyPath: 'id' });
            disputeStore.createIndex('matchId', 'matchId', { unique: false });
            disputeStore.createIndex('status', 'status', { unique: false });
          }

          // Notifications Store (v8)
          if (!db.objectStoreNames.contains(NOTIFICATION_STORE)) {
            console.log('Creating notifications store...');
            const notificationStore = db.createObjectStore(NOTIFICATION_STORE, { keyPath: 'id' });
            notificationStore.createIndex('userId', 'userId', { unique: false });
            notificationStore.createIndex('read', 'read', { unique: false });
            notificationStore.createIndex('type', 'type', { unique: false });
            notificationStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // Captain Stats Store (v8)
          if (!db.objectStoreNames.contains(CAPTAIN_STATS_STORE)) {
            console.log('Creating captain stats store...');
            const captainStatsStore = db.createObjectStore(CAPTAIN_STATS_STORE, { keyPath: 'userId' });
            captainStatsStore.createIndex('rank', 'rank', { unique: false });
            captainStatsStore.createIndex('rankPoints', 'rankPoints', { unique: false });
          }

          // Match Requests Store (v9)
          if (!db.objectStoreNames.contains(MATCH_REQUEST_STORE)) {
            console.log('Creating match requests store...');
            const requestStore = db.createObjectStore(MATCH_REQUEST_STORE, { keyPath: 'id' });
            requestStore.createIndex('requestedBy', 'requestedBy', { unique: false });
            requestStore.createIndex('status', 'status', { unique: false });
          }



          // Events Store (v11)
          if (!db.objectStoreNames.contains(EVENT_STORE)) {
            console.log('Creating events store...');
            const eventStore = db.createObjectStore(EVENT_STORE, { keyPath: 'id' });
            eventStore.createIndex('status', 'status', { unique: false });
            eventStore.createIndex('date', 'date', { unique: false });
            eventStore.createIndex('category', 'category', { unique: false });
          }



          // Scout Profiles Store (v13)
          if (!db.objectStoreNames.contains(SCOUT_PROFILE_STORE)) {
            console.log('Creating scout profiles store...');
            const scoutProfileStore = db.createObjectStore(SCOUT_PROFILE_STORE, { keyPath: 'userId' });
            scoutProfileStore.createIndex('scoutType', 'scoutType', { unique: false });
          }

          // Scout Activity Store (v13)
          if (!db.objectStoreNames.contains(SCOUT_ACTIVITY_STORE)) {
            console.log('Creating scout activity store...');
            const scoutActivityStore = db.createObjectStore(SCOUT_ACTIVITY_STORE, { keyPath: 'id' });
            scoutActivityStore.createIndex('scoutId', 'scoutId', { unique: false });
            scoutActivityStore.createIndex('entityId', 'entityId', { unique: false });
            scoutActivityStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // Kits Store (v22)
          if (!db.objectStoreNames.contains(KITS_STORE)) {
            console.log('Creating kits store...');
            const kitStore = db.createObjectStore(KITS_STORE, { keyPath: 'id' });
            kitStore.createIndex('isVisible', 'isVisible', { unique: false });
          }

          // Kit Requests Store (v22)
          if (!db.objectStoreNames.contains(KIT_REQUESTS_STORE)) {
            console.log('Creating kit requests store...');
            const kitRequestStore = db.createObjectStore(KIT_REQUESTS_STORE, { keyPath: 'id' });
            kitRequestStore.createIndex('userId', 'userId', { unique: false });
            kitRequestStore.createIndex('status', 'status', { unique: false });
            kitRequestStore.createIndex('type', 'type', { unique: false });
          }

          console.log('Database upgrade completed successfully');
        } catch (upgradeError: any) {
          console.error('Error during database upgrade:', upgradeError);
          // The transaction will automatically abort on error
          reject(new Error(`Database upgrade failed: ${upgradeError?.message || 'Unknown error'}`));
        }
      };
    } catch (error: any) {
      console.error('Error opening IndexedDB:', error);
      reject(new Error(`Failed to open IndexedDB: ${error?.message || 'Unknown error'}`));
    }
  });
};

// --- AUTH / USERS ---

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  age?: number,
  height?: number,
  weight?: number,
  strongFoot?: 'Left' | 'Right',
  position?: string,
  role: UserRole = 'player'
): Promise<User> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USER_STORE], 'readwrite');
    const store = transaction.objectStore(USER_STORE);
    const emailIndex = store.index('email');

    const checkRequest = emailIndex.get(email);

    checkRequest.onsuccess = () => {
      if (checkRequest.result) {
        reject('Email already registered');
        return;
      }

      const newUser: User = {
        id: uuidv4(),
        name,
        email,
        passwordHash: password, // Storing as plain text for stability in this demo
        role,
        age,
        height,
        weight,
        strongFoot,
        position: position as any,
        createdAt: Date.now()
      };

      const addRequest = store.add(newUser);
      addRequest.onsuccess = () => {
        notifyChanges();
        resolve(newUser);
      };
      addRequest.onerror = () => reject('Failed to register user');
    };

    checkRequest.onerror = () => reject('Database error checking email');
  });
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USER_STORE], 'readonly');
    const store = transaction.objectStore(USER_STORE);
    const index = store.index('email');
    const request = index.get(email);

    request.onsuccess = () => {
      const user = request.result as User;
      // Check if user exists AND password matches
      if (user && user.passwordHash === password) {
        resolve(user);
      } else {
        // Handle legacy base64 passwords if any exist from previous version
        if (user && user.passwordHash === btoa(password)) {
          resolve(user);
          return;
        }

        console.warn('Login failed: Invalid credentials for', email);
        reject('Invalid email or password');
      }
    };
    request.onerror = () => reject('Login failed due to database error');
  });
};

export const updateUser = async (user: User): Promise<User> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USER_STORE], 'readwrite');
    const store = transaction.objectStore(USER_STORE);
    const request = store.put(user);

    request.onsuccess = () => {
      notifyChanges();
      resolve(user);
    };
    request.onerror = () => reject('Error updating user');
  });
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USER_STORE], 'readonly');
    const store = transaction.objectStore(USER_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as User[]);
    request.onerror = () => reject('Error fetching users');
  });
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USER_STORE], 'readonly');
    const store = transaction.objectStore(USER_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching user');
  });
};

export const deleteUser = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USER_STORE], 'readwrite');
    const store = transaction.objectStore(USER_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting user');
  });
};

export const getUserByPlayerCardId = async (playerCardId: string): Promise<User | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([USER_STORE], 'readonly');
    const store = transaction.objectStore(USER_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const users = request.result as User[];
      const user = users.find(u => u.playerCardId === playerCardId);
      resolve(user);
    };
    request.onerror = () => reject('Error fetching user by player card id');
  });
};

export const addNotificationToUser = async (userId: string, notification: Notification): Promise<void> => {
  const user = await getUserById(userId);
  if (!user) return;

  const updatedUser = {
    ...user,
    notifications: [...(user.notifications || []), notification]
  };

  await updateUser(updatedUser);
};

export const clearUserNotifications = async (userId: string): Promise<void> => {
  const user = await getUserById(userId);
  if (!user) return;

  const updatedUser = {
    ...user,
    notifications: []
  };

  await updateUser(updatedUser);
};



// --- PLAYERS ---

export const savePlayer = async (player: Player): Promise<void> => {
  try {
    // Automatically update cardType based on overallScore before saving
    player.cardType = getCardTypeFromScore(player.overallScore);

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLAYER_STORE], 'readwrite');
      const store = transaction.objectStore(PLAYER_STORE);
      const request = store.put(player);

      request.onsuccess = () => {
        notifyChanges();
        resolve();
      };
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        console.error('IndexedDB Error saving player:', error, 'Player data:', player);
        reject(`Error saving player: ${error?.message || 'Unknown error'}`);
      };

      transaction.onerror = (event) => {
        const error = (event.target as IDBTransaction).error;
        console.error('Transaction Error saving player:', error, 'Player data:', player);
        reject(`Transaction error: ${error?.message || 'Unknown error'}`);
      };
    });
  } catch (error: any) {
    console.error('Failed to open database:', error);
    throw new Error(`Database connection failed: ${error?.message || 'Unknown error'}`);
  }
};

export const getAllPlayers = async (): Promise<Player[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYER_STORE], 'readonly');
    const store = transaction.objectStore(PLAYER_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching players');
  });
};

export const getPlayersByTeamId = async (teamId: string): Promise<Player[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYER_STORE], 'readonly');
    const store = transaction.objectStore(PLAYER_STORE);
    const index = store.index('teamId');
    const request = index.getAll(teamId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching team players');
  });
};

export const getPlayerById = async (id: string): Promise<Player | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYER_STORE], 'readonly');
    const store = transaction.objectStore(PLAYER_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching player');
  });
};

export const deletePlayer = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYER_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYER_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting player');
  });
};

export const deletePlayerAndNotifyUser = async (playerId: string): Promise<void> => {
  // 1. Get the user associated with this player card
  const user = await getUserByPlayerCardId(playerId);

  // 2. Delete the player card
  await deletePlayer(playerId);

  // 3. If user exists, update them: clear playerCardId and add notification
  if (user) {
    const notification: Notification = {
      id: uuidv4(),
      userId: user.id,
      type: 'card_deleted',
      title: 'Player Card Removed',
      message: 'Your player card has been removed by an admin. Please create a new card when you log back in.',
      createdAt: Date.now(),
      read: false
    };

    const updatedUser: User = {
      ...user,
      playerCardId: undefined, // Clear the link
      notifications: [...(user.notifications || []), notification]
    };

    await updateUser(updatedUser);
  }
};

// --- TEAMS ---

export const saveTeam = async (team: Team): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEAM_STORE], 'readwrite');
    const store = transaction.objectStore(TEAM_STORE);
    const request = store.put(team);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving team');
  });
};

export const getAllTeams = async (): Promise<Team[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEAM_STORE], 'readonly');
    const store = transaction.objectStore(TEAM_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching teams');
  });
};

export const getTeamById = async (id: string): Promise<Team | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEAM_STORE], 'readonly');
    const store = transaction.objectStore(TEAM_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching team');
  });
};

export const deleteTeam = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEAM_STORE], 'readwrite');
    const store = transaction.objectStore(TEAM_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting team');
  });
};

// --- PLAYER REGISTRATION REQUESTS ---

export const savePlayerRegistrationRequest = async (request: PlayerRegistrationRequest): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REGISTRATION_STORE], 'readwrite');
    const store = transaction.objectStore(REGISTRATION_STORE);
    const addRequest = store.put(request);

    addRequest.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    addRequest.onerror = () => reject('Error saving registration request');
  });
};

export const getAllPlayerRegistrationRequests = async (): Promise<PlayerRegistrationRequest[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REGISTRATION_STORE], 'readonly');
    const store = transaction.objectStore(REGISTRATION_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching registration requests');
  });
};

export const getPendingPlayerRegistrationRequests = async (): Promise<PlayerRegistrationRequest[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REGISTRATION_STORE], 'readonly');
    const store = transaction.objectStore(REGISTRATION_STORE);
    const statusIndex = store.index('status');
    const request = statusIndex.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching pending requests');
  });
};

export const getPlayerRegistrationRequestById = async (id: string): Promise<PlayerRegistrationRequest | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REGISTRATION_STORE], 'readonly');
    const store = transaction.objectStore(REGISTRATION_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching registration request');
  });
};

export const updatePlayerRegistrationRequest = async (request: PlayerRegistrationRequest): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REGISTRATION_STORE], 'readwrite');
    const store = transaction.objectStore(REGISTRATION_STORE);
    const updateRequest = store.put(request);

    updateRequest.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    updateRequest.onerror = () => reject('Error updating registration request');
  });
};

export const deletePlayerRegistrationRequest = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REGISTRATION_STORE], 'readwrite');
    const store = transaction.objectStore(REGISTRATION_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting registration request');
  });
};

export const togglePlayerLike = async (playerId: string, userId: string): Promise<void> => {
  const player = await getPlayerById(playerId);
  if (!player) return;

  const likedBy = player.likedBy || [];
  const hasLiked = likedBy.includes(userId);

  let newLikedBy: string[];
  let newLikes: number;

  if (hasLiked) {
    newLikedBy = likedBy.filter(id => id !== userId);
    newLikes = Math.max(0, (player.likes || 0) - 1);
  } else {
    newLikedBy = [...likedBy, userId];
    newLikes = (player.likes || 0) + 1;
  }

  const updatedPlayer = {
    ...player,
    likes: newLikes,
    likedBy: newLikedBy
  };

  await savePlayer(updatedPlayer);
};

// ============================================
// MATCH MANAGEMENT
// ============================================

export const saveMatch = async (match: Match): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_STORE], 'readwrite');
    const store = transaction.objectStore(MATCH_STORE);
    const request = store.put(match);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving match');
  });
};

export const getAllMatches = async (): Promise<Match[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_STORE], 'readonly');
    const store = transaction.objectStore(MATCH_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching matches');
  });
};

export const getMatchById = async (id: string): Promise<Match | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_STORE], 'readonly');
    const store = transaction.objectStore(MATCH_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching match');
  });
};

export const getMatchesByStatus = async (status: string): Promise<Match[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_STORE], 'readonly');
    const store = transaction.objectStore(MATCH_STORE);
    const index = store.index('status');
    const request = index.getAll(status);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching matches by status');
  });
};

export const getMatchesByTeam = async (teamId: string): Promise<Match[]> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const allMatches = await getAllMatches();
      const teamMatches = allMatches.filter(
        m => m.homeTeamId === teamId || m.awayTeamId === teamId
      );
      resolve(teamMatches);
    } catch (error) {
      reject('Error fetching team matches');
    }
  });
};

export const addPlayerToTeam = async (playerId: string, teamId: string): Promise<void> => {
  const player = await getPlayerById(playerId);
  if (!player) throw new Error('Player not found');

  const updatedPlayer = {
    ...player,
    teamId,
    updatedAt: Date.now()
  };

  await savePlayer(updatedPlayer);
};

export const removePlayerFromTeam = async (playerId: string): Promise<void> => {
  const player = await getPlayerById(playerId);
  if (!player) throw new Error('Player not found');

  const updatedPlayer = {
    ...player,
    teamId: undefined,
    updatedAt: Date.now()
  };

  await savePlayer(updatedPlayer);
};

export const deleteMatch = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_STORE], 'readwrite');
    const store = transaction.objectStore(MATCH_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting match');
  });
};

// ============================================
// MATCH VERIFICATIONS
// ============================================

export const saveMatchVerification = async (verification: MatchVerification): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_VERIFICATION_STORE], 'readwrite');
    const store = transaction.objectStore(MATCH_VERIFICATION_STORE);
    const request = store.put(verification);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving match verification');
  });
};

export const getMatchVerifications = async (matchId: string): Promise<MatchVerification[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_VERIFICATION_STORE], 'readonly');
    const store = transaction.objectStore(MATCH_VERIFICATION_STORE);
    const index = store.index('matchId');
    const request = index.getAll(matchId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching match verifications');
  });
};

export const getVerificationByTeam = async (matchId: string, teamId: string): Promise<MatchVerification | undefined> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const verifications = await getMatchVerifications(matchId);
      const verification = verifications.find(v => v.teamId === teamId);
      resolve(verification);
    } catch (error) {
      reject('Error fetching team verification');
    }
  });
};

// ============================================
// TEAM INVITATIONS
// ============================================

export const saveTeamInvitation = async (invitation: TeamInvitation): Promise<void> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = db.transaction([TEAM_INVITATION_STORE], 'readwrite');
      const store = transaction.objectStore(TEAM_INVITATION_STORE);
      const request = store.put(invitation);

      request.onsuccess = async () => {
        // Create notification for the invited player
        const notification: Notification = {
          id: uuidv4(),
          userId: invitation.playerId,
          type: 'team_invitation',
          title: 'Team Invitation',
          message: `You have been invited to join ${invitation.teamName} by ${invitation.captainName}`,
          metadata: {
            invitationId: invitation.id,
            teamId: invitation.teamId,
            teamName: invitation.teamName,
            captainName: invitation.captainName
          },
          read: false,
          createdAt: Date.now()
        };
        await createNotification(notification);

        notifyChanges();
        resolve();
      };
      request.onerror = () => reject('Error saving team invitation');
    } catch (error) {
      reject('Error saving team invitation');
    }
  });
};

export const getTeamInvitations = async (playerId: string): Promise<TeamInvitation[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEAM_INVITATION_STORE], 'readonly');
    const store = transaction.objectStore(TEAM_INVITATION_STORE);
    const index = store.index('playerId');
    const request = index.getAll(playerId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching team invitations');
  });
};

export const getPendingInvitationsForTeam = async (teamId: string): Promise<TeamInvitation[]> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = db.transaction([TEAM_INVITATION_STORE], 'readonly');
      const store = transaction.objectStore(TEAM_INVITATION_STORE);
      const index = store.index('teamId');
      const request = index.getAll(teamId);

      request.onsuccess = () => {
        const invitations = request.result as TeamInvitation[];
        resolve(invitations.filter(inv => inv.status === 'pending'));
      };
      request.onerror = () => reject('Error fetching team invitations');
    } catch (error) {
      reject('Error fetching team invitations');
    }
  });
};

export const updateInvitationStatus = async (invitationId: string, status: 'accepted' | 'rejected'): Promise<void> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = db.transaction([TEAM_INVITATION_STORE], 'readwrite');
      const store = transaction.objectStore(TEAM_INVITATION_STORE);
      const getRequest = store.get(invitationId);

      getRequest.onsuccess = async () => {
        const invitation = getRequest.result as TeamInvitation;
        if (!invitation) {
          reject('Invitation not found');
          return;
        }

        invitation.status = status;
        invitation.respondedAt = Date.now();

        const updateRequest = store.put(invitation);
        updateRequest.onsuccess = async () => {
          // Handle side effects based on status
          if (status === 'accepted') {
            // 1. Update Player's teamId
            // The invitation uses userId as playerId. We need to find the actual Player Card ID if it exists.
            let playerIdToUpdate = invitation.playerId;
            try {
              // Try to find via User first
              const user = await getUserById(invitation.playerId);
              if (user && user.playerCardId) {
                playerIdToUpdate = user.playerCardId;
              }
            } catch (ignore) {
              // If user lookup fails, fall back to using the ID as is
            }

            const player = await getPlayerById(playerIdToUpdate);
            if (player) {
              player.teamId = invitation.teamId;
              await savePlayer(player);
            } else {
              console.warn(`Could not find player card to update team membership. User ID: ${invitation.playerId}, Target ID: ${playerIdToUpdate}`);
            }

            // 2. Notify Captain
            const notification: Notification = {
              id: uuidv4(),
              userId: invitation.invitedBy,
              type: 'invitation_accepted',
              title: 'Invitation Accepted',
              message: `${invitation.playerName} has accepted your invitation to join ${invitation.teamName}`,
              metadata: {
                invitationId: invitation.id,
                playerId: invitation.playerId,
                playerName: invitation.playerName
              },
              read: false,
              createdAt: Date.now()
            };
            await createNotification(notification);
          } else if (status === 'rejected') {
            // Notify Captain
            const notification: Notification = {
              id: uuidv4(),
              userId: invitation.invitedBy,
              type: 'invitation_rejected',
              title: 'Invitation Rejected',
              message: `${invitation.playerName} has declined your invitation to join ${invitation.teamName}`,
              metadata: {
                invitationId: invitation.id,
                playerId: invitation.playerId,
                playerName: invitation.playerName
              },
              read: false,
              createdAt: Date.now()
            };
            await createNotification(notification);
          }

          notifyChanges();
          resolve();
        };
        updateRequest.onerror = () => reject('Error updating invitation');
      };
      getRequest.onerror = () => reject('Error fetching invitation');
    } catch (error) {
      reject('Error updating invitation status');
    }
  });
};

export const deleteTeamInvitation = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TEAM_INVITATION_STORE], 'readwrite');
    const store = transaction.objectStore(TEAM_INVITATION_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting team invitation');
  });
};

// ============================================
// MATCH DISPUTES
// ============================================

export const saveMatchDispute = async (dispute: MatchDispute): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_DISPUTE_STORE], 'readwrite');
    const store = transaction.objectStore(MATCH_DISPUTE_STORE);
    const request = store.put(dispute);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving match dispute');
  });
};

export const getMatchDisputes = async (matchId: string): Promise<MatchDispute[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_DISPUTE_STORE], 'readonly');
    const store = transaction.objectStore(MATCH_DISPUTE_STORE);
    const index = store.index('matchId');
    const request = index.getAll(matchId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching match disputes');
  });
};

export const getPendingDisputes = async (): Promise<MatchDispute[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_DISPUTE_STORE], 'readonly');
    const store = transaction.objectStore(MATCH_DISPUTE_STORE);
    const index = store.index('status');
    const request = index.getAll('pending_review');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching pending disputes');
  });
};

// ============================================
// NOTIFICATIONS
// ============================================

export const createNotification = async (notification: Notification): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATION_STORE], 'readwrite');
    const store = transaction.objectStore(NOTIFICATION_STORE);
    const request = store.add(notification);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error creating notification');
  });
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATION_STORE], 'readonly');
    const store = transaction.objectStore(NOTIFICATION_STORE);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      const notifications = request.result as Notification[];
      notifications.sort((a, b) => b.createdAt - a.createdAt);
      resolve(notifications);
    };
    request.onerror = () => reject('Error fetching notifications');
  });
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATION_STORE], 'readwrite');
    const store = transaction.objectStore(NOTIFICATION_STORE);
    const getRequest = store.get(notificationId);

    getRequest.onsuccess = () => {
      const notification = getRequest.result as Notification;
      if (notification) {
        notification.read = true;
        const putRequest = store.put(notification);
        putRequest.onsuccess = () => {
          notifyChanges();
          resolve();
        };
        putRequest.onerror = () => reject('Error marking notification as read');
      } else {
        reject('Notification not found');
      }
    };
    getRequest.onerror = () => reject('Error fetching notification');
  });
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATION_STORE], 'readonly');
    const store = transaction.objectStore(NOTIFICATION_STORE);
    const index = store.index('userId');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      const notifications = request.result as Notification[];
      const unreadCount = notifications.filter(n => !n.read).length;
      resolve(unreadCount);
    };
    request.onerror = () => reject('Error counting unread notifications');
  });
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTIFICATION_STORE], 'readwrite');
    const store = transaction.objectStore(NOTIFICATION_STORE);
    const request = store.delete(notificationId);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting notification');
  });
};

// ============================================
// CAPTAIN STATS
// ============================================

export const getCaptainStats = async (userId: string): Promise<CaptainStats | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CAPTAIN_STATS_STORE], 'readonly');
    const store = transaction.objectStore(CAPTAIN_STATS_STORE);
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching captain stats');
  });
};

export const saveCaptainStats = async (stats: CaptainStats): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CAPTAIN_STATS_STORE], 'readwrite');
    const store = transaction.objectStore(CAPTAIN_STATS_STORE);
    const request = store.put(stats);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving captain stats');
  });
};

export const updateCaptainStats = async (userId: string, updates: Partial<CaptainStats>): Promise<void> => {
  const stats = await getCaptainStats(userId);
  if (!stats) {
    throw new Error('Captain stats not found');
  }

  const updatedStats: CaptainStats = { ...stats, ...updates };
  await saveCaptainStats(updatedStats);
};

export const calculateCaptainRank = (rankPoints: number): CaptainRank => {
  if (rankPoints >= 1000) return 'Master Captain';
  if (rankPoints >= 600) return 'Elite Captain';
  if (rankPoints >= 300) return 'Gold Captain';
  if (rankPoints >= 100) return 'Silver Captain';
  return 'Bronze Captain';
};

export const awardRankPoints = async (userId: string, points: number, reason: string): Promise<void> => {
  const stats = await getCaptainStats(userId);
  if (!stats) {
    throw new Error('Captain stats not found');
  }

  const newPoints = stats.rankPoints + points;
  const newRank = calculateCaptainRank(newPoints);
  const rankChanged = newRank !== stats.rank;

  await updateCaptainStats(userId, {
    rankPoints: newPoints,
    rank: newRank
  });

  if (rankChanged) {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      type: 'rank_promotion',
      title: `Promoted to ${newRank}!`,
      message: `Congratulations! You've been promoted to ${newRank}. ${reason}`,
      read: false,
      createdAt: Date.now()
    };
    await createNotification(notification);
  }
};

// ============================================
// MATCH REQUESTS
// ============================================

export const createMatchRequest = async (request: MatchRequest): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_REQUEST_STORE], 'readwrite');
    const store = transaction.objectStore(MATCH_REQUEST_STORE);
    const addRequest = store.add(request);

    addRequest.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    addRequest.onerror = () => reject('Error creating match request');
  });
};

export const getPendingMatchRequests = async (status: 'pending_admin' | 'pending_opponent' | 'pending' = 'pending_admin'): Promise<MatchRequest[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MATCH_REQUEST_STORE], 'readonly');
    const store = transaction.objectStore(MATCH_REQUEST_STORE);
    const index = store.index('status');
    // Handle legacy 'pending' status by also fetching it if 'pending_admin' is requested? 
    // Or simpler: just fetch specific status. 
    // Note: The UI for admin should likely iterate through 'pending_admin'.
    // The previous implementation defaulted to 'pending', so we should probably stick to strict typing for new requests.
    const request = index.getAll(status);

    request.onsuccess = () => {
      const requests = request.result as MatchRequest[];
      requests.sort((a, b) => b.createdAt - a.createdAt);
      resolve(requests);
    };
    request.onerror = () => reject('Error fetching pending match requests');
  });
};

// New: Allows opponent captain to confirm the match
export const confirmMatchRequestByOpponent = async (requestId: string, opponentCaptainId: string, awayTeamLineup: string[]): Promise<void> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = db.transaction([MATCH_REQUEST_STORE, NOTIFICATION_STORE], 'readwrite');
      const store = transaction.objectStore(MATCH_REQUEST_STORE);
      const getRequest = store.get(requestId);

      getRequest.onsuccess = async () => {
        const matchRequest = getRequest.result as MatchRequest;
        if (!matchRequest) {
          reject('Match request not found');
          return;
        }

        // Update request status
        matchRequest.status = 'pending_admin';
        matchRequest.opponentApproved = true;
        matchRequest.opponentApprovedAt = Date.now();
        matchRequest.awayTeamLineup = awayTeamLineup; // Save the lineup

        store.put(matchRequest);

        // Notify Admins that a match is ready for review
        const admins = await getAllUsers();
        const adminUsers = admins.filter(u => u.role === 'admin');

        for (const admin of adminUsers) {
          const notification: Notification = {
            id: uuidv4(),
            userId: admin.id,
            type: 'match_request_confirmed',
            title: 'Match Request Confirmed',
            message: `${matchRequest.homeTeamName} vs ${matchRequest.awayTeamName} - Both captains ready. Awaiting your approval.`,
            metadata: {
              matchId: matchRequest.matchId,
              requestId: matchRequest.id,
              teamId: matchRequest.homeTeamId,
              captainName: matchRequest.requestedByName
            },
            actionUrl: '/admin/matches',
            read: false,
            createdAt: Date.now()
          };
          await createNotification(notification);
        }

        // Notify Home Team Captain (Requestor)
        const notification: Notification = {
          id: uuidv4(),
          userId: matchRequest.requestedBy,
          type: 'match_request',
          title: 'Challenge Accepted!',
          message: `${matchRequest.awayTeamName} accepted your challenge. The match is now waiting for admin approval.`,
          read: false,
          createdAt: Date.now(),
          metadata: {
            matchId: matchRequest.matchId,
            teamId: matchRequest.awayTeamId,
            teamName: matchRequest.awayTeamName
          }
        };
        await createNotification(notification);

        notifyChanges();
        resolve();
      };
      getRequest.onerror = () => reject('Error fetching match request');
    } catch (error) {
      reject('Error confirming match request');
    }
  });
};

export const approveMatchRequest = async (requestId: string, adminId: string): Promise<void> => {
  return updateMatchRequestStatus(requestId, 'approved', undefined, adminId);
};

export const rejectMatchRequest = async (requestId: string, adminId: string, reason: string): Promise<void> => {
  return updateMatchRequestStatus(requestId, 'rejected', reason, adminId);
};

export const saveMatchRequest = async (request: MatchRequest): Promise<void> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = db.transaction([MATCH_REQUEST_STORE, NOTIFICATION_STORE], 'readwrite');
      const store = transaction.objectStore(MATCH_REQUEST_STORE);

      // Ensure status is pending_opponent initially
      const newRequest = { ...request, status: 'pending_opponent' as const };
      const req = store.put(newRequest);

      req.onsuccess = async () => {
        // Notify Opponent Captain
        const awayTeam = await getTeamById(request.awayTeamId);
        if (awayTeam) {
          const notification: Notification = {
            id: uuidv4(),
            userId: awayTeam.captainId,
            type: 'match_request',
            title: 'New Match Challenge',
            message: `${request.requestedByName} (${request.homeTeamName}) challenges you to a match!`,
            metadata: {
              matchId: request.matchId,
              requestId: request.id,
              teamId: request.homeTeamId,
              captainName: request.requestedByName
            },
            read: false,
            createdAt: Date.now(),
            actionUrl: `/notifications`
          };
          await createNotification(notification);
        }

        notifyChanges();
        resolve();
      };
      req.onerror = () => reject('Error saving match request');
    } catch (error) {
      reject('Error saving match request');
    }
  });
};

export const getAllMatchRequests = async (): Promise<MatchRequest[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([MATCH_REQUEST_STORE], 'readonly');
      const store = transaction.objectStore(MATCH_REQUEST_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error fetching match requests');
    } catch (error) {
      reject('Error fetching match requests');
    }
  });
};

export const updateMatchRequestStatus = async (requestId: string, status: 'approved' | 'rejected', rejectionReason?: string, adminId?: string): Promise<void> => {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = db.transaction([MATCH_REQUEST_STORE, MATCH_STORE, NOTIFICATION_STORE], 'readwrite');
      const requestStore = transaction.objectStore(MATCH_REQUEST_STORE);

      const getRequest = requestStore.get(requestId);

      getRequest.onsuccess = async () => {
        const matchRequest = getRequest.result as MatchRequest;
        if (!matchRequest) {
          reject('Match request not found');
          return;
        }

        matchRequest.status = status;
        matchRequest.reviewedAt = Date.now();
        if (adminId) matchRequest.reviewedBy = adminId;
        if (rejectionReason) matchRequest.rejectionReason = rejectionReason;

        requestStore.put(matchRequest);

        // If approved, create the match
        if (status === 'approved') {
          const matchStore = transaction.objectStore(MATCH_STORE);
          const newMatch: Match = {
            id: matchRequest.matchId, // Use the ID generated in the request
            homeTeamId: matchRequest.homeTeamId,
            awayTeamId: matchRequest.awayTeamId,
            homeScore: 0,
            awayScore: 0,
            status: 'running', // Start immediately upon approval
            homePlayerIds: matchRequest.homeTeamLineup || [], // Populate from lineup
            awayPlayerIds: matchRequest.awayTeamLineup || [], // Populate from lineup
            events: [],
            createdAt: Date.now(),
            startedAt: Date.now(),
            isExternal: true,
            createdBy: matchRequest.requestedBy,
          };
          matchStore.put(newMatch);
        }

        // Notify Both Captains
        const requestingCaptainId = matchRequest.requestedBy;
        const awayTeam = await getTeamById(matchRequest.awayTeamId); // We need to find the other captain ID
        const opponentCaptainId = awayTeam?.captainId;

        const commonNotification = {
          id: uuidv4(),
          type: status === 'approved' ? 'match_approved' : 'match_rejected',
          title: `Match Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: status === 'approved'
            ? `The match ${matchRequest.homeTeamName} vs ${matchRequest.awayTeamName} has been approved and started!`
            : `Match request was rejected: ${rejectionReason || 'No reason provided'}`,
          metadata: {
            matchId: matchRequest.matchId,
            teamId: matchRequest.homeTeamId
          },
          read: false,
          createdAt: Date.now()
        } as const;

        // Notify Requestor
        await createNotification({ ...commonNotification, id: uuidv4(), userId: requestingCaptainId });

        // Notify Opponent (if found)
        if (opponentCaptainId) {
          await createNotification({ ...commonNotification, id: uuidv4(), userId: opponentCaptainId });
        }

        notifyChanges();
        resolve();
      };
      getRequest.onerror = () => reject('Error updating match request');
    } catch (error) {
      reject('Error updating match request');
    }
  });
};

// ============================================
// EVENTS MANAGEMENT
// ============================================

export const saveEvent = async (event: AppEvent): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENT_STORE], 'readwrite');
    const store = transaction.objectStore(EVENT_STORE);
    const request = store.put(event);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving event');
  });
};

export const getEventById = async (eventId: string): Promise<Event | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENT_STORE], 'readonly');
    const store = transaction.objectStore(EVENT_STORE);
    const request = store.get(eventId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching event');
  });
};

export const updateEvent = async (event: Event): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENT_STORE], 'readwrite');
    const store = transaction.objectStore(EVENT_STORE);
    const request = store.put(event);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error updating event');
  });
};

export const getAllEvents = async (): Promise<AppEvent[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENT_STORE], 'readonly');
    const store = transaction.objectStore(EVENT_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching events');
  });
};

export const deleteEvent = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENT_STORE], 'readwrite');
    const store = transaction.objectStore(EVENT_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting event');
  });
};

export const registerTeamForEvent = async (eventId: string, teamInfo: { teamId: string, teamName: string, captainId: string, captainName: string }): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([EVENT_STORE], 'readwrite');
    const store = transaction.objectStore(EVENT_STORE);
    const getRequest = store.get(eventId);

    getRequest.onsuccess = async () => {
      const event = getRequest.result as AppEvent;
      if (!event) {
        reject('Event not found');
        return;
      }

      if (!event.registeredTeams) {
        event.registeredTeams = [];
      }

      // Check if already registered
      if (event.registeredTeams.some(t => t.teamId === teamInfo.teamId)) {
        resolve();
        return;
      }

      event.registeredTeams.push({
        ...teamInfo,
        registeredAt: Date.now(),
        status: 'pending'
      });

      const updateRequest = store.put(event);
      updateRequest.onsuccess = async () => {
        notifyChanges();

        // Notify Admins
        try {
          await notifyAdmins(
            'New Event Registration',
            `Team ${teamInfo.teamName} has registered for "${event.title}".`,
            { eventId: event.id, teamId: teamInfo.teamId }
          );
        } catch (err) {
          console.error('Failed to notify admins', err);
        }

        resolve();
      };
      updateRequest.onerror = () => reject('Failed to update event registration');
    };
    getRequest.onerror = () => reject('Failed to fetch event');
  });
};

export const getAdmins = async (): Promise<User[]> => {
  const users = await getAllUsers();
  return users.filter(u => u.role === 'admin');
};

export const notifyAdmins = async (title: string, message: string, metadata?: any): Promise<void> => {
  const admins = await getAdmins();
  const notifications = admins.map(admin => createNotification({
    id: uuidv4(),
    userId: admin.id,
    type: 'match_request', // utilizing existing type or 'team_invitation' - let's use match_request as it's actionable
    title,
    message,
    read: false,
    createdAt: Date.now(),
    metadata
  }));
  await Promise.all(notifications);
};

export const notifyAllUsers = async (title: string, message: string, metadata?: any): Promise<void> => {
  const users = await getAllUsers();
  // Exclude the creator if possible, but simplest is all.
  const notifications = users.map(user => createNotification({
    id: uuidv4(),
    userId: user.id,
    type: 'match_request', // generic info
    title,
    message,
    read: false,
    createdAt: Date.now(),
    metadata
  }));
  await Promise.all(notifications);
};

export const updateEventRegistrationStatus = async (eventId: string, teamId: string, status: 'approved' | 'rejected'): Promise<void> => {
  const db = await openDB();
  const event = await new Promise<AppEvent>((resolve, reject) => {
    const transaction = db.transaction([EVENT_STORE], 'readonly');
    const store = transaction.objectStore(EVENT_STORE);
    const req = store.get(eventId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject('Event not found');
  });

  if (!event || !event.registeredTeams) return;

  const teamIndex = event.registeredTeams.findIndex(t => t.teamId === teamId);
  if (teamIndex === -1) return;

  event.registeredTeams[teamIndex].status = status;

  await saveEvent(event);

  // Notify Captain
  const reg = event.registeredTeams[teamIndex];
  if (reg.captainId) {
    await createNotification({
      id: uuidv4(),
      userId: reg.captainId,
      type: status === 'approved' ? 'invitation_accepted' : 'invitation_rejected',
      title: `Registration ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your registration for "${event.title}" has been ${status}.`,
      read: false,
      createdAt: Date.now(),
      metadata: { eventId: event.id }
    });
  }
};

export const updateTeamRankings = async (): Promise<void> => {
  const db = await openDB();
  const allTeams = await getAllTeams();

  // Sort by XP descending
  allTeams.sort((a, b) => (b.experiencePoints || 0) - (a.experiencePoints || 0));

  const transaction = db.transaction([TEAM_STORE], 'readwrite');
  const store = transaction.objectStore(TEAM_STORE);

  for (let i = 0; i < allTeams.length; i++) {
    const team = allTeams[i];
    team.ranking = i + 1;
    store.put(team);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      notifyChanges();
      resolve();
    };
    transaction.onerror = () => reject('Error updating team rankings');
  });
};

// ============================================
// SCOUT SYSTEM FUNCTIONS
// ============================================

export const saveScoutProfile = async (profile: ScoutProfile): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SCOUT_PROFILE_STORE], 'readwrite');
    const store = transaction.objectStore(SCOUT_PROFILE_STORE);
    const request = store.put(profile);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving scout profile');
  });
};

export const getScoutProfile = async (userId: string): Promise<ScoutProfile | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SCOUT_PROFILE_STORE], 'readonly');
    const store = transaction.objectStore(SCOUT_PROFILE_STORE);
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching scout profile');
  });
};

export const trackScoutActivity = async (
  scoutId: string,
  scoutName: string,
  actionType: 'view_player' | 'view_team',
  entityId: string,
  entityName: string,
  entityType: 'player' | 'team'
): Promise<void> => {
  const db = await openDB();

  // 1. Save Activity Log
  const activity: ScoutActivity = {
    id: uuidv4(),
    scoutId,
    scoutName,
    actionType,
    entityId,
    entityName,
    entityType,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  };

  const activityPromise = new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([SCOUT_ACTIVITY_STORE], 'readwrite');
    const store = transaction.objectStore(SCOUT_ACTIVITY_STORE);
    const request = store.put(activity);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving scout activity');
  });

  // 2. Update Scout Profile Stats
  const profilePromise = getScoutProfile(scoutId).then(async (profile) => {
    if (profile) {
      const updatedProfile: ScoutProfile = {
        ...profile,
        lastActive: Date.now(),
        totalProfilesViewed: profile.totalProfilesViewed + 1,
        totalPlayersViewed: actionType === 'view_player' ? profile.totalPlayersViewed + 1 : profile.totalPlayersViewed,
        totalTeamsViewed: actionType === 'view_team' ? profile.totalTeamsViewed + 1 : profile.totalTeamsViewed
      };
      await saveScoutProfile(updatedProfile);
    }
  });

  // 3. Notify Admins
  const notifyAdminsPromise = getAllUsers().then(async (users) => {
    const admins = users.filter(u => u.role === 'admin');
    // Using 'match_request' as a generic placeholder type that is allowed
    // Ideally we add a new type 'scout_alert' to types.ts but I want to avoid massive refactors for now.
    // I'll cast to 'any' to avoid TS error on 'type'.

    for (const admin of admins) {
      const notification: Notification = {
        id: uuidv4(),
        userId: admin.id,
        type: 'scout_alert',
        title: `Scout Activity Alert`,
        message: `Scout ${scoutName} is viewing ${entityType}: ${entityName}`,
        read: false,
        createdAt: Date.now()
      };
      await addNotificationToUser(admin.id, notification);
    }
  });

  await Promise.all([activityPromise, profilePromise, notifyAdminsPromise]);
  notifyChanges();
};

export const getAllScoutProfiles = async (): Promise<ScoutProfile[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SCOUT_PROFILE_STORE], 'readonly');
    const store = transaction.objectStore(SCOUT_PROFILE_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching scout profiles');
  });
};

export const getScoutActivity = async (scoutId: string): Promise<ScoutActivity[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SCOUT_ACTIVITY_STORE], 'readonly');
    const store = transaction.objectStore(SCOUT_ACTIVITY_STORE);
    const index = store.index('scoutId');
    const request = index.getAll(scoutId);

    request.onsuccess = () => {
      // Sort by timestamp desc
      const results = request.result as ScoutActivity[];
      results.sort((a, b) => b.timestamp - a.timestamp);
      resolve(results);
    };
    request.onerror = () => reject('Error fetching scout activity');
  });
};

export const getAllScoutActivity = async (): Promise<ScoutActivity[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SCOUT_ACTIVITY_STORE], 'readonly');
    const store = transaction.objectStore(SCOUT_ACTIVITY_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching scout activity');
  });
};

export const registerScout = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  scoutType: 'Independent' | 'Club',
  organization?: string
): Promise<User> => {
  // 1. Register User
  const user = await registerUser(name, email, password, undefined, undefined, undefined, undefined, undefined, 'scout');

  // 2. Create Scout Profile
  const profile: ScoutProfile = {
    userId: user.id,
    phone,
    scoutType,
    organization,
    totalProfilesViewed: 0,
    totalPlayersViewed: 0,
    totalTeamsViewed: 0,
    createdAt: Date.now(),
    lastActive: Date.now()
  };

  await saveScoutProfile(profile);

  // 3. Notify Admins
  const allUsers = await getAllUsers();
  const admins = allUsers.filter(u => u.role === 'admin');
  for (const admin of admins) {
    await addNotificationToUser(admin.id, {
      id: uuidv4(),
      userId: admin.id,
      type: 'scout_alert',
      title: 'New Scout Registration',
      message: `A new scout has joined: ${name} (${scoutType}${organization ? ` - ${organization}` : ''})`,
      read: false,
      createdAt: Date.now()
    });
  }

  return user;
};

// ============================================
// KITS SYSTEM
// ============================================

export const saveKit = async (kit: Kit): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KITS_STORE], 'readwrite');
    const store = transaction.objectStore(KITS_STORE);
    const request = store.put(kit);
    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving kit');
  });
};

export const getAllKits = async (): Promise<Kit[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KITS_STORE], 'readonly');
    const store = transaction.objectStore(KITS_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching kits');
  });
};

export const getVisibleKits = async (): Promise<Kit[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KITS_STORE], 'readonly');
    const store = transaction.objectStore(KITS_STORE);
    const allRequest = store.getAll();
    allRequest.onsuccess = () => {
      const kits = allRequest.result as Kit[];
      resolve(kits.filter(k => k.isVisible));
    };
    allRequest.onerror = () => reject('Error fetching visible kits');
  });
};

export const deleteKit = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KITS_STORE], 'readwrite');
    const store = transaction.objectStore(KITS_STORE);
    const request = store.delete(id);
    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error deleting kit');
  });
};

// --- KIT REQUESTS ---

export const saveKitRequest = async (req: KitRequest): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KIT_REQUESTS_STORE], 'readwrite');
    const store = transaction.objectStore(KIT_REQUESTS_STORE);
    const request = store.put(req);
    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving kit request');
  });
};

export const createKitRequest = async (req: KitRequest): Promise<void> => {
  await saveKitRequest(req);
  // Notify all admins
  const users = await getAllUsers();
  const admins = users.filter(u => u.role === 'admin');
  for (const admin of admins) {
    const notification: Notification = {
      id: uuidv4(),
      userId: admin.id,
      type: 'system_announcement',
      title: 'New Kit Request',
      message: `New kit request from ${req.userName} (${req.type})`,
      read: false,
      createdAt: Date.now(),
      actionUrl: '/admin/kit-requests'
    };
    await createNotification(notification);
  }
};

export const updateKitRequestStatus = async (requestId: string, status: KitRequestStatus, adminNotes?: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KIT_REQUESTS_STORE], 'readwrite');
    const store = transaction.objectStore(KIT_REQUESTS_STORE);
    const getReq = store.get(requestId);

    getReq.onsuccess = async () => {
      const req = getReq.result as KitRequest;
      if (!req) { reject('Request not found'); return; }

      const updatedReq = { ...req, status, adminNotes: adminNotes ?? req.adminNotes, updatedAt: Date.now() };
      const putReq = store.put(updatedReq);

      putReq.onsuccess = async () => {
        notifyChanges();
        // Notify User
        const notification: Notification = {
          id: uuidv4(),
          userId: req.userId,
          type: 'system_announcement',
          title: 'Kit Request Update 👕',
          message: adminNotes
            ? `Your request is now ${status}. Admin says: ${adminNotes}`
            : `Your kit request status has been updated to: ${status}`,
          read: false,
          createdAt: Date.now(),
          actionUrl: '/kits?tab=requests'
        };
        await addNotificationToUser(req.userId, notification);
        resolve();
      };
      putReq.onerror = () => reject('Error updating request');
    };
    getReq.onerror = () => reject('Error fetching request');
  });
};

export const addKitRequestMessage = async (requestId: string, message: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KIT_REQUESTS_STORE], 'readwrite');
    const store = transaction.objectStore(KIT_REQUESTS_STORE);
    const getReq = store.get(requestId);

    getReq.onsuccess = async () => {
      const req = getReq.result as KitRequest;
      if (!req) { reject('Request not found'); return; }

      const updatedReq = { ...req, adminNotes: message, updatedAt: Date.now() };
      const putReq = store.put(updatedReq);

      putReq.onsuccess = async () => {
        notifyChanges();
        // Notify User
        const notification: Notification = {
          id: uuidv4(),
          userId: req.userId,
          type: 'system_announcement',
          title: 'New Kit Request Message 📩',
          message: `Admin sent you a message: ${message}`,
          read: false,
          createdAt: Date.now(),
          actionUrl: '/kits?tab=requests'
        };
        await addNotificationToUser(req.userId, notification);
        resolve();
      };
      putReq.onerror = () => reject('Error updating message');
    };
    getReq.onerror = () => reject('Error fetching request');
  });
};

export const getAllKitRequests = async (): Promise<KitRequest[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KIT_REQUESTS_STORE], 'readonly');
    const store = transaction.objectStore(KIT_REQUESTS_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as KitRequest[];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject('Error fetching kit requests');
  });
};
export const getKitRequestsByUserId = async (userId: string): Promise<KitRequest[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([KIT_REQUESTS_STORE], 'readonly');
    const store = transaction.objectStore(KIT_REQUESTS_STORE);
    const index = store.index('userId');
    const request = index.getAll(userId);
    request.onsuccess = () => {
      const results = request.result as KitRequest[];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject('Error fetching kit requests');
  });
};
