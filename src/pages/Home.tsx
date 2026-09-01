import { Link, useOutletContext } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Home as HomeIcon, Calendar, BarChart2, Gamepad2, PlusCircle, Loader2, ChevronRight, Trophy, Swords, Zap, Clock, Dices, List, LayoutGrid, MapPin } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { CreateEventModal } from '../components/CreateEventModal';
import { EventService } from '../services/EventService';
import type { FrikiEvent } from '../services/EventService';
import { TriviaService } from '../services/TriviaService';
import { SurveyService } from '../services/SurveyService';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import type { EventFeedType } from '../hooks/useEvents';
import { supabase } from '../lib/supabase';
import { getAvatarSource } from '../config/avatars';
import { useOnlineUsers } from '../hooks/useOnlineUsers';

interface VSWinner {
    user_id: string;
    username: string;
    duels_won: number;
    avatar_url?: string;
}

interface RecentActivity {
    id: string;
    type: 'duel_win' | 'trivia_complete' | 'event_like';
    username: string;
    avatar_url?: string;
    detail: string;
    created_at: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Home() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { profile, wallet, tavern, frikiVs, ttrpg } = useApp();
    const { setIsWalletOpen, frikiMartVisible } = useOutletContext<{ setIsWalletOpen: (open: boolean) => void, frikiMartVisible?: boolean }>();

    // Dashboard filter state
    const [feedType, setFeedType] = useState<EventFeedType>('upcoming');
    const { events, setEvents, isLoading, error, refetch } = useEvents(user?.id, feedType, profile?.interests || []);

    const [isCompactView, setIsCompactView] = useState(() => {
        return localStorage.getItem('events_compact_view') === 'true';
    });

    const handleToggleCompactView = () => {
        const nextVal = !isCompactView;
        setIsCompactView(nextVal);
        localStorage.setItem('events_compact_view', String(nextVal));
    };

    const [trendingTopics, setTrendingTopics] = useState<string[]>([]);

    // VS Leaderboard
    const [vsWinners, setVsWinners] = useState<VSWinner[]>([]);
    const [vsLoading, setVsLoading] = useState(true);

    // Survey & Trivia counts
    const [surveyCount, setSurveyCount] = useState(0);
    const [triviaCount, setTriviaCount] = useState(0);

    // Recent activity feed
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [activityLoading, setActivityLoading] = useState(true);

    // Modal state
    const [selectedEvent, setSelectedEvent] = useState<FrikiEvent | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { onlineUsersCount, totalInteractions } = useOnlineUsers();

    const loadSidebarData = useCallback(async () => {
        const [trends, winners, surveys, trivias] = await Promise.allSettled([
            EventService.getTrendingTopics(),
            TriviaService.getVSWinnersRanking(5),
            SurveyService.getActiveCount(user?.id),
            TriviaService.getActiveCount(user?.id),
        ]);

        if (trends.status === 'fulfilled') setTrendingTopics(trends.value);
        if (winners.status === 'fulfilled') { setVsWinners(winners.value); setVsLoading(false); }
        else setVsLoading(false);
        if (surveys.status === 'fulfilled') setSurveyCount(surveys.value);
        if (trivias.status === 'fulfilled') setTriviaCount(trivias.value);
    }, [user?.id]);

