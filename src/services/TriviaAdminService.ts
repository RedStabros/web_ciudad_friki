import { supabase } from '../lib/supabase';
import { getLocalTodayString } from '../utils/dateUtils';
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

    async getAdminTriviasPaginated(limit: number = 20, offset: number = 0, statusFilter: string = 'all'): Promise<{ trivias: any[], totalCount: number, error: any }> {
        try {
            let query = supabase
                .from('trivias')
                .select('*', { count: 'exact' });

            const todayStr = getLocalTodayString();

            if (statusFilter !== 'all') {
                if (statusFilter === 'active') {
                    query = query.eq('status', 'active').or(`expire_date.gte.${todayStr},expire_date.is.null`);
                } else if (statusFilter === 'expired') {
                    // A trivia is considered expired if its expire_date has passed, regardless of its 'active' status
                    query = query.lt('expire_date', todayStr);
                } else {
                    query = query.eq('status', statusFilter);
                }
            }

            // Order by created_at desc
            query = query.order('created_at', { ascending: false });

            // Range pagination
            const { data, count, error } = await query.range(offset, offset + limit - 1);

            if (error) throw error;
            if (!data) return { trivias: [], totalCount: count || 0, error: null };

            // Fetch attempt_count and total_points for each trivia
            const triviasWithStats = await Promise.all(
                data.map(async (trivia) => {
                    const { count: attemptCount } = await supabase
                        .from('trivia_attempts')
                        .select('*', { count: 'exact', head: true })
                        .eq('trivia_id', trivia.id);

                    const { data: qData } = await supabase
                        .from('trivia_questions')
                        .select('points')
                        .eq('trivia_id', trivia.id);
                        
                    const total_points = (qData || []).reduce((sum, q) => sum + (q.points || 0), 0);

                    const isExpired = trivia.expire_date && trivia.expire_date.split('T')[0].split(' ')[0] < todayStr;
                    const derivedStatus = (trivia.status === 'active' && isExpired) ? 'expired' : trivia.status;

                    return {
                        ...trivia,
                        status: derivedStatus,
                        attempt_count: attemptCount || 0,
                        total_points
                    };
                })
            );

            return { trivias: triviasWithStats, totalCount: count || 0, error: null };
        } catch (error) {
            console.error('Error in getAdminTriviasPaginated:', error);
            return { trivias: [], totalCount: 0, error };
        }
    },

    async getGlobalAttemptsCount(): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('trivia_attempts')
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching global attempts:', error);
            return 0;
        }
    },

    async getTriviaStatsCounts(): Promise<{ total: number, active: number, drafts: number, paused: number }> {
        try {
            const todayStr = getLocalTodayString();
            const [
                { count: total },
                { count: active },
                { count: drafts },
                { count: paused }
            ] = await Promise.all([
                supabase.from('trivias').select('*', { count: 'exact', head: true }),
                supabase.from('trivias').select('*', { count: 'exact', head: true }).eq('status', 'active').or(`expire_date.gte.${todayStr},expire_date.is.null`),
                supabase.from('trivias').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
                supabase.from('trivias').select('*', { count: 'exact', head: true }).eq('status', 'paused'),
            ]);

            return {
                total: total || 0,
                active: active || 0,
                drafts: drafts || 0,
                paused: paused || 0
            };
        } catch (error) {
            console.error('Error fetching trivia counts:', error);
            return { total: 0, active: 0, drafts: 0, paused: 0 };
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
    },

    async createAutoTrivia(params: {
        categoryId: string;
        title: string;
        description: string;
        publishDate: string;
        expireDate: string;
        questionCount: number;
        adminId: string;
    }): Promise<{ success: boolean; trivia_id?: string; questions_copied?: number; time_limit_seconds?: number; reward_pool?: number; message?: string }> {
        try {
            const { data, error } = await supabase.rpc('create_auto_trivia', {
                p_category_id:    params.categoryId,
                p_title:          params.title,
                p_description:    params.description,
                p_publish_date:   params.publishDate,
                p_expire_date:    params.expireDate,
                p_question_count: params.questionCount,
                p_admin_id:       params.adminId,
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || 'Error al crear la trivia automática.');
            return data;
        } catch (error: any) {
            console.error('Error creating auto trivia:', error);
            throw error;
        }
    },

    async getPendingSubmissions(): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('triviaduels_submissions')
                .select('*, profiles!triviaduels_submissions_user_id_fkey(username), triviaduels_categories(name)')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching pending submissions:', error);
            return [];
        }
    },

    async getContributorsRanking(): Promise<any[]> {
        try {
            const { data, error } = await supabase.rpc('get_trivia_contributors_ranking');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching contributors ranking:', error);
            return [];
        }
    },

    async getTriviaPackContributorsRanking(): Promise<any[]> {
        try {
            const { data, error } = await supabase.rpc('get_trivia_pack_contributors_ranking');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching trivia pack contributors ranking:', error);
            return [];
        }
    },

    async approveSubmission(submissionId: string): Promise<void> {
        try {
            const { error } = await supabase.rpc('approve_trivia_submission', {
                p_submission_id: submissionId
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error approving submission:', error);
            throw error;
        }
    },

    async updateSubmission(submissionId: string, questionText: string, options: { text: string, is_correct: boolean }[]): Promise<void> {
        try {
            const { error } = await supabase.rpc('update_trivia_submission', {
                p_submission_id: submissionId,
                p_question_text: questionText,
                p_options: options
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating submission:', error);
            throw error;
        }
    },

    async rejectSubmission(submissionId: string, notes: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('triviaduels_submissions')
                .update({
                    status: 'rejected',
                    admin_notes: notes,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', submissionId);

            if (error) throw error;
        } catch (error) {
            console.error('Error rejecting submission:', error);
            throw error;
        }
    },

    async getPendingTriviaPacks(): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('trivia_packs_submissions')
                .select(`
                    *,
                    profiles!trivia_packs_submissions_user_id_fkey(username, avatar_url),
                    triviaduels_categories(name, icon)
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching pending trivia packs:', error);
            return [];
        }
    },

    async getTriviaPack(submissionId: string): Promise<{ pack: any; questions: any[] } | null> {
        try {
            const { data, error } = await supabase.rpc('get_trivia_pack_with_questions', {
                p_submission_id: submissionId,
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message);

            return { pack: data.pack, questions: data.questions };
        } catch (error) {
            console.error('Error fetching trivia pack:', error);
            return null;
        }
    },

    async approveTriviaPack(params: {
        submissionId: string;
        publishDate: string;
        expireDate: string;
        timeLimitSeconds: number;
        adminId: string;
    }): Promise<{ success: boolean; trivia_id?: string; rewarded_coins?: number; message?: string }> {
        try {
            const { data, error } = await supabase.rpc('approve_trivia_pack_submission', {
                p_submission_id:      params.submissionId,
                p_publish_date:       params.publishDate,
                p_expire_date:        params.expireDate,
                p_time_limit_seconds: params.timeLimitSeconds,
                p_admin_id:           params.adminId,
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || 'Error al aprobar el paquete.');
            return data;
        } catch (error) {
            console.error('Error approving trivia pack:', error);
            throw error;
        }
    },

    async rejectTriviaPack(params: {
        submissionId: string;
        adminNotes: string;
        adminId: string;
    }): Promise<void> {
        try {
            const { data, error } = await supabase.rpc('reject_trivia_pack_submission', {
                p_submission_id: params.submissionId,
                p_admin_notes:   params.adminNotes,
                p_admin_id:      params.adminId,
            });

            if (error) throw error;
            if (data && !data.success) throw new Error(data.message || 'Error al rechazar el paquete.');
        } catch (error) {
            console.error('Error rejecting trivia pack:', error);
            throw error;
        }
    }
};
