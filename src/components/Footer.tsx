import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Building2, Layers, HeartHandshake, Phone } from 'lucide-react';

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

                    {/* Corporate Highlight Box */}
                    <div className="w-full max-w-xl p-5 rounded-3xl bg-bg-sub/80 border border-border-theme hover:border-brand-primary/40 transition-all shadow-xs">
                        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                            {/* Logo más grande y empresarial */}
                            <Link to="/corporacion" className="group shrink-0 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-2xl bg-bg-side border border-border-theme p-3 flex items-center justify-center shadow-xs group-hover:border-brand-primary/50 group-hover:scale-105 transition-all">
                                    <img 
                                        src="/assets/logo_ciudad_friki.png" 
                                        alt="Corporación Ciudad Friki" 
                                        className="w-full h-full object-contain drop-shadow-sm"
                                    />
                                </div>
                            </Link>

                            {/* Contenido y enlaces directos a la sección corporativa */}
                            <div className="flex-1 w-full text-center sm:text-left space-y-3">
                                <div>
                                    <Link 
                                        to="/corporacion"
                                        className="text-sm font-black text-text-main hover:text-brand-primary uppercase tracking-tight transition-colors inline-block"
                                    >
                                        {t('corporation.title', 'Corporación Ciudad Friki')}
                                    </Link>
                                    <p className="text-[11px] text-text-muted font-medium">
                                        {t('corporation.footer.subtitle', 'Gestión cultural, economías creativas y proyectos')}
                                    </p>
                                </div>

                                {/* Grilla de enlaces directos a las áreas */}
                                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                                    <Link
                                        to="/corporacion?tab=portfolio"
                                        className="flex items-center gap-1.5 p-2 rounded-xl bg-bg-side/70 hover:bg-bg-side border border-border-theme/70 hover:border-brand-primary/40 text-text-sub hover:text-brand-primary transition-all group"
                                    >
                                        <Layers size={14} className="text-brand-primary shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="truncate">{t('corporation.footer.portfolio', 'Portafolio (10)')}</span>
                                    </Link>

                                    <Link
                                        to="/corporacion?tab=alliances"
                                        className="flex items-center gap-1.5 p-2 rounded-xl bg-bg-side/70 hover:bg-bg-side border border-border-theme/70 hover:border-brand-primary/40 text-text-sub hover:text-brand-secondary transition-all group"
                                    >
                                        <HeartHandshake size={14} className="text-brand-secondary shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="truncate">{t('corporation.footer.alliances', 'Alianzas')}</span>
                                    </Link>

                                    <Link
                                        to="/corporacion?tab=identity"
                                        className="flex items-center gap-1.5 p-2 rounded-xl bg-bg-side/70 hover:bg-bg-side border border-border-theme/70 hover:border-brand-primary/40 text-text-sub hover:text-brand-primary transition-all group"
                                    >
                                        <Building2 size={14} className="text-brand-primary shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="truncate">{t('corporation.footer.identity', 'Misión & Visión')}</span>
                                    </Link>

                                    <Link
                                        to="/corporacion?tab=contact"
                                        className="flex items-center gap-1.5 p-2 rounded-xl bg-bg-side/70 hover:bg-bg-side border border-border-theme/70 hover:border-brand-primary/40 text-text-sub hover:text-green-500 transition-all group"
                                    >
                                        <Phone size={14} className="text-green-500 shrink-0 group-hover:scale-110 transition-transform" />
                                        <span className="truncate">{t('corporation.footer.contact', 'Cotizaciones')}</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-divider-theme to-transparent" />

                    {/* Institutional & Legal links */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
                        <Link
                            to="/corporacion"
                            className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline transition-colors"
                        >
                            {t('corporation.footer.navLinkFull', 'Corporación & Portafolio')}
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-divider-theme" />
                        <Link
                            to="/about"
                            className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-primary transition-colors"
                        >
                            {t('nav.about', 'Acerca de')}
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-divider-theme" />
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
                    <div className="flex items-center gap-2 flex-wrap justify-center text-[10px] font-bold text-text-muted opacity-60">
                        <div className="flex items-center gap-1.5">
                            <Heart size={10} className="fill-brand-secondary text-brand-secondary animate-pulse flex-shrink-0" />
                            <span>{t('settings.madeWith')}</span>
                            <a 
                                href="https://github.com/RedStabros" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-brand-secondary font-black hover:underline"
                            >
                                RedStabros
                            </a>
                        </div>
                        <span className="opacity-40">&bull;</span>
                        <p className="uppercase tracking-[0.18em]">
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
