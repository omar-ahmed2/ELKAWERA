
export type CardType = 'Silver' | 'Gold' | 'Elite' | 'Platinum';

export type Position = 'GK' | 'CB' | 'CF';

// Physical attributes and card stats system has been removed in favor of performance-only tracking.

export type UserRole = 'admin' | 'player' | 'captain' | 'scout';

// Captain Rank System
export type CaptainRank = 'Bronze Captain' | 'Silver Captain' | 'Gold Captain' | 'Elite Captain' | 'Master Captain';

export interface CaptainStats {
  userId: string;
  matchesManaged: number;
  wins: number;
  draws: number;
  losses: number;
  playersRecruited: number;
  verifiedMatches: number;
  rank: CaptainRank;
  rankPoints: number;
  createdAt: number;
}

// Enhanced Notification System
export type NotificationType =
  | 'team_invitation'
  | 'match_request'
  | 'match_request_confirmed' // New: When opponent captain accepts
  | 'match_approved' // Admin final approval
  | 'match_rejected'
  | 'match_result'
  | 'card_approved'
  | 'card_rejected'
  | 'card_deleted'
  | 'rank_promotion'
  | 'player_joined'
  | 'invitation_accepted'
  | 'invitation_rejected'
  | 'scout_alert'
  | 'system_announcement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string; // URL to redirect (e.g., to match request)
  metadata?: {
    teamId?: string;
    matchId?: string;
    invitationId?: string;
    requestId?: string; // Added for match requests
    captainName?: string;
    teamName?: string;
    playerName?: string;
    playerId?: string;
    eventId?: string; // New: For event-related notifications
  };
  read: boolean;
  createdAt: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string; // New field for phone number
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
  phone?: string;
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
  captainId: string;
  captainName: string;
  experiencePoints: number;
  ranking: number;
  wins: number;
  draws: number;
  losses: number;
  totalMatches: number;
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
  baseScore: number; // Base score before performance bonuses
  goals: number;
  assists: number;
  defensiveContributions: number; // New stat
  cleanSheets: number; // New stat
  penaltySaves: number; // New stat (GK only)
  saves: number; // General saves
  ownGoals: number;
  goalsConceded: number;
  penaltyMissed: number;
  matchesPlayed: number;
  createdAt: number;
  updatedAt: number;
  likes?: number; // New field for like count
  likedBy?: string[]; // Array of user IDs who liked the card
}

// INITIAL_STATS removed as the system now uses match performance and manual entry.

// ============================================
// MATCH SYSTEM TYPES
// ============================================

export type MatchStatus = 'running' | 'finished' | 'awaiting_confirmation' | 'scheduled' | 'cancelled';

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
  scheduledTime?: number; // When the match is scheduled to start
  location?: string; // Where the match will be played
  isExternal: boolean; // True if created by captain, false if admin match
  createdBy: string; // User ID of creator (admin or captain)
  eventId?: string; // Link to the event if this match is part of one
}

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  type: 'goal' | 'assist' | 'clean_sheet' | 'penalty_save' | 'save' | 'defensive_contribution';
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
  saves: number;
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

// ============================================
// MATCH APPROVAL WORKFLOW
// ============================================

export interface MatchRequest {
  id: string;
  matchId: string;
  requestedBy: string; // Captain user ID
  requestedByName: string; // Captain name for display
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  proposedDate?: number;
  // 'pending_opponent': Waiting for opposition captain to agree
  // 'pending_admin': Opponent agreed, waiting for admin to schedule/approve
  status: 'pending_opponent' | 'pending_admin' | 'approved' | 'rejected';
  reviewedBy?: string; // Admin user ID
  reviewedAt?: number;
  opponentApproved?: boolean;
  opponentApprovedAt?: number;
  rejectionReason?: string;
  homeTeamLineup?: string[]; // Array of player IDs
  awayTeamLineup?: string[]; // Array of player IDs
  createdAt: number;
}


// ============================================
// Events System
// ============================================

export type EventStatus = 'upcoming' | 'open' | 'ongoing' | 'completed' | 'ended' | 'cancelled';
export type EventCategory = 'tournament' | 'match' | 'training' | 'social' | 'other';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: number;
  endDate?: number;
  location: string;
  imageUrl?: string;
  status: EventStatus;
  category: EventCategory;
  maxParticipants?: number;
  participants: string[]; // Generic participant IDs (could be users)
  registeredTeams?: { // Specific for team events
    teamId: string;
    teamName: string;
    captainId: string; // Added captainId for notifications
    captainName: string;
    registeredAt: number;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
  schedulePublished?: boolean;
}

// ============================================
// SCOUT SYSTEM TYPES
// ============================================

export type ScoutType = 'Independent' | 'Club';

export interface ScoutProfile {
  userId: string; // Links to User.id
  phone?: string;
  scoutType: ScoutType;
  organization?: string; // Club/Academy Name or City/Region
  totalProfilesViewed: number;
  totalPlayersViewed: number;
  totalTeamsViewed: number;
  createdAt: number;
  lastActive: number;
}

export type TrackedActionType = 'view_player' | 'view_team';
export type TrackedEntityType = 'player' | 'team';

export interface ScoutActivity {
  id: string;
  scoutId: string;
  scoutName: string;
  actionType: TrackedActionType;
  entityId: string;
  entityName: string;
  entityType: TrackedEntityType;
  timestamp: number;
  // Optional metadata
  userAgent?: string;
}

// ============================================
// KIT SYSTEM TYPES
// ============================================

export interface Kit {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sizes: string[]; // e.g. ['S', 'M', 'L', 'XL']
  badge?: 'Official' | 'Limited' | 'Special Edition';
  isVisible: boolean;
  createdAt: number;
}

export type KitRequestType = 'official_kit' | 'custom_design';
export type KitRequestStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'archived';

export interface KitRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  teamId?: string;
  teamName?: string;
  type: KitRequestType;
  status: KitRequestStatus;

  // For Official Kit
  kitId?: string;
  kitName?: string;
  selectedSize?: string;
  quantity: number;

  // For Custom Design
  customImageUrl?: string;
  notes?: string;

  contactEmail: string;
  contactPhone: string;

  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
}
