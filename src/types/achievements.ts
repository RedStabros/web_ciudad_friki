export interface Achievement {
  id: string;
  name_es: string;
  description_es: string;
  name_en: string;
  description_en: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'special';
  icon_url: string;
  required_metric: string;
  required_value: number;
  reward_amount: number;
  is_active: boolean;
  is_secret: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface UserStats {
  user_id: string;
  trivia_classic_played: number;
  trivia_classic_perfect: number;
  trivia_duels_played: number;
  trivia_duels_won: number;
  threads_count: number;
  replies_count: number;
  likes_given_count: number;
  likes_received_count: number;
  events_created_count: number;
  surveys_answered_count: number;
  reward_events_attended_count: number;
  login_streak: number;
  current_login_streak: number;
  max_login_streak: number;
  frikimart_purchases_count: number;
  [key: string]: number | string | any;
}
