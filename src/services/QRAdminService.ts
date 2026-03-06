import { supabase } from '../lib/supabase';

export interface EventCode {
    id: string;
    code: string;
    points: number;
    max_uses: number | null;
    current_uses: number;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

export interface QRAssignment {
    id: string;
    user_id: string;
    event_code_id: string;
    expires_at: string | null;
    created_at: string;
    is_active: boolean;
    event_codes?: EventCode;
    profiles?: { username: string; full_name: string };
}

export const QRAdminService = {
    async getEventCodes(): Promise<EventCode[]> {
        const { data, error } = await supabase
            .from('event_codes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching event codes:', error);
            return [];
        }
        return data || [];
    },

    async createOrUpdateCode(codeData: Partial<EventCode>): Promise<{ error?: any }> {
        try {
            if (codeData.id) {
                const { error } = await supabase.rpc('update_event_code', {
                    p_id: codeData.id,
                    p_code: codeData.code,
                    p_points: codeData.points,
                    p_max_uses: codeData.max_uses,
                    p_expires_at: codeData.expires_at
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.from('event_codes').insert({
                    code: codeData.code,
                    points: codeData.points,
                    max_uses: codeData.max_uses,
                    expires_at: codeData.expires_at,
                    is_active: true
                });
                if (error) throw error;
            }
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async toggleCodeStatus(id: string, currentStatus: boolean): Promise<{ error?: any }> {
        try {
            const { error } = await supabase
                .from('event_codes')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async deleteCode(id: string): Promise<{ error?: any }> {
        try {
            const { error } = await supabase.from('event_codes').delete().eq('id', id);
            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async getAssignments(): Promise<QRAssignment[]> {
        const { data, error } = await supabase
            .from('qr_assignments')
            .select(`
                *,
                event_codes (*),
                profiles:user_id (username, full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching assignments:', error);
            return [];
        }
        return data || [];
    },

    async searchWorkers(query: string) {
        if (query.length < 2) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, email, role, avatar_url')
            .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
            .in('role', ['worker', 'tecnico', 'admin'])
            .limit(10);

        if (error) {
            console.error('Error searching workers:', error);
            return [];
        }
        return data || [];
    },

    async createAssignment(workerId: string, eventCodeId: string, expiresAt: string | null): Promise<{ error?: any }> {
        try {
            const { error } = await supabase
                .from('qr_assignments')
                .insert({
                    user_id: workerId,
                    event_code_id: eventCodeId,
                    expires_at: expiresAt
                });

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async deactivateAssignment(id: string): Promise<{ error?: any }> {
        try {
            const { error } = await supabase
                .from('qr_assignments')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async getRedemptions(eventId: string) {
        try {
            const { data, error } = await supabase.rpc('get_event_redemptions', {
                p_event_id: eventId,
                p_limit: 100
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: [], error };
        }
    }
};
