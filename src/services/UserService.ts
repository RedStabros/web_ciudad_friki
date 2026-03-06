import { supabase } from '../lib/supabase';
import type { ProfileData, NotificationPreferences } from '../types/profile';

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
                .select('username, full_name, avatar_url, role, interests, bio, phone, city, country, neighborhood, website, email, notification_preferences(*)')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data.notification_preferences && Array.isArray(data.notification_preferences)) {
                data.notification_preferences = data.notification_preferences[0];
            }

            return { profile: data as unknown as ProfileData, error: null };
        } catch (error) {
            console.error('UserService.getProfile error:', error);
            return { profile: null, error };
        }
    },

    /**
     * Update user notification preferences
     */
    async updateNotificationPreferences(userId: string, prefs: Partial<NotificationPreferences>) {
        try {
            const { error } = await supabase
                .from('notification_preferences')
                .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('UserService.updateNotificationPreferences error:', error);
            return { error };
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
     * Mark a single notification as read
     */
    async markNotificationRead(notificationId: string) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            console.error('UserService.markNotificationRead error:', error);
            return { success: false, error };
        }
    },

    /**
     * Mark all notifications as read for a user
     */
    async markAllNotificationsRead(userId: string) {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return { success: true, error: null };
        } catch (error) {
            console.error('UserService.markAllNotificationsRead error:', error);
            return { success: false, error };
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
    },

    /**
     * Redeem an assignment code (ASSIGN:)
     */
    async redeemAssignment(assignmentId: string, userId: string): Promise<{ success: boolean; amount?: number; message?: string; error: any }> {
        try {
            const { data, error } = await supabase.rpc('redeem_assignment', {
                p_assignment_id: assignmentId,
                p_user_id: userId
            });
            if (error) throw error;
            return { ...data, error: null };
        } catch (error: any) {
            console.error('Redeem Assignment error:', error);
            return { success: false, error: error.message || error };
        }
    },

    /**
     * Redeem an event code (EVENT:)
     */
    async redeemEventCode(code: string, userId: string): Promise<{ success: boolean; amount?: number; message?: string; error: any }> {
        try {
            const { data, error } = await supabase.rpc('redeem_event_code', {
                p_code: code,
                p_user_id: userId
            });
            if (error) throw error;
            return { ...data, error: null };
        } catch (error: any) {
            console.error('Redeem Event Code error:', error);
            return { success: false, error: error.message || error };
        }
    },

    /**
     * Transfer Frikicoins to another user via QR code (FRIKI:)
     */
    async transferFrikicoins(senderId: string, recipientQr: string, amount: number): Promise<{ success: boolean; message?: string; error: any }> {
        try {
            const { data, error } = await supabase.rpc('transfer_frikicoins', {
                p_sender_id: senderId,
                p_recipient_qr: recipientQr,
                p_amount: amount
            });
            if (error) throw error;
            return { ...data, error: null };
        } catch (error: any) {
            console.error('Transfer error:', error);
            return { success: false, error: error.message || error };
        }
    }
};
