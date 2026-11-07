import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Scissors, Plus, Search, Loader2, Edit2, Trash2, Eye, EyeOff,
    Upload, Link as LinkIcon, Star, Download, Save, ArrowLeft
} from 'lucide-react';
import { CraftService, type CraftItem } from '../../services/CraftService';

interface CraftManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CraftManagerModal({ isOpen, onClose }: CraftManagerModalProps) {
    const { t } = useTranslation();

    const [crafts, setCrafts] = useState<CraftItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Editor state
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<CraftItem | null>(null);
    const [saving, setSaving] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'papercraft' | 'origami' | 'colorear' | 'cosplay_props' | 'otro'>('papercraft');
    const [difficulty, setDifficulty] = useState<'facil' | 'intermedio' | 'avanzado'>('facil');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [pagesCount, setPagesCount] = useState('1');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [useExternalPdfUrl, setUseExternalPdfUrl] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [sourceAttribution, setSourceAttribution] = useState('Diseño original de su respectivo autor. Compartido con fines recreativos.');
    const [tagsStr, setTagsStr] = useState('');
    const [isPublished, setIsPublished] = useState(true);

    // File uploads
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [templateFile, setTemplateFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadCrafts();
        } else {
            setIsEditing(false);
            setEditingItem(null);
        }
    }, [isOpen]);

    const loadCrafts = async () => {
        setLoading(true);
        const data = await CraftService.getAllCraftsAdmin();
        setCrafts(data);
        setLoading(false);
    };

    const openCreateForm = () => {
        setEditingItem(null);
        setTitle('');
        setDescription('');
        setCategory('papercraft');
        setDifficulty('facil');
        setEstimatedTime('30 min');
        setPagesCount('1');
        setThumbnailUrl('');
        setPdfUrl('');
        setUseExternalPdfUrl(false);
        setVideoUrl('');
        setSourceAttribution('Diseño original de su respectivo autor. Compartido con fines recreativos.');
        setTagsStr('');
        setIsPublished(true);
        setThumbnailFile(null);
        setTemplateFile(null);
        setIsEditing(true);
    };

    const openEditForm = (item: CraftItem) => {
        setEditingItem(item);
        setTitle(item.title || '');
        setDescription(item.description || '');
        setCategory(item.category || 'papercraft');
        setDifficulty(item.difficulty || 'facil');
        setEstimatedTime(item.estimated_time || '');
        setPagesCount(String(item.pages_count || 1));
        setThumbnailUrl(item.thumbnail_url || '');
        setPdfUrl(item.pdf_url || '');
        setUseExternalPdfUrl(Boolean(item.pdf_url && !item.pdf_url.includes('craft-assets')));
        setVideoUrl(item.video_url || '');
        setSourceAttribution(item.source_attribution || '');
        setTagsStr((item.tags || []).join(', '));
        setIsPublished(item.is_published);
        setThumbnailFile(null);
        setTemplateFile(null);
        setIsEditing(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert(t('crafts.gm.errTitleRequired', 'El título es obligatorio.'));
            return;
        }

        setSaving(true);
        try {
            let finalThumbUrl = thumbnailUrl.trim();
            if (thumbnailFile) {
                const uploadedThumb = await CraftService.uploadCraftAsset(thumbnailFile, 'thumbnails');
                if (!uploadedThumb) throw new Error('Error subiendo portada');
                finalThumbUrl = uploadedThumb;
            }

            let finalPdfUrl = pdfUrl.trim();
            if (!useExternalPdfUrl && templateFile) {
                const uploadedPdf = await CraftService.uploadCraftAsset(templateFile, 'templates');
                if (!uploadedPdf) throw new Error('Error subiendo archivo imprimible');
                finalPdfUrl = uploadedPdf;
            }

            if (!finalThumbUrl || !finalPdfUrl) {
                alert(t('crafts.gm.errAssetsRequired', 'Debes proporcionar tanto la imagen de portada como el archivo o enlace imprimible.'));
                setSaving(false);
                return;
            }

            const tags = tagsStr
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            const payload: Partial<CraftItem> = {
                title: title.trim(),
                description: description.trim() || null,
                category,
                difficulty,
                estimated_time: estimatedTime.trim() || null,
                pages_count: Math.max(1, parseInt(pagesCount, 10) || 1),
                thumbnail_url: finalThumbUrl,
                pdf_url: finalPdfUrl,
                video_url: videoUrl.trim() || null,
                source_attribution: sourceAttribution.trim() || null,
                tags,
                is_published: isPublished,
            };

            const res = await CraftService.saveCraft(payload, editingItem?.id);
            if (!res.success) {
                alert(res.error || t('common.error'));
            } else {
                setIsEditing(false);
                setEditingItem(null);
                await loadCrafts();
            }
        } catch (err: any) {
            console.error(err);
            alert(err.message || t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePublish = async (item: CraftItem) => {
        const ok = await CraftService.togglePublishCraft(item.id, !item.is_published);
        if (ok) {
            setCrafts(prev => prev.map(c => c.id === item.id ? { ...c, is_published: !item.is_published } : c));
        }
    };

    const handleDelete = async (item: CraftItem) => {
        if (!window.confirm(t('crafts.gm.deleteConfirm', { title: item.title, defaultValue: `¿Eliminar permanentemente "${item.title}"?` }))) return;
        const ok = await CraftService.deleteCraft(item.id);
        if (ok) {
            setCrafts(prev => prev.filter(c => c.id !== item.id));
        }
    };

    const filteredCrafts = crafts.filter(c => {
        if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return c.title.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
            <div className="bg-bg-side border border-pink-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-border-theme bg-bg-pop flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="p-2 rounded-xl bg-bg-side text-text-main hover:text-pink-500 transition"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <div className="p-2.5 rounded-xl bg-pink-500/15 text-pink-500 border border-pink-500/30">
                                <Scissors size={22} />
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-text-main leading-tight">
                                {isEditing
                                    ? (editingItem ? t('crafts.gm.editTitle', 'Editar Manualidad') : t('crafts.gm.newTitle', 'Nueva Manualidad'))
                                    : t('crafts.gm.workshopTitle', 'Taller GM de Manualidades & Papercraft')}
                            </h2>
                            <p className="text-xs text-pink-500 font-bold">
                                {t('crafts.gm.workshopSubtitle', 'Gestión exclusiva de plantillas, portadas y enlaces externos')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                type="button"
                                onClick={openCreateForm}
                                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-pink-500/20 transition cursor-pointer"
                            >
                                <Plus size={16} />
                                <span>{t('crafts.gm.addBtn', 'Subir Modelo')}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-bg-side transition"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
                    {isEditing ? (
                        <form onSubmit={handleSave} className="space-y-5 max-w-2xl mx-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.titleLabel', 'Título del Modelo')} *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="Ej: Casco Iron Man Mark 85"
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-pink-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.categoryLabel', 'Categoría')}
                                    </label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value as any)}
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-pink-500"
                                    >
                                        <option value="papercraft">{t('crafts.categories.papercraft', 'Papercraft 3D')}</option>
                                        <option value="colorear">{t('crafts.categories.colorear', 'Para Colorear')}</option>
                                        <option value="origami">{t('crafts.categories.origami', 'Origami')}</option>
                                        <option value="cosplay_props">{t('crafts.categories.cosplay_props', 'Props & Cosplay')}</option>
                                        <option value="otro">{t('crafts.categories.otro', 'Guías / Otros')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.difficultyLabel', 'Dificultad')}
                                    </label>
                                    <select
                                        value={difficulty}
                                        onChange={e => setDifficulty(e.target.value as any)}
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-pink-500"
                                    >
                                        <option value="facil">{t('crafts.difficulty.facil', 'Fácil')}</option>
                                        <option value="intermedio">{t('crafts.difficulty.intermedio', 'Intermedio')}</option>
                                        <option value="avanzado">{t('crafts.difficulty.avanzado', 'Avanzado')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.estimatedTimeLabel', 'Tiempo Estimado')}
                                    </label>
                                    <input
                                        type="text"
                                        value={estimatedTime}
                                        onChange={e => setEstimatedTime(e.target.value)}
                                        placeholder="Ej: 2 horas"
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-pink-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.pagesCountLabel', 'Cantidad de Páginas')}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={pagesCount}
                                        onChange={e => setPagesCount(e.target.value)}
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-pink-500"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.descriptionLabel', 'Descripción / Instrucciones')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-pink-500 resize-none"
                                    />
                                </div>

                                {/* Thumbnail Upload or URL */}
                                <div className="sm:col-span-2 p-4 rounded-2xl bg-bg-pop border border-border-theme space-y-3">
                                    <label className="block text-xs font-black uppercase text-text-muted">
                                        {t('crafts.gm.thumbnailLabel', 'Imagen de Portada (Render / Foto)')} *
                                    </label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <label className="px-4 py-2 rounded-xl bg-bg-side border border-border-theme hover:border-pink-500 text-xs font-bold text-text-main cursor-pointer flex items-center gap-2 transition">
                                            <Upload size={15} className="text-pink-500" />
                                            <span>{thumbnailFile ? thumbnailFile.name : t('crafts.gm.uploadImageBtn', 'Subir imagen al bucket')}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => setThumbnailFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                            />
                                        </label>
                                        <span className="text-xs text-text-muted">o URL directa:</span>
                                        <input
                                            type="text"
                                            value={thumbnailUrl}
                                            onChange={e => setThumbnailUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="flex-1 min-w-[200px] bg-bg-side border border-border-theme rounded-xl px-3 py-2 text-xs text-text-main focus:outline-none focus:border-pink-500"
                                        />
                                    </div>
                                </div>

                                {/* Printable PDF/Image Upload or External URL */}
                                <div className="sm:col-span-2 p-4 rounded-2xl bg-bg-pop border border-border-theme space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-black uppercase text-text-muted">
                                            {t('crafts.gm.templateLabel', 'Plantilla Imprimible (PDF / Imagen)')} *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setUseExternalPdfUrl(!useExternalPdfUrl)}
                                            className="text-xs font-bold text-pink-500 flex items-center gap-1 hover:underline"
                                        >
                                            <LinkIcon size={12} />
                                            {useExternalPdfUrl
                                                ? t('crafts.gm.useBucketUpload', 'Subir a Supabase Storage')
                                                : t('crafts.gm.useExternalLink', 'Usar enlace externo (Drive / Mega)')}
                                        </button>
                                    </div>

                                    {useExternalPdfUrl ? (
                                        <input
                                            type="url"
                                            value={pdfUrl}
                                            onChange={e => setPdfUrl(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full bg-bg-side border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-text-main focus:outline-none focus:border-pink-500"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <label className="px-4 py-2 rounded-xl bg-bg-side border border-border-theme hover:border-pink-500 text-xs font-bold text-text-main cursor-pointer flex items-center gap-2 transition">
                                                <Upload size={15} className="text-pink-500" />
                                                <span>{templateFile ? templateFile.name : t('crafts.gm.uploadTemplateBtn', 'Subir PDF o Imagen')}</span>
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/*"
                                                    onChange={e => setTemplateFile(e.target.files?.[0] || null)}
                                                    className="hidden"
                                                />
                                            </label>
                                            {pdfUrl && !templateFile && (
                                                <span className="text-[11px] text-text-muted truncate max-w-xs">{pdfUrl}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.videoUrlLabel', 'Video Tutorial / YouTube Shorts (Opcional)')}
                                    </label>
                                    <input
                                        type="url"
                                        value={videoUrl}
                                        onChange={e => setVideoUrl(e.target.value)}
                                        placeholder="https://youtube.com/shorts/..."
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-pink-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.tagsLabel', 'Etiquetas (separadas por coma)')}
                                    </label>
                                    <input
                                        type="text"
                                        value={tagsStr}
                                        onChange={e => setTagsStr(e.target.value)}
                                        placeholder="marvel, anime, pokemon"
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-pink-500"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-black uppercase text-text-muted mb-1">
                                        {t('crafts.gm.attributionLabel', 'Créditos / Atribución de Autor')}
                                    </label>
                                    <input
                                        type="text"
                                        value={sourceAttribution}
                                        onChange={e => setSourceAttribution(e.target.value)}
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-pink-500"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-xl bg-bg-pop border border-border-theme">
                                    <span className="text-xs font-bold text-text-main">
                                        {t('crafts.gm.publishedToggle', 'Publicar inmediatamente en el catálogo')}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={isPublished}
                                        onChange={e => setIsPublished(e.target.checked)}
                                        className="w-4 h-4 accent-pink-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-5 py-2.5 rounded-xl border border-border-theme text-xs font-bold text-text-muted hover:bg-bg-pop transition"
                                >
                                    {t('common.cancel', 'Cancelar')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-pink-500/20 transition cursor-pointer"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    <span>{t('common.save', 'Guardar')}</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder={t('crafts.searchPlaceholder', 'Buscar modelo...')}
                                        className="w-full bg-bg-pop border border-border-theme rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-pink-500"
                                    />
                                </div>
                                <select
                                    value={categoryFilter}
                                    onChange={e => setCategoryFilter(e.target.value)}
                                    className="bg-bg-pop border border-border-theme rounded-xl px-3.5 py-2.5 text-xs font-bold text-text-main focus:outline-none focus:border-pink-500"
                                >
                                    <option value="all">{t('common.all', 'Todas las categorías')}</option>
                                    <option value="papercraft">{t('crafts.categories.papercraft', 'Papercraft 3D')}</option>
                                    <option value="colorear">{t('crafts.categories.colorear', 'Para Colorear')}</option>
                                    <option value="origami">{t('crafts.categories.origami', 'Origami')}</option>
                                    <option value="cosplay_props">{t('crafts.categories.cosplay_props', 'Props & Cosplay')}</option>
                                </select>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="animate-spin text-pink-500" size={36} />
                                </div>
                            ) : filteredCrafts.length === 0 ? (
                                <div className="text-center py-14 text-text-muted text-sm font-bold">
                                    {t('crafts.emptyTitle', 'No se encontraron manualidades')}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredCrafts.map(item => (
                                        <div
                                            key={item.id}
                                            className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition ${
                                                item.is_published
                                                    ? 'bg-bg-pop border-border-theme'
                                                    : 'bg-bg-pop/40 border-dashed border-border-theme opacity-70'
                                            }`}
                                        >
                                            <img
                                                src={item.thumbnail_url}
                                                alt={item.title}
                                                className="w-16 h-16 rounded-xl object-cover border border-border-theme shrink-0 bg-bg-side"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-sm text-text-main truncate">{item.title}</h4>
                                                    {!item.is_published && (
                                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                                                            {t('crafts.gm.pausedBadge', 'Pausado')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-text-muted font-bold mt-1">
                                                    <span className="capitalize">{item.category}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Download size={11} /> {item.downloads_count || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-amber-400">
                                                        <Star size={11} className="fill-amber-400" />
                                                        {item.rating_count > 0 ? Number(item.rating_avg).toFixed(1) : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePublish(item)}
                                                    className="p-2 rounded-xl bg-bg-side border border-border-theme text-text-muted hover:text-pink-500 transition"
                                                    title={item.is_published ? t('crafts.gm.pauseAction', 'Pausar') : t('crafts.gm.publishAction', 'Publicar')}
                                                >
                                                    {item.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditForm(item)}
                                                    className="p-2 rounded-xl bg-bg-side border border-border-theme text-text-muted hover:text-brand-primary transition"
                                                    title={t('common.edit', 'Editar')}
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="p-2 rounded-xl bg-bg-side border border-border-theme text-text-muted hover:text-accent-red transition"
                                                    title={t('common.delete', 'Eliminar')}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

