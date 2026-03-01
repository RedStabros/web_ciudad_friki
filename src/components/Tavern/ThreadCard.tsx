import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown, MessageSquare, MoreHorizontal, Edit2, Shield, Trash2, Clock, Share2 } from 'lucide-react';
import type { TavernThread } from '../../types/tavern';
import { getAvatarSource } from '../../config/avatars';
import { ContentRenderer } from './ContentRenderer';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
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

    const isAuthor = user?.id === thread.author_id;
    const isWithin5Min = timeLeft !== null && timeLeft > 0;
    const hasNoReplies = (thread.reply_count || 0) === 0;
    const canEdit = isAuthor && isWithin5Min && hasNoReplies;
    const isAdmin = thread.author_role === 'admin' || thread.author_role === 'moderator';

    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/tavern?thread=${thread.id}`;
        if (navigator.share) {
            navigator.share({
                title: thread.title,
                text: thread.content.substring(0, 100),
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            alert(t('common.copied', 'Enlace copiado al portapapeles'));
        }
    };

    return (
        <article className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden hover:border-brand-primary/30 transition duration-200">
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-bg-sub border border-border-theme overflow-hidden relative">
                            <img
                                alt={thread.author_username || 'User'}
                                className="h-full w-full object-cover"
                                src={getAvatarSource(thread.author_avatar_url)}
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
                    <span className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] uppercase font-bold">
                        {thread.tag}
                    </span>
                </div>

                <div className="mb-4 cursor-pointer" onClick={onClick}>
                    <h3 className="text-lg font-bold text-text-main mb-2 leading-tight">
                        {thread.title}
                    </h3>
                    <ContentRenderer
                        content={thread.content}
                        className="text-text-sub text-sm mb-3 line-clamp-3"
                    />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-divider-theme">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-bg-sub/50 rounded-full px-2 py-1">
                            <button
                                onClick={() => onVote?.('like')}
                                className={`p-1 rounded-full transition ${thread.user_vote === 'like' ? 'text-accent-red bg-accent-red/10' : 'text-text-muted hover:text-accent-red hover:bg-accent-red/10'}`}
                            >
                                <ArrowUp size={16} fill={thread.user_vote === 'like' ? 'currentColor' : 'none'} />
                            </button>
                            <span className={`font-bold text-sm px-2 ${thread.likes_count - thread.dislikes_count >= 0 ? 'text-brand-primary' : 'text-accent-red'}`}>
                                {thread.likes_count - thread.dislikes_count}
                            </span>
                            <button
                                onClick={() => onVote?.('dislike')}
                                className={`p-1 rounded-full transition ${thread.user_vote === 'dislike' ? 'text-blue-500 bg-blue-500/10' : 'text-text-muted hover:text-blue-500 hover:bg-blue-500/10'}`}
                            >
                                <ArrowDown size={16} fill={thread.user_vote === 'dislike' ? 'currentColor' : 'none'} />
                            </button>
                        </div>
                        <button className="flex items-center gap-2 text-text-sub hover:text-brand-primary transition group" onClick={onClick}>
                            <MessageSquare size={18} className="group-hover:text-brand-primary" />
                            <span className="text-sm font-medium">{thread.reply_count || 0} {t('tavern.thread.reply')}</span>
                        </button>
                        <button className="flex items-center gap-2 text-text-sub hover:text-brand-primary transition group" onClick={handleShare}>
                            <Share2 size={18} className="group-hover:text-brand-primary" />
                            <span className="text-sm font-medium">{t('tavern.thread.share')}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <div className="flex items-center gap-2 mr-2">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-accent-yellow bg-accent-yellow/10 px-2 py-1 rounded-md border border-accent-yellow/20">
                                    <Clock size={12} />
                                    {formatTimeLeft(timeLeft!)}
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                                    className="p-2 text-text-muted hover:text-brand-primary rounded-full hover:bg-bg-sub transition" title={t('tavern.thread.edit')}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                    className="p-2 text-text-muted hover:text-accent-red rounded-full hover:bg-bg-sub transition" title={t('tavern.thread.delete')}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                        <button className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-sub transition">
                            <MoreHorizontal size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
