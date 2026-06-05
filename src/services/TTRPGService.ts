import { supabase } from '../lib/supabase';
import type { TTRPGSheet, TTRPGSheetData } from '../types/ttrpg';

export const TTRPGService = {
    /**
     * Resolves the maximum blood pool capacity and maximum spend rate per turn
     * based strictly on default gothic rulebook tables.
     */
    resolveBloodCaps: (genString: string): { max: number; perTurn: number } => {
        const match = genString.match(/\d+/);
        if (!match) return { max: 10, perTurn: 1 }; // Default 13th Gen

        const gen = parseInt(match[0], 10);

        if (gen >= 13) return { max: 10, perTurn: 1 };
        if (gen === 12) return { max: 11, perTurn: 1 };
        if (gen === 11) return { max: 12, perTurn: 1 };
        if (gen === 10) return { max: 13, perTurn: 1 };
        if (gen === 9) return { max: 14, perTurn: 2 };
        if (gen === 8) return { max: 15, perTurn: 3 };
        if (gen === 7) return { max: 20, perTurn: 4 };
        if (gen === 6) return { max: 30, perTurn: 6 };
        if (gen <= 5) return { max: 40, perTurn: 10 }; // Elder levels

        return { max: 10, perTurn: 1 };
    },

    /**
     * Heal a loaded sheet schema in case it was created with an older version of the schema
     */
    healSheetSchema: (sheet: any, userId: string): TTRPGSheet => {
        const now = new Date().toISOString();
        return {
            id: sheet.id || `sheet_${Math.random().toString(36).substring(2, 11)}`,
            userId: sheet.userId || userId,
            system: sheet.system || 'Criatura de la Noche',
            characterName: sheet.characterName || 'Nombre',
            player: sheet.player || 'Jugador',
            chronicle: sheet.chronicle || '',
            nature: sheet.nature || '',
            demeanor: sheet.demeanor || '',
            concept: sheet.concept || '',
            clan: sheet.clan || '',
            generation: sheet.generation || '13ª Generación',
            sire: sheet.sire || '',
            sheet_data: {
                attributes: sheet.sheet_data?.attributes || {},
                abilities: sheet.sheet_data?.abilities || {},
                disciplines: sheet.sheet_data?.disciplines || [],
                backgrounds: sheet.sheet_data?.backgrounds || [],
                virtues: {
                    conscience: sheet.sheet_data?.virtues?.conscience ?? 1,
                    self_control: sheet.sheet_data?.virtues?.self_control ?? 1,
                    courage: sheet.sheet_data?.virtues?.courage ?? 1,
                },
                humanity: {
                    value: sheet.sheet_data?.humanity?.value ?? 7,
                    bearing: sheet.sheet_data?.humanity?.bearing ?? 'Humanidad',
                    bearingValue: sheet.sheet_data?.humanity?.bearingValue ?? 1,
                },
                willpower: {
                    rating: sheet.sheet_data?.willpower?.rating ?? 5,
                    pool: sheet.sheet_data?.willpower?.pool ?? 5,
                },
                blood_pool: {
                    current: sheet.sheet_data?.blood_pool?.current ?? 10,
                    max: sheet.sheet_data?.blood_pool?.max ?? 10,
                    per_turn: sheet.sheet_data?.blood_pool?.per_turn ?? 1,
                },
                health: sheet.sheet_data?.health || [
                    { id: 'health_0', label: 'Magullado', penalty: 0, checked: false },
                    { id: 'health_1', label: 'Lastimado', penalty: -1, checked: false },
                    { id: 'health_2', label: 'Lesionado', penalty: -1, checked: false },
                    { id: 'health_3', label: 'Herido', penalty: -2, checked: false },
                    { id: 'health_4', label: 'Malherido', penalty: -2, checked: false },
                    { id: 'health_5', label: 'Tullido', penalty: -5, checked: false },
                    { id: 'health_6', label: 'Incapacitado', penalty: -99, checked: false }
                ],
                merits: sheet.sheet_data?.merits || [],
                flaws: sheet.sheet_data?.flaws || [],
                other_traits: sheet.sheet_data?.other_traits || [],
                combat: {
                    weapons: sheet.sheet_data?.combat?.weapons || [],
                    armor: {
                        name: sheet.sheet_data?.combat?.armor?.name || '',
                        rating: sheet.sheet_data?.combat?.armor?.rating ?? 0,
                        penalty: sheet.sheet_data?.combat?.armor?.penalty ?? 0
                    }
                },
                dnd_data: sheet.sheet_data?.dnd_data || undefined,
                pathfinder_data: sheet.sheet_data?.pathfinder_data || undefined,
                l5r_data: sheet.sheet_data?.l5r_data || undefined
            },
            description: {
                age: sheet.description?.age || '',
                apparentAge: sheet.description?.apparentAge || '',
                embrace: sheet.description?.embrace || '',
                hair: sheet.description?.hair || '',
                eyes: sheet.description?.eyes || '',
                gender: sheet.description?.gender || '',
                height: sheet.description?.height || '',
                weight: sheet.description?.weight || ''
            },
            backstory: sheet.backstory || '',
            weakness: sheet.weakness || '',
            notes: sheet.notes || '',
            experience: {
                total: sheet.experience?.total ?? 0,
                spent: sheet.experience?.spent ?? 0,
            },
            created_at: sheet.created_at || now,
            updated_at: sheet.updated_at || now,
            dirty: sheet.dirty ?? false,
            deleted: sheet.deleted ?? false,
        };
    },

    /**
     * Loads all TTRPG sheets for a given user from Supabase
     */
    loadSheets: async (userId: string): Promise<TTRPGSheet[]> => {
        try {
            const { data, error } = await supabase
                .from('ttrpg_sheets')
                .select('*')
                .eq('user_id', userId)
                .eq('deleted', false)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(row => {
                const sheet = row.payload;
                return TTRPGService.healSheetSchema(sheet, userId);
            });
        } catch (error) {
            console.error('Error loading TTRPG sheets from Supabase:', error);
            return [];
        }
    },

    /**
     * Saves a TTRPG sheet to Supabase
     */
    saveSheet: async (sheet: TTRPGSheet): Promise<void> => {
        try {
            const caps = TTRPGService.resolveBloodCaps(sheet.generation);
            
            const updatedSheet: TTRPGSheet = {
                ...sheet,
                sheet_data: {
                    ...sheet.sheet_data,
                    blood_pool: {
                        ...sheet.sheet_data.blood_pool,
                        max: caps.max,
                        per_turn: caps.perTurn,
                        current: Math.min(sheet.sheet_data.blood_pool.current, caps.max)
                    }
                },
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('ttrpg_sheets')
                .upsert({
                    id: sheet.id,
                    user_id: sheet.userId,
                    game_system: sheet.system,
                    name: sheet.characterName,
                    payload: updatedSheet,
                    updated_at: updatedSheet.updated_at,
                    deleted: false
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving TTRPG sheet to Supabase:', error);
            throw error;
        }
    },

    /**
     * Deletes a TTRPG sheet from Supabase (physical delete)
     */
    deleteSheet: async (sheetId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('ttrpg_sheets')
                .delete()
                .eq('id', sheetId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting TTRPG sheet from Supabase:', error);
            throw error;
        }
    },

    /**
     * Factory function that yields a pre-filled, highly accurate TTRPG character sheet
     */
    createDefaultSheet: (userId: string, playerName: string, characterName: string, isBlank = false, system = 'Criatura de la Noche'): TTRPGSheet => {
        let defaultData: TTRPGSheetData;

        if (system === 'Criatura de la Noche') {
            defaultData = {
                attributes: {
                    'Físicos': [
                        { id: 'str', label: 'Fuerza', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'dex', label: 'Destreza', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 4, is_pool_combinable: true },
                        { id: 'sta', label: 'Resistencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true }
                    ],
                    'Sociales': [
                        { id: 'cha', label: 'Carisma', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true },
                        { id: 'man', label: 'Manipulación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'app', label: 'Apariencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true }
                    ],
                    'Mentales': [
                        { id: 'per', label: 'Percepción', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'int', label: 'Inteligencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true },
                        { id: 'wits', label: 'Astucia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true }
                    ]
                },
                abilities: {
                    'Talentos': [
                        { id: 'alert', label: 'Alerta', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'athle', label: 'Atletismo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'street', label: 'Callejeo', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'consc', label: 'Consciencia', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'empa', label: 'Empatía', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'expre', label: 'Expresión', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'inti', label: 'Intimidación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'leader', label: 'Liderazgo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'brawl', label: 'Pelea', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'subter', label: 'Subterfugio', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true }
                    ],
                    'Técnicas': [
                        { id: 'firearms', label: 'Armas de Fuego', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'crafts', label: 'Artesanía', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'drive', label: 'Conducir', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'etiq', label: 'Etiqueta', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'performance', label: 'Interpretación', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'larceny', label: 'Latrocinio', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'melee', label: 'Pelea con Armas', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'stealth', label: 'Sigilo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'survival', label: 'Supervivencia', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'animalken', label: 'Trato con Animales', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true }
                    ],
                    'Conocimientos': [
                        { id: 'academics', label: 'Academicismo', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'science', label: 'Ciencias', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'finance', label: 'Finanzas', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'computer', label: 'Informática', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'investigation', label: 'Investigación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'law', label: 'Leyes', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'medicine', label: 'Medicina', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'occult', label: 'Ocultismo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'politics', label: 'Política', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'technology', label: 'Tecnología', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true }
                    ]
                },
                disciplines: isBlank ? [] : [
                    { id: 'cele', label: 'Celeridad', type: 'dot_tracker', max_dots: 5, current_value: 2, is_pool_combinable: true },
                    { id: 'pote', label: 'Potencia', type: 'dot_tracker', max_dots: 5, current_value: 1, is_pool_combinable: true }
                ],
                backgrounds: isBlank ? [] : [
                    { id: 'resources', label: 'Recursos', type: 'dot_tracker', max_dots: 5, current_value: 2, is_pool_combinable: false },
                    { id: 'herd', label: 'Rebaño', type: 'dot_tracker', max_dots: 5, current_value: 1, is_pool_combinable: false }
                ],
                virtues: {
                    conscience: isBlank ? 1 : 3,
                    self_control: isBlank ? 1 : 3,
                    courage: isBlank ? 1 : 4
                },
                humanity: {
                    value: 7,
                    bearing: 'Humanidad',
                    bearingValue: 1
                },
                willpower: {
                    rating: isBlank ? 5 : 6,
                    pool: isBlank ? 5 : 6
                },
                blood_pool: {
                    current: isBlank ? 10 : 12,
                    max: isBlank ? 10 : 15,
                    per_turn: isBlank ? 1 : 3
                },
                health: [
                    { id: 'health_0', label: 'Magullado', penalty: 0, checked: false },
                    { id: 'health_1', label: 'Lastimado', penalty: -1, checked: false },
                    { id: 'health_2', label: 'Lesionado', penalty: -1, checked: false },
                    { id: 'health_3', label: 'Herido', penalty: -2, checked: false },
                    { id: 'health_4', label: 'Malherido', penalty: -2, checked: false },
                    { id: 'health_5', label: 'Tullido', penalty: -5, checked: false },
                    { id: 'health_6', label: 'Incapacitado', penalty: -99, checked: false }
                ],
                merits: isBlank ? [] : [
                    { id: 'merit_1', label: 'Sentido Agudo', cost: 1 }
                ],
                flaws: isBlank ? [] : [
                    { id: 'flaw_1', label: 'Corto de Vista', cost: 1 }
                ],
                other_traits: isBlank ? [] : [
                    { id: 'custom_trait_1', label: 'Conducir Motos', type: 'dot_tracker', max_dots: 5, current_value: 2 }
                ],
                combat: {
                    weapons: isBlank ? [] : [
                        { id: 'weap_1', name: 'Pelea', difficulty: '6', damage: 'Fuerza cont.', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' },
                        { id: 'weap_2', name: 'Pistola Pesada', difficulty: '6', damage: '4 dados', range: '20m', rate: '2', ammo: '7', concealment: 'Bolsillo' }
                    ],
                    armor: {
                        name: isBlank ? '' : 'Chaqueta de cuero',
                        rating: isBlank ? 0 : 1,
                        penalty: 0
                    }
                }
            };
        } else if (system === 'Edad Oscura') {
            defaultData = {
                attributes: {
                    'Físicos': [
                        { id: 'str', label: 'Fuerza', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'dex', label: 'Destreza', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 4, is_pool_combinable: true },
                        { id: 'sta', label: 'Resistencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true }
                    ],
                    'Sociales': [
                        { id: 'cha', label: 'Carisma', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true },
                        { id: 'man', label: 'Manipulación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'app', label: 'Apariencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true }
                    ],
                    'Mentales': [
                        { id: 'per', label: 'Percepción', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'int', label: 'Inteligencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true },
                        { id: 'wits', label: 'Astucia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true }
                    ]
                },
                abilities: {
                    'Talentos': [
                        { id: 'alert', label: 'Alerta', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'athle', label: 'Atletismo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'consc', label: 'Consciencia', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'empa', label: 'Empatía', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'expre', label: 'Expresión', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'inti', label: 'Intimidación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'leader', label: 'Liderazgo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'brawl', label: 'Pelea', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'prest', label: 'Prestidigitación', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'subter', label: 'Subterfugio', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true }
                    ],
                    'Técnicas': [
                        { id: 'crafts', label: 'Artesanía', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'commer', label: 'Comercio', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'ride', label: 'Equitación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'etiq', label: 'Etiqueta', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'performance', label: 'Interpretación', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'melee', label: 'Pelea con Armas', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'stealth', label: 'Sigilo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'survival', label: 'Supervivencia', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'anim', label: 'T.c. Animales', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'archery', label: 'Tiro con Arco', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true }
                    ],
                    'Conocimientos': [
                        { id: 'academics', label: 'Academicismo', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'riddles', label: 'Enigmas', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'investigation', label: 'Investigación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'law', label: 'Leyes', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'medicine', label: 'Medicina', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'occult', label: 'Ocultismo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'politics', label: 'Política', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'wisdom', label: 'Sab. Popular', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'seneschal', label: 'Senescal', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'theology', label: 'Teología', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true }
                    ]
                },
                disciplines: isBlank ? [] : [
                    { id: 'cele', label: 'Celeridad', type: 'dot_tracker', max_dots: 5, current_value: 2, is_pool_combinable: true },
                    { id: 'pote', label: 'Potencia', type: 'dot_tracker', max_dots: 5, current_value: 1, is_pool_combinable: true }
                ],
                backgrounds: isBlank ? [] : [
                    { id: 'resources', label: 'Recursos', type: 'dot_tracker', max_dots: 5, current_value: 2, is_pool_combinable: false },
                    { id: 'herd', label: 'Rebaño', type: 'dot_tracker', max_dots: 5, current_value: 1, is_pool_combinable: false }
                ],
                virtues: {
                    conscience: isBlank ? 1 : 3,
                    self_control: isBlank ? 1 : 3,
                    courage: isBlank ? 1 : 4
                },
                humanity: {
                    value: 7,
                    bearing: 'Aura',
                    bearingValue: 1
                },
                willpower: {
                    rating: isBlank ? 5 : 6,
                    pool: isBlank ? 5 : 6
                },
                blood_pool: {
                    current: isBlank ? 10 : 12,
                    max: isBlank ? 10 : 15,
                    per_turn: isBlank ? 1 : 3
                },
                health: [
                    { id: 'health_0', label: 'Magullado', penalty: 0, checked: false },
                    { id: 'health_1', label: 'Lastimado', penalty: -1, checked: false },
                    { id: 'health_2', label: 'Lesionado', penalty: -1, checked: false },
                    { id: 'health_3', label: 'Herido', penalty: -2, checked: false },
                    { id: 'health_4', label: 'Malherido', penalty: -2, checked: false },
                    { id: 'health_5', label: 'Tullido', penalty: -5, checked: false },
                    { id: 'health_6', label: 'Incapacitado', penalty: -99, checked: false }
                ],
                merits: isBlank ? [] : [
                    { id: 'merit_1', label: 'Sentido Agudo', cost: 1 }
                ],
                flaws: isBlank ? [] : [
                    { id: 'flaw_1', label: 'Corto de Vista', cost: 1 }
                ],
                other_traits: isBlank ? [] : [
                    { id: 'custom_trait_1', label: 'Equitación de Combate', type: 'dot_tracker', max_dots: 5, current_value: 2 }
                ],
                combat: {
                    weapons: isBlank ? [] : [
                        { id: 'weap_1', name: 'Pelea', difficulty: '6', damage: 'Fuerza cont.', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' },
                        { id: 'weap_2', name: 'Espada Larga', difficulty: '6', damage: 'Fuerza + 3', range: 'Contacto', rate: '1', ammo: '-', concealment: 'Funda' }
                    ],
                    armor: {
                        name: isBlank ? '' : 'Cota de malla',
                        rating: isBlank ? 0 : 3,
                        penalty: 0
                    }
                }
            };
        } else if (system === 'Hombre Lobo') {
            defaultData = {
                attributes: {
                    'Físicos': [
                        { id: 'str', label: 'Fuerza', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'dex', label: 'Destreza', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 4, is_pool_combinable: true },
                        { id: 'sta', label: 'Resistencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true }
                    ],
                    'Sociales': [
                        { id: 'cha', label: 'Carisma', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true },
                        { id: 'man', label: 'Manipulación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'app', label: 'Apariencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true }
                    ],
                    'Mentales': [
                        { id: 'per', label: 'Percepción', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true },
                        { id: 'int', label: 'Inteligencia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 2, is_pool_combinable: true },
                        { id: 'wits', label: 'Astucia', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 1 : 3, is_pool_combinable: true }
                    ]
                },
                abilities: {
                    'Talentos': [
                        { id: 'alert', label: 'Alerta', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'athle', label: 'Atletismo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'street', label: 'Callejeo', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'empa', label: 'Empatía', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'expre', label: 'Expresión', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'prim', label: 'Impulso Primario', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'inti', label: 'Intimidación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'leader', label: 'Liderazgo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'brawl', label: 'Pelea', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'subter', label: 'Subterfugio', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true }
                    ],
                    'Técnicas': [
                        { id: 'firearms', label: 'Armas de Fuego', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'crafts', label: 'Artesanía', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'drive', label: 'Conducir', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'etiq', label: 'Etiqueta', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'performance', label: 'Interpretación', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'larceny', label: 'Latrocinio', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'melee', label: 'Pelea con Armas', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'stealth', label: 'Sigilo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 3, is_pool_combinable: true },
                        { id: 'survival', label: 'Supervivencia', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'animalken', label: 'Trato con Animales', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true }
                    ],
                    'Conocimientos': [
                        { id: 'academics', label: 'Academicismo', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'science', label: 'Ciencias', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'riddles', label: 'Enigmas', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'computer', label: 'Informática', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true },
                        { id: 'investigation', label: 'Investigación', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'law', label: 'Leyes', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'medicine', label: 'Medicina', type: 'dot_tracker', max_dots: 5, current_value: 0, is_pool_combinable: true },
                        { id: 'occult', label: 'Ocultismo', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'rituals', label: 'Rituales', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 2, is_pool_combinable: true },
                        { id: 'technology', label: 'Tecnología', type: 'dot_tracker', max_dots: 5, current_value: isBlank ? 0 : 1, is_pool_combinable: true }
                    ]
                },
                disciplines: isBlank ? [] : [
                    { id: 'gift_1', label: 'Garra Rozadora', type: 'dot_tracker', max_dots: 5, current_value: 2, is_pool_combinable: true },
                    { id: 'gift_2', label: 'Sentir la Gnosis', type: 'dot_tracker', max_dots: 5, current_value: 1, is_pool_combinable: true }
                ],
                backgrounds: isBlank ? [] : [
                    { id: 'contacts', label: 'Contactos', type: 'dot_tracker', max_dots: 5, current_value: 2, is_pool_combinable: false },
                    { id: 'fetish', label: 'Fetiche', type: 'dot_tracker', max_dots: 5, current_value: 1, is_pool_combinable: false }
                ],
                virtues: {
                    conscience: isBlank ? 1 : 3, // Gloria
                    self_control: isBlank ? 1 : 2, // Honor
                    courage: isBlank ? 1 : 3 // Sabiduría
                },
                humanity: {
                    value: 7, // Rabia
                    bearing: '',
                    bearingValue: 0
                },
                willpower: {
                    rating: isBlank ? 5 : 6,
                    pool: isBlank ? 5 : 6
                },
                blood_pool: {
                    current: isBlank ? 10 : 8, // Gnosis current
                    max: 10, // Gnosis max
                    per_turn: 0
                },
                health: [
                    { id: 'health_0', label: 'Magullado', penalty: 0, checked: false },
                    { id: 'health_1', label: 'Lastimado', penalty: -1, checked: false },
                    { id: 'health_2', label: 'Lesionado', penalty: -1, checked: false },
                    { id: 'health_3', label: 'Herido', penalty: -2, checked: false },
                    { id: 'health_4', label: 'Malherido', penalty: -2, checked: false },
                    { id: 'health_5', label: 'Tullido', penalty: -5, checked: false },
                    { id: 'health_6', label: 'Incapacitado', penalty: -99, checked: false }
                ],
                merits: isBlank ? [] : [
                    { id: 'merit_1', label: 'Sentido Agudo', cost: 1 }
                ],
                flaws: isBlank ? [] : [
                    { id: 'flaw_1', label: 'Corto de Vista', cost: 1 }
                ],
                other_traits: isBlank ? [] : [
                    { id: 'custom_trait_1', label: 'Rugido Aterrador', type: 'dot_tracker', max_dots: 5, current_value: 2 }
                ],
                combat: {
                    weapons: isBlank ? [] : [
                        { id: 'weap_1', name: 'Pelea', difficulty: '6', damage: 'Fuerza cont.', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' },
                        { id: 'weap_2', name: 'Garras (Crinos)', difficulty: '6', damage: 'Fuerza+2 agrav.', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' },
                        { id: 'weap_3', name: 'Mordisco (Crinos)', difficulty: '6', damage: 'Fuerza+1 agrav.', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' }
                    ],
                    armor: {
                        name: isBlank ? '' : 'Pelaje natural (Crinos)',
                        rating: isBlank ? 0 : 2,
                        penalty: 0
                    }
                }
            };
        } else if (system === 'Fantasía Épica (5e)') {
            defaultData = {
                attributes: {
                    'Atributos': [
                        { id: 'str', label: 'Fuerza', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 10, is_pool_combinable: true },
                        { id: 'dex', label: 'Destreza', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 16, is_pool_combinable: true },
                        { id: 'con', label: 'Constitución', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 12, is_pool_combinable: true },
                        { id: 'int', label: 'Inteligencia', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 14, is_pool_combinable: true },
                        { id: 'wis', label: 'Sabiduría', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 14, is_pool_combinable: true },
                        { id: 'cha', label: 'Carisma', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 10, is_pool_combinable: true }
                    ]
                },
                abilities: {
                    'Habilidades': [
                        { id: 'acro', label: 'Acrobacias', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'athl', label: 'Atletismo', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'arca', label: 'C. Arcano', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'dece', label: 'Engaño', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'hist', label: 'Historia', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'insg', label: 'Perspicacia', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'inti', label: 'Intimidación', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'inve', label: 'Investigación', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'medi', label: 'Medicina', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'natu', label: 'Naturaleza', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'perc', label: 'Percepción', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'perf', label: 'Interpretación', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'pers', label: 'Persuasión', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'reli', label: 'Religión', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'slei', label: 'Juego de Manos', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'stea', label: 'Sigilo', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'surv', label: 'Supervivencia', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'anim', label: 'Trato con Animales', type: 'dot_tracker', max_dots: 5, current_value: 0 }
                    ]
                },
                disciplines: [],
                backgrounds: [],
                virtues: { conscience: 0, self_control: 0, courage: 0 },
                humanity: { value: 0, bearing: '', bearingValue: 0 },
                willpower: { rating: 0, pool: 0 },
                blood_pool: { current: 0, max: 0, per_turn: 0 },
                health: [],
                merits: [],
                flaws: [],
                other_traits: [],
                combat: {
                    weapons: isBlank ? [] : [
                        { id: 'weap_1', name: 'Espada Corta', difficulty: '20', damage: '1d6 + 3 perf.', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' },
                        { id: 'weap_2', name: 'Arco Corto', difficulty: '20', damage: '1d6 + 3 perf.', range: '24/96 m', rate: '1', ammo: '20', concealment: '-' }
                    ],
                    armor: {
                        name: isBlank ? '' : 'Armadura de cuero tachonado',
                        rating: 12,
                        penalty: 0
                    }
                },
                dnd_data: {
                    inspiration: false,
                    proficiency_bonus: 2,
                    saving_throws_proficiencies: isBlank ? [] : ['dex', 'int'],
                    skills_proficiencies: isBlank ? [] : ['acro', 'stea', 'inve', 'perc', 'pers', 'slei'],
                    spellcasting_class: isBlank ? '' : 'Pícaro (Embaucador Arcano)',
                    spellcasting_ability: 'INT',
                    ac: isBlank ? 10 : 15,
                    initiative: isBlank ? 0 : 3,
                    speed: '30 pies',
                    hp_max: isBlank ? 10 : 9,
                    hp_current: isBlank ? 10 : 9,
                    hp_temp: 0,
                    hit_dice_total: isBlank ? '1d6' : '1d8',
                    hit_dice_current: isBlank ? '1d6' : '1d8',
                    death_saves: { successes: 0, failures: 0 },
                    passive_perception: isBlank ? 10 : 14,
                    other_proficiencies_languages: isBlank ? '' : 'Idiomas: Común, Élfico, Jerga de ladrones\nArmas: Sencillas, marciales (espadas cortas, estoques)\nArmaduras: Ligeras\nHerramientas: Herramientas de ladrón, cartas de juego',
                    personality_traits: isBlank ? '' : 'Me gusta tener un as en la manga y siempre planeo una ruta de escape. Valoro el ingenio por encima de la fuerza bruta.',
                    ideals: isBlank ? '' : 'Libertad. Nadie debería decirme qué hacer o cómo vivir mi vida.',
                    bonds: isBlank ? '' : 'Tengo una vieja deuda con un comerciante clandestino de la ciudad que me salvó la vida.',
                    flaws: isBlank ? '' : 'Tengo debilidad por los objetos brillantes y el dinero fácil, lo que constantemente me mete en problemas.',
                    features_traits: isBlank ? '' : 'Pericia (Expertise): Sigilo y Percepción (doble bono de competencia)\nAtaque Furtivo (Sneak Attack): +1d6 dados de daño con armas sutiles\nJerga de ladrones (Thieves\' Cant)',
                    additional_features_traits: isBlank ? '' : 'Visión en la oscuridad: 60 pies\nLinaje Élfico: Ventaja contra encanto y no duerme (trance)',
                    treasure: isBlank ? '' : 'Un colgante de plata con forma de hoja, 15 PO, 5 PP, 12 PC.',
                    allies_organizations: isBlank ? undefined : {
                        name: 'El Sindicato de la Sombra',
                        symbol_desc: 'Una moneda con una calavera tallada en el reverso',
                        text: 'Organización clandestina de contrabandistas y pícaros.'
                    },
                    spell_levels: isBlank ? [
                        { level: 0, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 1, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 2, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 3, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 4, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 5, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 6, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 7, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 8, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 9, slots_total: 0, slots_expended: 0, spells: [] }
                    ] : [
                        {
                            level: 0,
                            slots_total: 0,
                            slots_expended: 0,
                            spells: [
                                { id: 'sp_1', name: 'Mano de Mago (Embaucador)', prepared: true },
                                { id: 'sp_2', name: 'Ilusión Menor', prepared: true }
                            ]
                        },
                        {
                            level: 1,
                            slots_total: 2,
                            slots_expended: 0,
                            spells: [
                                { id: 'sp_3', name: 'Charm Person', prepared: true },
                                { id: 'sp_4', name: 'Disfrazarse', prepared: true },
                                { id: 'sp_5', name: 'Detección de Magia', prepared: false }
                            ]
                        },
                        { level: 2, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 3, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 4, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 5, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 6, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 7, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 8, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 9, slots_total: 0, slots_expended: 0, spells: [] }
                    ]
                }
            };
        } else if (system === 'Sendas del Pionero') {
            defaultData = {
                attributes: {
                    'Atributos': [
                        { id: 'str', label: 'Fuerza', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 16, is_pool_combinable: true },
                        { id: 'dex', label: 'Destreza', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 15, is_pool_combinable: true },
                        { id: 'con', label: 'Constitución', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 12, is_pool_combinable: true },
                        { id: 'int', label: 'Inteligencia', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 13, is_pool_combinable: true },
                        { id: 'wis', label: 'Sabiduría', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 12, is_pool_combinable: true },
                        { id: 'cha', label: 'Carisma', type: 'dot_tracker', max_dots: 30, current_value: isBlank ? 10 : 10, is_pool_combinable: true }
                    ]
                },
                abilities: {
                    'Habilidades': [
                        { id: 'acro', label: 'Acrobacias', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'crafts', label: 'Artesanía (Armas)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'insg', label: 'Averiguar intenciones', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'medi', label: 'Curar', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'pers', label: 'Diplomacia', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'disf', label: 'Disfrazarse', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'dece', label: 'Engaño', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'escap', label: 'Escapismo', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'perf', label: 'Interpretar', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'inti', label: 'Intimidar', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'disa', label: 'Inutilizar mecanismo', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'slei', label: 'Juego de manos', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'ling', label: 'Lingüística', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'ride', label: 'Montar', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'swim', label: 'Nadar', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'perc', label: 'Percepción', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'prof', label: 'Profesión', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_arca', label: 'Saber (arcano)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_dung', label: 'Saber (dungeons)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_geog', label: 'Saber (geografía)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_hist', label: 'Saber (historia)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_engi', label: 'Saber (ingeniería)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_loca', label: 'Saber (local)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_plan', label: 'Saber (los Planos)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_natu', label: 'Saber (Naturaleza)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_nobl', label: 'Saber (nobleza)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'kn_reli', label: 'Saber (religión)', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'stea', label: 'Sigilo', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'surv', label: 'Supervivencia', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'appr', label: 'Tasación', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'anim', label: 'Trato con animales', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'clim', label: 'Trepar', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'umagic', label: 'Usar objeto mágico', type: 'dot_tracker', max_dots: 5, current_value: 0 },
                        { id: 'fly', label: 'Volar', type: 'dot_tracker', max_dots: 5, current_value: 0 }
                    ]
                },
                disciplines: [],
                backgrounds: [],
                virtues: { conscience: 0, self_control: 0, courage: 0 },
                humanity: { value: 0, bearing: '', bearingValue: 0 },
                willpower: { rating: 0, pool: 0 },
                blood_pool: { current: 0, max: 0, per_turn: 0 },
                health: [],
                merits: [],
                flaws: [],
                other_traits: [],
                combat: {
                    weapons: isBlank ? [] : [
                        { id: 'weap_1', name: 'Espada Larga', difficulty: '20', damage: '1d8 + 3 cort.', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' },
                        { id: 'weap_2', name: 'Arco Corto', difficulty: '20', damage: '1d6 perf.', range: '18/72 m', rate: '1', ammo: '20', concealment: '-' }
                    ],
                    armor: {
                        name: isBlank ? '' : 'Cota de malla',
                        rating: 6,
                        penalty: -5
                    }
                },
                pathfinder_data: {
                    alignment: isBlank ? '' : 'Neutro Bueno',
                    deity: isBlank ? '' : 'Gorum',
                    homeland: isBlank ? '' : 'Bretoy',
                    size: isBlank ? 'Mediano' : 'Mediano',
                    gender: isBlank ? '' : 'Masculino',
                    hair: isBlank ? '' : 'Rubio',
                    eyes: isBlank ? '' : 'Azul',
                    ca_armadura: isBlank ? 0 : 6,
                    modescudo: 0,
                    armadura_natural: 0,
                    moddesvio: 0,
                    camodvarios: 0,
                    initiative_modvarios: 0,
                    speed_land: '30 pies',
                    speed_fly: '',
                    speed_fly_maneuver: '',
                    speed_swim: '',
                    speed_climb: '',
                    speed_burrow: '',
                    saves_details: {
                        fort: { base: isBlank ? 0 : 3, magic: 0, varios: 0, temporal: 0 },
                        ref: { base: isBlank ? 0 : 1, magic: 0, varios: 0, temporal: 0 },
                        will: { base: isBlank ? 0 : 1, magic: 0, varios: 0, temporal: 0 }
                    },
                    bab: isBlank ? '+0' : '+3',
                    sr: '-',
                    bmc_modvarios: 0,
                    dmc_modvarios: 0,
                    class_skills: isBlank ? [] : ['clim', 'ride', 'inti', 'anim', 'swim', 'crafts'],
                    skills_ranks: isBlank ? {} : { clim: 3, ride: 3, inti: 2, perc: 3, swim: 1 },
                    skills_varios: isBlank ? {} : { perc: 2 },
                    prof_simple: !isBlank,
                    prof_martial: !isBlank,
                    prof_shields: !isBlank,
                    prof_armor_light: !isBlank,
                    prof_armor_medium: !isBlank,
                    prof_armor_heavy: !isBlank,
                    prof_exotic1: '',
                    prof_exotic2: '',
                    prof_racial: '',
                    xp: isBlank ? '0' : '2500',
                    prestige_total: isBlank ? 0 : 4,
                    prestige_current: isBlank ? 0 : 4,
                    hero_points: isBlank ? 0 : 1,
                    fama: isBlank ? '' : 'Guerrero Valiente',
                    load_light: '76 lbs',
                    load_medium: '153 lbs',
                    load_heavy: '230 lbs',
                    load_overhead: '230 lbs',
                    load_floor: '460 lbs',
                    load_drag: '1150 lbs',
                    pc: isBlank ? '' : '12',
                    pp: isBlank ? '' : '5',
                    po: isBlank ? '' : '24',
                    ppt: isBlank ? '' : '0',
                    feats: isBlank ? [] : [
                        'Soltura con un arma (Espada Larga)',
                        'Duro de pelar (Diehard)',
                        'Ataque poderoso (Power Attack)'
                    ],
                    special_abilities: isBlank ? [] : [
                        'Entrenamiento en armadura (Armor Training 1)',
                        'Brio (Bravery +1)'
                    ],
                    spell_levels: [
                        { level: 0, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 1, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 2, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 3, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 4, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 5, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 6, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 7, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 8, slots_total: 0, slots_expended: 0, spells: [] },
                        { level: 9, slots_total: 0, slots_expended: 0, spells: [] }
                    ]
                }
            };
        } else {
            // La Leyenda de los 5 Anillos (4a Ed)
            defaultData = {
                attributes: {
                    'Características': [
                        { id: 'res', label: 'Resistencia', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 3, is_pool_combinable: true },
                        { id: 'vol', label: 'Voluntad', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 3, is_pool_combinable: true },
                        { id: 'fue', label: 'Fuerza', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 3, is_pool_combinable: true },
                        { id: 'per', label: 'Percepción', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 2, is_pool_combinable: true },
                        { id: 'agi', label: 'Agilidad', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 3, is_pool_combinable: true },
                        { id: 'int', label: 'Inteligencia', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 2, is_pool_combinable: true },
                        { id: 'ref', label: 'Reflejos', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 3, is_pool_combinable: true },
                        { id: 'con', label: 'Consciencia', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 2 : 2, is_pool_combinable: true }
                    ]
                },
                abilities: {
                    'Habilidades': [
                        { id: 'esgrima', label: 'Esgrima (Katana)', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 0 : 3 },
                        { id: 'defensa', label: 'Defensa', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 0 : 2 },
                        { id: 'atletismo', label: 'Atletismo', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 0 : 2 },
                        { id: 'batalla', label: 'Batalla', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 0 : 2 },
                        { id: 'etiqueta', label: 'Etiqueta', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 0 : 1 },
                        { id: 'teologia', label: 'Teología', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 0 : 1 },
                        { id: 'meditacion', label: 'Meditación', type: 'dot_tracker', max_dots: 10, current_value: isBlank ? 0 : 1 }
                    ]
                },
                disciplines: [],
                backgrounds: [],
                virtues: { conscience: 0, self_control: 0, courage: 0 },
                humanity: { value: 0, bearing: '', bearingValue: 0 },
                willpower: { rating: 0, pool: 0 },
                blood_pool: { current: 0, max: 0, per_turn: 0 },
                health: [],
                merits: [],
                flaws: [],
                other_traits: [],
                combat: {
                    weapons: isBlank ? [] : [
                        { id: 'weap_1', name: 'Katana de la Familia', difficulty: '10', damage: '5g2', range: 'Contacto', rate: '1', ammo: '-', concealment: '-' },
                        { id: 'weap_2', name: 'Arco Yumi', difficulty: '10', damage: '4g2', range: '20 m', rate: '1', ammo: '15', concealment: '-' }
                    ],
                    armor: {
                        name: isBlank ? '' : 'Armadura Pesada',
                        rating: 5,
                        penalty: 3
                    }
                },
                l5r_data: {
                    school: isBlank ? '' : 'Escuela de Bushi Mirumoto',
                    rank: isBlank ? 1 : 1,
                    experience_total: isBlank ? 0 : 30,
                    experience_spent: isBlank ? 0 : 25,
                    insight: isBlank ? 100 : 132,
                    void_points_max: isBlank ? 2 : 2,
                    void_points_current: isBlank ? 2 : 2,
                    wounds_total: 0,
                    skills: isBlank ? [] : [
                        { id: 'esgrima', name: 'Esgrima (Katana)', rank: 3, trait: 'agi', isSchoolSkill: true },
                        { id: 'defensa', name: 'Defensa', rank: 2, trait: 'ref', isSchoolSkill: true },
                        { id: 'atletismo', name: 'Atletismo', rank: 2, trait: 'fue', isSchoolSkill: true },
                        { id: 'batalla', name: 'Batalla', rank: 2, trait: 'per', isSchoolSkill: true },
                        { id: 'etiqueta', name: 'Etiqueta', rank: 1, trait: 'con', isSchoolSkill: false },
                        { id: 'teologia', name: 'Teología', rank: 1, trait: 'vol', isSchoolSkill: false },
                        { id: 'meditacion', name: 'Meditación', rank: 1, trait: 'vol', isSchoolSkill: false }
                    ],
                    advantages: isBlank ? [] : [
                        { id: 'adv_1', label: 'Reflejos Rápidos', cost: 5 }
                    ],
                    disadvantages: isBlank ? [] : [
                        { id: 'dis_1', label: 'Deuda de Honor', cost: 3 }
                    ],
                    armor_bonus: isBlank ? 0 : 5,
                    reduction: isBlank ? 0 : 3,
                    initiative_mod: 0,
                    weapons: isBlank ? [] : [
                        { id: 'weap_1', name: 'Katana de la Familia', attack_roll: '6g3', damage_roll: '6g2', notes: 'Arma de excelente calidad.' },
                        { id: 'weap_2', name: 'Wakizashi', attack_roll: '5g3', damage_roll: '5g2', notes: 'Espada corta de repuesto.' }
                    ],
                    spells: [],
                    techniques: [],
                    school_affinity: isBlank ? '' : 'Aire',
                    school_deficiency: isBlank ? '' : 'Tierra',
                    allies_enemies: isBlank ? [] : [
                        { id: 'ae_1', name: 'Hida Yakamo', status: '3.0', devotion: 'Lealtad', relation: 'A', notes: 'Gobernador provincial.' }
                    ],
                    goals_short: isBlank ? '' : 'Servir con honor a su señor feudal en la asamblea.',
                    goals_long: isBlank ? '' : 'Lograr el dominio absoluto del estilo Mirumoto de dos espadas.',
                    campaign_notes: isBlank ? '' : 'Comenzamos en las tierras del Clan Grulla bajo sospecha diplomática.'
                }
            };
        }

        const now = new Date().toISOString();
        const isMed = system === 'Edad Oscura';
        const isLobo = system === 'Hombre Lobo';
        const isPathfinder = system === 'Sendas del Pionero';
        const isL5r = system === 'La Leyenda de los 5 Anillos (4a Ed)';

        return {
            id: `sheet_${Math.random().toString(36).substring(2, 11)}`,
            userId,
            system,
            characterName,
            player: isBlank ? '' : playerName,
            chronicle: isBlank ? '' : (isMed ? 'Crónica del Medievo' : isLobo ? 'Protectores de Gaia' : isPathfinder ? 'El auge de los señores de las runas' : isL5r ? 'La Senda del Imperio' : 'Crónica Nocturna'),
            nature: isBlank ? '' : (isLobo ? 'Metis' : isPathfinder ? 'Fiel' : isL5r ? 'Familia Mirumoto' : 'Rebelde'),
            demeanor: isBlank ? '' : (isLobo ? 'Ahroun' : isPathfinder ? 'Protector' : isL5r ? 'Samurái Devoto' : 'Confidente'),
            concept: isBlank ? '' : (isMed ? 'Caballero Templario' : isLobo ? 'Lobo de la Guerra' : isPathfinder ? 'Campeón de Gorum' : isL5r ? 'Duelista Kenshin' : 'Guerrero de la Noche'),
            clan: isBlank ? '' : (isMed ? 'Vanguardia' : isLobo ? 'Camada de Fenris' : isPathfinder ? 'Guerrero' : isL5r ? 'Clan Dragón' : 'Rebelde'),
            generation: isBlank ? (isLobo ? 'Rango 1' : isPathfinder ? 'Nivel 1' : isL5r ? 'Rango 1' : '13ª Generación') : (isLobo ? 'Rango 2 (Fostern)' : isPathfinder ? 'Nivel 3' : isL5r ? 'Rango de Reconocimiento 1' : '8ª Generación'),
            sire: isBlank ? '' : (isMed ? 'Marcus Gilder' : isLobo ? 'Guerrero de Gaia' : isPathfinder ? 'Entrenador de combate' : isL5r ? 'Mirumoto Kei (Sensei)' : 'Marcus Tepes'),

            sheet_data: defaultData,
            description: {
                age: isBlank ? '' : (isMed ? '32 años' : isLobo ? '8 años (Lupus)' : isPathfinder ? '28 años' : isL5r ? '20 años' : '320 años'),
                apparentAge: isBlank ? '' : (isLobo ? 'Adulto' : isPathfinder ? 'Adulto' : isL5r ? 'Joven' : '25 años'),
                embrace: isBlank ? '' : (isMed ? 'Año 1204' : isLobo ? 'Primer Cambio' : isPathfinder ? 'Iniciado de Gorum' : isL5r ? 'Ceremonia Gempukku' : 'Año 1706'),
                hair: isBlank ? '' : (isLobo ? 'Pelaje Gris y Rojo' : isPathfinder ? 'Rubio' : isL5r ? 'Negro recogido' : 'Negro azabache'),
                eyes: isBlank ? '' : (isLobo ? 'Amarillo ámbar' : isPathfinder ? 'Azul' : isL5r ? 'Marrón oscuro' : 'Rojo carmesí'),
                gender: isBlank ? '' : 'Masculino',
                height: isBlank ? '' : (isLobo ? '2.10 m' : isPathfinder ? '1.82 m' : isL5r ? '1.74 m' : '1.85 m'),
                weight: isBlank ? '' : (isLobo ? '135 kg' : isPathfinder ? '86 kg' : isL5r ? '68 kg' : '78 kg')
            },
            
            backstory: isBlank ? '' : (isMed ? 'Guerrero consagrado que busca redención en la noche medieval.' : isLobo ? 'Nacido bajo la luz de la luna llena, lucha por la preservación de Gaia contra el Wyrm.' : isPathfinder ? 'Un curtido soldado de fortuna de los Reinos de los Reyes Fluviales, Valeros busca la gloria y servir a su dios de la guerra en el campo de batalla.' : isL5r ? 'Un joven duelista de la familia Mirumoto de carácter noble y estricto apego al código del Bushido.' : 'Nacido en la nobleza de Transilvania, Alucard fue transformado para servir como protector eterno de su linaje.'),
            weakness: isBlank ? '' : (isMed ? 'Código de Honor: Penalizaciones si rompe sus votos caballerescos.' : isLobo ? 'Cicatrices de batalla y deformidad Metis visible.' : isPathfinder ? 'Orgullo: Dificultad para retirarse de un combate honorable.' : isL5r ? 'Código Bushido: Penalización a tiradas sociales si vulnera su honor.' : 'Furia Ancestral: Penalizaciones a tiradas de autocontrol para resistir el frenesí.'),
            notes: isBlank ? '' : 'Sesión 1: Llegada a la ciudad y primer encuentro con el Príncipe.',
            experience: {
                total: isBlank ? 0 : 25,
                spent: isBlank ? 0 : 18
            },

            created_at: now,
            updated_at: now
        };
    }
};
