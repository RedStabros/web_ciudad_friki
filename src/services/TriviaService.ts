import { supabase } from '../lib/supabase';

export interface TriviaQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer_index: number;
    points: number;
    difficulty: 'Fácil' | 'Media' | 'Difícil';
    category: string;
    is_active: boolean;
}

export class TriviaService {
    /**
     * Fetch all active trivia questions
     */
    static async fetchTriviaData() {
        try {
            const { data, error } = await supabase
                .from('trivia_questions')
                .select('*');

            if (error) throw error;
            return { questions: (data || []) as TriviaQuestion[], error: null };
        } catch (error) {
            console.error('Error fetching trivia questions:', error);
            return { questions: [], error };
        }
    }

    /**
     * Submit an answer for a trivia question and reward the user
     */
    static async submitAnswer(questionId: string, answerIndex: number) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Calls a stored procedure to check answer and reward points/coins
            const { data, error } = await supabase.rpc('submit_trivia_answer', {
                p_question_id: questionId,
                p_answer_index: answerIndex,
                p_user_id: user.id
            });

            if (error) throw error;
            return { result: data, error: null };
        } catch (error) {
            console.error('Error submitting trivia answer:', error);
            return { result: null, error };
        }
    }
}
