import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Scissors, Search, Download, Star, Loader2, FileText,
    X, Check, Sparkles
} from 'lucide-react';
import { CraftService, type CraftItem, type CraftCategory, type CraftDifficulty, type CraftReviewItem } from '../services/CraftService';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getAvatarSource } from '../config/avatars';

function getYoutubeEmbedUrl(url?: string | null): string | null {
    if (!url) return null;
    try {
        const trimmed = url.trim();
        if (trimmed.includes('/shorts/')) {
            const id = trimmed.split('/shorts/')[1]?.split(/[?&]/)[0];
            return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
        }
        if (trimmed.includes('youtu.be/')) {
            const id = trimmed.split('youtu.be/')[1]?.split(/[?&]/)[0];
            return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
        }
        if (trimmed.includes('watch?v=') || trimmed.includes('&v=')) {
            const match = trimmed.match(/[?&]v=([^&]+)/);
            return match && match[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
        }
        if (trimmed.includes('/embed/')) {
            return trimmed.replace('youtube.com', 'youtube-nocookie.com');
        }
        return null;
    } catch {
        return null;
    }
}

export default function CraftsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { crafts: craftsEnabled, featuresLoading } = useApp();

    const [crafts, setCrafts] = useState<CraftItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<CraftCategory>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<CraftDifficulty>('all');

    // Detail Modal State
    const [selectedCraft, setSelectedCraft] = useState<CraftItem | null>(null);
    const [reviews, setReviews] = useState<CraftReviewItem[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [userRating, setUserRating] = useState(5);
    const [userComment, setUserComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCrafts();
        }, 250);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, selectedDifficulty, searchQuery]);

    if (!featuresLoading && !craftsEnabled) {
        return <Navigate to="/" replace />;
    }

    const loadCrafts = async () => {
        setLoading(true);
        try {
            const data = await CraftService.getCrafts(
                selectedCategory,
                searchQuery.trim() || undefined,
                selectedDifficulty
            );
            setCrafts(data);
        } catch (error) {
            console.error('Error loading crafts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadCrafts();
    };

    const openDetailModal = async (craft: CraftItem) => {
        setSelectedCraft(craft);
        setRatingSuccess(false);
        setUserComment('');
        setUserRating(5);
        setLoadingReviews(true);

        try {
            const revs = await CraftService.getCraftReviews(craft.id);
            setReviews(revs);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleDownload = (craft: CraftItem) => {
        if (!craft.pdf_url) return;
        window.open(craft.pdf_url, '_blank');
        CraftService.recordDownload(craft.id).catch(() => {});
        setCrafts(prev => prev.map(c => c.id === craft.id ? { ...c, downloads_count: c.downloads_count + 1 } : c));
        if (selectedCraft && selectedCraft.id === craft.id) {
            setSelectedCraft(prev => prev ? { ...prev, downloads_count: prev.downloads_count + 1 } : null);
        }
    };

    const handleSubmitRating = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert(t('common.loginRequired', 'Inicia sesión para calificar'));
            return;
        }
        if (!selectedCraft) return;

        setSubmittingRating(true);
        try {
            const res = await CraftService.submitRating(selectedCraft.id, userRating, userComment.trim() || undefined);
            if (res.success) {
                setRatingSuccess(true);
                const revs = await CraftService.getCraftReviews(selectedCraft.id);
                setReviews(revs);
                loadCrafts();
            }
        } catch (err) {
            console.error('Error submitting rating:', err);
        } finally {
            setSubmittingRating(false);
        }
    };

    const getDifficultyBadge = (difficulty: string) => {
        switch (difficulty) {
            case 'facil':
            case 'easy':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">{t('crafts.difficulties.facil', 'Fácil')}</span>;
            case 'intermedio':
            case 'medium':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">{t('crafts.difficulties.intermedio', 'Medio')}</span>;
            case 'avanzado':
            case 'hard':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">{t('crafts.difficulties.avanzado', 'Difícil')}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-bg-side via-bg-sub to-bg-side border border-border-theme rounded-3xl p-6 md:p-10 mb-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-wider mb-4">
                        <Scissors size={14} /> {t('crafts.heroTag', 'Taller & Manualidades')}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-text-main mb-3 tracking-tight">
                        {t('crafts.title', 'Recursos Imprimibles y Papercraft')}
                    </h1>
                    <p className="text-text-sub text-sm md:text-base leading-relaxed">
                        {t('crafts.subtitle', 'Descarga plantillas oficiales listas para imprimir en PDF: modelos armables 3D, páginas para colorear, origami y props para eventos. ¡100% de uso libre!')}
                    </p>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none hidden md:block">
                    <Scissors size={260} className="text-brand-primary" />
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="space-y-4 mb-8">
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-xl">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t('crafts.searchPlaceholder', 'Buscar por personaje, anime, serie o juego...')}
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-bg-side border border-border-theme text-sm text-text-main outline-none focus:ring-2 focus:ring-brand-primary transition"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-5 py-2.5 rounded-2xl bg-brand-primary text-text-inv font-black text-xs uppercase tracking-wider hover:bg-brand-primary-light transition shadow-md shadow-brand-primary/20"
                    >
                        {t('crafts.searchButton', 'Buscar')}
                    </button>
                </form>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'all', label: t('crafts.categories.all', 'Todos') },
                            { id: 'papercraft', label: t('crafts.categories.papercraft', '✂️ Papercraft 3D') },
                            { id: 'colorear', label: t('crafts.categories.colorear', '🎨 Para Colorear') },
                            { id: 'origami', label: t('crafts.categories.origami', '📜 Origami') },
                            { id: 'cosplay_props', label: t('crafts.categories.cosplay_props', '🎭 Props Cosplay') },
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id as CraftCategory)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${selectedCategory === cat.id
                                        ? 'bg-brand-primary text-text-inv border-brand-primary shadow-md'
                                        : 'bg-bg-side text-text-sub border-border-theme hover:border-brand-primary/40'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Difficulty Filter */}
                    <div className="flex items-center gap-1.5 bg-bg-side p-1 rounded-xl border border-border-theme text-xs font-bold">
                        <span className="text-text-muted px-2">{t('crafts.difficultyLabel', 'Dificultad:')}</span>
                        {[
                            { id: 'all', label: t('crafts.difficulties.all', 'Todas') },
                            { id: 'facil', label: t('crafts.difficulties.facil', 'Fácil') },
                            { id: 'intermedio', label: t('crafts.difficulties.intermedio', 'Media') },
                            { id: 'avanzado', label: t('crafts.difficulties.avanzado', 'Difícil') },
                        ].map(diff => (
                            <button
                                key={diff.id}
                                onClick={() => setSelectedDifficulty(diff.id as CraftDifficulty)}
                                className={`px-2.5 py-1 rounded-lg transition ${selectedDifficulty === diff.id
                                        ? 'bg-brand-primary text-text-inv font-black'
                                        : 'text-text-sub hover:text-text-main'
                                    }`}
                            >
                                {diff.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center text-text-muted gap-3">
                    <Loader2 size={36} className="animate-spin text-brand-primary" />
                    <p className="text-sm font-bold">{t('common.loading', 'Cargando recursos imprimibles...')}</p>
                </div>
            ) : crafts.length === 0 ? (
                <div className="py-20 text-center bg-bg-side rounded-2xl border border-border-theme p-8 max-w-lg mx-auto">
                    <div className="inline-flex p-4 rounded-full bg-bg-sub text-text-muted mb-3">
                        <Scissors size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-text-main mb-1">
                        {t('crafts.emptyTitle', 'No encontramos manualidades')}
                    </h3>
                    <p className="text-xs text-text-muted mb-4">
                        {t('crafts.emptyDesc', 'Intenta con otra búsqueda o categoría.')}
                    </p>
                    <button
                        onClick={() => { setSelectedCategory('all'); setSelectedDifficulty('all'); setSearchQuery(''); loadCrafts(); }}
                        className="px-4 py-2 bg-bg-sub hover:bg-bg-sub/80 border border-border-theme rounded-xl text-xs font-bold text-text-main transition"
                    >
                        {t('crafts.clearFilters', 'Limpiar filtros')}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {crafts.map(item => (
                        <div
                            key={item.id}
                            className="group bg-bg-side border border-border-theme rounded-2xl overflow-hidden hover:border-brand-primary/50 transition-all shadow-md hover:shadow-xl flex flex-col cursor-pointer"
                            onClick={() => openDetailModal(item)}
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-[4/3] bg-bg-sub overflow-hidden">
                                <img
                                    src={item.thumbnail_url}
                                    alt={item.title}
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/assets/adaptive-icon.png';
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                                    {getDifficultyBadge(item.difficulty)}
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/60 text-white backdrop-blur-sm border border-white/10">
                                        {item.estimated_time?.includes('min') ? item.estimated_time : `${item.estimated_time || '15'} ${t('crafts.minutes', 'min')}`}
                                    </span>
                                </div>
                                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                                    <FileText size={10} /> {item.pages_count} {item.pages_count === 1 ? t('crafts.pageShort', 'pág') : t('crafts.pagesShort', 'págs')}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-text-main text-base line-clamp-1 group-hover:text-brand-primary transition">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
                                        {item.description || t('crafts.defaultDesc', 'Plantilla lista para imprimir en hojas tamaño Carta o A4.')}
                                    </p>
                                </div>

                                <div className="pt-4 mt-3 border-t border-border-theme flex items-center justify-between text-xs">
                                    {item.rating_count > 0 ? (
                                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                                            <Star size={13} fill="currentColor" />
                                            <span>{Number(item.rating_avg).toFixed(1)}</span>
                                            <span className="text-[10px] text-text-muted font-normal">({item.rating_count})</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-text-muted">
                                            <Star size={13} className="text-text-muted opacity-40" />
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-bg-sub px-1.5 py-0.5 rounded border border-border-theme text-text-muted">
                                                {t('crafts.new', 'Nuevo')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="flex items-center gap-1 text-text-muted text-xs font-semibold"
                                            title={t('crafts.downloadsCount', { count: item.downloads_count || 0, defaultValue: `${item.downloads_count || 0} descargas` })}
                                        >
                                            <Download size={13} className="text-text-muted" />
                                            <span>{item.downloads_count || 0}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(item);
                                            }}
                                            className="p-2 rounded-xl bg-bg-sub hover:bg-brand-primary hover:text-text-inv transition text-text-sub"
                                            title={t('crafts.downloadPdf', 'Descargar Plantilla')}
                                            aria-label={t('crafts.downloadPdf', 'Descargar Plantilla')}
                                        >
                                            <Download size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedCraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-side border border-border-theme rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
                        {/* Modal Header */}
                        <div className="p-4 px-6 border-b border-border-theme flex items-center justify-between bg-bg-sub/50">
                            <div className="flex items-center gap-2">
                                <Scissors size={18} className="text-brand-primary" />
                                <span className="font-black text-xs uppercase tracking-wider text-text-main">
                                    {t('crafts.heroTag', 'Taller & Manualidades')}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCraft(null)}
                                className="p-2 text-text-muted hover:text-text-main rounded-xl hover:bg-bg-sub transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body Scroll */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Preview Image */}
                            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-bg-sub border border-border-theme">
                                <img
                                    src={selectedCraft.thumbnail_url}
                                    alt={selectedCraft.title}
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/assets/adaptive-icon.png';
                                    }}
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                                    {getDifficultyBadge(selectedCraft.difficulty)}
                                    <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-black/70 text-white backdrop-blur-sm">
                                        {selectedCraft.pages_count} {selectedCraft.pages_count === 1 ? t('crafts.page', 'Página') : t('crafts.pages', 'Páginas')}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-black/70 text-white backdrop-blur-sm flex items-center gap-1.5">
                                        <Download size={13} /> {selectedCraft.downloads_count || 0}
                                    </span>
                                </div>
                            </div>

                            {/* Title & Attribution */}
                            <div>
                                <h2 className="text-2xl font-black text-text-main">
                                    {selectedCraft.title}
                                </h2>
                                <p className="text-xs text-text-muted mt-1">
                                    {selectedCraft.source_attribution || t('crafts.freeUsage', 'Uso Libre')}
                                </p>
                                <p className="text-sm text-text-sub mt-3 leading-relaxed whitespace-pre-line">
                                    {selectedCraft.description || t('crafts.defaultDesc', 'Plantilla lista para imprimir en hojas tamaño Carta o A4.')}
                                </p>
                            </div>

                            {/* Video Tutorial if present */}
                            {selectedCraft.video_url && getYoutubeEmbedUrl(selectedCraft.video_url) && (
                                <div className="space-y-2">
                                    <h4 className="font-black text-xs uppercase tracking-wider text-brand-primary flex items-center gap-1.5">
                                        ▶️ {t('crafts.videoTutorial', 'Tutorial de Armado en Video')}
                                    </h4>
                                    <div className={`${selectedCraft.video_url.includes('/shorts/') ? 'aspect-[9/16] max-w-[300px] mx-auto' : 'aspect-video'} rounded-2xl overflow-hidden border border-border-theme bg-black shadow-lg`}>
                                        <iframe
                                            src={getYoutubeEmbedUrl(selectedCraft.video_url)!}
                                            title={selectedCraft.title}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Category Specific Guides */}
                            {selectedCraft.category === 'papercraft' && (
                                <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/20 space-y-2 text-xs">
                                    <h4 className="font-black text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles size={14} /> {t('crafts.categoryGuides.papercraftTitle', '✂️ Guía rápida de armado (Papercraft 3D)')}
                                    </h4>
                                    <ul className="space-y-1 text-text-sub list-disc list-inside">
                                        <li><strong>{t('crafts.categoryGuides.papercraftStep1Title', 'Línea continua (──):')}</strong> {t('crafts.categoryGuides.papercraftStep1Desc', 'Cortar con tijeras o bisturí sobre el contorno exterior.')}</li>
                                        <li><strong>{t('crafts.categoryGuides.papercraftStep2Title', 'Línea punteada (- - -):')}</strong> {t('crafts.categoryGuides.papercraftStep2Desc', 'Doblar suavemente marcando el pliegue con una regla.')}</li>
                                        <li><strong>{t('crafts.categoryGuides.papercraftStep3Title', 'Pestañas / Solapas:')}</strong> {t('crafts.categoryGuides.papercraftStep3Desc', 'Aplica pegamento en barra o silicón líquido para unir las caras 3D.')}</li>
                                        <li><strong>{t('crafts.categoryGuides.papercraftStep4Title', 'Papel recomendado:')}</strong> {t('crafts.categoryGuides.papercraftStep4Desc', 'Imprime en cartulina opalina de 150g a 200g para mayor firmeza.')}</li>
                                    </ul>
                                </div>
                            )}

                            {selectedCraft.category === 'colorear' && (
                                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20 space-y-2 text-xs">
                                    <h4 className="font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                                        {t('crafts.categoryGuides.coloringTitle', '🎨 ¿Cómo colorear esta lámina?')}
                                    </h4>
                                    <ul className="space-y-1 text-text-sub list-disc list-inside">
                                        <li><strong>{t('crafts.categoryGuides.coloringStep1Title', 'Técnica libre:')}</strong> {t('crafts.categoryGuides.coloringStep1Desc', 'Usa lápices de colores, marcadores a base de agua o crayones.')}</li>
                                        <li><strong>{t('crafts.categoryGuides.coloringStep2Title', 'Paleta Personal:')}</strong> {t('crafts.categoryGuides.coloringStep2Desc', 'Elige tus 6 colores favoritos antes de empezar para crear una armonía única.')}</li>
                                        <li><strong>{t('crafts.categoryGuides.coloringStep3Title', 'Comunidad:')}</strong> {t('crafts.categoryGuides.coloringStep3Desc', 'Comparte una foto de tu dibujo terminado en La Taberna para ganar Frikicoins con los likes de la comunidad.')}</li>
                                    </ul>
                                </div>
                            )}

                            {selectedCraft.category === 'origami' && (
                                <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/20 space-y-2 text-xs">
                                    <h4 className="font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                        {t('crafts.categoryGuides.origamiTitle', '🦢 Consejos de Origami')}
                                    </h4>
                                    <ul className="space-y-1 text-text-sub list-disc list-inside">
                                        <li><strong>{t('crafts.categoryGuides.origamiStep1Title', 'Papel:')}</strong> {t('crafts.categoryGuides.origamiStep1Desc', 'Utiliza papel bond estándar delgado (75g - 90g) para que los pliegues múltiples no abulten.')}</li>
                                        <li><strong>{t('crafts.categoryGuides.origamiStep2Title', 'Precisión:')}</strong> {t('crafts.categoryGuides.origamiStep2Desc', 'Alinea las esquinas con exactitud antes de marcar cada pliegue con la uña.')}</li>
                                    </ul>
                                </div>
                            )}

                            {selectedCraft.category === 'cosplay_props' && (
                                <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-2 text-xs">
                                    <h4 className="font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                        {t('crafts.categoryGuides.cosplayTitle', '🎭 Props & Cosplay')}
                                    </h4>
                                    <ul className="space-y-1 text-text-sub list-disc list-inside">
                                        <li><strong>{t('crafts.categoryGuides.cosplayStep1Title', 'Refuerzo:')}</strong> {t('crafts.categoryGuides.cosplayStep1Desc', 'Pega las piezas sobre foamy (goma EVA) de 2mm a 5mm o cartón maqueta.')}</li>
                                        <li><strong>{t('crafts.categoryGuides.cosplayStep2Title', 'Acabado:')}</strong> {t('crafts.categoryGuides.cosplayStep2Desc', 'Sella con cola vinílica o sellador acrílico antes de pintar con spray o acrílicos.')}</li>
                                    </ul>
                                </div>
                            )}

                            {/* Download Action Box */}
                            <div className="p-4 bg-bg-sub rounded-2xl border border-border-theme flex items-center justify-between gap-4">
                                <div>
                                    <p className="font-bold text-text-main text-sm">
                                        {t('crafts.downloadPdfVector', 'Plantilla en PDF (Vector Alta Resolución)')}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {t('crafts.downloadsCount', { count: selectedCraft.downloads_count, defaultValue: `${selectedCraft.downloads_count} descargas registradas` })}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDownload(selectedCraft)}
                                    className="px-6 py-3 rounded-xl bg-brand-primary text-text-inv font-black text-sm hover:bg-brand-primary-light transition shadow-lg shadow-brand-primary/20 flex items-center gap-2"
                                >
                                    <Download size={16} /> {t('crafts.downloadPdf', 'Descargar Plantilla')}
                                </button>
                            </div>

                            {/* Rating and Reviews Section */}
                            <div className="pt-4 border-t border-border-theme space-y-4">
                                <h3 className="font-black text-base text-text-main flex items-center gap-2">
                                    {selectedCraft.rating_count > 0 ? (
                                        <>
                                            <Star size={18} className="text-amber-400" fill="currentColor" />
                                            <span>{Number(selectedCraft.rating_avg).toFixed(1)}</span>
                                            <span className="text-xs font-normal text-text-muted">
                                                ({t('crafts.ratingsCount', { count: selectedCraft.rating_count, defaultValue: `${selectedCraft.rating_count} calificaciones` })})
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Star size={18} className="text-text-muted opacity-40" />
                                            <span className="text-sm font-semibold text-text-muted">
                                                {t('crafts.noRatingsYet', 'Sin calificaciones aún')}
                                            </span>
                                        </>
                                    )}
                                </h3>

                                {/* User Rating Form */}
                                {ratingSuccess ? (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-2">
                                        <Check size={16} /> {t('crafts.ratingSuccess', '¡Gracias por tu calificación!')}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitRating} className="p-4 bg-bg-sub rounded-2xl border border-border-theme space-y-3">
                                        <label className="block text-xs font-bold text-text-sub">
                                            {t('crafts.howWasModel', '¿Cómo te pareció este modelo?')}
                                        </label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setUserRating(star)}
                                                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                                                >
                                                    <Star size={24} fill={star <= userRating ? 'currentColor' : 'none'} />
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            value={userComment}
                                            onChange={e => setUserComment(e.target.value)}
                                            placeholder={t('crafts.commentPlaceholder', 'Comentario opcional sobre el armado o dificultad...')}
                                            className="w-full px-4 py-2 text-xs rounded-xl bg-bg-side border border-border-theme text-text-main outline-none focus:ring-2 focus:ring-brand-primary"
                                        />
                                        <button
                                            type="submit"
                                            disabled={submittingRating}
                                            className="px-5 py-2 rounded-xl bg-brand-primary text-text-inv font-black text-xs uppercase tracking-wider hover:bg-brand-primary-light transition disabled:opacity-50"
                                        >
                                            {submittingRating ? t('crafts.submittingRating', 'Enviando...') : t('crafts.sendRating', 'Enviar Calificación')}
                                        </button>
                                    </form>
                                )}

                                {/* Reviews List */}
                                <div className="space-y-3">
                                    {loadingReviews ? (
                                        <div className="py-4 text-center text-xs text-text-muted">{t('crafts.loadingReviews', 'Cargando opiniones...')}</div>
                                    ) : reviews.length === 0 ? (
                                        <p className="text-xs text-text-muted italic">{t('crafts.noReviews', 'Aún no hay comentarios sobre este modelo. ¡Sé el primero en compartir tu experiencia!')}</p>
                                    ) : (
                                        reviews.map(rev => (
                                            <div key={rev.id} className="p-3 bg-bg-sub/60 rounded-xl border border-border-theme flex items-start gap-3">
                                                <img
                                                    src={getAvatarSource(rev.avatar_url)}
                                                    alt={rev.username}
                                                    className="w-8 h-8 rounded-full border border-border-theme object-cover shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-xs text-text-main truncate">@{rev.username}</span>
                                                        <div className="flex text-amber-400">
                                                            {Array.from({ length: rev.rating }).map((_, i) => (
                                                                <Star key={i} size={11} fill="currentColor" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {rev.comment && (
                                                        <p className="text-xs text-text-sub mt-1 leading-relaxed">{rev.comment}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
