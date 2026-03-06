import { supabase } from '../lib/supabase';

export interface FrikiEvent {
    id: string;
    title: string;
    description: string;
    date: string; // ISO String
    end_date?: string;
    start_time?: string;
    end_time?: string;
    location: string;
    maps_location_url?: string;
    price_min?: number;
    is_free?: boolean;
    external_link?: string;
    whatsapp?: string;
    organizer_email?: string;
    tags?: string[];
    image_url: string | null;
    banner_url: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'delayed';
    is_sponsored: boolean;
    likes_count: number;
    saved_count: number;
    average_rating?: number;
    created_by?: string;
    // Transient UI properties
    isLiked?: boolean;
    isSaved?: boolean;
}

export interface Review {
    id: string;
    event_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    user?: {
        username: string;
        avatar_url: string | null;
    };
}

export const EventService = {
    /**
     * Fetch feed events for the web, performing the optimized LEFT JOIN
     * to detect if the current user has liked or saved the events.
     */
    async getFeedEvents(userId?: string, page = 0, pageSize = 10, type: 'upcoming' | 'past' | 'interests' = 'upcoming', userInterests: string[] = []) {
        try {
            const start = page * pageSize;
            const end = start + pageSize - 1;

            // Base query
            let query = supabase
                .from('events')
                .select(`
                    *,
                    event_likes!left(user_id),
                    saved_events!left(user_id)
                `)
                .in('status', ['approved', 'delayed']);

            if (type === 'past') {
                query = query
                    .lt('date', new Date().toISOString().split('T')[0])
                    .order('date', { ascending: false });
            } else if (type === 'interests' && userInterests && userInterests.length > 0) {
                query = query
                    .gte('date', new Date().toISOString().split('T')[0])
                    .overlaps('tags', userInterests)
                    .order('is_sponsored', { ascending: false })
                    .order('date', { ascending: true });
            } else {
                // Default: upcoming (also if type is interests but no interests found)
                query = query
                    .gte('date', new Date().toISOString().split('T')[0])
                    .order('is_sponsored', { ascending: false })
                    .order('date', { ascending: true });
            }

            const { data: eventsData, error } = await query.range(start, end);

            if (error) throw error;

            const formattedEvents = (eventsData || []).map((event: any) => {
                let isLiked = false;
                let isSaved = false;

                if (userId) {
                    if (event.event_likes?.some((like: any) => like.user_id === userId)) {
                        isLiked = true;
                    }
                    if (event.saved_events?.some((save: any) => save.user_id === userId)) {
                        isSaved = true;
                    }
                }

                // Cleanup payload
                delete event.event_likes;
                delete event.saved_events;

                return {
                    ...event,
                    isLiked,
                    isSaved
                } as FrikiEvent;
            });

            return {
                events: formattedEvents,
                error: null
            };
        } catch (error: any) {
            console.error('EventService.getFeedEvents error:', error);
            return { events: [], error };
        }
    },

    async toggleLikeEvent(userId: string, eventId: string, isCurrentlyLiked: boolean) {
        try {
            if (isCurrentlyLiked) {
                // Remove like
                const { error } = await supabase
                    .from('event_likes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('event_id', eventId);
                if (error) throw error;
            } else {
                // Add like
                const { error } = await supabase
                    .from('event_likes')
                    .insert({ user_id: userId, event_id: eventId });
                if (error) throw error;
            }
            return { error: null };
        } catch (error: any) {
            console.error('toggleLikeEvent error:', error);
            return { error };
        }
    },

    async toggleSaveEvent(userId: string, eventId: string, isCurrentlySaved: boolean) {
        try {
            if (isCurrentlySaved) {
                const { error } = await supabase
                    .from('saved_events')
                    .delete()
                    .eq('user_id', userId)
                    .eq('event_id', eventId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('saved_events')
                    .insert({ user_id: userId, event_id: eventId });
                if (error) throw error;
            }
            return { error: null };
        } catch (error: any) {
            console.error('toggleSaveEvent error:', error);
            return { error };
        }
    },

    async getEventReviews(eventId: string) {
        try {
            const { data, error } = await supabase
                .from('event_reviews')
                .select(`
                    *,
                    user:profiles(username, avatar_url)
                `)
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedReviews = (data || []).map((item: any) => {
                const userData = Array.isArray(item.user) ? item.user[0] : item.user;
                return {
                    ...item,
                    user: userData || { username: 'Usuario', avatar_url: null }
                };
            });

            return { reviews: formattedReviews as Review[], error: null };
        } catch (error: any) {
            console.error('getEventReviews error:', error);
            return { reviews: [], error };
        }
    },

    async submitReview(userId: string, eventId: string, reviewId: string | null, rating: number, comment: string) {
        try {
            if (reviewId) {
                const { error } = await supabase
                    .from('event_reviews')
                    .update({ rating, comment, updated_at: new Date() })
                    .eq('id', reviewId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('event_reviews')
                    .insert({ event_id: eventId, user_id: userId, rating, comment });
                if (error) throw error;
            }
            return { error: null };
        } catch (error: any) {
            console.error('submitReview error:', error);
            return { error };
        }
    },

    async deleteReview(reviewId: string) {
        try {
            const { error } = await supabase
                .from('event_reviews')
                .delete()
                .eq('id', reviewId);
            if (error) throw error;
            return { error: null };
        } catch (error: any) {
            return { error };
        }
    },

    async createEvent(eventData: Partial<FrikiEvent>) {
        try {
            const { error, data } = await supabase
                .from('events')
                .insert([eventData])
                .select()
                .single();
            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('createEvent error:', error);
            return { error, data: null };
        }
    },

    async updateEvent(id: string, eventData: Partial<FrikiEvent>) {
        try {
            const { error, data } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { data, error: null };
        } catch (error: any) {
            console.error('updateEvent error:', error);
            return { error, data: null };
        }
    },

    async getTrendingTopics() {
        try {
            // Fetch some recent thread tags
            const { data: threadTags } = await supabase
                .from('tavern_threads')
                .select('tag')
                .limit(50);

            // Fetch some upcoming event tags
            const { data: eventTags } = await supabase
                .from('events')
                .select('tags')
                .gte('date', new Date().toISOString().split('T')[0])
                .limit(50);

            const counts: Record<string, number> = {};

            threadTags?.forEach(t => {
                if (t.tag) counts[t.tag] = (counts[t.tag] || 0) + 2; // Weight tavern tags
            });

            eventTags?.forEach(e => {
                e.tags?.forEach((tag: string) => {
                    counts[tag] = (counts[tag] || 0) + 1;
                });
            });

            return Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(e => e[0]);
        } catch (error) {
            console.error('getTrendingTopics error:', error);
            return ['Cosplay', 'RPG', 'Marvel', 'Gaming', 'Anime', 'Retro'];
        }
    }
};
