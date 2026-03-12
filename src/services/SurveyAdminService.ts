import { supabase } from '../lib/supabase';
import type { AdminSurvey, SurveyData, SurveyStatus, SurveyAnalytics, SurveyResponseDetail } from '../types/survey';

/**
 * Survey Admin Service for Web
 */
export const SurveyAdminService = {
    async getAllSurveys(adminId: string) {
        const { data, error } = await supabase
            .rpc('get_all_surveys_admin', { p_admin_id: adminId });
        if (error) {
            console.error('Error fetching surveys:', error);
            return { data: null, error };
        }
        return { data: data as AdminSurvey[], error: null };
    },

    async createSurvey(adminId: string, surveyData: SurveyData) {
        const { data, error } = await supabase.rpc('create_survey', {
            p_admin_id: adminId,
            p_title: surveyData.title,
            p_description: surveyData.description,
            p_questions: surveyData.questions,
            p_reward_amount: surveyData.reward_amount,
            p_publish_date: surveyData.publish_date,
            p_expire_date: surveyData.expire_date,
            p_status: surveyData.status || 'draft'
        });
        if (error) {
            console.error('Error creating survey:', error);
            return { data: null, error };
        }
        return { data, error: null };
    },

    async updateSurvey(adminId: string, surveyId: string, surveyData: SurveyData) {
        const { data, error } = await supabase.rpc('update_survey', {
            p_admin_id: adminId,
            p_survey_id: surveyId,
            p_title: surveyData.title,
            p_description: surveyData.description,
            p_questions: surveyData.questions,
            p_reward_amount: surveyData.reward_amount,
            p_publish_date: surveyData.publish_date,
            p_expire_date: surveyData.expire_date
        });
        if (error) {
            console.error('Error updating survey:', error);
            return { data: null, error };
        }
        return { data, error: null };
    },

    async changeSurveyStatus(adminId: string, surveyId: string, newStatus: SurveyStatus) {
        try {
            const { data, error } = await supabase.rpc('change_survey_status', {
                p_admin_id: adminId,
                p_survey_id: surveyId,
                p_new_status: newStatus
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('Error changing survey status:', error);
            return { data: null, error };
        }
    },

    async getSurveyQuestions(surveyId: string) {
        try {
            const { data, error } = await supabase
                .from('surveys')
                .select('questions')
                .eq('id', surveyId)
                .single();
            if (error) throw error;
            return { data: data?.questions || [], error: null };
        } catch (error: any) {
            console.error('Error fetching survey questions:', error);
            return { data: null, error };
        }
    },

    async getSurveyStats(surveyId: string) {
        try {
            const { data, error } = await supabase
                .rpc('get_survey_stats', { p_survey_id: surveyId });
            if (error) throw error;
            return { data: data as SurveyAnalytics, error: null };
        } catch (error: any) {
            console.error('Error fetching survey stats:', error);
            return { data: null, error };
        }
    },

    async getSurveyResponses(surveyId: string, limit = 50, offset = 0) {
        try {
            const { data, error } = await supabase
                .rpc('get_survey_responses', {
                    p_survey_id: surveyId,
                    p_limit: limit,
                    p_offset: offset
                });
            if (error) throw error;

            const responses = data as SurveyResponseDetail[];
            const userIds = [...new Set(responses.map(r => r.user_id))];

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, avatar_url')
                    .in('id', userIds);

                if (profiles) {
                    const profileMap = new Map(profiles.map(p => [p.id, p]));
                    responses.forEach(r => {
                        const profile = profileMap.get(r.user_id);
                        if (profile) r.avatar_url = profile.avatar_url;
                    });
                }
            }

            return { data: responses, error: null };
        } catch (error: any) {
            console.error('Error fetching survey responses:', error);
            return { data: null, error };
        }
    },

    async getAllSurveyResponses(surveyId: string) {
        try {
            const { data, error } = await supabase
                .rpc('get_all_survey_responses', { p_survey_id: surveyId });
            if (error) throw error;

            const responses = data as SurveyResponseDetail[];
            const userIds = [...new Set(responses.map(r => r.user_id))];

            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, avatar_url')
                    .in('id', userIds);

                if (profiles) {
                    const profileMap = new Map(profiles.map(p => [p.id, p]));
                    responses.forEach(r => {
                        const profile = profileMap.get(r.user_id);
                        if (profile) r.avatar_url = profile.avatar_url;
                    });
                }
            }

            return { data: responses, error: null };
        } catch (error: any) {
            console.error('Error fetching all survey responses:', error);
            return { data: null, error };
        }
    }
};
