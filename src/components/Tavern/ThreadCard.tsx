import { useTranslation } from 'react-i18next';
import { MessageSquare, MoreHorizontal, Edit2, Shield, Trash2, Clock, Share2, Check, Flag, Pencil, Loader2, Heart, Pin, Lock, Archive } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { TavernThread } from '../../types/tavern';
import { getAvatarSource } from '../../config/avatars';
import ContentRenderer from './ContentRenderer';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { shareContent, buildThreadShare } from '../../utils/shareContent';
import { TavernService } from '../../services/TavernService';

interface ThreadCardProps {
    thread: TavernThread;
    onVote?: (type: 'like' | 'dislike') => void;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    userRole?: string;
}

export function ThreadCard({ thread, onVote, onClick, onEdit, onDelete, userRole }: ThreadCardProps) {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [reportModal, setReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reporting, setReporting] = useState(false);
    const [reportDone, setReportDone] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const cardRef = useRef<HTMLElement>(null);
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
    const isCurrentUserAdmin = userRole === 'admin' || userRole === 'moderator';
    const canEdit = isCurrentUserAdmin || (isAuthor && isWithin5Min && hasNoReplies);
    const canReport = !!user && !isAuthor;
    const isAdmin = thread.author_role === 'admin' || thread.author_role === 'moderator';
    const showMenu = canEdit || canReport;

    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!cardRef.current || isSharing) return;
        setIsSharing(true);
        const el = cardRef.current;

        const computedStyle = window.getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--bg-primary').trim() || '#1e222a';
        const brandColor = computedStyle.getPropertyValue('--brand-primary').trim() || '#e1192f';

        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
            .share-hide { display: none !important; }
            .tavern-capture { 
                padding: 30px !important; 
                background: ${bgColor} !important; 
                border: 3px solid ${brandColor} !important;
                border-radius: 32px !important;
                width: 480px !important;
                height: auto !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
            }
            .tavern-capture::before {
                content: '${t('share.tavern.captureHeader')}';
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
        el.classList.add('tavern-capture');

        try {
            // Delay to allow DOM to settle
            await new Promise(resolve => setTimeout(resolve, 200));

            const options = {
                backgroundColor: bgColor,
                pixelRatio: 2,
                width: 500,
                cacheBust: true,
                style: {
                    borderRadius: '32px'
                }
            };

            let dataUrl;
            try {
                dataUrl = await toPng(el, options);
            } catch (err) {
                console.warn('First share attempt failed, trying without images...', err);
                // Second attempt: Filter out images and their containers
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
                const file = new File([blob], `thread-${thread.id.substring(0, 8)}.png`, { type: 'image/png' });
                await shareContent({
                    title: `📖 ${thread.title} | ${t('share.tavern.title')}`,
                    text: `${i18n.t('share.tavern.joinConversation')}\n\n${i18n.t('share.tavern.readFullThread')}`,
                    url: window.location.origin + `/tavern?thread=${thread.id}`,
                    file
                });
            }
        } catch (error) {
            console.error('Final share error fallback:', error);
            shareContent(buildThreadShare(thread));
        } finally {
            hideElements.forEach(item => (item as HTMLElement).style.display = '');
            el.classList.remove('tavern-capture');
            document.head.removeChild(tempStyle);
            setIsSharing(false);
        }
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
            <article 
                ref={cardRef} 
                className={`bg-bg-side rounded-xl shadow-sm border overflow-hidden transition duration-200 ${
                    thread.is_pinned 
                        ? 'border-accent-yellow border-[1.5px]' 
                        : 'border-border-theme hover:border-brand-primary/30'
                }`}
            >
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

                    {/* Tag badge with optional Pin icon */}
                    <div className="flex items-center gap-2">
                        {thread.is_pinned && (
                            <span className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-accent-yellow/20 border border-accent-yellow/40 text-accent-yellow" title="Fijado">
                                <Pin size={12} className="rotate-45 fill-current" />
                            </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] uppercase font-bold">
                            {thread.tag}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="mb-4 cursor-pointer px-5" onClick={onClick}>
                    <h3 className="text-lg font-bold text-text-main mb-2 leading-tight flex items-start gap-1.5">
                        {thread.is_locked && (
                            <span title={t('tavern.status.locked', 'Cerrado')} className="mt-1">
                                <Lock size={14} className="text-accent-red" />
                            </span>
                        )}
                        {thread.is_archived && (
                            <span title={t('tavern.status.archived', 'Archivado')} className="mt-1">
                                <Archive size={14} className="text-orange-500" />
                            </span>
                        )}
                        <span>{thread.title}</span>
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
                                ? t('tavern.thread.editedByAdmin')
                                : t('tavern.thread.edited')}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-divider-theme px-5 pb-3">
                    <div className="flex items-center gap-4">
                        {/* Likes (Corazón) */}
                        <div className="flex items-center bg-bg-sub/50 rounded-full px-2.5 py-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); onVote?.('like'); }}
                                className="share-hide-el p-1 rounded-full text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition"
                            >
                                <Heart 
                                    size={18} 
                                    fill={thread.user_vote === 'like' ? 'var(--accent-red)' : 'none'} 
                                    className={thread.user_vote === 'like' ? 'text-accent-red' : 'text-text-muted'} 
                                />
                            </button>
                            <span className="font-bold text-sm px-2 text-text-main">
                                {thread.likes_count}
                            </span>
                        </div>

                        {/* Reply count */}
                        <div className="flex items-center gap-2 text-text-sub font-medium">
                            <MessageSquare size={18} />
                            <span className="text-sm">{thread.reply_count || 0} {t('tavern.thread.reply')}</span>
                        </div>

                        {/* Share (Hidden during capture) */}
                        <button
                            className="share-hide-el flex items-center gap-2 transition group text-text-sub hover:text-brand-primary"
                            onClick={handleShare}
                            disabled={isSharing}
                            title={t('tavern.thread.share')}
                        >
                            {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} className="group-hover:text-brand-primary" />}
                            <span className="text-sm font-medium">{isSharing ? t('common.sharing') : t('tavern.thread.share')}</span>
                        </button>
                    </div>

                    {/* 3-dot context menu (Hidden during capture) */}
                    <div className="share-hide-el">
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
                                            {t('tavern.thread.report')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
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
                                        {reporting ? '...' : t('tavern.report')}
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
