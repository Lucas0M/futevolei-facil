export type UserRole = "SUPERADMIN" | "ADMIN" | "PLAYER";

export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  module: string;
  entity: string;
  entityId: string | null;
  description: string;
  oldData: any | null;
  newData: any | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}


export type RegistrationStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
export type TeamRegistrationStatus = RegistrationStatus;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type TournamentFormat = "INDIVIDUAL" | "DUO_FIXED" | "DUO_RANDOM";
export type TournamentStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "REGISTRATIONS_CLOSED"
  | "CANCELLED"
  | "FINISHED";

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  location: string;
  status: TournamentStatus;
  category?: string;
  format?: TournamentFormat;
  entryFee?: string;
  maxSlots?: number;
  registrationDeadline?: string;
}

export interface TournamentDetailCategory {
  id: string;
  name: string;
  format: TournamentFormat;
  entryFee: string;
  maxSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  registrationDeadline: string;
  status: TournamentStatus;
  registrants?: CategoryDetailRegistrant[];
  winnerName?: string | null;
  matches?: Match[];
  bracketStyle?: string;
  teams?: any[];
  registrations?: any[];
}

export interface Match {
  id: string;
  categoryId: string;
  round: number;
  position: number;
  bracketType: string;
  label?: string;
  competitorAId: string | null;
  competitorAName: string | null;
  competitorBId: string | null;
  competitorBName: string | null;
  winnerId: string | null;
  score: string | null;
}

export interface CategoryDetailRegistrant {
  kind: "registration" | "team";
  id: string;
  name?: string;
  ownerName?: string;
  partnerName?: string;
  status: RegistrationStatus | TeamRegistrationStatus;
}

export interface TournamentDetail extends Omit<
  Tournament,
  "category" | "format" | "entryFee" | "maxSlots" | "registrationDeadline"
> {
  categories: TournamentDetailCategory[];
}

export interface TournamentFormInput {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  status?: TournamentStatus;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface PendingConfirmationEntry {
  kind: "registration" | "team";
  id: string;
  tournamentName: string;
  playerName: string;
  amountDue: string;
  createdAt: string;
}

export interface DashboardSummary {
  activeTournaments: number;
  confirmedEntriesCount: number;
  confirmedRevenue: string;
  pendingRevenue: number;
  pendingConfirmations: PendingConfirmationEntry[];
  bracketCandidates: BracketCandidate[];
}

export interface BracketCandidate {
  id: string;
  tournamentName: string;
  tournamentDate: string;
  categoryName: string;
  format: TournamentFormat;
  status: TournamentStatus;
  confirmedEntriesCount: number;
  isReady: boolean;
}

export interface GeneratedBracketParticipant {
  id: string;
  name: string;
  registeredAt: string;
}

export interface GeneratedBracketMatch {
  position: number;
  competitorA: GeneratedBracketParticipant;
  competitorB: GeneratedBracketParticipant | null;
}

export interface GeneratedBracket {
  categoryId: string;
  categoryName: string;
  tournamentName: string;
  format: TournamentFormat;
  participantCount: number;
  matches: GeneratedBracketMatch[];
  byes: GeneratedBracketParticipant[];
}

export interface Registration {
  id: string;
  userId: string;
  status: RegistrationStatus;
  amountDue: string;
  reservedUntil: string | null;
  category?: {
    id: string;
    name: string;
    format: TournamentFormat;
    tournament: {
      id: string;
      name: string;
      eventDate: string;
    };
  };
}

export interface Team {
  id: string;
  ownerUserId: string;
  partnerName: string;
  status: TeamRegistrationStatus;
  amountDue: string;
  reservedUntil: string | null;
  category?: {
    id: string;
    name: string;
    format: TournamentFormat;
    tournament: {
      id: string;
      name: string;
      eventDate: string;
    };
  };
}

// Standard error shape returned by the backend (see errorHandler.ts)
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
