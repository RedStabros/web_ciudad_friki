export type TriviaStatus = 'draft' | 'active' | 'paused' | 'cancelled' | 'expired' | 'closed';

export interface TriviaQuestionOption {
    id: string;
    text: string;
    is_correct: boolean;
}

export interface TriviaQuestion {
    id: string;
    text: string;
    points: number;
    order: number;
    options: TriviaQuestionOption[];
}

export interface Trivia {
    id: string;
    title: string;
    description: string;
    status: TriviaStatus;
    publish_date: string;
    expire_date: string | null;
    time_limit_seconds: number;
    created_at: string;
    created_by?: string;
    attempt_count?: number;
    total_points?: number;
    questions?: TriviaQuestion[];
}

export interface TriviaAttempt {
    id: string;
    user_id: string;
    trivia_id: string;
    score: number;
    answers_log: Record<string, string>;
    completed_at: string;
}

export interface TriviaParticipant {
    user_id: string;
    username: string;
    avatar_url: string | null;
    score: number;
    total_points: number;
    completed_at: string;
}
