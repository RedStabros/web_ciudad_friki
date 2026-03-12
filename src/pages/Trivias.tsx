import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/SEO';
import {
    BrainCircuit, Trophy, Star, Clock, ChevronRight, AlertTriangle,
    Loader2, Gamepad2, ShieldCheck, X, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Gift
} from 'lucide-react';
import { TriviaService } from '../services/TriviaService';
import { useAuth } from '../context/AuthContext';

interface TriviaOption { id: string; text: string; is_correct: boolean; }
interface TriviaQuestion { id: string; question: string; points: number; id_trivia: string; options: TriviaOption[]; }
interface TriviaWithStatus {
    id: string; title: string; description: string; time_limit_seconds: number;
    expire_date: string | null; user_completed: boolean; user_score?: number;
}
interface TriviaResult { score: number; correctCount: number; total: number; totalPoints: number; reward: number; }

export default function Trivias() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // List state
    const [trivias, setTrivias] = useState<TriviaWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Game state
    const [activeTrivia, setActiveTrivia] = useState<TriviaWithStatus | null>(null);
    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [loadingGame, setLoadingGame] = useState(false);
    const [currentIdx, setCurrentIdx] = useState(0);
    // answers: { questionId -> optionId } — same as mobile app
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Timer
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef<any>(null);

    // Result
    const [result, setResult] = useState<TriviaResult | null>(null);

    const loadList = useCallback(async () => {
        setIsLoading(true);
        try {
            if (user) {
                const data = await TriviaService.getTriviasWithStatus(user.id);
                setTrivias(data as TriviaWithStatus[]);
            } else {
                // unauthenticated: load without status
                const { trivias: data } = await TriviaService.fetchTriviaData();
                setTrivias(data.map(t => ({ ...t, user_completed: t.user_completed ?? false })) as TriviaWithStatus[]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => { loadList(); }, [loadList]);

    // Timer countdown
    useEffect(() => {
        if (!activeTrivia || timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [activeTrivia]);

    const startTrivia = async (trivia: TriviaWithStatus) => {
        if (!user) return alert(t('auth.signInToPlay', 'Inicia sesión para jugar'));
        if (trivia.user_completed) return;
        setLoadingGame(true);
        try {
            // Load questions with full option objects — same as app's getTriviaDetails()
            const qs = await TriviaService.getTriviaDetails(trivia.id);
            if (!qs || qs.length === 0) return alert(t('trivia.noQuestions', 'No hay preguntas disponibles'));
            setActiveTrivia(trivia);
            setQuestions(qs);
            setCurrentIdx(0);
            setAnswers({});
            setResult(null);
            setTimeLeft(trivia.time_limit_seconds || 120);
        } finally {
            setLoadingGame(false);
        }
    };

    const handleSelect = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleSubmit = async (isTimeout = false) => {
        if (!activeTrivia || !user || submitting) return;
        clearInterval(timerRef.current);
        setSubmitting(true);
        if (!isTimeout && questions[currentIdx] && !answers[questions[currentIdx].id]) {
            // Warn unfinished, but in web we let them submit with gaps like the app does
        }
        try {
            // submitAttempt mirrors mobile app: calculates score locally + calls deliver_trivia_reward RPC
            const res = await TriviaService.submitAttempt(user.id, activeTrivia.id, answers);
            setResult(res);
            setActiveTrivia(null);
            // Refresh list to show completed state
            loadList();
        } catch (e: any) {
            alert(e.message || t('trivia.submitError'));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Result Screen ──────────────────────────────────────────────────────────
    if (result) {
        const pct = result.total > 0 ? Math.round((result.correctCount / result.total) * 100) : 0;
        const isPerfect = result.correctCount === result.total;
        return (
            <div className="fixed inset-0 z-[200] bg-ui-overlay backdrop-blur-xl flex items-center justify-center p-4">
                <div className="bg-bg-side w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl border border-divider-theme animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className={`p-10 text-center ${isPerfect ? 'bg-gradient-to-b from-amber-500/10 to-transparent' : 'bg-gradient-to-b from-brand-primary/5 to-transparent'}`}>
                        <div className="text-6xl mb-4">{isPerfect ? '🏆' : pct >= 60 ? '⭐' : '🎮'}</div>
                        <h2 className="text-3xl font-black text-text-main uppercase italic tracking-tighter">
                            {t('trivia.results.title', '¡Trivia Completada!')}
                        </h2>
                        <p className="text-text-muted text-sm mt-2">
                            {result.correctCount} / {result.total} {t('trivia.results.correct', 'correctas')}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 divide-x divide-divider-theme border-y border-divider-theme">
                        <div className="p-6 text-center">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{t('trivia.results.score', 'Puntaje')}</p>
                            <p className="text-3xl font-black text-brand-primary italic">{result.score}</p>
                            <p className="text-[10px] text-text-muted">pts</p>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{t('trivia.results.correct', 'Correctas')}</p>
                            <p className="text-3xl font-black text-accent-green italic">{result.correctCount}</p>
                            <p className="text-[10px] text-text-muted">/ {result.total}</p>
                        </div>
                        <div className="p-6 text-center">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{t('trivia.results.reward', 'Recompensa')}</p>
                            <p className="text-3xl font-black text-amber-400 italic">+{result.reward}</p>
                            <p className="text-[10px] text-text-muted">FC</p>
                        </div>
                    </div>

                    {result.reward > 0 && (
                        <div className="mx-8 my-4 flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl px-4 py-3">
                            <Gift size={20} className="text-amber-400 flex-shrink-0" />
                            <p className="text-sm font-bold text-amber-400">
                                {t('trivia.results.correctAlert', `¡Has ganado ${result.reward} Frikicoins!`)}
                            </p>
                        </div>
                    )}

                    <div className="p-8">
                        <button
                            onClick={() => setResult(null)}
                            className="w-full bg-brand-primary text-text-inv py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary-light transition shadow-xl shadow-brand-primary/20"
                        >
                            {t('trivia.results.close', 'Volver a Trivias')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Active Trivia Game ─────────────────────────────────────────────────────
    if (activeTrivia && questions.length > 0) {
        const q = questions[currentIdx];
        const isLastQ = currentIdx === questions.length - 1;
        const progress = ((currentIdx + 1) / questions.length) * 100;
        const selectedOption = answers[q.id];

        return (
            <div className="fixed inset-0 z-[200] bg-ui-overlay backdrop-blur-xl flex items-center justify-center p-4">
                <div className="bg-bg-side w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-divider-theme flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

                    {/* Header */}
                    <div className="p-6 border-b border-divider-theme bg-bg-sub/30 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
                                <BrainCircuit size={20} />
                            </div>
                            <div>
                                <h2 className="font-black text-text-main text-sm uppercase tracking-tight leading-none">{activeTrivia.title}</h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-0.5">
                                    {t('trivia.question')} {currentIdx + 1} {t('trivia.of')} {questions.length}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-sm ${timeLeft < 30 ? 'bg-accent-red/10 text-accent-red' : 'bg-bg-sub text-text-main'}`}>
                                <Clock size={15} className={timeLeft < 10 ? 'animate-pulse' : ''} />
                                <span className="tabular-nums font-mono text-sm">
                                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                                </span>
                            </div>
                            <button onClick={() => {
                                if (window.confirm(t('trivia.exitWarning', '¿Salir? Se guardará tu progreso actual.'))) {
                                    handleSubmit();
                                }
                            }} className="p-2 hover:bg-bg-sub rounded-xl transition">
                                <X size={20} className="text-text-muted" />
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-bg-sub">
                        <div className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>

                    {/* Question body */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-brand-primary text-text-inv font-black rounded-lg text-sm italic">
                                {currentIdx + 1}
                            </span>
                            <div className="h-px bg-divider-theme flex-1 opacity-50" />
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{q.points} {t('trivia.pts')}</span>
                        </div>

                        <h2 className="text-2xl font-black text-text-main leading-tight tracking-tighter">
                            {q.question}
                        </h2>

                        <div className="grid grid-cols-1 gap-3">
                            {q.options.map((opt) => {
                                const isSelected = selectedOption === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSelect(q.id, opt.id)}
                                        className={`w-full text-left px-6 py-4 rounded-2xl border-2 font-bold transition-all duration-200 flex items-center justify-between
                                            ${isSelected
                                                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary scale-[1.01]'
                                                : 'border-divider-theme bg-bg-sub/30 hover:border-brand-primary/40 text-text-main hover:bg-bg-sub'
                                            }`}
                                    >
                                        <span className="text-base">{opt.text}</span>
                                        {isSelected && <CheckCircle2 size={20} className="text-brand-primary flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer navigation — same as app: can go back/forward + submit at end */}
                    <div className="p-6 border-t border-divider-theme bg-bg-sub/30 flex gap-3">
                        <button
                            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                            disabled={currentIdx === 0}
                            className="p-3 rounded-2xl bg-bg-side border border-divider-theme hover:bg-bg-sub transition disabled:opacity-30"
                        >
                            <ArrowLeft size={20} className="text-text-muted" />
                        </button>

                        {isLastQ ? (
                            <button
                                onClick={() => {
                                    if (window.confirm(t('trivia.confirmSubmit', '¿Enviar tus respuestas? No podrás cambiarlas.'))) {
                                        handleSubmit();
                                    }
                                }}
                                disabled={submitting}
                                className="flex-1 bg-brand-primary text-text-inv py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-primary-light transition shadow-xl shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                {submitting ? t('surveys.submitting') : t('trivia.submit', 'Enviar Respuestas')}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                                className="flex-1 bg-bg-side border border-divider-theme text-text-main py-3 rounded-2xl font-black uppercase hover:bg-brand-primary hover:text-text-inv hover:border-brand-primary transition flex items-center justify-center gap-2"
                            >
                                {t('trivia.nextQuestion')} <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── List Screen ────────────────────────────────────────────────────────────
    if (isLoading || loadingGame) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
                <p className="text-text-muted font-bold uppercase tracking-widest text-xs animate-pulse">{t('trivia.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-20 animate-in fade-in duration-1000">
            <SEO 
                title="Trivias Friki | Demuestra tus conocimientos"
                description="Desafía tus conocimientos sobre Anime, Videojuegos y Cultura Geek en las Trivias de Ciudad Friki. ¡Responde correctamente y gana Frikicoins!"
                keywords="Trivia Anime, Quiz Videojuegos, Conocimiento Geek, Frikicoins, Juegos Mentales"
                image="/assets/seo/trivias_banner.png"
            />
            {/* HERO */}
            <div className="relative rounded-[4rem] overflow-hidden bg-bg-side text-text-main p-10 md:p-20 shadow-2xl border border-divider-theme group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none rotate-12 group-hover:scale-110 group-hover:rotate-[20deg] transition-transform duration-1000">
                    <Gamepad2 size={400} className="text-text-muted" />
                </div>
                <div className="relative z-10 space-y-8 max-w-3xl">
                    <div className="inline-flex items-center gap-3 bg-brand-secondary/10 px-6 py-2 rounded-full border border-brand-secondary/20">
                        <Trophy size={20} className="text-brand-secondary" />
                        <span className="font-black text-sm tracking-widest text-brand-secondary uppercase italic">{t('trivia.title')} Ciudad Friki</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.8] uppercase text-transparent bg-clip-text bg-gradient-to-b from-text-main to-text-main/70">
                        {t('trivia.hero.title')}
                    </h1>
                    <p className="text-2xl text-text-sub font-medium leading-relaxed max-w-xl border-l-4 border-brand-primary pl-6">
                        {t('trivia.hero.subtitle')}
                    </p>
                    <div className="flex flex-wrap gap-5 pt-4">
                        <div className="bg-bg-sub/40 backdrop-blur-xl px-7 py-4 rounded-[2rem] border border-white/5 flex items-center gap-4 hover:border-brand-primary/30 transition">
                            <div className="p-3 bg-accent-green/10 rounded-2xl text-accent-green"><ShieldCheck size={28} /></div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-0.5">{t('trivia.hero.securityLevel')}</p>
                                <p className="font-black text-sm text-text-main uppercase">{t('trivia.hero.antiHack')}</p>
                            </div>
                        </div>
                        <div className="bg-bg-sub/40 backdrop-blur-xl px-7 py-4 rounded-[2rem] border border-white/5 flex items-center gap-4 hover:border-brand-secondary/30 transition">
                            <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary"><Star size={28} /></div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-0.5">{t('trivia.results.reward')}</p>
                                <p className="font-black text-sm text-text-main uppercase">{t('trivia.hero.rewardLimit')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TRIVIA LIST */}
            <section className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-divider-theme pb-8 px-4">
                    <div className="flex items-center gap-5">
                        <div className="bg-brand-primary p-4 rounded-[1.5rem] shadow-2xl text-text-inv rotate-[-5deg] hover:rotate-0 transition-transform">
                            <BrainCircuit size={32} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-text-main uppercase tracking-tighter italic">{t('trivia.availableChallenges')}</h2>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">{t('trivia.earnCoins')}</p>
                        </div>
                    </div>
                    <div className="bg-bg-side px-6 py-2 rounded-full border border-divider-theme flex items-center gap-2">
                        <div className="h-2 w-2 bg-brand-primary rounded-full animate-pulse" />
                        <span className="text-text-main font-black text-sm tracking-tight">{trivias.length} {t('common.active')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trivias.map((trivia) => (
                        <div
                            key={trivia.id}
                            onClick={() => !trivia.user_completed && startTrivia(trivia)}
                            className={`group bg-bg-side p-8 rounded-[3rem] shadow-2xl border transition-all duration-500 relative overflow-hidden
                                ${trivia.user_completed
                                    ? 'opacity-70 cursor-default border-divider-theme'
                                    : 'border-divider-theme hover:border-brand-primary/50 cursor-pointer hover:shadow-brand-primary/10'
                                }`}
                        >
                            <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                <Trophy size={100} className="text-brand-primary" />
                            </div>
                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-brand-primary tracking-[0.2em]">
                                        EXPIRA: {trivia.expire_date ? new Date(trivia.expire_date).toLocaleDateString() : 'N/A'}
                                    </span>
                                    {trivia.user_completed && trivia.user_score !== undefined && (
                                        <p className="text-[10px] text-accent-green font-black mt-0.5">Score: {trivia.user_score} pts</p>
                                    )}
                                </div>
                                {trivia.user_completed
                                    ? <CheckCircle2 size={24} className="text-accent-green" />
                                    : <XCircle size={20} className="text-text-muted opacity-20" />
                                }
                            </div>
                            <h3 className="text-2xl font-black text-text-main mb-4 group-hover:text-brand-primary transition-colors leading-tight relative z-10 uppercase italic tracking-tighter">
                                {trivia.title}
                            </h3>
                            <p className="text-text-sub text-sm mb-10 line-clamp-2">{trivia.description}</p>
                            <div className="flex items-center justify-between pt-6 border-t border-divider-theme relative z-10">
                                <div className="flex items-center gap-2 text-text-muted text-xs">
                                    <Clock size={14} />
                                    <span>{trivia.time_limit_seconds > 0 ? `${Math.floor(trivia.time_limit_seconds / 60)} min` : t('common.noLimit', 'Sin límite')}</span>
                                </div>
                                <div className={`px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center gap-2
                                    ${trivia.user_completed
                                        ? 'bg-accent-green/10 text-accent-green'
                                        : 'bg-brand-primary text-text-inv group-hover:scale-105 active:scale-95 shadow-brand-primary/30'
                                    }`}>
                                    {trivia.user_completed ? t('surveys.completed') : t('trivia.play')}
                                    {!trivia.user_completed && <ChevronRight size={14} />}
                                </div>
                            </div>
                        </div>
                    ))}

                    {trivias.length === 0 && (
                        <div className="col-span-full py-28 flex flex-col items-center justify-center text-center bg-bg-side rounded-[4rem] border-4 border-dashed border-divider-theme">
                            <AlertTriangle size={80} className="mb-6 text-text-muted opacity-30" />
                            <p className="text-3xl font-black uppercase italic tracking-widest text-text-muted">{t('trivia.noTriviasNow')}</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
