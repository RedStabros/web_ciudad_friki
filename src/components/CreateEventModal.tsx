import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, Calendar as CalendarIcon, MapPin, Loader2, Globe, Phone, Ticket, Tag, Hash, Link, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { renderTextWithMedia } from '../utils/mediaRenderer';
import { supabase } from '../lib/supabase';
import { ALL_INTERESTS } from '../config/interests';

export function CreateEventModal({ isOpen, onClose, onCreated }: { isOpen: boolean, onClose: () => void, onCreated: () => void }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state mirroring the mobile app payload
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        maps_location_url: '',
        price_min: 0,
        is_free: false,
        external_link: '',
        whatsapp: '',
        tags: [] as string[]
    });

    const [imageFile, setImageFile] = useState<Blob | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    /**
     * Resize image to max 1080px wide and compress to JPEG 0.8
     * Mirrors the mobile app's ImageManipulator logic:
     *   manipulateAsync(uri, [{ resize: { width: 1080 } }], { compress: 0.8, format: JPEG })
     */
    const resizeAndCompressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const MAX_WIDTH = 1080;
                let { width, height } = img;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
                    'image/jpeg',
                    0.8 // quality 0.8 matches the app
                );
            };
            img.onerror = reject;
            img.src = objectUrl;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressed = await resizeAndCompressImage(file);
                setImageFile(compressed);
                setImagePreview(URL.createObjectURL(compressed));
            } catch {
                // Fallback: use original if canvas fails
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            }
        }
    };

    const toggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    // Mirrors sanitizeText() and sanitizeDescription() from mobile app utils/sanitize.ts
    const sanitizeText = (text: string) => text.trim().replace(/<[^>]*>/g, '');
    const sanitizeDescription = (text: string) => text.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert(t('common.loginRequired', 'Inicia sesión para crear eventos'));

        if (!formData.title || !formData.date || !formData.location || !formData.startTime) {
            return alert(t('common.errorHighlight', 'Por favor llena los campos requeridos (*).'));
        }

        setIsSubmitting(true);

        try {
            // 1. Upload image (already compressed by handleFileChange)
            let bannerUrl: string | null = null;
            if (imageFile) {
                const fileName = `${user.id}_${Date.now()}.jpg`;

                const { error: uploadError } = await supabase.storage
                    .from('event-banners')
                    .upload(fileName, imageFile, { contentType: 'image/jpeg' });

                if (uploadError) {
                    console.error('Storage error:', uploadError);
                    alert(t('events.errors.uploadError', 'Error subiendo la imagen. Intenta de nuevo.'));
                    setIsSubmitting(false);
                    return;
                }

                const { data: publicURLData } = supabase.storage
                    .from('event-banners')
                    .getPublicUrl(fileName);
                bannerUrl = publicURLData.publicUrl;
            }

            // 2. Build payload — mirrors mobile app's handleSubmit() exactly
            const eventData = {
                title: sanitizeText(formData.title),
                description: sanitizeDescription(formData.description),
                date: formData.date,
                end_date: formData.endDate || null,
                start_time: formData.startTime,
                end_time: formData.endTime || null,
                location: sanitizeText(formData.location),
                maps_location_url: formData.maps_location_url || null,
                price_min: formData.is_free ? 0 : (formData.price_min ? Number(formData.price_min) : null),
                external_link: formData.external_link || null,
                whatsapp: sanitizeText(formData.whatsapp),
                organizer_email: user.email,          // mobile app: organizerEmail || user.email
                tags: formData.tags,
                banner_url: bannerUrl,            // app uses banner_url (not image_url)
                created_by: user.id,              // app always sends created_by
                status: 'pending',            // app sends 'pending' → goes through review
            };

            // 3. Insert
            const { error } = await supabase
                .from('events')
                .insert(eventData);

            if (error) throw error;

            alert(t('events.success', '¡Evento enviado! Quedará pendiente de revisión.'));
            onCreated();
            onClose();
        } catch (err: any) {
            console.error('Submit error:', err);
            alert(t('events.errors.createError', 'Error al crear el evento: ') + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm shadow-2xl"
            onClick={onClose}
        >
            <div
                className="bg-bg-side w-full max-w-2xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border-theme shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-divider-theme">
                    <h2 className="text-xl font-bold text-text-main">{t('events.createTitle')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition text-text-muted hover:text-text-main">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                    <form id="createForm" onSubmit={handleSubmit} className="space-y-8">

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                <Hash size={16} /> {t('events.sections.basics', 'Información Básica')}
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('events.title')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={t('events.placeholders.title')}
                                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('events.description')}</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={t('events.placeholders.description')}
                                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none resize-none mb-3 transition-all shadow-sm"
                                />
                                {/* LIVE PREVIEW AREA */}
                                {formData.description.trim() && (
                                    <div className="p-4 bg-bg-main/30 rounded-2xl border border-dashed border-divider-theme shadow-inner">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 opacity-50 flex items-center gap-1">
                                            <PlayCircle size={10} /> {t('common.preview', 'Vista Previa')}
                                        </div>
                                        <div className="text-text-sub text-sm whitespace-pre-line leading-relaxed">
                                            {renderTextWithMedia(formData.description)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates & Times */}
                        <div className="space-y-4 pt-4 border-t border-divider-theme">
                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                <CalendarIcon size={16} /> {t('events.sections.schedule', 'Horarios')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-1">{t('events.startDate', 'Fecha Inicio')} *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary outline-none text-text-main"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-1">{t('events.startTime', 'Hora Inicio')} *</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.startTime}
                                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary outline-none text-text-main"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-1">{t('events.endDate', 'Fecha Fin (Opcional)')}</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary outline-none text-text-main"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-1">{t('events.endTime', 'Hora Fin (Opcional)')}</label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary outline-none text-text-main"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-4 pt-4 border-t border-divider-theme">
                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                <MapPin size={16} /> {t('events.sections.location', 'Ubicación')}
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('events.locationName', 'Lugar del Evento')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder={t('events.placeholders.place', 'Ej: Centro de Eventos, Parque, Local...')}
                                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('events.mapLink', 'Link del Mapa (Google/Waze)')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <Globe size={16} />
                                    </div>
                                    <input
                                        type="url"
                                        value={formData.maps_location_url}
                                        onChange={e => setFormData({ ...formData, maps_location_url: e.target.value })}
                                        placeholder="https://goo.gl/maps/..."
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl pl-10 px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tickets & Pricing */}
                        <div className="space-y-4 pt-4 border-t border-divider-theme">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                    <Ticket size={16} /> {t('events.sections.tickets', 'Tickets & Valor')}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-text-sub">{t('events.freeEvent', 'Evento Gratuito')}</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_free: !formData.is_free })}
                                        className={`w-10 h-6 rounded-full transition-all relative ${formData.is_free ? 'bg-accent-green' : 'bg-bg-sub border border-border-theme'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_free ? 'left-5' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>

                            {!formData.is_free && (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <label className="block text-sm font-bold text-text-sub mb-1">{t('events.ticketValue', 'Valor Inicial Tickets')}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted font-bold">
                                            $
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.price_min}
                                            onChange={e => setFormData({ ...formData, price_min: Number(e.target.value) })}
                                            className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl pl-8 px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('events.externalLink', 'Link Web / Venta Tickets (Opcional)')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <Link size={16} />
                                    </div>
                                    <input
                                        type="url"
                                        value={formData.external_link}
                                        onChange={e => setFormData({ ...formData, external_link: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl pl-10 px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-4 pt-4 border-t border-divider-theme">
                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                <Phone size={16} /> {t('events.sections.contact', 'Contacto')}
                            </h3>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('common.whatsapp', 'WhatsApp de Contacto')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <Phone size={16} />
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                        placeholder="Ej: 3001234567"
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl pl-10 px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="space-y-4 pt-4 border-t border-divider-theme">
                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                <Tag size={16} /> {t('events.sections.tags', 'Categorías e Intereses')}
                            </h3>
                            <p className="text-xs text-text-muted mb-2">{t('events.tagsHint', 'Selecciona los intereses que mejor definan tu evento para mejorar el filtrado.')}</p>
                            <div className="flex flex-wrap gap-2">
                                {ALL_INTERESTS.map(tag => {
                                    const isSelected = formData.tags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                                                ${isSelected
                                                    ? 'bg-brand-primary text-text-inv border-brand-primary shadow-md scale-105'
                                                    : 'bg-bg-sub text-text-sub border-border-theme hover:border-brand-primary/50'}`}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-4 pt-4 border-t border-divider-theme">
                            <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                <Upload size={16} /> {t('events.sections.image', 'Flyer del Evento')}
                            </h3>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="event-image-upload"
                                />
                                <label
                                    htmlFor="event-image-upload"
                                    className="block w-full cursor-pointer"
                                >
                                    {imagePreview ? (
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-brand-primary shadow-xl group">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20">
                                                    <Upload size={32} className="text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-video bg-bg-sub border-2 border-dashed border-divider-theme rounded-2xl flex flex-col items-center justify-center text-text-muted hover:border-brand-primary/50 transition-all hover:bg-bg-sub/80 group">
                                            <div className="p-4 rounded-full bg-bg-side border border-divider-theme mb-3 group-hover:scale-110 transition-transform">
                                                <Upload size={32} />
                                            </div>
                                            <span className="font-bold text-sm">{t('events.clickToUpload', 'Haz clic para subir la imagen')}</span>
                                            <span className="text-[10px] uppercase font-black opacity-50 mt-1">Recomendado: 1280x720px</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-divider-theme bg-bg-side flex justify-end gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl font-bold text-text-sub hover:bg-bg-sub transition"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        form="createForm"
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl font-bold bg-brand-primary text-text-inv hover:bg-brand-primary-light transition shadow-lg shadow-brand-primary/20 flex items-center justify-center min-w-[120px]"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : t('events.publish')}
                    </button>
                </div>

            </div>
        </div>
    );
}
