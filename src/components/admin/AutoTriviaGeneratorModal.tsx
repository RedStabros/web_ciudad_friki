import { useState, useEffect } from 'react';
import { 
    XCircle, Loader2, Zap, Clock, Trophy, Star, Info
} from 'lucide-react';
import { TriviaService } from '../../services/TriviaService';
import { TriviaAdminService } from '../../services/TriviaAdminService';
import { getTriviaIcon } from '../../utils/triviaIcons';

interface AutoTriviaGeneratorModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string;
    onCreated: () => void;
}

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

const getLocalDateTimeString = (date: Date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

export default function AutoTriviaGeneratorModal({
    visible,
    onClose,
    userId,
    onCreated,
}: AutoTriviaGeneratorModalProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questionCount, setQuestionCount] = useState(10);
    const [publishDate, setPublishDate] = useState('');
    const [expireDate, setExpireDate] = useState('');

    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Calculated preview values
    const timeLimitSeconds = questionCount * 15;
    const rewardPool = questionCount * 5;

    useEffect(() => {
        if (visible) {
            // Reset form fields
            setTitle('');
            setDescription('');
            setQuestionCount(10);
            const now = new Date();
            setPublishDate(getLocalDateTimeString(now));
            setExpireDate(getLocalDateTimeString(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)));
            loadCategories();
        }
    }, [visible]);

    const loadCategories = async () => {
        setLoadingCategories(true);
        try {
            const data = await TriviaService.getVSCategories();
            const filtered = data.filter(c => c.id !== 'random');
            setCategories(filtered);
            if (filtered.length > 0) {
                setSelectedCategoryId(filtered[0].id);
            }
        } catch (e) {
            console.error('Error loading VS categories:', e);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert('El título es obligatorio.');
            return;
        }
        if (!selectedCategoryId) {
            alert('Selecciona una categoría.');
            return;
        }
        const pub = new Date(publishDate);
        const exp = new Date(expireDate);
        if (exp <= pub) {
            alert('La fecha de expiración debe ser posterior a la de publicación.');
            return;
        }

        const categoryName = categories.find(c => c.id === selectedCategoryId)?.name || '';

        const confirmMsg = `Se crearán ${questionCount} preguntas aleatorias de "${categoryName}".\n\n⏱ Tiempo: ${Math.floor(timeLimitSeconds / 60)}m ${timeLimitSeconds % 60 > 0 ? `${timeLimitSeconds % 60}s` : ''}\n🏆 Premio: ${rewardPool} Frikicoins\n\n¿Confirmar creación de la trivia automática?`;

        if (window.confirm(confirmMsg)) {
            setSubmitting(true);
            try {
                const result = await TriviaAdminService.createAutoTrivia({
                    categoryId: selectedCategoryId,
                    title: title.trim(),
                    description: description.trim(),
                    publishDate: pub.toISOString(),
                    expireDate: exp.toISOString(),
                    questionCount,
                    adminId: userId,
                });

                alert(`¡Trivia Creada!\n\n"${title}" fue creada con ${result.questions_copied} preguntas.\n⏱ ${result.time_limit_seconds}s de tiempo límite\n🏆 ${result.reward_pool} Frikicoins de premio`);
                onCreated();
                onClose();
            } catch (error: any) {
                alert(error.message || 'No se pudo crear la trivia automática.');
            } finally {
                setSubmitting(false);
            }
        }
    };

    if (!visible) return null;

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-bg-pop w-full max-w-2xl rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-border-theme bg-bg-side flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-main leading-tight">
                                Generar Trivia Automática
                            </h2>
                            <p className="text-xs text-brand-primary font-bold">Generador Automático de GM ⚡</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted hover:text-text-main"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                        <Info className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-xs text-text-muted leading-relaxed">
                            Las preguntas se seleccionan aleatoriamente del pool de <strong>Trivia VS</strong> de la categoría elegida. Los parámetros son oficiales estándar: 15s por pregunta y 5 Frikicoins de recompensa por cada acierto.
                        </p>
                    </div>

                    {/* Title input */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                            Título de la Trivia
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={100}
                                placeholder="Ej: Trivia de Anime — Especial de Fin de Semana"
                                className="w-full bg-bg-side border border-border-theme text-text-main px-4 py-3 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Description textarea */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                            Descripción (Opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={300}
                            rows={3}
                            placeholder="Descripción breve para los jugadores sobre este desafío..."
                            className="w-full bg-bg-side border border-border-theme text-text-main px-4 py-3 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none text-sm transition-all resize-none"
                        />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                            Categoría de Origen (Pool VS)
                        </label>
                        {loadingCategories ? (
                            <div className="flex justify-center py-6 text-brand-primary">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {categories.map(cat => {
                                    const isActive = selectedCategoryId === cat.id;
                                    const iconSrc = getTriviaIcon(cat.icon, cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                                isActive
                                                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                                                    : 'border-border-theme bg-bg-side hover:bg-bg-sub/50 text-text-muted hover:text-text-main'
                                            }`}
                                        >
                                            <img src={iconSrc} alt={cat.name} className="w-10 h-10 object-contain" />
                                            <span className={`text-[11px] font-bold text-center ${isActive ? 'text-brand-primary' : 'text-text-muted'}`}>
                                                {cat.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Question Count */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                            Número de Preguntas
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {QUESTION_COUNTS.map(count => {
                                const isActive = questionCount === count;
                                return (
                                    <button
                                        key={count}
                                        type="button"
                                        onClick={() => setQuestionCount(count)}
                                        className={`w-12 h-12 rounded-xl border font-black text-sm flex items-center justify-center transition-all ${
                                            isActive
                                                ? 'bg-brand-primary border-brand-primary text-text-inv shadow-md shadow-brand-primary/20'
                                                : 'border-border-theme bg-bg-side hover:bg-bg-sub text-text-muted hover:text-text-main'
                                        }`}
                                    >
                                        {count}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview Parameters Card */}
                    <div className="bg-bg-side border border-brand-primary/20 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-8 -mt-8"></div>
                        <h4 className="text-xs font-black text-text-main flex items-center gap-1.5 uppercase tracking-wider">
                            <Info size={14} className="text-brand-primary animate-pulse" /> Parámetros Calculados
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm relative z-10 pt-1">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-brand-secondary" />
                                <div>
                                    <p className="text-[9px] text-text-muted font-bold uppercase">Tiempo Límite</p>
                                    <p className="font-extrabold text-text-main">
                                        {Math.floor(timeLimitSeconds / 60)}m {timeLimitSeconds % 60 > 0 ? `${timeLimitSeconds % 60}s` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy size={16} className="text-amber-500" />
                                <div>
                                    <p className="text-[9px] text-text-muted font-bold uppercase">Premio Máximo</p>
                                    <p className="font-extrabold text-amber-500">{rewardPool} Frikicoins</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-accent-green" />
                                <div>
                                    <p className="text-[9px] text-text-muted font-bold uppercase">Por Acierto</p>
                                    <p className="font-extrabold text-accent-green">5 FC</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dates selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                                Fecha de Publicación
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={publishDate}
                                onChange={(e) => setPublishDate(e.target.value)}
                                className="w-full bg-bg-side border border-border-theme text-text-main px-4 py-3 rounded-xl focus:border-brand-primary outline-none text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                                Fecha de Expiración
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={expireDate}
                                onChange={(e) => setExpireDate(e.target.value)}
                                className="w-full bg-bg-side border border-border-theme text-text-main px-4 py-3 rounded-xl focus:border-brand-primary outline-none text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-brand-primary text-text-inv font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-brand-primary-light transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 mt-4"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Generando Trivia...</span>
                            </>
                        ) : (
                            <>
                                <Zap size={20} />
                                <span>Generar Trivia Automática</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
