import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, CheckCircle2, X, Loader2, Info, PlusCircle } from 'lucide-react';
import { TriviaService } from '../services/TriviaService';
import { getTriviaIcon } from '../utils/triviaIcons';

interface TriviaSubmissionModalProps {
    userId: string;
    onClose: () => void;
}

export default function TriviaSubmissionModal({ userId, onClose }: TriviaSubmissionModalProps) {
    const { t } = useTranslation();

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState([
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        TriviaService.getVSCategories()
            .then(data => {
                const filtered = data.filter((c: any) => c.id !== 'random');
                setCategories(filtered);
                if (filtered.length > 0) setSelectedCategoryId(filtered[0].id);
                setLoadingCategories(false);
            })
            .catch(err => {
                console.error('Error fetching categories:', err);
                setLoadingCategories(false);
            });
    }, []);

    const handleOptionChange = (index: number, text: string) => {
        const newOptions = [...options];
        newOptions[index].text = text;
        setOptions(newOptions);
    };

    const handleSetCorrect = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            is_correct: i === index
        }));
        setOptions(newOptions);
    };

    const handleSubmit = async (addAnother: boolean = false) => {
        const trimmedQuestion = questionText.trim();
        if (!selectedCategoryId || !trimmedQuestion) {
            alert(t('crowdsourcing.errors.incomplete', 'Por favor, completa la pregunta y selecciona una categoría.'));
            return;
        }

        if (trimmedQuestion.length > 250) {
            alert("La pregunta no puede exceder los 250 caracteres.");
            return;
        }

        const processedOptions = options.map(opt => ({ ...opt, text: opt.text.trim() }));
        if (processedOptions.some(opt => !opt.text)) {
            alert(t('crowdsourcing.errors.emptyOptions', 'Todas las opciones deben tener texto.'));
            return;
        }

        if (processedOptions.some(opt => opt.text.length > 80)) {
            alert("Las opciones no pueden exceder los 80 caracteres.");
            return;
        }

        setSubmitting(true);
        try {
            await TriviaService.submitQuestion(userId, selectedCategoryId, trimmedQuestion, processedOptions);
            alert(t('crowdsourcing.successDetail', 'Pregunta enviada. Si es aprobada, ganarás Frikicoins.'));
            if (addAnother) {
                setQuestionText('');
                setOptions([
                    { text: '', is_correct: true },
                    { text: '', is_correct: false },
                    { text: '', is_correct: false },
                    { text: '', is_correct: false },
                ]);
            } else {
                onClose();
            }
        } catch (error: any) {
            alert(error.message || t('crowdsourcing.errors.loadError', 'Error al procesar la solicitud.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[400] bg-ui-overlay backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-bg-side border border-border-theme rounded-3xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-6"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-text-main text-2xl tracking-tighter uppercase">{t('crowdsourcing.title', 'Aportar Preguntas')}</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-sub transition text-text-muted hover:text-text-main">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex items-start gap-3 bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl">
                    <Info size={24} className="text-brand-primary shrink-0" />
                    <p className="text-sm font-bold text-brand-primary leading-tight">
                        Aporta tus propias preguntas a la comunidad. Si son aprobadas por los moderadores, ¡ganarás 10 Frikicoins por cada una!
                    </p>
                </div>

                {loadingCategories ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand-primary" size={32} /></div>
                ) : (
                    <div className="flex flex-col gap-6 overflow-y-auto pr-2 pb-2">
                        {/* Category */}
                        <div>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{t('crowdsourcing.category', 'Categoría')}</p>
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
                                        <span className="text-[10px] font-bold text-text-sub text-center leading-tight truncate w-full">{cat.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question */}
                        <div>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{t('crowdsourcing.question', 'Pregunta')}</p>
                            <textarea
                                value={questionText}
                                onChange={e => setQuestionText(e.target.value)}
                                placeholder={t('crowdsourcing.questionPlaceholder', 'Escribe tu pregunta aquí')}
                                className="w-full bg-bg-sub border border-border-theme rounded-2xl p-4 text-text-main font-medium focus:border-brand-primary focus:outline-none transition-colors min-h-[100px] resize-none"
                                maxLength={200}
                            />
                        </div>

                        {/* Options */}
                        <div>
                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">{t('crowdsourcing.options', 'Opciones')}</p>
                            <div className="flex flex-col gap-3">
                                {options.map((opt, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleSetCorrect(index)}
                                            className={`p-2 rounded-xl border-2 transition-colors flex-shrink-0 ${opt.is_correct
                                                ? 'bg-accent-green/20 border-accent-green text-accent-green'
                                                : 'border-border-theme text-text-muted hover:border-text-sub'
                                                }`}
                                        >
                                            {opt.is_correct ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 border-2 border-inherit rounded-full" />}
                                        </button>
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={e => handleOptionChange(index, e.target.value)}
                                            placeholder={`${t('crowdsourcing.optionLabel', 'Opción')} ${index + 1}`}
                                            className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-text-main focus:border-brand-primary focus:outline-none transition-colors"
                                            maxLength={80}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-border-theme mt-auto">
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                className="flex-1 py-3 rounded-2xl border-2 border-brand-primary text-brand-primary font-black hover:bg-brand-primary/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <PlusCircle size={18} />
                                <span className="hidden sm:inline">{t('crowdsourcing.submitAnother', 'Añadir Más')}</span>
                            </button>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="flex-[2] py-3 rounded-2xl bg-brand-primary text-text-inv font-black hover:bg-brand-primary-light transition shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Trophy size={18} />}
                                {t('crowdsourcing.submit', 'Enviar Variante')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
