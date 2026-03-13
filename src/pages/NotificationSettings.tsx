import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Bell, Smartphone, MonitorSmartphone, CalendarHeart, CalendarClock, Coins, Send, PieChart, ShieldAlert, Loader2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { UserService } from '../services/UserService';
import type { NotificationPreferences } from '../types/profile';

const DEFAULT_PREFS: NotificationPreferences = {
    push_enabled: false,
    in_app_enabled: true,
    events_by_interests: true,
    event_updates: true,
    wallet_received: true,
    wallet_sent: true,
    surveys: true,
    admin: true,
};

export default function NotificationSettings() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { profile, refetch } = useProfile(user?.id);

    const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile?.notification_preferences) {
            setPrefs({
                ...DEFAULT_PREFS,
                ...profile.notification_preferences
            });
        }
    }, [profile]);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await UserService.updateNotificationPreferences(user.id, prefs);
            if (error) throw error;
            await refetch();
            alert(t('notificationPreferences.saved'));
        } catch (error: any) {
            alert(error.message || t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    const togglePref = (key: keyof NotificationPreferences) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20 md:pb-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-divider-theme pb-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-text-main flex items-center gap-3">
                        <Bell size={40} className="text-brand-primary" />
                        {t('notificationPreferences.title')}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-brand-primary text-text-inv hover:bg-brand-primary-light font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 justify-center disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {t('common.save')}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Section */}
                <div space-y-6>
                    <div>
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-1">
                            {t('notificationPreferences.general')}
                        </h2>
                        <p className="text-sm text-text-sub font-medium mb-6">
                            {t('notificationPreferences.generalDescription')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <ToggleCard
                            icon={<Smartphone />}
                            title={t('notificationPreferences.pushNotifications')}
                            description={t('notificationPreferences.pushDescription')}
                            checked={prefs.push_enabled}
                            onChange={() => togglePref('push_enabled')}
                            disabled={true} // Push notifications often require extra setup on web so we might leave disabled or enabled if supported
                        />
                        <ToggleCard
                            icon={<MonitorSmartphone />}
                            title={t('notificationPreferences.inAppNotifications')}
                            description={t('notificationPreferences.inAppDescription')}
                            checked={prefs.in_app_enabled}
                            onChange={() => togglePref('in_app_enabled')}
                        />
                    </div>
                </div>

                {/* Categories Section */}
                <div space-y-6>
                    <div>
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2 mb-1">
                            {t('notificationPreferences.categories')}
                        </h2>
                        <p className="text-sm text-text-sub font-medium mb-6">
                            {t('notificationPreferences.categoriesDescription')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <ToggleCard
                            icon={<CalendarHeart className="text-brand-secondary" />}
                            title={t('notificationPreferences.eventsByInterests')}
                            description=""
                            checked={prefs.events_by_interests}
                            onChange={() => togglePref('events_by_interests')}
                        />
                        <ToggleCard
                            icon={<CalendarClock className="text-primary" />}
                            title={t('notificationPreferences.eventUpdates')}
                            description=""
                            checked={prefs.event_updates}
                            onChange={() => togglePref('event_updates')}
                        />
                        <ToggleCard
                            icon={<Coins className="text-amber-500" />}
                            title={t('notificationPreferences.walletReceived')}
                            description=""
                            checked={prefs.wallet_received}
                            onChange={() => togglePref('wallet_received')}
                        />
                        <ToggleCard
                            icon={<Send className="text-blue-500" />}
                            title={t('notificationPreferences.walletSent')}
                            description=""
                            checked={prefs.wallet_sent}
                            onChange={() => togglePref('wallet_sent')}
                        />
                        <ToggleCard
                            icon={<PieChart className="text-purple-500" />}
                            title={t('notificationPreferences.surveys')}
                            description=""
                            checked={prefs.surveys}
                            onChange={() => togglePref('surveys')}
                        />
                        <ToggleCard
                            icon={<ShieldAlert className="text-accent-red" />}
                            title={t('notificationPreferences.admin')}
                            description={t('notificationPreferences.adminDescription')}
                            checked={true}
                            onChange={() => { }}
                            disabled={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleCard({
    icon, title, description, checked, onChange, disabled
}: {
    icon: React.ReactNode, title: string, description: string, checked: boolean, onChange: () => void, disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onChange}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left shadow-sm
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-sub active:scale-[0.98]'}
                ${checked ? 'border-brand-primary bg-brand-primary/5' : 'border-border-theme bg-bg-side'}
            `}
        >
            <div className="flex gap-4 items-center flex-1">
                <div className={`p-2.5 rounded-xl ${checked ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-sub text-text-muted'}`}>
                    {icon}
                </div>
                <div className="pr-4">
                    <p className={`font-bold text-sm leading-tight ${checked ? 'text-brand-primary' : 'text-text-main'}`}>
                        {title}
                    </p>
                    {description && (
                        <p className="text-[11px] text-text-sub mt-1 leading-snug">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <div className={`shrink-0 w-11 h-6 rounded-full transition-colors relative flex items-center
                ${checked ? 'bg-brand-primary' : 'bg-divider-theme'}
            `}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute
                    ${checked ? 'translate-x-6' : 'translate-x-1'}
                `} />
            </div>
        </button>
    );
}
