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
}

export interface SurveyOption {
    id: string;
    survey_id: string;
    text: string;
    votes_count: number;
}

export class SurveyService {
    /**
     * Fetch all active and past surveys
     */
    static async getSurveys() {
        try {
            // Fetch surveys
            const { data: surveys, error: surveysError } = await supabase
                .from('surveys')
                .select('*')
                .order('created_at', { ascending: false });

            if (surveysError) throw surveysError;

            // Fetch options separately to avoid FK issues
            const { data: options, error: optionsError } = await supabase
                .from('survey_options')
                .select('*');

            if (optionsError) throw optionsError;

            // Merge them in JS
            const formattedSurveys = (surveys || []).map(survey => ({
                ...survey,
                options: (options || []).filter(opt => opt.survey_id === survey.id)
            }));

            return { surveys: formattedSurveys as Survey[], error: null };
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

            // This usually calls a stored procedure to handle logic (update votes_count, mark user as voted)
            const { data, error } = await supabase.rpc('vote_survey', {
                p_survey_id: surveyId,
                p_option_id: optionId,
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
