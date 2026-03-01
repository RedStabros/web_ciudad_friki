import { useState, useEffect, useCallback, useRef } from 'react';
import { UserService } from '../services/UserService';
import type { ProfileData, WalletData } from '../types/profile';

/**
 * Custom hook to fetch user profile and wallet data with optimization to prevent redundant calls.
 */
export function useProfile(userId: string | undefined | null) {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Use a ref to track the last fetched userId to avoid redundant calls in StrictMode or re-renders
    const lastFetchedId = useRef<string | null>(null);

    const refetch = useCallback(async (force = false) => {
        if (!userId) return;

        // Skip if we already fetched this ID and it's not a forced refresh
        if (!force && lastFetchedId.current === userId && profile) return;

        setIsLoading(true);
        try {
            const [profileRes, walletRes] = await Promise.all([
                UserService.getProfile(userId),
                UserService.getWallet(userId)
            ]);

            if (profileRes.error) throw profileRes.error;
            if (walletRes.error) throw walletRes.error;

            setProfile(profileRes.profile);
            setWallet(walletRes.wallet);
            lastFetchedId.current = userId;
        } catch (err: any) {
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, [userId, profile]);

    useEffect(() => {
        if (userId) {
            // Only fetch if it's a different user or we haven't fetched yet
            if (lastFetchedId.current !== userId) {
                refetch();
            }
        } else {
            setProfile(null);
            setWallet(null);
            setIsLoading(false);
            lastFetchedId.current = null;
        }
    }, [userId, refetch]);

    return { profile, wallet, isLoading, error, refetch: () => refetch(true) };
}
