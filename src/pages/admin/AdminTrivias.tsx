import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Loader2, Play, Pause, XCircle, Edit3, PieChart, Timer, Target, PlusCircle, Filter } from 'lucide-react';
import { TriviaAdminService } from '../../services/TriviaAdminService';
import type { Trivia, TriviaStatus } from '../../types/trivia';
import { TriviaBuilderModal } from '../../components/admin/TriviaBuilderModal';
import { TriviaAnalyticsModal } from '../../components/admin/TriviaAnalyticsModal';
import { useAuth } from '../../context/AuthContext';

export default function AdminTrivias() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [trivias, setTrivias] = useState<Trivia[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | TriviaStatus>('all');
    const [page, setPage] = useState(1);
    const [totalTrivias, setTotalTrivias] = useState(0);
    const ITEMS_PER_PAGE = 20;


    // Stats
    const [stats, setStats] = useState({ total: 0, active: 0, drafts: 0, paused: 0, attempts: 0 });

    // Modals
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [triviaToEdit, setTriviaToEdit] = useState<Trivia | null>(null);
    const [selectedTriviaAnalytics, setSelectedTriviaAnalytics] = useState<{ id: string, title: string } | null>(null);

    useEffect(() => {
        if (user) {
            loadDashboardStats();
            loadTrivias(1);
        }
    }, [user, activeFilter]);


    const loadDashboardStats = async () => {
        try {
            const [counts, globalAttempts] = await Promise.all([
                TriviaAdminService.getTriviaStatsCounts(),
                TriviaAdminService.getGlobalAttemptsCount()
            ]);
            
            setStats({
                total: counts.total,
                active: counts.active,
                drafts: counts.drafts,
                paused: counts.paused,
                attempts: globalAttempts,
            });
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    };

    const loadTrivias = async (pageNumber: number = page) => {
        setLoading(true);
        try {
            const offset = (pageNumber - 1) * ITEMS_PER_PAGE;
            const { trivias: data, totalCount } = await TriviaAdminService.getAdminTriviasPaginated(ITEMS_PER_PAGE, offset, activeFilter);
            setTrivias(data);
            setTotalTrivias(totalCount);
            setPage(pageNumber);
        } catch (error) {
            console.error('Error loading admin trivias:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleViewAnalytics = (trivia: Trivia) => {
        setSelectedTriviaAnalytics({ id: trivia.id, title: trivia.title });
        setIsAnalyticsOpen(true);
    };

    const handleStatusChange = async (triviaId: string, newStatus: TriviaStatus) => {
        try {
            const { error } = await TriviaAdminService.changeTriviaStatus(triviaId, newStatus);
            if (error) throw error;
            loadTrivias(page);
            loadDashboardStats();
        } catch (error: any) {
            alert(t('adminTrivias.errors.statusChangeError', { message: error.message }));
        }
    };

    const getStatusColor = (status: TriviaStatus) => {
        switch (status) {
            case 'active': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
            case 'draft': return 'bg-border-theme text-text-muted border-border-theme';
            case 'paused': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'expired': return 'bg-accent-red/20 text-accent-red border-accent-red/30';
            case 'cancelled': return 'bg-black/50 text-text-sub border-border-theme';
            case 'closed': return 'bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30';
            default: return 'bg-bg-pop text-text-muted border-border-theme';
        }
    };

    const getStatusLabel = (status: TriviaStatus) => {
        const labels: Record<TriviaStatus, string> = {
            active: t('adminTrivias.status.enCurso'),
            draft: t('adminTrivias.status.borrador'),
            paused: t('adminTrivias.status.pausada'),
            expired: t('adminTrivias.status.caducada'),
            cancelled: t('adminTrivias.status.cancelada'),
            closed: t('adminTrivias.status.cerrada')
        };
        return labels[status] || status;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
    };

    const filteredTrivias = trivias; // Filtering is handled by the RPC backend now

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <Gamepad2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminTrivias.title')}</h1>
                        <p className="text-sm text-brand-primary font-bold">{t('adminTrivias.subtitle')}</p>
                    </div>
                </div>

                <button
                    onClick={() => { setTriviaToEdit(null); setIsBuilderOpen(true); }}
                    className="bg-brand-primary hover:bg-blue-600 text-white font-black py-2.5 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-brand-primary/20 justify-center"
                >
                    <PlusCircle size={20} /> {t('adminTrivias.createTrivia')}
                </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-text-main mb-1 leading-none">{stats.total}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">{t('adminTrivias.stats.totalCreated')}</span>
                </div>
                <div className="bg-bg-pop border border-accent-green/30 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent-green/5 rounded-full -mr-8 -mt-8"></div>
                    <span className="text-2xl font-black text-accent-green mb-1 leading-none">{stats.active}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">{t('adminTrivias.stats.active')}</span>
                </div>
                <div className="bg-bg-pop border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-amber-500 mb-1 leading-none">{stats.paused}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">{t('adminTrivias.stats.paused')}</span>
                </div>
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-text-sub mb-1 leading-none">{stats.drafts}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">{t('adminTrivias.stats.drafts')}</span>
                </div>
                <div className="col-span-2 md:col-span-1 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-[#6366f1] mb-1 leading-none flex items-center gap-1"><Target size={20} /> {stats.attempts}</span>
                    <span className="text-xs font-bold text-[#6366f1] uppercase text-center">{t('adminTrivias.stats.globalAttempts')}</span>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div className="flex items-center gap-2 border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 overflow-x-auto hide-scrollbar">
                {(['all', 'active', 'expired', 'draft', 'paused', 'closed'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => { setActiveFilter(filter as any); setPage(1); }}
                        className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${activeFilter === filter
                            ? 'border-brand-primary text-brand-primary'
                            : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                            }`}
                    >
                        {filter === 'all' ? t('adminTrivias.tabs.all') : getStatusLabel(filter as TriviaStatus)}
                    </button>
                ))}
            </div>

            {/* Trivias List */}
            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {loading && trivias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                        <p className="font-bold">{t('common.loading')}</p>
                    </div>
                ) : trivias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                        <Gamepad2 className="opacity-20 mb-4" size={48} />
                        <p className="font-bold text-text-main text-lg mb-1">{t('adminTrivias.empty.noTrivia')}</p>
                        <p className="text-sm max-w-sm mb-4">{t('adminTrivias.empty.noTriviaHint')}</p>
                        <button
                            onClick={() => { setTriviaToEdit(null); setIsBuilderOpen(true); }}
                            className="text-brand-primary font-bold hover:underline"
                        >
                            {t('adminTrivias.empty.createFirst')}
                        </button>
                    </div>
                ) : filteredTrivias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Filter className="opacity-20 mb-4" size={32} />
                        <p className="font-bold">{t('adminTrivias.empty.noResults')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTrivias.map(item => (
                            <div key={item.id} className="bg-bg-side border border-border-theme hover:border-brand-primary/50 transition-colors rounded-2xl p-5 flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-black text-lg text-text-main flex-1 leading-tight line-clamp-2" title={item.title}>
                                            {item.title}
                                        </h3>
                                        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md border whitespace-nowrap ${getStatusColor(item.status)}`}>
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </div>
                                    {item.description && (
                                        <p className="text-xs text-text-muted font-bold line-clamp-2 mb-4">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme">
                                            <Target size={14} className="text-[#6366f1]" /> {t('adminTrivias.card.attempts', { count: item.attempt_count || 0 })}
                                        </div>
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme">
                                            <PieChart size={14} className="text-brand-secondary" /> {t('adminTrivias.card.basePoints', { count: item.total_points || 0 })}
                                        </div>
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme">
                                            <Timer size={14} className="text-amber-500" /> {formatTime(item.time_limit_seconds)}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border-theme pt-3 mt-auto w-full flex flex-wrap gap-2">
                                    {item.status === 'active' && (
                                        <button onClick={() => handleStatusChange(item.id, 'paused')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition text-text-sub bg-bg-pop">
                                            <Pause size={14} /> {t('adminTrivias.card.pause')}
                                        </button>
                                    )}
                                    {item.status === 'paused' && (
                                        <button onClick={() => handleStatusChange(item.id, 'active')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-accent-green/30 bg-accent-green/10 text-accent-green hover:bg-accent-green hover:text-white transition">
                                            <Play size={14} /> {t('adminTrivias.card.resume')}
                                        </button>
                                    )}
                                    {item.status === 'draft' && (
                                        <button onClick={() => handleStatusChange(item.id, 'active')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-primary/30 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition">
                                            <Play size={14} /> {t('adminTrivias.card.publish')}
                                        </button>
                                    )}
                                    {item.status !== 'cancelled' && item.status !== 'expired' && item.status !== 'closed' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm(t('adminTrivias.errors.cancelConfirm')))
                                                    handleStatusChange(item.id, 'cancelled')
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition"
                                        >
                                            <XCircle size={14} /> {t('adminTrivias.card.cancel')}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => { setTriviaToEdit(item); setIsBuilderOpen(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/50 transition bg-bg-pop ml-auto"
                                    >
                                        <Edit3 size={14} /> {t('adminTrivias.card.edit')}
                                    </button>

                                    {(item.attempt_count || 0) > 0 && (
                                        <button
                                            onClick={() => handleViewAnalytics(item)}
                                            className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-sm font-black rounded-xl bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30 hover:bg-brand-secondary hover:text-white transition"
                                        >
                                            <PieChart size={16} /> {t('adminTrivias.card.viewAnalytics')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalTrivias > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-border-theme">
                        <button
                            onClick={() => loadTrivias(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-bg-side border border-border-theme rounded-xl text-text-muted hover:text-text-main disabled:opacity-50 font-bold text-sm transition"
                        >
                            {t('common.previous', 'Anterior')}
                        </button>
                        <span className="text-sm font-bold text-text-muted">
                            {t('common.page', 'Página')} {page} / {Math.ceil(totalTrivias / ITEMS_PER_PAGE)}
                        </span>
                        <button
                            onClick={() => loadTrivias(page + 1)}
                            disabled={page >= Math.ceil(totalTrivias / ITEMS_PER_PAGE)}
                            className="px-4 py-2 bg-bg-side border border-border-theme rounded-xl text-text-muted hover:text-text-main disabled:opacity-50 font-bold text-sm transition"
                        >
                            {t('common.next', 'Siguiente')}
                        </button>
                    </div>
                )}
            </div>

            <TriviaBuilderModal
                isOpen={isBuilderOpen}
                onClose={() => { setIsBuilderOpen(false); setTriviaToEdit(null); }}
                triviaToEdit={triviaToEdit}
                onSave={() => { setIsBuilderOpen(false); setTriviaToEdit(null); loadTrivias(); }}
            />

            {selectedTriviaAnalytics && (
                <TriviaAnalyticsModal
                    isOpen={isAnalyticsOpen}
                    onClose={() => { setIsAnalyticsOpen(false); setSelectedTriviaAnalytics(null); }}
                    triviaId={selectedTriviaAnalytics.id}
                    triviaTitle={selectedTriviaAnalytics.title}
                />
            )}
        </div>
    );
}
