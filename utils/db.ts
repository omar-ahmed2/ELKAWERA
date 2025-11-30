
import { Player, Team, User, PlayerRegistrationRequest, Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'ElkaweraDB';
const DB_VERSION = 6; // Bumped for player registration requests
const PLAYER_STORE = 'players';
const TEAM_STORE = 'teams';
const USER_STORE = 'users';
const REGISTRATION_STORE = 'registrations';

// Broadcast Channel for Real-time Sync
const syncChannel = new BroadcastChannel('elkawera_sync');

export const notifyChanges = () => {
  syncChannel.postMessage({ type: 'DB_UPDATE' });
};

// Listen for updates from other tabs
export const subscribeToChanges = (callback: () => void) => {
  syncChannel.onmessage = (event) => {
    if (event.data.type === 'DB_UPDATE') {
      callback();
    }
  };
  return () => {
    syncChannel.onmessage = null;
  };
};

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('Database error: ' + (event.target as IDBOpenDBRequest).error);

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction!;

      // Players Store
      if (!db.objectStoreNames.contains(PLAYER_STORE)) {
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
        db.createObjectStore(TEAM_STORE, { keyPath: 'id' });
      }

      // Users Store
      if (!db.objectStoreNames.contains(USER_STORE)) {
        const userStore = db.createObjectStore(USER_STORE, { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true });
      }

      // Player Registration Requests Store
      if (!db.objectStoreNames.contains(REGISTRATION_STORE)) {
        const regStore = db.createObjectStore(REGISTRATION_STORE, { keyPath: 'id' });
        regStore.createIndex('userId', 'userId', { unique: false });
        regStore.createIndex('status', 'status', { unique: false });
      }
    };
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
  position?: string
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
        role: 'player',
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PLAYER_STORE], 'readwrite');
    const store = transaction.objectStore(PLAYER_STORE);
    const request = store.put(player);

    request.onsuccess = () => {
      notifyChanges();
      resolve();
    };
    request.onerror = () => reject('Error saving player');
  });
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
      type: 'card_deleted',
      message: 'Your player card has been removed by an admin. Please create a new card when you log back in.',
      timestamp: Date.now(),
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
