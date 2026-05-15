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

            // Define a type for the RPC response to avoid 'as any'
            interface RPCAdminStats extends Omit<AdminStats, 'top_users'> {
                top_users: { username: string; balance: number }[];
            }

            const statsData = data as RPCAdminStats;

            if (statsData && statsData.top_users && statsData.top_users.length > 0) {
                const usernames = statsData.top_users.map(u => u.username);
                const { data: profiles } = await supabase.from('profiles').select('username, email, avatar_url').in('username', usernames);
                
                if (profiles) {
                    statsData.top_users = statsData.top_users.map(u => {
                        const profile = profiles.find(p => p.username === u.username);
                        return {
                            ...u,
                            email: profile?.email || 'Email oculto',
                            avatar_url: profile?.avatar_url || undefined
                        };
                    });
                }
            }

            return { data: statsData as AdminStats, error: null };
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            return { data: null, error };
        }
    },

    async getOnlineUsers(): Promise<number> {
        return 0;
    }
};
