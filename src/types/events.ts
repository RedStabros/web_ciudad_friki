export interface FrikiEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  end_date?: string | null;
  start_time?: string;
  end_time?: string | null;
  location?: string;
  maps_location_url?: string;
  banner_url?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'delayed';
  price_min?: number | null;
  external_link?: string;
  whatsapp?: string;
  organizer_email?: string;
  tags?: string[];
  is_sponsored?: boolean;
  likes_count?: number;
  saved_count?: number;
  views_count?: number;
  rejection_reason?: string | null;
  qr_requested?: boolean;
  qr_approved?: boolean;
  qr_reward_amount?: number;
  parent_event_id?: string | null;
  edition_number?: number | null;
}
