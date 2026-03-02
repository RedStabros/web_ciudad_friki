import { supabase } from '../lib/supabase';

export interface TriviaQuestion {
    id: string;
    question: string; // question_text
    options: string[];
    correct_answer_index: number;
    points: number;
    id_trivia: string;
}

export interface Trivia {
    id: string;
    title: string;
    description: string;
    status: string;
    publish_date: string;
    expire_date: string;
    time_limit_seconds: number;
    created_at: string;
    questions: TriviaQuestion[];
    reward?: number;
    user_completed?: boolean;
}

export class TriviaService {
    /**
     * Fetch all active trivias with their questions
     */
    static async fetchTriviaData() {
        try {
            const { data, error } = await supabase
                .from('trivias')
                .select(`
                    *,
                    questions:trivia_questions(
                        *,
                        options:trivia_options(*)
                    )
                `)
                .eq('status', 'active');

            if (error) throw error;

            const trivias: Trivia[] = (data || []).map((t: any) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                publish_date: t.publish_date,
                expire_date: t.expire_date,
                time_limit_seconds: t.time_limit_seconds,
                created_at: t.created_at,
                reward: (t.questions || []).reduce((sum: number, q: any) => sum + (q.points || 0), 0),
                user_completed: false,
                questions: (t.questions || []).map((q: any) => ({
                    id: q.id,
                    question: q.question_text,
                    points: q.points,
                    id_trivia: t.id,
                    options: (q.options || []).map((o: any) => o.option_text),
                    correct_answer_index: (q.options || []).findIndex((o: any) => o.is_correct)
                }))
            }));

            // Check if user has completed these trivias
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: attempts } = await supabase
                    .from('trivia_attempts')
                    .select('trivia_id')
                    .eq('user_id', user.id);

                if (attempts) {
                    const completedIds = new Set(attempts.map(a => a.trivia_id));
                    trivias.forEach(t => {
                        if (completedIds.has(t.id)) t.user_completed = true;
                    });
                }
            }

            const now = new Date().toISOString();
            const filteredTrivias = trivias.filter(t => !t.expire_date || t.expire_date >= now);

            return { trivias: filteredTrivias, error: null };
        } catch (error) {
            console.error('Error fetching trivias:', error);
            return { trivias: [], error };
        }
    }

    /**
     * Submit an answer for a trivia question
     */
    static async submitAnswer(questionId: string, answerIndex: number) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

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

    /**
     * Mark a trivia as finished for the user
     */
    static async finishTrivia(triviaId: string, score: number, _answersLog: any = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false };

            const { error } = await supabase
                .from('trivia_attempts')
                .upsert({
                    user_id: user.id,
                    trivia_id: triviaId,
                    score: score,
                    completed_at: new Date().toISOString()
                });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error finishing trivia:', error);
            return { success: false };
        }
    }
}
