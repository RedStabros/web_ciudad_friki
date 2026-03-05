import { useState, useEffect } from 'react';
import { X, Check, Loader2, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BugReportService, type BugReport } from '../services/BugReportService';

interface AdminBugReportsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminBugReports({ isOpen, onClose }: AdminBugReportsProps) {
    const { t } = useTranslation();
    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadReports();
        }
    }, [isOpen]);

    const loadReports = async () => {
        setLoading(true);
        const { data } = await BugReportService.getAllReports();
        if (data) {
            setReports(data as BugReport[]); // Ensure correctly typed
        }
        setLoading(false);
    };

    const handleUpdate = async (id: string, updates: Partial<BugReport>) => {
        const { error, data } = await BugReportService.updateReport(id, updates);
        if (!error && data) {
            setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
        } else {
            alert(t('common.error'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-bg-side rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-brand-primary/20">
                <header className="p-8 pb-4 flex items-center justify-between border-b border-divider-theme bg-brand-primary/5">
                    <div className="flex items-center gap-3 text-brand-primary">
                        <Shield size={28} />
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                            {t('admin.bugReportsTitle', 'Reportes de Sistema')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-all">
                        <X size={24} className="text-text-muted" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 opacity-50 space-y-2">
                            <Loader2 className="animate-spin text-brand-primary" size={40} />
                            <p className="font-black text-xs uppercase tracking-widest">{t('common.loading')}</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 opacity-50 space-y-2 text-center">
                            <Check size={40} className="text-accent-green" />
                            <p className="font-black text-xs uppercase tracking-widest">Sin reportes activos</p>
                        </div>
                    ) : (
                        reports.map(report => (
                            <div key={report.id} className={`p-6 rounded-2xl border ${report.status === 'completed' ? 'border-accent-green/30 bg-accent-green/5' : 'border-border-theme bg-bg-sub'} flex flex-col gap-4 transition-colors`}>
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase text-brand-primary tracking-widest">
                                            @{report.profiles?.username || 'Usuario'}
                                        </p>
                                        <p className="text-text-main font-medium">{report.description}</p>
                                        <p className="text-[10px] text-text-muted font-bold italic">
                                            {new Date(report.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0 ml-4">
                                        {/* Status */}
                                        <button
                                            onClick={() => handleUpdate(report.id, { status: report.status === 'pending' ? 'completed' : 'pending' })}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1
                                                ${report.status === 'completed' ? 'bg-accent-green text-text-inv' : 'bg-bg-side border border-border-theme text-text-muted hover:border-accent-green'}`}
                                        >
                                            <Check size={12} />
                                            {report.status === 'completed' ? 'Resuelto' : 'Pendiente'}
                                        </button>

                                        {/* Severity */}
                                        <select
                                            value={report.severity}
                                            onChange={(e) => handleUpdate(report.id, { severity: e.target.value as any })}
                                            className={`px-2 py-1.5 outline-none rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer
                                                ${report.severity === 'critical' ? 'bg-accent-red/20 text-accent-red border border-accent-red/30' :
                                                    report.severity === 'high' ? 'bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30' :
                                                        report.severity === 'low' ? 'bg-text-sub/10 text-text-sub border border-border-theme' :
                                                            'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'}`}
                                        >
                                            <option value="low">BAJA</option>
                                            <option value="normal">NORMAL</option>
                                            <option value="high">ALTA</option>
                                            <option value="critical">CRÍTICA</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
