import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, ShieldAlert, Loader2, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAvatarSource } from '../../config/avatars';

interface StaffReport {
    id: string;
    worker_id: string;
    assignment_id: string | null;
    message: string;
    status: 'open' | 'in_progress' | 'resolved';
    created_at: string;
    worker: {
        username: string;
        avatar_url: string | null;
    };
}

export default function AdminStaffReports() {
    const { t } = useTranslation();
    const [reports, setReports] = useState<StaffReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [page, setPage] = useState(1);
    const [totalReports, setTotalReports] = useState(0);
    const REPORTS_PER_PAGE = 20;

    useEffect(() => {
        loadReports(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const loadReports = async (pageNumber: number) => {
        setLoading(true);
        try {
            const offset = (pageNumber - 1) * REPORTS_PER_PAGE;
            
            let query = supabase
                .from('worker_reports')
                .select(`
                    id, worker_id, assignment_id, message, status, created_at,
                    worker:profiles!worker_id(username, avatar_url)
                `, { count: 'exact' });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + REPORTS_PER_PAGE - 1);

            if (error) throw error;
            
            // Format data
            const formattedData = (data as any[]).map(item => ({
                ...item,
                worker: Array.isArray(item.worker) ? item.worker[0] : item.worker
            }));

            setReports(formattedData);
            setTotalReports(count || 0);
            setPage(pageNumber);
        } catch (error) {
            console.error('Error loading reports:', error);
            alert(t('common.error', 'Error'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reportId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
        setUpdatingId(reportId);
        try {
            const { error } = await supabase
                .from('worker_reports')
                .update({ status: newStatus })
                .eq('id', reportId);

            if (error) throw error;

            setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
        } catch (error) {
            console.error('Error updating report status:', error);
            alert(t('common.error', 'Error'));
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'open': return 'bg-accent-red/20 text-accent-red border border-accent-red/30';
            case 'in_progress': return 'bg-amber-500/20 text-amber-500 border border-amber-500/30';
            case 'resolved': return 'bg-accent-green/20 text-accent-green border border-accent-green/30';
            default: return 'bg-bg-sub text-text-muted';
        }
    };

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'open': return t('adminStaffReports.status.open', 'Abierto');
            case 'in_progress': return t('adminStaffReports.status.in_progress', 'En Progreso');
            case 'resolved': return t('adminStaffReports.status.resolved', 'Resuelto');
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'open': return <AlertCircle size={14} className="mr-1 inline" />;
            case 'in_progress': return <Clock size={14} className="mr-1 inline" />;
            case 'resolved': return <CheckCircle2 size={14} className="mr-1 inline" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminStaffReports.title', 'Help Desk Staff')}</h1>
                        <p className="text-sm text-brand-primary font-bold">{t('adminStaffReports.subtitle', 'Reportes e incidencias del equipo de trabajo')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-bg-pop border border-border-theme rounded-xl p-1">
                    <Filter size={16} className="text-text-muted ml-2" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-transparent text-sm font-bold text-text-main p-2 focus:outline-none cursor-pointer"
                    >
                        <option value="all">{t('adminStaffReports.filter.all', 'Todos los estados')}</option>
                        <option value="open">{t('adminStaffReports.filter.open', 'Abiertos')}</option>
                        <option value="in_progress">{t('adminStaffReports.filter.in_progress', 'En Progreso')}</option>
                        <option value="resolved">{t('adminStaffReports.filter.resolved', 'Resueltos')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-brand-primary">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="font-bold">{t('common.loading', 'Cargando...')}</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="text-center py-12 bg-bg-pop border border-border-theme rounded-2xl">
                    <ShieldAlert size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
                    <h3 className="text-xl font-black text-text-main mb-2">{t('adminStaffReports.emptyTitle', 'Sin reportes')}</h3>
                    <p className="text-text-muted">{t('adminStaffReports.emptyMessage', 'No se encontraron incidencias en esta categoría.')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-bg-pop border border-border-theme rounded-2xl p-5 shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={getAvatarSource(report.worker?.avatar_url)} alt="Avatar" className="w-10 h-10 rounded-full bg-bg-main border border-border-theme" />
                                    <div>
                                        <div className="font-bold text-text-main">@{report.worker?.username || t('common.unknown', 'Desconocido')}</div>
                                        <div className="text-xs text-text-muted">{formatDate(report.created_at)}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {report.assignment_id && (
                                        <span className="px-3 py-1 bg-bg-sub rounded-lg text-xs font-bold text-text-muted border border-border-theme">
                                            {t('adminStaffReports.assignment', 'Asignación:')} {report.assignment_id.substring(0, 8)}...
                                        </span>
                                    )}
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusStyle(report.status)}`}>
                                        {getStatusIcon(report.status)}{getStatusLabel(report.status)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bg-bg-sub/50 border border-border-theme rounded-xl p-4 mb-4 text-text-main whitespace-pre-wrap text-sm">
                                {report.message}
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-border-theme/50">
                                <span className="text-xs text-text-muted font-bold mr-2">{t('adminStaffReports.changeStatus', 'Cambiar estado:')}</span>
                                <button
                                    disabled={updatingId === report.id || report.status === 'open'}
                                    onClick={() => handleUpdateStatus(report.id, 'open')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        report.status === 'open' 
                                            ? 'bg-accent-red text-white' 
                                            : 'bg-bg-sub text-text-muted hover:bg-accent-red/20 hover:text-accent-red disabled:opacity-50'
                                    }`}
                                >
                                    {t('adminStaffReports.status.open', 'Abierto')}
                                </button>
                                <button
                                    disabled={updatingId === report.id || report.status === 'in_progress'}
                                    onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        report.status === 'in_progress' 
                                            ? 'bg-amber-500 text-white' 
                                            : 'bg-bg-sub text-text-muted hover:bg-amber-500/20 hover:text-amber-500 disabled:opacity-50'
                                    }`}
                                >
                                    {t('adminStaffReports.status.in_progress', 'En Progreso')}
                                </button>
                                <button
                                    disabled={updatingId === report.id || report.status === 'resolved'}
                                    onClick={() => handleUpdateStatus(report.id, 'resolved')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        report.status === 'resolved' 
                                            ? 'bg-accent-green text-white' 
                                            : 'bg-bg-sub text-text-muted hover:bg-accent-green/20 hover:text-accent-green disabled:opacity-50'
                                    }`}
                                >
                                    {t('adminStaffReports.status.resolved', 'Resuelto')}
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Pagination */}
                    {totalReports > REPORTS_PER_PAGE && (
                        <div className="flex justify-between items-center bg-bg-pop p-4 rounded-xl border border-border-theme">
                            <span className="text-sm text-text-muted">
                                {t('common.showing', 'Mostrando')} {((page - 1) * REPORTS_PER_PAGE) + 1} - {Math.min(page * REPORTS_PER_PAGE, totalReports)} {t('common.of', 'de')} {totalReports}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    disabled={page === 1}
                                    onClick={() => loadReports(page - 1)}
                                    className="px-3 py-1 bg-bg-sub text-text-main rounded-lg disabled:opacity-50"
                                >
                                    {t('common.previous', 'Anterior')}
                                </button>
                                <button 
                                    disabled={page * REPORTS_PER_PAGE >= totalReports}
                                    onClick={() => loadReports(page + 1)}
                                    className="px-3 py-1 bg-bg-sub text-text-main rounded-lg disabled:opacity-50"
                                >
                                    {t('common.next', 'Siguiente')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
