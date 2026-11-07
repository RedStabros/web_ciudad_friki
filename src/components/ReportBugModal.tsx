import { useState, useEffect, useRef } from 'react';
import { X, Bug, Loader2, Send, Image as ImageIcon, MessageSquare, ArrowLeft, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BugReportService, type BugReport, type ReportMessage } from '../services/BugReportService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ReportBugModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReportBugModal({ isOpen, onClose }: ReportBugModalProps) {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');

    // New Report Form
    const [description, setDescription] = useState('');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // User Reports List & Thread
    const [reports, setReports] = useState<BugReport[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
    const [messages, setMessages] = useState<ReportMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyFile, setReplyFile] = useState<File | null>(null);
    const [sendingReply, setSendingReply] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            loadUserReports();
        } else if (!isOpen) {
            setSelectedReport(null);
            setReplyText('');
            setReplyFile(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user?.id]);

    const loadUserReports = async () => {
        if (!user?.id) return;
        setLoadingReports(true);
        const { data } = await BugReportService.getUserReports(user.id);
        setReports(data);
        setLoadingReports(false);
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
            .channel(`ticket_${selectedReport.id}`)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !description.trim()) return;

        setIsSubmitting(true);
        try {
            let uploadedUrl: string | null = null;
            if (attachmentFile) {
                uploadedUrl = await BugReportService.uploadAttachment(attachmentFile);
            }

            const { error } = await BugReportService.reportBug(user.id, description, uploadedUrl);
            if (!error) {
                alert(t('profile.bugReportSuccess', 'Reporte enviado. Gracias por tu ayuda.'));
                setDescription('');
                setAttachmentFile(null);
                await loadUserReports();
                setActiveTab('list');
            } else {
                alert(t('common.error'));
            }
        } catch (err) {
            console.error(err);
            alert(t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport || (!replyText.trim() && !replyFile)) return;

        setSendingReply(true);
        try {
            let uploadedUrl: string | null = null;
            if (replyFile) {
                uploadedUrl = await BugReportService.uploadAttachment(replyFile);
            }

            const { error } = await BugReportService.sendMessage(selectedReport.id, replyText, uploadedUrl, false);
            if (!error) {
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

    const getStatusLabel = (status: string) => {
        if (status === 'completed') return { text: t('helpdesk.status.completed', 'Resuelto'), cls: 'bg-accent-green/15 text-accent-green border-accent-green/30' };
        if (status === 'in_progress') return { text: t('helpdesk.status.inProgress', 'En revisión'), cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
        return { text: t('helpdesk.status.pending', 'Pendiente'), cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-bg-side rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-accent-red/20">
                <header className="p-6 pb-4 flex items-center justify-between border-b border-divider-theme bg-accent-red/5">
                    <div className="flex items-center gap-3 text-accent-red">
                        {selectedReport ? (
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="p-1.5 rounded-xl bg-bg-sub text-text-main hover:text-accent-red transition"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        ) : (
                            <Bug size={24} />
                        )}
                        <h2 className="text-lg sm:text-xl font-black italic tracking-tighter uppercase leading-none">
                            {selectedReport
                                ? `${t('helpdesk.caseNumber', 'Caso')} #${selectedReport.id.slice(0, 8)}`
                                : t('profile.bugReportTitle', 'Centro de Ayuda y Reportes')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-all">
                        <X size={22} className="text-text-muted" />
                    </button>
                </header>

                {!selectedReport && (
                    <div className="flex gap-2 px-6 pt-3 border-b border-border-theme bg-bg-pop">
                        <button
                            type="button"
                            onClick={() => setActiveTab('new')}
                            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                                activeTab === 'new' ? 'border-accent-red text-accent-red' : 'border-transparent text-text-muted hover:text-text-main'
                            }`}
                        >
                            <PlusCircle size={14} /> {t('helpdesk.newReportTab', 'Nuevo Reporte')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('list')}
                            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                                activeTab === 'list' ? 'border-accent-red text-accent-red' : 'border-transparent text-text-muted hover:text-text-main'
                            }`}
                        >
                            <MessageSquare size={14} /> {t('helpdesk.myReportsTab', 'Mis Reportes')} ({reports.length})
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {selectedReport ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-bg-pop border border-border-theme space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-text-muted">
                                        {new Date(selectedReport.created_at).toLocaleString()}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusLabel(selectedReport.status).cls}`}>
                                        {getStatusLabel(selectedReport.status).text}
                                    </span>
                                </div>
                                <p className="text-sm text-text-main font-medium whitespace-pre-wrap">{selectedReport.description}</p>
                                {selectedReport.attachment_url && (
                                    <a href={selectedReport.attachment_url} target="_blank" rel="noreferrer" className="block mt-2">
                                        <img src={selectedReport.attachment_url} alt="Adjunto" className="max-h-44 rounded-xl border border-border-theme object-cover" />
                                    </a>
                                )}
                            </div>

                            {loadingMessages ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-accent-red" size={28} />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-xs text-text-muted italic py-6">
                                    {t('helpdesk.noMessagesYet', 'Aún no hay respuestas en este caso. Puedes agregar más detalles abajo.')}
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {messages.map((msg) => {
                                        const isStaff = Boolean(msg.is_staff) || msg.sender_id !== user?.id;
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isStaff ? 'items-start' : 'items-end'}`}>
                                                <div className={`max-w-[85%] rounded-2xl p-3.5 border ${
                                                    isStaff
                                                        ? 'bg-brand-primary/10 border-brand-primary/30 text-text-main'
                                                        : 'bg-bg-pop border-border-theme text-text-main'
                                                }`}>
                                                    <p className={`text-[10px] font-black uppercase mb-1 ${isStaff ? 'text-brand-primary' : 'text-text-muted'}`}>
                                                        {isStaff ? t('helpdesk.staffLabel', '🛡️ Soporte Ciudad Friki') : t('common.you', 'Tú')}
                                                    </p>
                                                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                    {msg.attachment_url && (
                                                        <a href={msg.attachment_url} target="_blank" rel="noreferrer" className="block mt-2">
                                                            <img src={msg.attachment_url} alt="Adjunto" className="max-h-40 rounded-xl border border-border-theme object-cover" />
                                                        </a>
                                                    )}
                                                    <span className="block text-[9px] text-text-muted mt-1 text-right">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'new' ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <p className="text-xs text-text-muted font-medium">
                                {t('profile.bugReportDesc', 'Describe detalladamente el problema, error o comportamiento inesperado que encontraste en la plataforma.')}
                            </p>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('profile.bugReportPlaceholder', '¿Qué sucedió? ¿Cómo podemos reproducirlo?')}
                                rows={5}
                                required
                                className="w-full bg-bg-sub border border-border-theme text-text-main rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-accent-red/50 focus:border-transparent outline-none transition-all resize-none"
                            />

                            <div>
                                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-pop border border-border-theme hover:border-accent-red/50 text-xs font-bold text-text-sub cursor-pointer transition">
                                    <ImageIcon size={16} className="text-accent-red" />
                                    <span>{attachmentFile ? attachmentFile.name : t('helpdesk.attachScreenshot', 'Adjuntar captura (Opcional)')}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setAttachmentFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                </label>
                                {attachmentFile && (
                                    <button
                                        type="button"
                                        onClick={() => setAttachmentFile(null)}
                                        className="ml-2 text-xs text-accent-red font-bold hover:underline"
                                    >
                                        {t('common.remove', 'Quitar')}
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !description.trim()}
                                className="w-full bg-accent-red hover:bg-red-600 disabled:opacity-50 text-text-inv font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                {t('common.send', 'Enviar')}
                            </button>
                        </form>
                    ) : loadingReports ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-accent-red" size={32} />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 text-text-muted text-xs font-bold">
                            {t('helpdesk.noUserReports', 'No has enviado reportes de soporte todavía.')}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reports.map(r => {
                                const st = getStatusLabel(r.status);
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setSelectedReport(r)}
                                        className="w-full text-left p-4 rounded-2xl bg-bg-pop border border-border-theme hover:border-accent-red/40 transition flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-text-muted">
                                                #{r.id.slice(0, 8)} • {new Date(r.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${st.cls}`}>
                                                {st.text}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-main font-bold line-clamp-2">{r.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedReport && (
                    <form onSubmit={handleSendReply} className="p-4 border-t border-border-theme bg-bg-pop flex items-center gap-2">
                        <label className="p-2.5 rounded-xl bg-bg-side border border-border-theme text-text-muted hover:text-accent-red cursor-pointer transition shrink-0" title={t('helpdesk.attachScreenshot', 'Adjuntar imagen')}>
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
                            placeholder={replyFile ? replyFile.name : t('helpdesk.replyPlaceholder', 'Escribe un mensaje...')}
                            className="flex-1 bg-bg-side border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-text-main focus:outline-none focus:border-accent-red"
                        />
                        <button
                            type="submit"
                            disabled={sendingReply || (!replyText.trim() && !replyFile)}
                            className="p-2.5 rounded-xl bg-accent-red hover:bg-red-600 disabled:opacity-50 text-white transition shrink-0 cursor-pointer"
                        >
                            {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
