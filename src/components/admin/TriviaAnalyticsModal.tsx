import { useState, useEffect } from 'react';
import {
    X, Users, Trophy, Coins, User,
    Loader2, BarChart3, ChevronRight, Calendar
} from 'lucide-react';
import { TriviaAdminService } from '../../services/TriviaAdminService';
import { getAvatarSource } from '../../config/avatars';
import { UserCircle } from 'lucide-react';

interface TriviaAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    triviaId: string;
    triviaTitle: string;
}

interface TriviaAttempt {
    id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    score: number;
    correct_count: number;
    total_questions: number;
    completed_at: string;
}

export function TriviaAnalyticsModal({
    isOpen,
    onClose,
    triviaId,
    triviaTitle
}: TriviaAnalyticsModalProps) {
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState<TriviaAttempt[]>([]);
    const [stats, setStats] = useState({
        totalAttempts: 0,
        totalCoinsDistributed: 0,
        averageScore: 0,
    });

    useEffect(() => {
        if (isOpen) {
            loadAnalytics();
        }
    }, [isOpen, triviaId]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = await TriviaAdminService.getTriviaAnalytics(triviaId);
            if (data.error) throw data.error;
            setAttempts(data.attempts);
            setStats(data.stats);
        } catch (error) {
            console.error('Error loading trivia analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-bg-side w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-border-theme relative slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-bg-pop">
                    <div>
                        <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                            <BarChart3 className="text-brand-primary" /> Analytics de Trivia
                        </h2>
                        <p className="text-sm text-text-muted font-bold">{triviaTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-side transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-side">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-brand-primary" size={40} />
                            <p className="text-text-muted font-bold">Cargando analytics...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Summary */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center text-center">
                                    <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary mb-2">
                                        <Users size={20} />
                                    </div>
                                    <p className="text-xl font-black text-text-main">{stats.totalAttempts}</p>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-wider">Jugadores</p>
                                </div>
                                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center text-center">
                                    <div className="p-2 bg-accent-green/10 rounded-lg text-accent-green mb-2">
                                        <Coins size={20} />
                                    </div>
                                    <p className="text-xl font-black text-text-main">{stats.totalCoinsDistributed}</p>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-wider">FC Distribuidos</p>
                                </div>
                                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center text-center">
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 mb-2">
                                        <Trophy size={20} />
                                    </div>
                                    <p className="text-xl font-black text-text-main">{stats.averageScore.toFixed(0)}%</p>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-wider">Score Promedio</p>
                                </div>
                            </div>

                            {/* Participants List */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-black text-text-main uppercase tracking-tight text-sm">Lista de Participantes</h3>
                                    <span className="text-xs text-text-muted font-bold">{attempts.length} intentos</span>
                                </div>

                                {attempts.length === 0 ? (
                                    <div className="bg-bg-pop border border-border-theme border-dashed rounded-2xl p-12 text-center">
                                        <Users className="mx-auto text-text-muted opacity-20 mb-4" size={48} />
                                        <p className="text-text-muted font-bold">Sin actividad todavía.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {attempts.map((attempt) => (
                                            <div key={attempt.id} className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex items-center justify-between group hover:border-brand-primary/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-bg-side border-2 border-border-theme flex items-center justify-center overflow-hidden shadow-sm">
                                                        <img
                                                            src={getAvatarSource(attempt.avatar_url)}
                                                            alt={attempt.username}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-main">{attempt.username}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase">
                                                            <Calendar size={10} />
                                                            {new Date(attempt.completed_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 justify-end">
                                                        <span className="text-lg font-black text-brand-primary">{attempt.correct_count}</span>
                                                        <span className="text-xs text-text-muted font-bold">/ {attempt.total_questions}</span>
                                                    </div>
                                                    <p className="text-xs font-black text-accent-green">+{attempt.score} FC</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
