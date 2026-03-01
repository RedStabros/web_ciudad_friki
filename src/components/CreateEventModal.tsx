import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, Calendar as CalendarIcon, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EventService } from '../services/EventService';

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
        location: '',
        image_url: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert(t('common.loginRequired', 'Inicia sesión para crear eventos'));

        // Very basic validations
        if (!formData.title || !formData.date || !formData.location) {
            return alert(t('common.errorHighlight', 'Por favor llena los campos requeridos (*).'));
        }

        setIsSubmitting(true);
        // Map to FrikiEvent payload. Defaulting status to 'draft' or 'approved' depending on project rules. For now, matching the feed's 'approved' check.
        const result = await EventService.createEvent({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            start_time: formData.startTime,
            location: formData.location,
            image_url: formData.image_url || null,
            status: 'approved', // assuming immediate approval for testing
            is_sponsored: false,
            likes_count: 0,
            saved_count: 0
        });

        setIsSubmitting(false);

        if (result.error) {
            alert(t('events.error') + ': ' + result.error.message);
        } else {
            alert(t('events.success'));
            onCreated();
            onClose();
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
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <form id="createForm" onSubmit={handleSubmit} className="space-y-4">

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">{t('events.title')} *</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder={t('events.placeholders.title')}
                                className="w-full bg-bg-sub border border-border-theme text-text-main rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('events.date')} *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                        <CalendarIcon size={18} />
                                    </div>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-bg-sub border border-border-theme rounded-lg pl-10 px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-text-main"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('events.startTime')}</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full bg-bg-sub border border-border-theme rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-text-main"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">{t('events.location')} *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                    <MapPin size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder={t('events.placeholders.location')}
                                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-lg pl-10 px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">{t('events.description')}</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder={t('events.placeholders.description')}
                                className="w-full bg-bg-sub border border-border-theme text-text-main rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1">{t('events.imageUrl')}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                                    <Upload size={18} />
                                </div>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    placeholder="https://"
                                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-lg pl-10 px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                                />
                            </div>
                            <p className="text-xs text-text-muted mt-1">{t('events.imageHint')}</p>
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
