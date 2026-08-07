import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Calendar, Bookmark, Heart, Share2, MapPin, Loader2 } from 'lucide-react';
import type { FrikiEvent } from '../services/EventService';
import { getAvatarSource } from '../config/avatars';
import { renderTextWithMedia } from '../utils/mediaRenderer';
import { shareContent } from '../utils/shareContent';
import { toPng } from 'html-to-image';
import { useRef } from 'react';

interface EventCardProps {
    event: FrikiEvent;
    onInterested?: () => void;
    onLike?: () => void;
    onSave?: () => void;
    onClick?: () => void;
    isCompact?: boolean;
}

export function EventCard({ event, onInterested, onSave, onLike, onClick, isCompact = false }: EventCardProps) {
    const { t, i18n } = useTranslation();
    const defaultImage = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop";

    // Format dates to remove years (if current year) and format time without seconds
    const locale = i18n.language === 'es' ? 'es-CO' : 'en-US';
    let formattedDate = t('events.noDate');
    if (event.date) {
        const d = new Date(event.date + 'T00:00:00');
        const curYear = new Date().getFullYear();
        if (d.getFullYear() === curYear) {
            formattedDate = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
        } else {
            formattedDate = d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
        }
    }

    const formatTimeWithoutSeconds = (timeStr: string | null | undefined) => {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
        return timeStr;
    };

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
            .ticket-capture::before {
                content: '${t('share.events.ticketHeader')}';
                position: absolute;
                top: 15px;
                right: 25px;
                font-size: 10px;
                font-weight: 900;
                color: ${brandColor}40;
                letter-spacing: 2px;
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
                    text: `🔥 *${event.title}*\n${t('share.events.dontMiss')}\n\n📅 ${dateStr}\n📍 ${event.location || t('share.events.checkApp')}\n\n${t('share.events.getInfo')}`,
                    url: window.location.origin + `/events?id=${event.id}`,
                    file
                });
            }
        } catch (error) {
            console.error('Final event share error:', error);
            // Fallback to basic share
            shareContent({
                title: event.title,
                text: `🔥 *${event.title}*\n${t('share.events.getInfo')}`,
                url: window.location.origin + `/events?id=${event.id}`
            });
        } finally {
            el.classList.remove('ticket-capture');
            if (img) img.classList.remove('ticket-img');
            document.head.removeChild(tempStyle);
            setIsSharing(false);
        }
    };

    if (isCompact) {
        return (
            <div 
                ref={cardRef} 
                className={`bg-bg-side rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition duration-300 flex items-center p-3 gap-4 cursor-pointer relative ${event.is_sponsored ? 'border-brand-secondary ring-1 ring-brand-secondary/20' : 'border-border-theme'}`}
                onClick={onClick}
            >
                {/* Left side: Small Image */}
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-bg-sub">
                    <img
                        alt={event.title}
                        className="w-full h-full object-cover"
                        src={event.image_url || event.banner_url || defaultImage}
                    />
                    {event.is_sponsored && (
                        <div className="absolute top-1 left-1 bg-brand-secondary text-text-inv text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-sm">
                            ★
                        </div>
                    )}
                </div>

                {/* Right side: Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    {/* Header: Date & Actions */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                            <span className="flex items-center font-semibold">
                                <Calendar className="mr-1 flex-shrink-0" size={12} />
                                {formattedDate} {event.start_time && `• ${formatTimeWithoutSeconds(event.start_time)}`}
                            </span>

                            {event.is_sponsored && (
                                <span className="bg-brand-secondary/10 text-brand-secondary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {t('events.sponsored')}
                                </span>
                            )}
                            
                            {event.qr_approved && (
                                <span className="bg-amber-400/10 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                    🎫 +{event.qr_reward_amount || 0} FC
                                </span>
                            )}
                            
                            {event.edition_number && event.edition_number > 1 && (
                                <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Ed. {event.edition_number}
                                </span>
                            )}
                            
                            {event.status && event.status !== 'approved' && (
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    event.status === 'cancelled' 
                                        ? 'bg-accent-red/10 text-accent-red' 
                                        : 'bg-brand-secondary/10 text-brand-secondary'
                                }`}>
                                    {t(`events.status.${event.status}`)}
                                </span>
                            )}
                        </div>

                        {/* Top right actions */}
                        <div className="flex items-center gap-2.5 share-hide-el">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSave?.();
                                }}
                                className={`transition ${event.isSaved ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                                aria-label="Guardar evento"
                            >
                                <Bookmark size={18} fill={event.isSaved ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onLike?.();
                                }}
                                className={`ticket-likes flex items-center font-medium gap-1 transition px-1.5 py-0.5 rounded-md ${event.isLiked ? 'text-accent-red bg-accent-red/10' : 'text-text-muted hover:text-accent-red hover:bg-accent-red/5'}`}
                                aria-label="Dar me gusta"
                            >
                                <Heart size={14} fill={event.isLiked ? "currentColor" : "none"} />
                                <span className="text-[11px] font-black">{event.likes_count || 0}</span>
                            </button>
                            <button
                                onClick={shareEventTicket}
                                disabled={isSharing}
                                className={`transition ${isSharing ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                                aria-label="Compartir evento"
                                title={t('common.share')}
                            >
                                {isSharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Middle: Title */}
                    <h3 className="text-sm sm:text-base font-bold text-text-main leading-tight mb-2 line-clamp-1 hover:text-brand-primary transition-colors duration-200">
                        {event.title}
                    </h3>

                    {/* Bottom: Location & Price */}
                    <div className="flex items-center justify-between text-xs text-text-muted gap-2 mt-auto">
                        <div className="flex items-center min-w-0">
                            <MapPin className="text-brand-primary mr-1 flex-shrink-0" size={14} />
                            <span className="truncate">{event.location}</span>
                        </div>
                        
                        <div className="flex-shrink-0 font-bold">
                            {event.price_min && event.price_min > 0 ? (
                                <span className="text-brand-secondary">
                                    Desde ${event.price_min.toLocaleString()}
                                </span>
                            ) : (
                                <span className="text-accent-green">{t('common.free', 'Gratis')}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        ★ {t('events.sponsored')}
                    </div>
                )}
                {event.qr_approved && (
                    <div className="absolute bottom-4 left-4 bg-amber-400 text-black text-[10px] font-black px-3 py-1 rounded-full flex items-center uppercase tracking-widest shadow-lg z-10 animate-pulse">
                        🎁 +{event.qr_reward_amount || 0} FC
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div className="cursor-pointer flex-1 pr-4" onClick={onClick}>
                        <div className="ticket-date flex items-center text-text-muted text-sm mb-1 gap-2 flex-wrap">
                            <span className="flex items-center">
                                <Calendar className="text-base mr-1.5" size={16} />
                                {formattedDate} • {formatTimeWithoutSeconds(event.start_time) || 'TBD'}
                            </span>
                            {event.edition_number && event.edition_number > 1 && (
                                <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Edición {event.edition_number}
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-text-main mb-2">{event.title}</h3>
                        <div className="flex items-center text-text-muted text-xs mb-2">
                            <span className="truncate">{event.location}</span>
                        </div>
                        {event.description && (
                            <div className="text-text-sub text-sm line-clamp-2 mb-2">
                                {renderTextWithMedia(event.description, t)}
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
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLike?.();
                            }}
                            className={`ticket-likes flex items-center font-medium gap-1 transition px-2 py-1 rounded-lg ${event.isLiked ? 'text-accent-red bg-accent-red/10' : 'text-text-muted hover:text-accent-red hover:bg-accent-red/5'}`}
                            aria-label="Dar me gusta"
                        >
                            <Heart size={20} fill={event.isLiked ? "currentColor" : "none"} />
                            <span className="text-sm font-black">{event.likes_count || 0}</span>
                        </button>
                        <button
                            onClick={shareEventTicket}
                            disabled={isSharing}
                            className={`share-hide-el transition ${isSharing ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                            aria-label="Compartir evento"
                            title={t('common.share')}
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
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onInterested) onInterested();
                        }}
                        className={
                            event.isSaved
                                ? "inline-flex items-center gap-1.5 px-4 py-2 border-2 border-brand-primary/30 text-sm font-bold rounded-xl text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 transition"
                                : "inline-flex items-center px-4 py-2 border shadow-lg border-transparent text-sm font-bold rounded-xl text-text-inv bg-brand-primary hover:bg-brand-primary-light transition shadow-brand-primary/20"
                        }
                    >
                        {event.isSaved ? (
                            <>
                                <Bookmark size={16} fill="currentColor" /> {t('common.saved', 'Guardado')}
                            </>
                        ) : (
                            t('common.interested')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
