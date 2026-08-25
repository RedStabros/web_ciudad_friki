import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Settings, ShieldAlert, Store, AlertTriangle,
    Zap, Activity, Loader2, BarChart, Dices,
    Wrench, Globe, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SuperAdminService } from '../../services/SuperAdminService';
import { isSuperuser } from '../../utils/superuser';
import { getAvatarSource } from '../../config/avatars';
import { TavernAdminService } from '../../services/TavernAdminService';
import UserAuditModal from '../../components/admin/UserAuditModal';
import AutoTriviaGeneratorModal from '../../components/admin/AutoTriviaGeneratorModal';
import { AdminBugReports } from '../../components/AdminBugReports';
import { Send, Bug, Radio } from 'lucide-react';


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
    const [ttrpgEnabled, setTtrpgEnabled] = useState(true);
    const [userTriviasEnabled, setUserTriviasEnabled] = useState(true);
    const [storeWebEnabled, setStoreWebEnabled] = useState(true);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    // State metrics
    const [metrics, setMetrics] = useState<any>(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // Saving states
    const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({});

    // Search and Audit States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Broadcast state
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [auditUserId, setAuditUserId] = useState<string | null>(null);
    const [auditUsername, setAuditUsername] = useState('');
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [showBugReports, setShowBugReports] = useState(false);

    useEffect(() => {
        if (isSpecialAdmin) {
            loadAllSettings();
            loadMetrics();
        }
    }, [isSpecialAdmin]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length > 1) {
            setIsSearching(true);
            const results = await TavernAdminService.searchUsers(query);
            setSearchResults(results);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const loadAllSettings = async () => {
        try {
            const keys = [
                'tavern_enabled', 'trivia_vs_enabled', 'store_enabled',
                'store_admin_visible', 'ttrpg_enabled', 'user_trivias_enabled',
                'store_web_enabled', 'app_maintenance_mode'
            ];
            const settings = await SuperAdminService.getGlobalSettings(keys);
            setTavernEnabled(settings['tavern_enabled']);
            setVsEnabled(settings['trivia_vs_enabled']);
            setStoreEnabled(settings['store_enabled']);
            setStoreAdminVisible(settings['store_admin_visible']);
            setTtrpgEnabled(settings['ttrpg_enabled']);
            setUserTriviasEnabled(settings['user_trivias_enabled']);
            setStoreWebEnabled(settings['store_web_enabled']);
            setMaintenanceMode(settings['app_maintenance_mode']);
        } catch (e) {
            console.error('Error loading global settings batch:', e);
        }
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
                alert(t('adminGM.errors.updateError', { message: (error as any).message }));
            } else {
                setter(newVal);
            }
            setSavingSettings(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
        if (!window.confirm(t('adminGM.broadcast.confirm'))) return;
        
        setSendingBroadcast(true);
        const { error } = await SuperAdminService.createGlobalBroadcast(broadcastTitle, broadcastMessage);
        setSendingBroadcast(false);
        
        if (error) {
            alert(t('adminGM.broadcast.error', { message: (error as any).message }));
        } else {
            alert(t('adminGM.broadcast.success'));
            setBroadcastTitle('');
            setBroadcastMessage('');
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

                {/* Mesa de Rol / TTRPG Toggle */}
                <div className="bg-bg-pop border border-purple-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12"></div>
                    <div className="flex items-start justify-between z-10">
                        <div>
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <Dices size={18} className="text-purple-500" /> {t('adminGM.controls.ttrpg.title', 'Mesa de Rol (TTRPG)')}
                            </h3>
                            <p className="text-xs text-text-muted mt-1 max-w-[200px]">{t('adminGM.controls.ttrpg.description', 'Habilitar o deshabilitar las hojas de rol y pantalla de GM.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={ttrpgEnabled} disabled={savingSettings['ttrpg_enabled']}
                                onChange={() => handleToggle('ttrpg_enabled', ttrpgEnabled, setTtrpgEnabled, t('adminGM.controls.ttrpg.confirmMsg', 'Mesa de Rol (TTRPG)'))}
                            />
                            <div className="w-11 h-6 bg-bg-side peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                    </div>
                    {savingSettings['ttrpg_enabled'] && <p className="text-[10px] text-purple-500 animate-pulse font-bold">{t('adminGM.saving')}</p>}
                </div>

                {/* Propuestas de Trivias Toggle */}
                <div className="bg-bg-pop border border-blue-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12"></div>
                    <div className="flex items-start justify-between z-10">
                        <div>
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <HelpCircle size={18} className="text-blue-500" /> {t('adminGM.controls.userTrivias.title', 'Propuestas de Trivias')}
                            </h3>
                            <p className="text-xs text-text-muted mt-1 max-w-[200px]">{t('adminGM.controls.userTrivias.description', 'Permite a los usuarios enviar propuestas de trivias completas.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={userTriviasEnabled} disabled={savingSettings['user_trivias_enabled']}
                                onChange={() => handleToggle('user_trivias_enabled', userTriviasEnabled, setUserTriviasEnabled, t('adminGM.controls.userTrivias.confirmMsg', '¿Desactivar propuestas de trivias completas?'))}
                            />
                            <div className="w-11 h-6 bg-bg-side peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                    </div>
                    {savingSettings['user_trivias_enabled'] && <p className="text-[10px] text-blue-500 animate-pulse font-bold">{t('adminGM.saving')}</p>}
                </div>

                {/* FrikiMart en Web Toggle */}
                <div className="bg-bg-pop border border-emerald-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12"></div>
                    <div className="flex items-start justify-between z-10">
                        <div>
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <Globe size={18} className="text-emerald-500" /> {t('settings.admin.storeWeb', 'FrikiMart en Web')}
                            </h3>
                            <p className="text-xs text-text-muted mt-1 max-w-[200px]">{t('adminGM.controls.storeWeb.description', 'Habilitar o deshabilitar la tienda FrikiMart en la plataforma web.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={storeWebEnabled} disabled={savingSettings['store_web_enabled']}
                                onChange={() => handleToggle('store_web_enabled', storeWebEnabled, setStoreWebEnabled, t('adminGM.controls.storeWeb.confirmMsg', '¿Ocultar FrikiMart en la web?'))}
                            />
                            <div className="w-11 h-6 bg-bg-side peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                    {savingSettings['store_web_enabled'] && <p className="text-[10px] text-emerald-500 animate-pulse font-bold">{t('adminGM.saving')}</p>}
                </div>

                {/* Generador Automático de Trivias */}
                <div className="bg-bg-pop border border-brand-primary/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-12 -mt-12"></div>
                    <div className="flex items-start justify-between z-10 h-full">
                        <div className="flex flex-col h-full justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-text-main flex items-center gap-2">
                                    <Zap size={18} className="text-brand-primary animate-pulse" /> {t('adminGM.autoTrivia.title', 'Generador de Trivias')}
                                </h3>
                                <p className="text-xs text-text-muted mt-1 max-w-[220px]">{t('adminGM.autoTrivia.description', 'Genera trivias oficiales usando el pool aleatorio de Trivia VS.')}</p>
                            </div>
                            <button
                                onClick={() => setShowAutoModal(true)}
                                className="w-fit px-4 py-2 bg-brand-primary hover:bg-brand-primary-light text-text-inv font-black text-xs rounded-xl transition-all shadow-md shadow-brand-primary/20 flex items-center gap-1.5"
                            >
                                <Zap size={12} /> {t('adminGM.autoTrivia.button', 'Generar')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modo Mantenimiento Toggle */}
                <div className="bg-bg-pop border border-red-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden col-span-1 md:col-span-2">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12"></div>
                    <div className="flex items-start justify-between z-10">
                        <div>
                            <h3 className="font-bold text-text-main flex items-center gap-2">
                                <Wrench size={18} className="text-red-500" /> {t('settings.admin.maintenanceMode', 'Modo Mantenimiento')}
                            </h3>
                            <p className="text-xs text-text-muted mt-1 max-w-[400px]">{t('adminGM.controls.maintenance.description', 'Poner la plataforma entera en modo de mantenimiento.')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input type="checkbox" className="sr-only peer" checked={maintenanceMode} disabled={savingSettings['app_maintenance_mode']}
                                onChange={() => handleToggle('app_maintenance_mode', maintenanceMode, setMaintenanceMode, t('adminGM.controls.maintenance.confirmMsg', '¿Cambiar el estado del Modo Mantenimiento global?'))}
                            />
                            <div className="w-11 h-6 bg-bg-main border border-border-theme rounded-full peer peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                        </label>
                    </div>
                    {savingSettings['app_maintenance_mode'] && <p className="text-[10px] text-red-500 animate-pulse font-bold">{t('adminGM.saving')}</p>}
                </div>

                {/* Broadcast Tool */}
                <div className="flex items-center justify-between p-4 bg-bg-sub border border-border-theme rounded-2xl">
                    <div className="flex-1 pr-4">
                        <h4 className="font-bold text-text-main flex items-center gap-2">
                            <Radio size={18} className="text-brand-primary" /> 
                            {t('adminGM.controls.broadcast.title', 'Comunicado Global')}
                        </h4>
                        <p className="text-xs text-text-muted mt-1 max-w-[400px]">{t('adminGM.controls.broadcast.description', 'Enviar un mensaje push global sin afectar a los usuarios.')}</p>
                        <div className="mt-3 space-y-2 max-w-sm">
                            <input 
                                type="text" 
                                placeholder={t('adminGM.controls.broadcast.titlePlaceholder', 'Título del comunicado')}
                                className="w-full bg-bg-side border border-border-theme rounded-xl px-3 py-2 text-sm text-text-main focus:border-brand-primary outline-none"
                                value={broadcastTitle}
                                onChange={e => setBroadcastTitle(e.target.value)}
                            />
                            <textarea 
                                placeholder={t('adminGM.controls.broadcast.messagePlaceholder', 'Mensaje del comunicado')}
                                className="w-full bg-bg-side border border-border-theme rounded-xl px-3 py-2 text-sm text-text-main focus:border-brand-primary outline-none resize-none h-20"
                                value={broadcastMessage}
                                onChange={e => setBroadcastMessage(e.target.value)}
                            ></textarea>
                            <button 
                                onClick={handleSendBroadcast}
                                disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                                className="w-full bg-brand-primary text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {sendingBroadcast ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {t('common.send', 'Enviar')}
                            </button>
                        </div>
                    </div>
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

                {/* User Audit Section */}
                <div className="bg-bg-pop border border-brand-secondary/30 rounded-2xl p-5 flex flex-col gap-5 shadow-sm md:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-secondary/5 rounded-full -mr-24 -mt-24 pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-2 z-10">
                        <ShieldAlert size={22} className="text-brand-secondary" />
                        <h3 className="font-bold text-lg text-text-main">{t('adminGM.audit.title', 'Auditoría de Usuarios (GM)')}</h3>
                    </div>
                    <div className="flex flex-col gap-3.5 z-10">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={t('adminGM.audit.searchPlaceholder', 'Buscar usuario por @username o correo...')}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full bg-bg-side border border-border-theme text-text-main px-4 py-3 pl-10 rounded-xl focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary outline-none transition-all placeholder:text-text-muted text-sm"
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                                {isSearching ? <Loader2 size={16} className="animate-spin text-brand-secondary" /> : <Globe size={16} />}
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="border border-border-theme rounded-xl overflow-hidden divide-y divide-border-theme bg-bg-side max-h-60 overflow-y-auto custom-scrollbar">
                                {searchResults.map((u) => (
                                    <div 
                                        key={u.id}
                                        onClick={() => {
                                            setAuditUserId(u.id);
                                            setAuditUsername(u.username);
                                            setShowAuditModal(true);
                                        }}
                                        className="flex items-center justify-between p-3.5 hover:bg-bg-pop/50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getAvatarSource(u.avatar_url)}
                                                alt={u.username}
                                                className="w-10 h-10 rounded-full border border-border-theme object-cover shadow-sm bg-bg-pop"
                                            />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-text-main text-sm">@{u.username}</span>
                                                    {u.role && u.role !== 'user' && (
                                                        <span className="bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">{u.role}</span>
                                                    )}
                                                    {u.is_banned && (
                                                        <span className="bg-accent-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">{t('adminGM.audit.banned', 'Baneado')}</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-text-muted block mt-0.5">{u.email}</span>
                                            </div>
                                        </div>
                                        <Globe size={16} className="text-text-muted" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery.trim().length > 1 && searchResults.length === 0 && !isSearching && (
                            <p className="text-xs text-text-muted italic text-center py-2">{t('adminGM.audit.noUsersFound', 'No se encontraron usuarios.')}</p>
                        )}
                    </div>
                </div>

                {/* Bug Reports Section */}
                <div className="bg-bg-pop border border-accent-red/30 rounded-2xl p-5 flex flex-col gap-4 shadow-sm md:col-span-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-red/5 rounded-full -mr-12 -mt-12 pointer-events-none"></div>
                    <div className="flex items-start justify-between z-10 h-full">
                        <div className="flex flex-col h-full justify-between gap-3">
                            <div>
                                <h3 className="font-bold text-text-main flex items-center gap-2">
                                    <Bug size={18} className="text-accent-red" /> {t('admin.bugReportsTitle', 'Reportes de Sistema')}
                                </h3>
                                <p className="text-xs text-text-muted mt-1 max-w-[220px]">
                                    Revisar los reportes de bugs enviados por los usuarios.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBugReports(true)}
                                className="w-fit px-4 py-2 bg-accent-red hover:bg-red-600 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-accent-red/20 flex items-center gap-1.5"
                            >
                                <Bug size={12} /> Revisar Reportes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Global Broadcast Section */}
                <div className="bg-bg-pop border border-brand-primary/30 rounded-2xl p-5 flex flex-col gap-5 shadow-sm md:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full -mr-24 -mt-24 pointer-events-none"></div>
                    <div className="flex items-center gap-2 mb-2 z-10">
                        <Send size={22} className="text-brand-primary" />
                        <h3 className="font-bold text-lg text-text-main">{t('adminGM.broadcast.title')}</h3>
                    </div>
                    <div className="flex flex-col gap-3 z-10">
                        <p className="text-xs text-text-muted">{t('adminGM.broadcast.description')}</p>
                        <input
                            type="text"
                            placeholder={t('adminGM.broadcast.titlePlaceholder')}
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="bg-bg-side border border-border-theme text-text-main px-4 py-3 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-text-muted text-sm"
                        />
                        <textarea
                            placeholder={t('adminGM.broadcast.messagePlaceholder')}
                            value={broadcastMessage}
                            onChange={(e) => setBroadcastMessage(e.target.value)}
                            rows={3}
                            className="bg-bg-side border border-border-theme text-text-main px-4 py-3 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-text-muted text-sm resize-none"
                        />
                        <button
                            onClick={handleSendBroadcast}
                            disabled={sendingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                            className="mt-2 w-fit ml-auto flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-text-inv font-black text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
                        >
                            {sendingBroadcast ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {t('adminGM.broadcast.send')}
                        </button>
                    </div>
                </div>

            </div>

            {/* Audit Modal */}
            <UserAuditModal 
                visible={showAuditModal} 
                onClose={() => setShowAuditModal(false)} 
                userId={auditUserId} 
                username={auditUsername} 
                isSuperAdmin={true}
            />

            {/* Auto Trivia Modal */}
            <AutoTriviaGeneratorModal
                visible={showAutoModal}
                onClose={() => setShowAutoModal(false)}
                userId={user?.id || ''}
                onCreated={() => {
                    loadMetrics();
                }}
            />

            {/* Bug Reports Modal */}
            <AdminBugReports 
                isOpen={showBugReports}
                onClose={() => setShowBugReports(false)}
            />
        </div>
    );
}
