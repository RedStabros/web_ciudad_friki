import { supabase } from '../lib/supabase';

export interface PendingReviewItem {
    id: string;
    type: 'thread' | 'reply';
    content: string;
    title?: string;
    report_count: number;
    downvotes: number;
    created_at: string;
    admin_reviewed?: boolean;
    author_id?: string;
    profiles?: { username: string };
}

export interface ReportReason {
    user_id: string;
    reason: string;
    created_at: string;
    profiles?: { username: string; avatar_url: string | null };
}

export interface UserInteractionLog {
    id: string;
    target_id: string;
    target_type: 'thread' | 'reply';
    interaction_type: string;
    report_reason?: string;
    created_at: string;
    target_content?: string;
}

export interface BanData {
    is_shadow_banned: boolean;
    ban_until?: string | null; // ISO Date or null for permanent
    ban_reason?: string;
}

export interface ModerationLog {
    id: string;
    admin_id: string;
    target_user_id: string;
    action_type: 'BAN' | 'UNBAN' | 'APPROVE_POST' | 'HIDE_POST' | 'SHADOW_BAN';
    target_id?: string;
    target_type?: 'thread' | 'reply';
    reason?: string;
    created_at: string;
    admin_profile?: { username: string };
    target_profile?: { username: string };
}

export const TavernAdminService = {
    async getGlobalSetting(key: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('global_settings')
            .select('*')
            .eq('key', key)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data?.value ?? true;
    },

    async toggleGlobalSetting(key: string, enabled: boolean): Promise<{ error?: any }> {
        try {
            const { error } = await supabase
                .from('global_settings')
                .upsert({ key, value: enabled });
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async getPendingReviews(): Promise<PendingReviewItem[]> {
        try {
            const [threadsRes, repliesRes] = await Promise.all([
                supabase
                    .from('tavern_threads')
                    .select('*, profiles:author_id(username)')
                    .eq('is_hidden', true)
                    .eq('admin_reviewed', false)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('tavern_replies')
                    .select('*, profiles:author_id(username)')
                    .eq('is_hidden', true)
                    .eq('admin_reviewed', false)
                    .order('created_at', { ascending: false })
            ]);

            if (threadsRes.error) throw threadsRes.error;
            if (repliesRes.error) throw repliesRes.error;

            const items: PendingReviewItem[] = [
                ...(threadsRes.data?.map((t: any) => ({ ...t, type: 'thread' as const, report_count: t.reports_count, downvotes: t.dislikes_count })) || []),
                ...(repliesRes.data?.map((r: any) => ({ ...r, type: 'reply' as const, report_count: r.reports_count, downvotes: r.dislikes_count })) || [])
            ];

            return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error('Error fetching pending reviews:', error);
            return [];
        }
    },

    async processReview(id: string, type: 'thread' | 'reply', approve: boolean): Promise<{ error?: any }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const table = type === 'thread' ? 'tavern_threads' : 'tavern_replies';
            
            // First fetch the author to log it
            const { data: item } = await supabase.from(table).select('author_id').eq('id', id).single();

            const { error } = await supabase
                .from(table)
                .update({
                    is_hidden: !approve,
                    admin_reviewed: true
                })
                .eq('id', id);

            if (error) throw error;

            if (user) {
                await this.logModerationAction({
                    admin_id: user.id,
                    target_user_id: item?.author_id,
                    action_type: approve ? 'APPROVE_POST' : 'HIDE_POST',
                    target_id: id,
                    target_type: type,
                    reason: approve ? 'Aprobado tras revisión' : 'Mantenido oculto tras revisión'
                });
            }

            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async getReportReasons(targetId: string, targetType: 'thread' | 'reply'): Promise<ReportReason[]> {
        try {
            const { data, error } = await supabase
                .from('tavern_interactions')
                .select('user_id, report_reason, created_at, profiles:user_id(username)')
                .eq('target_id', targetId)
                .eq('target_type', targetType)
                .eq('interaction_type', 'report')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((r: any) => ({
                user_id: r.user_id,
                reason: r.report_reason || 'Sin motivo especificado',
                created_at: r.created_at,
                profiles: r.profiles
            }));
        } catch (error) {
            console.error('Error fetching report reasons:', error);
            return [];
        }
    },

    async banUser(userId: string, banData: BanData): Promise<{ error?: any }> {
        try {
            const { data: { user: adminUser } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_banned: !banData.is_shadow_banned,
                    is_shadow_banned: banData.is_shadow_banned,
                    ban_until: banData.ban_until,
                    ban_reason: banData.ban_reason
                })
                .eq('id', userId);

            if (error) throw error;

            if (adminUser) {
                await this.logModerationAction({
                    admin_id: adminUser.id,
                    target_user_id: userId,
                    action_type: banData.is_shadow_banned ? 'SHADOW_BAN' : 'BAN',
                    reason: banData.ban_reason
                });
            }

            return { error: null };
        } catch (error) {
            console.error('Error banning user:', error);
            return { error };
        }
    },

    async unbanUser(userId: string): Promise<{ error?: any }> {
        try {
            const { data: { user: adminUser } } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_banned: false,
                    is_shadow_banned: false,
                    ban_until: null,
                    ban_reason: null
                })
                .eq('id', userId);

            if (error) throw error;

            if (adminUser) {
                await this.logModerationAction({
                    admin_id: adminUser.id,
                    target_user_id: userId,
                    action_type: 'UNBAN',
                    reason: 'Sanción retirada por administrador'
                });
            }

            return { error: null };
        } catch (error) {
            console.error('Error unbanning user:', error);
            return { error };
        }
    },

    async searchUsers(query: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, email, avatar_url, role, is_banned, is_shadow_banned, ban_until, ban_reason')
                .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
                .limit(20);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    },

    /**
     * Get all interactions (mainly reports) done by a user
     */
    async getUserInteractionHistory(userId: string): Promise<UserInteractionLog[]> {
        try {
            const { data, error } = await supabase
                .from('tavern_interactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Optional: fetch target content to display what was reported
            return data || [];
        } catch (error) {
            console.error('Error fetching user interaction history:', error);
            return [];
        }
    },

    /**
     * Get threads/replies from a user that have been reported or hidden
     */
    async getUserViolationHistory(userId: string): Promise<PendingReviewItem[]> {
        try {
            const [threads, replies] = await Promise.all([
                supabase.from('tavern_threads').select('*').eq('author_id', userId).gt('reports_count', 0),
                supabase.from('tavern_replies').select('*').eq('author_id', userId).gt('reports_count', 0),
            ]);

            const history: PendingReviewItem[] = [
                ...(threads.data || []).map(t => ({ ...t, type: 'thread' as const, report_count: t.reports_count, downvotes: t.dislikes_count })),
                ...(replies.data || []).map(r => ({ ...r, type: 'reply' as const, report_count: r.reports_count, downvotes: r.dislikes_count }))
            ];

            return history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error('Error fetching user violation history:', error);
            return [];
        }
    },

    /**
     * Internal helper to log admin actions
     */
    async logModerationAction(payload: Partial<ModerationLog>): Promise<void> {
        try {
            await supabase.from('moderation_logs').insert([payload]);
        } catch (error) {
            console.error('Error logging moderation action:', error);
        }
    },

    /**
     * Get recent moderation logs
     */
    async getModerationLogs(limit: number = 50): Promise<ModerationLog[]> {
        try {
            const { data, error } = await supabase
                .from('moderation_logs')
                .select(`
                    *,
                    admin_profile:admin_id(username),
                    target_profile:target_user_id(username)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching moderation logs:', error);
            return [];
        }
    }
};
