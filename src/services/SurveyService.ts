import { supabase } from '../lib/supabase';

export interface SurveyOption {
    id: string;
    survey_id: string;
    text: string;
    votes_count: number;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    questions: any[];          // raw JSONB questions array from DB
    reward_amount: number;
    expire_date: string | null;
    already_completed: boolean; // mirrors mobile's field name
    user_voted?: boolean;       // alias kept for compat
    // Derived for the voting UI (built from questions)
    options: SurveyOption[];
}

export class SurveyService {
    /**
     * Fetch active surveys for the current user via RPC.
     * Mirrors mobile's: supabase.rpc('get_active_surveys', { p_user_id: userId })
     * The RPC returns: id, title, description, questions, reward_amount,
     * expire_date, already_completed (user_completed alias).
     */
    static async getSurveys(): Promise<{ surveys: Survey[]; error: any }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .rpc('get_active_surveys', { p_user_id: user?.id ?? null });

            if (error) throw error;

            // Map user_completed → already_completed (same as mobile) and build options
            const surveys: Survey[] = (data || []).map((s: any) => {
                const alreadyCompleted = s.user_completed || s.already_completed || false;

                // Build voting options from JSONB questions (same structure as mobile SurveyRenderer)
                let options: SurveyOption[] = [];
                if (s.questions && Array.isArray(s.questions)) {
                    const firstPollQ = s.questions.find((q: any) => q.type === 'multiple_choice' || (q.options && Array.isArray(q.options)));
                    if (firstPollQ?.options) {
                        options = firstPollQ.options.map((opt: string, idx: number) => ({
                            id: `${s.id}_q0_${idx}`,
                            survey_id: s.id,
                            text: opt,
                            votes_count: firstPollQ.vote_counts?.[idx] ?? 0,
                        }));
                    }
                }

                return {
                    id: s.id,
                    title: s.title,
                    description: s.description || '',
                    questions: s.questions || [],
                    reward_amount: s.reward_amount || 0,
                    expire_date: s.expire_date || null,
                    already_completed: alreadyCompleted,
                    user_voted: alreadyCompleted,
                    options,
                } as Survey;
            });

            return { surveys, error: null };
        } catch (error) {
            console.error('Error fetching surveys:', error);
            return { surveys: [], error };
        }
    }

    /**
     * Submit survey answers.
     * Mirrors mobile's SurveyModal.handleSubmit():
     *   insert into 'survey_responses' { survey_id, user_id, answers }
     * The 'answers' field is the full answers Record<questionId, any> from SurveyRenderer.
     */
    static async submitSurvey(surveyId: string, answers: Record<string, any>): Promise<{ data: any; error: any }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('survey_responses')
                .insert({
                    survey_id: surveyId,
                    user_id: user.id,
                    answers: answers,
                });

            if (error) {
                // 23505 = UNIQUE constraint (already completed)
                if (error.code === '23505') {
                    throw new Error('already_completed');
                }
                throw error;
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error submitting survey:', error);
            return { data: null, error };
        }
    }

    /**
     * Legacy vote helper — kept for backward compat with SurveyVotingModal.
     * Wraps submitSurvey with a single-option answer format.
     */
    static async vote(surveyId: string, optionId: string): Promise<{ data: any; error: any }> {
        // Build a simple answers object: { "q0": optionId }
        return this.submitSurvey(surveyId, { q0: optionId });
    }

    /**
     * Get count of active surveys the user hasn't completed yet.
     * Mirrors mobile pattern: uses the same RPC and counts uncompleted items.
     */
    static async getActiveCount(userId?: string): Promise<number> {
        try {
            const { data, error } = await supabase
                .rpc('get_active_surveys', { p_user_id: userId ?? null });

            if (error || !data) return 0;

            // Count surveys not yet completed by the user
            const uncompleted = (data as any[]).filter(
                (s: any) => !(s.user_completed || s.already_completed)
            );
            return uncompleted.length;
        } catch (error) {
            console.error('Error fetching survey active count:', error);
            return 0;
        }
    }
}
