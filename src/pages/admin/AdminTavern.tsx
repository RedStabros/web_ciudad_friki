import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    ShieldAlert, CheckCircle2, XCircle, FileText, MessageSquare, 
    Settings, Loader2, Beer, AlertTriangle, Eye, Gavel, Flag, 
    Clock, UserMinus, ShieldOff, History 
} from 'lucide-react';
import { TavernAdminService, type ReportReason, type BanData } from '../../services/TavernAdminService';
import type { PendingReviewItem } from '../../services/TavernAdminService';
import { useAuth } from '../../context/AuthContext';
import UserHistoryModal from '../../components/admin/UserHistoryModal';
import { getAvatarSource } from '../../config/avatars';

export default function AdminTavern() {
    const { t } = useTranslation();
    const { user, isSuperuser } = useAuth();

    const [activeTab, setActiveTab] = useState<'pending' | 'settings' | 'logs'>('pending');
    const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [tavernEnabled, setTavernEnabled] = useState(true);
    const [savingSetting, setSavingSetting] = useState(false);

    // Logs State
    const [logs, setLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Report Reasons State
    const [showReasonsModal, setShowReasonsModal] = useState(false);
    const [currentReasons, setCurrentReasons] = useState<ReportReason[]>([]);
    const [loadingReasons, setLoadingReasons] = useState(false);

    // Ban Modal State
    const [showBanModal, setShowBanModal] = useState(false);
    const [banTarget, setBanTarget] = useState<{ id: string, username: string, author_id: string } | null>(null);
    const [banData, setBanData] = useState<BanData>({ is_shadow_banned: false, ban_until: null, ban_reason: '' });
    const [isBanning, setIsBanning] = useState(false);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyTarget, setHistoryTarget] = useState<{ id: string, username: string } | null>(null);

    useEffect(() => {
        if (user) {
            loadPendingReviews();
            loadSettings();
            if (activeTab === 'logs') loadLogs();
        }
    }, [user, activeTab]);

    const loadPendingReviews = async () => {
        setLoading(true);
        const data = await TavernAdminService.getPendingReviews();
        setPendingItems(data);
        setLoading(false);
    };

    const loadSettings = async () => {
        const enabled = await TavernAdminService.getGlobalSetting('tavern_enabled');
        setTavernEnabled(enabled);
    };

    const loadLogs = async () => {
        setLoadingLogs(true);
        const data = await TavernAdminService.getModerationLogs();
        setLogs(data);
        setLoadingLogs(false);
    };

    const toggleGlobalTavernStatus = async () => {
        setSavingSetting(true);
        const newVal = !tavernEnabled;
        const { error } = await TavernAdminService.toggleGlobalSetting('tavern_enabled', newVal);
        if (error) {
            alert(t('adminTavern.errors.updateStatus'));
        } else {
            setTavernEnabled(newVal);
        }
        setSavingSetting(false);
    };

    const processItem = async (id: string, type: 'thread' | 'reply', approve: boolean) => {
        setProcessingId(id);
        const { error } = await TavernAdminService.processReview(id, type, approve);
        if (error) {
            alert(t('adminTavern.errors.processReview', { error: error.message }));
        } else {
            setPendingItems(prev => prev.filter(item => item.id !== id));
        }
        setProcessingId(null);
    };

    const handleViewReasons = async (targetId: string, type: 'thread' | 'reply') => {
        setLoadingReasons(true);
        setShowReasonsModal(true);
        const reasons = await TavernAdminService.getReportReasons(targetId, type);
        setCurrentReasons(reasons);
        setLoadingReasons(false);
    };

    const handleOpenBanModal = (item: PendingReviewItem) => {
        setBanTarget({
            id: item.id,
            username: item.profiles?.username || 'Usuario',
            author_id: item.author_id || ''
        });
        setBanData({ is_shadow_banned: false, ban_until: null, ban_reason: '' });
        setShowBanModal(true);
    };

    const executeBan = async () => {
        if (!banTarget) return;
        setIsBanning(true);
        const { error } = await TavernAdminService.banUser(banTarget.author_id, banData);
        if (error) {
            alert(t('common.error'));
        } else {
            alert(t('adminTavern.success.userBanned'));
            setShowBanModal(false);
        }
        setIsBanning(false);
    };

    const handleOpenHistory = (userId: string, username: string) => {
        setHistoryTarget({ id: userId, username });
        setShowHistoryModal(true);
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 text-amber-500 p-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminTavern.title')}</h1>
                        <p className="text-sm text-amber-500 font-bold">{t('adminTavern.subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div className="flex items-center gap-2 border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                        }`}
                >
                    <AlertTriangle size={18} /> {t('adminTavern.tabs.pending')} {pendingItems.length > 0 && `(${pendingItems.length})`}
                </button>
                {isSuperuser && (
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'settings' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                            }`}
                    >
                        <Settings size={18} /> {t('adminTavern.tabs.settings')} 👑
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'logs' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                        }`}
                >
                    <History size={18} /> Logs de Actividad
                </button>
            </div>

            {/* List */}
            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {activeTab === 'pending' ? (
                    loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                            <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
                            <p className="font-bold">{t('adminTavern.loading.searching')}</p>
                        </div>
                    ) : pendingItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                            <CheckCircle2 className="text-accent-green mb-4 opacity-50" size={48} />
                            <p className="font-bold text-text-main text-lg mb-1">{t('adminTavern.empty.title')}</p>
                            <p className="text-sm max-w-sm mb-4">{t('adminTavern.empty.description')}</p>
                            <button onClick={loadPendingReviews} className="text-amber-500 hover:underline font-bold text-sm">{t('adminTavern.empty.refresh')}</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {pendingItems.map(item => (
                                <div key={item.id} className="bg-bg-side border border-border-theme hover:border-amber-500/50 transition-colors rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12"></div>

                                    <div className="flex justify-between items-start z-10">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase text-white flex items-center gap-1 ${item.type === 'thread' ? 'bg-brand-primary' : 'bg-brand-secondary'}`}>
                                                {item.type === 'thread' ? <FileText size={10} /> : <MessageSquare size={10} />}
                                                {item.type === 'thread' ? t('adminTavern.itemType.thread') : t('adminTavern.itemType.reply')}
                                            </span>
                                            <span className="text-xs text-text-muted font-bold">
                                                @{item.profiles?.username || 'Usuario'} • {formatDate(item.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 z-10 text-xs font-black">
                                        <div className="flex items-center gap-1 text-accent-red bg-accent-red/10 px-2 py-1 rounded-md border border-accent-red/20">
                                            <AlertTriangle size={12} /> {t('adminTavern.stats.reportsCount', { count: item.report_count })}
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                                            {t('adminTavern.stats.dislikesCount', { count: item.downvotes })}
                                        </div>
                                    </div>

                                    <div className="bg-bg-pop p-3 rounded-xl border border-border-theme z-10">
                                        {item.type === 'thread' && item.title && (
                                            <h3 className="font-black text-text-main mb-2 underline decoration-border-theme underline-offset-2">{item.title}</h3>
                                        )}
                                        <p className="text-sm text-text-secondary italic">"{item.content.replace(/<[^>]+>/g, '')}"</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewReasons(item.id, item.type)}
                                            className="flex-1 py-2 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-bg-pop border border-border-theme text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm"
                                        >
                                            <Eye size={14} /> {t('common.viewDetails') || 'Ver Motivos'}
                                        </button>
                                        <button
                                            onClick={() => handleOpenBanModal(item)}
                                            className="px-3 py-2 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-bg-pop border border-accent-red/30 text-accent-red hover:bg-accent-red hover:text-white transition-all shadow-sm"
                                        >
                                            <Gavel size={14} /> {t('common.report') || 'Banear'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-border-theme z-10">
                                        <button
                                            onClick={() => processItem(item.id, item.type, true)}
                                            disabled={processingId === item.id}
                                            className="px-3 py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-accent-green/10 text-accent-green hover:bg-accent-green hover:text-white border border-accent-green/30 transition disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={16} /> {t('adminTavern.actions.restore')}
                                        </button>
                                        <button
                                            onClick={() => processItem(item.id, item.type, false)}
                                            disabled={processingId === item.id}
                                            className="px-3 py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white border border-accent-red/30 transition disabled:opacity-50"
                                        >
                                            <XCircle size={16} /> {t('adminTavern.actions.keepHidden')}
                                        </button>
                                    </div>
                                    {processingId === item.id && (
                                        <div className="absolute inset-0 bg-bg-side/80 backdrop-blur-sm z-20 flex pt-16 items-start justify-center">
                                            <Loader2 className="animate-spin text-amber-500" size={32} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'settings' && isSuperuser ? (
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-black text-text-main mb-6 flex items-center gap-2">
                            <Settings size={20} className="text-amber-500" /> {t('adminTavern.settings.title')}
                        </h2>

                        <div className="bg-bg-side border border-border-theme rounded-2xl p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${tavernEnabled ? 'bg-amber-500/20 text-amber-500' : 'bg-border-theme text-text-muted'}`}>
                                        <Beer size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-main">{t('adminTavern.settings.tavernStatus.label')}</h3>
                                        <p className="text-sm text-text-secondary mt-1 max-w-sm">{t('adminTavern.settings.tavernStatus.description')}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-3">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={tavernEnabled}
                                        onChange={toggleGlobalTavernStatus}
                                        disabled={savingSetting}
                                    />
                                    <div className="w-14 h-7 bg-bg-pop border border-border-theme peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500">
                                    </div>
                                </label>
                            </div>
                            {savingSetting && <p className="text-xs text-brand-primary flex gap-1 items-center justify-end"><Loader2 className="animate-spin" size={12} /> {t('adminTavern.loading.saving')}</p>}
                        </div>
                    </div>
                ) : activeTab === 'logs' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                                <History size={20} className="text-brand-primary" /> Historial de Moderadores
                            </h2>
                            <button onClick={loadLogs} className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
                                <Clock size={12} /> Actualizar
                            </button>
                        </div>

                        {loadingLogs ? (
                            <div className="flex flex-col items-center py-20">
                                <Loader2 className="animate-spin text-brand-primary" size={40} />
                            </div>
                        ) : logs.length === 0 ? (
                            <p className="text-center py-20 text-text-muted italic">No hay registros de actividad recientes.</p>
                        ) : (
                            <div className="space-y-3">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-bg-side border border-border-theme p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-brand-primary/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                log.action_type === 'BAN' ? 'bg-accent-red/10 text-accent-red' : 
                                                log.action_type === 'SHADOW_BAN' ? 'bg-amber-500/10 text-amber-500' : 
                                                log.action_type === 'APPROVE_POST' ? 'bg-accent-green/10 text-accent-green' : 
                                                'bg-brand-primary/10 text-brand-primary'
                                            }`}>
                                                {log.action_type === 'BAN' ? <UserMinus size={16} /> : 
                                                 log.action_type === 'APPROVE_POST' ? <CheckCircle2 size={16} /> : 
                                                 <Flag size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-main">
                                                    <span className="text-brand-primary">@{log.admin_profile?.username}</span>
                                                    {' '}{log.action_type === 'BAN' ? 'baneó a' : 
                                                     log.action_type === 'UNBAN' ? 'desbaneó a' : 
                                                     log.action_type === 'SHADOW_BAN' ? 'aplicó shadow ban a' : 
                                                     log.action_type === 'APPROVE_POST' ? 'aprobó post de' : 
                                                     'ocultó post de'}
                                                    {' '}<span className="text-brand-secondary">@{log.target_profile?.username || 'Usuario'}</span>
                                                </p>
                                                <p className="text-xs text-text-muted mt-1 leading-tight italic">"{log.reason || 'Sin motivo'}"</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{formatDate(log.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>

            {/* Reasons Modal */}
            {showReasonsModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowReasonsModal(false)}>
                    <div className="bg-bg-pop w-full max-w-lg rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border-theme bg-bg-side flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-red/10 text-accent-red rounded-xl">
                                    <Flag size={20} />
                                </div>
                                <h2 className="text-xl font-black text-text-main">{t('adminTavern.reasonsModal.title') || 'Motivos de Reporte'}</h2>
                            </div>
                            <button onClick={() => setShowReasonsModal(false)} className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
                            {loadingReasons ? (
                                <div className="flex flex-col items-center py-10">
                                    <Loader2 className="animate-spin text-brand-primary" size={32} />
                                </div>
                            ) : currentReasons.length === 0 ? (
                                <p className="text-center text-text-muted py-10 italic">No hay detalles extra registrados.</p>
                            ) : (
                                currentReasons.map((r, i) => (
                                    <div key={i} className="bg-bg-side p-4 rounded-2xl border border-border-theme group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <button 
                                                onClick={() => handleOpenHistory(r.user_id, r.profiles?.username || 'Anónimo')}
                                                className="flex items-center gap-2 hover:bg-brand-primary/10 px-2 py-1 rounded-lg transition-colors group/btn"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-bg-pop border border-border-theme overflow-hidden">
                                                    <img src={getAvatarSource(r.profiles?.avatar_url || null)} alt="Avatar" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="font-bold text-sm text-text-main group-hover/btn:underline">@{r.profiles?.username || 'Anónimo'}</span>
                                                <History size={12} className="text-brand-primary opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            </button>
                                            <span className="text-[10px] text-text-muted font-bold">{formatDate(r.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-text-secondary pl-2 border-l-2 border-border-theme ml-3">{r.reason}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Ban Modal */}
            {showBanModal && banTarget && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowBanModal(false)}>
                    <div className="bg-bg-pop w-full max-w-md rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border-theme bg-bg-side flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-red/20 text-accent-red rounded-xl">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-main">{t('adminTavern.banModal.title') || 'Sancionar Usuario'}</h2>
                                    <p className="text-xs text-accent-red font-bold">@{banTarget.username}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBanModal(false)} className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-text-muted tracking-widest">{t('adminTavern.banModal.type') || 'Tipo de Sanción'}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setBanData({ ...banData, is_shadow_banned: false })}
                                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${!banData.is_shadow_banned ? 'bg-accent-red/10 border-accent-red text-accent-red' : 'bg-bg-side border-border-theme text-text-muted opacity-50'}`}
                                    >
                                        <UserMinus size={20} />
                                        <span className="text-[10px] font-black uppercase">Ban Total</span>
                                    </button>
                                    <button
                                        onClick={() => setBanData({ ...banData, is_shadow_banned: true })}
                                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${banData.is_shadow_banned ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-bg-side border-border-theme text-text-muted opacity-50'}`}
                                    >
                                        <ShieldOff size={20} />
                                        <span className="text-[10px] font-black uppercase">Shadow Ban</span>
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-muted italic leading-tight">
                                    {banData.is_shadow_banned 
                                        ? "El usuario podrá ver todo pero no podrá crear hilos, responder ni editar." 
                                        : "El usuario no podrá acceder a la plataforma mientras el ban esté activo."}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-text-muted tracking-widest">{t('adminTavern.banModal.duration') || 'Duración'}</label>
                                <select 
                                    className="w-full bg-bg-side border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-brand-primary"
                                    onChange={(e) => {
                                        const now = new Date();
                                        if (e.target.value === '1') now.setDate(now.getDate() + 1);
                                        else if (e.target.value === '3') now.setDate(now.getDate() + 3);
                                        else if (e.target.value === '7') now.setDate(now.getDate() + 7);
                                        else if (e.target.value === '30') now.setDate(now.getDate() + 30);
                                        else if (e.target.value === '999') now.setFullYear(now.getFullYear() + 10);
                                        setBanData({ ...banData, ban_until: e.target.value === '0' ? null : now.toISOString() });
                                    }}
                                >
                                    <option value="1">24 Horas</option>
                                    <option value="3">3 Días</option>
                                    <option value="7">7 Días</option>
                                    <option value="30">30 Días</option>
                                    <option value="999">Permanente</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-text-muted tracking-widest">{t('adminTavern.banModal.reason') || 'Motivo Interno'}</label>
                                <textarea
                                    value={banData.ban_reason || ''}
                                    onChange={e => setBanData({ ...banData, ban_reason: e.target.value })}
                                    className="w-full bg-bg-side border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-brand-primary h-24 resize-none"
                                    placeholder="Explica brevemente la razón de la sanción..."
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-bg-side border-t border-border-theme grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowBanModal(false)}
                                className="py-3 text-sm font-black uppercase tracking-widest text-text-muted border border-border-theme rounded-xl hover:bg-bg-sub transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={executeBan}
                                disabled={isBanning}
                                className={`py-3 text-sm font-black uppercase tracking-widest text-white rounded-xl transition shadow-lg ${banData.is_shadow_banned ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-accent-red hover:bg-accent-red-600 shadow-accent-red/20'} disabled:opacity-50`}
                            >
                                {isBanning ? <Loader2 size={20} className="animate-spin mx-auto" /> : (t('adminTavern.banModal.apply') || 'Aplicar Sanción')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* History Modal */}
            {showHistoryModal && historyTarget && (
                <UserHistoryModal 
                    userId={historyTarget.id}
                    username={historyTarget.username}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}
        </div>
    );
}
