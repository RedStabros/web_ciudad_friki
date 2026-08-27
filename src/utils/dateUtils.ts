/**
 * Utility functions for handling dates safely across timezones.
 * Solves the issue where UTC conversions (like .toISOString()) shift dates
 * backwards by one day in regions like LATAM (GMT-5).
 */

/**
 * Returns today's date in YYYY-MM-DD format based on the user's LOCAL timezone.
 */
export const getLocalTodayString = (): string => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offsetMs);
    return localDate.toISOString().split('T')[0];
};

/**
 * Returns yesterday's date in YYYY-MM-DD format based on the user's LOCAL timezone.
 */
export const getLocalYesterdayString = (): string => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const offsetMs = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offsetMs);
    return localDate.toISOString().split('T')[0];
};

/**
 * Converts a database date string (which might contain time or T/Z) 
 * into a safe YYYY-MM-DD local format for comparison.
 */
export const extractDateString = (dbDateStr: string | null | undefined): string | null => {
    if (!dbDateStr) return null;
    // Handle formats like "2026-10-30T00:00:00Z" or "2026-10-30 00:00:00"
    return dbDateStr.split('T')[0].split(' ')[0];
};

/**
 * Determines if an event has already started.
 */
export const hasEventStarted = (startDateStr: string | null | undefined): boolean => {
    if (!startDateStr) return false;
    const now = new Date();
    const startDate = new Date(startDateStr);
    return now >= startDate;
};

/**
 * Determines if an event has completely finished.
 * An event is finished if its end_date (or start date if no end_date) 
 * at 23:59:59 has already passed in local time.
 */
export const isEventFinished = (dateStr: string | null | undefined, endDateStr?: string | null): boolean => {
    const targetDateStr = extractDateString(endDateStr) || extractDateString(dateStr);
    if (!targetDateStr) return true; // Safety fallback

    const todayStr = getLocalTodayString();
    
    // If target date is before today, it's finished.
    // E.g., target = '2026-10-25', today = '2026-10-26' -> '2026-10-25' < '2026-10-26' (True)
    return targetDateStr < todayStr;
};
