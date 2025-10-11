/**
 * Fast Track Leaderboard Calculation Utilities
 * Helper functions for calculating metrics and determining client status
 */

import { ClientStatus } from '@/types';

/**
 * Calculate the percentage of on-time deliveries
 * @param completed - Number of completed on-time deliveries
 * @param total - Total number of deliveries
 * @returns Percentage as a number (0-100)
 */
export function calculateOnTimePercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Calculate the average quality score from an array of scores
 * @param scores - Array of quality scores (0-100)
 * @returns Average quality score as a number (0-100)
 */
export function calculateQualityAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

/**
 * Calculate days ahead or behind schedule
 * @param deadline - Sprint deadline date (ISO string)
 * @param submittedDate - Date when sprint was submitted (ISO string, optional)
 * @returns Positive number for days ahead, negative for days behind, 0 for on time
 */
export function calculateDaysAheadBehind(deadline: string, submittedDate?: string): number {
  const deadlineDate = new Date(deadline);
  const currentDate = submittedDate ? new Date(submittedDate) : new Date();
  
  const timeDiff = deadlineDate.getTime() - currentDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff;
}

/**
 * Get the appropriate color for a client status
 * @param status - Client status
 * @returns Color name for styling
 */
export function getStatusColor(status: ClientStatus): 'green' | 'red' | 'gray' {
  switch (status) {
    case 'ON_TIME':
    case 'GRADUATED':
      return 'green';
    case 'DELAYED':
      return 'red';
    case 'PROGRESS_MEETING':
    case 'STARTING_SOON':
    default:
      return 'gray';
  }
}

/**
 * Determine the current status of a client based on their progress
 * @param completedSprints - Array of completed sprint numbers
 * @param currentDeadline - Current sprint deadline (ISO string)
 * @param isPaused - Whether the client's program is paused
 * @returns Client status
 */
export function determineClientStatus(
  completedSprints: number[],
  currentDeadline: string,
  isPaused: boolean = false
): ClientStatus {
  // If program is paused, client is in progress meeting
  if (isPaused) {
    return 'PROGRESS_MEETING';
  }
  
  // If no sprints completed yet, client is starting soon
  if (completedSprints.length === 0) {
    return 'STARTING_SOON';
  }
  
  // Check if current sprint is overdue
  const daysDiff = calculateDaysAheadBehind(currentDeadline);
  
  // If deadline has passed and no submission, client is delayed
  if (daysDiff < 0) {
    return 'DELAYED';
  }
  
  // If on time or ahead of schedule
  return 'ON_TIME';
}

/**
 * Calculate client's overall performance score
 * Combines on-time delivery percentage and quality average
 * @param onTimePercentage - Percentage of on-time deliveries (0-100)
 * @param qualityAverage - Average quality score (0-100)
 * @returns Overall performance score (0-100)
 */
export function calculateOverallScore(onTimePercentage: number, qualityAverage: number): number {
  // Weight: 60% on-time delivery, 40% quality
  const weightedScore = (onTimePercentage * 0.6) + (qualityAverage * 0.4);
  return Math.round(weightedScore);
}

/**
 * Format a number as a percentage with proper rounding
 * @param value - Number to format (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format a date for display in the leaderboard
 * @param dateString - ISO date string
 * @returns Formatted date string (MMM DD, YYYY)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Calculate the rank change indicator
 * @param currentRank - Current rank
 * @param previousRank - Previous rank (optional)
 * @returns Rank change indicator: 'up', 'down', 'same', or 'new'
 */
export function getRankChange(currentRank: number, previousRank?: number): 'up' | 'down' | 'same' | 'new' {
  if (!previousRank) return 'new';
  if (currentRank < previousRank) return 'up';
  if (currentRank > previousRank) return 'down';
  return 'same';
}
