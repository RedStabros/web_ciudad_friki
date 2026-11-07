import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, HelpCircle, Package, X, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface PendingApprovalsCounts {
    events: number;
    questions: number;
    packs: number;
}

interface AdminPendingApprovalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    counts: PendingApprovalsCounts;
}

export function AdminPendingApprovalsModal({
    isOpen,
    onClose,
    counts,
}: AdminPendingApprovalsModalProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const totalPending = counts.events + counts.questions + counts.packs;

    const handleNavigate = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div
                className="bg-bg-side w-full max-w-md rounded-2xl border border-brand-primary/30 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-border-theme flex items-center justify-between bg-bg-sub/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-text-main text-base uppercase tracking-wider">
                                {t('admin.approvals.title', 'Centro de Moderación')}
                            </h3>
                            <p className="text-xs text-text-muted">
                                {t('admin.approvals.subtitle', 'Tareas pendientes por revisar')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-bg-sub text-text-muted hover:text-text-main transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                    <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-center mb-2">
                        <span className="text-sm font-black text-brand-primary">
                            ⚡ {totalPending} {t('admin.approvals.totalPending', 'elementos requieren tu atención')}
                        </span>
                    </div>

                    {/* Pending Events */}
                    <button
                        type="button"
                        onClick={() => handleNavigate('/admin/events')}
                        className="w-full p-4 rounded-xl border border-border-theme bg-bg-sub/70 hover:bg-bg-sub hover:border-brand-primary/50 transition flex items-center justify-between text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-text-main text-sm">
                                    {t('admin.approvals.events', 'Eventos en Revisión')}
                                </p>
                                <p className="text-xs text-text-muted">
                                    {t('admin.approvals.pendingEventsCount', { count: counts.events, defaultValue: `${counts.events} eventos pendientes` })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {counts.events > 0 && (
                                <span className="bg-blue-500 text-white font-black text-xs px-2 py-0.5 rounded-full">
                                    {counts.events}
                                </span>
                            )}
                            <ChevronRight size={18} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    {/* Pending Questions (Friki VS) */}
                    <button
                        type="button"
                        onClick={() => handleNavigate('/admin/frikivs')}
                        className="w-full p-4 rounded-xl border border-border-theme bg-bg-sub/70 hover:bg-bg-sub hover:border-brand-primary/50 transition flex items-center justify-between text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                                <HelpCircle size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-text-main text-sm">
                                    {t('admin.approvals.questions', 'Preguntas Friki VS')}
                                </p>
                                <p className="text-xs text-text-muted">
                                    {t('admin.approvals.pendingQuestionsCount', { count: counts.questions, defaultValue: `${counts.questions} preguntas pendientes` })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {counts.questions > 0 && (
                                <span className="bg-purple-500 text-white font-black text-xs px-2 py-0.5 rounded-full">
                                    {counts.questions}
                                </span>
                            )}
                            <ChevronRight size={18} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    {/* Pending Trivia Packs */}
                    <button
                        type="button"
                        onClick={() => handleNavigate('/admin/trivias')}
                        className="w-full p-4 rounded-xl border border-border-theme bg-bg-sub/70 hover:bg-bg-sub hover:border-brand-primary/50 transition flex items-center justify-between text-left group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                <Package size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-text-main text-sm">
                                    {t('admin.approvals.packs', 'Paquetes de Trivia')}
                                </p>
                                <p className="text-xs text-text-muted">
                                    {t('admin.approvals.pendingPacksCount', { count: counts.packs, defaultValue: `${counts.packs} paquetes pendientes` })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {counts.packs > 0 && (
                                <span className="bg-amber-500 text-black font-black text-xs px-2 py-0.5 rounded-full">
                                    {counts.packs}
                                </span>
                            )}
                            <ChevronRight size={18} className="text-text-muted group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 bg-bg-sub/30 border-t border-border-theme flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-text-sub hover:bg-bg-sub transition"
                    >
                        {t('common.close', 'Cerrar')}
                    </button>
                </div>
            </div>
        </div>
    );
}

