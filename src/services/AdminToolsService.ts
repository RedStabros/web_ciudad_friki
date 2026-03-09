import { supabase } from '../lib/supabase';

export interface AdminStats {
    total_accounts: number;
    circulation_supply: number;
    admin_supply: number;
    active_surveys: number;
    draft_surveys: number;
    paused_surveys: number;
    past_surveys: number;
    transactions_total: number;
    transactions_last_month: number;
    top_users: { username: string; balance: number; email?: string; avatar_url?: string }[];
}

export const AdminToolsService = {
    async getAdminStats(): Promise<{ data: AdminStats | null; error: any }> {
        try {
            const { data, error } = await supabase.rpc('get_admin_stats').single();
            if (error) throw error;

            if (data && data.top_users && data.top_users.length > 0) {
                const usernames = data.top_users.map((u: any) => u.username);
                const { data: profiles } = await supabase.from('profiles').select('username, email, avatar_url').in('username', usernames);
                if (profiles) {
                    data.top_users = data.top_users.map((u: any) => {
                        const profile = profiles.find((p: any) => p.username === u.username);
                        return {
                            ...u,
                            email: profile?.email || 'Email oculto',
                            avatar_url: profile?.avatar_url || null
                        };
                    });
                }
            }

            return { data: data as AdminStats, error: null };
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            return { data: null, error };
        }
    },

    async getOnlineUsers(): Promise<number> {
        return 0;
    }
};
