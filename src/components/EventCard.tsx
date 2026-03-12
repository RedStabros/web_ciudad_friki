import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Calendar, Bookmark, Heart, Share2, Check } from 'lucide-react';
import type { FrikiEvent } from '../services/EventService';
import { getAvatarSource } from '../config/avatars';
import { renderTextWithMedia } from '../utils/mediaRenderer';
import { shareContent, registerCopiedCallback } from '../utils/shareContent';
import { toPng } from 'html-to-image';
import { Loader2 } from 'lucide-react';
import { useRef } from 'react';

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

    const [copied, setCopied] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const shareEventTicket = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!cardRef.current || isSharing) return;
        setIsSharing(true);
        const el = cardRef.current;

        const computedStyle = window.getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--bg-primary').trim() || '#1e222a';
        const brandColor = computedStyle.getPropertyValue('--brand-primary').trim() || '#e1192f';

        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
            .share-hide { display: none !important; }
            .ticket-capture { 
                padding: 40px !important; 
                background: ${bgColor} !important; 
                border: 4px dashed ${brandColor}50 !important;
                border-radius: 40px !important; 
                width: 500px !important;
                position: relative !important;
                display: block !important;
            }
            .ticket-capture .share-hide-el { display: none !important; }
            .ticket-capture .ticket-likes { 
                background: ${brandColor}15 !important;
                padding: 8px 12px !important;
                border-radius: 12px !important;
                border: 1px solid ${brandColor}30 !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                color: ${brandColor} !important;
                margin-top: 10px !important;
            }
            .ticket-img { height: 280px !important; width: 100% !important; border-radius: 20px !important; object-fit: cover !important; margin-bottom: 20px !important; }
            .ticket-capture h3 { font-size: 32px !important; margin-top: 5px !important; }
            .ticket-capture .ticket-date { 
                background: ${brandColor}10 !important;
                color: ${brandColor} !important;
                padding: 6px 12px !important;
                border-radius: 8px !important;
                font-weight: 800 !important;
                font-size: 14px !important;
                margin-bottom: 12px !important;
                display: inline-flex !important;
            }
        `;
        document.head.appendChild(tempStyle);

        const hideElements = el.querySelectorAll('.share-hide-el');
        el.classList.add('ticket-capture');
        const img = el.querySelector('img');
        if (img) img.classList.add('ticket-img');

        try {
            // Give it a tiny bit of time to apply classes
            await new Promise(r => setTimeout(r, 200));

            const options = {
                backgroundColor: bgColor,
                pixelRatio: 2,
                width: 500,
                cacheBust: true
            };

            let dataUrl;
            try {
                dataUrl = await toPng(el, options);
            } catch (err) {
                console.warn('Event ticket capture failed, retrying without image...', err);
                dataUrl = await toPng(el, {
                    ...options,
                    filter: (node: any) => node.tagName !== 'IMG'
                });
            }

            const resp = await fetch(dataUrl);
            const blob = await resp.blob();

            if (blob) {
                const file = new File([blob], `evento-${event.title.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
                
                const dateStr = event.date
                    ? new Date(event.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
                    : '';
                
                await shareContent({
                    title: `🎫 ${event.title} - Ciudad Friki`,
                    text: `🔥 *${event.title}*\n¡No te pierdas este evento en Ciudad Friki!\n\n📅 ${dateStr}\n📍 ${event.location || 'Consultar app'}\n\n¡Consigue toda tu info aquí! 👇`,
                    url: window.location.origin + `/events?id=${event.id}`,
                    file
                });
            }
        } catch (error) {
            console.error('Final event share error:', error);
            // Fallback to basic share
            shareContent({
                title: event.title,
                text: `🔥 *${event.title}*\nConsigue toda tu info en Ciudad Friki 👇`,
                url: window.location.origin + `/events?id=${event.id}`
            });
        } finally {
            el.classList.remove('ticket-capture');
            if (img) img.classList.remove('ticket-img');
            document.head.removeChild(tempStyle);
            setIsSharing(false);
        }
    };

    return (
        <div ref={cardRef} className={`bg-bg-side rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition duration-300 ${event.is_sponsored ? 'border-brand-secondary ring-1 ring-brand-secondary/20' : 'border-border-theme'}`}>
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
                        <div className="ticket-date flex items-center text-text-muted text-sm mb-1">
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
                            className={`share-hide-el transition ${event.isSaved ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                            aria-label="Guardar evento"
                        >
                            <Bookmark size={28} fill={event.isSaved ? "currentColor" : "none"} />
                        </button>
                        <div className="ticket-likes flex items-center font-medium gap-1 transition text-accent-red">
                            <Heart size={20} fill="currentColor" />
                            <span className="text-sm font-black">{event.likes_count || 0}</span>
                        </div>
                        <button
                            onClick={shareEventTicket}
                            disabled={isSharing}
                            className={`share-hide-el transition ${isSharing ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                            aria-label="Compartir evento"
                            title={t('common.share', 'Compartir')}
                        >
                            {isSharing ? <Loader2 size={24} className="animate-spin" /> : <Share2 size={24} />}
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
