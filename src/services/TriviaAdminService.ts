import { supabase } from '../lib/supabase';
import { Trivia, TriviaQuestion, TriviaStatus, TriviaParticipant } from '../types/trivia';

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
    }
};
