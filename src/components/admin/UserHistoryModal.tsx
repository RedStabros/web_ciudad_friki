import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    XCircle, Loader2, Flag,
    History, AlertTriangle, ShieldAlert, Clock, User
} from 'lucide-react';
import { TavernAdminService, type UserInteractionLog, type PendingReviewItem } from '../../services/TavernAdminService';

interface UserHistoryModalProps {
    userId: string;
    username: string;
    onClose: () => void;
}

export default function UserHistoryModal({ userId, username, onClose }: UserHistoryModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [interactions, setInteractions] = useState<UserInteractionLog[]>([]);
    const [violations, setViolations] = useState<PendingReviewItem[]>([]);
    const [activeTab, setActiveTab] = useState<'reports' | 'violations'>('reports');

    useEffect(() => {
        loadHistory();
    }, [userId]);

    const loadHistory = async () => {
        setLoading(true);
        const [logs, warns] = await Promise.all([
            TavernAdminService.getUserInteractionHistory(userId),
            TavernAdminService.getUserViolationHistory(userId)
        ]);
        setInteractions(logs.filter(l => l.interaction_type === 'report'));
        setViolations(warns);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-bg-pop w-full max-w-2xl rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-border-theme bg-bg-side flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-xl">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-main">{t('adminHistory.title')}</h2>
                            <p className="text-sm text-brand-primary font-bold">@{username}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted">
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-theme px-6 bg-bg-side/50">
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`py-4 px-6 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        <Flag size={18} /> {t('adminHistory.tabReports')} ({interactions.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('violations')}
                        className={`py-4 px-6 text-sm font-black border-b-2 transition-all flex items-center gap-2 ${activeTab === 'violations' ? 'border-accent-red text-accent-red' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        <AlertTriangle size={18} /> {t('adminHistory.tabViolations')} ({violations.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 text-brand-primary">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="font-black animate-pulse">{t('adminHistory.loading')}</p>
                        </div>
                    ) : activeTab === 'reports' ? (
                        interactions.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <User size={48} className="mx-auto mb-4" />
                                <p className="font-bold text-text-muted">{t('adminHistory.noReports')}</p>
                            </div>
                        ) : (
                            interactions.map(log => (
                                <div key={log.id} className="bg-bg-side border border-border-theme p-4 rounded-2xl flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${log.target_type === 'thread' ? 'bg-brand-primary' : 'bg-brand-secondary'}`}>
                                                {log.target_type === 'thread' ? t('adminHistory.typeThread') : t('adminHistory.typeReply')}
                                            </span>
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{formatDate(log.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="bg-bg-pop/50 p-3 rounded-xl border border-border-theme text-xs italic text-text-secondary">
                                        {t('adminHistory.reasonPrefix')}: "{log.report_reason || t('adminBans.noReason')}"
                                    </div>
                                    <p className="text-[10px] text-text-muted">ID del objetivo: <span className="font-mono">{log.target_id}</span></p>
                                </div>
                            ))
                        )
                    ) : (
                        violations.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <ShieldAlert size={48} className="mx-auto mb-4 text-accent-green" />
                                <p className="font-bold text-text-muted">{t('adminHistory.noViolations')}</p>
                            </div>
                        ) : (
                            violations.map(violation => (
                                <div key={violation.id} className="bg-bg-side border border-accent-red/20 p-4 rounded-2xl flex flex-col gap-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-12 h-12 bg-accent-red/5 rounded-full -mr-6 -mt-6"></div>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${violation.type === 'thread' ? 'bg-brand-primary' : 'bg-brand-secondary'}`}>
                                                {violation.type === 'thread' ? t('adminHistory.typeThread') : t('adminHistory.typeReply')}
                                            </span>
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{formatDate(violation.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-accent-red font-black text-[10px] uppercase">
                                            <Flag size={12} /> {violation.report_count} Reportes
                                        </div>
                                    </div>
                                    <div className="bg-bg-pop/50 p-3 rounded-xl border border-border-theme">
                                        {violation.title && <p className="text-xs font-black text-text-main mb-1 underline">{violation.title}</p>}
                                        <p className="text-xs text-text-secondary line-clamp-2 italic">"{violation.content.replace(/<[^>]+>/g, '')}"</p>
                                    </div>
                                    {violation.admin_reviewed && (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-accent-green uppercase">
                                            <Clock size={12} /> {t('adminHistory.reviewedByAdmin')}
                                        </div>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>

                <div className="p-6 bg-bg-side border-t border-border-theme flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-brand-primary text-text-inv text-sm font-black rounded-xl hover:bg-brand-primary-light transition shadow-lg shadow-brand-primary/20"
                    >
                        {t('adminHistory.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
