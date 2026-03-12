import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/SEO';
import { Loader2, Trophy, Zap, ChevronRight, X, Clock, CheckCircle2, XCircle, Swords, Shield, Share2 } from 'lucide-react';
import { TriviaService } from '../services/TriviaService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useGlobalFeatures } from '../hooks/useGlobalFeatures';
import { getAvatarSource } from '../config/avatars';
import { getTriviaIcon } from '../utils/triviaIcons';
import { toPng } from 'html-to-image';
import { shareContent } from '../utils/shareContent';
import TriviaSubmissionModal from '../components/TriviaSubmissionModal';

// ─── Types ────────────────────────────────────────────────────────────────────
interface VSCategory { id: string; name: string; icon: string; description?: string; }
// Option shape from DB: { text: string; is_correct: boolean }
interface VSOption { text: string; is_correct: boolean; }
interface VSQuestion { id: string; question_text: string; options: VSOption[]; }
interface VSWinner { user_id: string; username: string; duels_won: number; avatar_url?: string; }
interface Duel { id: string; wager_amount: number; question_ids: string[]; creator_id: string; triviaduels_categories?: { name: string; icon: string }; profiles?: { username: string; avatar_url?: string }; }

const MEDALS = ['🥇', '🥈', '🥉'];

// ─── Sub-component: Leaderboard ───────────────────────────────────────────────
function Leaderboard({ winners, loading }: { winners: VSWinner[]; loading: boolean }) {
    const { t } = useTranslation();
    const [isSharing, setIsSharing] = useState(false);
    const leaderboardRef = useRef<HTMLDivElement>(null);

    const shareLeaderboardImage = async () => {
        if (!leaderboardRef.current || isSharing) return;
        setIsSharing(true);
        const el = leaderboardRef.current;
        
        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
            .share-hide { display: none !important; }
            .no-scroll { overflow: visible !important; width: 100% !important; }
            .leaderboard-capture { padding: 40px !important; background: #0f172a !important; border-radius: 24px !important; }
        `;
        document.head.appendChild(tempStyle);

        const shareBtn = el.querySelector('.share-btn-leaderboard');
        if (shareBtn) shareBtn.classList.add('share-hide');
        el.classList.add('leaderboard-capture');

        try {
            const dataUrl = await toPng(el, {
                backgroundColor: '#0f172a',
                pixelRatio: 2,
            });

            const resp = await fetch(dataUrl);
            const blob = await resp.blob();

            if (blob) {
                const file = new File([blob], 'lideres-frikivs-ciudad-friki.png', { type: 'image/png' });
                await shareContent({
                    title: 'Líderes Friki VS | Ciudad Friki',
                    text: '⚔️ ¡Este es el Top 10 de los guerreros más poderosos de Friki VS! ¿Te atreves a retarlos?',
                    url: window.location.origin + '/frikivs',
                    file
                });
            }
        } catch (error) {
            console.error('Error sharing leaderboard:', error);
        } finally {
            if (shareBtn) shareBtn.classList.remove('share-hide');
            el.classList.remove('leaderboard-capture');
            document.head.removeChild(tempStyle);
            setIsSharing(false);
        }
    };

    if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>;
    if (winners.length === 0) return (
        <div className="text-center py-16 opacity-40">
            <Trophy size={64} className="mx-auto mb-4 text-text-muted" />
            <p className="font-black uppercase tracking-widest text-text-muted text-sm">{t('triviaVS.leaderboard.empty', 'Sin datos aún')}</p>
            <p className="text-xs text-text-muted mt-2">{t('triviaVS.leaderboard.emptyHint', '¡Gana duelos para aparecer aquí!')}</p>
        </div>
    );
    return (
        <div ref={leaderboardRef} className="space-y-2 mt-4 relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1" />
                <h3 className="text-center font-black text-xl text-text-main uppercase tracking-tighter">🏆 Top Ganadores VS</h3>
                <div className="flex-1 flex justify-end">
                    <button 
                        onClick={shareLeaderboardImage}
                        disabled={isSharing}
                        className="share-btn-leaderboard p-3 bg-bg-sub border border-border-theme rounded-2xl text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                    </button>
                </div>
            </div>
            {winners.slice(0, 10).map((w, i) => (
                <div key={w.user_id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${i === 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-border-theme hover:bg-bg-sub'}`}>
                    <span className="text-xl w-8 text-center">{i < 3 ? MEDALS[i] : <span className="font-black text-text-muted text-sm">{i + 1}</span>}</span>
                    <img src={getAvatarSource(w.avatar_url || null)} alt={w.username} className="w-10 h-10 rounded-full border border-border-theme object-cover shadow-sm" />
                    <span className={`flex-1 font-bold text-sm truncate ${i === 0 ? 'text-amber-400' : 'text-text-main'}`}>@{w.username}</span>
                    <div className="flex items-center gap-1">
                        <Shield size={13} className="text-brand-primary" />
                        <span className="text-xs font-black text-brand-primary">{w.duels_won}</span>
                        <span className="text-[10px] text-text-muted ml-0.5">{t('triviaVS.wins', 'victorias')}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Sub-component: DuelCard ─────────────────────────────────────────────────
function DuelCard({ duel, isMine, onJoin }: { duel: Duel; isMine: boolean; onJoin: (d: Duel) => void }) {
    const { t } = useTranslation();
    const catIcon = duel.triviaduels_categories?.icon;
    const catId = undefined; // we don't have category id directly on duel join, fallback is fine
    const iconSrc = getTriviaIcon(catIcon, catId);
    return (
        <div
            className={`bg-bg-side border border-border-theme rounded-2xl p-4 flex items-center gap-3 transition-all ${!isMine ? 'cursor-pointer hover:border-brand-primary/50 hover:shadow-lg hover:shadow-brand-primary/5' : ''}`}
            onClick={() => !isMine && onJoin(duel)}
        >
            <img src={iconSrc} alt={duel.triviaduels_categories?.name || 'VS'} className="w-10 h-10 object-contain flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="font-bold text-text-main text-sm truncate">{duel.triviaduels_categories?.name || t('triviaVS.unknownCategory', 'Categoría')}</p>
                <p className="text-xs text-text-muted">{duel.question_ids?.length || 10} {t('common.questions', 'preguntas')}</p>
                {!isMine && duel.profiles && (
                    <p className="text-xs text-text-sub mt-0.5">vs <span className="font-bold">@{duel.profiles.username}</span></p>
                )}
            </div>
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                    <Zap size={12} className="text-amber-400" />
                    <span className="text-xs font-black text-amber-400">{duel.wager_amount} FC</span>
                </div>
                {isMine ? (
                    <span className="text-[10px] font-bold text-accent-red uppercase tracking-wider">{t('triviaVS.waiting', 'Esperando...')}</span>
                ) : (
                    <div className="flex items-center gap-1 text-brand-primary">
                        <span className="text-[10px] font-bold uppercase">{t('triviaVS.joinDuelTitle', 'Unirse')}</span>
                        <ChevronRight size={12} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Sub-component: Gameplay ─────────────────────────────────────────────────
function GameplayScreen({
    duelId: _duelId,
    questionIds,
    userId: _userId,
    onFinish,
    onClose
}: {
    duelId: string;
    questionIds: string[];
    userId: string;
    onFinish: (score: number, timeMs: number) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [questions, setQuestions] = useState<VSQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const startTimeRef = useRef(Date.now());
    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (!questionIds || questionIds.length === 0) {
            setLoadError('No se encontraron preguntas para este duelo.');
            setLoading(false);
            return;
        }
        TriviaService.getVSQuestions(questionIds)
            .then((qs: any[]) => {
                if (!qs || qs.length === 0) {
                    setLoadError('No se pudieron cargar las preguntas. Intenta de nuevo.');
                } else {
                    // Shuffle options within each question \u2014 mirrors app
                    setQuestions(qs.map((q: any) => ({
                        id: q.id,
                        question_text: q.question_text,
                        options: [...(q.options || [])].sort(() => Math.random() - 0.5)
                    })));
                }
                setLoading(false);
            })
            .catch((err: any) => {
                console.error('VS getVSQuestions error:', err);
                setLoadError('Error al cargar preguntas del duelo.');
                setLoading(false);
            });
    }, []);

    // Per-question countdown (15s like mobile app)
    useEffect(() => {
        if (loading || questions.length === 0) return;
        setTimeLeft(15);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAnswer(-1); // timeout \u2014 no answer
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [currentIdx, loading]);

    const handleAnswer = useCallback((optionIndex: number) => {
        if (isAnswered) return;
        setIsAnswered(true);
        clearInterval(timerRef.current);
        setSelected(optionIndex);

        // Correct detection via is_correct field (same as mobile app)
        const q = questions[currentIdx];
        const correct = optionIndex !== -1 && q?.options[optionIndex]?.is_correct === true;
        const newScore = correct ? score + 1 : score;
        setScore(newScore);

        // 1.5s feedback then advance (same as app)
        setTimeout(() => {
            if (currentIdx < questions.length - 1) {
                setCurrentIdx(i => i + 1);
                setSelected(null);
                setIsAnswered(false);
            } else {
                const timeMs = Date.now() - startTimeRef.current;
                onFinish(newScore, timeMs);
            }
        }, 1500);
    }, [isAnswered, currentIdx, questions, score, onFinish]);

    if (loading) return (
        <div className="fixed inset-0 z-[300] bg-bg-main flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-brand-primary" size={48} />
            <p className="text-text-muted text-sm font-bold">{t('common.loading', 'Cargando preguntas...')}</p>
        </div>
    );

    if (loadError || questions.length === 0) return (
        <div className="fixed inset-0 z-[300] bg-bg-main flex flex-col items-center justify-center gap-6 p-8 text-center">
            <XCircle size={56} className="text-accent-red" />
            <div>
                <h2 className="font-black text-text-main text-xl">{t('triviaVS.gameplay.loadError', 'Error al cargar')}</h2>
                <p className="text-text-muted text-sm mt-2">{loadError || 'No se encontraron preguntas'}</p>
            </div>
            <button onClick={onClose} className="px-6 py-3 bg-brand-primary text-text-inv font-black rounded-2xl hover:bg-brand-primary-light transition">
                {t('common.close', 'Cerrar')}
            </button>
        </div>
    );

    const q = questions[currentIdx];
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
        <div className="fixed inset-0 z-[300] bg-bg-main flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-theme bg-bg-side">
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-sub transition"><X size={20} className="text-text-muted" /></button>
                <div className="flex items-center gap-3">
                    <img src="/assets/icon_vs.png" alt="VS" className="w-8 h-8 object-contain" />
                    <span className="font-black text-text-main">Friki VS</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black tabular-nums text-sm ${timeLeft <= 5 ? 'bg-accent-red/10 text-accent-red animate-pulse' : 'bg-bg-sub text-text-main'}`}>
                    <Clock size={16} />
                    {timeLeft}s
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-bg-sub">
                <div className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto flex flex-col max-w-2xl mx-auto w-full px-6 py-8 gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-widest">{t('trivia.question')} {currentIdx + 1} {t('trivia.of')} {questions.length}</span>
                    <div className="flex-1 h-px bg-border-theme" />
                    <span className="text-brand-primary font-black text-sm">{score} pts</span>
                </div>

                <h2 className="text-2xl font-black text-text-main leading-tight">{q.question_text}</h2>

                <div className="flex flex-col gap-3">
                    {q.options.map((opt, i) => {
                        const isSelected = selected === i;
                        const showResult = isAnswered;
                        const isCorrectOpt = opt.is_correct;
                        const isWrong = showResult && isSelected && !isCorrectOpt;
                        const isCorrectShow = showResult && isCorrectOpt;

                        let cls = 'border-border-theme hover:border-brand-primary/50 hover:bg-bg-sub text-text-main';
                        if (showResult) {
                            if (isCorrectShow) cls = 'border-accent-green bg-accent-green/10 text-accent-green scale-[1.01]';
                            else if (isWrong) cls = 'border-accent-red bg-accent-red/10 text-accent-red';
                            else cls = 'border-border-theme text-text-muted opacity-50';
                        }

                        return (
                            <button
                                key={i}
                                disabled={isAnswered}
                                onClick={() => handleAnswer(i)}
                                className={`w-full text-left px-6 py-4 rounded-2xl border-2 font-bold transition-all duration-300 text-base disabled:cursor-not-allowed ${cls}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{opt.text}</span>
                                    {isCorrectShow && <CheckCircle2 size={20} className="text-accent-green flex-shrink-0" />}
                                    {isWrong && <XCircle size={20} className="text-accent-red flex-shrink-0" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Sub-component: Result Screen ────────────────────────────────────────────
function ResultScreen({
    result,
    totalQuestions,
    onClose
}: {
    result: any;
    totalQuestions: number;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [isSharing, setIsSharing] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);
    const isWinner = result?.winner_id !== undefined;
    const isTie = result?.winner_id === null;

    const shareResultImage = async () => {
        if (!resultRef.current || isSharing) return;
        setIsSharing(true);
        const el = resultRef.current;
        
        const computedStyle = window.getComputedStyle(document.body);
        const bgColor = computedStyle.getPropertyValue('--bg-primary').trim() || '#1e222a';
        const brandColor = computedStyle.getPropertyValue('--brand-primary').trim() || '#e1192f';

        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
            .share-hide { display: none !important; }
            .result-capture { 
                padding: 40px !important; 
                background: ${bgColor} !important; 
                border: 3px solid ${brandColor} !important;
                border-radius: 32px !important;
                width: 500px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
            }
        `;
        document.head.appendChild(tempStyle);

        const shareBtn = el.querySelector('.share-btn-result');
        const finishBtn = el.querySelector('.finish-btn-result');
        if (shareBtn) shareBtn.classList.add('share-hide');
        if (finishBtn) finishBtn.classList.add('share-hide');
        el.classList.add('result-capture');

        try {
            const dataUrl = await toPng(el, {
                backgroundColor: bgColor,
                pixelRatio: 2,
                width: 500
            });

            const resp = await fetch(dataUrl);
            const blob = await resp.blob();

            if (blob) {
                const title = isTie ? '¡Empate en Friki VS!' : isWinner ? '¡Victoria en Friki VS!' : 'Duelo finalizado en Friki VS';
                const file = new File([blob], 'resultado-frikivs.png', { type: 'image/png' });
                await shareContent({
                    title,
                    text: `⚔️ ¡Acabo de terminar un duelo en Friki VS! ${isTie ? '¡Ha sido un empate épico!' : isWinner ? '¡He salido victorioso!' : '¡Buen duelo!'}`,
                    url: window.location.origin + '/frikivs',
                    file
                });
            }
        } catch (error) {
            console.error('Error sharing result:', error);
        } finally {
            if (shareBtn) shareBtn.classList.remove('share-hide');
            if (finishBtn) finishBtn.classList.remove('share-hide');
            el.classList.remove('result-capture');
            document.head.removeChild(tempStyle);
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-bg-main flex flex-col items-center justify-center p-6 text-center">
            <div ref={resultRef} className="max-w-md w-full bg-bg-side border border-border-theme rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl relative">
                <button
                    onClick={shareResultImage}
                    disabled={isSharing}
                    className="share-btn-result absolute top-6 right-6 p-3 bg-brand-primary/10 text-brand-primary rounded-2xl border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                </button>

                <img src="/assets/icon_vs.png" alt="VS" className="w-20 h-20 object-contain" />

                <div className="text-6xl">
                    {isTie ? '🤝' : isWinner ? '🏆' : '😤'}
                </div>

                <div>
                    <h2 className="text-3xl font-black text-text-main uppercase">
                        {isTie ? t('triviaVS.result.tie', '¡Empate!') : isWinner ? t('triviaVS.result.won', '¡Ganaste!') : t('triviaVS.result.lost', 'Derrota')}
                    </h2>
                    {result?.message === 'waiting' && (
                        <p className="text-sm text-text-muted mt-1 share-hide-el">{t('triviaVS.result.waiting', 'Esperando al oponente para confirmar el resultado...')}</p>
                    )}
                </div>

                <div className="w-full flex items-center justify-around bg-bg-sub rounded-2xl p-4">
                    <div>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">{t('triviaVS.result.yourScore', 'Tu puntaje')}</p>
                        <p className="text-3xl font-black text-brand-primary">{result?.your_score ?? 0}<span className="text-sm text-text-muted">/{totalQuestions}</span></p>
                    </div>
                    <div className="h-10 w-px bg-border-theme" />
                    <div>
                        <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-1">{t('triviaVS.result.opponent', 'Oponente')}</p>
                        <p className="text-3xl font-black text-text-sub">{result?.opponent_score ?? '?'}<span className="text-sm text-text-muted">/{totalQuestions}</span></p>
                    </div>
                </div>

                <button onClick={onClose} className="finish-btn-result w-full bg-brand-primary text-text-inv font-black py-4 rounded-2xl hover:bg-brand-primary-light transition-all shadow-lg shadow-brand-primary/30">
                    {t('common.finish', 'Finalizar')}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'public' | 'mine' | 'leaderboard';

export default function FrikiVS() {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [tab, setTab] = useState<Tab>('public');
    const [publicDuels, setPublicDuels] = useState<Duel[]>([]);
    const [myDuels, setMyDuels] = useState<Duel[]>([]);
    const [winners, setWinners] = useState<VSWinner[]>([]);
    const [categories, setCategories] = useState<VSCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // VS kill switch
    const { frikiVs: vsEnabled, loading: featuresLoading } = useGlobalFeatures(user?.id);

    // Duel creation
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<VSCategory | null>(null);
    const [wagerAmount, setWagerAmount] = useState(50);
    const [creating, setCreating] = useState(false);
    const [questionCount, setQuestionCount] = useState(10);  // mirrors app: default 10
    const [walletBalance, setWalletBalance] = useState<number | null>(null);  // for validation

    // Gameplay
    const [activeDuel, setActiveDuel] = useState<{ id: string; questionIds: string[] } | null>(null);
    const [showGameplay, setShowGameplay] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [gameResult, setGameResult] = useState<any>(null);

    // Confirm join modal
    const [confirmDuel, setConfirmDuel] = useState<Duel | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [duelsData, catsData] = await Promise.all([
                TriviaService.getLobbyDuels(user?.id || ''),
                TriviaService.getVSCategories(),
            ]);
            setPublicDuels(duelsData.publicOpenDuels || []);
            setMyDuels(duelsData.myPendingDuels || []);
            setCategories(catsData);

            // Load wallet balance for wager validation
            if (user) {
                const { data: wData } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
                if (wData) setWalletBalance(Number(wData.balance) || 0);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (tab === 'leaderboard' && winners.length === 0) {
            setLeaderboardLoading(true);
            TriviaService.getVSWinnersRanking(10).then(data => { setWinners(data); setLeaderboardLoading(false); });
        }
    }, [tab]);

    const handleCreateDuel = async () => {
        if (!selectedCategory || !user) return;
        if (walletBalance !== null && wagerAmount > walletBalance) {
            alert(t('triviaVS.wager.insufficient', 'Saldo insuficiente para esta apuesta'));
            return;
        }
        setCreating(true);
        try {
            const duelId = await TriviaService.createVSDuel(selectedCategory.id, questionCount, wagerAmount);
            const { data } = await supabase.from('trivia_duels').select('question_ids').eq('id', duelId).single();
            setActiveDuel({ id: duelId, questionIds: data?.question_ids || [] });
            setShowCreateModal(false);
            setShowGameplay(true);
        } catch (e: any) {
            alert(e.message || t('triviaVS.wager.insufficient', 'Saldo insuficiente'));
        } finally { setCreating(false); }
    };

    const handleJoinDuel = async (duel: Duel) => {
        setActiveDuel({ id: duel.id, questionIds: duel.question_ids });
        setConfirmDuel(null);
        setShowGameplay(true);
    };

    const handleGameFinish = async (score: number, timeMs: number) => {
        setShowGameplay(false);
        if (!activeDuel) return;
        try {
            const result = await TriviaService.submitVSResult(activeDuel.id, score, timeMs);
            setGameResult({ ...result, your_score: score });
        } catch (e) {
            setGameResult({ your_score: score, message: 'waiting' });
        }
        setShowResult(true);
    };

    if (featuresLoading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-brand-primary" size={48} /></div>;

    if (!vsEnabled) return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-8">
            <img src="/assets/icon_vs.png" alt="Friki VS" className="w-24 h-24 object-contain opacity-30 mb-6" />
            <h2 className="text-2xl font-black text-text-main">{t('triviaVS.disabled', 'Friki VS en Mantenimiento')}</h2>
            <p className="text-text-muted mt-2">{t('triviaVS.disabledHint', 'Los duelos VS están temporalmente desactivados. Vuelve pronto. ⚔️')}</p>
        </div>
    );

    // ── Gameplay overlay ─────────────────────────────────────────────────────
    if (showGameplay && activeDuel && user) {
        return <GameplayScreen
            duelId={activeDuel.id}
            questionIds={activeDuel.questionIds}
            userId={user.id}
            onFinish={handleGameFinish}
            onClose={() => { setShowGameplay(false); setActiveDuel(null); }}
        />;
    }

    if (showResult && gameResult) {
        return <ResultScreen
            result={gameResult}
            totalQuestions={activeDuel?.questionIds.length || 10}
            onClose={() => { setShowResult(false); setActiveDuel(null); setGameResult(null); loadData(); }}
        />;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <SEO 
                title="Friki VS | Duelos 1vs1"
                description="Compite en duelos de trivia en tiempo real. Reta a otros Frikis, apuesta tus Frikicoins y demuestra que eres el que más sabe de Anime y Videojuegos."
                keywords="Duelos Geek, Trivia VS, Competición Anime, Apuestas Frikicoins, Ranking VS"
                image="/assets/seo/vs_banner.png"
            />

            {/* Hero */}
            <div className="flex items-center gap-4 mb-8">
                <img src="/assets/icon_vs.png" alt="Friki VS" className="w-14 h-14 object-contain drop-shadow-lg" />
                <div>
                    <h1 className="text-4xl font-black text-text-main uppercase tracking-tighter">Friki VS</h1>
                    <p className="text-text-muted text-sm">{t('triviaVS.subtitle', 'Reta a la comunidad. Apuesta Frikicoins. Demuestra quién sabe más.')}</p>
                </div>
                {user && (
                    <div className="ml-auto flex flex-col md:flex-row items-end md:items-center gap-2">
                        <button
                            onClick={() => setShowSubmissionModal(true)}
                            className="flex items-center gap-2 bg-bg-sub text-brand-primary border-2 border-brand-primary px-4 py-3 rounded-2xl font-black hover:bg-brand-primary/10 transition-all hover:-translate-y-0.5 text-sm sm:text-base whitespace-nowrap"
                        >
                            {t('crowdsourcing.title', 'Aportar Preguntas')}
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-brand-primary text-text-inv px-5 py-3 rounded-2xl font-black shadow-lg shadow-brand-primary/30 hover:bg-brand-primary-light transition-all hover:-translate-y-0.5 text-sm sm:text-base whitespace-nowrap"
                        >
                            <Zap size={18} />
                            {t('triviaVS.createDuel', 'Crear Duelo')}
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-theme mb-6">
                {(['public', 'mine', 'leaderboard'] as Tab[]).map(t_ => (
                    <button
                        key={t_}
                        onClick={() => setTab(t_)}
                        className={`relative px-5 py-3 text-sm font-bold transition-colors flex items-center gap-2 ${tab === t_ ? 'text-brand-primary' : 'text-text-muted hover:text-text-sub'}`}
                    >
                        {t_ === 'public' && `${t('triviaVS.publicDuels', 'Disponibles')}${!loading ? ` (${publicDuels.length})` : ''}`}
                        {t_ === 'mine' && `${t('triviaVS.myDuels', 'Mis Retos')}${!loading ? ` (${myDuels.length})` : ''}`}
                        {t_ === 'leaderboard' && '🏆 Líderes'}
                        {tab === t_ && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t" />}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === 'leaderboard' ? (
                <Leaderboard winners={winners} loading={leaderboardLoading} />
            ) : loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
            ) : (
                <div className="space-y-3">
                    {(tab === 'public' ? publicDuels : myDuels).length === 0 ? (
                        <div className="text-center py-16 opacity-40">
                            <Swords size={56} className="mx-auto mb-4 text-text-muted" />
                            <p className="font-black uppercase text-text-muted text-sm">
                                {tab === 'public' ? t('triviaVS.noPublicDuels', 'No hay duelos disponibles') : t('triviaVS.noPendingDuels', 'No tienes retos pendientes')}
                            </p>
                        </div>
                    ) : (tab === 'public' ? publicDuels : myDuels).map(duel => (
                        <DuelCard key={duel.id} duel={duel} isMine={tab === 'mine'} onJoin={d => setConfirmDuel(d)} />
                    ))}
                </div>
            )}

            {/* Confirm Join Modal */}
            {confirmDuel && (
                <div className="fixed inset-0 z-50 bg-ui-overlay backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDuel(null)}>
                    <div className="bg-bg-side border border-border-theme rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <img
                                src={getTriviaIcon(confirmDuel.triviaduels_categories?.icon)}
                                alt={confirmDuel.triviaduels_categories?.name || 'VS'}
                                className="w-16 h-16 object-contain mx-auto mb-3"
                            />
                            <h3 className="font-black text-text-main text-xl">{confirmDuel.triviaduels_categories?.name}</h3>
                            <p className="text-text-muted text-sm mt-1">{t('triviaVS.joinDuelMessage', 'La apuesta es de {{amount}} FC. ¿Aceptas el reto?', { amount: confirmDuel.wager_amount })}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDuel(null)} className="flex-1 py-3 rounded-2xl border border-border-theme text-text-muted font-bold hover:bg-bg-sub transition">{t('common.cancel')}</button>
                            <button onClick={() => handleJoinDuel(confirmDuel)} className="flex-1 py-3 rounded-2xl bg-brand-primary text-text-inv font-black hover:bg-brand-primary-light transition shadow-lg shadow-brand-primary/30">
                                {t('common.accept', 'Aceptar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Duel Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-ui-overlay backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-bg-side border border-border-theme rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="font-black text-text-main text-xl mb-6 flex items-center gap-3">
                            <Zap size={22} className="text-brand-primary" />
                            {t('triviaVS.createDuel', 'Crear Duelo')}
                        </h3>

                        {/* Category grid */}
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{t('triviaVS.selectCategory', 'Elige una categoría')}</p>
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all gap-2 ${selectedCategory?.id === cat.id
                                        ? 'border-brand-primary bg-brand-primary/10'
                                        : 'border-border-theme hover:border-brand-primary/40 hover:bg-bg-sub'
                                        }`}
                                >
                                    <img
                                        src={getTriviaIcon(cat.icon, cat.id)}
                                        alt={cat.name}
                                        className="w-10 h-10 object-contain"
                                    />
                                    <span className="text-[11px] font-bold text-text-sub text-center leading-tight">{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Wager */}
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{t('triviaVS.wager.title', 'Apuesta (FC)')}</p>
                        <div className="flex gap-2 flex-wrap mb-2">
                            {[50, 100, 250, 500].map(amt => (
                                <button key={amt} onClick={() => setWagerAmount(amt)} className={`px-4 py-2 rounded-xl font-black text-sm border-2 transition-all ${wagerAmount === amt ? 'border-brand-primary bg-brand-primary text-text-inv' : 'border-border-theme text-text-sub hover:border-brand-primary/40'}`}>{amt}</button>
                            ))}
                        </div>
                        <input
                            type="range" min={50} max={10000} step={50}
                            value={wagerAmount} onChange={e => setWagerAmount(Number(e.target.value))}
                            className="w-full accent-brand-primary my-2"
                        />
                        <div className="flex justify-between text-xs text-text-muted mb-6">
                            <span>50 FC</span>
                            <span className="font-black text-brand-primary text-sm">{wagerAmount.toLocaleString()} FC</span>
                            <span>10,000 FC</span>
                        </div>

                        {/* Question Count Selector — mirrors app TriviaCategorySelectModal */}
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{t('triviaVS.questionCount', 'Cantidad de Preguntas')}</p>
                        <div className="flex gap-2 mb-6">
                            {[5, 10, 15].map(count => (
                                <button
                                    key={count}
                                    onClick={() => setQuestionCount(count)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 font-black text-sm transition-all ${questionCount === count
                                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                                        : 'border-border-theme text-text-sub hover:border-brand-primary/40 hover:bg-bg-sub'
                                        }`}
                                >
                                    {count} ❓
                                </button>
                            ))}
                        </div>

                        {/* Balance warning */}
                        {walletBalance !== null && (
                            <div className={`flex items-center justify-between text-xs mb-4 px-3 py-2 rounded-xl border ${wagerAmount > walletBalance
                                ? 'border-accent-red/30 bg-accent-red/5 text-accent-red'
                                : 'border-divider-theme bg-bg-sub text-text-muted'
                                }`}>
                                <span className="font-bold">Saldo disponible</span>
                                <span className="font-black">{walletBalance.toLocaleString()} FC</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-2xl border border-border-theme text-text-muted font-bold hover:bg-bg-sub transition">{t('common.cancel')}</button>
                            <button
                                onClick={handleCreateDuel}
                                disabled={!selectedCategory || creating || (walletBalance !== null && wagerAmount > walletBalance)}
                                className="flex-[2] py-3 rounded-2xl bg-brand-primary text-text-inv font-black hover:bg-brand-primary-light transition shadow-lg shadow-brand-primary/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                                {creating
                                    ? t('common.loading')
                                    : walletBalance !== null && wagerAmount > walletBalance
                                        ? 'Saldo insuficiente'
                                        : t('triviaVS.wager.confirm', 'Crear y Jugar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submission Modal */}
            {showSubmissionModal && user && (
                <TriviaSubmissionModal
                    userId={user.id}
                    onClose={() => setShowSubmissionModal(false)}
                />
            )}
        </div>
    );
}
