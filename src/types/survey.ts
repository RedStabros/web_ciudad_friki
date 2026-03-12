export type SurveyStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'cancelled';

export type QuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'rating';

export interface SurveyQuestion {
    id: string;
    type: QuestionType;
    text: string;
    required: boolean;
    options?: string[];
    maxLength?: number;
    min?: number;
    max?: number;
}

export interface SurveyData {
    title: string;
    description: string;
    questions: SurveyQuestion[];
    reward_amount: number;
    publish_date: string;
    expire_date: string;
    status?: SurveyStatus;
}

export interface AdminSurvey {
    id: string;
    title: string;
    description: string;
    status: SurveyStatus;
    reward_amount: number;
    publish_date: string;
    expire_date: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    response_count: number;
}

export interface SurveyResponse {
    user_id: string;
    username: string;
    full_name: string;
    answers: Record<string, any>;
    completed_at: string;
}

export interface QuestionStats {
    type: QuestionType;
    counts?: Record<string, number>;
    average?: number;
    total?: number;
    distribution?: Record<string, number>;
    samples?: string[];
}

export interface SurveyAnalytics {
    [questionId: string]: QuestionStats;
}

export interface SurveyResponseDetail {
    id: string;
    user_id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    answers: Record<string, any>;
    created_at: string;
}

export interface SurveyStatistics {
    survey_id: string;
    title: string;
    total_responses: number;
    total_rewards_paid: number;
}
