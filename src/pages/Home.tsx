import { Link } from 'react-router-dom';
import { Home as HomeIcon, MessageSquare, Calendar, PieChart, HelpCircle, PlusCircle, Loader2, ChevronRight } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { CreateEventModal } from '../components/CreateEventModal';
import { EventService } from '../services/EventService';
import type { FrikiEvent } from '../services/EventService';
import { useTranslation } from 'react-i18next';
import { useProfile } from '../hooks/useProfile';
import type { EventFeedType } from '../hooks/useEvents';
import { useEffect } from 'react';

export default function Home() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);

    // Dashboard filter state
    const [feedType, setFeedType] = useState<EventFeedType>('upcoming');
    const { events, isLoading, error, refetch } = useEvents(user?.id, feedType, profile?.interests || []);

    const [trendingTopics, setTrendingTopics] = useState<string[]>([]);

    useEffect(() => {
        const loadTrends = async () => {
            const trends = await EventService.getTrendingTopics();
            setTrendingTopics(trends);
        };
        loadTrends();
    }, []);

    // Modal state
    const [selectedEvent, setSelectedEvent] = useState<FrikiEvent | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleEventClick = (event: FrikiEvent) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };

    const handleLikeToggle = async (event: FrikiEvent) => {
        if (!user) return alert(t('common.loginRequired', 'Debes iniciar sesión para dar me gusta'));

        // Optimistic update in UI requires lifting state, but for simplicity we rely on the DB and a refetch
        // or local state mutator. We'll dispatch to DB and refetch fast.
        const wasLiked = event.isLiked || false;
        await EventService.toggleLikeEvent(user.id, event.id, wasLiked);
        refetch();
        if (selectedEvent?.id === event.id) {
            setSelectedEvent(prev => prev ? { ...prev, isLiked: !wasLiked, likes_count: prev.likes_count + (wasLiked ? -1 : 1) } : null);
        }
    };

    const handleSaveToggle = async (event: FrikiEvent) => {
        if (!user) return alert(t('common.loginRequired', 'Debes iniciar sesión para guardar eventos'));

        const wasSaved = event.isSaved || false;
        await EventService.toggleSaveEvent(user.id, event.id, wasSaved);
        refetch();
        if (selectedEvent?.id === event.id) {
            setSelectedEvent(prev => prev ? { ...prev, isSaved: !wasSaved, saved_count: prev.saved_count + (wasSaved ? -1 : 1) } : null);
        }
    };

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT SIDEBAR (Navigation) */}
            <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-6">
                <nav className="space-y-1">
                    <Link to="/" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md bg-brand-primary/10 text-brand-primary transition-colors">
                        <HomeIcon className="mr-3 text-xl" size={20} />
                        {t('nav.home')}
                    </Link>
                    <Link to="/tavern" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <MessageSquare className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('nav.tavern')}
                    </Link>
                    <Link to="/events" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <Calendar className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('dashboard.eventsTab')}
                    </Link>
                    <Link to="/surveys" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <PieChart className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('nav.surveys')} <span className="ml-auto bg-brand-primary text-text-inv py-0.5 px-2 rounded-full text-xs">3</span>
                    </Link>
                    <Link to="/trivias" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <HelpCircle className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('nav.trivias')}
                    </Link>
                </nav>

                <div className="border-t border-divider-theme my-4"></div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-text-inv bg-brand-primary hover:bg-brand-primary-light focus:outline-none transition shadow-lg shadow-brand-primary/20"
                >
                    <PlusCircle className="mr-2" size={20} />
                    {t('events.publish', 'Publicar Evento')}
                </button>
            </aside>

            {/* MAIN CONTENT (Events Feed) */}
            <main className="lg:col-span-9 xl:col-span-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-text-main capitalize">
                        {feedType === 'upcoming'
                            ? t('events.upcomingTitle', 'Próximos Eventos')
                            : feedType === 'interests'
                                ? t('profile.interests', 'Mis Intereses')
                                : t('events.pastTitle', 'Eventos Pasados')}
                    </h2>
                    <div className="flex bg-bg-side p-1 rounded-xl border border-border-theme">
                        <button
                            onClick={() => setFeedType('upcoming')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${feedType === 'upcoming' ? 'bg-brand-primary text-text-inv shadow-md' : 'text-text-muted hover:text-text-main'}`}
                        >
                            {t('dashboard.filter.all')}
                        </button>
                        <button
                            onClick={() => setFeedType('interests')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${feedType === 'interests' ? 'bg-brand-primary text-text-inv shadow-md' : 'text-text-muted hover:text-text-main'}`}
                        >
                            {t('dashboard.filter.interests')}
                        </button>
                        <button
                            onClick={() => setFeedType('past')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${feedType === 'past' ? 'bg-brand-primary text-text-inv shadow-md' : 'text-text-muted hover:text-text-main'}`}
                        >
                            {t('common.past', 'Pasados')}
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-brand-primary" size={32} />
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-red-500">
                        Error al cargar los eventos. Verifica tu conexión.
                    </div>
                ) : events.length === 0 ? (
                    <div className="bg-bg-side border border-border-theme p-12 rounded-xl text-center">
                        <Calendar className="mx-auto text-text-muted mb-4 opacity-20" size={60} />
                        <h3 className="text-text-main font-bold text-lg">{t('common.noResults')}</h3>
                        <p className="text-text-sub text-sm mt-1">
                            {feedType === 'interests'
                                ? t('dashboard.emptyEventsInterests', 'No pudimos encontrar eventos que coincidan con tus intereses específicos aún.')
                                : t('dashboard.emptyEvents', 'No hay eventos programados en esta categoría por ahora.')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onClick={() => handleEventClick(event)}
                                onLike={() => handleLikeToggle(event)}
                                onSave={() => handleSaveToggle(event)}
                                onInterested={() => handleSaveToggle(event)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* RIGHT SIDEBAR (Wallet & Trends) */}
            <aside className="hidden xl:block xl:col-span-3 space-y-6">

                <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden relative">
                    <div className="h-1 bg-gradient-to-r from-brand-primary to-brand-secondary w-full"></div>
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">{t('profile.wallet')}</h3>

                        <div className="bg-white p-2 rounded-lg mx-auto w-40 h-40 shadow-inner mb-4 flex items-center justify-center border-2 border-dashed border-border-theme">
                            {/* QR Code Placeholder */}
                            <img alt="Wallet QR" className="w-full h-full opacity-90 object-contain mix-blend-multiply" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=FRIKI:QR_9c8297f2-fc66-43d2" />
                        </div>

                        <div className="text-center mb-6">
                            <p className="text-xs text-text-muted mb-1 font-mono break-all">FRIKI:QR_9c8297f2-fc66-43d2...</p>
                        </div>

                        <div className="bg-bg-sub rounded-lg p-4 text-center">
                            <p className="text-xs text-text-sub mb-1">{t('profile.balanceLabel')}</p>
                            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-brand-secondary">
                                86.892
                            </div>
                        </div>
                    </div>

                    <div className="bg-bg-sub/50 px-6 py-3 border-t border-border-theme flex justify-between items-center">
                        <span className="text-xs text-text-muted">{t('wallet.balanceOverview', 'Balance Total')}</span>
                        <Link to="/wallet" className="text-sm font-medium text-brand-primary hover:text-brand-primary-light flex items-center transition-colors">
                            {t('profile.wallet')} <ChevronRight size={16} className="ml-1" />
                        </Link>
                    </div>
                </div>

                <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme p-5">
                    <h3 className="text-sm font-semibold text-text-main mb-4">{t('profile.interests')} & {t('common.trends', 'Tendencias')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {trendingTopics.length > 0 ? trendingTopics.map(topic => (
                            <span
                                key={topic}
                                className="px-3 py-1.5 bg-bg-sub border border-divider-theme text-text-sub text-xs rounded-full hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 cursor-pointer transition-all font-medium"
                            >
                                #{topic}
                            </span>
                        )) : (
                            <p className="text-xs text-text-muted">{t('common.loading')}</p>
                        )}
                    </div>
                </div>

            </aside>

            {/* Modals */}
            <EventDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                event={selectedEvent}
                onLikeToggle={() => selectedEvent && handleLikeToggle(selectedEvent)}
                onSaveToggle={() => selectedEvent && handleSaveToggle(selectedEvent)}
            />

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => refetch()}
            />

        </div>
    );
}
