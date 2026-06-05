import { supabase } from '../lib/supabase';
import type { TavernThread, ThreadCategory } from '../types/tavern';

const THREADS_PAGE_SIZE = 15;
const REPLIES_PAGE_SIZE = 20;

export interface BringThreadsResult {
    threads: TavernThread[];
    nextPage: number | null;
    error: any;
}

export interface BringRepliesResult {
    replies: any[];
    nextPage: number | null;
    error: any;
}

export class TavernService {

    private static async checkUserStatus(userId: string): Promise<{ isBanned: boolean; isShadowBanned: boolean; banUntil: string | null; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_banned, is_shadow_banned, ban_until')
                .eq('id', userId)
                .single();

            if (error) return { isBanned: false, isShadowBanned: false, banUntil: null };

            const now = new Date();
            const banUntil = data.ban_until ? new Date(data.ban_until) : null;
            const isBanActive = banUntil ? banUntil > now : data.is_banned;

            return {
                isBanned: isBanActive && !data.is_shadow_banned,
                isShadowBanned: isBanActive && data.is_shadow_banned,
                banUntil: data.ban_until
            };
        } catch {
            return { isBanned: false, isShadowBanned: false, banUntil: null };
        }
    }

    /**
     * Get current user's votes for a set of target IDs
     */
    private static async getUserVotes(
        targetIds: string[],
        targetType: 'thread' | 'reply'
    ): Promise<Record<string, 'like' | 'dislike'>> {
        if (!targetIds.length) return {};
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return {};
            const { data } = await supabase
                .from('tavern_interactions')
                .select('target_id, interaction_type')
                .eq('user_id', user.id)
                .eq('target_type', targetType)
                .in('target_id', targetIds)
                .in('interaction_type', ['like', 'dislike']);
            const map: Record<string, 'like' | 'dislike'> = {};
            (data || []).forEach((row: any) => { map[row.target_id] = row.interaction_type; });
            return map;
        } catch {
            return {};
        }
    }
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
                // HOT: Order by is_pinned, then updated_at (thread bumping)
                query = query
                    .order('is_pinned', { ascending: false })
                    .order('updated_at', { ascending: false });
            }

            const from = page * THREADS_PAGE_SIZE;
            const to = from + THREADS_PAGE_SIZE - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            const threadIds = (data || []).map((i: any) => i.id);
            const voteMap = await TavernService.getUserVotes(threadIds, 'thread');

            const threads: TavernThread[] = (data || []).map((item: any) => ({
                ...item,
                category: item.tag as ThreadCategory,
                author_username: item.profiles?.username,
                author_avatar_url: item.profiles?.avatar_url,
                author_role: item.profiles?.role,
                user_vote: voteMap[item.id] ?? null,
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

            const voteMap = await TavernService.getUserVotes([data.id], 'thread');

            const thread: TavernThread = {
                ...data,
                category: data.tag as ThreadCategory,
                author_username: data.profiles?.username,
                author_avatar_url: data.profiles?.avatar_url,
                author_role: data.profiles?.role,
                user_vote: voteMap[data.id] ?? null,
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

            const status = await TavernService.checkUserStatus(user.id);
            if (status.isBanned) throw new Error('Tu cuenta ha sido suspendida permanentemente o temporalmente.');
            if (status.isShadowBanned) throw new Error('No tienes permisos para crear contenido en este momento.');

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
     * Fetch Replies for a Thread (mirrors app's getReplies)
     */
    static async getReplies(threadId: string, page: number = 0): Promise<BringRepliesResult> {
        try {
            const from = page * REPLIES_PAGE_SIZE;
            const to = from + REPLIES_PAGE_SIZE - 1;

            const { data, error, count } = await supabase
                .from('tavern_replies')
                .select(`
                    *,
                    profiles:author_id(username, avatar_url, role)
                `, { count: 'exact' })
                .eq('thread_id', threadId)
                .eq('is_hidden', false)
                .order('created_at', { ascending: true })
                .range(from, to);

            if (error) throw error;

            const replyIds = (data || []).map((i: any) => i.id);
            const voteMap = await TavernService.getUserVotes(replyIds, 'reply');

            const replies = (data || []).map((item: any) => ({
                ...item,
                upvotes: item.likes_count || 0,
                downvotes: item.dislikes_count || 0,
                author_username: item.profiles?.username,
                author_avatar_url: item.profiles?.avatar_url,
                author_role: item.profiles?.role,
                user_vote: voteMap[item.id] ?? null,
            }));

            const nextPage = (count && to + 1 < count) ? page + 1 : null;
            return { replies, nextPage, error: null };
        } catch (error) {
            console.error('Error fetching replies:', error);
            return { replies: [], nextPage: null, error };
        }
    }

    /**
     * Create a Reply (mirrors app's createReply)
     */
    static async createReply(payload: { thread_id: string; content: string }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const status = await TavernService.checkUserStatus(user.id);
            if (status.isBanned) throw new Error('Tu cuenta ha sido suspendida.');
            if (status.isShadowBanned) throw new Error('No tienes permisos para comentar en este momento.');

            const { data, error } = await supabase
                .from('tavern_replies')
                .insert({
                    author_id: user.id,
                    thread_id: payload.thread_id,
                    content: payload.content,
                })
                .select()
                .single();

            if (error) throw error;
            return { reply: data, error: null };
        } catch (error) {
            console.error('Error creating reply:', error);
            return { reply: null, error };
        }
    }

    /**
     * Interact with a post (Like/Dislike/Report)
     * Mirrors app exactly — includes p_report_reason for reports.
     */
    static async interact(
        targetId: string,
        targetType: 'thread' | 'reply',
        interactionType: 'like' | 'dislike' | 'report',
        reportReason?: string
    ) {
        try {
            const { data, error } = await supabase.rpc('interact_tavern', {
                p_target_id: targetId,
                p_target_type: targetType,
                p_interaction_type: interactionType,
                p_report_reason: reportReason || null,
            });

            if (error) throw error;
            return { data, error: null }; // returns { success, message, likes_count, dislikes_count }
        } catch (error) {
            console.error('Error interacting with post:', error);
            return { data: null, error };
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

    /**
     * Edit a post — uses RPC 'edit_tavern_post' (mirrors app exactly)
     * Enforces 5-min window, no-replies rule, and author-only at DB level.
     */
    static async editPost(targetId: string, targetType: 'thread' | 'reply', content: string, title?: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const status = await TavernService.checkUserStatus(user.id);
            if (status.isBanned || status.isShadowBanned) throw new Error('No tienes permisos para editar contenido.');

            const { data, error } = await supabase.rpc('edit_tavern_post', {
                p_target_id: targetId,
                p_target_type: targetType,
                p_content: content,
                p_title: title || null,
            });
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error editing post:', error);
            return { data: null, error };
        }
    }
}
