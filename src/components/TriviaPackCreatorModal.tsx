import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, CheckCircle2, X, Loader2, Info, ArrowLeft, ArrowRight, Edit2, ClipboardCheck } from 'lucide-react';
import { TriviaService } from '../services/TriviaService';
import { getTriviaIcon } from '../utils/triviaIcons';

interface Question {
    question_text: string;
    options: { text: string; is_correct: boolean }[];
}

const PACK_SIZES = [5, 10, 15];

const EMPTY_QUESTION = (): Question => ({
    question_text: '',
    options: [
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
    ],
});

interface TriviaPackCreatorModalProps {
    userId: string;
    onClose: () => void;
}

export default function TriviaPackCreatorModal({ userId, onClose }: TriviaPackCreatorModalProps) {
    const { t } = useTranslation();

    // Global toggle / gate state
    const [featureEnabled, setFeatureEnabled] = useState<boolean | null>(null);
    const [checkingGate, setCheckingGate] = useState(true);

    // Wizard step: 'setup' | 'questions' | 'review'
    const [step, setStep] = useState<'setup' | 'questions' | 'review'>('setup');

    // Step 1: Setup
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [packTitle, setPackTitle] = useState('');
    const [packDescription, setPackDescription] = useState('');
    const [packSize, setPackSize] = useState(5);

    // Step 2: Questions
    const [questions, setQuestions] = useState<Question[]>([EMPTY_QUESTION()]);
    const [currentQIndex, setCurrentQIndex] = useState(0);

    // Submission / Loader
    const [submitting, setSubmitting] = useState(false);
    const [loadingCats, setLoadingCats] = useState(true);

    const currentQ = questions[currentQIndex];
    const rewardIfApproved = packSize * 10;
    const timeLimitPreview = packSize * 15;

    useEffect(() => {
        const checkGateAndLoad = async () => {
            try {
                const enabled = await TriviaService.getUserTriviasEnabled();
                setFeatureEnabled(enabled);
                if (enabled) {
                    const cats = await TriviaService.getVSCategories();
                    const filtered = cats.filter((c: any) => c.id !== 'random');
                    setCategories(filtered);
                    if (filtered.length > 0) setSelectedCategoryId(filtered[0].id);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setCheckingGate(false);
                setLoadingCats(false);
            }
        };
        checkGateAndLoad();
    }, []);

    // Navigate Setup -> Questions
    const handleSetupNext = () => {
        if (!packTitle.trim()) {
            alert(t('triviaPack.errors.titleRequired', 'El título de la trivia es obligatorio.') as string);
            return;
        }
        if (!selectedCategoryId) {
            alert(t('triviaPack.errors.categoryRequired', 'Selecciona una categoría.') as string);
            return;
        }
        // Initialize questions array with selected size
        setQuestions(Array.from({ length: packSize }, EMPTY_QUESTION));
        setCurrentQIndex(0);
        setStep('questions');
    };

    // Question Editing Handlers
    const handleQuestionTextChange = (text: string) => {
        const updated = [...questions];
        updated[currentQIndex] = { ...updated[currentQIndex], question_text: text };
        setQuestions(updated);
    };

    const handleOptionTextChange = (optIndex: number, text: string) => {
        const updated = [...questions];
        const opts = [...updated[currentQIndex].options];
        opts[optIndex] = { ...opts[optIndex], text };
        updated[currentQIndex] = { ...updated[currentQIndex], options: opts };
        setQuestions(updated);
    };

    const handleSetCorrectOption = (optIndex: number) => {
        const updated = [...questions];
        const opts = updated[currentQIndex].options.map((o, i) => ({
            ...o,
            is_correct: i === optIndex,
        }));
        updated[currentQIndex] = { ...updated[currentQIndex], options: opts };
        setQuestions(updated);
    };

    const validateCurrentQuestion = (): boolean => {
        const q = questions[currentQIndex];
        if (!q.question_text.trim()) {
            alert(t('triviaPack.errors.questionRequired', 'La pregunta no puede estar vacía.') as string);
            return false;
        }
        if (q.options.some(o => !o.text.trim())) {
            alert(t('triviaPack.errors.optionsRequired', 'Todas las opciones deben tener texto.') as string);
            return false;
        }
        if (!q.options.some(o => o.is_correct)) {
            alert(t('triviaPack.errors.correctAnswerRequired', 'Selecciona cuál es la respuesta correcta.') as string);
            return false;
        }
        return true;
    };

    const handleQuestionNext = () => {
        if (!validateCurrentQuestion()) return;
        if (currentQIndex < packSize - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            setStep('review');
        }
    };

    const handleQuestionBack = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        } else {
            setStep('setup');
        }
    };

    // Submit Complete Trivia Pack
    const handleSubmit = async () => {
        if (!userId) return;
        setSubmitting(true);
        try {
            await TriviaService.submitTriviaPack({
                userId,
                categoryId: selectedCategoryId,
                title: packTitle.trim(),
                description: packDescription.trim(),
                questions: questions.map((q, i) => ({
                    question_text: q.question_text.trim(),
                    options: q.options.map(opt => ({ text: opt.text.trim(), is_correct: opt.is_correct })),
                    order: i + 1,
                })),
            });
            alert(t('triviaPack.success.message', 'Tu propuesta de trivia fue enviada para revisión. Si es aprobada, recibirás Frikicoins.') as string);
            onClose();
        } catch (error: any) {
            alert(error.message || (t('triviaPack.errors.submitFailed', 'No se pudo enviar la trivia.') as string));
        } finally {
            setSubmitting(false);
        }
    };

    if (checkingGate) {
        return (
            <div className="fixed inset-0 z-[400] bg-ui-overlay backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-bg-side border border-border-theme rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-brand-primary" size={48} />
                    <p className="text-text-muted text-sm font-bold">{t('common.loading', 'Cargando...') as string}</p>
                </div>
            </div>
        );
    }

    if (!featureEnabled) {
        return (
            <div className="fixed inset-0 z-[400] bg-ui-overlay backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-bg-side border border-border-theme rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between w-full">
                        <h3 className="font-black text-text-main text-xl uppercase tracking-tighter">{t('triviaPack.headerTitle', 'Aportar Trivia') as string}</h3>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-sub transition text-text-muted hover:text-text-main">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="text-center py-6 flex flex-col items-center gap-4">
                        <div className="p-4 bg-accent-red/10 text-accent-red rounded-full">
                            <Info size={40} />
                        </div>
                        <h4 className="font-black text-text-main text-lg">{t('triviaPack.unavailableTitle', 'Función no disponible') as string}</h4>
                        <p className="text-sm text-text-muted leading-relaxed">
                            {t('triviaPack.unavailableMessage', 'El sistema de aportes de trivias está temporalmente desactivado. Inténtalo más tarde.') as string}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-full bg-brand-primary text-text-inv font-black py-3 rounded-2xl hover:bg-brand-primary-light transition">
                        {t('common.close', 'Cerrar') as string}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[400] bg-ui-overlay backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-bg-side border border-border-theme rounded-3xl p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-6"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="text-brand-primary" size={24} />
                        <h3 className="font-black text-text-main text-xl tracking-tighter uppercase">
                            {step === 'setup' && (t('triviaPack.headerTitleWithEmoji', '📦 Aportar Trivia') as string)}
                            {step === 'questions' && (t('triviaPack.wizard.questionHeader', 'Pregunta {{index}} de {{total}}', { index: currentQIndex + 1, total: packSize }) as string)}
                            {step === 'review' && (t('triviaPack.review.headerTitle', '📋 Revisar y Enviar') as string)}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-sub transition text-text-muted hover:text-text-main">
                        <X size={24} />
                    </button>
                </div>

                {/* STEP 1: SETUP */}
                {step === 'setup' && (
                    <div className="flex flex-col gap-5">
                        {/* Reward Banner */}
                        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                            <Trophy size={24} className="text-amber-500 shrink-0" />
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-amber-500">{t('triviaPack.rewardBannerTitle', 'Gana Frikicoins si es aprobada') as string}</h4>
                                <p className="text-xs text-text-sub mt-0.5">{t('triviaPack.rewardBannerSub', '10 FC por pregunta aprobada · Límite: 1 trivia por semana') as string}</p>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-2">{t('triviaPack.setup.titleLabel', 'TÍTULO DE LA TRIVIA') as string}</label>
                            <input
                                type="text"
                                value={packTitle}
                                onChange={e => setPackTitle(e.target.value)}
                                placeholder={t('triviaPack.setup.titlePlaceholder', 'Ej: Las mejores preguntas de Cine') as string}
                                className="w-full bg-bg-sub border border-border-theme rounded-2xl p-4 text-text-main font-medium focus:border-brand-primary focus:outline-none transition-colors"
                                maxLength={100}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-2">{t('triviaPack.setup.descLabel', 'DESCRIPCIÓN (OPCIONAL)') as string}</label>
                            <textarea
                                value={packDescription}
                                onChange={e => setPackDescription(e.target.value)}
                                placeholder={t('triviaPack.setup.descPlaceholder', 'Describe tu trivia brevemente...') as string}
                                className="w-full bg-bg-sub border border-border-theme rounded-2xl p-4 text-text-main font-medium focus:border-brand-primary focus:outline-none transition-colors min-h-[70px] resize-none"
                                maxLength={200}
                            />
                        </div>

                        {/* Category selection */}
                        <div>
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-2">{t('triviaPack.setup.categoryLabel', 'CATEGORÍA') as string}</label>
                            {loadingCats ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-brand-primary" size={24} /></div>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all gap-1 ${selectedCategoryId === cat.id
                                                ? 'border-brand-primary bg-brand-primary/10'
                                                : 'border-border-theme hover:border-brand-primary/40 hover:bg-bg-sub'
                                                }`}
                                        >
                                            <img src={getTriviaIcon(cat.icon, cat.id)} alt={cat.name} className="w-8 h-8 object-contain" />
                                            <span className="text-[10px] font-bold text-text-sub text-center leading-tight truncate w-full">{t('categories.' + cat.id, cat.name) as string}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Questions count size */}
                        <div>
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-2">{t('triviaPack.setup.sizeLabel', 'CANTIDAD DE PREGUNTAS') as string}</label>
                            <div className="flex gap-3">
                                {PACK_SIZES.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setPackSize(size)}
                                        className={`flex-1 flex flex-col items-center py-3 rounded-2xl border-2 transition-all ${packSize === size
                                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                                            : 'border-border-theme text-text-sub hover:border-brand-primary/40 hover:bg-bg-sub'
                                            }`}
                                    >
                                        <span className="text-xl font-black">{size}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('triviaPack.setup.questionsUnit', 'preguntas') as string}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preview Box */}
                        <div className="bg-bg-sub border border-border-theme rounded-2xl p-4 flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">{t('triviaPack.setup.previewTitle', '📊 Si es aprobado') as string}</h4>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-muted font-bold flex items-center gap-1.5"><Trophy size={14} className="text-amber-500" /> {t('triviaPack.setup.previewRewardLabel', 'Recibirás') as string}</span>
                                <span className="font-black text-amber-500">{rewardIfApproved} Frikicoins</span>
                            </div>
                            <div className="h-px bg-border-theme" />
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-muted font-bold flex items-center gap-1.5"><Info size={14} className="text-brand-secondary" /> {t('triviaPack.setup.previewTimeLabel', 'Tiempo asignado') as string}</span>
                                <span className="font-black text-text-main">{Math.floor(timeLimitPreview / 60)}m {timeLimitPreview % 60 > 0 ? `${timeLimitPreview % 60}s` : ''}</span>
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={handleSetupNext}
                            className="w-full bg-brand-primary text-text-inv font-black py-4 rounded-2xl hover:bg-brand-primary-light transition-all shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2 mt-4"
                        >
                            <span>{t('triviaPack.setup.continueBtn', 'Continuar — Crear Preguntas') as string}</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* STEP 2: QUESTIONS */}
                {step === 'questions' && (
                    <div className="flex flex-col gap-5">
                        {/* Progress line */}
                        <div className="w-full bg-bg-sub h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-primary transition-all duration-300"
                                style={{ width: `${((currentQIndex + 1) / packSize) * 100}%` }}
                            />
                        </div>

                        {/* Question Text */}
                        <div>
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-2">{t('triviaPack.wizard.questionLabel', 'PREGUNTA') as string}</label>
                            <textarea
                                value={currentQ.question_text}
                                onChange={e => handleQuestionTextChange(e.target.value)}
                                placeholder={t('triviaPack.wizard.questionPlaceholder', 'Escribe aquí la pregunta...') as string}
                                className="w-full bg-bg-sub border border-border-theme rounded-2xl p-4 text-text-main font-medium focus:border-brand-primary focus:outline-none transition-colors min-h-[90px] resize-none"
                                maxLength={250}
                            />
                            <div className="text-right text-[10px] text-text-muted font-bold mt-1">
                                {currentQ.question_text.length}/250
                            </div>
                        </div>

                        {/* Options */}
                        <div>
                            <label className="text-[11px] font-black text-text-muted uppercase tracking-widest block mb-3">{t('triviaPack.wizard.optionsLabel', 'OPCIONES · Toca la correcta para marcarla') as string}</label>
                            <div className="flex flex-col gap-3">
                                {currentQ.options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleSetCorrectOption(i)}
                                            className={`p-2.5 rounded-xl border-2 transition-colors flex-shrink-0 ${opt.is_correct
                                                ? 'bg-accent-green/20 border-accent-green text-accent-green'
                                                : 'border-border-theme text-text-muted hover:border-text-sub'
                                                }`}
                                        >
                                            {opt.is_correct ? <CheckCircle2 size={22} /> : <div className="w-5.5 h-5.5 border-2 border-inherit rounded-full" />}
                                        </button>
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={e => handleOptionTextChange(i, e.target.value)}
                                            placeholder={t('triviaPack.wizard.optionPlaceholder', 'Opción {{index}}', { index: i + 1 }) as string}
                                            className={`w-full bg-bg-sub border rounded-xl px-4 py-3 text-text-main focus:outline-none transition-all ${opt.is_correct
                                                ? 'border-accent-green/60 bg-accent-green/5 focus:border-accent-green'
                                                : 'border-border-theme focus:border-brand-primary'
                                                }`}
                                            maxLength={80}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nav Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-border-theme mt-4">
                            <button
                                onClick={handleQuestionBack}
                                className="flex-1 py-3.5 rounded-2xl border-2 border-border-theme text-text-muted font-bold hover:bg-bg-sub transition flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={18} />
                                <span>{t('common.back', 'Atrás') as string}</span>
                            </button>
                            <button
                                onClick={handleQuestionNext}
                                className="flex-[2] py-3.5 rounded-2xl bg-brand-primary text-text-inv font-black hover:bg-brand-primary-light transition-all shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2"
                            >
                                <span>
                                    {currentQIndex < packSize - 1
                                        ? (t('triviaPack.wizard.nextQuestionBtn', 'Siguiente Pregunta') as string)
                                        : (t('triviaPack.wizard.reviewTriviaBtn', 'Revisar Trivia') as string)}
                                </span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW & SUBMIT */}
                {step === 'review' && (
                    <div className="flex flex-col gap-5">
                        {/* Summary Card */}
                        <div className="bg-bg-sub border border-brand-primary/20 rounded-2xl p-5 flex flex-col gap-4">
                            <div>
                                <h4 className="text-lg font-black text-text-main">{packTitle}</h4>
                                {packDescription && <p className="text-xs text-text-muted mt-1 leading-relaxed">{packDescription}</p>}
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs font-bold text-text-sub">
                                <span className="flex items-center gap-1"><ClipboardCheck size={14} className="text-brand-primary" /> {selectedCategoryId && (t('categories.' + selectedCategoryId, categories.find(c => c.id === selectedCategoryId)?.name) as string)}</span>
                                <span className="flex items-center gap-1"><Info size={14} className="text-brand-primary" /> {packSize} {t('triviaPack.setup.questionsUnit', 'preguntas') as string}</span>
                                <span className="flex items-center gap-1 text-amber-500"><Trophy size={14} /> +{rewardIfApproved} FC si es aprobada</span>
                            </div>
                        </div>

                        {/* Questions list */}
                        <div className="flex flex-col gap-2 max-h-[35vh] overflow-y-auto pr-1">
                            {questions.map((q, i) => (
                                <div key={i} className="flex items-center justify-between bg-bg-sub border border-border-theme rounded-2xl p-4 hover:border-brand-primary/30 transition-all gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary font-black flex items-center justify-center text-xs shrink-0">{i + 1}</div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-text-main font-bold truncate">{q.question_text}</p>
                                            <p className="text-xs text-accent-green font-bold mt-1">
                                                ✅ {q.options.find(o => o.is_correct)?.text || (t('triviaPack.review.noAnswer', 'Sin respuesta') as string)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCurrentQIndex(i);
                                            setStep('questions');
                                        }}
                                        className="p-2 rounded-xl border border-border-theme hover:bg-bg-side hover:text-brand-primary transition-colors text-text-muted shrink-0"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Info Note */}
                        <div className="flex items-start gap-2.5 bg-bg-sub p-3.5 border border-border-theme rounded-2xl text-[11px] text-text-muted leading-relaxed">
                            <Info size={16} className="text-text-muted shrink-0 mt-0.5" />
                            <p>{t('triviaPack.review.submitNote', 'Tu trivia será revisada por el equipo de Ciudad Friki. Si es aprobada, recibirás Frikicoins y se publicará como trivia oficial en el juego.') as string}</p>
                        </div>

                        {/* Submit Actions */}
                        <div className="flex gap-3 pt-4 border-t border-border-theme mt-2">
                            <button
                                onClick={() => {
                                    setCurrentQIndex(packSize - 1);
                                    setStep('questions');
                                }}
                                disabled={submitting}
                                className="flex-1 py-3.5 rounded-2xl border-2 border-border-theme text-text-muted font-bold hover:bg-bg-sub transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <ArrowLeft size={18} />
                                <span>{t('common.back', 'Atrás') as string}</span>
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-[2] py-3.5 rounded-2xl bg-accent-green text-text-inv font-black hover:bg-accent-green/90 transition-all shadow-lg shadow-accent-green/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Trophy size={18} />}
                                <span>{submitting ? (t('common.loading', 'Enviando...') as string) : (t('triviaPack.review.submitBtn', 'Enviar Trivia') as string)}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
