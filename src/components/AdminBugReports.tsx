import { useState, useEffect, useRef } from 'react';
import { X, Check, Loader2, Shield, MessageSquare, Archive, ArchiveRestore, Send, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BugReportService, type BugReport, type ReportMessage } from '../services/BugReportService';
import { supabase } from '../lib/supabase';

interface AdminBugReportsProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminBugReports({ isOpen, onClose }: AdminBugReportsProps) {
    const { t } = useTranslation();
    const [reports, setReports] = useState<BugReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [archiveTab, setArchiveTab] = useState<'active' | 'archived'>('active');
    const [platformFilter, setPlatformFilter] = useState<'all' | 'web' | 'mobile'>('all');

    // Selected report thread
    const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
    const [messages, setMessages] = useState<ReportMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyFile, setReplyFile] = useState<File | null>(null);
    const [sendingReply, setSendingReply] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadReports();
        } else {
            setSelectedReport(null);
            setReplyText('');
            setReplyFile(null);
        }
    }, [isOpen]);

    const loadReports = async () => {
        setLoading(true);
        const { data } = await BugReportService.getAllReports();
        if (data) {
            setReports(data as BugReport[]);
        }
        setLoading(false);
    };

    const loadMessages = async (reportId: string) => {
        setLoadingMessages(true);
        const { data } = await BugReportService.getMessages(reportId);
        setMessages(data);
        setLoadingMessages(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    useEffect(() => {
        if (!selectedReport?.id) return;
        loadMessages(selectedReport.id);

        const channel = supabase
            .channel(`admin_ticket_${selectedReport.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'web_bug_report_messages',
                    filter: `report_id=eq.${selectedReport.id}`,
                },
                () => {
                    loadMessages(selectedReport.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedReport?.id]);

    const handleUpdate = async (id: string, updates: Partial<BugReport>) => {
        const { error, data } = await BugReportService.updateReport(id, updates);
        if (!error && data) {
            setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
            if (selectedReport?.id === id) {
                setSelectedReport(prev => prev ? { ...prev, ...updates } : null);
            }
        } else {
            alert(t('common.error'));
        }
    };

    const handleSendStaffReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport || (!replyText.trim() && !replyFile)) return;

        setSendingReply(true);
        try {
            let uploadedUrl: string | null = null;
            if (replyFile) {
                uploadedUrl = await BugReportService.uploadAttachment(replyFile);
            }

            const { error } = await BugReportService.sendMessage(selectedReport.id, replyText, uploadedUrl, true);
            if (!error) {
                if (selectedReport.status === 'pending') {
                    await handleUpdate(selectedReport.id, { status: 'in_progress' });
                }
                setReplyText('');
                setReplyFile(null);
                await loadMessages(selectedReport.id);
            } else {
                alert(t('common.error'));
            }
        } catch (err) {
            console.error(err);
            alert(t('common.error'));
        } finally {
            setSendingReply(false);
        }
    };

    const filteredReports = reports.filter(r => {
        const matchesArchive = archiveTab === 'archived' ? Boolean(r.is_archived) : !r.is_archived;
        if (!matchesArchive) return false;
        if (platformFilter === 'web') return !r.platform || r.platform === 'web';
        if (platformFilter === 'mobile') return r.platform === 'mobile_android' || r.platform === 'mobile_ios';
        return true;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-bg-side rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-brand-primary/20">
                <header className="p-6 sm:p-8 pb-4 flex items-center justify-between border-b border-divider-theme bg-brand-primary/5">
                    <div className="flex items-center gap-3 text-brand-primary">
                        {selectedReport ? (
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="p-2 rounded-xl bg-bg-sub text-text-main hover:text-brand-primary transition"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <Shield size={28} />
                        )}
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase leading-none">
                                {selectedReport
                                    ? `${t('helpdesk.caseNumber', 'Caso')} #${selectedReport.id.slice(0, 8)} — @${selectedReport.profiles?.username || 'Usuario'}`
                                    : t('admin.bugReportsTitle', 'Mesa de Ayuda e Incidentes')}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-all">
                        <X size={24} className="text-text-muted" />
                    </button>
                </header>

                {!selectedReport && (
                    <div className="px-6 sm:px-8 py-3 border-b border-border-theme bg-bg-pop flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setArchiveTab('active')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                                    archiveTab === 'active' ? 'bg-brand-primary text-white' : 'bg-bg-side text-text-muted hover:text-text-main'
                                }`}
                            >
                                {t('helpdesk.activeTab', 'Activos')} ({reports.filter(r => !r.is_archived).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setArchiveTab('archived')}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                                    archiveTab === 'archived' ? 'bg-brand-primary text-white' : 'bg-bg-side text-text-muted hover:text-text-main'
                                }`}
                            >
                                {t('helpdesk.archivedTab', 'Archivados')} ({reports.filter(r => r.is_archived).length})
                            </button>
                        </div>

                        <div className="flex gap-1.5">
                            {(['all', 'web', 'mobile'] as const).map(pf => (
                                <button
                                    key={pf}
                                    type="button"
                                    onClick={() => setPlatformFilter(pf)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition ${
                                        platformFilter === pf
                                            ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                                            : 'border-border-theme bg-bg-side text-text-muted'
                                    }`}
                                >
                                    {pf === 'all' ? t('common.all', 'Todos') : pf === 'web' ? '🌐 Web' : '📱 App'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-4">
                    {selectedReport ? (
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-bg-pop border border-border-theme space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-black text-brand-primary">
                                        @{selectedReport.profiles?.username || 'Usuario'} • {new Date(selectedReport.created_at).toLocaleString()}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <select
                                            value={selectedReport.status}
                                            onChange={e => handleUpdate(selectedReport.id, { status: e.target.value as any })}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-bg-side border border-border-theme text-text-main"
                                        >
                                            <option value="pending">{t('helpdesk.status.pending', 'Pendiente')}</option>
                                            <option value="in_progress">{t('helpdesk.status.inProgress', 'En revisión')}</option>
                                            <option value="completed">{t('helpdesk.status.completed', 'Resuelto')}</option>
                                        </select>
                                        <select
                                            value={selectedReport.severity}
                                            onChange={e => handleUpdate(selectedReport.id, { severity: e.target.value as any })}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-bg-side border border-border-theme text-text-main"
                                        >
                                            <option value="low">BAJA</option>
                                            <option value="normal">NORMAL</option>
                                            <option value="high">ALTA</option>
                                            <option value="critical">CRÍTICA</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => handleUpdate(selectedReport.id, { is_archived: !selectedReport.is_archived })}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-bg-side border border-border-theme text-text-muted hover:text-text-main flex items-center gap-1"
                                        >
                                            {selectedReport.is_archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                                            {selectedReport.is_archived ? t('helpdesk.unarchive', 'Restaurar') : t('helpdesk.archive', 'Archivar')}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-text-main font-medium whitespace-pre-wrap">{selectedReport.description}</p>
                                {selectedReport.attachment_url && (
                                    <a href={selectedReport.attachment_url} target="_blank" rel="noreferrer" className="inline-block mt-2">
                                        <img src={selectedReport.attachment_url} alt="Captura adjunta" className="max-h-56 rounded-xl border border-border-theme object-cover" />
                                    </a>
                                )}
                            </div>

                            {loadingMessages ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-brand-primary" size={28} />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-xs text-text-muted italic py-6">
                                    {t('helpdesk.noMessagesYet', 'No hay mensajes en el hilo aún. Envía la primera respuesta abajo.')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((msg) => {
                                        const isStaff = Boolean(msg.is_staff);
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[80%] rounded-2xl p-3.5 border ${
                                                    isStaff
                                                        ? 'bg-brand-primary/15 border-brand-primary/30 text-text-main'
                                                        : 'bg-bg-pop border-border-theme text-text-main'
                                                }`}>
                                                    <p className={`text-[10px] font-black uppercase mb-1 ${isStaff ? 'text-brand-primary' : 'text-amber-500'}`}>
                                                        {isStaff
                                                            ? `🛡️ @${msg.sender?.username || 'Soporte'}`
                                                            : `👤 @${msg.sender?.username || selectedReport.profiles?.username || 'Usuario'}`}
                                                    </p>
                                                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                    {msg.attachment_url && (
                                                        <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="block mt-2">
                                                            <img src={msg.attachment_url} alt="Adjunto" className="max-h-44 rounded-xl border border-border-theme object-cover" />
                                                        </a>
                                                    )}
                                                    <span className="block text-[9px] text-text-muted mt-1 text-right">
                                                        {new Date(msg.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center h-40 opacity-50 space-y-2">
                            <Loader2 className="animate-spin text-brand-primary" size={40} />
                            <p className="font-black text-xs uppercase tracking-widest">{t('common.loading')}</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 opacity-50 space-y-2 text-center">
                            <Check size={40} className="text-accent-green" />
                            <p className="font-black text-xs uppercase tracking-widest">
                                {t('helpdesk.emptyList', 'Sin reportes en esta bandeja')}
                            </p>
                        </div>
                    ) : (
                        filteredReports.map(report => (
                            <div key={report.id} className={`p-5 rounded-2xl border ${report.status === 'completed' ? 'border-accent-green/30 bg-accent-green/5' : 'border-border-theme bg-bg-sub'} flex flex-col gap-3 transition-colors`}>
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-black uppercase text-brand-primary tracking-widest">
                                                @{report.profiles?.username || 'Usuario'}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-bg-side border border-border-theme text-text-muted">
                                                {report.platform === 'mobile_android' || report.platform === 'mobile_ios' ? '📱 App' : '🌐 Web'}
                                            </span>
                                            <span className="text-[10px] text-text-muted font-bold">
                                                {new Date(report.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-main font-medium break-words">{report.description}</p>
                                        {report.attachment_url && (
                                            <a href={report.attachment_url} target="_blank" rel="noreferrer" className="inline-block mt-1">
                                                <img src={report.attachment_url} alt="Captura" className="h-16 rounded-lg border border-border-theme object-cover" />
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedReport(report)}
                                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-brand-primary text-white hover:bg-brand-primary-light transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <MessageSquare size={12} /> {t('helpdesk.openThread', 'Hilo / Responder')}
                                        </button>

                                        <select
                                            value={report.status}
                                            onChange={(e) => handleUpdate(report.id, { status: e.target.value as any })}
                                            className="px-2.5 py-1.5 outline-none rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer bg-bg-side border border-border-theme text-text-main"
                                        >
                                            <option value="pending">{t('helpdesk.status.pending', 'Pendiente')}</option>
                                            <option value="in_progress">{t('helpdesk.status.inProgress', 'En revisión')}</option>
                                            <option value="completed">{t('helpdesk.status.completed', 'Resuelto')}</option>
                                        </select>

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

                                        <button
                                            type="button"
                                            onClick={() => handleUpdate(report.id, { is_archived: !report.is_archived })}
                                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-bg-side border border-border-theme text-text-muted hover:text-text-main flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            {report.is_archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                                            {report.is_archived ? t('helpdesk.unarchive', 'Restaurar') : t('helpdesk.archive', 'Archivar')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {selectedReport && (
                    <form onSubmit={handleSendStaffReply} className="p-4 border-t border-border-theme bg-bg-pop flex items-center gap-2">
                        <label className="p-2.5 rounded-xl bg-bg-side border border-border-theme text-text-muted hover:text-brand-primary cursor-pointer transition shrink-0" title={t('helpdesk.attachScreenshot', 'Adjuntar imagen')}>
                            <ImageIcon size={18} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => setReplyFile(e.target.files?.[0] || null)}
                                className="hidden"
                            />
                        </label>
                        <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={replyFile ? replyFile.name : t('helpdesk.staffReplyPlaceholder', 'Escribe una respuesta oficial de soporte...')}
                            className="flex-1 bg-bg-side border border-border-theme rounded-xl px-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-brand-primary"
                        />
                        <button
                            type="submit"
                            disabled={sendingReply || (!replyText.trim() && !replyFile)}
                            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-light disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                        >
                            {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            <span>{t('common.send', 'Enviar')}</span>
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
