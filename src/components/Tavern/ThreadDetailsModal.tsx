import { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Loader2, Send, Edit2, Trash2, Clock, Check, Share2, Flag, MoreHorizontal, Pencil, Heart, Pin, Lock, Unlock, Archive } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TavernService } from '../../services/TavernService';
import { TavernAdminService } from '../../services/TavernAdminService';
import type { TavernThread, TavernReply } from '../../types/tavern';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../config/avatars';
import ContentRenderer from './ContentRenderer';
import { shareContent, buildThreadShare, buildReplyShare } from '../../utils/shareContent';
import { toPng } from 'html-to-image';

interface ThreadDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    threadId: string | null;
    userRole?: string;
}

export function ThreadDetailsModal({ isOpen, onClose, threadId, userRole }: ThreadDetailsModalProps) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    const [thread, setThread] = useState<TavernThread | null>(null);
    const [replies, setReplies] = useState<TavernReply[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editReplyContent, setEditReplyContent] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [reportingId, setReportingId] = useState<string | null>(null); // id being reported
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportDone, setReportDone] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null); // which ... menu is open
    const [isSharing, setIsSharing] = useState(false);
    const detailCardRef = useRef<HTMLDivElement>(null); // For thread
    const repliesRefs = useRef<{[key: string]: HTMLDivElement | null}>({}); // For individual replies
    const menuRef = useRef<HTMLDivElement>(null);

    const handleShare = async (type: 'thread' | 'reply', replyId?: string, replyAuthor?: string, replyContent?: string) => {
        if (isSharing) return;
        
        const el = type === 'thread' ? detailCardRef.current : repliesRefs.current[replyId!];
        if (!el) return;

        setIsSharing(true);
        const computedStyle = window.getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--bg-primary').trim() || '#1e222a';
        const brandColor = computedStyle.getPropertyValue('--brand-primary').trim() || '#e1192f';

        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
            .share-hide { display: none !important; }
            .tavern-quote-capture { 
                padding: 30px !important; 
                background: ${bgColor} !important; 
                border: 3px solid ${brandColor} !important;
                border-radius: 32px !important;
                width: 530px !important;
                height: auto !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
            }
            .tavern-quote-capture::before {
                content: '${t('share.tavern.quoteHeader')}';
                position: absolute;
                top: 15px;
                right: 25px;
                font-size: 10px;
                font-weight: 900;
                color: ${brandColor}40;
                letter-spacing: 2px;
            }
        `;
        document.head.appendChild(tempStyle);

        const hideElements = el.querySelectorAll('.share-hide-el');
        hideElements.forEach(item => (item as HTMLElement).style.display = 'none');
        el.classList.add('tavern-quote-capture');

        try {
            // Delay to allow styles to settle
            await new Promise(resolve => setTimeout(resolve, 200));

            const options = {
                backgroundColor: bgColor,
                pixelRatio: 2,
                width: 550,
                cacheBust: true,
                style: {
                    borderRadius: '32px'
                }
            };

            let dataUrl;
            try {
                dataUrl = await toPng(el, options);
            } catch (err) {
                console.warn('Capture failed, retrying without images...', err);
                dataUrl = await toPng(el, {
                    ...options,
                    filter: (node: any) => {
                        if (node.tagName === 'IMG') return false;
                        if (node.classList?.contains('share-media-container')) return false;
                        return true;
                    }
                });
            }

            const resp = await fetch(dataUrl);
            const blob = await resp.blob();

            if (blob) {
                const fileName = type === 'thread' ? `post-${thread!.id.substring(0,8)}.png` : `reply-${replyId!.substring(0,8)}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });
                
                const shareText = type === 'thread' 
                    ? i18n.t('share.tavern.joinDebate') + '\n\n' + i18n.t('share.tavern.readFullThread')
                    : i18n.t('share.tavern.userResponded', { author: replyAuthor, title: thread!.title }) + '\n\n"' + replyContent?.substring(0, 100) + '..."\n\n' + i18n.t('share.tavern.readFullResponse');

                await shareContent({
                    title: type === 'thread' ? thread!.title : t('share.tavern.responseBy', { author: replyAuthor }),
                    text: shareText,
                    url: window.location.origin + `/tavern?thread=${thread!.id}${type === 'reply' ? `&reply=${replyId}` : ''}`,
                    file
                });
            }
        } catch (error) {
            console.error('Final tavern quote share error:', error);
            // Fallback
            const opts = type === 'thread' || !thread
                ? buildThreadShare(thread!)
                : buildReplyShare({
                    threadId: thread!.id,
                    replyId: replyId!,
                    author_username: replyAuthor,
                    content: replyContent!,
                    threadTitle: thread!.title,
                });
            shareContent(opts);
        } finally {
            hideElements.forEach(item => (item as HTMLElement).style.display = '');
            el.classList.remove('tavern-quote-capture');
            document.head.removeChild(tempStyle);
            setIsSharing(false);
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Close any open menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        if (openMenuId) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [openMenuId]);

    useEffect(() => {
        if (isOpen && threadId) {
            fetchThreadDetails();
        } else {
            setThread(null);
            setReplies([]);
        }
    }, [isOpen, threadId]);

    const fetchThreadDetails = async () => {
        if (!threadId) return;
        setIsLoading(true);
        try {
            const { thread: threadData, error: threadError } = await TavernService.getThreadById(threadId);
            if (threadError) throw threadError;
            setThread(threadData);

            const { replies: repliesData, error: repliesError } = await TavernService.getReplies(threadId);
            if (repliesError) throw repliesError;
            setReplies(repliesData);

        } catch (error) {
            console.error('Error fetching thread details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !thread || !replyContent.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await TavernService.createReply({
                thread_id: thread.id,
                content: replyContent.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''),
            });

            if (error) throw error;
            setReplyContent('');
            fetchThreadDetails();
        } catch (error) {
            console.error('Error submitting reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditReply = async (replyId: string) => {
        if (!editReplyContent.trim()) return;
        setIsSubmitting(true);
        try {
            // Uses RPC edit_tavern_post (mirrors app's editPost)
            const { error } = await TavernService.editPost(replyId, 'reply', editReplyContent.trim());
            if (error) throw error;
            setEditingReplyId(null);
            fetchThreadDetails();
        } catch (error) {
            console.error('Error updating reply:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteReply = async (replyId: string) => {
        if (!window.confirm(t('tavern.modals.details.deleteReplyConfirm'))) return;
        try {
            await TavernService.deleteReply(replyId);
            fetchThreadDetails();
        } catch (error) {
            console.error('Error deleting reply:', error);
        }
    };

    const canEditReply = (reply: TavernReply) => {
        if (!user) return false;
        const isCurrentUserAdmin = userRole === 'admin' || userRole === 'moderator';
        if (isCurrentUserAdmin) return true;
        if (user.id !== reply.author_id) return false;
        const created = new Date(reply.created_at).getTime();
        const now = currentTime.getTime();
        const diff = now - created;
        return diff < 5 * 60 * 1000; // 5 minutes
    };

    const getRemainingTime = (dateStr: string) => {
        const created = new Date(dateStr).getTime();
        const now = currentTime.getTime();
        const remaining = Math.max(0, (5 * 60 * 1000) - (now - created));
        const seconds = Math.floor(remaining / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };


    const handleVote = async (targetId: string, targetType: 'thread' | 'reply', interactionType: 'like' | 'dislike') => {
        if (!user) return alert(t('tavern.loginToVote'));
        try {
            const { error } = await TavernService.interact(targetId, targetType, interactionType);
            if (error) throw error;
            fetchThreadDetails();
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    const handleReport = async () => {
        if (!reportingId || !reportReason.trim() || !user) return;
        setReportSubmitting(true);
        try {
            const isThread = reportingId === thread?.id;
            await TavernService.interact(reportingId, isThread ? 'thread' : 'reply', 'report', reportReason.trim());
            setReportDone(true);
            setTimeout(() => {
                setReportingId(null);
                setReportDone(false);
                setReportReason('');
            }, 1800);
        } catch (err) {
            console.error('Error reporting:', err);
        } finally {
            setReportSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const handleToggleLock = async () => {
        if (!thread) return;
        setOpenMenuId(null);
        setIsLoading(true);
        const { error } = thread.is_locked 
            ? await TavernAdminService.unlockThread(thread.id)
            : await TavernAdminService.lockThread(thread.id);
        
        if (error) {
            alert('Error al cambiar el estado del hilo');
        } else {
            setThread(prev => prev ? { ...prev, is_locked: !prev.is_locked } : prev);
        }
        setIsLoading(false);
    };

    const handleToggleArchive = async () => {
        if (!thread) return;
        if (!confirm('¿Seguro que deseas archivar este hilo? No se podrá desarchivar desde aquí.')) return;
        setOpenMenuId(null);
        setIsLoading(true);
        const { error } = await TavernAdminService.archiveThread(thread.id);
        
        if (error) {
            alert('Error al archivar el hilo');
        } else {
            setThread(prev => prev ? { ...prev, is_archived: true, is_locked: true } : prev);
            alert('Hilo archivado correctamente.');
            onClose(); // Cerrar modal porque ya no debería verse normalmente
        }
        setIsLoading(false);
    };

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm"
                onClick={onClose}
            >
                <div
                    className="bg-bg-side w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border-theme"
                    onClick={(e) => e.stopPropagation()}
                >

                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-divider-theme">
                        <h2 className="text-lg font-bold text-text-main truncate pr-8">
                            {thread?.title || t('tavern.modals.details.loading')}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-full transition text-text-sub absolute top-3 right-4">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading && !thread ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
                        ) : thread ? (
                            <div className="p-6" ref={detailCardRef}>
                                {/* Author Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={getAvatarSource(thread.author_avatar_url || null)}
                                        className="h-10 w-10 rounded-full border border-border-theme"
                                        alt="Avatar"
                                    />
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-bold text-sm text-text-main">{thread.author_username}</span>
                                            {thread.author_role === 'admin' && (
                                                <span className="text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-1.5 rounded font-bold uppercase">Admin</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-text-muted">{new Date(thread.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        {thread.is_pinned && (
                                            <span className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-accent-yellow/20 border border-accent-yellow/40 text-accent-yellow" title="Fijado">
                                                <Pin size={12} className="rotate-45 fill-current" />
                                            </span>
                                        )}
                                        <span className="px-3 py-1 rounded-full bg-bg-sub text-text-muted text-[10px] font-bold uppercase">
                                            {thread.tag}
                                        </span>
                                    </div>
                                </div>

                                {/* Thread Content */}
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold text-text-main mb-4 leading-tight">{thread.title}</h1>
                                    <div className="flex gap-2 mb-3">
                                        {thread.is_locked && (
                                            <span className="flex items-center gap-1 text-[10px] bg-accent-red/10 text-accent-red border border-accent-red/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                <Lock size={10} /> {t('tavern.status.locked', 'Cerrado')}
                                            </span>
                                        )}
                                        {thread.is_archived && (
                                            <span className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                <Archive size={10} /> {t('tavern.status.archived', 'Archivado')}
                                            </span>
                                        )}
                                    </div>
                                    <ContentRenderer
                                        content={thread.content}
                                        className="text-text-main leading-relaxed"
                                    />
                                    {(thread.is_edited || thread.edited_by_admin) && (
                                        <div className={`flex items-center gap-1 text-[10px] font-semibold mt-3 ${thread.edited_by_admin ? 'text-accent-yellow' : 'text-text-muted'
                                            }`}>
                                            <Pencil size={10} />
                                            {thread.edited_by_admin
                                                ? t('tavern.thread.editedByAdmin')
                                                : t('tavern.thread.edited')}
                                        </div>
                                    )}
                                </div>

                                {/* Stats & Actions */}
                                <div className="flex items-center gap-4 py-4 border-y border-divider-theme mb-8">
                                    <div className="flex items-center bg-bg-sub rounded-full px-2.5 py-1">
                                        <button onClick={() => handleVote(thread.id, 'thread', 'like')} className={`share-hide-el p-1.5 transition ${thread.user_vote === 'like' ? 'text-accent-red' : 'text-text-muted hover:text-accent-red'}`}>
                                            <Heart size={18} fill={thread.user_vote === 'like' ? 'var(--accent-red)' : 'none'} className={thread.user_vote === 'like' ? 'text-accent-red' : 'text-text-muted'} />
                                        </button>
                                        <span className="font-bold text-sm px-2 text-text-main">{thread.likes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                                        <MessageSquare size={18} /> {replies.length} {t('tavern.modals.details.replies')}
                                    </div>
                                    <button
                                        onClick={() => handleShare('thread')}
                                        disabled={isSharing}
                                        className={`share-hide-el flex items-center gap-2 text-sm font-medium transition ${isSharing ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                                    >
                                        {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                                        {isSharing ? t('common.sharing') : t('tavern.modals.details.share')}
                                    </button>
                                    {/* Report thread / Admin actions */}
                                    {(user && user.id !== thread.author_id) || userRole === 'admin' ? (
                                        <div className="share-hide-el relative ml-auto" ref={openMenuId === thread.id ? menuRef : undefined}>
                                            <button
                                                onClick={() => setOpenMenuId(id => id === thread.id ? null : thread.id)}
                                                className="p-1.5 text-text-muted hover:text-text-main rounded-full hover:bg-bg-sub transition"
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                            {openMenuId === thread.id && (
                                                <div className="absolute right-0 bottom-full mb-1 w-48 bg-bg-pop border border-border-theme rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                                    {user && user.id !== thread.author_id && (
                                                        <button
                                                            onClick={() => { setOpenMenuId(null); setReportingId(thread.id); }}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-text-muted hover:text-accent-red hover:bg-accent-red/5 transition"
                                                        >
                                                            <Flag size={14} />
                                                            {t('tavern.thread.report')}
                                                        </button>
                                                    )}
                                                    {userRole === 'admin' && (
                                                        <>
                                                            <div className="h-px bg-divider-theme w-full" />
                                                            <button
                                                                onClick={handleToggleLock}
                                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-text-muted hover:text-brand-primary hover:bg-brand-primary/5 transition"
                                                            >
                                                                {thread.is_locked ? <><Unlock size={14} /> Abrir Hilo</> : <><Lock size={14} /> Cerrar Hilo</>}
                                                            </button>
                                                            {!thread.is_archived && (
                                                                <button
                                                                    onClick={handleToggleArchive}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-orange-500 hover:bg-orange-500/5 transition"
                                                                >
                                                                    <Archive size={14} /> Archivar Hilo
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Replies List */}
                                <div className="space-y-6">
                                    <h3 className="font-bold text-text-main mb-4">{t('tavern.modals.details.replies')}</h3>
                                    {replies.length === 0 ? (
                                        <div className="text-center text-text-muted py-8 italic">{t('tavern.modals.details.noReplies')}</div>
                                    ) : (
                                        replies.map(reply => (
                                            <div key={reply.id} ref={el => { repliesRefs.current[reply.id] = el; }} className="flex gap-3 pt-4 border-t border-divider-theme">
                                                <img
                                                    src={getAvatarSource(reply.author_avatar_url || null)}
                                                    className="h-8 w-8 rounded-full flex-shrink-0"
                                                    alt="Avatar"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm text-text-main">{reply.author_username}</span>
                                                        <span className="text-[10px] text-text-muted">{new Date(reply.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {editingReplyId === reply.id ? (
                                                        <div className="flex flex-col gap-2 mb-3">
                                                            <textarea
                                                                value={editReplyContent}
                                                                onChange={(e) => setEditReplyContent(e.target.value)}
                                                                className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition resize-none"
                                                                rows={3}
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => setEditingReplyId(null)}
                                                                    className="px-3 py-1 text-xs font-bold text-text-muted hover:bg-bg-sub rounded-lg transition"
                                                                >
                                                                    {t('common.cancel')}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditReply(reply.id)}
                                                                    disabled={isSubmitting}
                                                                    className="px-4 py-1.5 bg-brand-primary text-text-inv text-xs font-bold rounded-lg shadow-md hover:bg-brand-primary-light transition flex items-center gap-1"
                                                                >
                                                                    {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                                    {t('common.save')}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <ContentRenderer
                                                                content={reply.content}
                                                                className="text-text-sub text-sm mb-3"
                                                            />
                                                            {(reply.is_edited || reply.edited_by_admin) && (
                                                                <div className={`flex items-center gap-1 text-[10px] font-semibold mb-2 ${reply.edited_by_admin ? 'text-accent-yellow' : 'text-text-muted'
                                                                    }`}>
                                                                    <Pencil size={10} />
                                                                    {reply.edited_by_admin
                                                                        ? t('tavern.thread.editedByAdmin')
                                                                        : t('tavern.thread.edited')}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-4 mr-auto">
                                                             <button onClick={() => handleVote(reply.id, 'reply', 'like')} className={`share-hide-el flex items-center gap-1.5 transition text-xs ${reply.user_vote === 'like' ? 'text-accent-red font-bold' : 'text-text-muted hover:text-accent-red'}`}>
                                                                 <Heart size={14} fill={reply.user_vote === 'like' ? 'var(--accent-red)' : 'none'} className={reply.user_vote === 'like' ? 'text-accent-red' : 'text-text-muted'} /> {reply.likes_count}
                                                             </button>
                                                              <button
                                                                onClick={() => handleShare('reply', reply.id, reply.author_username, reply.content)}
                                                                disabled={isSharing}
                                                                className={`share-hide-el flex items-center gap-1 transition text-xs ${isSharing ? 'text-brand-primary' : 'text-text-muted hover:text-brand-primary'}`}
                                                                title={t('tavern.modals.details.share')}
                                                            >
                                                                {isSharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                                                            </button>
                                                            {/* Report reply — only for non-authors (Hidden during capture) */}
                                                            {user && user.id !== reply.author_id && (
                                                                <div className="share-hide-el relative" ref={openMenuId === reply.id ? menuRef : undefined}>
                                                                    <button
                                                                        onClick={() => setOpenMenuId(id => id === reply.id ? null : reply.id)}
                                                                        className="p-1 text-text-muted hover:text-text-main rounded-full hover:bg-bg-sub transition"
                                                                    >
                                                                        <MoreHorizontal size={14} />
                                                                    </button>
                                                                    {openMenuId === reply.id && (
                                                                        <div className="absolute right-0 bottom-full mb-1 w-40 bg-bg-pop border border-border-theme rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                                                            <button
                                                                                onClick={() => { setOpenMenuId(null); setReportingId(reply.id); }}
                                                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-text-muted hover:text-accent-red hover:bg-accent-red/5 transition"
                                                                            >
                                                                                <Flag size={14} />
                                                                                {t('tavern.thread.report')}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                         {canEditReply(reply) && !editingReplyId && (
                                                            <div className="share-hide-el flex items-center gap-2">
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-accent-yellow bg-accent-yellow/10 px-2 py-1 rounded-md border border-accent-yellow/20">
                                                                    <Clock size={10} />
                                                                    {getRemainingTime(reply.created_at)}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingReplyId(reply.id);
                                                                        setEditReplyContent(reply.content);
                                                                    }}
                                                                    className="p-1.5 text-text-muted hover:text-brand-primary transition"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteReply(reply.id)}
                                                                    className="p-1.5 text-text-muted hover:text-accent-red transition"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Reply Input */}
                    <div className="p-4 border-t border-divider-theme bg-bg-sub/50">
                        {thread?.is_locked ? (
                            <div className="text-center text-sm font-bold text-accent-red/80 py-3 bg-accent-red/10 rounded-xl border border-accent-red/20">
                                <Lock size={16} className="inline-block mr-2" />
                                {t('tavern.status.lockedMessage', 'Este hilo ha sido cerrado y no admite nuevas respuestas.')}
                            </div>
                        ) : user ? (
                            <form onSubmit={handleReplySubmit} className="flex gap-3">
                                <input
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={t('tavern.modals.details.replyPlaceholder')}
                                    className="flex-1 bg-bg-side border border-border-theme rounded-full px-4 py-2 text-sm text-text-main focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !replyContent.trim()}
                                    className="bg-brand-primary hover:bg-brand-primary-light disabled:opacity-50 text-text-inv p-2 rounded-full transition shadow-lg shadow-brand-primary/20"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center text-sm text-text-muted py-2">{t('tavern.modals.details.loginToReply')}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {reportingId && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm"
                    onClick={() => { setReportingId(null); setReportReason(''); setReportDone(false); }}
                >
                    <div
                        className="bg-bg-side w-full max-w-sm rounded-2xl border border-border-theme shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {reportDone ? (
                            <div className="text-center py-4">
                                <Check size={36} className="mx-auto mb-3 text-accent-green" />
                                <p className="font-bold text-text-main">{t('tavern.reportSent')}</p>
                                <p className="text-xs text-text-muted mt-1">{t('tavern.reportThanks')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 bg-accent-red/10 text-accent-red rounded-xl">
                                        <Flag size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-main text-base">{t('tavern.reportTitle')}</h3>
                                        <p className="text-xs text-text-muted">{t('tavern.reportSubtitle')}</p>
                                    </div>
                                </div>
                                <textarea
                                    value={reportReason}
                                    onChange={e => setReportReason(e.target.value)}
                                    placeholder={t('tavern.reportPlaceholder')}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-accent-red transition resize-none mb-4"
                                    rows={3}
                                    maxLength={300}
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setReportingId(null); setReportReason(''); }}
                                        className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest text-text-muted border border-border-theme rounded-xl hover:bg-bg-sub transition"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={!reportReason.trim() || reportSubmitting}
                                        className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest bg-accent-red text-white rounded-xl hover:bg-accent-red/80 disabled:opacity-50 transition"
                                    >
                                        {reportSubmitting ? '...' : t('tavern.report')}
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
