export interface ServiceActivity {
    name: string;
    name_en?: string;
    description: string;
    description_en?: string;
    duration?: string;
    capacity?: string;
    requirements?: string;
}

export interface ServiceLine {
    id: string;
    number: number;
    title: string;
    title_en?: string;
    icon: string;
    tagline: string;
    tagline_en?: string;
    description: string;
    description_en?: string;
    duration: string;
    duration_en?: string;
    capacity: string;
    capacity_en?: string;
    formats: string[];
    formats_en?: string[];
    activities: ServiceActivity[];
    deliverables: string[];
    deliverables_en?: string[];
}

export interface AllianceModel {
    id: string;
    targetTitle: string;
    targetTitle_en?: string;
    subtitle: string;
    subtitle_en?: string;
    badge: string;
    badge_en?: string;
    icon: string;
    description: string;
    description_en?: string;
    modalities: string[];
    modalities_en?: string[];
    benefits: string[];
    benefits_en?: string[];
    callToAction: string;
    callToAction_en?: string;
}

export const CORPORATION_INFO = {
    legalName: "CORPORACIÓN CIUDAD FRIKI",
    shortName: "C.C.F.",
    nit: "901.597.939-0",
    entityType: "Entidad Sin Ánimo de Lucro (ESAL) - Utilidad Común",
    umbrellaOf: "Red Cultural Juvenil Comunidad Underground",
    foundationYear: 2011,
    yearsOfExperience: "Más de 15 años",
    city: "Medellín, Antioquia, Colombia",
    neighborhood: "Carrera 49B # 92 - 74, Barrio Aranjuez, Sector San Nicolás, Comuna 4",
    email: "redcomunidadunderground@gmail.com",
    whatsapp: "+57 322 412 4297",
    whatsappRaw: "573224124297",
    logoUrl: "/assets/logo_ciudad_friki.png",
    quote: {
        text: "El hombre no deja de jugar porque se hace viejo, sino que se hace viejo porque deja de jugar.",
        text_en: "We don't stop playing because we grow old; we grow old because we stop playing.",
        author: "George Bernard Shaw"
    },
    mission: "Facilitar la creación, formación, circulación, comercialización e intercambio de bienes y servicios culturales, artísticos, lúdicos, tecnológicos y formativos; fortalecer la participación activa de niñas, niños, adolescentes y jóvenes; y contribuir decisivamente a la dignificación del trabajo cultural, el impulso de economías creativas, solidarias y populares, y la generación de oportunidades para artistas, gestores y comunidades.",
    mission_en: "Facilitate the creation, training, circulation, commercialization, and exchange of cultural, artistic, recreational, technological, and educational goods and services; strengthen youth participation; and contribute decisively to dignifying cultural work and creative economies.",
    vision: "Consolidar las culturas alternativas, emergentes y digitales como un motor de desarrollo sociocultural y ciudadano de referencia en Medellín, Antioquia y Colombia, integrando innovación tecnológica, fraternidad comunitaria y sostenibilidad para los creadores.",
    vision_en: "Consolidate alternative, emerging, and digital cultures as an engine of sociocultural development in Medellín and Colombia, integrating technological innovation and community fraternity.",
    principles: [
        {
            title: "Fraternidad y Apoyo Mutuo",
            desc: "Construcción colectiva de saberes donde la cooperación prima sobre el individualismo."
        },
        {
            title: "Libertad de Expresión y Mente Abierta",
            desc: "Reconocimiento y respeto a las identidades juveniles, aficiones diversas y expresiones artísticas."
        },
        {
            title: "Dignificación del Trabajo Cultural",
            desc: "Creación de condiciones económicas justas y sostenibles para artistas, talleristas y gestores."
        },
        {
            title: "Apropiación Territorial y Convivencia",
            desc: "Uso del espacio público y los entornos comunitarios como escenarios de paz, juego y aprendizaje."
        }
    ],
    principles_en: [
        {
            title: "Fraternity & Mutual Support",
            desc: "Collective building of knowledge where cooperation takes precedence over individualism."
        },
        {
            title: "Freedom of Expression & Open Mind",
            desc: "Recognition and respect for youth identities, diverse hobbies, and artistic expressions."
        },
        {
            title: "Dignification of Cultural Work",
            desc: "Creation of fair and sustainable economic conditions for artists, facilitators, and managers."
        },
        {
            title: "Territorial Appropriation & Coexistence",
            desc: "Use of public spaces and community environments as settings for peace, play, and learning."
        }
    ],
    institutionalAllies: [
        "Secretaría de Cultura Ciudadana de Medellín",
        "Secretaría de la Juventud de Medellín",
        "Secretaría de Participación Ciudadana",
        "Ruta N Medellín",
        "Parque Explora",
        "Comfama",
        "Comfenalco Antioquia",
        "Fundación EPM",
        "Casa Museo Pedro Nel Gómez",
        "Centro de Desarrollo Cultural de Moravia",
        "INDER Medellín",
        "Junta Administradora Local (JAL) Comuna 4 Aranjuez",
        "Programa de Presupuesto Participativo de Medellín"
    ]
};

