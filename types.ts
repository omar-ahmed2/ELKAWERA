
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

export type UserRole = 'admin' | 'player' | 'captain';

export interface Notification {
  id: string;
  type: 'card_rejected' | 'card_deleted' | 'team_invitation' | 'match_scheduled' | 'match_result';
  message: string;
  timestamp: number;
  read: boolean;
  relatedId?: string; // ID of the invitation, match, etc.
  senderName?: string;
  actionUrl?: string;
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
  captainId?: string; // User ID of the team captain
  experiencePoints?: number; // XP from external matches
  ranking?: number; // Team strength ranking
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
  defensiveContributions: number; // New stat
  cleanSheets: number; // New stat
  penaltySaves: number; // New stat (GK only)
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

// ============================================
// MATCH SYSTEM TYPES
// ============================================

export type MatchStatus = 'running' | 'finished' | 'awaiting_confirmation';

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  homePlayerIds: string[]; // Array of player IDs
  awayPlayerIds: string[]; // Array of player IDs
  manOfTheMatch?: string; // Player ID of MVP
  events: MatchEvent[];
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  isExternal: boolean; // True if created by captain, false if admin match
  createdBy: string; // User ID of creator (admin or captain)
}

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  type: 'goal' | 'assist' | 'clean_sheet' | 'penalty_save' | 'defensive_contribution';
  minute?: number;
  timestamp: number;
}

export interface PlayerEvaluation {
  matchId: string;
  playerId: string;
  goals: number;
  assists: number;
  defensiveContributions: number;
  cleanSheets: boolean;
  penaltySaves: number;
}

// ============================================
// TEAM INVITATION TYPES
// ============================================

export interface TeamInvitation {
  id: string;
  teamId: string;
  playerId: string; // User ID of the player being invited
  playerName: string; // For display purposes
  invitedBy: string; // Captain user ID
  captainName: string; // For display purposes
  teamName: string; // For display purposes
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
  respondedAt?: number;
}

// ============================================
// ANTI-CHEATING / VERIFICATION TYPES
// ============================================

export interface MatchVerification {
  id: string;
  matchId: string;
  teamId: string;
  teamName: string; // For display
  // Pre-Match Verification
  preMatchPhoto?: string; // base64 encoded image
  preMatchPhotoUploaded: boolean;
  preMatchUploadedAt?: number;
  // Post-Match Verification
  postMatchSubmitted: boolean;
  submittedScore?: { home: number; away: number };
  goalscorers?: string[]; // Array of player names
  matchSummary?: string;
  goalClips?: string[]; // base64 or URLs
  postMatchSubmittedAt?: number;
}

export interface MatchDispute {
  id: string;
  matchId: string;
  homeVerificationId: string;
  awayVerificationId: string;
  discrepancies: string[]; // List of what doesn't match
  status: 'pending_review' | 'resolved';
  resolvedBy?: string; // Admin user ID
  resolution?: string;
  createdAt: number;
  resolvedAt?: number;
}
