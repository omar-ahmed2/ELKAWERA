
export type CardType = 'Silver' | 'Gold' | 'Platinum';

export type Position =
  | 'GK'
  | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB'
  | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM'
  | 'LW' | 'RW' | 'CF' | 'ST';

export interface PhysicalStats {
  pace: number;
  dribbling: number;
  shooting: number;
  passing: number;
  defending: number;
  stamina: number;
  physical: number;
  agility: number;
  acceleration: number;
}

export type UserRole = 'admin' | 'player';

export interface Notification {
  id: string;
  type: 'card_rejected' | 'card_deleted';
  message: string;
  timestamp: number;
  read: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Simulated hash
  profileImageUrl?: string; // New field for profile photo
  role: UserRole;
  country?: string; // For admins, defaults to Egypt
  // Player-specific fields
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  strongFoot?: 'Left' | 'Right';
  position?: Position;
  playerCardId?: string; // Link to Player card created by admin
  notifications?: Notification[]; // New field for notifications
  createdAt: number;
}

export interface PlayerRegistrationRequest {
  id: string;
  userId: string; // Link to User
  name: string;
  email: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  strongFoot: 'Left' | 'Right';
  position: Position;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logoUrl?: string;
  createdAt: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  position: Position;
  country: string;
  teamId?: string; // Link to Team
  cardType: CardType;
  imageUrl: string | null;
  overallScore: number;
  stats: PhysicalStats;
  goals: number;
  assists: number;
  matchesPlayed: number;
  createdAt: number;
  updatedAt: number;
  likes?: number; // New field for like count
  likedBy?: string[]; // Array of user IDs who liked the card
}

export const INITIAL_STATS: PhysicalStats = {
  pace: 60,
  dribbling: 60,
  shooting: 60,
  passing: 60,
  defending: 60,
  stamina: 60,
  physical: 60,
  agility: 60,
  acceleration: 60,
};