export const SERVICE_LINES: ServiceLine[] = [
    {
        id: "formacion-artistica",
        number: 1,
        title: "Formación Artístico-Cultural",
        title_en: "Artistic & Cultural Training",
        icon: "Palette",
        tagline: "Talleres prácticos, creativos y vivenciales",
        tagline_en: "Hands-on, creative, and experiential workshops",
        description: "Línea orientada al diseño y desarrollo de procesos de formación artística, cultural, creativa y de apropiación de saberes para niños, niñas, adolescentes, jóvenes y adultos. Sesiones dinámicas con metodologías experienciales.",
        description_en: "Design and delivery of artistic, cultural, creative, and skill-building training for children, adolescents, youth, and adults with dynamic, experiential methodologies.",
        duration: "1 a 4 horas por sesión (individuales o ciclos)",
        duration_en: "1 to 4 hours per session (single or cyclical courses)",
        capacity: "Referencia de 20 personas por grupo (ajustable)",
        capacity_en: "Standard of 20 participants per group (scalable)",
        formats: ["Talleres presenciales", "Ciclos formativos", "Vacacionales creativos"],
        formats_en: ["In-person workshops", "Training cycles", "Creative holiday camps"],
        activities: [
            { name: "Taller de Manga y Anime", description: "Técnicas de dibujo japonés, anatomía, diseño de personajes y entintado." },
            { name: "Taller de Cómic e Ilustración", description: "Narrativa gráfica, creación de viñetas, guión y composición." },
            { name: "Taller de Cosplay y Patronaje", description: "Diseño de vestuarios, selección de materiales, cortes y confección." },
            { name: "Taller de Origami Artístico", description: "Papiroflexia básica y avanzada, concentración y geometría creativa." },
            { name: "Taller de Modelado en Plastilina", description: "Creación de personajes 3D, volumen, texturas y detalle escultórico." },
            { name: "Taller de Maquillaje Artístico y FX", description: "Técnicas faciales, caracterización teatral y efectos especiales." },
            { name: "Taller de Fotografía y Edición con Celular", description: "Composición, manejo de luz y retoque en smartphones." },
            { name: "Taller de Estampación Textil", description: "Serigrafía artesanal, esténcil y personalización de prendas." },
            { name: "Taller de Siembra y Cuidado Ambiental", description: "Cultivo urbano responsable, relación armónica con el entorno y germinación." },
            { name: "Taller de Graffiti y Arte Urbano", description: "Tipografía, muralismo comunitario y técnicas de aerosol responsable." },
            { name: "Taller de Cocina Básica e Intermedia", description: "Manipulación de alimentos, gastronomía temática y hábitos saludables." }
        ],
        deliverables: ["Materiales e insumos por participante", "Tallerista experto y apoyo logístico", "Memorias fotográficas y productos terminados"],
        deliverables_en: ["Materials and supplies per participant", "Expert instructor and logistical support", "Photographic documentation and finished pieces"]
    },
    {
        id: "formacion-empresarial",
        number: 2,
        title: "Formación Empresarial y Organizacional",
        title_en: "Corporate & Organizational Training",
        icon: "Briefcase",
        tagline: "Bienestar, habilidades blandas y gamificación corporativa",
        tagline_en: "Wellbeing, soft skills, and corporate gamification",
        description: "Capacitaciones, talleres, jornadas de integración y experiencias lúdicas diseñadas a la medida de empresas, equipos e instituciones para fortalecer el clima organizacional y las competencias laborales.",
        description_en: "Custom workshops, team-building sessions, and playful integration experiences crafted for companies and institutions to enhance workplace climate and professional skills.",
        duration: "2 a 8 horas (media jornada o jornada completa)",
        duration_en: "2 to 8 hours (half-day or full-day formats)",
        capacity: "Equipos de 10 hasta 150 colaboradores",
        capacity_en: "Teams of 10 to 150 employees",
        formats: ["Team Building", "Talleres de sensibilización", "Pausas activas gamificadas"],
        formats_en: ["Team Building", "Awareness workshops", "Gamified active breaks"],
        activities: [
            { name: "Taller de Trabajo en Equipo y Liderazgo", description: "Dinámicas grupales lúdicas para resolver retos colaborativos y comunicación asertiva." },
            { name: "Seguridad y Salud en el Trabajo Lúdica", description: "Sensibilización en prevención de riesgos mediante juegos de simulación." },
            { name: "Prevención y Sensibilización frente al Acoso", description: "Entornos seguros, equidad de género y convivencia laboral respetuosa." },
            { name: "Mapeo Territorial y Herramientas Digitales", description: "Apropiación de mapas, georreferenciación y digitalización para equipos de campo." }
        ],
        deliverables: ["Diagnóstico previo del equipo", "Facilitador profesional y dinámicas", "Informe de participación y aprendizajes"],
        deliverables_en: ["Preliminary team diagnostic", "Professional facilitator and dynamics", "Participation and learnings report"]
    },
    {
        id: "eventos-produccion",
        number: 3,
        title: "Eventos y Producción Integral",
        title_en: "Events & Turnkey Production",
        icon: "Sparkles",
        tagline: "De la conceptualización al montaje y puesta en escena",
        tagline_en: "From concept and staging to full execution",
        description: "Planeación, diseño conceptual, producción técnica, logística, convocatoria, curaduría de artistas y coordinación operativa para ferias, festivales, convenciones y celebraciones temáticas.",
        description_en: "Comprehensive planning, conceptual design, technical production, logistics, audience management, artist curation, and operational coordination for fairs, festivals, conventions, and themed galas.",
        duration: "Eventos de 1 día hasta festivales multidiarios (ej. Fiesta Friki)",
        duration_en: "Single-day events to multi-day festivals (e.g. Fiesta Friki)",
        capacity: "Desde 100 hasta más de 10.000 asistentes",
        capacity_en: "From 100 to over 10,000 attendees",
        formats: ["Tipo A (Gran formato / Masivo)", "Tipo B (Media afluencia)", "Tipo C (Eventos específicos / Baja afluencia)"],
        formats_en: ["Type A (Massive / Large-scale)", "Type B (Medium turnout)", "Type C (Targeted / Niche events)"],
        activities: [
            { name: "Diseño Conceptual y Guionaje de Eventos", description: "Definición temática, identidad visual, cronograma y narrativa del certamen." },
            { name: "Producción Técnica y Logística", description: "Sonido, iluminación, tarimas, carpas, energía, seguridad y permisos." },
            { name: "Articulación y Curaduría de Artistas", description: "Gestión de invitados especiales, cosplayers, músicos, conferencistas y jueces." },
            { name: "Operación en Campo y Gestión de Público", description: "Personal de logística, guías, protocolo, puntos de información y registro." }
        ],
        deliverables: ["Parrilla de programación completa", "Montaje y desmontaje seguro", "Plan de contingencia y reporte final"],
        deliverables_en: ["Complete schedule and programming grid", "Safe assembly and teardown", "Contingency plan and final report"]
    },
    {
        id: "muestras-artisticas",
        number: 4,
        title: "Muestras Artísticas, Culturales e Interactivas",
        title_en: "Artistic, Cultural & Interactive Showcases",
        icon: "Camera",
        tagline: "Demostraciones vivas de talento alternativo",
        tagline_en: "Live demonstrations of alternative talent",
        description: "Estaciones y espacios interactivos donde artistas en vivo demuestran su disciplina y permiten que el público experimente de primera mano el proceso de creación.",
        description_en: "Interactive stations and stages where live artists showcase their craft, allowing audiences to experience creative processes first-hand.",
        duration: "2 a 6 horas por jornada",
        duration_en: "2 to 6 hours per session",
        capacity: "Flujo continuo rotativo de asistentes",
        capacity_en: "Continuous rotating audience flow",
        formats: ["Stands demostrativos", "Pasarelas vivas", "Murales comunitarios"],
        formats_en: ["Demonstrative booths", "Live runways", "Community murals"],
        activities: [
            { name: "Muestra y Demostración de Ilustración", description: "Artistas dibujando en vivo con tabletas digitales y medios tradicionales." },
            { name: "Exhibición de Construcción de Cosplay", description: "Técnicas de armaduras en goma EVA, impresiones 3D y peluquería temática." },
            { name: "Demostración de Escultura en Plastilina", description: "Creación de dioramas en tiempo real a la vista del público." },
            { name: "Body Paint y Maquillaje en Vivo", description: "Transformación artística de modelos con técnicas de pintura corporal." },
            { name: "Muestra de Videojuegos Retro y Consolas", description: "Museo interactivo de la historia de los videojuegos con consolas clásicas." },
            { name: "Mesa Abierta de Rol de Demostración", description: "Partidas introductorias de 30 minutos dirigidas por Game Masters." }
        ],
        deliverables: ["Mobiliario y conexiones técnicas", "Artistas en vivo especializados", "Interacción directa con la audiencia"],
        deliverables_en: ["Technical furniture and hookups", "Specialized live artists", "Direct audience engagement"]
    },
    {
        id: "productos-digitales",
        number: 5,
        title: "Productos y Experiencias Digitales",
        title_en: "Digital Products & Experiences",
        icon: "Smartphone",
        tagline: "Gamificación comunitaria, software y conectividad",
        tagline_en: "Community gamification, software, and connectivity",
        description: "Desarrollo e implementación de herramientas digitales, plataformas web, aplicaciones interactivas y estrategias gamificadas para comunidades y eventos.",
        description_en: "Development and deployment of digital tools, web platforms, interactive applications, and gamified strategies for communities and events.",
        duration: "Continuo o por temporada de evento",
        duration_en: "Continuous or per-event season",
        capacity: "Usuarios simultáneos ilimitados",
        capacity_en: "Unlimited concurrent users",
        formats: ["Plataforma Ciudad Friki Web y App", "Gamificación a medida", "Mapeos interactivos"],
        formats_en: ["Ciudad Friki Web & App Ecosystem", "Custom gamification", "Interactive mapping"],
        activities: [
            { name: "Ecosistema Digital Ciudad Friki", description: "Integración de eventos, trivias comunitarias, billetera de puntos y foros." },
            { name: "Gamificación de Asistencia por Códigos QR", description: "Fidelización de públicos mediante misiones y recompensas digitales." },
            { name: "Mapas Georreferenciados Culturales", description: "Cartografía digital de comercios, sedes aliadas y puntos de interés." },
            { name: "Trivias Interactivas y Encuestas Ciudadanas", description: "Medición en tiempo real de opinión y conocimientos de la comunidad." }
        ],
        deliverables: ["Despliegue en servidores seguros", "Dashboard de métricas y analítica", "Soporte técnico continuo"],
        deliverables_en: ["Deployment on secure infrastructure", "Metrics and analytics dashboard", "Ongoing technical support"]
    },
    {
        id: "actividades-recreativas",
        number: 6,
        title: "Actividades Recreativas, Lúdicas y de Participación",
        title_en: "Recreational, Play & Participation Activities",
        icon: "Dices",
        tagline: "Juego sano, esgrima lúdica y torneos",
        tagline_en: "Healthy play, safe fencing, and tournaments",
        description: "Experiencias de integración lúdica orientadas al ocio positivo, el juego cooperativo y la sana competencia para colegios, empresas, festividades y comunidades.",
        description_en: "Playful integration experiences focused on positive leisure, cooperative gameplay, and friendly competition for schools, corporations, and community festivals.",
        duration: "2 a 4 horas por actividad",
        duration_en: "2 to 4 hours per activity",
        capacity: "Rotativo de 20 a 100 personas por estación",
        capacity_en: "Rotating groups of 20 to 100 per station",
        formats: ["Zonas de juego libre", "Torneos competitivos", "Circuitos recreativos"],
        formats_en: ["Free play zones", "Competitive tournaments", "Recreational circuits"],
        activities: [
            { name: "Soft Combat (Esgrima Lúdica y Segura)", description: "Combate recreativo con espadas acolchadas de goma EVA, cascos y jueces capacitados." },
            { name: "Mesas de Juegos de Rol (TTRPG)", description: "Narración de aventuras épicas (Dungeons & Dragons, Vampiro, etc.) para fomentar imaginación." },
            { name: "Torneo de Juegos de Cartas (TCG)", description: "Yu-Gi-Oh!, Magic, Pokémon y juegos de mesa modernos con arbitraje." },
            { name: "Estación de Karaoke Friki y Open Mic", description: "Canto de openings de anime, bandas sonoras de videojuegos y música popular." },
            { name: "Pista de Baile Just Dance", description: "Competencias de baile en pantalla gigante con sensores de movimiento." },
            { name: "Carreras de Observación Temáticas", description: "Pistas y acertijos por equipos para explorar y descubrir el entorno." },
            { name: "Obras de Teatro, Títeres y Clown", description: "Puestas en escena lúdicas sobre valores ciudadanos, convivencia y arte." }
        ],
        deliverables: ["Equipamiento completo de juego (espadas, dados, consolas)", "Árbitros y dinamizadores", "Reglamento y premiación"],
        deliverables_en: ["Complete game gear (padded swords, dice, consoles)", "Referees and hosts", "Rules and awards ceremony"]
    },
    {
        id: "gestion-conocimiento",
        number: 7,
        title: "Gestión del Conocimiento, Memoria y Patrimonio",
        title_en: "Knowledge Management, Memory & Heritage",
        icon: "BookOpen",
        tagline: "Memoria colectiva, historia barrial e investigación",
        tagline_en: "Collective memory, local history, and research",
        description: "Diseño y desarrollo de procesos de sistematización, tertulias, rutas de memoria y ejercicios investigativos sobre la cultura juvenil y el patrimonio territorial.",
        description_en: "Design and execution of systematization processes, dialogue circles, memory walks, and research projects around youth culture and territorial heritage.",
        duration: "Procesos de 1 a 6 meses o sesiones puntuales de 2 horas",
        duration_en: "1 to 6-month programs or 2-hour standalone sessions",
        capacity: "Grupos focales de 15 a 40 personas",
        capacity_en: "Focus groups of 15 to 40 participants",
        formats: ["Rutas patrimoniales caminadas", "Tertulias barriales", "Publicaciones investigativas"],
        formats_en: ["Guided heritage walks", "Community dialogue sessions", "Research publications"],
        activities: [
            { name: "Rutas Patrimoniales y Culturales", description: "Recorridos guiados por hitos históricos, murales y sitios culturales de la Comuna 4." },
            { name: "Tertulias de Memoria Underground", description: "Espacios de diálogo intergeneracional sobre la evolución de las subculturas en Medellín." },
            { name: "Sistematización de Experiencias Comunitarias", description: "Elaboración de documentos de memoria y lecciones aprendidas de procesos juveniles." },
            { name: "Exposiciones Históricas Itinerantes", description: "Muestras museográficas sobre cultura alternativa y movimientos juveniles." }
        ],
        deliverables: ["Documentos de sistematización", "Guías pedagógicas", "Fotolibros o piezas de divulgación"],
        deliverables_en: ["Systematization documents", "Educational toolkits", "Photobooks and outreach materials"]
    },
    {
        id: "gestion-cultural-territorial",
        number: 8,
        title: "Gestión Cultural y Territorial",
        title_en: "Cultural & Territorial Management",
        icon: "MapPin",
        tagline: "Cartografía de agentes, diagnósticos y bases de datos",
        tagline_en: "Agent mapping, diagnostics, and databases",
        description: "Caracterización, análisis e investigación de campo sobre el ecosistema cultural, colectivos, emprendimientos y espacios del territorio para sustentar políticas y proyectos.",
        description_en: "Field characterization, analysis, and research on cultural ecosystems, collectives, ventures, and spaces across the territory to inform policies and projects.",
        duration: "Proyectos de 1 a 3 meses",
        duration_en: "Projects lasting 1 to 3 months",
        capacity: "Cobertura barrial, comunal o municipal",
        capacity_en: "Neighborhood, commune, or city-wide coverage",
        formats: ["Diagnósticos territoriales", "Cartografías sociales", "Bases de datos depuradas"],
        formats_en: ["Territorial diagnostics", "Social mapping", "Curated databases"],
        activities: [
            { name: "Caracterización de Agentes Culturales", description: "Censos y entrevistas a creadores, artesanos, músicos y colectivos del sector." },
            { name: "Cartografía y Mapas de Oportunidades", description: "Mapeo georreferenciado de espacios culturales, sedes y puntos de encuentro." },
            { name: "Diagnósticos de Consumo Cultural Juvenil", description: "Análisis de hábitos, preferencias e intereses de niños y jóvenes en el territorio." },
            { name: "Formulación de Proyectos para Convocatorias", description: "Acompañamiento técnico para presentar propuestas al Estado y cooperación." }
        ],
        deliverables: ["Documento diagnóstico con infografías", "Base de datos digital georreferenciada", "Presentación de resultados"],
        deliverables_en: ["Diagnostic document with infographics", "Georeferenced digital database", "Results presentation"]
    },
    {
        id: "productos-creativos",
        number: 9,
        title: "Productos Culturales, Editoriales y Didácticos",
        title_en: "Cultural, Editorial & Educational Products",
        icon: "Layers",
        tagline: "Manufactura creativa, diseño y publicaciones a medida",
        tagline_en: "Creative manufacturing, design, and bespoke publications",
        description: "Conceptualización, diseño, diagramación y manufactura de bienes tangibles e intangibles con identidad cultural, valor educativo o fines institucionales.",
        description_en: "Conceptualization, design, layout, and manufacturing of tangible and intangible goods with cultural identity, educational value, or corporate branding.",
        duration: "Según volumen de producción",
        duration_en: "According to production volume",
        capacity: "Lotes desde 20 unidades hasta millares",
        capacity_en: "Batches from 20 to thousands of units",
        formats: ["Publicaciones editoriales", "Kits pedagógicos", "Merchandising cultural"],
        formats_en: ["Editorial publications", "Pedagogical kits", "Cultural merchandise"],
        activities: [
            { name: "Diseño y Publicación de Fanzines y Libros", description: "Edición, ilustración y maquetación de material literario y gráfico." },
            { name: "Creación de Juegos de Mesa Didácticos", description: "Diseño de mecánicas, prototipado y fabricación de juegos con temáticas educativas." },
            { name: "Producción de Merchandising Temático (Mugs, Camisetas)", description: "Objetos conmemorativos con ilustraciones originales de la corporación." },
            { name: "Kits y Cajas de Herramientas Pedagógicas", description: "Materiales didácticos empaquetados para réplica de talleres en escuelas." }
        ],
        deliverables: ["Muestras previas de prototipo", "Control de calidad en impresión y manufactura", "Entrega física empacada"],
        deliverables_en: ["Prototype review samples", "Print and manufacturing quality control", "Packaged physical delivery"]
    },
    {
        id: "emprendimiento-cultural",
        number: 10,
        title: "Emprendimiento Cultural y Circuitos Comerciales",
        title_en: "Cultural Entrepreneurship & Commercial Circuits",
        icon: "Store",
        tagline: "Ferias, vitrinas y circulación para creadores",
        tagline_en: "Fairs, showcases, and circulation for creators",
        description: "Estructuración de ferias, mercados culturales, zonas de stands y ruedas de negocio para que creadores, ilustradores y marcas locales comercialicen sus creaciones.",
        description_en: "Structuring of cultural markets, artist alleys, booth zones, and business roundtables enabling creators, illustrators, and indie brands to market their work.",
        duration: "1 a 4 días de feria",
        duration_en: "1 to 4 festival days",
        capacity: "De 10 hasta más de 80 stands comerciales",
        capacity_en: "From 10 to over 80 commercial booths",
        formats: ["Callejones de artistas (Artist Alley)", "Zonas de mercadillo friki", "Bazar cultural"],
        formats_en: ["Artist Alleys", "Pop-culture bazaars", "Cultural marketplaces"],
        activities: [
            { name: "Convocatoria y Curaduría de Emprendedores", description: "Selección de marcas independientes, artesanías geek y productos originales." },
            { name: "Distribución Espacial y Montaje de Stands", description: "Carpas, tablones, mantelería, iluminación y señalética comercial." },
            { name: "Coordinación y Protocolo de Vendedores", description: "Acompañamiento, capacitaciones básicas en ventas y gestión de medios de pago." },
            { name: "Estrategias de Visibilización y Tráfico", description: "Articulación con la programación artística para asegurar flujo constante de público." }
        ],
        deliverables: ["Plano de distribución del mercado", "Emprendimientos articulados y formalizados", "Informe de ventas agregadas del circuito"],
        deliverables_en: ["Market layout blueprint", "Vetted and registered vendors", "Consolidated circuit sales report"]
    }
];

