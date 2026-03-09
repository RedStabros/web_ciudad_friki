import { supabase } from '../lib/supabase';
import type { Trivia, TriviaQuestion, TriviaStatus } from '../types/trivia';

export const TriviaAdminService = {
    async getAllTriviasWithStats(): Promise<Trivia[]> {
        try {
            const { data: trivias, error: triviasError } = await supabase
                .from('trivias')
                .select('*')
                .order('created_at', { ascending: false });

            if (triviasError) throw triviasError;
            if (!trivias) return [];

            const triviasWithStats = await Promise.all(
                trivias.map(async (trivia) => {
                    const { count } = await supabase
                        .from('trivia_attempts')
                        .select('*', { count: 'exact', head: true })
                        .eq('trivia_id', trivia.id);

                    const questions = await this.getTriviaDetails(trivia.id);
                    const total_points = questions.reduce((sum, q) => sum + q.points, 0);

                    return {
                        ...trivia,
                        attempt_count: count || 0,
                        total_points
                    };
                })
            );

            return triviasWithStats;
        } catch (error) {
            console.error('Error fetching trivias with stats:', error);
            return [];
        }
    },

    async getTriviaDetails(triviaId: string): Promise<TriviaQuestion[]> {
        try {
            const { data, error } = await supabase
                .from('trivia_questions')
                .select(`*, options:trivia_options(*)`)
                .eq('trivia_id', triviaId)
                .order('order', { ascending: true });

            if (error) throw error;

            return data?.map(q => ({
                id: q.id,
                text: q.question_text,
                points: q.points,
                order: q.order,
                options: q.options.map((o: any) => ({
                    id: o.id,
                    text: o.option_text,
                    is_correct: o.is_correct
                }))
            })) || [];
        } catch (error) {
            console.error('Error fetching trivia details:', error);
            return [];
        }
    },

    async getTriviaWithQuestions(triviaId: string): Promise<(Trivia & { questions: TriviaQuestion[] }) | null> {
        try {
            const { data: trivia, error: triviaError } = await supabase
                .from('trivias')
                .select('*')
                .eq('id', triviaId)
                .single();

            if (triviaError) throw triviaError;
            const questions = await this.getTriviaDetails(triviaId);
            return { ...trivia, questions };
        } catch (error) {
            console.error('Error fetching trivia with questions:', error);
            return null;
        }
    },

    async createTrivia(trivia: Partial<Trivia>, questions: TriviaQuestion[]) {
        try {
            const { data: triviaData, error: triviaError } = await supabase
                .from('trivias')
                .insert({
                    title: trivia.title,
                    description: trivia.description,
                    time_limit_seconds: trivia.time_limit_seconds,
                    status: trivia.status || 'draft',
                    publish_date: trivia.publish_date || new Date().toISOString(),
                    expire_date: trivia.expire_date,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (triviaError) throw triviaError;
            if (!triviaData) throw new Error('Failed to create trivia');

            for (const q of questions) {
                const { data: qData, error: qError } = await supabase
                    .from('trivia_questions')
                    .insert({
                        trivia_id: triviaData.id,
                        question_text: q.text,
                        points: q.points,
                        order: q.order
                    })
                    .select()
                    .single();

                if (qError) {
                    console.error('Error creating question:', qError);
                    continue;
                }

                const optionsToInsert = q.options.map(o => ({
                    question_id: qData.id,
                    option_text: o.text,
                    is_correct: o.is_correct
                }));

                await supabase.from('trivia_options').insert(optionsToInsert);
            }
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async updateTrivia(triviaId: string, triviaData: Partial<Trivia>, questions?: TriviaQuestion[]) {
        try {
            const { error: triviaError } = await supabase
                .from('trivias')
                .update({
                    title: triviaData.title,
                    description: triviaData.description,
                    time_limit_seconds: triviaData.time_limit_seconds,
                    publish_date: triviaData.publish_date,
                    expire_date: triviaData.expire_date,
                    status: triviaData.status
                })
                .eq('id', triviaId);

            if (triviaError) throw triviaError;

            if (questions) {
                await supabase.from('trivia_questions').delete().eq('trivia_id', triviaId);

                for (const q of questions) {
                    const { data: qData, error: qError } = await supabase
                        .from('trivia_questions')
                        .insert({
                            trivia_id: triviaId,
                            question_text: q.text,
                            points: q.points,
                            order: q.order
                        })
                        .select()
                        .single();

                    if (qError) continue;

                    const optionsToInsert = q.options.map(o => ({
                        question_id: qData.id,
                        option_text: o.text,
                        is_correct: o.is_correct
                    }));

                    await supabase.from('trivia_options').insert(optionsToInsert);
                }
            }
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async changeTriviaStatus(triviaId: string, newStatus: TriviaStatus): Promise<{ error?: any }> {
        try {
            const { error } = await supabase
                .from('trivias')
                .update({ status: newStatus })
                .eq('id', triviaId);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            return { error };
        }
    },

    async getTriviaAnalytics(triviaId: string) {
        try {
            // Get all attempts for this trivia
            const { data: attempts, error: attemptsError } = await supabase
                .from('trivia_attempts')
                .select('id, user_id, score, completed_at')
                .eq('trivia_id', triviaId)
                .order('completed_at', { ascending: false });

            if (attemptsError) throw attemptsError;

            // Get trivia questions to calculate total questions
            const questions = await this.getTriviaDetails(triviaId);
            const totalQuestions = questions.length;
            const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

            // Get unique user IDs
            const userIds = [...new Set((attempts || []).map(a => a.user_id))];

            // Fetch user profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            const profileMap = new Map(
                (profiles || []).map(p => [p.id, p])
            );

            const processedAttempts = (attempts || []).map((attempt: any) => {
                const profile = profileMap.get(attempt.user_id);
                const pointsPerQuestion = totalQuestions > 0 ? totalPoints / totalQuestions : 10;
                const correctCount = Math.round(attempt.score / pointsPerQuestion);

                return {
                    id: attempt.id,
                    user_id: attempt.user_id,
                    username: profile?.username || 'Usuario',
                    avatar_url: profile?.avatar_url || null,
                    score: attempt.score,
                    correct_count: correctCount,
                    total_questions: totalQuestions,
                    completed_at: attempt.completed_at,
                };
            });

            const totalAttempts = processedAttempts.length;
            const totalCoinsDistributed = processedAttempts.reduce((sum, a) => sum + a.score, 0);
            const averageScore = totalAttempts > 0
                ? (processedAttempts.reduce((sum, a) => sum + (a.correct_count / a.total_questions * 100), 0) / totalAttempts)
                : 0;

            return {
                attempts: processedAttempts,
                stats: {
                    totalAttempts,
                    totalCoinsDistributed,
                    averageScore,
                },
                error: null
            };
        } catch (error: any) {
            console.error('Error getting trivia analytics:', error);
            return {
                attempts: [],
                stats: { totalAttempts: 0, totalCoinsDistributed: 0, averageScore: 0 },
                error
            };
        }
    }
};
