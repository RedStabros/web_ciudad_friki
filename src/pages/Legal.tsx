import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Shield, FileText, Loader2 } from 'lucide-react';

export default function Legal() {
    const { type } = useParams<{ type: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDoc = async () => {
            setIsLoading(true);
            try {
                const lang = i18n.language === 'es' ? 'es' : 'en';
                const fileName = `${type}_${lang}.md`;
                const response = await fetch(`/assest/${fileName}`);
                if (!response.ok) throw new Error('Document not found');
                const text = await response.text();
                setContent(text);
            } catch (err) {
                console.error(err);
                setContent(t('common.errorLoading', 'Error al cargar el documento legal.'));
            } finally {
                setIsLoading(false);
            }
        };

        if (type === 'terms' || type === 'privacy') {
            fetchDoc();
        } else {
            navigate('/');
        }
    }, [type, i18n.language, navigate, t]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-500">
            <SEO 
                title={type === 'terms' ? 'Términos y Condiciones' : 'Política de Privacidad'}
                description="Documentos legales, términos de uso y políticas de privacidad de la plataforma Ciudad Friki."
            />
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-text-muted hover:text-brand-primary transition-colors mb-8 font-bold text-sm uppercase tracking-widest"
            >
                <ChevronLeft size={20} />
                {t('common.back', 'Volver')}
            </button>

            <header className="mb-12 border-b border-divider-theme pb-8">
                <div className="flex items-center gap-4 text-brand-primary mb-4">
                    {type === 'privacy' ? <Shield size={40} /> : <FileText size={40} />}
                    <div className="h-10 w-1 bg-brand-primary rounded-full" />
                </div>
                <h1 className="text-5xl font-black text-text-main uppercase italic tracking-tighter">
                    {type === 'privacy' ? t('legal.privacyTitle', 'Privacidad') : t('legal.termsTitle', 'Términos y Condiciones')}
                </h1>
                <p className="text-text-sub mt-2 font-medium">Ciudad Friki - {new Date().getFullYear()}</p>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin text-brand-primary" size={48} />
                    <p className="text-text-muted font-bold text-xs uppercase tracking-[0.2em]">{t('common.loading')}</p>
                </div>
            ) : (
                <div className="bg-bg-side rounded-[3rem] p-8 md:p-12 border border-divider-theme shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                        {type === 'privacy' ? <Shield size={200} /> : <FileText size={200} />}
                    </div>

                    <div className="prose prose-friki max-w-none text-text-main leading-relaxed relative z-10">
                        {/* Render simple markdown-like structure (paragraphs and headers) */}
                        {content.split('\n').map((line, idx) => {
                            if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-black mb-6 mt-10 uppercase italic border-b-2 border-brand-primary/20 pb-2">{line.substring(2)}</h1>;
                            if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-black mb-4 mt-8 uppercase italic">{line.substring(3)}</h2>;
                            if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold mb-3 mt-6 uppercase">{line.substring(4)}</h3>;
                            if (line.trim() === '') return <br key={idx} />;
                            return <p key={idx} className="mb-4 text-text-sub font-medium">{line}</p>;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