export const ALLIANCE_MODELS: AllianceModel[] = [
    {
        id: "clientes-empresas",
        targetTitle: "Empresas & Entidades Contratantes",
        targetTitle_en: "Companies & Contracting Entities",
        subtitle: "Soluciones de valor, bienestar laboral y eventos que inspiran",
        subtitle_en: "High-value solutions, workplace wellbeing, and inspiring events",
        badge: "Servicios B2B & Sector Público",
        badge_en: "B2B Services & Public Sector",
        icon: "Briefcase",
        description: "Para empresas privadas, cajas de compensación, colegios, universidades y entidades gubernamentales que requieren proveedores culturales confiables con amplia experiencia operativa y personería jurídica.",
        description_en: "For private corporations, compensation funds, schools, universities, and government bodies seeking dependable cultural providers with solid operational track records and legal standing.",
        modalities: [
            "Contratación directa de talleres de bienestar, team building y pausas activas gamificadas.",
            "Producción integral de ferias familiares, celebraciones de fin de año o eventos corporativos.",
            "Alquiler de estaciones lúdicas: videojuegos retro, karaoke, just dance o esgrima soft combat.",
            "Ejecución de convenios de asociación y contratos de prestación de servicios con el Estado."
        ],
        modalities_en: [
            "Direct contracting of wellbeing workshops, team building, and gamified active breaks.",
            "Turnkey production of family fairs, year-end celebrations, or corporate events.",
            "Rental of interactive stations: retro video games, karaoke, Just Dance, or soft combat fencing.",
            "Execution of public association agreements and service delivery contracts with the State."
        ],
        benefits: [
            "Facturación formal por entidad sin ánimo de lucro (ESAL con NIT y RUT actualizado).",
            "Metodologías probadas durante más de 15 años que garantizan alta conexión con el público.",
            "Personal especializado con cobertura de seguridad social y estricto cumplimiento legal."
        ],
        benefits_en: [
            "Formal invoicing by a registered non-profit organization (ESAL with verified tax ID and RUT).",
            "Proven methodologies developed over 15+ years guaranteeing high public engagement.",
            "Specialized personnel with full social security coverage and strict legal compliance."
        ],
        callToAction: "Solicitar Propuesta para mi Empresa",
        callToAction_en: "Request Proposal for my Company"
    },
    {
        id: "cooperantes-donantes",
        targetTitle: "Cooperantes, Donantes & Filantropía",
        targetTitle_en: "Cooperation Partners, Donors & Philanthropy",
        subtitle: "Inversión social con impacto visible, multiplicador y transparente",
        subtitle_en: "Social investment with visible, multiplying, and transparent impact",
        badge: "Alianzas de Cooperación",
        badge_en: "Cooperation Alliances",
        icon: "HeartHandshake",
        description: "Para fundaciones, agencias de cooperación internacional, empresas socialmente responsables y personas naturales que desean que sus recursos generen oportunidades permanentes para la juventud en Medellín.",
        description_en: "For foundations, international cooperation agencies, socially responsible businesses, and individual donors seeking to provide lasting opportunities for youth in Medellín.",
        modalities: [
            "Aliado Operativo: Aportes orientados al sostenimiento de la sede comunitaria y servicios.",
            "Aliado Tecnológico: Donación o préstamo de computadores, consolas, cámaras y conectividad.",
            "Padrino de Becas: Financiación de ciclos formativos y kits artísticos para niños y jóvenes vulnerables.",
            "Convenios de Cooperación en especie, alimentación, transporte o voluntariado profesional."
        ],
        modalities_en: [
            "Operational Partner: Contributions dedicated to maintaining the community headquarters and services.",
            "Technology Partner: Donation or loan of computers, gaming consoles, cameras, and connectivity.",
            "Scholarship Sponsor: Funding of artistic training cycles and creative kits for underserved youth.",
            "Cooperation Agreements: In-kind supplies, meals, logistics, or professional volunteer programs."
        ],
        benefits: [
            "Destino transparente de cada recurso con informes detallados de ejecución social e impacto.",
            "Vinculación de marca y reconocimiento institucional en piezas comunicativas de la Red.",
            "Certificación de donaciones y soporte contractual según la normativa vigente en Colombia."
        ],
        benefits_en: [
            "Transparent allocation of every resource with comprehensive social execution and impact reports.",
            "Brand attribution and institutional recognition across Network media and community channels.",
            "Donation certification and legal contract support in compliance with Colombian law."
        ],
        callToAction: "Quiero Apoyar como Cooperante o Donante",
        callToAction_en: "Support as a Partner or Donor"
    },
    {
        id: "inversionistas-padrinos",
        targetTitle: "Inversionistas & Padrinos de Macroeventos",
        targetTitle_en: "Investors & Macro-Event Sponsors",
        subtitle: "Copropiedad estratégica de Fiesta Friki y proyectos insignia",
        subtitle_en: "Strategic co-ownership of Fiesta Friki and flagship initiatives",
        badge: "Copropiedad & Padrinazgo",
        badge_en: "Co-Ownership & Sponsorship",
        icon: "Trophy",
        description: "Para empresarios y visionarios de la industria del entretenimiento que desean asociarse en la vigésima edición de 'Fiesta Friki XX: Princes@s' y grandes hitos de la cultura alternativa regional.",
        description_en: "For entrepreneurs and entertainment industry visionaries seeking to partner in the 20th edition of 'Fiesta Friki XX: Princesses' and iconic regional pop culture milestones.",
        modalities: [
            "Participación porcentual en el modelo económico y de coproducción del macroevento Fiesta Friki.",
            "Patrocinio exclusivo de escenarios principales, zonas temáticas o torneos oficiales.",
            "Activación de marca de alto impacto ante comunidades cautivas de miles de personas."
        ],
        modalities_en: [
            "Percentage equity in the economic and co-production model of the Fiesta Friki festival.",
            "Exclusive stage, thematic zone, or official tournament naming rights.",
            "High-impact on-site and digital brand activations before captive crowds of thousands."
        ],
        benefits: [
            "Acceso directo y preferencial a una audiencia masiva, joven y apasionada por la cultura pop.",
            "Presencia destacada en medios de comunicación, redes sociales y campañas publicitarias.",
            "Modelo de negocio transparente con historial de 20 ediciones consecutivas de posicionamiento."
        ],
        benefits_en: [
            "Direct, preferential access to a massive, passionate youth and family demographic.",
            "Prominent visibility across press, broadcast media, social channels, and advertising campaigns.",
            "Transparent business model backed by a 20-edition proven track record."
        ],
        callToAction: "Conversar sobre Inversión en Fiesta Friki",
        callToAction_en: "Discuss Investment in Fiesta Friki"
    }
];
