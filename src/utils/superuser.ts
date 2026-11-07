/**
 * Superuser / GM utilities for web
 *
 * The superuser ID is stored in VITE_SUPERUSER_ID (.env.local).
 * This account bypasses normal admin restrictions and has access
 * to owner-only features (e.g. toggling the Tavern, future GM tools).
 */

export const SUPERUSER_ID = import.meta.env.VITE_SUPERUSER_ID || '9c8297f2-fc66-43d2-aa73-5efd074474e8';

/**
 * Returns true if the given userId is the platform superuser/GM.
 * Use this to gate owner-only UI elements.
 */
export function isSuperuser(userId: string | undefined | null): boolean {
    if (!userId || !SUPERUSER_ID) return false;
    return userId === SUPERUSER_ID;
}
