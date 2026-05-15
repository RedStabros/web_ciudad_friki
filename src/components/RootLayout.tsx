import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { getAvatarSource } from '../config/avatars';
import { Bell, Grid, Wallet, LogOut, BarChart2, Gamepad2, Home, Languages, Calendar, Shield, Settings } from 'lucide-react';
import NotificationsModal from './NotificationsModal';
import WalletModal from './WalletModal';
import Footer from './Footer';
import { SurveyService } from '../services/SurveyService';
import { TriviaService } from '../services/TriviaService';
import { supabase } from '../lib/supabase';
import { useGlobalFeatures } from '../hooks/useGlobalFeatures';

export default function RootLayout() {
    const { t, i18n } = useTranslation();
    const { session, signOut, user } = useAuth();
    const { profile, wallet } = useProfile(user?.id);

    const isAdmin = profile?.role === 'admin' || user?.id === import.meta.env.VITE_SUPERUSER_ID;

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);

    // Dynamic badge counts
    const [unreadCount, setUnreadCount] = useState(0);
    const [surveyBadge, setSurveyBadge] = useState(0);
    const [triviaBadge, setTriviaBadge] = useState(0);
    const { tavern, frikiVs, frikiMartGlobal, frikiMartWeb } = useGlobalFeatures(user?.id);
    const frikiMartVisible = frikiMartGlobal && frikiMartWeb;

    useEffect(() => {
        if (!user?.id) return;

        // Load all badge counts
        const loadBadges = async () => {
            try {
                const [surveys, trivias] = await Promise.all([
                    SurveyService.getActiveCount(user.id),
                    TriviaService.getActiveCount(user.id),
                ]);
                setSurveyBadge(surveys);
                setTriviaBadge(trivias);
            } catch (e) {
                console.error('Error loading nav badges:', e);
            }
        };

        // Load unread notifications count from profiles
        const loadUnread = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('unread_count')
                .eq('id', user.id)
                .single();
            setUnreadCount(data?.unread_count || 0);
        };

        loadBadges();
        loadUnread();

        // Listener for notifications

        // Realtime subscription for notifications
        const notifSub = supabase
            .channel(`notif_badge_${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                () => loadUnread())
            .subscribe();

        return () => { supabase.removeChannel(notifSub); };
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

                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <img alt="Ciudad Friki Logo" className="h-10 w-auto" src="/assets/logo_ciudad_friki.png" />
                            <span className="sr-only">Ciudad Friki</span>
                        </Link>

                        <div className="hidden lg:flex items-center gap-1 ml-4 border-l border-border-theme pl-4">
                            <NavLink to="/" icon={<Home size={18} />} label={t('nav.home')} />
                            {tavern && <NavLink to="/tavern" icon={<img src="/assets/tabern_icon.png" alt="Tavern" className="w-[18px] h-[18px] object-contain" />} label={t('nav.tavern')} />}
                            <NavLink to="/surveys" icon={<BarChart2 size={18} />} label={t('nav.surveys')} badge={surveyBadge} />
                            <NavLink to="/trivias" icon={<Gamepad2 size={18} />} label={t('nav.trivias')} badge={triviaBadge} />
                            {frikiVs && <NavLink to="/friki-vs" icon={<img src="/assets/icon_vs.png" alt="Friki VS" className="w-[18px] h-[18px] object-contain" />} label="Friki VS" />}
                            {frikiMartVisible && (
                                <NavLink to="/frikimart" icon={<img src="/icons/icon_frikimart.png" alt="FrikiMart" className="w-[18px] h-[18px] object-contain" />} label="FrikiMart" />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-full text-text-sub hover:text-brand-primary hover:bg-bg-sub transition-all flex items-center gap-2"
                            title={t('settings.language')}
                        >
                            <Languages size={22} />
                            <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest">{i18n.language === 'es' ? 'ES' : 'EN'}</span>
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
                                    <Bell size={24} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-accent-red text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                <div className="relative ml-2 flex items-center gap-3 cursor-pointer p-1.5 px-3 rounded-full hover:bg-bg-sub transition-all group">
                                    <img alt="User Avatar" className="h-9 w-9 rounded-full object-cover border-2 border-brand-primary bg-bg-sub shrink-0" src={getAvatarSource(profile?.avatar_url || null)} />
                                    <div className="hidden md:block text-sm text-left whitespace-nowrap overflow-hidden">
                                        <p className="font-semibold text-text-main leading-tight truncate max-w-[120px]">
                                            {profile?.username || t('common.loading')}
                                        </p>
                                        <p className="text-xs text-text-muted capitalize">
                                            {profile?.role === 'user' ? t('common.user') : profile?.role}
                                        </p>
                                    </div>

                                    {/* Dropdown */}
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-bg-pop border border-border-theme rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden z-50">
                                        <div className="p-2">
                                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-text-main font-bold hover:bg-bg-sub rounded-lg transition-colors">
                                                {t('profile.title')}
                                            </Link>
                                            <Link to="/my-events" className="flex items-center gap-2 px-4 py-2 text-sm text-text-main font-medium hover:bg-bg-sub rounded-lg transition-colors">
                                                <Calendar size={14} className="text-text-muted" />
                                                {t('myEvents.title')}
                                            </Link>
                                             <Link to="/notifications" className="flex items-center gap-2 px-4 py-2 text-sm text-text-main font-medium hover:bg-bg-sub rounded-lg transition-colors">
                                                <Bell size={14} className="text-text-muted" />
                                                {t('notifications.title', 'Notificaciones')}
                                             </Link>
                                             <Link to="/settings/notifications" className="flex items-center gap-2 px-4 py-2 text-sm text-text-main font-medium hover:bg-bg-sub rounded-lg transition-colors">
                                                <Settings size={14} className="text-text-muted" />
                                                {t('notificationPreferences.title', 'Ajustes de Notificaciones')}
                                             </Link>
                                             {isAdmin && (
                                                 <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-text-main font-bold hover:bg-brand-primary/10 hover:text-brand-primary rounded-lg transition-colors">
                                                     <Shield size={14} className="text-brand-primary" />
                                                     Admin Panel
                                                 </Link>
                                             )}

                                            <div className="my-1 border-t border-border-theme"></div>
                                            <button onClick={() => signOut()} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent-red font-bold hover:bg-accent-red/10 rounded-lg transition-colors">
                                                <LogOut size={16} /> {t('dashboard.logout')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="px-5 py-2 rounded-full font-bold bg-brand-primary text-text-inv hover:bg-brand-primary-light transition-colors shadow-lg shadow-brand-primary/30"
                            >
                                {t('auth.signIn')}
                            </Link>
                        )}
                    </div>

                </div>
            </nav>

            <main className="flex-1 w-full relative pb-16 md:pb-0">
                <Outlet context={{ setIsWalletOpen, frikiMartVisible }} />
            </main>

            <Footer />

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-side border-t border-border-theme flex items-center justify-around h-16 safe-padding">
                <MobileNavLink to="/" icon={<Home size={22} />} label={t('nav.home')} />
                {tavern && <MobileNavLink to="/tavern" icon={<img src="/assets/tabern_icon.png" alt="Tavern" className="w-6 h-6 object-contain" />} label={t('nav.tavern')} />}
                <MobileNavLink to="/surveys" icon={<BarChart2 size={22} />} label={t('nav.surveys')} badge={surveyBadge} />
                <MobileNavLink to="/trivias" icon={<Gamepad2 size={22} />} label={t('nav.trivias')} badge={triviaBadge} />
                {frikiVs && <MobileNavLink to="/friki-vs" icon={<img src="/assets/icon_vs.png" alt="VS" className="w-6 h-6 object-contain" />} label="VS" />}
                <MobileNavLink to="/profile" icon={<Grid size={22} />} label={t('nav.profile')} />
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

        </div>
    );
}

function NavLink({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string; badge?: number }) {
    return (
        <Link
            to={to}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-text-sub hover:text-brand-primary transition-all hover:bg-bg-sub font-bold text-sm tracking-tight"
        >
            {icon}
            <span>{label}</span>
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
