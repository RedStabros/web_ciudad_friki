import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/SEO';
import {
    CORPORATION_INFO,
    SERVICE_LINES,
    ALLIANCE_MODELS
} from '../data/corporationData';
import {
    Building2,
    Palette,
    Briefcase,
    Sparkles,
    Camera,
    Smartphone,
    Dices,
    BookOpen,
    MapPin,
    Layers,
    Store,
    HeartHandshake,
    Trophy,
    Mail,
    Phone,
    ShieldCheck,
    CheckCircle2,
    Search,
    X,
    ChevronRight,
    Users,
    Clock,
    Flame,
    Quote,
    type LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    Palette,
    Briefcase,
    Sparkles,
    Camera,
    Smartphone,
    Dices,
    BookOpen,
    MapPin,
    Layers,
    Store,
    HeartHandshake,
    Trophy
};

type TabType = 'portfolio' | 'identity' | 'alliances' | 'trajectory' | 'contact';

export default function Corporation() {
    const { t, i18n } = useTranslation();
    const isEn = i18n.language === 'en';
    const [searchParams, setSearchParams] = useSearchParams();

    const validTabs: TabType[] = useMemo(() => ['portfolio', 'identity', 'alliances', 'trajectory', 'contact'], []);
    const tabParam = searchParams.get('tab') as TabType;
    const initialTab = validTabs.includes(tabParam) ? tabParam : 'portfolio';

    const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    useEffect(() => {
        const current = searchParams.get('tab') as TabType;
        if (current && validTabs.includes(current) && current !== activeTab) {
            setActiveTab(current);
        }
    }, [searchParams, validTabs, activeTab]);

    const handleSelectTab = (tab: TabType) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Quote Modal State
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const getDefaultService = () => isEn && SERVICE_LINES[0].title_en ? SERVICE_LINES[0].title_en : SERVICE_LINES[0].title;
    const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<string>(getDefaultService());
    const [selectedEntityType, setSelectedEntityType] = useState<string>('Empresa Privada / Comercial');
    const [quoteNotes, setQuoteNotes] = useState('');

    // Fix #1: Reset selected service when language changes
    useEffect(() => {
        setSelectedServiceForQuote(getDefaultService());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEn]);

    // Fix #2: Print portfolio as PDF
    const handlePrintPortfolio = () => {
        window.print();
    };

    const filteredServices = useMemo(() => {
        return SERVICE_LINES.filter((service) => {
            const matchesCategory = selectedCategory === 'all' || service.id === selectedCategory;
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                !searchQuery ||
                service.title.toLowerCase().includes(searchLower) ||
                service.description.toLowerCase().includes(searchLower) ||
                service.activities.some((act) =>
                    act.name.toLowerCase().includes(searchLower) ||
                    act.description.toLowerCase().includes(searchLower)
                );
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery]);

    const handleOpenQuoteModal = (serviceTitle?: string) => {
        if (serviceTitle) setSelectedServiceForQuote(serviceTitle);
        setIsQuoteModalOpen(true);
    };

    const generateWhatsAppLink = () => {
        const message = isEn
            ? `Hello Corporación Ciudad Friki! 👋\n` +
              `I am reaching out from the official institutional website to request a customized quote.\n\n` +
              `📌 *Service of Interest:* ${selectedServiceForQuote}\n` +
              `🏢 *Organization Type:* ${selectedEntityType}\n` +
              (quoteNotes.trim() ? `📝 *Details:* ${quoteNotes.trim()}\n\n` : `\n`) +
              `I look forward to your response to coordinate the proposal. Thank you!`
            : `¡Hola Corporación Ciudad Friki! 👋\n` +
              `Me comunico desde la plataforma web institucional para solicitar una cotización.\n\n` +
              `📌 *Servicio de Interés:* ${selectedServiceForQuote}\n` +
              `🏢 *Tipo de Entidad:* ${selectedEntityType}\n` +
              (quoteNotes.trim() ? `📝 *Detalles:* ${quoteNotes.trim()}\n\n` : `\n`) +
              `Quedo atento a su respuesta para coordinar la propuesta. ¡Muchas gracias!`;

        return `https://wa.me/${CORPORATION_INFO.whatsappRaw}?text=${encodeURIComponent(message)}`;
    };

    const generateEmailLink = () => {
        const subject = isEn
            ? `Quote Request: ${selectedServiceForQuote} [${selectedEntityType}]`
            : `Solicitud de Cotización: ${selectedServiceForQuote} [${selectedEntityType}]`;
        const body = isEn
            ? `Dear Ciudad Friki Corporation Team,\n\n` +
              `We are reaching out through the website to request a customized technical and economic proposal.\n\n` +
              `- Service of Interest: ${selectedServiceForQuote}\n` +
              `- Organization Type: ${selectedEntityType}\n` +
              `- Requirements or notes: ${quoteNotes.trim() || 'To be defined'}\n\n` +
              `Thank you for your attention. We look forward to hearing from you.\n\nSincerely,\n`
            : `Estimado equipo de la Corporación Ciudad Friki,\n\n` +
              `Nos ponemos en contacto a través del sitio web para solicitar una propuesta técnica y económica.\n\n` +
              `- Servicio de Interés: ${selectedServiceForQuote}\n` +
              `- Tipo de Entidad: ${selectedEntityType}\n` +
              `- Requerimientos o notas: ${quoteNotes.trim() || 'Por definir'}\n\n` +
              `Agradecemos su atención y quedamos atentos a su respuesta.\n\nAtentamente,\n`;

        return `mailto:${CORPORATION_INFO.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="min-h-screen bg-bg-main text-text-main pb-20">
            <SEO
                title={t('seo.corporacion.title', 'Corporación Ciudad Friki | Organización Cultural & Portafolio Institucional')}
                description={t('seo.corporacion.description', 'Conoce la Corporación Ciudad Friki (ESAL NIT 901.597.939-0): Más de 15 años impulsando la cultura alternativa, economías creativas y formación en Medellín.')}
            />

            {/* ── HERO INSTITUCIONAL ── */}
            <section className="relative overflow-hidden border-b border-border-theme bg-bg-side/50 py-14 px-4 sm:px-6 lg:px-8">
                {/* Glow ambient background */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        
                        {/* Logo oficial */}
                        <div className="relative group shrink-0">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-bg-sub border border-border-theme p-4 shadow-xl flex items-center justify-center relative overflow-hidden group-hover:border-brand-primary transition-all">
                                <img
                                    src={CORPORATION_INFO.logoUrl}
                                    alt="Corporación Ciudad Friki Logo"
                                    className="w-full h-full object-contain filter drop-shadow-md"
                                />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-brand-primary text-text-inv p-1.5 rounded-full shadow-md">
                                <ShieldCheck size={18} />
                            </div>
                        </div>

                        {/* Textos institucionales */}
                        <div className="flex-1 space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider">
                                <Building2 size={14} />
                                <span>{t('corporation.badge', 'Entidad Sin Ánimo de Lucro (ESAL) · NIT 901.597.939-0')}</span>
                            </div>

                            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-text-main italic leading-tight">
                                {CORPORATION_INFO.legalName}
                            </h1>

                            <p className="text-base sm:text-lg text-text-sub font-medium max-w-3xl leading-relaxed">
                                {t(
                                    'corporation.subtitle',
                                    'Entidad sombrilla y coordinadora jurídica de la Red Cultural Juvenil Comunidad Underground. Más de 15 años fortaleciendo las economías creativas, la asociatividad juvenil y las culturas alternativas en Medellín.'
                                )}
                            </p>

                            {/* Cita de Bernard Shaw */}
                            <div className="pt-2 flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm text-text-muted italic">
                                <Quote size={16} className="text-brand-secondary shrink-0" />
                                <span>“{isEn ? CORPORATION_INFO.quote.text_en : CORPORATION_INFO.quote.text}”</span>
                                <span className="font-bold text-text-main not-italic">— {CORPORATION_INFO.quote.author}</span>
                            </div>

                            {/* Botones de acción rápida */}
                            <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <button
                                    onClick={() => {
                                        setActiveTab('portfolio');
                                        const el = document.getElementById('tabs-section');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-5 py-2.5 rounded-xl bg-brand-primary text-text-inv font-bold text-sm hover:brightness-110 shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <Sparkles size={16} />
                                    <span>{t('corporation.hero.viewPortfolio', 'Ver Portafolio de Servicios (10 Líneas)')}</span>
                                </button>

                                <a
                                    href={`https://wa.me/${CORPORATION_INFO.whatsappRaw}?text=${encodeURIComponent(
                                        isEn
                                            ? 'Hello Ciudad Friki Corporation, I would like information regarding your services and partnerships.'
                                            : 'Hola Corporación Ciudad Friki, deseo información sobre sus servicios y alianzas.'
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-main font-bold text-sm hover:border-brand-secondary hover:text-brand-secondary transition-all flex items-center gap-2"
                                >
                                    <Phone size={16} className="text-emerald-500" />
                                    <span>{t('corporation.hero.whatsappDirect', `WhatsApp Directo: ${CORPORATION_INFO.whatsapp}`)}</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Métricas Institucionales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-10 pt-8 border-t border-border-theme">
                        <div className="bg-bg-sub/60 p-4 rounded-2xl border border-border-theme text-center">
                            <div className="text-2xl sm:text-3xl font-black text-brand-primary">{t('corporation.metrics.years', '15+ Años')}</div>
                            <div className="text-xs text-text-muted mt-1 font-medium">{t('corporation.metrics.yearsLabel', 'De proceso sociocultural (desde 2011)')}</div>
                        </div>
                        <div className="bg-bg-sub/60 p-4 rounded-2xl border border-border-theme text-center">
                            <div className="text-2xl sm:text-3xl font-black text-brand-secondary">{t('corporation.metrics.lines', '10 Líneas')}</div>
                            <div className="text-xs text-text-muted mt-1 font-medium">{t('corporation.metrics.linesLabel', 'De servicios y productos creativos')}</div>
                        </div>
                        <div className="bg-bg-sub/60 p-4 rounded-2xl border border-border-theme text-center">
                            <div className="text-2xl sm:text-3xl font-black text-brand-primary">{t('corporation.metrics.editions', '20 Ediciones')}</div>
                            <div className="text-xs text-text-muted mt-1 font-medium">{t('corporation.metrics.editionsLabel', 'Del festival masivo Fiesta Friki')}</div>
                        </div>
                        <div className="bg-bg-sub/60 p-4 rounded-2xl border border-border-theme text-center">
                            <div className="text-2xl sm:text-3xl font-black text-brand-secondary">{t('corporation.metrics.territory', 'Comuna 4')}</div>
                            <div className="text-xs text-text-muted mt-1 font-medium">{t('corporation.metrics.territoryLabel', 'Aranjuez, Medellín (Proyección nacional)')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── NAVEGACIÓN POR PESTAÑAS ── */}
            <div id="tabs-section" className="sticky top-16 z-30 bg-bg-main/90 backdrop-blur-md border-b border-border-theme shadow-sm">
                <div className="max-w-6xl mx-auto px-4 overflow-x-auto hide-scrollbar flex items-center justify-start md:justify-center gap-2 py-3">
                    <button
                        onClick={() => handleSelectTab('portfolio')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'portfolio'
                                ? 'bg-brand-primary text-text-inv shadow-md shadow-brand-primary/20'
                                : 'bg-bg-side text-text-sub hover:bg-bg-sub border border-border-theme'
                        }`}
                    >
                        <Layers size={16} />
                        <span>{t('corporation.tabs.portfolio', 'Portafolio de Servicios (10)')}</span>
                    </button>

                    <button
                        onClick={() => handleSelectTab('identity')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'identity'
                                ? 'bg-brand-primary text-text-inv shadow-md shadow-brand-primary/20'
                                : 'bg-bg-side text-text-sub hover:bg-bg-sub border border-border-theme'
                        }`}
                    >
                        <Building2 size={16} />
                        <span>{t('corporation.tabs.identity', 'Identidad & Misión')}</span>
                    </button>

                    <button
                        onClick={() => handleSelectTab('alliances')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'alliances'
                                ? 'bg-brand-primary text-text-inv shadow-md shadow-brand-primary/20'
                                : 'bg-bg-side text-text-sub hover:bg-bg-sub border border-border-theme'
                        }`}
                    >
                        <HeartHandshake size={16} />
                        <span>{t('corporation.tabs.alliances', 'Modelos de Alianza')}</span>
                    </button>

                    <button
                        onClick={() => handleSelectTab('trajectory')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'trajectory'
                                ? 'bg-brand-primary text-text-inv shadow-md shadow-brand-primary/20'
                                : 'bg-bg-side text-text-sub hover:bg-bg-sub border border-border-theme'
                        }`}
                    >
                        <CheckCircle2 size={16} />
                        <span>{t('corporation.tabs.trajectory', 'Trayectoria & Red')}</span>
                    </button>

                    <button
                        onClick={() => handleSelectTab('contact')}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                            activeTab === 'contact'
                                ? 'bg-brand-primary text-text-inv shadow-md shadow-brand-primary/20'
                                : 'bg-bg-side text-text-sub hover:bg-bg-sub border border-border-theme'
                        }`}
                    >
                        <Phone size={16} />
                        <span>{t('corporation.tabs.contact', 'Contacto & Cotizaciones')}</span>
                    </button>
                </div>
            </div>

            {/* ── CONTENIDO PRINCIPAL POR PESTAÑAS ── */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">

                {/* ── TAB 1: PORTAFOLIO DE SERVICIOS (10 LÍNEAS) ── */}
                {activeTab === 'portfolio' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Header de sección */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black uppercase text-text-main italic tracking-tight">
                                    {t('corporation.portfolio.title', 'Portafolio Institucional de Servicios')}
                                </h2>
                                <p className="text-text-sub text-sm mt-1 max-w-2xl">
                                    {t('corporation.portfolio.subtitle', 'Soluciones culturales, artísticas, formativas, recreativas y digitales diseñadas a la medida para empresas, cajas de compensación, entidades públicas y organizaciones sociales.')}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 self-start md:self-auto">
                                {/* Fix #2: Download Portfolio PDF */}
                                <button
                                    onClick={handlePrintPortfolio}
                                    className="px-4 py-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-sub font-bold text-xs uppercase tracking-wider hover:border-brand-secondary hover:text-brand-secondary transition-all flex items-center gap-2 cursor-pointer print:hidden"
                                    title={t('corporation.portfolio.downloadTitle', 'Exportar portafolio como PDF')}
                                >
                                    <BookOpen size={15} />
                                    <span>{t('corporation.portfolio.downloadBtn', 'Descargar PDF')}</span>
                                </button>
                                <button
                                    onClick={() => handleOpenQuoteModal()}
                                    className="px-5 py-2.5 rounded-xl bg-brand-primary text-text-inv font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md shadow-brand-primary/20 transition-all flex items-center gap-2 cursor-pointer print:hidden"
                                >
                                    <Sparkles size={15} />
                                    <span>{t('corporation.portfolio.requestQuoteBtn', 'Solicitar Cotización a la Medida')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Aviso institucional sobre cotizaciones sin precios fijos */}
                        <div className="bg-bg-side border border-brand-secondary/30 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-sm">
                            <div className="p-2.5 rounded-xl bg-brand-secondary/10 text-brand-secondary shrink-0 mt-0.5">
                                <ShieldCheck size={22} />
                            </div>
                            <div className="text-xs sm:text-sm text-text-sub space-y-1">
                                <span className="font-bold text-text-main block">
                                    {t('corporation.portfolio.noticeTitle', 'Política de Cotizaciones Personalizadas por Tipo de Entidad:')}
                                </span>
                                <p>
                                    {t('corporation.portfolio.customQuoteNotice', 'Nuestros servicios se presentan sin tarifas públicas fijas porque cada valor se calcula de forma justa y técnica según la temporalidad, aforo, materiales e insumos, transporte y el tipo de contratante (Entidad Pública, Empresa Privada u Organización Social / Colectivo).')}
                                </p>
                            </div>
                        </div>

                        {/* Buscador y filtro rápido */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <div className="relative w-full sm:flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('corporation.portfolio.searchPlaceholder', 'Buscar taller o servicio (ej. manga, soft combat, cosplay, eventos, rol)...')}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-side border border-border-theme text-text-main placeholder-text-muted text-sm focus:outline-none focus:border-brand-primary transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-bg-side border border-border-theme text-text-main text-sm focus:outline-none focus:border-brand-primary"
                            >
                                <option value="all">{t('corporation.portfolio.filterAll', 'Todas las 10 líneas')}</option>
                                {SERVICE_LINES.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.number}. {isEn && l.title_en ? l.title_en : l.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Listado de Líneas de Servicio */}
                        <div className="space-y-6">
                            {filteredServices.map((service) => {
                                const IconComponent = ICON_MAP[service.icon] || Layers;
                                const serviceTitle = isEn && service.title_en ? service.title_en : service.title;
                                const serviceDescription = isEn && service.description_en ? service.description_en : service.description;
                                const serviceDuration = isEn && service.duration_en ? service.duration_en : service.duration;
                                const serviceCapacity = isEn && service.capacity_en ? service.capacity_en : service.capacity;
                                const serviceFormats = (isEn && service.formats_en ? service.formats_en : service.formats).join(', ');
                                const serviceDeliverables = isEn && service.deliverables_en ? service.deliverables_en : service.deliverables;

                                return (
                                    <article
                                        key={service.id}
                                        className="bg-bg-side rounded-3xl border border-border-theme overflow-hidden shadow-sm hover:border-brand-primary/50 transition-all p-6 sm:p-8 space-y-6"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black text-xl shrink-0">
                                                    <IconComponent size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black uppercase text-brand-primary tracking-widest">
                                                        {t('corporation.portfolio.strategicLine', 'Línea Estratégica')} {service.number}
                                                    </div>
                                                    <h3 className="text-xl sm:text-2xl font-black text-text-main uppercase tracking-tight">
                                                        {serviceTitle}
                                                    </h3>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleOpenQuoteModal(serviceTitle)}
                                                className="px-4 py-2 rounded-xl bg-bg-sub border border-border-theme text-text-main text-xs font-bold uppercase tracking-wider hover:bg-brand-primary hover:text-text-inv hover:border-brand-primary transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                                            >
                                                <span>{t('corporation.portfolio.quoteThisLine', 'Cotizar Esta Línea')}</span>
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>

                                        <p className="text-text-sub text-sm sm:text-base leading-relaxed">
                                            {serviceDescription}
                                        </p>

                                        {/* Ficha técnica resumida */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-bg-sub/60 p-4 rounded-2xl border border-border-theme text-xs">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-brand-secondary shrink-0" />
                                                <div>
                                                    <span className="font-bold text-text-main block">{t('corporation.portfolio.duration', 'Duración:')}</span>
                                                    <span className="text-text-muted">{serviceDuration}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-brand-secondary shrink-0" />
                                                <div>
                                                    <span className="font-bold text-text-main block">{t('corporation.portfolio.capacity', 'Aforo estimado:')}</span>
                                                    <span className="text-text-muted">{serviceCapacity}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Flame size={16} className="text-brand-secondary shrink-0" />
                                                <div>
                                                    <span className="font-bold text-text-main block">{t('corporation.portfolio.formats', 'Formatos:')}</span>
                                                    <span className="text-text-muted">{serviceFormats}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Catálogo de Actividades o Módulos */}
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-text-muted tracking-widest mb-3">
                                                {t('corporation.portfolio.activitiesTitle', 'Actividades y Talleres Disponibles en esta Línea:')}
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                {service.activities.map((act, i) => (
                                                    <div
                                                        key={i}
                                                        className="p-3 rounded-xl bg-bg-main/60 border border-border-theme/70 hover:border-border-theme transition-all"
                                                    >
                                                        <div className="font-bold text-xs text-text-main flex items-center gap-1.5">
                                                            <CheckCircle2 size={13} className="text-brand-primary shrink-0" />
                                                            <span>{isEn && act.name_en ? act.name_en : act.name}</span>
                                                        </div>
                                                        <p className="text-[11px] text-text-muted mt-1 leading-normal line-clamp-2">
                                                            {isEn && act.description_en ? act.description_en : act.description}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Entregables */}
                                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-theme/60 text-xs">
                                            <span className="font-bold text-text-muted">{t('corporation.portfolio.included', 'Incluye:')}</span>
                                            {serviceDeliverables.map((del, dIdx) => (
                                                <span
                                                    key={dIdx}
                                                    className="px-2.5 py-1 rounded-md bg-bg-sub border border-border-theme text-text-sub text-[11px]"
                                                >
                                                    ✓ {del}
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {/* Fix #4: CTA global al final del portafolio */}
                        <div className="relative overflow-hidden rounded-3xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-bg-side to-brand-secondary/10 p-8 sm:p-10 text-center space-y-5 print:hidden">
                            {/* Ambient glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-brand-primary/15 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10 space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-wider">
                                    <Sparkles size={13} />
                                    <span>{t('corporation.portfolio.ctaBadge', '¿Todo revisado? El siguiente paso es tuyo')}</span>
                                </div>

                                <h3 className="text-2xl sm:text-3xl font-black uppercase text-text-main italic tracking-tight">
                                    {t('corporation.portfolio.ctaTitle', '¿Listo para estructurar una propuesta?')}
                                </h3>

                                <p className="text-text-sub text-sm max-w-xl mx-auto leading-relaxed">
                                    {t('corporation.portfolio.ctaDesc', 'Cuéntanos tu proyecto, tipo de entidad y fecha estimada. En menos de 48 horas te enviamos una propuesta técnica y económica a la medida.')}
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <button
                                        onClick={() => handleOpenQuoteModal()}
                                        className="px-6 py-3 rounded-xl bg-brand-primary text-text-inv font-black text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-brand-primary/25 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles size={16} />
                                        <span>{t('corporation.portfolio.ctaQuoteBtn', 'Solicitar Cotización Ahora')}</span>
                                    </button>

                                    <button
                                        onClick={() => handleSelectTab('contact')}
                                        className="px-6 py-3 rounded-xl bg-bg-sub border border-border-theme text-text-main font-bold text-sm hover:border-brand-primary hover:text-brand-primary transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <Phone size={16} />
                                        <span>{t('corporation.portfolio.ctaContactBtn', 'Ir a Contacto Directo')}</span>
                                    </button>
                                </div>

                                <p className="text-xs text-text-muted">
                                    {t('corporation.portfolio.ctaReassurance', 'Sin compromiso · Propuesta técnica sin costo · Respuesta en 48h')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 2: IDENTIDAD, MISIÓN & VISIÓN ── */}
                {activeTab === 'identity' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Tarjeta de Origen y Relación con la Red */}
                        <section className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 space-y-4">
                            <div className="flex items-center gap-3 text-brand-primary">
                                <Building2 size={28} />
                                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-text-main">
                                    {t('corporation.identity.legalTitle', 'Entidad Sombrilla y Coordinadora Jurídica')}
                                </h3>
                            </div>

                            <p className="text-text-sub leading-relaxed text-sm sm:text-base">
                                {t('corporation.identity.legalP1', 'La Red Cultural Juvenil Comunidad Underground nació en 2011 en la Comuna 4 Aranjuez como un proceso juvenil y barrial para congregar a los amantes del anime, el cosplay, los videojuegos, el rol y las culturas alternativas. A lo largo de más de 15 años y 20 ediciones del festival Fiesta Friki, consolidó un tejido de más de 100 colectivos, ilustradores, artesanos y artistas escénicos.')}
                            </p>

                            <p className="text-text-sub leading-relaxed text-sm sm:text-base">
                                {t('corporation.identity.legalP2', 'Para sustentar y reglamentar legalmente esta labor ante el Estado y la sociedad, se constituyó la CORPORACIÓN CIUDAD FRIKI (NIT 901.597.939-0) como entidad sin ánimo de lucro (ESAL). La Corporación actúa como la entidad sombrilla y coordinadora jurídica, permitiendo contratar, administrar recursos, licitar, gestionar proyectos y garantizar la dignificación del trabajo cultural de los artistas y gestores.')}
                            </p>

                            <div className="p-4 rounded-2xl bg-bg-sub/70 border border-border-theme text-xs sm:text-sm text-text-muted">
                                <strong>{t('corporation.identity.legalFrameworkLabel', 'Marco Legal:')}</strong> {t('corporation.identity.legalFrameworkText', 'Persona jurídica de derecho privado regulada por los artículos 633 a 652 del Código Civil Colombiano, decretos 1529 de 1990, 2150 de 1995 y 427 de 1996. Domicilio principal en la Carrera 49B # 92 - 74, Barrio Aranjuez (Comuna 4), Medellín, Colombia.')}
                            </div>
                        </section>

                        {/* Misión y Visión */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                                    <Sparkles size={24} />
                                </div>
                                <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{t('corporation.identity.missionTitle', 'Misión')}</h3>
                                <p className="text-text-sub text-sm leading-relaxed">
                                    {isEn ? CORPORATION_INFO.mission_en : CORPORATION_INFO.mission}
                                </p>
                            </div>

                            <div className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center font-bold">
                                    <Flame size={24} />
                                </div>
                                <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{t('corporation.identity.visionTitle', 'Visión')}</h3>
                                <p className="text-text-sub text-sm leading-relaxed">
                                    {isEn ? CORPORATION_INFO.vision_en : CORPORATION_INFO.vision}
                                </p>
                            </div>
                        </div>

                        {/* Principios Rectores */}
                        <div className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 space-y-6">
                            <h3 className="text-xl font-black text-text-main uppercase tracking-tight">
                                {t('corporation.identity.principlesTitle', 'Principios Rectores y Valores')}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(isEn ? CORPORATION_INFO.principles_en : CORPORATION_INFO.principles).map((pr, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-bg-sub/50 border border-border-theme space-y-1.5">
                                        <div className="font-bold text-text-main text-sm flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-brand-primary shrink-0" />
                                            <span>{pr.title}</span>
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed pl-6">
                                            {pr.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 3: MODELOS DE ALIANZA (SEGÚN PITCHES) ── */}
                {activeTab === 'alliances' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black uppercase text-text-main italic tracking-tight">
                                {t('corporation.alliances.title', 'Alianzas Estratégicas con Propósito')}
                            </h2>
                            <p className="text-text-sub text-sm mt-1 max-w-2xl">
                                {t('corporation.alliances.subtitle', 'Buscamos relaciones transparentes donde los recursos, servicios y conocimientos produzcan un valor social y cultural duradero.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {ALLIANCE_MODELS.map((model) => {
                                const IconComp = ICON_MAP[model.icon] || HeartHandshake;
                                return (
                                    <div
                                        key={model.id}
                                        className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:border-brand-primary transition-all space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                                    <IconComp size={24} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-bg-sub border border-border-theme text-brand-secondary">
                                                    {isEn && model.badge_en ? model.badge_en : model.badge}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-black text-text-main uppercase tracking-tight">
                                                    {isEn && model.targetTitle_en ? model.targetTitle_en : model.targetTitle}
                                                </h3>
                                                <p className="text-xs text-brand-primary font-bold mt-0.5">
                                                    {isEn && model.subtitle_en ? model.subtitle_en : model.subtitle}
                                                </p>
                                            </div>

                                            <p className="text-xs text-text-sub leading-relaxed">
                                                {isEn && model.description_en ? model.description_en : model.description}
                                            </p>

                                            <div className="space-y-2 pt-2 border-t border-border-theme/70">
                                                <span className="text-[11px] font-bold text-text-main uppercase tracking-wider block">
                                                    {t('corporation.alliances.modalitiesLabel', 'Modalidades de Colaboración:')}
                                                </span>
                                                <ul className="text-xs text-text-muted space-y-1.5 list-disc pl-4">
                                                    {(isEn && model.modalities_en ? model.modalities_en : model.modalities).map((m, i) => (
                                                        <li key={i}>{m}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="space-y-2 pt-2 border-t border-border-theme/70">
                                                <span className="text-[11px] font-bold text-text-main uppercase tracking-wider block">
                                                    {t('corporation.alliances.benefitsLabel', 'Beneficios para el Aliado:')}
                                                </span>
                                                <ul className="text-xs text-text-muted space-y-1.5 list-disc pl-4">
                                                    {(isEn && model.benefits_en ? model.benefits_en : model.benefits).map((b, i) => (
                                                        <li key={i}>{b}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleOpenQuoteModal(isEn && model.targetTitle_en ? model.targetTitle_en : model.targetTitle)}
                                            className="w-full py-3 rounded-xl bg-brand-primary text-text-inv font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <span>{isEn && model.callToAction_en ? model.callToAction_en : model.callToAction}</span>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── TAB 4: TRAYECTORIA & RED ── */}
                {activeTab === 'trajectory' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black uppercase text-text-main italic tracking-tight">
                                {t('corporation.trajectory.title', 'Trayectoria y Validación Institucional')}
                            </h2>
                            <p className="text-text-sub text-sm mt-1 max-w-2xl">
                                {t('corporation.trajectory.subtitle', 'Con más de 15 años de recorrido, nuestro proceso ha colaborado y articulado actividades con las principales entidades culturales, de juventud y desarrollo de Medellín y Antioquia.')}
                            </p>
                        </div>

                        {/* Cuadrícula de Entidades Aliadas */}
                        <div className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">
                                {t('corporation.trajectory.entitiesTitle', 'Entidades y Espacios con los que hemos articulado proyectos:')}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {CORPORATION_INFO.institutionalAllies.map((ally, i) => (
                                    <div
                                        key={i}
                                        className="p-3.5 rounded-2xl bg-bg-sub/60 border border-border-theme flex items-center gap-3 text-xs sm:text-sm font-semibold text-text-main hover:border-brand-primary transition-all"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                                        <span>{ally}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Evento Insignia Fiesta Friki */}
                        <div className="bg-gradient-to-br from-bg-side via-bg-side to-bg-sub rounded-3xl border border-brand-primary/30 p-6 sm:p-8 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider">
                                <Trophy size={14} />
                                <span>{t('corporation.trajectory.flagshipBadge', 'Proyecto Insignia')}</span>
                            </div>

                            <h3 className="text-2xl sm:text-3xl font-black text-text-main uppercase tracking-tight italic">
                                {t('corporation.trajectory.flagshipTitle', 'Fiesta Friki: Hacia la Edición XX')}
                            </h3>

                            <p className="text-text-sub text-sm sm:text-base leading-relaxed max-w-3xl">
                                {t('corporation.trajectory.flagshipDesc', 'Fiesta Friki es el mayor punto de encuentro y visibilización de las expresiones alternativas y juveniles de la región. En 2026 proyecta su vigésima edición (Fiesta Friki XX: Princes@s), consolidándose como una plataforma que articula programación artística, torneos de videojuegos, soft combat, cosplay, ferias comerciales de ilustradores y experiencias comunitarias para miles de asistentes.')}
                            </p>

                            <div className="pt-2">
                                <button
                                    onClick={() => handleOpenQuoteModal('Fiesta Friki - Padrinazgo o Copropiedad')}
                                    className="px-5 py-2.5 rounded-xl bg-brand-primary text-text-inv font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md shadow-brand-primary/20 transition-all cursor-pointer"
                                >
                                    {t('corporation.trajectory.flagshipBtn', 'Conocer Oportunidades de Vinculación a Fiesta Friki')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── TAB 5: CONTACTO & COTIZACIONES ── */}
                {activeTab === 'contact' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black uppercase text-text-main italic tracking-tight">
                                {t('corporation.contact.title', 'Contacto Institucional & Solicitud de Propuestas')}
                            </h2>
                            <p className="text-text-sub text-sm mt-1 max-w-2xl">
                                {t('corporation.contact.subtitle', 'Comunícate directamente con la Dirección General de la Corporación para agendar una reunión, solicitar cotizaciones o estructurar convenios de cooperación.')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Canales Oficiales Directos */}
                            <div className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 space-y-6">
                                <h3 className="text-lg font-black text-text-main uppercase tracking-tight">
                                    {t('corporation.contact.channelsTitle', 'Canales de Atención Directa')}
                                </h3>

                                <div className="space-y-4">
                                    {/* WhatsApp */}
                                    <a
                                        href={`https://wa.me/${CORPORATION_INFO.whatsappRaw}?text=${encodeURIComponent(
                                            isEn
                                                ? 'Hello, I am reaching out from the official Ciudad Friki website.'
                                                : 'Hola, me comunico desde la web oficial de Ciudad Friki.'
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 rounded-2xl bg-bg-sub border border-border-theme hover:border-emerald-500/50 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Phone size={22} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('corporation.contact.whatsappLabel', 'WhatsApp Oficial:')}</div>
                                            <div className="text-base font-black text-text-main group-hover:text-emerald-500 transition-colors">
                                                {CORPORATION_INFO.whatsapp}
                                            </div>
                                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                                {t('corporation.contact.whatsappSub', 'Respuesta ágil · Chat directo')}
                                            </div>
                                        </div>
                                    </a>

                                    {/* Correo Electrónico */}
                                    <a
                                        href={`mailto:${CORPORATION_INFO.email}?subject=${encodeURIComponent(
                                            isEn
                                                ? 'Institutional Inquiry - Ciudad Friki Corporation'
                                                : 'Contacto Institucional Corporacion Ciudad Friki'
                                        )}`}
                                        className="p-4 rounded-2xl bg-bg-sub border border-border-theme hover:border-brand-primary/50 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Mail size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('corporation.contact.emailLabel', 'Correo Institucional:')}</div>
                                            <div className="text-sm sm:text-base font-black text-text-main truncate group-hover:text-brand-primary transition-colors">
                                                {CORPORATION_INFO.email}
                                            </div>
                                            <div className="text-[11px] text-text-muted font-medium mt-0.5">
                                                {t('corporation.contact.emailSub', 'Recepción formal de propuestas')}
                                            </div>
                                        </div>
                                    </a>

                                    {/* Sede Física */}
                                    <div className="p-4 rounded-2xl bg-bg-sub border border-border-theme flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center shrink-0">
                                            <MapPin size={22} />
                                        </div>
                                        <div>
                                            <div className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('corporation.contact.locationLabel', 'Sede Operativa:')}</div>
                                            <div className="text-sm font-black text-text-main">
                                                {CORPORATION_INFO.neighborhood}
                                            </div>
                                            <div className="text-[11px] text-text-muted font-medium mt-0.5">
                                                {t('corporation.contact.locationCity', 'Medellín, Antioquia, Colombia')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-bg-sub/60 border border-border-theme text-xs text-text-muted leading-relaxed">
                                    <strong>{t('corporation.contact.docsNoteTitle', 'Documentación disponible bajo solicitud:')}</strong> {t('corporation.contact.docsNote', 'RUT actualizado con actividad ESAL, Certificado de Existencia y Representación Legal de Cámara de Comercio de Medellín, Estatutos vigentes y Estados Financieros para procesos de contratación pública o privada.')}
                                </div>
                            </div>

                            {/* Generador Rápido de Solicitud de Propuesta */}
                            <div className="bg-bg-side rounded-3xl border border-border-theme p-6 sm:p-8 space-y-4">
                                <h3 className="text-lg font-black text-text-main uppercase tracking-tight">
                                    {t('corporation.contact.quickQuoteTitle', 'Cotizador Rápido a la Medida')}
                                </h3>
                                <p className="text-xs text-text-muted">
                                    {t('corporation.contact.quickQuoteSubtitle', 'Selecciona tu servicio y tipo de entidad para generar un mensaje estructurado directo a nuestro WhatsApp o correo:')}
                                </p>

                                <div className="space-y-3 pt-2 text-xs">
                                    <div>
                                        <label className="font-bold text-text-main block mb-1">
                                            {t('corporation.contact.step1', '1. Servicio o Línea de Interés:')}
                                        </label>
                                        <select
                                            value={selectedServiceForQuote}
                                            onChange={(e) => setSelectedServiceForQuote(e.target.value)}
                                            className="w-full p-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-main text-xs focus:outline-none focus:border-brand-primary"
                                        >
                                            <optgroup label={t('corporation.portfolio.title', 'Líneas de Portafolio (10)')}>
                                                {SERVICE_LINES.map((s) => (
                                                    <option key={s.id} value={isEn && s.title_en ? s.title_en : s.title}>
                                                        {s.number}. {isEn && s.title_en ? s.title_en : s.title}
                                                    </option>
                                                ))}
                                            </optgroup>
                                            <optgroup label={t('corporation.alliances.title', 'Modelos de Alianza')}>
                                                {ALLIANCE_MODELS.map((m) => (
                                                    <option key={m.id} value={isEn && m.targetTitle_en ? m.targetTitle_en : m.targetTitle}>
                                                        {isEn && m.targetTitle_en ? m.targetTitle_en : m.targetTitle}
                                                    </option>
                                                ))}
                                            </optgroup>
                                            <optgroup label={isEn ? 'Flagship Projects & Others' : 'Proyectos Insignia & Otros'}>
                                                <option value="Fiesta Friki - Padrinazgo o Copropiedad">
                                                    {isEn ? 'Fiesta Friki - Sponsorship & Co-ownership' : 'Fiesta Friki - Padrinazgo o Copropiedad'}
                                                </option>
                                                <option value="Convenio de Cooperación o Donación">
                                                    {isEn ? 'Cooperation Agreement / Donation' : 'Convenio de Cooperación o Donación'}
                                                </option>
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="font-bold text-text-main block mb-1">
                                            {t('corporation.contact.step2', '2. Tipo de Organización / Entidad:')}
                                        </label>
                                        <select
                                            value={selectedEntityType}
                                            onChange={(e) => setSelectedEntityType(e.target.value)}
                                            className="w-full p-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-main text-xs focus:outline-none focus:border-brand-primary"
                                        >
                                            <option value="Empresa Privada / Comercial">{t('corporation.quoteModal.entityPrivate', 'Empresa Privada / Comercial')}</option>
                                            <option value="Entidad Pública / Estado">{t('corporation.quoteModal.entityPublic', 'Entidad Pública / Estado')}</option>
                                            <option value="Entidad Pública-Privada / Caja de Compensación">{t('corporation.quoteModal.entityMixed', 'Caja de Compensación / Entidad Mixta')}</option>
                                            <option value="Organización Social / Comunitaria / Colectivo">{t('corporation.quoteModal.entitySocial', 'Organización Social / Colectivo Comunitario')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="font-bold text-text-main block mb-1">
                                            {t('corporation.contact.step3', '3. Detalles adicionales (Aforo, fecha estimada, lugar):')}
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={quoteNotes}
                                            onChange={(e) => setQuoteNotes(e.target.value)}
                                            placeholder={t('corporation.quoteModal.notesPlaceholder', 'Ej: Requerimos talleres de Soft Combat y Manga para 40 colaboradores en noviembre...')}
                                            className="w-full p-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-main placeholder-text-muted text-xs focus:outline-none focus:border-brand-primary resize-none"
                                        />
                                    </div>

                                    <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                                        <a
                                            href={generateWhatsAppLink()}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider text-center hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-2"
                                        >
                                            <Phone size={15} />
                                            <span>{t('corporation.quoteModal.sendWhatsApp', 'Cotizar por WhatsApp')}</span>
                                        </a>

                                        <a
                                            href={generateEmailLink()}
                                            className="flex-1 py-3 rounded-xl bg-bg-sub border border-border-theme text-text-main font-bold text-xs uppercase tracking-wider text-center hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2"
                                        >
                                            <Mail size={15} />
                                            <span>{t('corporation.contact.sendEmail', 'Enviar por Correo')}</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ── MODAL FLOTANTE DE COTIZACIÓN RÁPIDA ── */}
            {isQuoteModalOpen && (
                <div className="fixed inset-0 z-[200] bg-ui-overlay backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-bg-side rounded-3xl border border-border-theme p-5 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-4 max-h-[92dvh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setIsQuoteModalOpen(false)}
                            className="absolute top-5 right-5 text-text-muted hover:text-text-main p-1.5 rounded-full hover:bg-bg-sub transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2.5 text-brand-primary">
                            <Sparkles size={22} />
                            <h3 className="text-xl font-black uppercase text-text-main tracking-tight">
                                {t('corporation.quoteModal.title', 'Solicitar Cotización')}
                            </h3>
                        </div>

                        <p className="text-xs text-text-sub">
                            {t('corporation.quoteModal.subtitle', 'Indícanos los parámetros básicos para preparar una propuesta técnica y económica adaptada a tu entidad:')}
                        </p>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-text-main block mb-1">{t('corporation.quoteModal.selectService', 'Servicio de Interés:')}</label>
                                <select
                                    value={selectedServiceForQuote}
                                    onChange={(e) => setSelectedServiceForQuote(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-main text-xs focus:outline-none focus:border-brand-primary"
                                >
                                    <optgroup label={t('corporation.portfolio.title', 'Líneas de Portafolio (10)')}>
                                        {SERVICE_LINES.map((s) => (
                                            <option key={s.id} value={isEn && s.title_en ? s.title_en : s.title}>
                                                {s.number}. {isEn && s.title_en ? s.title_en : s.title}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label={t('corporation.alliances.title', 'Modelos de Alianza')}>
                                        {ALLIANCE_MODELS.map((m) => (
                                            <option key={m.id} value={isEn && m.targetTitle_en ? m.targetTitle_en : m.targetTitle}>
                                                {isEn && m.targetTitle_en ? m.targetTitle_en : m.targetTitle}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label={isEn ? 'Flagship Projects & Others' : 'Proyectos Insignia & Otros'}>
                                        <option value="Fiesta Friki - Padrinazgo o Copropiedad">
                                            {isEn ? 'Fiesta Friki - Sponsorship & Co-ownership' : 'Fiesta Friki - Padrinazgo o Copropiedad'}
                                        </option>
                                        <option value="Convenio de Cooperación o Donación">
                                            {isEn ? 'Cooperation Agreement / Donation' : 'Convenio de Cooperación o Donación'}
                                        </option>
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-text-main block mb-1">{t('corporation.quoteModal.selectEntity', 'Tipo de Entidad:')}</label>
                                <select
                                    value={selectedEntityType}
                                    onChange={(e) => setSelectedEntityType(e.target.value)}
                                    className="w-full p-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-main text-xs focus:outline-none focus:border-brand-primary"
                                >
                                    <option value="Empresa Privada / Comercial">{t('corporation.quoteModal.entityPrivate', 'Empresa Privada / Comercial')}</option>
                                    <option value="Entidad Pública / Estado">{t('corporation.quoteModal.entityPublic', 'Entidad Pública / Estado')}</option>
                                    <option value="Entidad Pública-Privada / Caja de Compensación">{t('corporation.quoteModal.entityMixed', 'Caja de Compensación / Mixta')}</option>
                                    <option value="Organización Social / Colectivo">{t('corporation.quoteModal.entitySocial', 'Organización Social / Comunitaria')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-text-main block mb-1">{t('corporation.quoteModal.notes', 'Detalles (aforo, fecha, lugar):')}</label>
                                <textarea
                                    rows={3}
                                    value={quoteNotes}
                                    onChange={(e) => setQuoteNotes(e.target.value)}
                                    placeholder={t('corporation.quoteModal.notesPlaceholder', 'Requerimientos puntuales de tu actividad...')}
                                    className="w-full p-2.5 rounded-xl bg-bg-sub border border-border-theme text-text-main placeholder-text-muted text-xs focus:outline-none focus:border-brand-primary resize-none"
                                />
                            </div>

                            <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                                <a
                                    href={generateWhatsAppLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsQuoteModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider text-center hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <Phone size={15} />
                                    <span>{t('corporation.quoteModal.sendWhatsApp', 'Cotizar por WhatsApp')}</span>
                                </a>

                                <a
                                    href={generateEmailLink()}
                                    onClick={() => setIsQuoteModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-bg-sub border border-border-theme text-text-main font-bold text-xs uppercase tracking-wider text-center hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2"
                                >
                                    <Mail size={15} />
                                    <span>{t('corporation.quoteModal.sendEmail', 'Enviar por Email')}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
