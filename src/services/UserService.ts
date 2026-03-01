import { supabase } from '../lib/supabase';
import type { ProfileData } from '../types/profile';

export interface Notification {
    id: string;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    type?: string;
}

export interface Transaction {
    id: string;
    from_user: string;
    to_user: string;
    amount: number;
    description: string;
    created_at: string;
    type: string;
}

export const UserService = {
    /**
     * Fetch the user profile by user ID.
     */
    async getProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username, full_name, avatar_url, role, interests, bio, phone, city, country, neighborhood, website, email')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { profile: data as ProfileData, error: null };
        } catch (error) {
            console.error('UserService.getProfile error:', error);
            return { profile: null, error };
        }
    },

    /**
     * Fetch user wallet data (Frikicoins balance and deposit QR code).
     */
    async getWallet(userId: string) {
        try {
            const { data, error } = await supabase
                .from('wallets')
                .select('id, deposit_qr, balance')
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return {
                wallet: {
                    id: data.id as string,
                    balance: Number(data.balance) || 0,
                    deposit_qr: data.deposit_qr as string,
                },
                error: null
            };
        } catch (error) {
            console.error('UserService.getWallet error:', error);
            return { wallet: null, error };
        }
    },

    /**
     * Update user profile information.
     */
    async updateProfile(userId: string, updates: Partial<ProfileData>) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;
            return { profile: data as ProfileData, error: null };
        } catch (error) {
            console.error('UserService.updateProfile error:', error);
            return { profile: null, error };
        }
    },

    /**
     * Fetch user notifications.
     */
    async getNotifications(userId: string) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { notifications: data as Notification[], error: null };
        } catch (error) {
            console.error('UserService.getNotifications error:', error);
            return { notifications: [], error };
        }
    },

    /**
     * Fetch user transaction history.
     */
    async getTransactions(userId: string) {
        try {
            const { data, error } = await supabase
                .from('wallet_transactions')
                .select('*')
                .or(`from_user.eq.${userId},to_user.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { transactions: data as Transaction[], error: null };
        } catch (error) {
            console.error('UserService.getTransactions error:', error);
            return { transactions: [], error };
        }
    }
};