    const loadRecentActivity = useCallback(async () => {
        setActivityLoading(true);
        try {
            // Fetch recent completed duels as activity
            const { data: duels } = await supabase
                .from('trivia_duels')
                .select(`
                    id,
                    created_at,
                    winner_id,
                    profiles!trivia_duels_winner_id_fkey(username, avatar_url)
                `)
                .eq('status', 'completed')
                .not('winner_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(8);

            const activity: RecentActivity[] = (duels || [])
                .filter((d: any) => d.profiles?.username)
                .map((d: any) => ({
                    id: d.id,
                    type: 'duel_win' as const,
                    username: d.profiles.username,
                    avatar_url: d.profiles.avatar_url,
                    detail: t('dashboard.wonDuel'),
                    created_at: d.created_at,
                }));

            setRecentActivity(activity);
        } catch (e) {
            console.error('Error loading recent activity:', e);
        } finally {
            setActivityLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadSidebarData();
        loadRecentActivity();
    }, [loadSidebarData, loadRecentActivity]);

    const handleEventClick = (event: FrikiEvent) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
    };

    const handleLikeToggle = async (event: FrikiEvent) => {
        if (!user) return alert(t('common.loginRequired'));
        const wasLiked = event.isLiked || false;

        // Optimistic Update
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isLiked: !wasLiked, likes_count: e.likes_count + (wasLiked ? -1 : 1) } : e));
        if (selectedEvent?.id === event.id) {
            setSelectedEvent(prev => prev ? { ...prev, isLiked: !wasLiked, likes_count: prev.likes_count + (wasLiked ? -1 : 1) } : null);
        }

        await EventService.toggleLikeEvent(user.id, event.id, wasLiked);
        refetch(false);
    };

    const handleSaveToggle = async (event: FrikiEvent) => {
        if (!user) return alert(t('common.loginRequired'));
        const wasSaved = event.isSaved || false;

        // Optimistic Update
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, isSaved: !wasSaved, saved_count: e.saved_count + (wasSaved ? -1 : 1) } : e));
        if (selectedEvent?.id === event.id) {
            setSelectedEvent(prev => prev ? { ...prev, isSaved: !wasSaved, saved_count: prev.saved_count + (wasSaved ? -1 : 1) } : null);
        }

        await EventService.toggleSaveEvent(user.id, event.id, wasSaved);
        refetch(false);
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <SEO 
                title={t('seo.home.title')}
                description={t('seo.home.description')}
                keywords={t('seo.home.keywords')}
            />

            {/* LEFT SIDEBAR (Navigation) */}
            <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-6">
                <nav className="space-y-1">
                    <Link to="/" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md bg-brand-primary/10 text-brand-primary transition-colors">
                        <HomeIcon className="mr-3 text-xl" size={20} />
                        {t('nav.home')}
                    </Link>
                    {tavern && (
                        <Link to="/tavern" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                            <img src="/assets/tabern_icon.png" alt="Tavern" className="mr-3 w-5 h-5 object-contain opacity-60 group-hover:opacity-100 transition" />
                            {t('nav.tavern')}
                        </Link>
                    )}
                    <Link to="/events" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <Calendar className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('dashboard.eventsTab')}
                    </Link>
                    <Link to="/map" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <MapPin className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('nav.map', 'Mapa')}
                    </Link>
                    <Link to="/surveys" className="group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <BarChart2 className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('nav.surveys')}
                        {surveyCount > 0 && (
                            <span className="ml-auto bg-brand-primary text-text-inv text-[9px] font-black px-2 py-0.5 rounded-full leading-none">
                                {surveyCount}
                            </span>
                        )}
                    </Link>
                    <Link to="/trivias" className="group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                        <Gamepad2 className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                        {t('nav.trivias')}
                        {triviaCount > 0 && (
                            <span className="ml-auto bg-brand-secondary text-bg-main text-[9px] font-black px-2 py-0.5 rounded-full leading-none">
                                {triviaCount}
                            </span>
                        )}
                    </Link>
                    {frikiVs && (
                        <Link to="/friki-vs" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                            <img src="/assets/icon_vs.png" alt="Friki VS" className="mr-3 w-5 h-5 object-contain opacity-60 group-hover:opacity-100 transition" />
                            {t('triviaVS.title')}
                        </Link>
                    )}
                    {frikiMartVisible && (
                        <Link to="/frikimart" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                            <img src="/icons/icon_frikimart.png" alt="FrikiMart" className="mr-3 w-5 h-5 object-contain opacity-60 group-hover:opacity-100 transition" />
                            {t('frikimart.title', 'FrikiMart')}
                        </Link>
                    )}
                    {(ttrpg || profile?.role === 'admin') && (
                        <Link to="/ttrpg" className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-text-sub hover:bg-bg-sub hover:text-text-main transition">
                            <Dices className="mr-3 text-xl text-text-muted group-hover:text-text-sub" size={20} />
                            Rol / TTRPG
                        </Link>
                    )}
                </nav>

                <div className="border-t border-divider-theme my-4"></div>

                <button
                    onClick={() => {
                        if (!user) return alert(t('common.loginRequired'));
                        setIsCreateModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-text-inv bg-brand-primary hover:bg-brand-primary-light focus:outline-none transition shadow-lg shadow-brand-primary/20 mb-6"
                >
                    <PlusCircle className="mr-2" size={20} />
                    {t('events.publish')}
                </button>

                {/* Info Card - Frikis Online */}
                <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden mt-6">
                    <div className="flex justify-between text-center items-center py-4 px-2">
                        <div className="flex flex-col items-center justify-center flex-1 border-r border-divider-theme">
                            <div className="font-bold text-text-main text-xl">{totalInteractions > 0 ? (totalInteractions >= 1000 ? `${(totalInteractions / 1000).toFixed(1)}k+` : totalInteractions) : '...'}</div>
                            <div className="text-[10px] text-text-muted uppercase tracking-widest leading-none mt-1">{t('dashboard.interactions')}</div>
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1">
                            <div className="font-black text-text-main text-accent-green flex items-center gap-1.5 text-xl">
                                <span className="w-2.5 h-2.5 bg-accent-green rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                {onlineUsersCount}
                            </div>
                            <div className="text-[10px] text-text-muted uppercase tracking-widest leading-none mt-1">{t('tavern.online')}</div>
                        </div>
                    </div>
                </div>

            </aside>

            {/* MAIN CONTENT (Events Feed) */}
            <main className="lg:col-span-9 xl:col-span-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-text-main capitalize">
                        {feedType === 'upcoming'
                            ? t('events.upcomingTitle')
                            : feedType === 'interests'
                                ? t('profile.interests')
                                : t('events.pastTitle')}
                    </h2>
                    <div className="flex items-center gap-2">
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
                                {t('common.past')}
                            </button>
                        </div>

                        <Link
                            to="/map"
                            className="p-2 bg-bg-side rounded-xl border border-border-theme text-text-muted hover:text-text-main hover:bg-bg-sub transition-all flex items-center justify-center"
                            title={t('nav.map', 'Ver Mapa')}
                        >
                            <MapPin size={18} />
                        </Link>
                        <button
                            onClick={handleToggleCompactView}
                            className="p-2 bg-bg-side rounded-xl border border-border-theme text-text-muted hover:text-text-main hover:bg-bg-sub transition-all cursor-pointer flex items-center justify-center"
                            title={isCompactView ? t('dashboard.view.grid', 'Vista normal') : t('dashboard.view.list', 'Vista compacta')}
                        >
                            {isCompactView ? <LayoutGrid size={18} /> : <List size={18} />}
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-brand-primary" size={32} />
                    </div>
                ) : error ? (
                    <div className="text-center py-10 text-accent-red">
                        {t('events.loadError')}
                    </div>
                ) : events.length === 0 ? (
                    <div className="bg-bg-side border border-border-theme p-12 rounded-xl text-center">
                        <Calendar className="mx-auto text-text-muted mb-4 opacity-20" size={60} />
                        <h3 className="text-text-main font-bold text-lg">{t('common.noResults')}</h3>
                        <p className="text-text-sub text-sm mt-1">
                            {feedType === 'interests'
                                ? t('dashboard.emptyEventsInterests')
                                : t('dashboard.emptyEvents')}
                        </p>
                    </div>
                ) : (
                    <div className={isCompactView ? "space-y-3" : "space-y-6"}>
                        {(() => {
                            let lastMonthYear = '';
                            return events.map((event) => {
                                let divider = null;
                                if (event.date) {
                                    const dateObj = new Date(event.date + 'T00:00:00');
                                    const monthYear = dateObj.toLocaleDateString(i18n.language === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' });
                                    if (monthYear !== lastMonthYear) {
                                        lastMonthYear = monthYear;
                                        divider = (
                                            <div key={`month-divider-${monthYear}`} className="timeline-month-divider">
                                                {monthYear}
                                            </div>
                                        );
                                    }
                                }
                                return (
                                    <div key={event.id} className={isCompactView ? "space-y-3" : "space-y-6"}>
                                        {divider}
                                        <EventCard
                                            event={event}
                                            isCompact={isCompactView}
                                            onClick={() => handleEventClick(event)}
                                            onLike={() => handleLikeToggle(event)}
                                            onSave={() => handleSaveToggle(event)}
                                            onInterested={() => handleSaveToggle(event)}
                                        />
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="hidden xl:block xl:col-span-3 space-y-6">

                {/* Wallet Card */}
                {user && (
                    <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden relative">
                        <div className="h-1 bg-gradient-to-r from-brand-primary to-brand-secondary w-full"></div>
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">{t('profile.wallet')}</h3>

                            <div className="bg-white p-2 rounded-lg mx-auto w-40 h-40 shadow-inner mb-4 flex items-center justify-center border-2 border-dashed border-border-theme">
                                <img
                                    alt="Wallet QR"
                                    className="w-full h-full object-contain"
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${wallet?.deposit_qr || `FRIKI:QR_${user.id}`}`}
                                />
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-xs text-text-muted mb-1 font-mono break-all font-bold">
                                    {(wallet?.deposit_qr || `FRIKI:QR_${user.id}`).substring(0, 30)}...
                                </p>
                            </div>

                            <div className="bg-bg-sub rounded-lg p-4 text-center">
                                <p className="text-[10px] items-center font-black uppercase text-text-muted mb-2 tracking-widest">{t('profile.balanceLabel')}</p>
                                <div className="flex items-center justify-center gap-2 text-3xl font-black text-brand-secondary italic">
                                    {(wallet?.balance || 0).toLocaleString()}
                                    <span className="text-xs not-italic text-text-muted ml-1 opacity-60">FC</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-bg-sub/50 px-6 py-3 border-t border-border-theme flex justify-between items-center">
                            <span className="text-xs text-text-muted">{t('wallet.balanceOverview')}</span>
                            <button
                                onClick={() => setIsWalletOpen(true)}
                                className="text-sm font-medium text-brand-primary hover:text-brand-primary-light flex items-center transition-colors px-0 py-1"
                            >
                                {t('profile.wallet')} <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Friki VS Leaderboard */}
                {frikiVs && (
                    <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden">
                        <div className="h-1 bg-gradient-to-r from-brand-primary via-accent-red to-brand-secondary w-full"></div>
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Swords size={18} className="text-brand-primary" />
                                    <h3 className="text-sm font-black text-text-main uppercase tracking-wider">Top Friki VS</h3>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full border border-brand-primary/20">
                                    {t('triviaVS.leaderboard.title')}
                                </span>
                            </div>

                            {vsLoading ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="animate-spin text-brand-primary opacity-40" size={24} />
                                </div>
                            ) : vsWinners.length === 0 ? (
                                <div className="text-center py-6 opacity-40">
                                    <Trophy size={32} className="mx-auto mb-2 text-text-muted" />
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{t('triviaVS.leaderboard.empty')}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {vsWinners.map((winner, idx) => (
                                        <div
                                            key={winner.user_id}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${idx === 0 ? 'bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20' : 'hover:bg-bg-sub'}`}
                                        >
                                            <span className="text-lg w-6 text-center flex-shrink-0 font-black leading-none">
                                                {idx < 3 ? MEDALS[idx] : <span className="text-sm text-text-muted">{idx + 1}</span>}
                                            </span>
                                            <img
                                                src={getAvatarSource(winner.avatar_url || null)}
                                                alt={winner.username}
                                                className="w-7 h-7 rounded-full object-cover border border-border-theme flex-shrink-0"
                                            />
                                            <span className={`flex-1 text-sm font-bold truncate ${idx === 0 ? 'text-amber-400' : 'text-text-main'}`}>
                                                @{winner.username}
                                            </span>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Zap size={11} className="text-brand-primary" />
                                                <span className="text-xs font-black text-brand-primary">{winner.duels_won}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Link
                                to="/friki-vs"
                                className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-text-muted hover:text-brand-primary transition-colors py-1"
                            >
                                {t('triviaVS.viewAll')} <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Recent Activity Feed */}
                <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={16} className="text-text-muted" />
                        <h3 className="text-sm font-bold text-text-main">{t('home.recentActivity')}</h3>
                    </div>

                    {activityLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="animate-spin text-brand-primary opacity-40" size={20} />
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <p className="text-xs text-text-muted text-center py-4">{t('common.noResults')}</p>
                    ) : (
                        <div className="space-y-3">
                            {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-2.5 group">
                                    <img
                                        src={getAvatarSource(activity.avatar_url || null)}
                                        alt={activity.username}
                                        className="w-8 h-8 rounded-full object-cover border border-border-theme flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs leading-tight">
                                            <span className="font-bold text-text-main">@{activity.username}</span>
                                            {' '}
                                            <span className="text-text-muted">{activity.detail}</span>
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-text-muted flex-shrink-0 font-mono">{formatTimeAgo(activity.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Trending Topics */}
                <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme p-5">
                    <h3 className="text-sm font-semibold text-text-main mb-4">{t('profile.interests')} & {t('common.trends')}</h3>
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
