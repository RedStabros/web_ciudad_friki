import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, BrainCircuit, Trophy, Star, ChevronRight, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TriviaService, type TriviaQuestion } from '../services/TriviaService';
import { useAuth } from '../context/AuthContext';

export default function Trivias() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Current Game State
    const [currentIdx, setCurrentIdx] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrivias = async () => {
            setIsLoading(true);
            try {
                const { questions: data, error: fetchError } = await TriviaService.fetchTriviaData();
                if (fetchError) throw fetchError;
                setQuestions(data || []);
            } catch (err: any) {
                console.error('Error fetching trivias:', err);
                setError(err.message || t('trivia.loadError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchTrivias();
    }, []);

    const handleAnswer = async (questionId: string, answerIndex: number) => {
        if (!user) return alert(t('auth.signInToPlay'));
        if (answered[questionId] !== undefined) return;

        setSubmitting(questionId);
        try {
            const { result, error: submitError } = await TriviaService.submitAnswer(questionId, answerIndex);
            if (submitError) throw submitError;

            setAnswered(prev => ({ ...prev, [questionId]: answerIndex }));
            if (result?.is_correct) {
                setScore(prev => prev + (questions.find(q => q.id === questionId)?.points || 0));
                alert(t('trivia.results.correctAlert'));
            } else {
                alert(t('trivia.results.incorrectAlert'));
            }
        } catch (err: any) {
            console.error('Error submitting answer:', err);
            alert(t('trivia.submitError'));
        } finally {
            setSubmitting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
                <p className="text-text-muted font-medium">{t('trivia.loading')}</p>
            </div>
        );
    }

    if (currentIdx !== null) {
        const q = questions[currentIdx];
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-full flex justify-between items-center mb-10">
                    <button
                        onClick={() => setCurrentIdx(null)}
                        className="text-text-muted hover:text-brand-primary transition-colors flex items-center gap-1 font-bold text-sm"
                    >
                        <ChevronRight className="rotate-180" size={18} /> {t('trivia.exit')}
                    </button>
                    <div className="bg-brand-secondary/10 text-brand-secondary px-4 py-2 rounded-full border border-brand-secondary/20 flex items-center gap-2 font-black text-xl">
                        <Star size={20} className="fill-brand-secondary" />
                        {score} <span className="text-xs uppercase ml-1">{t('trivia.score')}</span>
                    </div>
                </div>

                <div className="w-full bg-bg-side rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-border-theme relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <BrainCircuit size={120} className="text-text-muted" />
                    </div>

                    <div className="flex items-center gap-3 mb-8">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter
                            ${q.difficulty === 'Fácil' ? 'bg-green-500/10 text-green-500' : q.difficulty === 'Media' ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-accent-red/10 text-accent-red'}`}>
                            {q.difficulty}
                        </span>
                        <span className="text-text-muted font-bold text-xs uppercase tracking-widest">{q.category}</span>
                    </div>

                    <h2 className="text-3xl font-black text-text-main mb-10 leading-tight">
                        {q.question}
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        {(q.options || []).map((opt, i) => (
                            <button
                                key={i}
                                disabled={submitting !== null || answered[q.id] !== undefined}
                                onClick={() => handleAnswer(q.id, i)}
                                className={`w-full group relative overflow-hidden px-8 py-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between
                                    ${answered[q.id] === i ? 'border-brand-primary bg-brand-primary text-text-inv scale-[1.02] shadow-xl' : 'border-divider-theme bg-bg-sub/50 hover:border-brand-primary/50 text-text-main'}
                                    disabled:opacity-75 disabled:cursor-not-allowed`}
                            >
                                <span className="relative z-10 font-bold text-lg">{opt}</span>
                                {submitting === q.id && <Loader2 size={18} className="animate-spin" />}
                                {answered[q.id] === i && <Star className="fill-text-inv" size={20} />}
                            </button>
                        ))}
                    </div>

                    {answered[q.id] !== undefined && (
                        <button
                            onClick={() => {
                                if (currentIdx < questions.length - 1) {
                                    setCurrentIdx(currentIdx + 1);
                                } else {
                                    alert(t('trivia.results.finished', { score }));
                                    setCurrentIdx(null);
                                }
                            }}
                            className="w-full mt-10 bg-brand-primary text-text-inv py-4 rounded-2xl font-black text-lg shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
                        >
                            {t('trivia.nextQuestion')} <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-16 animate-in fade-in duration-700">
            <div className="relative rounded-[3rem] overflow-hidden bg-bg-side text-text-main p-10 md:p-16 shadow-2xl border border-border-theme">
                <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none rotate-12">
                    <Gamepad2 size={300} className="text-text-muted" />
                </div>

                <div className="relative z-10 space-y-6 max-w-2xl">
                    <div className="flex items-center gap-3 text-brand-secondary">
                        <Trophy size={32} />
                        <span className="font-black text-xl tracking-tighter uppercase italic">{t('trivia.title')} Ciudad Friki</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-4 italic uppercase">
                        {t('trivia.hero.title')}
                    </h1>
                    <p className="text-xl text-text-sub font-medium leading-relaxed">
                        {t('trivia.hero.subtitle')}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-8">
                        <div className="bg-bg-sub/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-divider-theme flex items-center gap-3">
                            <ShieldCheck className="text-accent-green" size={24} />
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-text-muted">{t('trivia.hero.securityLevel')}</p>
                                <p className="font-bold text-sm">{t('trivia.hero.antiHack')}</p>
                            </div>
                        </div>
                        <div className="bg-bg-sub/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-divider-theme flex items-center gap-3">
                            <Star className="text-brand-secondary" size={24} />
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-text-muted">{t('trivia.results.reward')}</p>
                                <p className="font-bold text-sm">{t('trivia.hero.rewardLimit')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="space-y-10">
                <div className="flex items-center justify-between border-b-4 border-divider-theme pb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-primary p-3 rounded-2xl shadow-lg text-text-inv">
                            <BrainCircuit size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter italic">{t('trivia.availableChallenges')}</h2>
                    </div>
                    <p className="text-text-muted font-black text-sm uppercase tracking-widest">{questions.length} {t('common.active')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {questions.map((q, i) => (
                        <div
                            key={q.id}
                            onClick={() => setCurrentIdx(i)}
                            className="group bg-bg-side p-8 rounded-[2rem] shadow-xl border border-divider-theme hover:border-brand-primary transition-all duration-300 cursor-pointer hover:translate-y-[-8px]"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black uppercase bg-bg-sub px-3 py-1 rounded-full text-text-muted tracking-widest">
                                    {q.category}
                                </span>
                                <div className="text-brand-secondary flex gap-0.5">
                                    {[1, 2, 3].map(s => <Star key={s} size={12} className={s <= (q.difficulty === 'Fácil' ? 1 : q.difficulty === 'Media' ? 2 : 3) ? 'fill-brand-secondary' : 'opacity-20'} />)}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-text-main mb-8 group-hover:text-brand-primary transition-colors flex items-start gap-2 leading-tight">
                                <span className="text-brand-primary opacity-30 font-black">#</span> {(q.question || '').length > 80 ? (q.question || '').substring(0, 80) + '...' : (q.question || t('trivia.noTitle'))}
                            </h3>

                            <div className="flex items-center justify-between pt-6 border-t border-divider-theme">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-text-muted">{t('trivia.results.reward')}</span>
                                    <span className="font-black text-sm text-brand-secondary">+{q.points} FKC</span>
                                </div>
                                <div className="bg-brand-primary text-text-inv py-2.5 px-6 rounded-xl font-black text-xs uppercase shadow-lg group-hover:rotate-2 transition-transform shadow-brand-primary/20">
                                    {t('trivia.play')}
                                </div>
                            </div>
                        </div>
                    ))}

                    {questions.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40 text-text-muted">
                            <AlertTriangle size={64} className="mb-4" />
                            <p className="text-2xl font-black uppercase italic tracking-widest">{t('trivia.noTrivias')}</p>
                            <p className="mt-2 text-text-muted font-bold uppercase text-xs">{t('trivia.noTriviasDetail')}</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
