import { supabase } from '../lib/supabase';
import type { TavernThread, ThreadCategory } from '../types/tavern';

const THREADS_PAGE_SIZE = 15;

export interface BringThreadsResult {
    threads: TavernThread[];
    nextPage: number | null;
    error: any;
}

export class TavernService {
    /**
     * Fetch Threads with pagination, filtering by category and sorting
     */
    static async getThreads(
        category: ThreadCategory = 'Todas',
        sortBy: 'HOT' | 'NEW' = 'NEW',
        page: number = 0
    ): Promise<BringThreadsResult> {
        try {
            let query = supabase
                .from('tavern_threads')
                .select(`
                    *,
                    profiles:author_id(username, avatar_url, role)
                `, { count: 'exact' })
                .eq('is_hidden', false);

            if (category !== 'Todas') {
                query = query.eq('tag', category);
            }

            if (sortBy === 'NEW') {
                query = query
                    .order('is_pinned', { ascending: false })
                    .order('created_at', { ascending: false });
            } else {
                // Hot fallback: likes_count DESC
                query = query
                    .order('is_pinned', { ascending: false })
                    .order('likes_count', { ascending: false })
                    .order('created_at', { ascending: false });
            }

            const from = page * THREADS_PAGE_SIZE;
            const to = from + THREADS_PAGE_SIZE - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            const threads: TavernThread[] = (data || []).map((item: any) => ({
                ...item,
                category: item.tag as ThreadCategory,
                author_username: item.profiles?.username,
                author_avatar_url: item.profiles?.avatar_url,
                author_role: item.profiles?.role,
            }));

            const nextPage = (count && to + 1 < count) ? page + 1 : null;
            return { threads, nextPage, error: null };
        } catch (error) {
            console.error('Error fetching threads:', error);
            return { threads: [], nextPage: null, error };
        }
    }

    /**
     * Fetch a single Thread by ID with its replies
     */
    static async getThreadById(id: string) {
        try {
            const { data, error } = await supabase
                .from('tavern_threads')
                .select(`
                    *,
                    profiles:author_id(username, avatar_url, role)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const thread: TavernThread = {
                ...data,
                category: data.tag as ThreadCategory,
                author_username: data.profiles?.username,
                author_avatar_url: data.profiles?.avatar_url,
                author_role: data.profiles?.role,
            };

            return { thread, error: null };
        } catch (error) {
            console.error('Error fetching thread:', error);
            return { thread: null, error };
        }
    }

    /**
     * Create a Thread
     */
    static async createThread(payload: { title: string; content: string; category: string }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('tavern_threads')
                .insert({
                    author_id: user.id,
                    title: payload.title,
                    content: payload.content,
                    tag: payload.category,
                })
                .select()
                .single();

            if (error) throw error;
            return { thread: data, error: null };
        } catch (error) {
            console.error('Error creating thread:', error);
            return { thread: null, error };
        }
    }

    /**
     * Interact with a post (Like/Dislike)
     * Note: This usually calls an RPC in the mobile app
     */
    static async interact(
        targetId: string,
        targetType: 'thread' | 'reply',
        interactionType: 'like' | 'dislike' | 'report'
    ) {
        try {
            const { data, error } = await supabase.rpc('interact_tavern', {
                p_target_id: targetId,
                p_target_type: targetType,
                p_interaction_type: interactionType
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error interacting with post:', error);
            return { data: null, error };
        }
    }

    /**
     * Update a Thread
     */
    static async updateThread(id: string, payload: { title?: string; content?: string; tag?: string }) {
        try {
            const { data, error } = await supabase
                .from('tavern_threads')
                .update({
                    ...payload,
                    updated_at: new Date().toISOString(),
                    is_edited: true
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { thread: data, error: null };
        } catch (error) {
            console.error('Error updating thread:', error);
            return { thread: null, error };
        }
    }

    /**
     * Delete a Thread (Soft delete)
     */
    static async deleteThread(id: string) {
        try {
            const { error } = await supabase
                .from('tavern_threads')
                .update({ is_hidden: true })
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting thread:', error);
            return { error };
        }
    }

    /**
     * Update a Reply
     */
    static async updateReply(id: string, content: string) {
        try {
            const { data, error } = await supabase
                .from('tavern_replies')
                .update({
                    content,
                    updated_at: new Date().toISOString(),
                    is_edited: true
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { reply: data, error: null };
        } catch (error) {
            console.error('Error updating reply:', error);
            return { reply: null, error };
        }
    }

    /**
     * Delete a Reply (Soft delete)
     */
    static async deleteReply(id: string) {
        try {
            const { error } = await supabase
                .from('tavern_replies')
                .update({ is_hidden: true })
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting reply:', error);
            return { error };
        }
    }
}
