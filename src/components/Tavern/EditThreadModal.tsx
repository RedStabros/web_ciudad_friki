import { useState, useEffect } from 'react';
import { X, Loader2, Save, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TavernService } from '../../services/TavernService';
import type { TavernThread, ThreadCategory } from '../../types/tavern';

interface EditThreadModalProps {
    isOpen: boolean;
    onClose: () => void;
    thread: TavernThread | null;
    onSuccess: () => void;
}

export function EditThreadModal({ isOpen, onClose, thread, onSuccess }: EditThreadModalProps) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<ThreadCategory>('Todas');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && thread) {
            setTitle(thread.title);
            setContent(thread.content);
            setCategory((thread.tag as ThreadCategory) || 'Todas');
            setError(null);
        }
    }, [isOpen, thread]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!thread || !title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        setError(null);
        try {
            // Uses RPC edit_tavern_post — mirrors app's TavernService.editPost()
            const { error: updateError } = await TavernService.editPost(thread.id, 'thread', content.trim(), title.trim());

            if (updateError) throw updateError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating thread:', err);
            setError(err.message || 'Error al actualizar el hilo');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const categories: ThreadCategory[] = [
        'Anime/Manga', 'Gaming/Tech', 'Cultura/Arte', 'Eventos', 'Off-topic', 'Picantes'
    ];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ui-overlay backdrop-blur-sm shadow-2xl" onClick={onClose}>
            <div
                className="bg-bg-side w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border-theme"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b border-divider-theme">
                    <h2 className="text-xl font-bold text-text-main">{t('tavern.modals.edit.title')}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-full transition text-text-muted">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-accent-red text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2 SmallCaps uppercase tracking-wider">{t('tavern.modals.edit.labelTitle')}</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-bg-main border border-divider-theme rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-main"
                            placeholder={t('tavern.modals.edit.placeholderTitle')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2 SmallCaps uppercase tracking-wider">{t('tavern.modals.edit.labelCategory')}</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as ThreadCategory)}
                            className="w-full bg-bg-main border border-divider-theme rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-main"
                        >
                            {categories.map(cat => {
                                let label: string = cat;
                                if (cat === 'Todas') label = t('tavern.categories.all');
                                else if (cat === 'Anime/Manga') label = t('tavern.categories.anime');
                                else if (cat === 'Gaming/Tech') label = t('tavern.categories.gaming');
                                else if (cat === 'Cultura/Arte') label = t('tavern.categories.culture');
                                else if (cat === 'Eventos') label = t('tavern.categories.events');
                                else if (cat === 'Off-topic') label = t('tavern.categories.offTopic');
                                else if (cat === 'Picantes') label = t('tavern.categories.nsfw');

                                return (
                                    <option key={cat} value={cat}>{label}</option>
                                );
                            })}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-main mb-2 SmallCaps uppercase tracking-wider">{t('tavern.modals.edit.labelContent')}</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-bg-main border border-divider-theme rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-text-main min-h-[200px] resize-none"
                            placeholder={t('tavern.modals.edit.placeholderContent')}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-text-muted hover:bg-bg-sub transition"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim() || !content.trim()}
                            className="bg-brand-primary hover:bg-brand-primary-light disabled:opacity-50 text-text-inv font-bold py-2.5 px-8 rounded-xl shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {t('tavern.modals.edit.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
