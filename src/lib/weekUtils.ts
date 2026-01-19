/**
 * Centralized weekly reset utilities
 * 
 * All weekly features (Weekly Debrief, Weekly Boss Raid, Rival Leaderboard)
 * should use these utilities to ensure consistent reset schedules.
 * 
 * The week resets every Monday at 00:00 UTC, matching the database
 * boss rotation schedule defined in rotate_weekly_boss().
 */

import { startOfWeek, endOfWeek, format } from 'date-fns';

/**
 * Week configuration - single source of truth for weekly reset schedule
 * Monday = 1 (matches PostgreSQL date_trunc('week') behavior)
 */
export const WEEK_CONFIG = {
  /** Day the week starts on (0 = Sunday, 1 = Monday, etc.) */
  weekStartsOn: 1 as const,
  /** Human-readable description of when the week resets */
  resetDescription: 'Resets every Monday',
} as const;

/**
 * Get the start of the current week (Monday 00:00 local time)
 */
export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: WEEK_CONFIG.weekStartsOn });
}

/**
 * Get the end of the current week (Sunday 23:59:59 local time)
 */
export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: WEEK_CONFIG.weekStartsOn });
}

/**
 * Get formatted week range text (e.g., "Jan 13 - Jan 19")
 */
export function getWeekRangeText(date: Date = new Date()): string {
  const weekStart = getWeekStart(date);
  const weekEnd = getWeekEnd(date);
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
}

/**
 * Get week boundaries as ISO strings for database queries
 */
export function getWeekBoundaries(date: Date = new Date()): {
  weekStart: string;
  weekEnd: string;
  weekStartDate: Date;
  weekEndDate: Date;
} {
  const weekStartDate = getWeekStart(date);
  const weekEndDate = getWeekEnd(date);
  return {
    weekStart: weekStartDate.toISOString(),
    weekEnd: weekEndDate.toISOString(),
    weekStartDate,
    weekEndDate,
  };
}

/**
 * Get week start as YYYY-MM-DD for database date comparisons
 */
export function getWeekStartDateString(date: Date = new Date()): string {
  const weekStart = getWeekStart(date);
  return weekStart.toISOString().split('T')[0];
}
