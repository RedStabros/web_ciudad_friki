export type ThreadCategory = 'Todas' | 'Anime/Manga' | 'Gaming/Tech' | 'Cultura/Arte' | 'Eventos' | 'Off-topic';

export interface TavernThread {
    id: string;
    author_id: string;
    tag: string; // The column name in DB is 'tag'
    category?: ThreadCategory; // Derived/mapped category
    title: string;
    content: string;
    image_url?: string;
    video_url?: string;
    video_platform?: string;
    likes_count: number;
    dislikes_count: number;
    report_count: number;
    is_hidden: boolean;
    admin_reviewed: boolean;
    created_at: string;
    updated_at: string;
    is_edited?: boolean;
    edited_by_admin?: boolean;
    is_pinned?: boolean;
    deleted_at?: string | null;
    is_locked?: boolean;
    is_archived?: boolean;

    // Joined data from profiles
    profiles?: {
        username: string;
        avatar_url: string | null;
        role: string;
    };

    // Derived/Flattened properties for easier consumption
    author_username?: string;
    author_avatar_url?: string;
    author_role?: string;

    // UI states
    user_vote?: 'like' | 'dislike' | null;
    reply_count?: number;
}

export interface TavernReply {
    id: string;
    thread_id: string;
    author_id: string;
    content: string;
    likes_count: number;
    dislikes_count: number;
    report_count: number;
    is_hidden: boolean;
    admin_reviewed: boolean;
    created_at: string;
    updated_at: string;
    is_edited?: boolean;
    edited_by_admin?: boolean;
    deleted_at?: string | null;

    // Joined data from profiles
    profiles?: {
        username: string;
        avatar_url: string | null;
        role: string;
    };

    author_username?: string;
    author_avatar_url?: string;
    author_role?: string;

    // UI states
    user_vote?: 'like' | 'dislike' | null;
}
