import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { ShieldAlert, Users, CalendarCheck, BarChart2, Gamepad2, QrCode, MessageSquareWarning, Settings, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
    const { user, isLoading: authLoading } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile(user?.id);
    const location = useLocation();
    const { t } = useTranslation();

    const isSuperuser = user?.id === import.meta.env.VITE_SUPERUSER_ID;
    const isAdmin = profile?.role === 'admin' || isSuperuser;

    if (authLoading || profileLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-muted">
                <Loader2 className="animate-spin mb-4 text-brand-primary" size={48} />
                <p>{t('common.loading', 'Cargando...')}</p>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Navigate to="/" replace />;
    }

    const navItems = [
        { path: '/admin/roles', icon: <Users size={20} />, label: 'Gestión de Roles' },
        { path: '/admin/events', icon: <CalendarCheck size={20} />, label: 'Moderación Eventos' },
        { path: '/admin/surveys', icon: <BarChart2 size={20} />, label: 'Panel Encuestas' },
        { path: '/admin/trivias', icon: <Gamepad2 size={20} />, label: 'Panel Trivias' },
        { path: '/admin/qrs', icon: <QrCode size={20} />, label: 'Eventos QR' },
        { path: '/admin/tavern', icon: <MessageSquareWarning size={20} />, label: 'Panel Taberna' },
        ...(isSuperuser ? [{ path: '/admin/gm', icon: <Settings size={20} />, label: 'Panel GM' }] : []),
    ];

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative animate-in fade-in duration-300">

            {/* Admin Header Mobile */}
            <div className="lg:hidden flex items-center justify-between bg-bg-side p-4 rounded-xl border border-border-theme mb-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                <div className="flex items-center gap-3 text-text-main font-black relative z-10">
                    <div className="bg-brand-primary text-text-inv p-2 rounded-lg shadow-md shadow-brand-primary/20">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <div className="leading-none text-lg">Admin Panel</div>
                        <div className="text-[10px] text-brand-primary uppercase tracking-widest leading-none mt-1">Acceso Restringido</div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Horizontal Scroll */}
            <nav className="lg:hidden flex overflow-x-auto gap-3 pb-4 hide-scrollbar -mx-4 px-4 snap-x">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[100px] border transition-all shrink-0 snap-start ${isActive
                                ? 'bg-brand-primary border-brand-primary text-text-inv shadow-lg shadow-brand-primary/30'
                                : 'bg-bg-side border-border-theme text-text-sub hover:bg-bg-sub'
                                }`}
                        >
                            <div className={`mb-2 ${isActive ? 'text-white' : 'text-text-muted'}`}>{item.icon}</div>
                            <span className="text-[10px] uppercase font-bold tracking-tighter text-center">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Sidebar */}
            <aside className="hidden lg:block lg:col-span-3 space-y-6">
                <div className="bg-bg-side rounded-2xl border border-border-theme overflow-hidden sticky top-6 shadow-sm">
                    <div className="bg-gradient-to-br from-brand-primary/20 to-transparent border-b border-border-theme p-5 flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
                        <div className="bg-brand-primary text-text-inv p-3 rounded-xl shadow-lg relative z-10">
                            <ShieldAlert size={28} />
                        </div>
                        <div className="relative z-10">
                            <h2 className="font-black text-text-main text-lg leading-tight">Admin Pannel</h2>
                            <p className="text-[10px] text-brand-primary uppercase tracking-widest font-bold mt-1">ACCESO RESTRINGIDO</p>
                        </div>
                    </div>

                    <nav className="p-3 space-y-1.5">
                        {navItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-xl transition-all ${isActive
                                        ? 'bg-brand-primary text-text-inv shadow-md shadow-brand-primary/20 translate-x-1'
                                        : 'text-text-muted hover:bg-bg-sub hover:text-text-main'
                                        }`}
                                >
                                    <div className={isActive ? 'text-white' : 'text-text-sub'}>{item.icon}</div>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Admin Main Content Area */}
            <main className="lg:col-span-9 space-y-6 h-full flex flex-col">
                <div className="bg-bg-side rounded-2xl border border-border-theme p-4 sm:p-6 shadow-sm flex-1 min-h-[600px] overflow-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
