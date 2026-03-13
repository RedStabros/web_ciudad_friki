import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings, ShieldAlert, Store, AlertTriangle,
    Zap, Activity, Loader2, BarChart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminService } from '../../services/SuperAdminService';
import { isSuperuser } from '../../utils/superuser';

export default function AdminGM() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Authorization check
    const isSpecialAdmin = isSuperuser(user?.id);

    // States for toggles
    const [tavernEnabled, setTavernEnabled] = useState(true);
    const [vsEnabled, setVsEnabled] = useState(true);
    const [storeEnabled, setStoreEnabled] = useState(true);
    const [storeAdminVisible, setStoreAdminVisible] = useState(true);

    // State metrics
    const [metrics, setMetrics] = useState<any>(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // Saving states
    const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isSpecialAdmin) {
            loadAllSettings();
            loadMetrics();
        }
    }, [isSpecialAdmin]);

    const loadAllSettings = async () => {
        setTavernEnabled(await SuperAdminService.getGlobalSetting('tavern_enabled'));
        setVsEnabled(await SuperAdminService.getGlobalSetting('trivia_vs_enabled'));
        setStoreEnabled(await SuperAdminService.getGlobalSetting('store_enabled'));
        setStoreAdminVisible(await SuperAdminService.getGlobalSetting('store_admin_visible'));
    };

    const loadMetrics = async () => {
        setLoadingMetrics(true);
        const { data } = await SuperAdminService.getFrikiMartMetrics();
        if (data) setMetrics(data);
        setLoadingMetrics(false);
    };

    const handleToggle = async (key: string, currentValue: boolean, setter: (val: boolean) => void, confirmationMsg: string) => {
        const action = currentValue ? t('common.deactivate') : t('common.activate');
        if (window.confirm(t('adminGM.errors.toggleConfirm', { action, confirmationMsg }))) {
            setSavingSettings(prev => ({ ...prev, [key]: true }));
            const newVal = !currentValue;
            const { error } = await SuperAdminService.toggleGlobalSetting(key, newVal);
            if (error) {
                alert(t('adminGM.errors.updateError', { message: error.message }));
            } else {
                setter(newVal);
            }
            setSavingSettings(prev => ({ ...prev, [key]: false }));
        }
    };

    if (!isSpecialAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldAlert size={64} className="text-accent-red opacity-50 mb-4" />
                <h1 className="text-2xl font-black text-text-main">{t('adminGM.accessDenied')}</h1>
                <p className="text-text-muted mt-2">{t('adminGM.accessDeniedHint')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 border-b border-border-theme pb-4">
                <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                    <Settings size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-text-main leading-tight flex items-center gap-2">
                        {t('adminGM.title')} <ShieldAlert size={18} className="text-amber-500" />
                    </h1>
                    <p className="text-sm text-brand-primary font-bold">{t('adminGM.subtitle')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* La Taberna Toggle */}
                <div className="bg-bg-pop border border-amber-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12 -mt-12"></div>
                    <div className="flex items-start justify-between z-10">
                        <div>
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <Activity size={18} className="text-amber-500" /> {t('adminGM.controls.tavern.title')}
                            </h3>
                            <p className="text-xs text-text-muted mt-1 max-w-[200px]">{t('adminGM.controls.tavern.description')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={tavernEnabled} disabled={savingSettings['tavern_enabled']}
                                onChange={() => handleToggle('tavern_enabled', tavernEnabled, setTavernEnabled, t('adminGM.controls.tavern.confirmMsg'))}
                            />
                            <div className="w-11 h-6 bg-bg-side peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                    {savingSettings['tavern_enabled'] && <p className="text-[10px] text-amber-500 animate-pulse font-bold">{t('adminGM.saving')}</p>}
                </div>

                {/* Trivia VS Toggle */}
                <div className="bg-bg-pop border border-[#f472b6]/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#f472b6]/5 rounded-full -mr-12 -mt-12"></div>
                    <div className="flex items-start justify-between z-10">
                        <div>
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <Zap size={18} className="text-[#f472b6]" /> {t('adminGM.controls.vs.title')}
                            </h3>
                            <p className="text-xs text-text-muted mt-1 max-w-[200px]">{t('adminGM.controls.vs.description')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={vsEnabled} disabled={savingSettings['trivia_vs_enabled']}
                                onChange={() => handleToggle('trivia_vs_enabled', vsEnabled, setVsEnabled, t('adminGM.controls.vs.confirmMsg'))}
                            />
                            <div className="w-11 h-6 bg-bg-side peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f472b6]"></div>
                        </label>
                    </div>
                    {savingSettings['trivia_vs_enabled'] && <p className="text-[10px] text-[#f472b6] animate-pulse font-bold">{t('adminGM.saving')}</p>}
                </div>

                {/* FrikiMart Controls */}
                <div className="bg-bg-pop border border-brand-primary/30 rounded-2xl p-5 flex flex-col gap-5 shadow-sm md:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full -mr-24 -mt-24 pointer-events-none"></div>

                    <div className="flex items-center gap-2 mb-2 z-10">
                        <Store size={22} className="text-brand-primary" />
                        <h3 className="font-bold text-lg text-text-main">{t('adminGM.controls.frikiMart.title')}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10">
                        <div className="flex items-start justify-between p-4 bg-bg-side rounded-xl border border-border-theme">
                            <div>
                                <h4 className="font-bold text-sm text-text-main">{t('adminGM.controls.frikiMart.visibleUsers.title')}</h4>
                                <p className="text-[11px] text-text-muted mt-1 max-w-[200px]">{t('adminGM.controls.frikiMart.visibleUsers.description')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input type="checkbox" className="sr-only peer" checked={storeEnabled} disabled={savingSettings['store_enabled']}
                                    onChange={() => handleToggle('store_enabled', storeEnabled, setStoreEnabled, t('adminGM.controls.frikiMart.visibleUsers.confirmMsg'))}
                                />
                                <div className="w-11 h-6 bg-bg-pop border border-border-theme peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-start justify-between p-4 bg-bg-side rounded-xl border border-border-theme">
                            <div>
                                <h4 className="font-bold text-sm text-text-main flex gap-1 items-center">{t('adminGM.controls.frikiMart.adminPanel.title')} <ShieldAlert size={12} className="text-amber-500" /></h4>
                                <p className="text-[11px] text-text-muted mt-1 max-w-[200px]">{t('adminGM.controls.frikiMart.adminPanel.description')}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input type="checkbox" className="sr-only peer" checked={storeAdminVisible} disabled={savingSettings['store_admin_visible']}
                                    onChange={() => handleToggle('store_admin_visible', storeAdminVisible, setStoreAdminVisible, t('adminGM.controls.frikiMart.adminPanel.confirmMsg'))}
                                />
                                <div className="w-11 h-6 bg-bg-pop border border-border-theme peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                            </label>
                        </div>
                    </div>

                    {/* Metrics Section */}
                    <div className="mt-4 border-t border-border-theme z-10 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-sm text-text-main flex gap-2 items-center"><BarChart size={16} /> {t('adminGM.metrics.title')}</h4>
                            <button onClick={loadMetrics} disabled={loadingMetrics} className="p-1.5 bg-bg-side text-text-muted hover:text-brand-primary rounded-lg transition disabled:opacity-50">
                                <Activity size={16} className={loadingMetrics ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {loadingMetrics && !metrics ? (
                            <div className="flex justify-center py-6 text-brand-primary">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        ) : metrics ? (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { icon: '🛍️', label: t('adminGM.metrics.physicalSold'), value: metrics.physical_sold },
                                    { icon: '💰', label: t('adminGM.metrics.fcSpent'), value: metrics.fc_spent.toLocaleString() },
                                    { icon: '🎁', label: t('adminGM.metrics.donations'), value: metrics.donations_count },
                                    { icon: '💸', label: t('adminGM.metrics.collected'), value: `$${(metrics.money_cents / 100).toFixed(2)}` },
                                    { icon: '⏳', label: t('adminGM.metrics.pending'), value: metrics.pending, alert: metrics.pending > 0 },
                                    { icon: '👥', label: t('adminGM.metrics.uniqueBuyers'), value: metrics.unique_buyers },
                                    { icon: '💎', label: t('adminGM.metrics.avgFcPerSale'), value: metrics.avg_fc_per_sale },
                                    { icon: '🏪', label: t('adminGM.metrics.activeItems'), value: metrics.active_items }
                                ].map((item, i) => (
                                    <div key={i} className={`bg-bg-side border rounded-xl p-3 flex flex-col justify-center ${item.alert ? 'border-amber-500/50 relative overflow-hidden' : 'border-border-theme'}`}>
                                        {item.alert && <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-bl-lg"></div>}
                                        <div className="text-xl mb-1">{item.icon}</div>
                                        <div className={`font-black text-lg ${item.alert ? 'text-amber-500' : 'text-text-main'}`}>{item.value}</div>
                                        <div className="text-[10px] uppercase font-bold text-text-muted">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-xs text-text-muted font-bold flex items-center justify-center gap-1">
                                <AlertTriangle size={14} className="text-amber-500" /> {t('adminGM.errors.metricsError')}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
