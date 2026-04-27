export interface NotificationPreferences {
    push_enabled: boolean;
    in_app_enabled: boolean;
    events_by_interests: boolean;
    event_updates: boolean;
    wallet_received: boolean;
    wallet_sent: boolean;
    surveys: boolean;
    admin: boolean;
}

export interface ProfileData {
    username: string;
    full_name: string;
    email: string;
    bio: string;
    phone: string;
    city: string;
    country: string;
    neighborhood: string;
    interests: string[];
    avatar_url: string | null;
    website: string;
    role: 'user' | 'worker' | 'tecnico' | 'admin';
    is_banned?: boolean;
    ban_until?: string | null;
    ban_reason?: string | null;
    is_shadow_banned?: boolean;
    notification_preferences?: NotificationPreferences;
}

export interface WalletData {
    balance: number;
    deposit_qr?: string;
}
