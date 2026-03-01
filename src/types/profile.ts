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
}

export interface WalletData {
    balance: number;
    deposit_qr?: string;
}
