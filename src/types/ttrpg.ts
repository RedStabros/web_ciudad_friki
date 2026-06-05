export interface DiceRollResult {
    id: string;
    timestamp: number;
    amount: number;
    faces: number;
    rolls: number[];
    sum: number;
    label?: string;
    // Multisystem Dice Sync Additions:
    rollType?: 'standard' | 'gothic_pool' | 'roll_keep';
    difficulty?: number;      // Gothic pool target success value (e.g. 6)
    successes?: number;       // Gothic pool total successes counted
    keptCount?: number;       // Kept dice count for L5R (Y)
    keptRolls?: number[];     // Kept rolls only for L5R
    explodedRolls?: { [index: number]: number[] }; // Recorded explosions per rolled die
}

export interface DotTrackerConfig {
    id: string;
    label: string;
    type: 'dot_tracker';
    max_dots: number;
    current_value: number;
    is_pool_combinable?: boolean;
    isCustom?: boolean;
}

export interface CustomTrait {
    id: string;
    label: string;
    cost: number;
}

export interface GothicHealthState {
    id: string;
    label: string;
    penalty: number; // 0, -1, -2, -5, or -99 for Incapacitated
    checked: boolean;
}

export interface TTRPGWeapon {
    id: string;
    name: string;
    difficulty: string;
    damage: string;
    range: string;
    rate: string;
    ammo: string;
    concealment: string;
}

export interface TTRPGArmor {
    name: string;
    rating: number;
    penalty: number;
}

export interface TTRPGDescription {
    age: string;
    apparentAge: string;
    embrace: string;
    hair: string;
    eyes: string;
    gender: string;
    height: string;
    weight: string;
}

export interface Dnd5eSpell {
    id: string;
    name: string;
    prepared: boolean;
}

export interface Dnd5eSpellLevel {
    level: number; // 0 for cantrips, 1-9 for spell levels
    slots_total: number;
    slots_expended: number;
    spells: Dnd5eSpell[];
}

export interface Dnd5eData {
    inspiration: boolean;
    proficiency_bonus: number;
    saving_throws_proficiencies?: string[]; // array of attribute IDs ('str', 'dex', etc.)
    skills_proficiencies?: string[]; // array of skill IDs ('acro', 'athl', etc.)
    spellcasting_class?: string;
    spellcasting_ability?: string;
    spell_save_dc?: number;
    spell_attack_bonus?: number;
    ac: number;
    initiative: number;
    speed: string;
    hp_max: number;
    hp_current: number;
    hp_temp: number;
    hit_dice_total: string;
    hit_dice_current: string;
    death_saves: {
        successes: number;
        failures: number;
    };
    passive_perception: number;
    other_proficiencies_languages?: string;
    personality_traits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    features_traits?: string;
    additional_features_traits?: string;
    treasure?: string;
    allies_organizations?: {
        name: string;
        symbol_desc?: string;
        text?: string;
    };
    spell_levels?: Dnd5eSpellLevel[];
}

export interface TTRPGSheetData {
    attributes: {
        [category: string]: DotTrackerConfig[]; // Físicos, Sociales, Mentales
    };
    abilities: {
        [category: string]: DotTrackerConfig[]; // Talentos, Técnicas, Conocimientos
    };
    disciplines: DotTrackerConfig[]; // Dynamic disciplines list
    backgrounds: DotTrackerConfig[]; // Dynamic backgrounds list
    virtues: {
        conscience: number; // Conciencia/Convicción (1-5)
        self_control: number; // Autocontrol/Instinto (1-5)
        courage: number; // Coraje (1-5)
    };
    humanity: {
        value: number; // 1-10 circles
        bearing: string; // Porte string
        bearingValue: number; // Porte rating
    };
    willpower: {
        rating: number; // 1-10 circles (permanent value)
        pool: number; // 1-10 squares (temporary spendable pool)
    };
    blood_pool: {
        current: number; // Current blood points
        max: number; // Max blood points (scales with Generation)
        per_turn: number; // Max blood points spendable per turn
    };
    health: GothicHealthState[]; // The 7 exact injury state checkboxes
    merits: CustomTrait[]; // Méritos table
    flaws: CustomTrait[]; // Defectos table
    other_traits?: DotTrackerConfig[]; // Otros Rasgos
    combat?: {
        weapons: TTRPGWeapon[];
        armor: TTRPGArmor;
    };
    dnd_data?: Dnd5eData;
    pathfinder_data?: PathfinderData;
    l5r_data?: L5rData;
}

export interface PathfinderSpell {
    id: string;
    name: string;
    prepared: boolean;
}

export interface PathfinderSpellLevel {
    level: number;
    slots_total: number;
    slots_expended: number;
    spells: PathfinderSpell[];
}

export interface PathfinderData {
    alignment?: string;
    deity?: string;
    homeland?: string;
    size?: string;
    gender?: string;
    hair?: string;
    eyes?: string;
    
