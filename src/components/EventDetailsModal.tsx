import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, ExternalLink, MessageCircle, Heart, Bookmark, Loader2, Star, Edit3, Send } from 'lucide-react';
import { renderTextWithMedia } from '../utils/mediaRenderer';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EventService } from '../services/EventService';
import type { FrikiEvent, Review } from '../services/EventService';
import { useAuth } from '../context/AuthContext';
import { getAvatarSource } from '../config/avatars';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: FrikiEvent | null;
    onSaveToggle?: () => void;
    onLikeToggle?: () => void;
}

export function EventDetailsModal({ isOpen, onClose, event, onSaveToggle, onLikeToggle }: EventDetailsModalProps) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [myReview, setMyReview] = useState('');
    const [myRating, setMyRating] = useState(5);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isPastEvent = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(dateStr);
        return eventDate < today;
    };

    const past = event ? isPastEvent(event.date) : false;

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : null;



    useEffect(() => {
        if (isOpen && event && activeTab === 'reviews') {
            fetchReviews();
        }
    }, [isOpen, event, activeTab]);

    const fetchReviews = async () => {
        if (!event) return;
        setIsLoadingReviews(true);
        const { reviews: fetchedReviews } = await EventService.getEventReviews(event.id);
        setReviews(fetchedReviews);
        setIsLoadingReviews(false);
    };

    const handleReviewSubmit = async () => {
        if (!user || !event || !myReview.trim()) return;
        setIsSubmittingReview(true);

        const existingReview = reviews.find(r => r.user_id === user.id);

        await EventService.submitReview(user.id, event.id, existingReview?.id || null, myRating, myReview);
        setMyReview('');
        setIsEditing(false);
        await fetchReviews();
        setIsSubmittingReview(false);
    };

    const handleEditClick = (review: Review) => {
        setMyReview(review.comment);
        setMyRating(review.rating);
        setIsEditing(true);
    };

    if (!isOpen || !event) return null;

    const formattedDate = event.date ? new Date(event.date).toLocaleDateString(i18n.language === 'es' ? 'es-CO' : 'en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : t('events.noDate', 'Fecha TBD');

    const defaultImage = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm shadow-2xl"
            onClick={onClose}
        >
            <div
                className="bg-bg-side w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border-theme shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header Image Area */}
                <div className="relative h-48 md:h-64 flex-shrink-0">
                    <img
                        src={event.banner_url || event.image_url || defaultImage}
                        alt={event.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                        <div className="flex gap-2 mb-2">
                            {event.is_sponsored && (
                                <span className="bg-brand-secondary text-text-inv text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-lg">{t('events.sponsored', 'Patrocinado')}</span>
                            )}
                            <span className="bg-brand-primary text-text-inv text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow-lg">{event.is_free ? t('events.free', 'Gratis') : t('events.paid', 'De Pago')}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-1">{event.title}</h2>
                        <div className="flex items-center gap-3 text-white/80 text-sm">
                            <div className="flex items-center">
                                <MapPin size={16} className="mr-1" />
                                {event.location}
                            </div>
                            {averageRating && (
                                <div className="flex items-center bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full text-yellow-400 font-bold border border-yellow-400/20">
                                    <Star size={14} fill="currentColor" className="mr-1" />
                                    {averageRating}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-divider-theme">
                    <button
                        className={`flex-1 py-4 font-bold text-sm text-center border-b-2 transition ${activeTab === 'details' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
                        onClick={() => setActiveTab('details')}
                    >
                        {t('eventDetails.details')}
                    </button>
                    <button
                        className={`flex-1 py-4 font-bold text-sm text-center border-b-2 transition ${activeTab === 'reviews' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        {t('eventDetails.reviews.tab')} ({reviews.length || 0})
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'details' ? (
                        <div className="space-y-6">
                            {/* Action Bar */}
                            <div className="flex justify-between items-center bg-bg-sub/30 p-4 rounded-xl border border-divider-theme">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-[10px] text-text-muted uppercase font-black tracking-widest">{t('events.date')}</div>
                                        <div className="font-bold text-text-main capitalize text-sm">{formattedDate}</div>
                                    </div>
                                    <div className="w-px h-8 bg-divider-theme"></div>
                                    <div className="text-center">
                                        <div className="text-[10px] text-text-muted uppercase font-black tracking-widest">{t('events.startTime')}</div>
                                        <div className="font-bold text-text-main text-sm">{event.start_time || t('common.tbd', 'TBD')}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={onLikeToggle} className={`p-2 rounded-full border transition ${event.isLiked ? 'border-brand-primary bg-brand-primary/10' : 'border-divider-theme hover:bg-bg-sub'}`}>
                                        <Heart size={20} className={event.isLiked ? 'text-brand-primary' : 'text-text-muted'} fill={event.isLiked ? 'currentColor' : 'none'} />
                                    </button>
                                    <button onClick={onSaveToggle} className={`p-2 rounded-full border transition ${event.isSaved ? 'border-brand-secondary bg-brand-secondary/10' : 'border-divider-theme hover:bg-bg-sub'}`}>
                                        <Bookmark size={20} className={event.isSaved ? 'text-brand-secondary' : 'text-text-muted'} fill={event.isSaved ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-bold text-text-main mb-2">{t('events.about', 'Acerca del Evento')}</h3>
                                <div className="text-text-sub leading-relaxed whitespace-pre-line text-sm">
                                    {renderTextWithMedia(event.description || t('events.noDescription', 'Sin descripción.'))}
                                </div>
                            </div>

                            {/* Tags */}
                            {event.tags && event.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {event.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-bg-sub border border-divider-theme text-text-sub text-[10px] font-bold uppercase tracking-widest rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Links */}
                            <div className="flex flex-col gap-3 py-4 border-t border-divider-theme">
                                {event.maps_location_url && (
                                    <a href={event.maps_location_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-brand-primary hover:underline font-bold text-sm">
                                        <ExternalLink size={18} className="mr-2" /> {t('events.viewOnMaps')}
                                    </a>
                                )}
                                {event.whatsapp && (
                                    <a href={`https://wa.me/${event.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-accent-green hover:underline font-bold text-sm">
                                        <MessageCircle size={18} className="mr-2" /> {t('events.contactWhatsApp')}
                                    </a>
                                )}
                                {event.external_link && (
                                    <a href={event.external_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-text-muted hover:text-text-main hover:underline font-bold text-sm">
                                        <ExternalLink size={18} className="mr-2" /> {t('events.officialWebsite')}
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Write Review Form */}
                            {user ? (
                                past ? (
                                    (!reviews.find(r => r.user_id === user.id) || isEditing) ? (
                                        <div className="bg-bg-sub/50 p-5 rounded-xl border border-divider-theme shadow-inner">
                                            <h4 className="font-bold text-text-main mb-3 flex items-center gap-2">
                                                {isEditing ? <Edit3 size={18} /> : <MessageCircle size={18} />}
                                                {isEditing ? t('eventDetails.reviews.edit') : t('eventDetails.reviews.share')}
                                            </h4>
                                            <div className="flex gap-1.5 mb-4">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setMyRating(star)}
                                                        className={`transition-all duration-200 transform hover:scale-125 ${star <= myRating ? "text-yellow-400" : "text-slate-300 hover:text-yellow-200"}`}
                                                    >
                                                        <Star size={28} fill={star <= myRating ? "currentColor" : "none"} strokeWidth={2} />
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={myReview}
                                                onChange={(e) => setMyReview(e.target.value)}
                                                placeholder={t('eventDetails.reviews.placeholder')}
                                                className="w-full bg-bg-main border border-divider-theme rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none resize-none h-32 mb-4 transition-all text-text-main"
                                            />
                                            <div className="flex gap-3">
                                                {isEditing && (
                                                    <button
                                                        onClick={() => {
                                                            setIsEditing(false);
                                                            setMyReview('');
                                                        }}
                                                        className="flex-1 bg-bg-sub text-text-main font-bold py-2.5 rounded-xl transition hover:bg-divider-theme"
                                                    >
                                                        {t('common.cancel')}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleReviewSubmit}
                                                    disabled={isSubmittingReview || !myReview.trim()}
                                                    className="flex-[2] bg-brand-primary hover:bg-brand-primary-light disabled:opacity-50 text-text-inv font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20"
                                                >
                                                    {isSubmittingReview ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                                    {isEditing ? t('eventDetails.reviews.update') : t('common.publish')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-accent-green/10 border border-accent-green/20 p-4 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-accent-green text-white p-2 rounded-full">
                                                    <Star size={20} fill="currentColor" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-accent-green">{t('eventDetails.reviews.alreadySubmitted')}</p>
                                                    <p className="text-xs text-text-sub">{t('eventDetails.reviews.thanks')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleEditClick(reviews.find(r => r.user_id === user.id)!)}
                                                className="text-brand-primary text-sm font-bold hover:underline"
                                            >
                                                {t('eventDetails.reviews.edit')}
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center p-6 bg-bg-sub rounded-xl border border-divider-theme">
                                        <Calendar className="mx-auto text-brand-secondary mb-2" size={32} />
                                        <h4 className="font-bold text-text-main">{t('eventDetails.reviews.wantToReview')}</h4>
                                        <p className="text-xs text-text-sub">{t('eventDetails.reviews.waitToReview')}</p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center p-6 bg-bg-sub rounded-xl border border-border-theme shadow-sm">
                                    <p className="text-text-sub text-sm mb-4 font-medium">{t('eventDetails.reviews.loginToReview')}</p>
                                    <Link to="/login" className="inline-block bg-brand-primary text-text-inv px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition shadow-lg shadow-brand-primary/20">{t('auth.signIn')} / {t('auth.signUp')}</Link>
                                </div>
                            )}

                            {/* Reviews List */}
                            {isLoadingReviews ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center text-text-muted py-8 text-sm italic">{t('eventDetails.reviews.noReviews')}</div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map(review => (
                                        <div key={review.id} className="border-b border-divider-theme pb-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <img
                                                    src={getAvatarSource(review.user?.avatar_url || null)}
                                                    alt="Avatar"
                                                    className="w-10 h-10 rounded-full border border-divider-theme bg-bg-sub"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-bold text-text-main text-sm">{review.user?.username}</div>
                                                        <div className="text-[10px] text-text-muted uppercase tracking-tighter">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-0.5 text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                fill={i < review.rating ? "currentColor" : "none"}
                                                                className={i >= review.rating ? "text-slate-300" : ""}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-text-sub text-sm leading-relaxed bg-bg-main/30 p-3 rounded-xl border border-divider-theme/50">
                                                {renderTextWithMedia(review.comment)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
