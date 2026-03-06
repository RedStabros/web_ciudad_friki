import { supabase } from '../lib/supabase';

export interface PendingReviewItem {
    id: string;
    type: 'thread' | 'reply';
    content: string;
    title?: string;
    report_count: number;
    downvotes: number;
    created_at: string;
    profiles?: { username: string };
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
                ...(threadsRes.data?.map((t: any) => ({ ...t, type: 'thread' as const })) || []),
                ...(repliesRes.data?.map((r: any) => ({ ...r, type: 'reply' as const })) || [])
            ];

            return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error('Error fetching pending reviews:', error);
            return [];
        }
    },

    async processReview(id: string, type: 'thread' | 'reply', approve: boolean): Promise<{ error?: any }> {
        try {
            const table = type === 'thread' ? 'tavern_threads' : 'tavern_replies';
            // Approve = False Hidden (Restaurar) / Reject = True Hidden (Mantener oculto + reviewed)
            const { error } = await supabase
                .from(table)
                .update({
                    is_hidden: !approve,
                    admin_reviewed: true
                })
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    }
};
