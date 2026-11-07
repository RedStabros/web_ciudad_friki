import { supabase } from '../lib/supabase';

export type CraftCategory = 'all' | 'papercraft' | 'origami' | 'colorear' | 'cosplay_props';
export type CraftDifficulty = 'all' | 'facil' | 'intermedio' | 'avanzado';

export interface CraftItem {
    id: string;
    title: string;
    description: string | null;
    category: 'papercraft' | 'origami' | 'colorear' | 'cosplay_props' | 'otro';
    difficulty: 'facil' | 'intermedio' | 'avanzado';
    estimated_time: string | null;
    pages_count: number;
    thumbnail_url: string;
    pdf_url: string;
    video_url: string | null;
    source_attribution: string | null;
    downloads_count: number;
    rating_avg: number;
    rating_count: number;
    tags: string[];
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface CraftReviewItem {
    id: string;
    craft_id: string;
    user_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    username: string;
    avatar_url: string | null;
}

export const CraftService = {
    async getCrafts(
        category: CraftCategory = 'all',
        searchQuery?: string,
        difficulty: CraftDifficulty = 'all'
    ): Promise<CraftItem[]> {
        try {
            let query = supabase
                .from('craft_items')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            if (category !== 'all') {
                query = query.eq('category', category);
            }

            if (difficulty !== 'all') {
                query = query.eq('difficulty', difficulty);
            }

            if (searchQuery && searchQuery.trim().length > 0) {
                const clean = searchQuery.trim().toLowerCase();
                query = query.or(`title.ilike.%${clean}%,description.ilike.%${clean}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error in CraftService.getCrafts:', error);
            return [];
        }
    },

    async recordDownload(craftId: string): Promise<boolean> {
        try {
            const { error } = await supabase.rpc('increment_craft_downloads', {
                p_craft_id: craftId
            });
            if (error) {
                console.warn('Error in increment_craft_downloads RPC:', error);
            }
            return true;
        } catch (error) {
            console.warn('Error recording download:', error);
            return false;
        }
    },

    async getCraftReviews(craftId: string): Promise<CraftReviewItem[]> {
        try {
            const { data: ratings, error } = await supabase
                .from('craft_ratings')
                .select('id, craft_id, user_id, rating, comment, created_at')
                .eq('craft_id', craftId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!ratings || ratings.length === 0) return [];

            const userIds = [...new Set(ratings.map(r => r.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);

            const profileMap = new Map((profiles || []).map(p => [p.id, p]));

            return ratings.map((row: any) => {
                const profile = profileMap.get(row.user_id);
                return {
                    id: row.id,
                    craft_id: row.craft_id,
                    user_id: row.user_id,
                    rating: row.rating,
                    comment: row.comment,
                    created_at: row.created_at,
                    username: profile?.username || 'Friki Anónimo',
                    avatar_url: profile?.avatar_url || null,
                };
            });
        } catch (error) {
            console.error('Error in CraftService.getCraftReviews:', error);
            return [];
        }
    },

    async submitRating(
        craftId: string,
        rating: number,
        comment?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { success: false, error: 'Inicia sesión para calificar esta manualidad.' };
            }

            const { error } = await supabase
                .from('craft_ratings')
                .upsert(
                    {
                        craft_id: craftId,
                        user_id: user.id,
                        rating,
                        comment: comment?.trim() || null
                    },
                    { onConflict: 'craft_id,user_id' }
                );

            if (error) throw error;
            return { success: true };
        } catch (error: any) {
            console.error('Error in CraftService.submitRating:', error);
            return { success: false, error: error.message || 'Error al guardar la calificación' };
        }
    }
};

