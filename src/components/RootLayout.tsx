import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import {
    Bell, Grid, Wallet, LogOut, BarChart2, Gamepad2, Home, Languages,
    Calendar, Shield, Settings, Trophy, Building2, Sun, Moon, Menu, X,
    MapPin, Swords, ShoppingBag, Info, ChevronRight, Sparkles, Scissors, ShieldCheck
} from 'lucide-react';
import NotificationsModal from './NotificationsModal';
import WalletModal from './WalletModal';
import Footer from './Footer';
import AchievementToast from './AchievementToast';
import { VipAvatarFrame, type VipPassInfo } from './VipAvatarFrame';
import { AdminPendingApprovalsModal, type PendingApprovalsCounts } from './admin/AdminPendingApprovalsModal';
import { SurveyService } from '../services/SurveyService';
import { TriviaService } from '../services/TriviaService';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
    const { t, i18n } = useTranslation();
    const { session, signOut, user } = useAuth();
    const { profile, wallet, tavern, frikiVs, frikiMartGlobal, frikiMartWeb } = useApp();
    const { theme, setTheme } = useTheme();
    const location = useLocation();

    const isLight = theme === 'light-friki';
    const isCorpPage = location.pathname.startsWith('/corporacion') || location.pathname.startsWith('/corp');

    const isAdmin = profile?.role === 'admin' || user?.id === import.meta.env.VITE_SUPERUSER_ID;

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Dynamic badge counts
    const [unreadCount, setUnreadCount] = useState(0);
    const [surveyBadge, setSurveyBadge] = useState(0);
    const [triviaBadge, setTriviaBadge] = useState(0);
    const [unlockedAchievement, setUnlockedAchievement] = useState<any>(null);
    const frikiMartVisible = frikiMartGlobal && frikiMartWeb;

    // VIP Pass & Admin Approvals
    const [vipInfo, setVipInfo] = useState<VipPassInfo | null>(null);
    const [pendingCounts, setPendingCounts] = useState<PendingApprovalsCounts>({ events: 0, questions: 0, packs: 0 });
    const [isApprovalsModalOpen, setIsApprovalsModalOpen] = useState(false);

    // Close mobile drawer and dropdown on route change
    const [prevPathname, setPrevPathname] = useState(location.pathname);
    if (prevPathname !== location.pathname) {
        setPrevPathname(location.pathname);
        if (isMobileDrawerOpen) setIsMobileDrawerOpen(false);
        if (isUserMenuOpen) setIsUserMenuOpen(false);
    }

    // Close user menu on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    // Load VIP status
    useEffect(() => {
        if (!user?.id) {
            setVipInfo(null);
            return;
        }
        const checkVip = async () => {
            try {
                const { data } = await supabase.rpc('get_user_active_vip_pass', { p_user_id: user.id });
                if (data && data.has_vip) {
                    setVipInfo(data);
                } else {
                    setVipInfo(null);
                }
            } catch (err) {
                console.error('Error fetching VIP pass:', err);
            }
        };
        checkVip();
    }, [user?.id]);

    // Load Admin Pending Approvals
    useEffect(() => {
        if (!isAdmin) return;

        const loadPendingApprovals = async () => {
            try {
                const [eventsRes, questionsRes, packsRes] = await Promise.all([
                    supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('triviaduels_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    supabase.from('trivia_packs_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending')
                ]);

                const counts = {
                    events: eventsRes.count || 0,
                    questions: questionsRes.count || 0,
                    packs: packsRes.count || 0,
                };
                setPendingCounts(counts);

                const total = counts.events + counts.questions + counts.packs;
                if (total > 0 && !sessionStorage.getItem('has_shown_approvals_popup')) {
                    setIsApprovalsModalOpen(true);
                    sessionStorage.setItem('has_shown_approvals_popup', 'true');
                }
            } catch (err) {
                console.error('Error fetching admin pending approvals:', err);
            }
        };

        loadPendingApprovals();
    }, [isAdmin]);

    useEffect(() => {
        if (!user?.id) return;

        const loadAllBadgesAndUnread = async () => {
            try {
                const [surveys, trivias, { data: profileData }] = await Promise.all([
                    SurveyService.getActiveCount(user.id),
                    TriviaService.getActiveCount(user.id),
                    supabase.from('profiles').select('unread_count').eq('id', user.id).single()
                ]);
                setSurveyBadge(surveys);
                setTriviaBadge(trivias);
                setUnreadCount(profileData?.unread_count || 0);
            } catch (e) {
                console.error('Error loading badges and unread notifications:', e);
            }
        };

        loadAllBadgesAndUnread();

        // Realtime subscription for notifications
        const notifSub = supabase
            .channel(`notif_badge_${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                () => {
                    supabase.from('profiles').select('unread_count').eq('id', user.id).single()
                        .then(({ data }) => setUnreadCount(data?.unread_count || 0));
                })
            .subscribe();

        // Realtime subscription for new achievements
        const achSub = supabase
            .channel(`achievements_${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_achievements', filter: `user_id=eq.${user.id}` },
                async (payload) => {
                    const { data } = await supabase.from('achievements').select('*').eq('id', payload.new.achievement_id).single();
                    if (data) {
                        setUnlockedAchievement(data as any);
                    }
                })
            .subscribe();

        return () => { 
            supabase.removeChannel(notifSub); 
            supabase.removeChannel(achSub);
        };
    }, [user?.id]);

    // When notification modal closes, refresh unread count
    const handleNotificationsClose = () => {
        setIsNotificationsOpen(false);
        if (user?.id) {
            supabase.from('profiles').select('unread_count').eq('id', user.id).single()
                .then(({ data }) => setUnreadCount(data?.unread_count || 0));
        }
    };

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'es' ? 'en' : 'es';
        i18n.changeLanguage(nextLang);
    };

    return (
        <div className="bg-bg-main text-text-main min-h-screen flex flex-col transition-colors duration-200 font-display">

            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-bg-side border-b border-border-theme shadow-sm h-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Mobile Drawer Hamburger Button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            className="lg:hidden p-2 -ml-2 rounded-xl text-text-sub hover:text-brand-primary hover:bg-bg-sub transition-colors cursor-pointer"
                            aria-label={t('nav.menu', 'Menú')}
                        >
                            <Menu size={24} />
                        </button>

                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <img alt="Ciudad Friki Logo" className="h-10 w-auto" src="/assets/logo_ciudad_friki.png" />
                            <span className="sr-only">Ciudad Friki</span>
                        </Link>

                        <div className="hidden lg:flex items-center gap-1 xl:gap-2 ml-3 xl:ml-4 border-l border-border-theme pl-3 xl:pl-4 min-w-0">
                            <NavLink to="/" icon={<Home size={18} />} label={t('nav.home')} />
                            {tavern && <NavLink to="/tavern" icon={<img src="/assets/tabern_icon.png" alt="Tavern" className="w-[18px] h-[18px] object-contain" />} label={t('nav.tavern')} hideLabelOnLg />}
                            <NavLink to="/surveys" icon={<BarChart2 size={18} />} label={t('nav.surveys')} badge={surveyBadge} />
                            <NavLink to="/trivias" icon={<Gamepad2 size={18} />} label={t('nav.trivias')} badge={triviaBadge} />
                            {frikiVs && <NavLink to="/friki-vs" icon={<img src="/assets/icon_vs.png" alt="Friki VS" className="w-[18px] h-[18px] object-contain" />} label="Friki VS" hideLabelOnLg />}
                            {frikiMartVisible && (
                                <NavLink to="/frikimart" icon={<img src="/icons/icon_frikimart.png" alt="FrikiMart" className="w-[18px] h-[18px] object-contain" />} label="FrikiMart" hideLabelOnLg />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {/* Institutional Theme Switcher (in /corporacion for visitors) */}
                        {isCorpPage && !user && (
                            <button
                                type="button"
                                onClick={() => setTheme(isLight ? 'dark-friki' : 'light-friki')}
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-border-theme bg-bg-main hover:bg-bg-sub text-text-sub hover:text-text-main text-xs font-bold transition-all cursor-pointer shadow-xs select-none"
                                title={isLight ? t('corporation.themeDarkTitle', 'Cambiar a Modo Oscuro') : t('corporation.themeLightTitle', 'Cambiar a Modo Institucional Claro')}
                                aria-label={isLight ? t('corporation.themeDark', 'Modo Oscuro') : t('corporation.themeLight', 'Modo Claro')}
                            >
                                <div className={`w-7 h-3.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${isLight ? 'bg-amber-500 justify-end' : 'bg-bg-sub justify-start'}`}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs flex items-center justify-center">
                                        {isLight ? <Sun size={7} className="text-amber-600" /> : <Moon size={7} className="text-slate-700" />}
                                    </div>
                                </div>
                                <span className="hidden sm:inline">
                                    {isLight ? t('corporation.themeDark', 'Modo Oscuro') : t('corporation.themeLight', 'Modo Claro')}
                                </span>
                            </button>
                        )}

                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-full text-text-sub hover:text-brand-primary hover:bg-bg-sub transition-all flex items-center gap-1.5"
                            title={t('settings.language')}
                        >
                            <Languages size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{i18n.language === 'es' ? 'ES' : 'EN'}</span>
                        </button>

                        {session ? (
                            <>
                                <div
                                    onClick={() => setIsWalletOpen(true)}
                                    className="hidden md:flex items-center bg-bg-sub px-3 py-1.5 rounded-full border border-border-theme cursor-pointer hover:border-brand-secondary transition-all"
                                >
                                    <Wallet className="text-brand-secondary mr-2" size={18} />
                                    <span className="font-bold text-brand-secondary mr-1">
                                        {wallet ? wallet.balance.toLocaleString('es-CO') : '...'}
                                    </span>
                                    <span className="text-xs font-medium text-text-muted">FC</span>
                                </div>
                                <button
                                    onClick={() => setIsNotificationsOpen(true)}
                                    className="p-2 rounded-full text-text-sub hover:text-brand-primary hover:bg-bg-sub transition relative"
                                    aria-label={t('notifications.title')}
                                >
                                    <Bell size={22} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-accent-red text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isAdmin && (pendingCounts.events + pendingCounts.questions + pendingCounts.packs > 0) && (
                                    <button
                                        type="button"
                                        onClick={() => setIsApprovalsModalOpen(true)}
                                        className="p-2 rounded-full text-brand-primary hover:bg-bg-sub transition relative"
                                        title={t('admin.approvals.title', 'Centro de Aprobaciones')}
                                    >
                                        <ShieldCheck size={22} />
                                        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-brand-primary text-text-inv text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none animate-pulse">
                                            {pendingCounts.events + pendingCounts.questions + pendingCounts.packs}
                                        </span>
                                    </button>
                                )}

                                <div ref={userMenuRef} className="relative ml-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-bg-sub transition-all focus:outline-none"
                                        aria-expanded={isUserMenuOpen}
                                    >
                                        <VipAvatarFrame
                                            avatarUrl={profile?.avatar_url || null}
                                            size={36}
                                            vipInfo={vipInfo}
                                        />
                                        <div className="hidden xl:block text-sm text-left whitespace-nowrap overflow-hidden pr-2">
                                            <p className="font-semibold text-text-main leading-tight truncate max-w-[120px]">
                                                {profile?.username || t('common.loading')}
                                            </p>
                                            <p className="text-xs text-text-muted capitalize">
                                                {profile?.role === 'user' ? t('common.user') : profile?.role}
                                            </p>
                                        </div>
                                    </button>

                                    {/* Dropdown Menu (supports both click on mobile and hover on desktop) */}
                                    <div className={`absolute top-full right-0 mt-2 w-52 bg-bg-pop border border-border-theme rounded-2xl shadow-2xl transition-all overflow-hidden z-50 ${isUserMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                                        <div className="p-2 space-y-0.5">
                                            <div className="md:hidden px-3 py-2 border-b border-border-theme mb-1">
                                                <p className="font-bold text-text-main text-xs truncate">
                                                    @{profile?.username}
                                                </p>
                                                <p className="text-[10px] text-brand-secondary font-black">
                                                    {wallet ? `${wallet.balance.toLocaleString('es-CO')} FC` : '0 FC'}
                                                </p>
                                            </div>
                                            <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main font-bold hover:bg-bg-sub rounded-xl transition-colors">
                                                <Grid size={15} className="text-brand-primary" />
                                                <span>{t('profile.title')}</span>
                                            </Link>
                                            <Link to="/my-events" className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main font-medium hover:bg-bg-sub rounded-xl transition-colors">
                                                <Calendar size={15} className="text-text-muted" />
                                                <span>{t('myEvents.title')}</span>
                                            </Link>
                                            <Link to="/achievements" className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main font-medium hover:bg-bg-sub rounded-xl transition-colors">
                                                <Trophy size={15} className="text-amber-400" />
                                                <span>{t('achievements.title', 'Vitrina de Logros')}</span>
                                            </Link>
                                            <Link to="/notifications" className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main font-medium hover:bg-bg-sub rounded-xl transition-colors">
                                                <Bell size={15} className="text-text-muted" />
                                                <span>{t('notifications.title', 'Notificaciones')}</span>
                                            </Link>
                                            <Link to="/settings/notifications" className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main font-medium hover:bg-bg-sub rounded-xl transition-colors">
                                                <Settings size={15} className="text-text-muted" />
                                                <span>{t('notificationPreferences.title', 'Ajustes')}</span>
                                            </Link>
                                            <Link to="/corporacion" className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main font-medium hover:bg-bg-sub rounded-xl transition-colors">
                                                <Building2 size={15} className="text-brand-primary" />
                                                <span>{t('corporation.navLink', 'Corporación')}</span>
                                            </Link>
                                            {isAdmin && (
                                                <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-xs text-text-main font-bold hover:bg-brand-primary/10 hover:text-brand-primary rounded-xl transition-colors">
                                                    <Shield size={15} className="text-brand-primary" />
                                                    <span>Admin Panel</span>
                                                </Link>
                                            )}

                                            <div className="my-1 border-t border-border-theme"></div>
                                            <button onClick={() => signOut()} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-accent-red font-bold hover:bg-accent-red/10 rounded-xl transition-colors cursor-pointer">
                                                <LogOut size={15} />
                                                <span>{t('dashboard.logout')}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-brand-primary text-text-inv hover:bg-brand-primary-light transition-colors shadow-md shadow-brand-primary/25"
                            >
                                {t('auth.signIn')}
                            </Link>
                        )}
                    </div>

                </div>
            </nav>

            {/* ── MOBILE DRAWER NAVIGATION (Slide-over) ────────────────── */}
            {isMobileDrawerOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-ui-overlay backdrop-blur-sm"
                        onClick={() => setIsMobileDrawerOpen(false)}
                    />

                    {/* Drawer Content */}
                    <aside className="relative w-4/5 max-w-sm h-full bg-bg-side border-r border-border-theme shadow-2xl flex flex-col slide-in-from-left duration-300">
                        {/* Header */}
                        <div className="p-5 border-b border-border-theme flex items-center justify-between bg-bg-sub/40">
                            <Link to="/" className="flex items-center gap-2.5">
                                <img src="/assets/logo_ciudad_friki.png" alt="Ciudad Friki" className="h-9 w-auto" />
                                <div>
                                    <span className="font-black text-sm tracking-tight text-text-main italic uppercase block leading-none">
                                        Ciudad Friki
                                    </span>
                                    <span className="text-[9px] font-bold text-brand-primary uppercase tracking-widest">
                                        Web Portal
                                    </span>
                                </div>
                            </Link>
                            <button
                                onClick={() => setIsMobileDrawerOpen(false)}
                                className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-bg-sub transition-colors cursor-pointer"
                                aria-label={t('common.close', 'Cerrar')}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* User Card inside Drawer if logged in */}
                        {session && profile && (
                            <div className="p-4 mx-4 mt-4 rounded-2xl bg-bg-sub/70 border border-border-theme flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <VipAvatarFrame
                                        avatarUrl={profile.avatar_url || null}
                                        size={40}
                                        vipInfo={vipInfo}
                                    />
                                    <div className="min-w-0">
                                        <p className="font-bold text-text-main text-xs truncate">
                                            @{profile.username}
                                        </p>
                                        <p className="text-[10px] text-text-muted capitalize">
                                            {profile.role}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsMobileDrawerOpen(false); setIsWalletOpen(true); }}
                                    className="px-2.5 py-1.5 rounded-xl bg-brand-secondary/10 border border-brand-secondary/30 text-brand-secondary font-black text-xs flex items-center gap-1.5 shrink-0"
                                >
                                    <Wallet size={13} />
                                    <span>{wallet ? wallet.balance.toLocaleString('es-CO') : '0'}</span>
                                </button>
                            </div>
                        )}

                        {/* Nav Links List */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs"
                            onClick={(e) => {
                                if ((e.target as HTMLElement).closest('a')) {
                                    setIsMobileDrawerOpen(false);
                                }
                            }}
                        >
                            {/* Section: Main & Community */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2">
                                    {t('dashboard.community', 'Comunidad & Juegos')}
                                </p>
                                <div className="space-y-1">
                                    <DrawerLink to="/" icon={<Home size={16} className="text-brand-primary" />} label={t('nav.home')} />
                                    <DrawerLink to="/manualidades" icon={<Scissors size={16} className="text-pink-500" />} label={t('nav.crafts', 'Manualidades')} />
                                    {tavern && (
                                        <DrawerLink to="/tavern" icon={<img src="/assets/tabern_icon.png" alt="Tavern" className="w-4 h-4 object-contain" />} label={t('nav.tavern')} />
                                    )}
                                    <DrawerLink to="/surveys" icon={<BarChart2 size={16} className="text-accent-blue" />} label={t('nav.surveys')} badge={surveyBadge} />
                                    <DrawerLink to="/trivias" icon={<Gamepad2 size={16} className="text-accent-purple" />} label={t('nav.trivias')} badge={triviaBadge} />
                                    {frikiVs && (
                                        <DrawerLink to="/friki-vs" icon={<Swords size={16} className="text-accent-red" />} label="Friki VS" />
                                    )}
                                    <DrawerLink to="/achievements" icon={<Trophy size={16} className="text-amber-400" />} label={t('achievements.title', 'Vitrina de Logros')} />
                                </div>
                            </div>

                            {/* Section: Explore & Events */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2">
                                    {t('events.exploreTitle', 'Explorar & Eventos')}
                                </p>
                                <div className="space-y-1">
                                    <DrawerLink to="/map" icon={<MapPin size={16} className="text-emerald-500" />} label={t('map.title', 'Mapa Friki')} />
                                    {frikiMartVisible && (
                                        <DrawerLink to="/frikimart" icon={<ShoppingBag size={16} className="text-amber-500" />} label="FrikiMart" />
                                    )}
                                    {user && (
                                        <DrawerLink to="/my-events" icon={<Calendar size={16} className="text-text-muted" />} label={t('myEvents.title', 'Mis Eventos')} />
                                    )}
                                </div>
                            </div>

                            {/* Section: Institutional */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2">
                                    {t('corporation.navLink', 'Corporación')}
                                </p>
                                <div className="space-y-1">
                                    <DrawerLink to="/corporacion" icon={<Building2 size={16} className="text-brand-primary" />} label={t('corporation.title', 'Corporación Ciudad Friki')} />
                                    <DrawerLink to="/about" icon={<Info size={16} className="text-text-muted" />} label={t('about.title', 'Nosotros')} />
                                </div>
                            </div>

                            {/* Section: Account & Management */}
                            {isAdmin && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted px-3 mb-2">
                                        Administración
                                    </p>
                                    <div className="space-y-1">
                                        <DrawerLink to="/admin" icon={<Shield size={16} className="text-brand-primary" />} label="Panel de Control Admin" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="p-4 border-t border-border-theme bg-bg-sub/30 space-y-3">
                            {/* Theme toggle in drawer */}
                            <button
                                onClick={() => setTheme(isLight ? 'dark-friki' : 'light-friki')}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-bg-side border border-border-theme text-xs font-bold text-text-sub hover:text-text-main transition-colors cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    {isLight ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} className="text-slate-400" />}
                                    <span>{isLight ? t('corporation.themeDark', 'Modo Oscuro') : t('corporation.themeLight', 'Modo Claro')}</span>
                                </span>
                                <span className="text-[10px] text-text-muted uppercase tracking-wider font-mono">
                                    {isLight ? 'Claro' : 'Oscuro'}
                                </span>
                            </button>

                            {/* Auth Button */}
                            {session ? (
                                <button
                                    onClick={() => { setIsMobileDrawerOpen(false); signOut(); }}
                                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-accent-red/10 text-accent-red border border-accent-red/20 font-bold text-xs uppercase tracking-wider hover:bg-accent-red/20 transition-colors cursor-pointer"
                                >
                                    <LogOut size={15} />
                                    <span>{t('dashboard.logout')}</span>
                                </button>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-brand-primary text-text-inv font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md transition-all"
                                >
                                    <Sparkles size={15} />
                                    <span>{t('auth.signIn')}</span>
                                </Link>
                            )}
                        </div>
                    </aside>
                </div>
            )}

            <main className="flex-1 w-full relative safe-main-content">
                <Outlet context={{ setIsWalletOpen, frikiMartVisible }} />
            </main>

            <Footer />

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-bg-side border-t border-border-theme flex items-center justify-around safe-bottom-nav">
                <MobileNavLink to="/" icon={<Home size={20} />} label={t('nav.home')} />
                {tavern && <MobileNavLink to="/tavern" icon={<img src="/assets/tabern_icon.png" alt="Tavern" className="w-5 h-5 object-contain" />} label={t('nav.tavern')} />}
                <MobileNavLink to="/surveys" icon={<BarChart2 size={20} />} label={t('nav.surveys')} badge={surveyBadge} />
                <MobileNavLink to="/trivias" icon={<Gamepad2 size={20} />} label={t('nav.trivias')} badge={triviaBadge} />
                <MobileNavLink to="/achievements" icon={<Trophy size={20} className="text-amber-400" />} label={t('nav.achievements', 'Logros')} />
                <MobileNavLink to="/profile" icon={<Grid size={20} />} label={t('nav.profile')} />
            </nav>

            {/* Modals */}
            {user?.id && (
                <>
                    <NotificationsModal
                        isOpen={isNotificationsOpen}
                        onClose={handleNotificationsClose}
                        userId={user.id}
                    />
                    <WalletModal
                        isOpen={isWalletOpen}
                        onClose={() => setIsWalletOpen(false)}
                        userId={user.id}
                    />
                </>
            )}

            {unlockedAchievement && (
                <AchievementToast 
                    achievement={unlockedAchievement} 
                    onClose={() => setUnlockedAchievement(null)} 
                />
            )}

            {isAdmin && (
                <AdminPendingApprovalsModal
                    isOpen={isApprovalsModalOpen}
                    onClose={() => setIsApprovalsModalOpen(false)}
                    counts={pendingCounts}
                />
            )}

        </div>
    );
}

function DrawerLink({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: number }) {
    return (
        <Link
            to={to}
            className="flex items-center justify-between p-2.5 rounded-xl text-text-sub hover:text-text-main hover:bg-bg-sub transition-colors font-bold text-xs"
        >
            <div className="flex items-center gap-3">
                {icon}
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                {badge != null && badge > 0 && (
                    <span className="px-1.5 py-0.5 bg-brand-primary text-text-inv text-[9px] font-black rounded-full leading-none">
                        {badge}
                    </span>
                )}
                <ChevronRight size={14} className="text-text-muted opacity-50" />
            </div>
        </Link>
    );
}

function NavLink({ to, icon, label, badge, hideLabelOnLg }: { to: string; icon: React.ReactNode; label: string; badge?: number; hideLabelOnLg?: boolean }) {
    return (
        <Link
            to={to}
            title={label}
            className="relative flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded-lg text-text-sub hover:text-brand-primary transition-all hover:bg-bg-sub font-bold text-xs xl:text-sm whitespace-nowrap shrink-0"
        >
            {icon}
            <span className={hideLabelOnLg ? "hidden xl:inline" : ""}>{label}</span>
            {badge != null && badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-brand-primary text-text-inv text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </Link>
    );
}

function MobileNavLink({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: number }) {
    return (
        <Link
            to={to}
            className="relative flex flex-col items-center justify-center p-2 rounded-lg text-text-sub hover:text-brand-primary transition-all"
        >
            <span className="relative">
                {icon}
                {badge != null && badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 bg-brand-primary text-text-inv text-[8px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </span>
            <span className="text-[10px] uppercase font-black tracking-tighter mt-1">{label}</span>
        </Link>
    );
}
