import { useState, useEffect } from 'react';
import {
    X, PlusCircle, Trash2, ArrowUp, ArrowDown,
    Save, Play, Loader2
} from 'lucide-react';
import { TriviaAdminService } from '../../services/TriviaAdminService';
import type { Trivia, TriviaQuestion } from '../../types/trivia';

interface TriviaBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    triviaToEdit?: Trivia | null;
    onSave: () => void;
}

export function TriviaBuilderModal({
    isOpen,
    onClose,
    triviaToEdit,
    onSave
}: TriviaBuilderModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timeLimit, setTimeLimit] = useState('60');

    // Default dates
    const initialPublishDate = new Date();
    const [publishDate, setPublishDate] = useState<string>(initialPublishDate.toISOString().split('T')[0]);

    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

    const [saving, setSaving] = useState(false);
    const [hasAttempts, setHasAttempts] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (triviaToEdit) {
                setTitle(triviaToEdit.title);
                setDescription(triviaToEdit.description || '');
                setTimeLimit(triviaToEdit.time_limit_seconds.toString());
                setPublishDate(new Date(triviaToEdit.publish_date).toISOString().split('T')[0]);
                setHasAttempts((triviaToEdit.attempt_count || 0) > 0);
                loadTriviaQuestions(triviaToEdit.id);
            } else {
                resetForm();
            }
        }
    }, [isOpen, triviaToEdit]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setTimeLimit('60');
        setPublishDate(initialPublishDate.toISOString().split('T')[0]);
        setQuestions([]);
        setCurrentQuestion(null);
        setEditingQuestionIndex(null);
        setHasAttempts(false);
    };

    const loadTriviaQuestions = async (triviaId: string) => {
        const fullTrivia = await TriviaAdminService.getTriviaWithQuestions(triviaId);
        if (fullTrivia && fullTrivia.questions) setQuestions(fullTrivia.questions);
    };

    const handleAddQuestion = () => {
        const newQuestion: TriviaQuestion = {
            id: `q_${Date.now()}`,
            text: '',
            points: 10,
            order: questions.length + 1,
            options: [
                { id: `o_${Date.now()}_1`, text: '', is_correct: true },
                { id: `o_${Date.now()}_2`, text: '', is_correct: false }
            ]
        };
        setCurrentQuestion(newQuestion);
        setEditingQuestionIndex(questions.length);
    };

    const handleEditQuestion = (index: number) => {
        if (hasAttempts) {
            alert('No se puede editar una pregunta de una trivia que ya ha sido jugada.');
            return;
        }
        setCurrentQuestion({ ...questions[index] });
        setEditingQuestionIndex(index);
    };

    const handleDeleteQuestion = (index: number) => {
        if (hasAttempts) {
            alert('No se puede eliminar una pregunta de una trivia jugada.');
            return;
        }
        if (window.confirm('¿Seguro que deseas eliminar esta pregunta?')) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const swapQuestions = (idx1: number, idx2: number) => {
        if (hasAttempts) return;
        const newQ = [...questions];
        [newQ[idx1], newQ[idx2]] = [newQ[idx2], newQ[idx1]];
        newQ.forEach((q, i) => q.order = i + 1); // fix order
        setQuestions(newQ);
    };

    const saveCurrentQuestion = () => {
        if (!currentQuestion || !currentQuestion.text.trim()) {
            alert('El texto de la pregunta es obligatorio.');
            return;
        }

        const validOpts = currentQuestion.options.filter(o => o.text.trim());
        if (validOpts.length < 2) {
            alert('Debes agregar al menos 2 opciones válidas.');
            return;
        }

        if (!validOpts.some(o => o.is_correct)) {
            alert('Debes marcar al menos una opción como correcta.');
            return;
        }

        const newQ = [...questions];
        if (editingQuestionIndex !== null && editingQuestionIndex < newQ.length) {
            newQ[editingQuestionIndex] = { ...currentQuestion, options: validOpts };
        } else {
            newQ.push({ ...currentQuestion, options: validOpts });
        }
        setQuestions(newQ);
        setCurrentQuestion(null);
        setEditingQuestionIndex(null);
    };

    const handleSave = async (status: 'draft' | 'active') => {
        if (!title.trim()) {
            alert('El título es obligatorio.');
            return;
        }
        if (questions.length === 0) {
            alert('Debes agregar al menos una pregunta.');
            return;
        }

        setSaving(true);
        try {
            const triviaData: Partial<Trivia> = {
                title,
                description,
                time_limit_seconds: parseInt(timeLimit) || 60,
                publish_date: new Date(publishDate).toISOString(),
                status
            };

            let result;
            if (triviaToEdit) {
                result = await TriviaAdminService.updateTrivia(triviaToEdit.id, triviaData, questions);
            } else {
                result = await TriviaAdminService.createTrivia(triviaData, questions);
            }

            if (result.error) throw result.error;

            onSave();
        } catch (error: any) {
            console.error('Error al guardar trivia:', error);
            alert('Error al guardar la trivia: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-bg-side w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-border-theme relative slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-bg-pop">
                    <div>
                        <h2 className="text-xl font-black text-text-main">
                            {triviaToEdit ? 'Editar Trivia' : 'Crear Trivia'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="group p-2 text-text-muted hover:text-accent-red rounded-full hover:bg-accent-red/10 transition-all duration-300"
                        title="Cerrar (Esc)"
                    >
                        <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-text-main border-b border-border-theme pb-2">Configuración General</h3>

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">Título *</label>
                            <input
                                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-brand-primary outline-none"
                                placeholder="Ej: Trivia Cinéfila"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">Descripción</label>
                            <textarea
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-brand-primary outline-none h-24 resize-none"
                                placeholder="Describe el tema..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">Tiempo Límite (Segundos)</label>
                                <input
                                    type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} min="10" step="10"
                                    className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">Publicación</label>
                                <input
                                    type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)}
                                    className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border-theme pb-2 mt-6">
                            <h3 className="font-bold text-lg text-text-main">Preguntas de Trivi ({questions.length})</h3>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-6 bg-bg-pop rounded-xl border border-border-theme border-dashed">
                                <p className="text-text-muted text-sm font-bold">Aún no hay preguntas.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {questions.map((q, i) => (
                                    <div key={q.id} className="bg-bg-pop border border-border-theme rounded-xl p-4 flex gap-4 pr-12 relative group">
                                        <div className="flex-1">
                                            <p className="font-bold text-text-main leading-tight mb-1">
                                                {i + 1}. {q.text}
                                            </p>
                                            <p className="text-xs text-brand-primary font-bold">{q.points} Pts • {q.options?.length || 0} Opciones</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity divide-y divide-border-theme">
                                            <button disabled={i === 0 || hasAttempts} onClick={() => swapQuestions(i, i - 1)} className="p-1.5 text-text-main disabled:opacity-30 hover:text-amber-500">
                                                <ArrowUp size={14} />
                                            </button>
                                            <button disabled={i === questions.length - 1 || hasAttempts} onClick={() => swapQuestions(i, i + 1)} className="p-1.5 text-text-main disabled:opacity-30 hover:text-amber-500">
                                                <ArrowDown size={14} />
                                            </button>
                                            <button onClick={() => handleEditQuestion(i)} className="p-1.5 text-text-main hover:text-brand-primary">
                                                <PlusCircle size={14} className="rotate-45" />
                                            </button>
                                            <button onClick={() => handleDeleteQuestion(i)} className="p-1.5 text-text-main hover:text-accent-red">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            disabled={hasAttempts}
                            onClick={handleAddQuestion}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-brand-primary/50 text-brand-primary font-bold hover:bg-brand-primary/10 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <PlusCircle size={20} /> Agegar Pregunta
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border-theme bg-bg-pop flex gap-3">
                    <button
                        onClick={() => handleSave('draft')} disabled={saving}
                        className="flex-1 py-3 rounded-xl font-bold border border-border-theme text-text-main hover:bg-bg-side flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Guardar Borrador
                    </button>
                    <button
                        onClick={() => handleSave('active')} disabled={saving}
                        className="flex-1 py-3 rounded-xl font-bold bg-brand-primary hover:bg-blue-600 text-white flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                        ¡Publicar Trivia!
                    </button>
                </div>

                {/* Editor Over Modal */}
                {currentQuestion && (
                    <div className="absolute inset-0 bg-bg-side z-50 flex flex-col slide-in-from-bottom-full duration-300">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-theme bg-bg-pop">
                            <h2 className="text-lg font-black text-text-main">
                                Editando Pregunta
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setCurrentQuestion(null); setEditingQuestionIndex(null); }} className="px-4 py-2 text-text-muted hover:text-text-main font-bold transition">
                                    Cancelar
                                </button>
                                <button onClick={saveCurrentQuestion} className="bg-brand-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md shadow-brand-primary/20">
                                    Hecho
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block font-bold text-text-sub mb-2">Pregunta *</label>
                                <input
                                    type="text" autoFocus
                                    className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main text-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="Ej: ¿En qué año salió...?"
                                    value={currentQuestion.text}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-text-sub mb-2">Puntos de recompensa</label>
                                <input
                                    type="number"
                                    className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-brand-primary outline-none"
                                    value={currentQuestion.points}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 10 })}
                                />
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border-theme">
                                <h3 className="font-bold text-text-main">Opciones de Respuesta</h3>
                                <p className="text-xs text-text-muted mb-4">La correcta está marcada con el círculo verde.</p>
                                {currentQuestion.options?.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="radio"
                                            name="correct_option"
                                            checked={opt.is_correct}
                                            onChange={() => {
                                                const newOpts = currentQuestion.options.map((o, index) => ({
                                                    ...o, is_correct: index === idx
                                                }));
                                                setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                            }}
                                            className="w-5 h-5 text-accent-green bg-bg-side border-border-theme"
                                        />
                                        <input
                                            type="text" value={opt.text}
                                            onChange={(e) => {
                                                const newOpts = [...currentQuestion.options];
                                                newOpts[idx].text = e.target.value;
                                                setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                            }}
                                            className={`flex-1 bg-bg-pop border rounded-xl px-4 py-2 text-text-main focus:ring-2 focus:ring-brand-primary outline-none ${opt.is_correct ? 'border-accent-green/50' : 'border-border-theme'}`}
                                            placeholder={`Opción ${idx + 1}`}
                                        />
                                        {currentQuestion.options.length > 2 && (
                                            <button onClick={() => {
                                                const newOpts = currentQuestion.options.filter((_, i) => i !== idx);
                                                setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                            }} className="p-3 text-text-muted hover:text-accent-red transition">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={() => setCurrentQuestion({
                                    ...currentQuestion,
                                    options: [...currentQuestion.options, { id: `o_${Date.now()}`, text: '', is_correct: false }]
                                })}
                                    className="w-full mt-4 py-2 rounded-xl border border-dashed border-text-muted text-text-main font-bold hover:bg-bg-pop transition flex items-center justify-center gap-2">
                                    <PlusCircle size={18} /> Agregar Opción
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
