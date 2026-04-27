import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TavernService } from '../../services/TavernService';
import type { ThreadCategory } from '../../types/tavern';

interface CreateThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CATEGORIES: ThreadCategory[] = ['Anime/Manga', 'Gaming/Tech', 'Cultura/Arte', 'Eventos', 'Off-topic'];

export function CreateThreadModal({ isOpen, onClose, onSuccess }: CreateThreadModalProps) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<ThreadCategory | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFormValid = title.trim().length >= 5 && content.trim().length >= 10 && category !== null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const { error: submitError } = await TavernService.createThread({
                title: title.trim(),
                content: content.trim(),
                category: category!,
            });

            if (submitError) throw submitError;

            setTitle('');
            setContent('');
            setCategory(null);
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Error creating thread:', err);
            setError(err.message || 'No se pudo crear el hilo. Inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm shadow-2xl"
            onClick={onClose}
        >
            <div
                className="bg-bg-side w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-border-theme"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-divider-theme">
                    <h2 className="text-xl font-bold text-text-main">{t('tavern.modals.create.title')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-full transition text-text-muted">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg text-accent-red text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2">{t('tavern.modals.create.labelTitle')}</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('tavern.modals.create.placeholderTitle')}
                            className="w-full bg-bg-main border border-divider-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition"
                            maxLength={100}
                        />
                        <p className="text-[10px] text-text-muted mt-1">{t('tavern.modals.create.charCount', { count: title.length })}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2">{t('tavern.modals.create.labelCategory')}</label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => {
                                let displayLabel: string = cat;
                                if (cat === 'Anime/Manga') displayLabel = t('tavern.categories.anime');
                                else if (cat === 'Gaming/Tech') displayLabel = t('tavern.categories.gaming');
                                else if (cat === 'Cultura/Arte') displayLabel = t('tavern.categories.culture');
                                else if (cat === 'Eventos') displayLabel = t('tavern.categories.events');
                                else if (cat === 'Off-topic') displayLabel = t('tavern.categories.offTopic');

                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition border ${category === cat ? 'bg-brand-primary border-brand-primary text-text-inv shadow-md' : 'bg-bg-sub border-transparent text-text-muted hover:border-divider-theme'}`}
                                    >
                                        {displayLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2">{t('tavern.modals.create.labelContent')}</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t('tavern.modals.create.placeholderContent')}
                            rows={6}
                            className="w-full bg-bg-main border border-divider-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-brand-primary outline-none transition resize-none"
                        />
                        <p className="text-[10px] text-text-muted mt-1">{t('tavern.modals.create.minContent')}</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-full text-sm font-bold text-text-muted hover:bg-bg-sub transition"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className="px-8 py-2.5 rounded-full text-sm font-bold bg-brand-primary hover:bg-brand-primary-light disabled:opacity-50 text-text-inv transition shadow-lg shadow-brand-primary/25 flex items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            {t('tavern.modals.create.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
