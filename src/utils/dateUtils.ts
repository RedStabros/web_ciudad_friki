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

/**
 * Calculates the exact number of effective active days for an event based on its recurrence type and days.
 */
export const calculateEffectiveEventDays = (
    startDateStr?: string | null,
    endDateStr?: string | null,
    recurrenceType?: string | null,
    recurrenceDays?: number[] | null
): number => {
    if (!startDateStr) return 1;

    const startOnly = extractDateString(startDateStr);
    const endOnly = extractDateString(endDateStr);

    if (!endOnly || startOnly === endOnly) {
        return 1;
    }

    const start = new Date(startOnly + 'T00:00:00');
    const end = new Date(endOnly + 'T00:00:00');

    if (end < start) {
        return 1;
    }

    let effectiveDays = 0;
    const current = new Date(start);

    while (current <= end) {
        let include = false;

        if (recurrenceType === 'weekly' && Array.isArray(recurrenceDays) && recurrenceDays.length > 0) {
            if (recurrenceDays.includes(current.getDay())) {
                include = true;
            }
        } else if (recurrenceType === 'biweekly') {
            const diffDays = Math.round((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays % 14 === 0) {
                include = true;
            }
        } else if (recurrenceType === 'monthly') {
            if (current.getDate() === start.getDate()) {
                include = true;
            }
        } else {
            // 'daily' or default
            include = true;
        }

        if (include) {
            effectiveDays++;
        }

        current.setDate(current.getDate() + 1);
    }

    return Math.max(effectiveDays, 1);
};

export const formatEventRecurrenceInfo = (
    recurrenceType?: string | null,
    recurrenceDays?: number[] | null,
    language: string = 'es'
): { typeLabel: string; daysLabel: string; summary: string } | null => {
    if (!recurrenceType) return null;
    const isEn = language.startsWith('en');

    const dayNamesEs: { [key: number]: string } = {
        0: 'Domingos', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábados'
    };
    const dayNamesEn: { [key: number]: string } = {
        0: 'Sundays', 1: 'Mondays', 2: 'Tuesdays', 3: 'Wednesdays', 4: 'Thursdays', 5: 'Fridays', 6: 'Saturdays'
    };
    const dayMap = isEn ? dayNamesEn : dayNamesEs;

    switch (recurrenceType) {
        case 'weekly': {
            const typeLabel = isEn ? 'Weekly' : 'Semanal';
            if (Array.isArray(recurrenceDays) && recurrenceDays.length > 0) {
                const sorted = [...recurrenceDays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
                const names = sorted.map(d => dayMap[d] || '');
                const daysLabel = isEn ? `Every ${names.join(', ')}` : `Cada ${names.join(', ')}`;
                return { typeLabel, daysLabel, summary: `${typeLabel} (${daysLabel})` };
            }
            return { typeLabel, daysLabel: '', summary: typeLabel };
        }
        case 'biweekly': {
            const typeLabel = isEn ? 'Biweekly' : 'Quincenal';
            const daysLabel = isEn ? 'Every 14 days' : 'Cada 14 días';
            return { typeLabel, daysLabel, summary: `${typeLabel} (${daysLabel})` };
        }
        case 'monthly': {
            const typeLabel = isEn ? 'Monthly' : 'Mensual';
            const daysLabel = isEn ? 'One session per month' : 'Una sesión cada mes';
            return { typeLabel, daysLabel, summary: `${typeLabel} (${daysLabel})` };
        }
        case 'daily':
        default: {
            const typeLabel = isEn ? 'Daily' : 'Diario';
            const daysLabel = isEn ? 'All event days' : 'Todos los días del evento';
            return { typeLabel, daysLabel, summary: `${typeLabel} (${daysLabel})` };
        }
    }
};
