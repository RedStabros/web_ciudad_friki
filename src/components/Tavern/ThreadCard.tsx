import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronDown, MessageSquare, MoreHorizontal, Edit2, Shield, Trash2, Clock, Share2, Check, Flag, Pencil } from 'lucide-react';
import type { TavernThread } from '../../types/tavern';
import { getAvatarSource } from '../../config/avatars';
import ContentRenderer from './ContentRenderer';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { shareContent, buildThreadShare, registerCopiedCallback } from '../../utils/shareContent';
import { TavernService } from '../../services/TavernService';

interface ThreadCardProps {
    thread: TavernThread;
    onVote?: (type: 'like' | 'dislike') => void;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function ThreadCard({ thread, onVote, onClick, onEdit, onDelete }: ThreadCardProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [reportModal, setReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);
    const [reportDone, setReportDone] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const timeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return t('tavern.thread.time.moments');
        if (diffInSeconds < 3600) return t('tavern.thread.time.min', { count: Math.floor(diffInSeconds / 60) });
        if (diffInSeconds < 86400) return t('tavern.thread.time.h', { count: Math.floor(diffInSeconds / 3600) });
        return date.toLocaleDateString();
    };

    useEffect(() => {
        const calculateTimeLeft = () => {
            const created = new Date(thread.created_at).getTime();
            const now = new Date().getTime();
            const fiveMin = 5 * 60 * 1000;
            const remaining = Math.max(0, (created + fiveMin) - now);
            setTimeLeft(Math.floor(remaining / 1000));
        };
        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [thread.created_at]);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [menuOpen]);

