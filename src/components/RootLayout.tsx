import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { getAvatarSource } from '../config/avatars';
import { Search, Bell, Grid, Wallet, LogOut, MessageSquare, BarChart2, Gamepad2, Home, Languages } from 'lucide-react';
import NotificationsModal from './NotificationsModal';
import WalletModal from './WalletModal';

export default function RootLayout() {
    const { t, i18n } = useTranslation();
    const { session, signOut, user } = useAuth();
    const { profile, wallet } = useProfile(user?.id);

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);

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
                            <NavLink to="/tavern" icon={<MessageSquare size={18} />} label={t('nav.tavern')} />
                            <NavLink to="/surveys" icon={<BarChart2 size={18} />} label={t('nav.surveys')} />
                            <NavLink to="/trivias" icon={<Gamepad2 size={18} />} label={t('nav.trivias')} />
                        </div>

                        <div className="hidden md:block ml-4 mr-6 relative w-64 lg:w-80">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-text-muted" size={20} />
                            </span>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border border-border-theme rounded-full leading-5 bg-bg-sub text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary sm:text-sm transition duration-150 ease-in-out"
                                placeholder={t('common.search')}
                                type="text"
                            />
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
                                >
                                    <Bell size={24} />
                                </button>

                                <div className="relative ml-2 flex items-center gap-2 cursor-pointer p-1 pr-3 rounded-full hover:bg-bg-sub transition group">
                                    <img alt="User Avatar" className="h-9 w-9 rounded-full object-cover border-2 border-brand-primary bg-bg-sub" src={getAvatarSource(profile?.avatar_url || null)} />
                                    <div className="hidden md:block text-sm text-left">
                                        <p className="font-semibold text-text-main leading-tight">
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

            {/* Main Content Area */}
            <main className="flex-1 w-full relative pb-16 md:pb-0">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-bg-side border-t border-border-theme flex items-center justify-around h-16 safe-padding">
                <MobileNavLink to="/" icon={<Home size={22} />} label={t('nav.home')} />
                <MobileNavLink to="/tavern" icon={<MessageSquare size={22} />} label={t('nav.tavern')} />
                <MobileNavLink to="/surveys" icon={<BarChart2 size={22} />} label={t('nav.surveys')} />
                <MobileNavLink to="/trivias" icon={<Gamepad2 size={22} />} label={t('nav.trivias')} />
                <MobileNavLink to="/profile" icon={<Grid size={22} />} label={t('nav.profile')} />
            </nav>

            {/* Modals */}
            {user?.id && (
                <>
                    <NotificationsModal
                        isOpen={isNotificationsOpen}
                        onClose={() => setIsNotificationsOpen(false)}
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

function NavLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-sub hover:text-brand-primary transition-all hover:bg-bg-sub font-bold text-sm tracking-tight"
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}

function MobileNavLink({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <Link
            to={to}
            className="flex flex-col items-center justify-center p-2 rounded-lg text-text-sub hover:text-brand-primary transition-all"
        >
            {icon}
            <span className="text-[10px] uppercase font-black tracking-tighter mt-1">{label}</span>
        </Link>
    );
}
