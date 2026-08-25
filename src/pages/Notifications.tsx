import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Loader2, MessageSquare, Trophy, Calendar, Zap, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserService, type Notification } from '../services/UserService';
import { Navigate, Link } from 'react-router-dom';

export default function Notifications() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user?.id]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        const { notifications: data } = await UserService.getNotifications(user!.id);
        setNotifications(data || []);
        setIsLoading(false);
    };

    const markAsRead = async (notif: Notification) => {
        if (!user) return;
        await UserService.markNotificationRead(notif.id, user.id, notif.is_global);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const unreadGlobals = notifications.filter(n => !n.is_read && n.is_global).map(n => n.id);
        await UserService.markAllNotificationsRead(user.id, unreadGlobals);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const getIcon = (type?: string) => {
        switch (type) {
            case 'thread': return <MessageSquare className="text-secondary" size={24} />;
            case 'trivia': return <Trophy className="text-accent-yellow" size={24} />;
            case 'event': return <Calendar className="text-primary" size={24} />;
            case 'system': return <Zap className="text-brand-primary" size={24} />;
            case 'alert': return <AlertCircle className="text-accent-red" size={24} />;
            default: return <Bell className="text-text-muted" size={24} />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-divider-theme pb-6">
                <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-text-main flex items-center gap-3">
                        <Bell size={40} className="text-brand-primary" />
                        {t('notifications.title')}
                    </h1>
                    <p className="text-text-sub font-medium mt-2 max-w-lg">
                        {t('notifications.subtitle', 'Mantente al día con lo que sucede en la Ciudad Friki.')}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <Link 
                        to="/settings/notifications" 
                        className="flex items-center gap-2 px-4 py-2 bg-bg-sub border border-border-theme rounded-xl hover:bg-brand-primary/10 hover:text-brand-primary transition-all text-text-main font-bold text-sm"
                    >
                        <Settings size={18} />
                        <span className="text-xs font-bold">{t('common.preferences', 'Preferencias')}</span>
                    </Link>
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Check size={16} /> {t('common.markAllRead', 'Marcar todo como leído')}
                        </button>
                    )}
                </div>
            </header>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                        <Loader2 className="animate-spin text-brand-primary mb-2" size={40} />
                        <p className="text-sm font-bold uppercase tracking-widest text-text-sub">{t('common.loading')}</p>
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => !notif.is_read && markAsRead(notif)}
                            className={`p-5 rounded-[2rem] border transition-all hover:scale-[1.01] cursor-pointer shadow-lg
                                ${notif.is_read
                                    ? 'bg-bg-side/50 border-border-theme opacity-80'
                                    : 'bg-bg-side border-brand-primary/30 ring-1 ring-brand-primary/10'}`}
                        >
                            <div className="flex gap-5">
                                <div className={`mt-1 h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-inner
                                    ${notif.is_read ? 'bg-bg-sub/80 border-border-theme' : 'bg-brand-primary/10 border-brand-primary/20'}`}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-black text-lg mb-1 leading-tight ${notif.is_read ? 'text-text-main/80' : 'text-text-main'}`}>
                                        {notif.title}
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${notif.is_read ? 'text-text-muted' : 'text-text-sub font-medium'}`}>
                                        {notif.message}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 bg-bg-sub px-3 py-1 rounded-full">
                                            {new Date(notif.created_at).toLocaleString()}
                                        </span>
                                        {!notif.is_read && (
                                            <span className="text-brand-primary flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-brand-primary/10 px-3 py-1 rounded-full animate-pulse">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                                                {t('common.new')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 opacity-30 text-center px-10 border-2 border-dashed border-border-theme rounded-[3rem] bg-bg-side">
                        <Bell size={64} className="mb-6 text-text-muted" />
                        <p className="text-2xl font-black uppercase italic tracking-widest text-text-main">{t('notifications.emptyTitle')}</p>
                        <p className="mt-3 text-sm font-bold text-text-sub uppercase">{t('notifications.emptyMessage')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
