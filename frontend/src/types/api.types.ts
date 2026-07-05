export type UserRole = "ADMIN" | "PLAYER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type TournamentFormat = "INDIVIDUAL" | "DUO_FIXED" | "DUO_RANDOM";
export type TournamentStatus = "DRAFT" | "PUBLISHED" | "REGISTRATIONS_CLOSED" | "CANCELLED" | "FINISHED";

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  location: string;
  category: string;
  format: TournamentFormat;
  entryFee: string;
  maxSlots: number;
  registrationDeadline: string;
  status: TournamentStatus;
}

export interface TournamentDetail extends Tournament {
  occupiedSlots: number;
  availableSlots: number;
  registrants: Array<{ name?: string; ownerName?: string; partnerName?: string; status: string }>;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

// Standard error shape returned by the backend (see errorHandler.ts)
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
