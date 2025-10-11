/**
 * Fast Track Leaderboard Types
 * TypeScript interfaces and types for the Fast Track leaderboard system
 */

/**
 * Client status types for tracking progress and state
 */
export type ClientStatus = 
  | 'ON_TIME'           // Client is on track with their sprint
  | 'DELAYED'           // Client is behind on their current sprint
  | 'GRADUATED'         // Client has completed the program
  | 'PROGRESS_MEETING'  // Client is in a progress meeting
  | 'STARTING_SOON';    // Client is about to start the program

/**
 * Sprint interface representing a single sprint in the program
 */
export interface Sprint {
  /** Sprint number (1-30) */
  number: number;
  /** Sprint name/description */
  name: string;
  /** Sprint deadline date */
  deadline: string;
  /** Whether the sprint has been submitted */
  submitted: boolean;
  /** Date when the sprint was submitted (if submitted) */
  submittedDate?: string;
  /** Quality score for the sprint (0-100) */
  qualityScore?: number;
  /** Whether the sprint was submitted on time */
  onTime: boolean;
}

/**
 * Client interface representing a Fast Track program participant
 */
export interface Client {
  /** Unique client identifier */
  id: string;
  /** Client's full name */
  name: string;
  /** Access code for client login */
  accessCode: string;
  /** Current week number in the program (1-30) */
  weekNumber: number;
  /** On-time delivery statistics (completed/total) */
  onTimeDelivery: {
    completed: number;
    total: number;
  };
  /** Array of quality scores for completed sprints */
  qualityScores: number[];
  /** Current client status */
  status: ClientStatus;
  /** Current sprint information */
  currentSprint: {
    number: number;
    name: string;
  };
  /** Current sprint deadline */
  sprintDeadline: string;
  /** Next sprint information */
  nextSprint: {
    number: number;
    name: string;
  };
  /** Next sprint release date */
  nextSprintRelease: string;
  /** Program start date */
  startDate: string;
  /** Graduation date (if graduated) */
  graduationDate?: string;
  /** Number of days in delay (if delayed) */
  daysInDelay?: number;
  /** Program champion name */
  programChampion: string;
  /** Current guru/mentor name */
  currentGuru: string;
  /** Array of completed sprint numbers */
  completedSprints: number[];
  /** Array of all sprints for this client */
  sprints: Sprint[];
  /** Current rank in leaderboard */
  rank: number;
  /** Total number of clients in the program */
  totalClients: number;
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** Associated associate ID */
  associateId: string;
  /** Previous rank in leaderboard */
  previousRank?: number;
}

/**
 * Associate interface representing a Fast Track program associate/mentor
 */
export interface Associate {
  /** Unique associate identifier */
  id: string;
  /** Associate's full name */
  name: string;
  /** Access code for associate login */
  accessCode: string;
  /** Array of client IDs assigned to this associate */
  clients: string[];
}
