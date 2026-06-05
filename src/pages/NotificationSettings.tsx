import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
    Bell, 
    Smartphone, 
    Calendar, 
    Megaphone, 
    ArrowDownCircle, 
    ArrowUpCircle, 
    BarChart3, 
    ShieldCheck, 
    Loader2, 
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { UserService } from '../services/UserService';
import type { NotificationPreferences } from '../types/profile';

const DEFAULT_PREFS: NotificationPreferences = {
    push_enabled: true,
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
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile, refetchProfile: refetch, profileLoading } = useApp();

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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : t('common.error');
            alert(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const togglePref = (key: keyof NotificationPreferences) => {
        if (key === 'admin') return;
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (profileLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-main animate-in fade-in duration-500 pb-12">
            {/* Mobile-styled Header */}
            <header className="sticky top-0 z-40 bg-bg-side border-b border-border-theme h-16 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-bg-sub rounded-full text-text-main transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-text-main truncate">
                        {t('notificationPreferences.title', 'Preferencias de Notificaciones')}
                    </h1>
                </div>
            </header>

            <div className="max-w-2xl mx-auto py-6 space-y-8">
                {/* General Section */}
                <section>
                    <div className="px-6 mb-4">
                        <h2 className="text-lg font-bold text-text-main">
                            {t('notificationPreferences.general', 'General')}
                        </h2>
                        <p className="text-sm text-text-sub">
                            {t('notificationPreferences.generalDescription', 'Controla cómo recibes las notificaciones')}
                        </p>
                    </div>
                    
                    <div className="bg-bg-side border-y border-border-theme shadow-sm divide-y divide-border-theme">
                        <PreferenceItem
                            icon={<Bell className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.pushNotifications', 'Notificaciones Push')}
                            description={t('notificationPreferences.pushDescription', 'Recibe notificaciones en tu dispositivo')}
                            checked={prefs.push_enabled}
                            onChange={() => togglePref('push_enabled')}
                        />
                        <PreferenceItem
                            icon={<Smartphone className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.inAppNotifications', 'Notificaciones en la App')}
                            description={t('notificationPreferences.inAppDescription', 'Muestra notificaciones dentro de la aplicación')}
                            checked={prefs.in_app_enabled}
                            onChange={() => togglePref('in_app_enabled')}
                        />
                    </div>
                </section>

                {/* Categories Section */}
                <section>
                    <div className="px-6 mb-4">
                        <h2 className="text-lg font-bold text-text-main">
                            {t('notificationPreferences.categories', 'Categorías')}
                        </h2>
                        <p className="text-sm text-text-sub">
                            {t('notificationPreferences.categoriesDescription', 'Elige qué tipos de notificaciones quieres recibir')}
                        </p>
                    </div>

                    <div className="bg-bg-side border-y border-border-theme shadow-sm divide-y divide-border-theme">
                        <PreferenceItem
                            icon={<Calendar className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.eventsByInterests', 'Eventos por Intereses')}
                            checked={prefs.events_by_interests}
                            onChange={() => togglePref('events_by_interests')}
                        />
                        <PreferenceItem
                            icon={<Megaphone className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.eventUpdates', 'Actualizaciones de Eventos')}
                            checked={prefs.event_updates}
                            onChange={() => togglePref('event_updates')}
                        />
                        <PreferenceItem
                            icon={<ArrowDownCircle className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.walletReceived', 'Frikicoins Recibidos')}
                            checked={prefs.wallet_received}
                            onChange={() => togglePref('wallet_received')}
                        />
                        <PreferenceItem
                            icon={<ArrowUpCircle className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.walletSent', 'Frikicoins Enviados')}
                            checked={prefs.wallet_sent}
                            onChange={() => togglePref('wallet_sent')}
                        />
                        <PreferenceItem
                            icon={<BarChart3 className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.surveys', 'Encuestas')}
                            checked={prefs.surveys}
                            onChange={() => togglePref('surveys')}
                        />
                        <PreferenceItem
                            icon={<ShieldCheck className="text-brand-primary" size={22} />}
                            title={t('notificationPreferences.admin', 'Notificaciones Administrativas')}
                            description={t('notificationPreferences.adminDescription', 'Siempre activas (mantenimientos, anuncios importantes)')}
                            checked={true}
                            onChange={() => {}}
                            disabled={true}
                        />
                    </div>
                </section>

                {/* Save Button - Static Positioning to avoid covering footer */}
                <div className="pt-8">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-brand-primary hover:bg-brand-primary-light disabled:opacity-50 text-text-inv font-bold py-4 rounded-2xl shadow-lg transition-transform transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : null}
                        {t('common.save', 'Guardar')}
                    </button>
                    <p className="text-[10px] text-center text-text-muted mt-4 uppercase tracking-widest font-bold">
                        {t('notificationPreferences.footerNote', 'Tus preferencias se sincronizan en todos tus dispositivos')}
                    </p>
                </div>
            </div>
        </div>
    );
}

interface PreferenceItemProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

function PreferenceItem({
    icon,
    title,
    description,
    checked,
    onChange,
    disabled
}: PreferenceItemProps) {
    return (
        <div className={`flex items-center justify-between p-4 sm:p-5 transition-colors ${disabled ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-4 flex-1">
                <div className="flex-shrink-0 bg-bg-sub p-2 rounded-xl">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-main truncate">
                        {title}
                    </p>
                    {description && (
                        <p className="text-xs text-text-sub mt-0.5 line-clamp-2 leading-snug">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* iOS style toggle */}
            <button
                type="button"
                onClick={disabled ? undefined : onChange}
                disabled={disabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none 
                    ${checked ? 'bg-brand-primary' : 'bg-divider-theme'} 
                    ${disabled ? 'cursor-not-allowed' : ''}
                `}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform 
                        ${checked ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    );
}
