import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';

export default function Footer() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-bg-side border-t border-divider-theme pt-12 pb-24 md:pb-12 mt-auto">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    {/* Brand & Copyright */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <img src="/assets/logo_ciudad_friki.png" alt="Ciudad Friki" className="h-8 w-auto opacity-80" />
                            <span className="font-black text-lg tracking-tighter text-text-main italic uppercase">
                                Ciudad Friki <span className="text-brand-primary">Web</span>
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                            &copy; {currentYear} Ciudad Friki &bull; v2.0-web
                        </p>
                    </div>

                    {/* Credit */}
                    <div className="flex flex-col items-center gap-1">
                        <p className="flex items-center gap-2 text-sm font-bold text-text-sub">
                            {t('settings.madeWith')}
                            <span className="text-brand-secondary font-black tracking-tight flex items-center gap-1.5 ml-1">
                                RedStabros <Heart size={14} className="fill-brand-secondary text-brand-secondary animate-pulse" />
                            </span>
                        </p>
                        <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-brand-secondary/30 to-transparent"></div>
                    </div>

                    {/* Legal Links */}
                    <div className="flex items-center gap-6">
                        <Link
                            to="/legal/terms"
                            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-primary transition-colors border-b border-transparent hover:border-brand-primary pb-0.5"
                        >
                            {t('auth.termsAndConditions', 'Términos y Condiciones')}
                        </Link>
                        <div className="w-1 h-1 bg-divider-theme rounded-full"></div>
                        <Link
                            to="/legal/privacy"
                            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-primary transition-colors border-b border-transparent hover:border-brand-primary pb-0.5"
                        >
                            {t('auth.privacyPolicy', 'Política de Privacidad')}
                        </Link>
                    </div>
                </div>

                {/* Bottom decorative line */}
                <div className="mt-12 text-center">
                    <div className="inline-block px-4 py-1 rounded-full bg-bg-sub/50 border border-divider-theme">
                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.3em] opacity-40">
                            Explora • Juega • Conecta
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