    // Combat values
    ca_armadura?: number;
    modescudo?: number;
    armadura_natural?: number;
    moddesvio?: number;
    camodvarios?: number;
    
    initiative_modvarios?: number;
    
    speed_land?: string;
    speed_fly?: string;
    speed_fly_maneuver?: string;
    speed_swim?: string;
    speed_climb?: string;
    speed_burrow?: string;
    
    // Saving throws details
    saves_details?: {
        fort: { base: number; magic: number; varios: number; temporal: number };
        ref: { base: number; magic: number; varios: number; temporal: number };
        will: { base: number; magic: number; varios: number; temporal: number };
    };
    
    bab?: string;
    sr?: string;
    bmc_modvarios?: number;
    dmc_modvarios?: number;
    
    // Skills config
    class_skills?: string[];
    skills_ranks?: { [skillId: string]: number };
    skills_varios?: { [skillId: string]: number };
    
    // Proficiencies
    prof_simple?: boolean;
    prof_martial?: boolean;
    prof_shields?: boolean;
    prof_armor_light?: boolean;
    prof_armor_medium?: boolean;
    prof_armor_heavy?: boolean;
    prof_exotic1?: string;
    prof_exotic2?: string;
    prof_racial?: string;
    
    // Extra stats
    xp?: string;
    prestige_total?: number;
    prestige_current?: number;
    hero_points?: number;
    fama?: string;
    
    // Carry loads
    load_light?: string;
    load_medium?: string;
    load_heavy?: string;
    load_overhead?: string;
    load_floor?: string;
    load_drag?: string;
    
    // Carry currencies
    pc?: string;
    pp?: string;
    po?: string;
    ppt?: string;
    
    // List elements
    feats?: string[];
    special_abilities?: string[];
    spell_levels?: PathfinderSpellLevel[];
    dominios_escuela?: string;
}

export interface L5rSpell {
    id: string;
    name: string;
    masteryLevel: number;
    element: string; // "Tierra" | "Agua" | "Fuego" | "Aire" | "Vacío"
    duration: string;
    area: string;
    range: string;
    effect: string;
}

export interface L5rTechnique {
    id: string;
    rank: number;
    name: string;
    effect: string;
}

export interface L5rData {
    // General Info
    school?: string;
    rank?: number;
    experience_total?: number;
    experience_spent?: number;
    insight?: number; // Reconocimiento
    
    // Ring data: Tierra (Resistencia/Voluntad), Agua (Fuerza/Percepcion), Fuego (Agilidad/Inteligencia), Aire (Reflejos/Consciencia), Vacio (Anillo/Actual)
    void_points_max?: number;
    void_points_current?: number;
    
    // Health / Wound levels
    wounds_total?: number; // total wounds accumulated
    
    // Skills list
    skills?: Array<{
        id: string;
        name: string;
        rank: number;
        trait: string; // key attribute e.g. "res", "vol", "fue", "per", "agi", "int", "ref", "con"
        isSchoolSkill: boolean;
    }>;
    
    // Advantages and Disadvantages
    advantages?: Array<{ id: string; label: string; cost: number }>;
    disadvantages?: Array<{ id: string; label: string; cost: number }>;
    
    // Bushi Combat Modifiers
    armor_bonus?: number;
    reduction?: number;
    initiative_mod?: number;
    
    // Weapons
    weapons?: Array<{
        id: string;
        name: string;
        attack_roll: string; // e.g. "5g3"
        damage_roll: string; // e.g. "4g2"
        notes: string;
    }>;
    
    // Shugenja Spells
    spells?: L5rSpell[];
    techniques?: L5rTechnique[];
    school_affinity?: string;
    school_deficiency?: string;
    
    // Campaign
    allies_enemies?: Array<{
        id: string;
        name: string;
        status: string; // e.g. "0.0 a 10.0"
        devotion: string;
        relation: 'A' | 'H' | 'S'; // Amistoso, Hostil, Sin determinar
        notes: string;
    }>;
    goals_short?: string;
    goals_long?: string;
    campaign_notes?: string;
}

export interface TTRPGSheet {
    id: string;
    userId: string;
    system: string; // "Criatura de la Noche", "Fantasía Épica (5e)", "Sendas del Pionero", "Edad Oscura"
    
    // Header Personal Data (Cuadrícula 3x3)
    characterName: string; // Nombre
    player: string; // Jugador
    chronicle: string; // Crónica
    nature: string; // Naturaleza
    demeanor: string; // Conducta
    concept: string; // Concepto
    clan: string; // Clan
    generation: string; // Generación
    sire: string; // Sire

    sheet_data: TTRPGSheetData;
    description?: TTRPGDescription; // Datos físicos expandidos

    // Bottom sections
    backstory: string; // Historia text
    weakness: string; // Debilidad text
    notes: string; // Notas de Crónica text
    experience: {
        total: number;
        spent: number;
    };

    created_at: string;
    updated_at: string;
    
    // metadatos de sincronización offline
    dirty?: boolean;
    deleted?: boolean;
}
