import { useState, useEffect } from 'react';
import { 
    Loader2, Zap, Trophy, Calendar, Check, X, Edit2, Trash2, 
    Save, ChevronDown, ChevronUp, AlertCircle, Share2
} from 'lucide-react';
import { TriviaAdminService } from '../../services/TriviaAdminService';
import { useAuth } from '../../context/AuthContext';

export default function AdminFrikiVS() {
    const { user } = useAuth();

    // Navigation and tab states
    const [activeTab, setActiveTab] = useState<'pending' | 'packs' | 'ranking'>('pending');
    const [rankingType, setRankingType] = useState<'questions' | 'trivias'>('questions');

    // Data states
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [packs, setPacks] = useState<any[]>([]);
    const [contributors, setContributors] = useState<any[]>([]);
    const [packContributors, setPackContributors] = useState<any[]>([]);

    // Loading states
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Editing states for pending questions
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQuestionText, setEditQuestionText] = useState('');
    const [editOptions, setEditOptions] = useState<{ text: string; is_correct: boolean }[]>([]);

    // Expand states for trivia packs questions
    const [expandedPacks, setExpandedPacks] = useState<Record<string, { loading: boolean; questions: any[] }>>({});

    // Modals & inputs states
    const [approvingPack, setApprovingPack] = useState<any | null>(null);
    const [packPublishDate, setPackPublishDate] = useState('');
    const [packExpireDate, setPackExpireDate] = useState('');
    const [rejectingPack, setRejectingPack] = useState<any | null>(null);
    const [rejectNotes, setRejectNotes] = useState('');

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, activeTab]);

    const getLocalDateTimeString = (date: Date) => {
        const tzoffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'pending') {
                const data = await TriviaAdminService.getPendingSubmissions();
                setSubmissions(data);
            } else if (activeTab === 'packs') {
                const data = await TriviaAdminService.getPendingTriviaPacks();
                setPacks(data);
            } else if (activeTab === 'ranking') {
                const [questionsData, packsData] = await Promise.all([
                    TriviaAdminService.getContributorsRanking(),
                    TriviaAdminService.getTriviaPackContributorsRanking()
                ]);
                setContributors(questionsData);
                setPackContributors(packsData);
            }
        } catch (error) {
            console.error('Error loading moderation data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveQuestion = async (id: string) => {
        if (window.confirm('¿Aprobar esta pregunta? El colaborador recibirá 10 Frikicoins.')) {
            setProcessingId(id);
            try {
                await TriviaAdminService.approveSubmission(id);
                setSubmissions(prev => prev.filter(s => s.id !== id));
                alert('Pregunta aprobada y recompensa acreditada con éxito.');
            } catch (error: any) {
                alert(error.message || 'Error al aprobar la pregunta.');
            } finally {
                setProcessingId(null);
            }
        }
    };

    const handleRejectQuestion = async (id: string) => {
        const notes = window.prompt('Ingrese el motivo del rechazo (opcional):', 'No cumple con los estándares de calidad.');
        if (notes !== null) {
            setProcessingId(id);
            try {
                await TriviaAdminService.rejectSubmission(id, notes || 'Descartado por el moderador.');
                setSubmissions(prev => prev.filter(s => s.id !== id));
                alert('Pregunta rechazada.');
            } catch (error: any) {
                alert(error.message || 'Error al rechazar la pregunta.');
            } finally {
                setProcessingId(null);
            }
        }
    };

    const handleEditStart = (item: any) => {
        setEditingId(item.id);
        setEditQuestionText(item.question_text);
        setEditOptions(item.options.map((o: any) => ({ text: o.text, is_correct: !!o.is_correct })));
    };

    const handleOptionTextChange = (text: string, index: number) => {
        setEditOptions(prev => {
            const next = [...prev];
            next[index] = { ...next[index], text };
            return next;
        });
    };

    const handleOptionCorrectChange = (index: number) => {
        setEditOptions(prev => prev.map((o, idx) => ({ ...o, is_correct: idx === index })));
    };

    const handleSaveEdit = async (id: string) => {
        if (!editQuestionText.trim()) {
            alert('El texto de la pregunta no puede estar vacío.');
            return;
        }
        if (editOptions.some(o => !o.text.trim())) {
            alert('Todas las opciones de respuesta deben tener texto.');
            return;
        }
        if (!editOptions.some(o => o.is_correct)) {
            alert('Debes seleccionar al menos una opción correcta.');
            return;
        }

        setProcessingId(`edit-${id}`);
        try {
            await TriviaAdminService.updateSubmission(id, editQuestionText.trim(), editOptions);
            setSubmissions(prev => prev.map(s => {
                if (s.id === id) {
                    return { ...s, question_text: editQuestionText.trim(), options: editOptions };
                }
                return s;
            }));
            setEditingId(null);
            alert('Pregunta guardada y actualizada con éxito.');
        } catch (error: any) {
            alert(error.message || 'Error al guardar la pregunta.');
        } finally {
            setProcessingId(null);
        }
    };

    const togglePackExpansion = async (packId: string) => {
        if (expandedPacks[packId]) {
            // Collapse
            setExpandedPacks(prev => {
                const next = { ...prev };
                delete next[packId];
                return next;
            });
        } else {
            // Expand & load questions
            setExpandedPacks(prev => ({ ...prev, [packId]: { loading: true, questions: [] } }));
            try {
                const data = await TriviaAdminService.getTriviaPack(packId);
                if (data) {
                    setExpandedPacks(prev => ({
                        ...prev,
                        [packId]: { loading: false, questions: data.questions || [] }
                    }));
                } else {
                    throw new Error('No se cargaron las preguntas.');
                }
            } catch (error) {
                console.error('Error fetching trivia pack details:', error);
                setExpandedPacks(prev => {
                    const next = { ...prev };
                    delete next[packId];
                    return next;
                });
                alert('No se pudieron cargar las preguntas del paquete.');
            }
        }
    };

    const openApprovePackModal = (pack: any) => {
        setApprovingPack(pack);
        const now = new Date();
        setPackPublishDate(getLocalDateTimeString(now));
        setPackExpireDate(getLocalDateTimeString(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)));
    };

    const handleApprovePack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!approvingPack) return;

        const pub = new Date(packPublishDate);
        const exp = new Date(packExpireDate);
        if (exp <= pub) {
            alert('La fecha de expiración debe ser posterior a la de publicación.');
            return;
        }

        const questionCount = approvingPack.question_count || 5;
        const timeLimitSec = questionCount * 15;
        const rewardCoins = questionCount * 10;

        setProcessingId(`pack-approve-${approvingPack.id}`);
        try {
            const result = await TriviaAdminService.approveTriviaPack({
                submissionId: approvingPack.id,
                publishDate: pub.toISOString(),
                expireDate: exp.toISOString(),
                timeLimitSeconds: timeLimitSec,
                adminId: user?.id || ''
            });

            setPacks(prev => prev.filter(p => p.id !== approvingPack.id));
            setApprovingPack(null);
            alert(`¡Trivia Creada!\n\nEl paquete fue aprobado. El colaborador recibió ${result.rewarded_coins || rewardCoins} Frikicoins.`);
        } catch (error: any) {
            alert(error.message || 'Error al aprobar el paquete de trivia.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectPack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingPack) return;

        setProcessingId(`pack-reject-${rejectingPack.id}`);
        try {
            await TriviaAdminService.rejectTriviaPack({
                submissionId: rejectingPack.id,
                adminNotes: rejectNotes.trim() || 'No cumple con los estándares de calidad.',
                adminId: user?.id || ''
            });

            setPacks(prev => prev.filter(p => p.id !== rejectingPack.id));
            setRejectingPack(null);
            setRejectNotes('');
            alert('El paquete fue rechazado y el creador ha sido notificado.');
        } catch (error: any) {
            alert(error.message || 'Error al rechazar el paquete.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleCopyRanking = () => {
        const dataList = rankingType === 'questions' ? contributors : packContributors;
        if (dataList.length === 0) return;

        let shareText = `🏆 TOP COLABORADORES FRIKIVS - CIUDAD FRIKI 🏆\n\n`;
        dataList.slice(0, 10).forEach((item, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const countText = rankingType === 'questions' 
                ? `${item.approved_questions} Aprobadas` 
                : `${item.approved_packs} Trivias`;
            shareText += `${medal} @${item.username || 'Usuario'} — ${countText}\n`;
        });
        shareText += `\n¡Felicidades a los campeones de aportes del saber! ⚔️🎮`;

        navigator.clipboard.writeText(shareText).then(() => {
            alert('Ranking copiado al portapapeles. ¡Listo para compartir!');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
        });
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-theme pb-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <Zap size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight flex items-center gap-2">
                            Aportes y Moderación VS
                        </h1>
                        <p className="text-sm text-brand-primary font-bold">Control de Preguntas y Trivias de Usuarios</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="p-2 bg-bg-side border border-border-theme hover:border-brand-primary text-text-muted hover:text-brand-primary rounded-xl transition disabled:opacity-50"
                >
                    <Loader2 size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Main Tabs */}
            <div className="flex items-center gap-2 border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${
                        activeTab === 'pending'
                            ? 'border-brand-primary text-brand-primary'
                            : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                    }`}
                >
                    Preguntas VS ({submissions.length})
                </button>
                <button
                    onClick={() => setActiveTab('packs')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${
                        activeTab === 'packs'
                            ? 'border-brand-primary text-brand-primary'
                            : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                    }`}
                >
                    📦 Trivias Completas ({packs.length})
                </button>
                <button
                    onClick={() => setActiveTab('ranking')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${
                        activeTab === 'ranking'
                            ? 'border-brand-primary text-brand-primary'
                            : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                    }`}
                >
                    Top Colaboradores
                </button>
            </div>

            {/* Inner ranking toggle */}
            {activeTab === 'ranking' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setRankingType('questions')}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                            rankingType === 'questions'
                                ? 'bg-brand-primary/15 border-brand-primary text-brand-primary'
                                : 'bg-bg-side border-border-theme text-text-muted hover:text-text-main'
                        }`}
                    >
                        Aportes Preguntas
                    </button>
                    <button
                        onClick={() => setRankingType('trivias')}
                        className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                            rankingType === 'trivias'
                                ? 'bg-brand-primary/15 border-brand-primary text-brand-primary'
                                : 'bg-bg-side border-border-theme text-text-muted hover:text-text-main'
                        }`}
                    >
                        Aportes Trivias
                    </button>
                </div>
            )}

            {/* List and Tables Area */}
            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                        <p className="font-bold">Cargando aportes...</p>
                    </div>
                ) : activeTab === 'pending' ? (
                    submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                            <Check className="text-accent-green mb-4 opacity-50" size={48} />
                            <p className="font-bold text-text-main text-lg mb-1">¡Sin preguntas pendientes!</p>
                            <p className="text-xs max-w-sm">Los usuarios no han propuesto nuevas preguntas individuales en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {submissions.map(item => {
                                const isEditing = editingId === item.id;
                                const isProcessing = processingId === item.id || processingId === `edit-${item.id}`;
                                return (
                                    <div 
                                        key={item.id} 
                                        className="bg-bg-side border border-border-theme hover:border-brand-primary/40 transition-colors rounded-2xl p-5 flex flex-col justify-between"
                                    >
                                        <div className="space-y-4">
                                            {/* Header Card */}
                                            <div className="flex justify-between items-start gap-2 text-xs">
                                                <div>
                                                    <span className="bg-bg-pop border border-border-theme text-text-main px-2.5 py-1 rounded-full font-bold">
                                                        @{item.profiles?.username || 'Usuario'}
                                                    </span>
                                                    <span className="text-brand-primary font-bold block mt-1">
                                                        {item.triviaduels_categories?.name || 'Categoría'}
                                                    </span>
                                                </div>
                                                <span className="text-text-muted font-bold text-[10px]">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Question Text */}
                                            {isEditing ? (
                                                <textarea
                                                    value={editQuestionText}
                                                    onChange={(e) => setEditQuestionText(e.target.value)}
                                                    maxLength={250}
                                                    className="w-full bg-bg-pop border border-brand-primary text-text-main px-3 py-2 rounded-xl text-sm focus:outline-none resize-none font-bold"
                                                    rows={2}
                                                />
                                            ) : (
                                                <p className="font-bold text-text-main text-sm leading-snug line-clamp-3">
                                                    {item.question_text}
                                                </p>
                                            )}

                                            {/* Options */}
                                            <div className="space-y-2">
                                                {(isEditing ? editOptions : item.options).map((opt: any, idx: number) => (
                                                    <div 
                                                        key={idx} 
                                                        className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                                                            opt.is_correct 
                                                                ? 'border-accent-green/30 bg-accent-green/10 text-accent-green font-bold' 
                                                                : 'border-border-theme/40 bg-bg-pop/50 text-text-sub text-xs'
                                                        }`}
                                                    >
                                                        {isEditing ? (
                                                            <>
                                                                <input
                                                                    type="radio"
                                                                    checked={opt.is_correct}
                                                                    onChange={() => handleOptionCorrectChange(idx)}
                                                                    className="accent-accent-green"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={opt.text}
                                                                    onChange={(e) => handleOptionTextChange(e.target.value, idx)}
                                                                    maxLength={80}
                                                                    className="flex-1 bg-transparent border-b border-border-theme/50 focus:border-brand-primary focus:outline-none py-0.5 text-xs text-text-main"
                                                                />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                                                    opt.is_correct ? 'border-accent-green bg-accent-green text-white' : 'border-text-muted'
                                                                }`}>
                                                                    {opt.is_correct && <Check size={10} />}
                                                                </div>
                                                                <span className="truncate">{opt.text}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="border-t border-border-theme/40 pt-3 mt-4 flex gap-2 justify-between items-center">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        disabled={isProcessing}
                                                        className="px-3 py-1.5 rounded-lg border border-border-theme hover:bg-bg-sub text-text-muted transition text-xs flex items-center gap-1 font-bold"
                                                    >
                                                        <X size={14} /> Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(item.id)}
                                                        disabled={isProcessing}
                                                        className="px-3.5 py-1.5 rounded-lg bg-accent-green text-text-inv hover:bg-accent-green/85 transition text-xs flex items-center gap-1 font-black shadow-md shadow-accent-green/10"
                                                    >
                                                        {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Guardar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRejectQuestion(item.id)}
                                                            disabled={isProcessing}
                                                            className="p-2 rounded-lg border border-border-theme text-text-muted hover:text-accent-red hover:border-accent-red/30 hover:bg-accent-red/10 transition"
                                                            title="Rechazar Pregunta"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditStart(item)}
                                                            disabled={isProcessing}
                                                            className="p-2 rounded-lg border border-border-theme text-text-muted hover:text-brand-secondary hover:border-brand-secondary/30 hover:bg-brand-secondary/10 transition"
                                                            title="Editar Pregunta"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleApproveQuestion(item.id)}
                                                        disabled={isProcessing}
                                                        className="px-4 py-2 rounded-lg bg-brand-primary text-text-inv font-black hover:bg-brand-primary-light transition text-xs flex items-center gap-1 shadow-md shadow-brand-primary/10"
                                                    >
                                                        {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} Aprobar (+10 FC)
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : activeTab === 'packs' ? (
                    packs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                            <Check className="text-accent-green mb-4 opacity-50" size={48} />
                            <p className="font-bold text-text-main text-lg mb-1">¡Sin trivias pendientes!</p>
                            <p className="text-xs max-w-sm">Los usuarios no han propuesto nuevos paquetes de trivias completas por ahora.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {packs.map(item => {
                                const questionCount = item.question_count || 5;
                                const timeLimitSec = questionCount * 15;
                                const reward = questionCount * 10;
                                const isExpanded = !!expandedPacks[item.id];
                                const expandedData = expandedPacks[item.id];
                                const isProcessing = processingId === `pack-approve-${item.id}` || processingId === `pack-reject-${item.id}`;

                                return (
                                    <div 
                                        key={item.id} 
                                        className="bg-bg-side border border-border-theme rounded-2xl p-5 flex flex-col justify-between hover:border-brand-primary/20 transition-all"
                                    >
                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="flex justify-between items-start gap-2 text-xs">
                                                <div>
                                                    <span className="bg-bg-pop border border-border-theme text-text-main px-2.5 py-1 rounded-full font-bold">
                                                        @{item.profiles?.username || 'Usuario'}
                                                    </span>
                                                    <span className="text-brand-primary font-bold block mt-2">
                                                        {item.triviaduels_categories?.name || 'Categoría'}
                                                    </span>
                                                </div>
                                                <span className="text-text-muted font-bold text-[10px]">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {/* Title & desc */}
                                            <div>
                                                <h4 className="font-black text-text-main text-base leading-snug">{item.title}</h4>
                                                {item.description && (
                                                    <p className="text-xs text-text-muted font-bold mt-1 leading-relaxed">{item.description}</p>
                                                )}
                                            </div>

                                            {/* Meta data */}
                                            <div className="grid grid-cols-3 gap-3 pt-1">
                                                <div className="bg-bg-pop border border-border-theme/40 rounded-xl p-2 flex flex-col items-center justify-center">
                                                    <span className="text-text-muted font-bold text-[9px] uppercase">Preguntas</span>
                                                    <span className="text-sm font-black text-text-main mt-0.5">{questionCount}</span>
                                                </div>
                                                <div className="bg-bg-pop border border-border-theme/40 rounded-xl p-2 flex flex-col items-center justify-center">
                                                    <span className="text-text-muted font-bold text-[9px] uppercase">Tiempo total</span>
                                                    <span className="text-xs font-black text-text-main mt-1">
                                                        {Math.floor(timeLimitSec / 60)}m {timeLimitSec % 60 > 0 ? `${timeLimitSec % 60}s` : ''}
                                                    </span>
                                                </div>
                                                <div className="bg-bg-pop border border-border-theme/40 rounded-xl p-2 flex flex-col items-center justify-center">
                                                    <span className="text-text-muted font-bold text-[9px] uppercase">Premio Aporte</span>
                                                    <span className="text-xs font-black text-amber-500 mt-1">{reward} FC</span>
                                                </div>
                                            </div>

                                            {/* Questions Drawer Accordion */}
                                            <div className="border-t border-border-theme/20 pt-2">
                                                <button
                                                    onClick={() => togglePackExpansion(item.id)}
                                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-brand-primary hover:underline bg-bg-pop/30 border border-border-theme/30 rounded-xl transition"
                                                >
                                                    {isExpanded ? (
                                                        <>Ocultar Preguntas <ChevronUp size={14} /></>
                                                    ) : (
                                                        <>Ver Preguntas del Paquete <ChevronDown size={14} /></>
                                                    )}
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-3 bg-bg-pop/50 border border-border-theme/40 rounded-xl p-3.5 space-y-3.5 animate-in fade-in duration-200">
                                                        {expandedData.loading ? (
                                                            <div className="flex justify-center py-4 text-brand-primary">
                                                                <Loader2 className="animate-spin" size={18} />
                                                            </div>
                                                        ) : expandedData.questions.length === 0 ? (
                                                            <p className="text-xs text-text-muted italic text-center">No se encontraron preguntas para este paquete.</p>
                                                        ) : (
                                                            expandedData.questions.map((q, qIdx) => (
                                                                <div key={q.id || qIdx} className="space-y-1.5 border-b border-border-theme/20 last:border-0 pb-3 last:pb-0">
                                                                    <p className="text-xs font-extrabold text-text-main">
                                                                        {qIdx + 1}. {q.question_text}
                                                                    </p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                                                                        {q.options?.map((opt: any, oIdx: number) => (
                                                                            <div 
                                                                                key={oIdx} 
                                                                                className={`text-[11px] px-2 py-1 rounded-lg border ${
                                                                                    opt.is_correct 
                                                                                        ? 'border-accent-green/20 bg-accent-green/5 text-accent-green font-bold' 
                                                                                        : 'border-border-theme/20 bg-bg-side/40 text-text-muted'
                                                                                }`}
                                                                            >
                                                                                • {opt.text}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="border-t border-border-theme/40 pt-3 mt-4 flex gap-2 justify-end">
                                            <button
                                                onClick={() => { setRejectingPack(item); setRejectNotes(''); }}
                                                disabled={isProcessing}
                                                className="px-3.5 py-2 rounded-xl border border-accent-red/30 hover:border-accent-red hover:bg-accent-red/10 text-accent-red transition text-xs font-bold"
                                            >
                                                Rechazar
                                            </button>
                                            <button
                                                onClick={() => openApprovePackModal(item)}
                                                disabled={isProcessing}
                                                className="px-4 py-2 rounded-xl bg-brand-primary text-text-inv font-black hover:bg-brand-primary-light transition text-xs flex items-center gap-1.5 shadow-md shadow-brand-primary/10"
                                            >
                                                <Check size={14} /> Aprobar Trivia
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    contributors.length === 0 && packContributors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                            <Trophy className="opacity-20 mb-4" size={48} />
                            <p className="font-bold text-text-main text-lg mb-1">Sin leyendas aún</p>
                            <p className="text-xs">Los rankings de colaboradores se calcularán a medida que se aprueben aportes.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Share button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCopyRanking}
                                    className="px-4 py-2 bg-brand-primary text-text-inv hover:bg-brand-primary-light font-black text-xs rounded-xl transition shadow-md shadow-brand-primary/15 flex items-center gap-1.5"
                                >
                                    <Share2 size={14} /> Copiar y Compartir Top
                                </button>
                            </div>

                            {/* Ranking Table */}
                            <div className="border border-border-theme rounded-2xl overflow-hidden bg-bg-side">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-bg-pop border-b border-border-theme text-xs text-text-muted font-bold uppercase tracking-wider">
                                            <th className="py-3.5 px-4 text-center w-16">Puesto</th>
                                            <th className="py-3.5 px-4">Usuario</th>
                                            <th className="py-3.5 px-4 text-right pr-6">Aportes Aprobados</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-theme">
                                        {(rankingType === 'questions' ? contributors : packContributors).map((item, index) => {
                                            const medals = ['🥇', '🥈', '🥉'];
                                            const isTop3 = index < 3;
                                            const count = rankingType === 'questions' ? item.approved_questions : item.approved_packs;
                                            const label = rankingType === 'questions' ? 'Preguntas' : (item.approved_packs === 1 ? 'Trivia' : 'Trivias');

                                            return (
                                                <tr key={item.user_id || index} className="hover:bg-bg-pop/40 transition-colors">
                                                    <td className="py-4 px-4 text-center font-black text-sm">
                                                        {isTop3 ? (
                                                            <span className="text-lg">{medals[index]}</span>
                                                        ) : (
                                                            <span className="text-text-muted">{index + 1}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4 font-bold text-text-main flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-[10px]">
                                                            @{item.username ? item.username[0].toUpperCase() : 'U'}
                                                        </div>
                                                        <span>@{item.username || 'Usuario'}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right pr-6 font-extrabold text-amber-500 tabular-nums">
                                                        {count} {label}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* Modal de Aprobación de Trivia Pack */}
            {approvingPack && (
                <div 
                    className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setApprovingPack(null)}
                >
                    <div 
                        className="bg-bg-pop w-full max-w-md rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-border-theme bg-bg-side flex items-center justify-between">
                            <h3 className="text-base font-black text-text-main flex items-center gap-1.5">
                                <Calendar size={18} className="text-brand-primary" /> Programar Publicación de Trivia
                            </h3>
                            <button onClick={() => setApprovingPack(null)} className="p-1 hover:bg-bg-sub rounded-lg transition-colors text-text-muted hover:text-text-main">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleApprovePack} className="p-5 space-y-4">
                            <p className="text-xs text-text-muted font-bold leading-normal">
                                Configura la programación para lanzar la trivia oficial <strong>"{approvingPack.title}"</strong> creada por @{approvingPack.profiles?.username}.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                                    Fecha de Publicación
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={packPublishDate}
                                    onChange={(e) => setPackPublishDate(e.target.value)}
                                    className="w-full bg-bg-side border border-border-theme text-text-main px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-sm transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block font-bold">
                                    Fecha de Expiración (Expiración de Juego)
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={packExpireDate}
                                    onChange={(e) => setPackExpireDate(e.target.value)}
                                    className="w-full bg-bg-side border border-border-theme text-text-main px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-sm transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processingId === `pack-approve-${approvingPack.id}`}
                                className="w-full py-3 bg-brand-primary text-text-inv font-black text-sm rounded-xl hover:bg-brand-primary-light transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-primary/10 mt-2"
                            >
                                {processingId === `pack-approve-${approvingPack.id}` ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        <span>Confirmar y Publicar</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Rechazo de Trivia Pack */}
            {rejectingPack && (
                <div 
                    className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setRejectingPack(null)}
                >
                    <div 
                        className="bg-bg-pop w-full max-w-md rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-border-theme bg-bg-side flex items-center justify-between">
                            <h3 className="text-base font-black text-accent-red flex items-center gap-1.5">
                                <AlertCircle size={18} className="text-accent-red animate-pulse" /> Rechazar Paquete de Trivia
                            </h3>
                            <button onClick={() => setRejectingPack(null)} className="p-1 hover:bg-bg-sub rounded-lg transition-colors text-text-muted hover:text-text-main">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRejectPack} className="p-5 space-y-4">
                            <p className="text-xs text-text-muted font-bold leading-normal">
                                Escribe los comentarios de retroalimentación que se enviarán a @{rejectingPack.profiles?.username} detallando el porqué de la desestimación.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider block font-bold">
                                    Notas del Moderador / Feedback
                                </label>
                                <textarea
                                    required
                                    value={rejectNotes}
                                    onChange={(e) => setRejectNotes(e.target.value)}
                                    maxLength={300}
                                    rows={3}
                                    placeholder="Ej: Las preguntas no cumplen con la rigurosidad o tienen faltas de ortografía graves..."
                                    className="w-full bg-bg-side border border-border-theme text-text-main px-3 py-2 rounded-xl focus:border-brand-primary outline-none text-sm transition-all resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processingId === `pack-reject-${rejectingPack.id}`}
                                className="w-full py-3 bg-accent-red text-text-inv font-black text-sm rounded-xl hover:bg-accent-red/85 transition flex items-center justify-center gap-1.5 shadow-md shadow-accent-red/15 mt-2"
                            >
                                {processingId === `pack-reject-${rejectingPack.id}` ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <X size={16} />
                                        <span>Confirmar Rechazo</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
