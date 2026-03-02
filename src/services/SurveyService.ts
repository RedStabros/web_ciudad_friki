import { supabase } from '../lib/supabase';

export interface Survey {
    id: string;
    title: string;
    description: string;
    expires_at: string;
    id_reward: string;
    created_at: string;
    is_active: boolean;
    options: SurveyOption[];
    user_voted?: boolean;
    reward_amount?: number;
    total_votes?: number;
}

export interface SurveyOption {
    id: string;
    survey_id: string;
    text: string;
    votes_count: number;
}

export class SurveyService {
    /**
     * Fetch all surveys from the real database schema.
     * The database uses a 'questions' JSONB column for survey options.
     */
    static async getSurveys() {
        try {
            const { data: surveys, error: surveysError } = await supabase
                .from('surveys')
                .select('*')
                .order('created_at', { ascending: false });

            if (surveysError) throw surveysError;

            // Transform surveys to match the UI expectations (flattening the first MCQ question)
            const formattedSurveys = (surveys || []).map(s => {
                let options: SurveyOption[] = [];

                // s.questions is an array of questions in the actual DB
                if (s.questions && Array.isArray(s.questions)) {
                    // We look for the first question that defines choices
                    const firstPollQuestion = s.questions.find((q: any) => q.options && Array.isArray(q.options));
                    if (firstPollQuestion) {
                        options = firstPollQuestion.options.map((opt: string, idx: number) => ({
                            id: `${s.id}_idx_${idx}`,
                            survey_id: s.id,
                            text: opt,
                            votes_count: 0 // Placeholder: aggregation usually happens via survey_responses
                        }));
                    }
                }

                return {
                    id: s.id,
                    title: s.title || 'Encuesta sin título',
                    description: s.description || '',
                    expires_at: s.expire_date || s.publish_date || new Date().toISOString(),
                    id_reward: s.reward_amount?.toString() || '0',
                    created_at: s.created_at,
                    is_active: s.status === 'active' || s.status === 'open',
                    options: options,
                    user_voted: false,
                    reward_amount: s.reward_amount || 0,
                    total_votes: 0 // Will be populated below
                } as Survey;
            });

            // If user is logged in, check which surveys they have voted on
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: responses } = await supabase
                    .from('survey_responses')
                    .select('survey_id')
                    .eq('user_id', user.id);

                if (responses) {
                    const votedIds = new Set(responses.map(r => r.survey_id));
                    formattedSurveys.forEach(s => {
                        if (votedIds.has(s.id)) s.user_voted = true;
                    });
                }
            }

            // Get total votes count per survey for all users
            const { data: allVotes } = await supabase
                .from('survey_responses')
                .select('survey_id');

            if (allVotes) {
                const counts: Record<string, number> = {};
                allVotes.forEach(v => {
                    counts[v.survey_id] = (counts[v.survey_id] || 0) + 1;
                });
                formattedSurveys.forEach(s => {
                    s.total_votes = counts[s.id] || 0;
                });
            }

            return { surveys: formattedSurveys, error: null };
        } catch (error) {
            console.error('Error fetching surveys:', error);
            return { surveys: [], error };
        }
    }

    /**
     * Submit a vote for a survey option
     */
    static async vote(surveyId: string, optionId: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // The optionId is virtual (surveyId_idx_N). We extract the index.
            const indexMatch = optionId.match(/_idx_(\d+)$/);
            const optionIndex = indexMatch ? parseInt(indexMatch[1]) : 0;

            // This usually calls a stored procedure to handle logic
            const { data, error } = await supabase.rpc('vote_survey', {
                p_survey_id: surveyId,
                p_option_id: optionId, // Keep original if RPC expects it
                p_option_index: optionIndex, // or add index if needed
                p_user_id: user.id
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error voting in survey:', error);
            return { data: null, error };
        }
    }
}
