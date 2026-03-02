import { useTranslation } from 'react-i18next';
import { Calendar, Bookmark, Heart, Share2 } from 'lucide-react';
import type { FrikiEvent } from '../services/EventService';
import { getAvatarSource } from '../config/avatars';
import { renderTextWithMedia } from '../utils/mediaRenderer';

interface EventCardProps {
    event: FrikiEvent;
    onInterested?: () => void;
    onLike?: () => void;
    onSave?: () => void;
    onClick?: () => void;
}

export function EventCard({ event, onInterested, onLike, onSave, onClick }: EventCardProps) {
    const { t, i18n } = useTranslation();
    const defaultImage = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop";

    // Fallback simple parsing for display
    const formattedDate = event.date ? new Date(event.date).toLocaleDateString(i18n.language === 'es' ? 'es-CO' : 'en-US') : t('events.noDate', 'TBD');

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/events?id=${event.id}`;
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: event.description || event.location,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            alert(t('common.copied', 'Enlace copiado al portapapeles'));
        }
    };

    return (
        <div className={`bg-bg-side rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition duration-300 ${event.is_sponsored ? 'border-brand-secondary ring-1 ring-brand-secondary/20' : 'border-border-theme'}`}>
            <div className="relative h-64 w-full">
                <img
                    alt={event.title}
                    className="w-full h-full object-cover"
                    src={event.image_url || event.banner_url || defaultImage}
                />
                {event.is_sponsored && (
                    <div className="absolute top-4 right-4 bg-brand-secondary text-text-inv text-[10px] font-black px-3 py-1 rounded-full flex items-center uppercase tracking-widest shadow-lg">
                        ★ {t('events.sponsored', 'Patrocinado')}
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div className="cursor-pointer flex-1 pr-4" onClick={onClick}>
                        <div className="flex items-center text-text-muted text-sm mb-1">
                            <Calendar className="text-base mr-1.5" size={16} />
                            {formattedDate} • {event.start_time || 'TBD'}
                        </div>
                        <h3 className="text-2xl font-bold text-text-main mb-2">{event.title}</h3>
                        <div className="flex items-center text-text-muted text-xs mb-2">
                            <span className="truncate">{event.location}</span>
                        </div>
                        {event.description && (
                            <div className="text-text-sub text-sm line-clamp-2 mb-2">
                                {renderTextWithMedia(event.description)}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-3 pt-1">
                        <button
                            onClick={onSave}
                            className={`transition ${event.isSaved ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                            aria-label="Guardar evento"
                        >
                            <Bookmark size={28} fill={event.isSaved ? "currentColor" : "none"} />
                        </button>
                        <button
                            onClick={onLike}
                            className={`flex items-center font-medium gap-1 transition ${event.isLiked ? 'text-accent-red' : 'text-text-muted hover:text-accent-red'}`}
                            aria-label="Me gusta"
                        >
                            <Heart size={20} fill={event.isLiked ? "currentColor" : "none"} />
                            <span className="text-sm">{event.likes_count || 0}</span>
                        </button>
                        <button
                            onClick={handleShare}
                            className="text-text-muted hover:text-brand-primary transition"
                            aria-label="Compartir evento"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-divider-theme flex justify-between items-center">
                    <div className="flex -space-x-2 overflow-hidden">
                        {/* Static sample avatars for the attendees UI, to be replaced by actual relations later if needed */}
                        <img alt="Atendee A" className="inline-block h-8 w-8 rounded-full ring-2 ring-bg-side bg-bg-sub shadow-sm" src={getAvatarSource('dragon_05')} />
                        <img alt="Atendee B" className="inline-block h-8 w-8 rounded-full ring-2 ring-bg-side bg-bg-sub shadow-sm" src={getAvatarSource('dragon_02')} />
                        <img alt="Atendee C" className="inline-block h-8 w-8 rounded-full ring-2 ring-bg-side bg-bg-sub shadow-sm" src={getAvatarSource('dragon_15')} />
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-bg-side bg-bg-sub text-xs font-medium text-text-muted">
                            +{event.saved_count || 0}
                        </span>
                    </div>
                    <button
                        onClick={onInterested}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-xl shadow-sm text-text-inv bg-brand-primary hover:bg-brand-primary-light focus:outline-none transition shadow-lg shadow-brand-primary/20"
                    >
                        {t('common.interested', 'Me Interesa')}
                    </button>
                </div>
            </div>
        </div>
    );
}