    const isAuthor = user?.id === thread.author_id;
    const isWithin5Min = timeLeft !== null && timeLeft > 0;
    const hasNoReplies = (thread.reply_count || 0) === 0;
    const canEdit = isAuthor && isWithin5Min && hasNoReplies;
    const canReport = !!user && !isAuthor;
    const isAdmin = thread.author_role === 'admin' || thread.author_role === 'moderator';
    const showMenu = canEdit || canReport;

    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        registerCopiedCallback(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
        });
        shareContent(buildThreadShare(thread));
    };

    const handleReport = async () => {
        if (!user || !reportReason.trim()) return;
        setReporting(true);
        try {
            await TavernService.interact(thread.id, 'thread', 'report', reportReason.trim());
            setReportDone(true);
            setTimeout(() => {
                setReportModal(false);
                setReportDone(false);
                setReportReason('');
            }, 1800);
        } catch (err) {
            console.error('Error reporting:', err);
        } finally {
            setReporting(false);
        }
    };

    return (
        <>
            <article className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden hover:border-brand-primary/30 transition duration-200">
                <div className="p-5">
                    {/* Author header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-bg-sub border border-border-theme overflow-hidden relative">
                                <img
                                    alt={thread.author_username || 'User'}
                                    className="h-full w-full object-cover"
                                    src={getAvatarSource(thread.author_avatar_url || null)}
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-sm text-text-main">
                                        {thread.author_username || t('common.user')}
                                    </span>
                                    {isAdmin && (
                                        <span className="flex items-center gap-0.5 text-brand-primary text-[10px] font-bold ml-1 px-1.5 py-0.5 border border-brand-primary/20 bg-brand-primary/10 rounded uppercase">
                                            <Shield size={10} /> {thread.author_role}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-text-muted flex items-center gap-1">
                                    <span>{timeAgo(thread.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tag badge */}
                    <span className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] uppercase font-bold">
                        {thread.tag}
                    </span>
                </div>

                {/* Content */}
                <div className="mb-4 cursor-pointer px-5" onClick={onClick}>
                    <h3 className="text-lg font-bold text-text-main mb-2 leading-tight">
                        {thread.title}
                    </h3>
                    <ContentRenderer
                        content={thread.content}
                        className="text-text-sub text-sm mb-3 line-clamp-3"
                    />
                    {/* Edited / Edited by Admin badge */}
                    {(thread.is_edited || thread.edited_by_admin) && (
                        <div className={`flex items-center gap-1 text-[10px] font-semibold mt-1 ${thread.edited_by_admin ? 'text-accent-yellow' : 'text-text-muted'
                            }`}>
                            <Pencil size={10} />
                            {thread.edited_by_admin
                                ? t('tavern.thread.editedByAdmin', 'Editado por un administrador')
                                : t('tavern.thread.edited')}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-divider-theme px-5 pb-3">
                    <div className="flex items-center gap-4">
                        {/* Karma buttons */}
                        <div className="flex items-center bg-bg-sub/50 rounded-full px-2 py-1">
                            <button
                                onClick={() => onVote?.('like')}
                                className={`p-1 rounded-full transition ${thread.user_vote === 'like' ? 'text-accent-red bg-accent-red/10' : 'text-text-muted hover:text-accent-red hover:bg-accent-red/10'}`}
                            >
                                <ChevronUp size={18} fill={thread.user_vote === 'like' ? 'currentColor' : 'none'} />
                            </button>
                            <span className={`font-bold text-sm px-2 ${thread.likes_count - thread.dislikes_count >= 0 ? 'text-brand-primary' : 'text-accent-red'}`}>
                                {thread.likes_count - thread.dislikes_count}
                            </span>
                            <button
                                onClick={() => onVote?.('dislike')}
                                className={`p-1 rounded-full transition ${thread.user_vote === 'dislike' ? 'text-blue-500 bg-blue-500/10' : 'text-text-muted hover:text-blue-500 hover:bg-blue-500/10'}`}
                            >
                                <ChevronDown size={18} fill={thread.user_vote === 'dislike' ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* Reply count */}
                        <button className="flex items-center gap-2 text-text-sub hover:text-brand-primary transition group" onClick={onClick}>
                            <MessageSquare size={18} className="group-hover:text-brand-primary" />
                            <span className="text-sm font-medium">{thread.reply_count || 0} {t('tavern.thread.reply')}</span>
                        </button>

                        {/* Share */}
                        <button
                            className={`flex items-center gap-2 transition group ${copied ? 'text-accent-green' : 'text-text-sub hover:text-brand-primary'}`}
                            onClick={handleShare}
                            title={copied ? t('common.linkCopied', '¡Enlace copiado!') : t('tavern.thread.share')}
                        >
                            {copied ? <Check size={18} /> : <Share2 size={18} className="group-hover:text-brand-primary" />}
                            <span className="text-sm font-medium">{copied ? t('common.linkCopied', '¡Copiado!') : t('tavern.thread.share')}</span>
                        </button>
                    </div>

                    {/* 3-dot context menu */}
                    {showMenu && (
                        <div className="relative" ref={menuRef}>
                            {canEdit && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-yellow bg-accent-yellow/10 px-2 py-1 rounded-md border border-accent-yellow/20 mr-1">
                                    <Clock size={11} />
                                    {formatTimeLeft(timeLeft!)}
                                </span>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
                                className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-sub transition"
                            >
                                <MoreHorizontal size={16} />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 bottom-full mb-1 w-44 bg-bg-pop border border-border-theme rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-bottom-right">
                                    {canEdit && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-text-main hover:bg-bg-sub transition"
                                            >
                                                <Edit2 size={15} className="text-brand-primary" />
                                                {t('tavern.thread.edit')}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-accent-red hover:bg-accent-red/10 transition"
                                            >
                                                <Trash2 size={15} />
                                                {t('tavern.thread.delete')}
                                            </button>
                                        </>
                                    )}
                                    {canReport && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setReportModal(true); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-text-muted hover:text-accent-red hover:bg-accent-red/5 transition"
                                        >
                                            <Flag size={15} />
                                            {t('tavern.thread.report', 'Reportar')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </article>

            {/* Report Modal */}
            {reportModal && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm"
                    onClick={() => setReportModal(false)}
                >
                    <div
                        className="bg-bg-side w-full max-w-sm rounded-2xl border border-border-theme shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {reportDone ? (
                            <div className="text-center py-4">
                                <Check size={36} className="mx-auto mb-3 text-accent-green" />
                                <p className="font-bold text-text-main">{t('tavern.reportSent', '¡Reporte enviado!')}</p>
                                <p className="text-xs text-text-muted mt-1">{t('tavern.reportThanks', 'Gracias por ayudar a mantener la comunidad.')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 bg-accent-red/10 text-accent-red rounded-xl">
                                        <Flag size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-base">{t('tavern.reportTitle', 'Reportar publicación')}</h3>
                                        <p className="text-xs text-text-muted">{t('tavern.reportSubtitle', 'Cuéntanos por qué consideras que viola las reglas.')}</p>
                                    </div>
                                </div>
                                <textarea
                                    value={reportReason}
                                    onChange={e => setReportReason(e.target.value)}
                                    placeholder={t('tavern.reportPlaceholder', 'Ej: Spam, contenido inapropiado, acoso...')}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-accent-red transition resize-none mb-4"
                                    rows={3}
                                    maxLength={300}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setReportModal(false)}
                                        className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest text-text-muted border border-border-theme rounded-xl hover:bg-bg-sub transition"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={!reportReason.trim() || reporting}
                                        className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-accent-red text-white rounded-xl hover:bg-accent-red/80 disabled:opacity-50 transition"
                                    >
                                        {reporting ? '...' : t('tavern.report', 'Reportar')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
