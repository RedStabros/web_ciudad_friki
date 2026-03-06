import { useState, useEffect } from 'react';
import {
    X, AlertCircle, PlusCircle, Trash2, ArrowUp, ArrowDown,
    Save, Play, FileText, CheckSquare, List, Star, Activity, Loader2
} from 'lucide-react';
import { SurveyAdminService } from '../../services/SurveyAdminService';
import type { AdminSurvey, SurveyQuestion, QuestionType, SurveyData } from '../../types/survey';

interface SurveyBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    surveyToEdit?: AdminSurvey | null;
    onSave: () => void;
}

export function SurveyBuilderModal({
    isOpen,
    onClose,
    userId,
    surveyToEdit,
    onSave
}: SurveyBuilderModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rewardAmount, setRewardAmount] = useState('0');

    // Default dates
    const initialPublishDate = new Date();
    const initialExpireDate = new Date();
    initialExpireDate.setDate(initialExpireDate.getDate() + 7);

    const [publishDate, setPublishDate] = useState<string>(initialPublishDate.toISOString().split('T')[0]);
    const [expireDate, setExpireDate] = useState<string>(initialExpireDate.toISOString().split('T')[0]);

    const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<SurveyQuestion | null>(null);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const [showQuestionTypes, setShowQuestionTypes] = useState(false);

    const [saving, setSaving] = useState(false);
    const [hasResponses, setHasResponses] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (surveyToEdit) {
                setTitle(surveyToEdit.title);
                setDescription(surveyToEdit.description || '');
                setRewardAmount(surveyToEdit.reward_amount.toString());
                setPublishDate(new Date(surveyToEdit.publish_date).toISOString().split('T')[0]);
                setExpireDate(new Date(surveyToEdit.expire_date).toISOString().split('T')[0]);
                setHasResponses(surveyToEdit.response_count > 0);
                loadSurveyQuestions(surveyToEdit.id);
            } else {
                resetForm();
            }
        }
    }, [isOpen, surveyToEdit]);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setRewardAmount('0');
        setPublishDate(initialPublishDate.toISOString().split('T')[0]);
        setExpireDate(initialExpireDate.toISOString().split('T')[0]);
        setQuestions([]);
        setCurrentQuestion(null);
        setEditingQuestionIndex(null);
        setHasResponses(false);
    };

    const loadSurveyQuestions = async (surveyId: string) => {
        const { data } = await SurveyAdminService.getSurveyQuestions(surveyId);
        if (data) setQuestions(data);
    };

    const handleAddQuestion = (type: QuestionType) => {
        const newQuestion: SurveyQuestion = {
            id: `q_${Date.now()}`,
            type,
            text: '',
            required: true,
            ...(type === 'single_choice' || type === 'multiple_choice' ? { options: ['', ''] } : {}),
            ...(type === 'text' ? { maxLength: 500 } : {}),
            ...(type === 'rating' ? { min: 1, max: 5 } : {})
        };
        setCurrentQuestion(newQuestion);
        setEditingQuestionIndex(questions.length);
        setShowQuestionTypes(false);
    };

    const handleEditQuestion = (index: number) => {
        if (hasResponses) {
            alert('No se puede editar una pregunta de una encuesta que ya tiene respuestas.');
            return;
        }
        setCurrentQuestion({ ...questions[index] });
        setEditingQuestionIndex(index);
    };

    const handleDeleteQuestion = (index: number) => {
        if (hasResponses) {
            alert('No se puede eliminar una pregunta de una encuesta que ya tiene respuestas.');
            return;
        }
        if (window.confirm('¿Seguro que deseas eliminar esta pregunta?')) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const swapQuestions = (idx1: number, idx2: number) => {
        if (hasResponses) return;
        const newQ = [...questions];
        [newQ[idx1], newQ[idx2]] = [newQ[idx2], newQ[idx1]];
        setQuestions(newQ);
    };

    const saveCurrentQuestion = () => {
        if (!currentQuestion || !currentQuestion.text.trim()) {
            alert('El texto de la pregunta es obligatorio.');
            return;
        }

        if ((currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') &&
            (!currentQuestion.options || currentQuestion.options.filter(o => o.trim()).length < 2)) {
            alert('Debes agregar al menos 2 opciones válidas.');
            return;
        }

        const newQ = [...questions];
        if (editingQuestionIndex !== null && editingQuestionIndex < newQ.length) {
            newQ[editingQuestionIndex] = currentQuestion;
        } else {
            newQ.push(currentQuestion);
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

        const pub = new Date(publishDate);
        const exp = new Date(expireDate);
        if (exp <= pub) {
            alert('La fecha de caducidad debe ser posterior a la de publicación.');
            return;
        }

        setSaving(true);
        try {
            const surveyData: SurveyData = {
                title,
                description,
                questions,
                reward_amount: parseFloat(rewardAmount) || 0,
                publish_date: pub.toISOString(),
                expire_date: exp.toISOString(),
                status
            };

            let result;
            if (surveyToEdit) {
                result = await SurveyAdminService.updateSurvey(userId, surveyToEdit.id, surveyData);
            } else {
                result = await SurveyAdminService.createSurvey(userId, surveyData);
            }

            if (result.error) throw result.error;

            onSave();
        } catch (error: any) {
            console.error('Error al guardar encuesta:', error);
            alert('Error al guardar la encuesta: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const getIconForType = (type: QuestionType) => {
        switch (type) {
            case 'single_choice': return <List size={20} className="text-amber-500" />;
            case 'multiple_choice': return <CheckSquare size={20} className="text-accent-green" />;
            case 'text': return <FileText size={20} className="text-brand-primary" />;
            case 'rating': return <Star size={20} className="text-amber-400" />;
        }
    };

    const getLabelForType = (type: QuestionType) => {
        switch (type) {
            case 'single_choice': return 'Opción Única';
            case 'multiple_choice': return 'Opción Múltiple';
            case 'text': return 'Texto Abierto';
            case 'rating': return 'Puntuación/Estrellas';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-bg-side w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-border-theme relative slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-bg-pop">
                    <div>
                        <h2 className="text-xl font-black text-text-main">
                            {surveyToEdit ? 'Editar Encuesta' : 'Crear Encuesta'}
                        </h2>
                        {surveyToEdit && hasResponses && (
                            <p className="text-accent-red text-xs mt-1 font-bold flex items-center gap-1">
                                <AlertCircle size={12} /> Encuesta ya tiene respuestas, edición restringida.
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-side transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* General Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg text-text-main border-b border-border-theme pb-2">Información General</h3>

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">Título *</label>
                            <input
                                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-amber-500 outline-none"
                                placeholder="Ej: Encuesta de Comunidad Marzo"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">Descripción</label>
                            <textarea
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-amber-500 outline-none h-24 resize-none"
                                placeholder="Describe el propósito de la encuesta..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">Recompensa (FC)</label>
                                <input
                                    type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} min="0" step="5"
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
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">Vencimiento</label>
                                <input
                                    type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)}
                                    className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border-theme pb-2">
                            <h3 className="font-bold text-lg text-text-main">Preguntas ({questions.length})</h3>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-10 bg-bg-pop rounded-xl border border-border-theme border-dashed">
                                <Activity className="mx-auto text-text-muted mb-2 opacity-50" size={32} />
                                <p className="text-text-muted text-sm font-bold">Aún no hay preguntas.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {questions.map((q, i) => (
                                    <div key={q.id} className="bg-bg-pop border border-border-theme rounded-xl p-4 flex gap-4 pr-12 relative group">
                                        <div className="mt-1">{getIconForType(q.type)}</div>
                                        <div className="flex-1">
                                            <p className="font-bold text-text-main leading-tight mb-1">
                                                {i + 1}. {q.text} {q.required && <span className="text-accent-red">*</span>}
                                            </p>
                                            <p className="text-xs text-text-muted font-bold">{getLabelForType(q.type)}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity divide-y divide-border-theme">
                                            <button disabled={i === 0 || hasResponses} onClick={() => swapQuestions(i, i - 1)} className="p-1.5 text-text-main disabled:opacity-30 hover:text-amber-500">
                                                <ArrowUp size={14} />
                                            </button>
                                            <button disabled={i === questions.length - 1 || hasResponses} onClick={() => swapQuestions(i, i + 1)} className="p-1.5 text-text-main disabled:opacity-30 hover:text-amber-500">
                                                <ArrowDown size={14} />
                                            </button>
                                            <button onClick={() => handleEditQuestion(i)} className="p-1.5 text-text-main hover:text-brand-primary">
                                                <PlusCircle size={14} className="rotate-45" /> {/* Edit Icon Alt */}
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
                            disabled={hasResponses}
                            onClick={() => setShowQuestionTypes(true)}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-amber-500/50 text-amber-500 font-bold hover:bg-amber-500/10 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                        className="flex-1 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-amber-500/20"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                        ¡Publicar Encuesta!
                    </button>
                </div>

                {/* Modal Picker over Modal */}
                {showQuestionTypes && !currentQuestion && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 fade-in">
                        <div className="bg-bg-pop border border-border-theme rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                            <h3 className="text-center font-black p-4 border-b border-border-theme bg-bg-side">Seleccionar Tipo</h3>
                            <div className="p-2">
                                <button onClick={() => handleAddQuestion('single_choice')} className="w-full flex items-center gap-3 p-4 hover:bg-bg-side rounded-xl transition text-left group">
                                    <List size={24} className="text-amber-500" />
                                    <div><p className="font-bold text-text-main">Opción Única</p><p className="text-xs text-text-muted">Eligen solo una opción</p></div>
                                </button>
                                <button onClick={() => handleAddQuestion('multiple_choice')} className="w-full flex items-center gap-3 p-4 hover:bg-bg-side rounded-xl transition text-left group">
                                    <CheckSquare size={24} className="text-accent-green" />
                                    <div><p className="font-bold text-text-main">Opción Múltiple</p><p className="text-xs text-text-muted">Eligen varias opciones</p></div>
                                </button>
                                <button onClick={() => handleAddQuestion('text')} className="w-full flex items-center gap-3 p-4 hover:bg-bg-side rounded-xl transition text-left group">
                                    <FileText size={24} className="text-brand-primary" />
                                    <div><p className="font-bold text-text-main">Texto Abierto</p><p className="text-xs text-text-muted">Escriben su respuesta</p></div>
                                </button>
                                <button onClick={() => handleAddQuestion('rating')} className="w-full flex items-center gap-3 p-4 hover:bg-bg-side rounded-xl transition text-left group">
                                    <Star size={24} className="text-amber-400" />
                                    <div><p className="font-bold text-text-main">Puntuación</p><p className="text-xs text-text-muted">Valoran con estrellas 1-5</p></div>
                                </button>
                            </div>
                            <button onClick={() => setShowQuestionTypes(false)} className="w-full p-4 text-center text-text-muted font-bold hover:bg-bg-side border-t border-border-theme transition">Cancelar</button>
                        </div>
                    </div>
                )}

                {/* Editor Over Modal */}
                {currentQuestion && (
                    <div className="absolute inset-0 bg-bg-side z-50 flex flex-col slide-in-from-bottom-full duration-300">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-theme bg-bg-pop">
                            <h2 className="text-lg font-black text-text-main flex items-center gap-2">
                                {getIconForType(currentQuestion.type)} Editando Pregunta
                            </h2>
                            <button onClick={saveCurrentQuestion} className="bg-brand-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
                                Hecho
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block font-bold text-text-sub mb-2">Texto de la pregunta *</label>
                                <input
                                    type="text" autoFocus
                                    className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main text-lg focus:ring-2 focus:ring-brand-primary outline-none"
                                    placeholder="Ej: ¿Qué te pareció el último evento?"
                                    value={currentQuestion.text}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                                />
                            </div>

                            <label className="flex items-center justify-between bg-bg-pop border border-border-theme rounded-xl p-4 cursor-pointer">
                                <div>
                                    <span className="font-bold text-text-main block">Campo Obligatorio</span>
                                    <span className="text-xs text-text-muted">Los usuarios deberán responderla sí o sí.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={currentQuestion.required}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, required: e.target.checked })}
                                    className="w-5 h-5 rounded border-border-theme text-amber-500 focus:ring-amber-500 bg-bg-side"
                                />
                            </label>

                            {(currentQuestion.type === 'single_choice' || currentQuestion.type === 'multiple_choice') && (
                                <div className="space-y-3">
                                    <h3 className="font-bold border-b border-border-theme pb-2 text-text-main pt-4">Opciones de Respuesta</h3>
                                    {currentQuestion.options?.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text" value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...(currentQuestion.options || [])];
                                                    newOpts[idx] = e.target.value;
                                                    setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                                }}
                                                className="flex-1 bg-bg-pop border border-border-theme rounded-xl px-4 py-2 text-text-main focus:ring-2 focus:ring-brand-primary outline-none"
                                                placeholder={`Opción ${idx + 1}`}
                                            />
                                            {(currentQuestion.options?.length || 0) > 2 && (
                                                <button onClick={() => {
                                                    const newOpts = currentQuestion.options?.filter((_, i) => i !== idx);
                                                    setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                                }} className="p-3 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={() => setCurrentQuestion({ ...currentQuestion, options: [...(currentQuestion.options || []), ''] })}
                                        className="w-full py-2 rounded-xl border border-dashed border-text-muted text-text-main font-bold hover:bg-bg-pop hover:border-brand-primary hover:text-brand-primary transition flex items-center justify-center gap-2">
                                        <PlusCircle size={18} /> Agregar Opción
                                    </button>
                                </div>
                            )}

                            {currentQuestion.type === 'rating' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold text-sm text-text-sub mb-1">Mínimo</label>
                                        <input type="number" value={currentQuestion.min} onChange={(e) => setCurrentQuestion({ ...currentQuestion, min: parseInt(e.target.value) || 1 })} className="w-full bg-bg-pop border border-border-theme py-2 px-4 rounded-xl text-text-main" />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-sm text-text-sub mb-1">Máximo (Estrellas)</label>
                                        <input type="number" value={currentQuestion.max} onChange={(e) => setCurrentQuestion({ ...currentQuestion, max: parseInt(e.target.value) || 5 })} className="w-full bg-bg-pop border border-border-theme py-2 px-4 rounded-xl text-text-main" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
