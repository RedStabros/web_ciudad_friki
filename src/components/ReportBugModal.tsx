import { useState } from 'react';
import { X, Bug, Loader2, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BugReportService } from '../services/BugReportService';
import { useAuth } from '../context/AuthContext';

interface ReportBugModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReportBugModal({ isOpen, onClose }: ReportBugModalProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !description.trim()) return;

        setIsSubmitting(true);
        try {
            const { error } = await BugReportService.reportBug(user.id, description);
            if (!error) {
                alert(t('profile.bugReportSuccess', 'Reporte enviado. Gracias por tu ayuda.'));
                setDescription('');
                onClose();
            } else {
                alert(t('common.error'));
            }
        } catch (err) {
            console.error(err);
            alert(t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-bg-side rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-accent-red/20">
                <header className="p-8 pb-4 flex items-center justify-between border-b border-divider-theme bg-accent-red/5">
                    <div className="flex items-center gap-3 text-accent-red">
                        <Bug size={24} />
                        <h2 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                            {t('profile.bugReportTitle', 'Reportar Problema')}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-all">
                        <X size={24} className="text-text-muted" />
                    </button>
                </header>

                <div className="p-8">
                    <p className="text-sm text-text-muted font-medium mb-6">
                        {t('profile.bugReportDesc', 'Describe detalladamente el problema, error o comportamiento inesperado que encontraste en la app.')}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('profile.bugReportPlaceholder', '¿Qué sucedió? ¿Cómo podemos reproducirlo?')}
                            rows={5}
                            required
                            className="w-full bg-bg-sub border border-border-theme text-text-main rounded-2xl py-4 px-6 focus:ring-2 focus:ring-accent-red/50 focus:border-transparent outline-none transition-all resize-none shadow-inner"
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting || !description.trim()}
                            className="w-full bg-accent-red hover:bg-red-600 disabled:opacity-50 text-text-inv font-black text-sm uppercase tracking-widest py-4 px-6 rounded-2xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {t('common.send', 'Enviar')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
