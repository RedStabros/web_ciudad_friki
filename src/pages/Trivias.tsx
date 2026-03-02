import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, Trophy, Star, Clock, ChevronRight, AlertTriangle, Loader2, Gamepad2, ShieldCheck, X, CheckSquare } from 'lucide-react';
import { TriviaService, type Trivia } from '../services/TriviaService';
import { useAuth } from '../context/AuthContext';

export default function Trivias() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [trivias, setTrivias] = useState<Trivia[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTrivia, setActiveTrivia] = useState<Trivia | null>(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [answered, setAnswered] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const loadTrivias = async () => {
            setIsLoading(true);
            const { trivias: data } = await TriviaService.fetchTriviaData();
            // Matching Surveys logic: filter out expired ones if service didn't
            const now = new Date().toISOString();
            const activeData = data.filter(t => !t.expire_date || t.expire_date >= now);
            setTrivias(activeData);
            setIsLoading(false);
        };
        loadTrivias();
    }, []);

    const [timeLeft, setTimeLeft] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        let timer: any;
        if (timerActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && timerActive) {
            handleFinish(true); // Auto-finish on timeout
        }
        return () => clearInterval(timer);
    }, [timerActive, timeLeft]);

    const startTrivia = (trivia: Trivia) => {
        setActiveTrivia(trivia);
        setTimeLeft(trivia.time_limit_seconds || 60);
        setTimerActive(true);
        setCurrentQuestionIdx(0);
        setAnswered({});
        setScore(0);
    };

    const handleFinish = async (isTimeout = false) => {
        if (!activeTrivia) return;
        setTimerActive(false);

        // Finalize score and attempt in DB
        await TriviaService.finishTrivia(activeTrivia.id, score);

        if (isTimeout) {
            alert(t('trivia.results.timeout', '¡Se acabó el tiempo! Tu puntaje final es: {{score}}', { score }));
        } else {
            alert(t('trivia.results.finished', '¡Trivia completada! Tu puntaje final es: {{score}}', { score }));
        }

        // Cleanup and Refresh
        setActiveTrivia(null);
        setCurrentQuestionIdx(0);
        setAnswered({});
        setScore(0);

        // Reload list to update "completed" state
        const { trivias: data } = await TriviaService.fetchTriviaData();
        setTrivias(data);
    };

    const handleCloseAttempt = () => {
        if (window.confirm(t('trivia.exitWarning', '¿Estás seguro de salir? Se guardará tu puntaje actual y no podrás volver a intentar esta trivia.'))) {
            handleFinish();
        }
    };

    const handleAnswer = async (_triviaId: string, questionId: string, optionIdx: number) => {
        if (!user) return alert(t('auth.signInToPlay'));
        if (answered[questionId] !== undefined) return;

        setSubmitting(questionId);
        const { result, error } = await TriviaService.submitAnswer(questionId, optionIdx);

        if (error) {
            alert(t('trivia.submitError'));
        } else {
            setAnswered(prev => ({ ...prev, [questionId]: optionIdx }));
            if (result?.is_correct) {
                setScore(s => s + (result.points || 0));
            }
        }
        setSubmitting(null);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
                <p className="text-text-muted font-bold uppercase tracking-widest text-xs animate-pulse">{t('trivia.loading')}</p>
            </div>
        );
    }

    if (activeTrivia) {
        const q = activeTrivia.questions[currentQuestionIdx];

        return (
            <div className="fixed inset-0 z-[200] bg-ui-overlay backdrop-blur-xl flex items-center justify-center p-4">
                <div className="bg-bg-side w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-divider-theme flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                    <div className="p-8 border-b border-divider-theme bg-bg-sub/30 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                                <BrainCircuit size={24} />
                            </div>
                            <div>
                                <h2 className="font-black text-text-main uppercase tracking-tight">{activeTrivia.title}</h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    {t('trivia.question')} {currentQuestionIdx + 1} {t('trivia.of')} {activeTrivia.questions.length}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-accent-red/10 text-accent-red rounded-xl font-black shadow-lg shadow-accent-red/5">
                                <Clock size={18} className={timeLeft < 10 ? 'animate-pulse' : ''} />
                                <span className="tabular-nums font-mono">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                            </div>
                            <button onClick={handleCloseAttempt} className="p-3 hover:bg-bg-sub rounded-2xl transition-colors">
                                <X size={24} className="text-text-muted" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-brand-primary text-text-inv font-black rounded-lg italic">
                                {currentQuestionIdx + 1}
                            </span>
                            <div className="h-px bg-divider-theme flex-1 opacity-50" />
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-60">
                                {q.points} {t('trivia.pts')}
                            </span>
                        </div>

                        <h2 className="text-3xl font-black text-text-main leading-tight tracking-tighter italic uppercase underline decoration-brand-primary/30 decoration-8 underline-offset-8">
                            {q.question}
                        </h2>

                        <div className="grid grid-cols-1 gap-4">
                            {q.options.map((opt, i) => (
                                <button
                                    key={i}
                                    disabled={submitting !== null || answered[q.id] !== undefined}
                                    onClick={() => handleAnswer(activeTrivia.id, q.id, i)}
                                    className={`w-full group relative overflow-hidden px-8 py-6 rounded-3xl border-2 text-left transition-all duration-300 flex items-center justify-between
                                        ${answered[q.id] === i ? 'border-brand-primary bg-brand-primary text-text-inv scale-[1.02] shadow-xl' : 'border-divider-theme bg-bg-sub/30 hover:border-brand-primary/50 text-text-main hover:bg-bg-sub'}
                                        disabled:opacity-75 disabled:cursor-not-allowed`}
                                >
                                    <span className="relative z-10 font-bold text-xl">{opt}</span>
                                    <div className="flex items-center gap-3">
                                        {submitting === q.id && <Loader2 size={24} className="animate-spin text-brand-primary" />}
                                        {answered[q.id] === i && <Star className="fill-text-inv" size={24} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 border-t border-divider-theme bg-bg-sub/30">
                        {answered[q.id] !== undefined ? (
                            <button
                                onClick={() => {
                                    if (currentQuestionIdx < activeTrivia.questions.length - 1) {
                                        setCurrentQuestionIdx(prev => prev + 1);
                                    } else {
                                        handleFinish();
                                    }
                                }}
                                className="w-full bg-brand-primary text-text-inv py-5 rounded-3xl font-black text-xl shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-3"
                            >
                                {currentQuestionIdx < activeTrivia.questions.length - 1 ? t('trivia.nextQuestion') : t('common.finish')} <ChevronRight size={24} />
                            </button>
                        ) : (
                            <div className="p-4 rounded-2xl bg-brand-primary/5 text-center text-[10px] font-black uppercase text-brand-primary tracking-[0.2em] animate-pulse">
                                {t('trivia.selectOption', 'Selecciona una respuesta para continuar')}
                            </div>
                        )}
                    </div>
                </div >
            </div >
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-20 animate-in fade-in duration-1000">
            {/* HERO SECTION */}
            <div className="relative rounded-[4rem] overflow-hidden bg-bg-side text-text-main p-10 md:p-20 shadow-2xl border border-divider-theme group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none rotate-12 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-[20deg]">
                    <Gamepad2 size={400} className="text-text-muted" />
                </div>

                <div className="relative z-10 space-y-8 max-w-3xl">
                    <div className="inline-flex items-center gap-3 bg-brand-secondary/10 px-6 py-2 rounded-full border border-brand-secondary/20 backdrop-blur-md">
                        <Trophy size={20} className="text-brand-secondary" />
                        <span className="font-black text-sm tracking-widest text-brand-secondary uppercase italic">{t('trivia.title')} Ciudad Friki</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.8] mb-4 uppercase text-transparent bg-clip-text bg-gradient-to-b from-text-main to-text-main/70">
                        {t('trivia.hero.title')}
                    </h1>

                    <p className="text-2xl text-text-sub font-medium leading-relaxed max-w-xl border-l-4 border-brand-primary pl-6">
                        {t('trivia.hero.subtitle')}
                    </p>

                    <div className="flex flex-wrap gap-5 pt-4">
                        <div className="bg-bg-sub/40 backdrop-blur-xl px-7 py-4 rounded-[2rem] border border-white/5 flex items-center gap-4 transition-all hover:border-brand-primary/30">
                            <div className="p-3 bg-accent-green/10 rounded-2xl text-accent-green">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-0.5">{t('trivia.hero.securityLevel')}</p>
                                <p className="font-black text-sm text-text-main uppercase">{t('trivia.hero.antiHack')}</p>
                            </div>
                        </div>
                        <div className="bg-bg-sub/40 backdrop-blur-xl px-7 py-4 rounded-[2rem] border border-white/5 flex items-center gap-4 transition-all hover:border-brand-secondary/30">
                            <div className="p-3 bg-brand-secondary/10 rounded-2xl text-brand-secondary">
                                <Star size={28} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-0.5">{t('trivia.results.reward')}</p>
                                <p className="font-black text-sm text-text-main uppercase">{t('trivia.hero.rewardLimit')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TRIVIA LIST - ONE CARD PER TRIVIA */}
            <section className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-divider-theme pb-8 px-4">
                    <div className="flex items-center gap-5">
                        <div className="bg-brand-primary p-4 rounded-[1.5rem] shadow-2xl text-text-inv rotate-[-5deg] group hover:rotate-0 transition-transform">
                            <BrainCircuit size={32} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-text-main uppercase tracking-tighter italic">{t('trivia.availableChallenges')}</h2>
                            <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">GANA FRIKICOINS RESPONDIENDO CORRECTAMENTE</p>
                        </div>
                    </div>
                    <div className="bg-bg-side px-6 py-2 rounded-full border border-divider-theme flex items-center gap-2">
                        <div className="h-2 w-2 bg-brand-primary rounded-full animate-pulse"></div>
                        <span className="text-text-main font-black text-sm tracking-tight">{trivias.length} {t('common.active')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trivias.map((trivia) => (
                        <div
                            key={trivia.id}
                            onClick={() => !trivia.user_completed && startTrivia(trivia)}
                            className={`group bg-bg-side p-8 rounded-[3rem] shadow-2xl border transition-all duration-500 relative overflow-hidden ${trivia.user_completed ? 'opacity-75 cursor-default border-divider-theme' : 'border-divider-theme hover:border-brand-primary/50 cursor-pointer'}`}
                        >
                            {/* Decorative background element */}
                            <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                                <Trophy size={100} className="text-brand-primary" />
                            </div>

                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase text-brand-primary tracking-[0.2em]">
                                        {trivia.questions.length} PREGUNTAS
                                    </span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                        EXPIRA: {trivia.expire_date ? new Date(trivia.expire_date).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="p-3 bg-brand-primary/5 rounded-2xl">
                                    <CheckSquare size={20} className="text-brand-primary" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-text-main mb-6 group-hover:text-brand-primary transition-colors flex items-start gap-4 leading-tight relative z-10 min-h-[3rem] uppercase italic tracking-tighter">
                                {trivia.title}
                            </h3>

                            <p className="text-text-sub text-sm mb-12 line-clamp-2 min-h-[2.5rem]">
                                {trivia.description}
                            </p>

                            <div className="flex items-center justify-between pt-8 border-t border-divider-theme relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">{t('trivia.results.reward')}</span>
                                    <span className="font-black text-xl text-brand-secondary italic">+{trivia.reward} FKC</span>
                                </div>
                                <div className={`px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center gap-2 ${trivia.user_completed ? 'bg-bg-sub text-text-muted' : 'bg-brand-primary text-text-inv group-hover:scale-105 active:scale-95 shadow-brand-primary/30'}`}>
                                    {trivia.user_completed ? t('surveys.completed') : t('trivia.play')}
                                    {!trivia.user_completed && <ChevronRight size={16} />}
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
