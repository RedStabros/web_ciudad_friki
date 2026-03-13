import { useState, useEffect } from 'react';
import { X, Bell, Check, Loader2, MessageSquare, Trophy, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserService, type Notification } from '../services/UserService';

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

            <div className="relative w-full md:w-96 md:max-h-[85vh] bg-surface-light dark:bg-card-dark shadow-2xl md:rounded-[2rem] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-in slide-in-from-right-10 duration-500">
                <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Bell size={20} />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white">{t('notifications.title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <Loader2 className="animate-spin text-primary mb-2" />
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{t('notifications.scanning')}</p>
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 rounded-2xl border transition-all hover:translate-x-1 cursor-pointer
                                    ${notif.is_read
                                        ? 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60'
                                        : 'bg-white dark:bg-slate-800 border-primary/20 shadow-md ring-1 ring-primary/5'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center
                                        ${notif.is_read ? 'bg-slate-200 dark:bg-slate-700' : 'bg-primary/10 text-primary'}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">
                                            {notif.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                                            {notif.message}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>{new Date(notif.created_at).toLocaleString()}</span>
                                            {!notif.is_read && <span className="text-primary flex items-center gap-1"><Check size={10} /> {t('notifications.new')}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center px-10">
                            <Bell size={48} className="mb-4" />
                            <p className="text-lg font-black uppercase italic tracking-widest">{t('notifications.emptyTitle')}</p>
                            <p className="mt-2 text-xs font-bold leading-relaxed">{t('notifications.emptyDesc')}</p>
                        </div>
                    )}
                </div>

                <footer className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button className="w-full py-3 rounded-xl hover:bg-primary/10 text-primary font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                        <Check size={14} /> {t('notifications.markAllRead')}
                    </button>
                </footer>
            </div>
        </div>
    );
}
