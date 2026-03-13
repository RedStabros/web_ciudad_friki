import { useState, useEffect } from 'react';
import { X, Bell, Check, Loader2, MessageSquare, Trophy, Calendar, Settings } from 'lucide-react';
import { UserService, type Notification } from '../services/UserService';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotificationsModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        const { notifications: data } = await UserService.getNotifications(userId);
        setNotifications(data || []);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    const getIcon = (type?: string) => {
        switch (type) {
            case 'thread': return <MessageSquare className="text-secondary" size={18} />;
            case 'trivia': return <Trophy className="text-accent-yellow" size={18} />;
            case 'event': return <Calendar className="text-primary" size={18} />;
            default: return <Bell className="text-slate-400" size={18} />;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center md:justify-end md:p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full md:w-96 md:max-h-[85vh] bg-bg-side shadow-2xl md:rounded-[2rem] overflow-hidden flex flex-col border border-border-theme animate-in slide-in-from-right-10 duration-500">
                <header className="p-6 border-b border-border-theme flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
                            <Bell size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-text-main">{t('notifications.title', 'Notificaciones')}</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <Link 
                            to="/settings/notifications" 
                            onClick={onClose}
                            className="p-2 flex items-center gap-1.5 hover:bg-bg-sub rounded-xl transition-colors text-text-muted hover:text-brand-primary group"
                        >
                            <Settings size={18} />
                            <span className="text-xs font-bold hidden sm:inline">{t('common.preferences', 'Preferencias')}</span>
                        </Link>
                        <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted">
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <Loader2 className="animate-spin text-brand-primary mb-2" />
                            <p className="text-sm font-bold uppercase tracking-widest text-text-sub">{t('common.loading', 'Cargando...')}</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer
                                    ${notif.is_read
                                        ? 'bg-bg-sub/30 border-border-theme opacity-60'
                                        : 'bg-bg-side border-brand-primary/20 shadow-md ring-1 ring-brand-primary/5'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center
                                        ${notif.is_read ? 'bg-bg-sub text-text-muted' : 'bg-brand-primary/10 text-brand-primary'}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm text-text-main mb-1 line-clamp-1">
                                            {notif.title}
                                        </h3>
                                        <p className="text-xs text-text-sub line-clamp-2 leading-relaxed font-medium">
                                            {notif.message}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                                            {!notif.is_read && <span className="text-brand-primary flex items-center gap-1"><Check size={10} /> {t('common.new', 'Nueva')}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center px-10">
                            <Bell size={48} className="mb-4 text-text-muted" />
                            <p className="text-lg font-black uppercase italic tracking-widest text-text-main">{t('notifications.emptyTitle', 'Silencio de radio')}</p>
                            <p className="mt-2 text-xs font-bold leading-relaxed text-text-sub">{t('notifications.emptyMessage', 'Aún no hay notificaciones para tu zona, aventurero.')}</p>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-border-theme bg-bg-sub/20">
                    <button className="w-full py-3 rounded-xl hover:bg-brand-primary/10 text-brand-primary font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                        <Check size={14} /> {t('common.markAllRead', 'Marcar todas como leídas')}
                    </button>
                </footer>
            </div>
        </div>
    );
}
