import { supabase } from '../lib/supabase';

export interface BugReport {
    id: string;
    user_id: string;
    title?: string;
    description: string;
    platform?: 'web' | 'mobile_android' | 'mobile_ios';
    attachment_url?: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    severity: 'low' | 'normal' | 'high' | 'critical';
    is_archived?: boolean;
    created_at: string;
    updated_at?: string;
    profiles?: {
        username: string;
    };
}

export interface ReportMessage {
    id: string;
    report_id: string;
    sender_id: string;
    message: string;
    attachment_url?: string | null;
    created_at: string;
    sender?: { username: string; avatar_url?: string | null };
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
                .select('id, user_id, title, description, status, severity, platform, attachment_url, is_archived, created_at, profiles(username)')
                .order('created_at', { ascending: false });

            if (error) {
                // Fallback: fetch without the profiles join
                const { data: plain, error: plainError } = await supabase
                    .from(TABLE)
                    .select('id, user_id, title, description, status, severity, platform, attachment_url, is_archived, created_at')
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
    },

    /**
     * Fetch all messages for a ticket thread
     */
    async getMessages(reportId: string) {
        try {
            const { data, error } = await supabase
                .from('web_bug_report_messages')
                .select(`
                    id, report_id, sender_id, message, attachment_url, created_at,
                    sender:profiles!sender_id(username, avatar_url)
                `)
                .eq('report_id', reportId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            const formatted = (data as any[] || []).map(m => ({
                ...m,
                sender: Array.isArray(m.sender) ? m.sender[0] : m.sender
            }));
            return { data: formatted as ReportMessage[], error: null };
        } catch (err: any) {
            console.error('Error fetching ticket messages:', err);
            return { data: [], error: err };
        }
    },

    /**
     * Send message in a ticket thread
     */
    async sendMessage(reportId: string, message: string, attachmentUrl?: string | null) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const { data, error } = await supabase
                .from('web_bug_report_messages')
                .insert({
                    report_id: reportId,
                    sender_id: user.id,
                    message: message.trim(),
                    attachment_url: attachmentUrl || null
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (err: any) {
            console.error('Error sending ticket message:', err);
            return { data: null, error: err };
        }
    },

    /**
     * Archive or unarchive a report
     */
    async toggleArchive(reportId: string, isArchived: boolean) {
        return this.updateReport(reportId, { is_archived: isArchived });
    }
};
