import { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, MessageSquare, Loader2, Send, Shield, Edit2, Trash2, Clock, Check, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TavernService } from '../../services/TavernService';
import type { TavernThread, TavernReply } from '../../types/tavern';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../config/avatars';
import { supabase } from '../../lib/supabase';
import { ContentRenderer } from './ContentRenderer';

interface ThreadDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    threadId: string | null;
}

export function ThreadDetailsModal({ isOpen, onClose, threadId }: ThreadDetailsModalProps) {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [thread, setThread] = useState<TavernThread | null>(null);
    const [replies, setReplies] = useState<TavernReply[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editReplyContent, setEditReplyContent] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

            // In a real app we'd also fetch replies here
            // For now, let's assume getThreadById might include some or we have a getReplies
            const { data: repliesData, error: repliesError } = await (supabase as any)
                .from('tavern_replies')
                .select(`
                    *,
                    profiles:author_id(username, avatar_url, role)
                `)
                .eq('thread_id', threadId)
                .eq('is_hidden', false)
                .order('created_at', { ascending: true });

            if (repliesError) throw repliesError;
            setReplies(repliesData.map((r: any) => ({
                ...r,
                author_username: r.profiles?.username,
                author_avatar_url: r.profiles?.avatar_url,
                author_role: r.profiles?.role,
            })));

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
            const { error } = await (supabase as any)
                .from('tavern_replies')
                .insert({
                    thread_id: thread.id,
                    author_id: user.id,
                    content: replyContent.trim()
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
            const { error } = await TavernService.updateReply(replyId, editReplyContent.trim());
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
        if (!user || user.id !== reply.author_id) return false;
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

    const handleShare = (title: string, content: string, replyId?: string) => {
        let url = `${window.location.origin}/tavern?thread=${thread?.id}`;
        if (replyId) url += `&reply=${replyId}`;

        if (navigator.share) {
            navigator.share({
                title: title,
                text: content.substring(0, 100),
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            alert(t('common.copied', 'Enlace copiado al portapapeles'));
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm shadow-2xl"
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
                        <div className="p-6">
                            {/* Author Info */}
                            <div className="flex items-center gap-3 mb-4">
                                <img
                                    src={getAvatarSource(thread.author_avatar_url)}
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
                                <span className="ml-auto px-3 py-1 rounded-full bg-bg-sub text-text-muted text-[10px] font-bold uppercase">
                                    {thread.tag}
                                </span>
                            </div>

                            {/* Thread Content */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-text-main mb-4 leading-tight">{thread.title}</h1>
                                <ContentRenderer
                                    content={thread.content}
                                    className="text-text-main leading-relaxed"
                                />
                            </div>

                            {/* Stats & Actions */}
                            <div className="flex items-center gap-4 py-4 border-y border-divider-theme mb-8">
                                <div className="flex items-center bg-bg-sub rounded-full px-2 py-1">
                                    <button onClick={() => handleVote(thread.id, 'thread', 'like')} className="p-1.5 text-text-muted hover:text-accent-red transition">
                                        <ArrowUp size={18} fill={thread.user_vote === 'like' ? 'currentColor' : 'none'} />
                                    </button>
                                    <span className="font-bold text-sm px-2 text-text-main">{thread.likes_count - thread.dislikes_count}</span>
                                    <button onClick={() => handleVote(thread.id, 'thread', 'dislike')} className="p-1.5 text-text-muted hover:text-brand-secondary transition">
                                        <ArrowDown size={18} fill={thread.user_vote === 'dislike' ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
                                    <MessageSquare size={18} /> {replies.length} {t('tavern.modals.details.replies')}
                                </div>
                                <button
                                    onClick={() => handleShare(thread.title, thread.content)}
                                    className="flex items-center gap-2 text-text-muted hover:text-brand-primary text-sm font-medium transition"
                                >
                                    <Share2 size={18} /> {t('tavern.modals.details.share')}
                                </button>
                            </div>

                            {/* Replies List */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-text-main mb-4">{t('tavern.modals.details.replies')}</h3>
                                {replies.length === 0 ? (
                                    <div className="text-center text-text-muted py-8 italic">{t('tavern.modals.details.noReplies')}</div>
                                ) : (
                                    replies.map(reply => (
                                        <div key={reply.id} className="flex gap-3 pt-4 border-t border-divider-theme">
                                            <img
                                                src={getAvatarSource(reply.author_avatar_url)}
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
                                                                {t('common.save', 'Guardar')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <ContentRenderer
                                                        content={reply.content}
                                                        className="text-text-sub text-sm mb-3"
                                                    />
                                                )}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-4 mr-auto">
                                                        <button onClick={() => handleVote(reply.id, 'reply', 'like')} className="flex items-center gap-1 text-text-muted hover:text-accent-red transition text-xs">
                                                            <ArrowUp size={14} fill={reply.user_vote === 'like' ? 'currentColor' : 'none'} /> {reply.likes_count}
                                                        </button>
                                                        <button onClick={() => handleVote(reply.id, 'reply', 'dislike')} className="flex items-center gap-1 text-text-muted hover:text-brand-secondary transition text-xs">
                                                            <ArrowDown size={14} fill={reply.user_vote === 'dislike' ? 'currentColor' : 'none'} /> {reply.dislikes_count}
                                                        </button>
                                                        <button
                                                            onClick={() => handleShare(`Respuesta de ${reply.author_username}`, reply.content, reply.id)}
                                                            className="flex items-center gap-1 text-text-muted hover:text-brand-primary transition text-xs"
                                                            title={t('tavern.modals.details.share')}
                                                        >
                                                            <Share2 size={14} />
                                                        </button>
                                                    </div>

                                                    {canEditReply(reply) && !editingReplyId && (
                                                        <div className="flex items-center gap-2">
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
                    {user ? (
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
    );
}
// End of file
