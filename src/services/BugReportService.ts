import { supabase } from '../lib/supabase';

export interface BugReport {
    id: string;
    user_id: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    severity: 'low' | 'normal' | 'high' | 'critical';
    created_at: string;
    profiles?: {
        username: string;
    };
}

// Uses 'web_bug_reports' — a separate table from the mobile app's 'bug_reports'
const TABLE = 'web_bug_reports';

export const BugReportService = {
    /**
     * Submit a new bug report via RPC to bypass RLS constraints.
     * The server-side function uses SECURITY DEFINER so auth.uid() is always correct.
     */
    async reportBug(_userId: string, description: string) {
        try {
            const { data, error } = await supabase.rpc('submit_web_bug_report', {
                p_description: description,
            });

            if (error) throw error;
            return { data: data as string, error: null };
        } catch (error: any) {
            console.error('Error submitting bug report:', error);
            return { data: null, error };
        }
    },

    /**
     * Fetch all bug reports (Admin only).
     * Tries to join profiles for username; falls back to user_id only.
     */
    async getAllReports() {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select('id, user_id, description, status, severity, created_at, profiles(username)')
                .order('created_at', { ascending: false });

            if (error) {
                // Fallback: fetch without the profiles join
                const { data: plain, error: plainError } = await supabase
                    .from(TABLE)
                    .select('id, user_id, description, status, severity, created_at')
                    .order('created_at', { ascending: false });
                if (plainError) throw plainError;
                return { data: plain as unknown as BugReport[], error: null };
            }
            return { data: data as unknown as BugReport[], error: null };
        } catch (error: any) {
            console.error('Error fetching bug reports:', error);
            return { data: null, error };
        }
    },

    /**
     * Update bug report status or severity (Admin only)
     */
    async updateReport(id: string, updates: Partial<BugReport>) {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data: data as unknown as BugReport, error: null };
        } catch (error: any) {
            console.error('Error updating bug report:', error);
            return { data: null, error };
        }
    }
};
