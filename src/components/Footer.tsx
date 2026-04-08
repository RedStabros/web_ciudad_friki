import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

export default function Footer() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-bg-side border-t border-divider-theme mt-auto">
            <div className="max-w-3xl mx-auto px-6 py-8 pb-28 md:pb-8">
                <div className="flex flex-col items-center gap-5">

                    {/* Logo + Brand */}
                    <div className="flex items-center gap-2.5">
                        <img src="/assets/logo_ciudad_friki.png" alt="Ciudad Friki" className="h-7 w-auto opacity-70" />
                        <span className="font-black text-base tracking-tighter text-text-main italic uppercase">
                            Ciudad Friki <span className="text-brand-primary">Web</span>
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-divider-theme to-transparent" />

                    {/* Legal links */}
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <Link
                            to="/legal/terms"
                            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-primary transition-colors"
                        >
                            {t('auth.termsAndConditions', 'Términos y Condiciones')}
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-divider-theme" />
                        <Link
                            to="/legal/privacy"
                            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-primary transition-colors"
                        >
                            {t('auth.privacyPolicy', 'Política de Privacidad')}
                        </Link>
                    </div>

                    {/* Credit + Copyright */}
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted opacity-60">
                            <Heart size={10} className="fill-brand-secondary text-brand-secondary animate-pulse flex-shrink-0" />
                            {t('settings.madeWith')}
                            <a 
                                href="https://github.com/RedStabros" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-brand-secondary font-black hover:underline"
                            >
                                RedStabros
                            </a>
                        </p>
                        <span className="w-1 h-1 rounded-full bg-divider-theme opacity-40" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted opacity-60">
                            &copy; {currentYear} Ciudad Friki &bull; v2.0-web
                        </p>
                    </div>

                    {/* Tagline pill */}
                    <div className="inline-block px-3 py-1 rounded-full bg-bg-sub/50 border border-divider-theme">
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] opacity-40">
                            {t('footer.tagline')}
                        </p>
                    </div>

                </div>
            </div>
        </footer>
    );
}
