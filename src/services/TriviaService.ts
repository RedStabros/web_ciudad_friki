import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TriviaQuestion {
    id: string;
    question: string; // question_text
    points: number;
    id_trivia: string;
    options: { id: string; text: string; is_correct: boolean }[];
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

export interface VSCategory {
    id: string;
    name: string;
    icon: string;
    description?: string;
}

export interface VSQuestion {
    id: string;
    question_text: string;
    options: string[];
    correct_option_index?: number;
    correct_answer_index?: number;
    time_limit_seconds?: number;
}

export interface TriviaDuel {
    id: string;
    wager_amount: number;
    question_ids: string[];
    creator_id: string;
    status: string;
    profiles?: { username: string; avatar_url?: string };
    triviaduels_categories?: { name: string; icon: string };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TriviaService {

    // ── Regular Trivias ───────────────────────────────────────────────────────

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
     * Submit an answer for a trivia question (per-question RPC)
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
     * Get trivia questions with full option objects (id, text, is_correct)
     * Same as mobile app's getTriviaDetails()
     */
    static async getTriviaDetails(triviaId: string): Promise<TriviaQuestion[]> {
        try {
            const { data, error } = await supabase
                .from('trivia_questions')
                .select('*, options:trivia_options(*)')
                .eq('trivia_id', triviaId)
                .order('order', { ascending: true });

            if (error) throw error;

            return (data || []).map((q: any) => ({
                id: q.id,
                question: q.question_text,
                points: q.points,
                id_trivia: triviaId,
                options: (q.options || []).map((o: any) => ({
                    id: o.id,
                    text: o.option_text,
                    is_correct: o.is_correct
                }))
            }));
        } catch (error) {
            console.error('Error fetching trivia details:', error);
            return [];
        }
    }

    /**
     * Submit trivia attempt — same logic as mobile app's submitAttempt()
     * Calculates score, inserts trivia_attempts, calls deliver_trivia_reward RPC
     */
    static async submitAttempt(
        userId: string,
        triviaId: string,
        answers: Record<string, string> // { questionId: optionId }
    ): Promise<{ score: number; correctCount: number; total: number; totalPoints: number; reward: number }> {
        const questions = await TriviaService.getTriviaDetails(triviaId);

        let earnedPoints = 0;
        let correctCount = 0;
        for (const q of questions) {
            const userAnswer = answers[q.id];
            const correctOption = q.options.find(o => o.is_correct);
            if (userAnswer && correctOption && userAnswer === correctOption.id) {
                earnedPoints += q.points;
                correctCount++;
            }
        }

        const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

        // Insert attempt
        const { error: attemptError } = await supabase
            .from('trivia_attempts')
            .insert({
                user_id: userId,
                trivia_id: triviaId,
                score: earnedPoints,
                answers_log: answers,
                completed_at: new Date().toISOString()
            });

        if (attemptError) {
            if (attemptError.code === '23505') throw new Error('Ya jugaste esta trivia.');
            throw attemptError;
        }

        // Deliver reward via secure RPC (same as app)
        if (earnedPoints > 0) {
            try {
                await supabase.rpc('deliver_trivia_reward', {
                    p_user_id: userId,
                    p_trivia_id: triviaId,
                    p_amount: earnedPoints
                });
            } catch (e) {
                console.error('Error delivering trivia reward:', e);
            }
        }

        return { score: earnedPoints, correctCount, total: questions.length, totalPoints, reward: earnedPoints };
    }

    /**
     * Get trivias with completion status for the current user — mirrors app's getTriviasWithStatus()
     */
    static async getTriviasWithStatus(userId: string) {
        try {
            const now = new Date().toISOString();
            const { data: trivias, error } = await supabase
                .from('trivias')
                .select('*')
                .eq('status', 'active')
                .or(`expire_date.is.null,expire_date.gt.${now}`)
                .order('created_at', { ascending: false });
            if (error) throw error;

            const { data: attempts } = await supabase
                .from('trivia_attempts')
                .select('trivia_id, score')
                .eq('user_id', userId);

            const attemptsMap = new Map((attempts || []).map((a: any) => [a.trivia_id, a]));
            return (trivias || []).map((t: any) => ({
                ...t,
                user_completed: attemptsMap.has(t.id),
                user_score: attemptsMap.get(t.id)?.score
            }));
        } catch (error) {
            console.error('Error fetching trivias with status:', error);
            return [];
        }
    }

    /**
     * Mark a trivia as finished for the user (legacy fallback)
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

    /**
     * Get count of active trivias the user hasn't completed (matches mobile app pattern with null-aware filter)
     */
    static async getActiveCount(userId?: string): Promise<number> {
        try {
            const now = new Date().toISOString();
            const { data: activeTrivias, error } = await supabase
                .from('trivias')
                .select('id')
                .eq('status', 'active')
                .or(`expire_date.is.null,expire_date.gt.${now}`);

            if (error || !activeTrivias) return 0;
            if (!userId) return activeTrivias.length;

            const { data: attempts } = await supabase
                .from('trivia_attempts')
                .select('trivia_id')
                .eq('user_id', userId);

            const completedIds = new Set((attempts || []).map((a: any) => a.trivia_id));
            return activeTrivias.filter((t: any) => !completedIds.has(t.id)).length;
        } catch (error) {
            console.error('Error fetching active trivia count:', error);
            return 0;
        }
    }

    // ── VS (Duels) ────────────────────────────────────────────────────────────

    /**
     * Get available VS categories
     */
    static async getVSCategories(): Promise<VSCategory[]> {
        try {
            const { data, error } = await supabase
                .from('triviaduels_categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            return (data || []).sort((a: any, b: any) => {
                if (a.id === 'random') return 1;
                if (b.id === 'random') return -1;
                return 0;
            });
        } catch (error) {
            console.error('Error fetching VS categories:', error);
            return [];
        }
    }

    /**
     * Get VS questions by their IDs (preserving order)
     */
    static async getVSQuestions(questionIds: string[]): Promise<VSQuestion[]> {
        try {
            const { data, error } = await supabase
                .from('triviaduels_questions')
                .select('*')
                .in('id', questionIds);

            if (error) throw error;

            const questionMap = new Map((data || []).map((q: any) => [q.id, q]));
            return questionIds.map(id => questionMap.get(id)).filter(Boolean) as VSQuestion[];
        } catch (error) {
            console.error('Error fetching VS questions:', error);
            return [];
        }
    }

    /**
     * Create a new VS duel — uses create_trivia_duel RPC (same as mobile app)
     */
    static async createVSDuel(categoryId: string, questionCount: number, wagerAmount: number): Promise<string> {
        try {
            const { data, error } = await supabase.rpc('create_trivia_duel', {
                p_category_id: categoryId,
                p_question_count: questionCount,
                p_wager_amount: wagerAmount
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating VS duel:', error);
            throw error;
        }
    }

    /**
     * Submit VS result — uses submit_trivia_vs_result RPC (winner resolved server-side)
     */
    static async submitVSResult(duelId: string, score: number, timeMs: number): Promise<any> {
        try {
            const { data, error } = await supabase.rpc('submit_trivia_vs_result', {
                p_duel_id: duelId,
                p_score: score,
                p_time_ms: timeMs
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error submitting VS result:', error);
            throw error;
        }
    }

    /**
     * Get lobby duels: my pending creates + public open duels from others
     */
    static async getLobbyDuels(userId: string) {
        try {
            const [myResult, publicResult] = await Promise.all([
                supabase
                    .from('trivia_duels')
                    .select('*, triviaduels_categories(name, icon)')
                    .eq('status', 'open')
                    .eq('creator_id', userId)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('trivia_duels')
                    .select('*, triviaduels_categories(name, icon), profiles!trivia_duels_creator_id_fkey(username, avatar_url)')
                    .eq('status', 'open')
                    .neq('creator_id', userId)
                    .order('created_at', { ascending: false }),
            ]);

            return {
                myPendingDuels: myResult.data || [],
                publicOpenDuels: publicResult.data || [],
            };
        } catch (error) {
            console.error('Error fetching lobby duels:', error);
            return { myPendingDuels: [], publicOpenDuels: [] };
        }
    }

    /**
     * Get VS winners ranking aggregated from completed trivia_duels
     */
    static async getVSWinnersRanking(limit = 5): Promise<Array<{ user_id: string; username: string; duels_won: number; avatar_url?: string }>> {
        try {
            const { data, error } = await supabase
                .from('trivia_duels')
                .select(`
                    winner_id,
                    profiles!trivia_duels_winner_id_fkey(username, avatar_url)
                `)
                .not('winner_id', 'is', null)
                .eq('status', 'completed');

            if (error) throw error;

            const winsMap: Record<string, { username: string; avatar_url?: string; count: number }> = {};
            (data || []).forEach((row: any) => {
                const id = row.winner_id;
                if (!id) return;
                if (!winsMap[id]) {
                    winsMap[id] = {
                        username: row.profiles?.username || 'Anónimo',
                        avatar_url: row.profiles?.avatar_url,
                        count: 0
                    };
                }
                winsMap[id].count++;
            });

            return Object.entries(winsMap)
                .map(([user_id, v]) => ({ user_id, username: v.username, avatar_url: v.avatar_url, duels_won: v.count }))
                .sort((a, b) => b.duels_won - a.duels_won)
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching VS winners ranking:', error);
            return [];
        }
    }
}
