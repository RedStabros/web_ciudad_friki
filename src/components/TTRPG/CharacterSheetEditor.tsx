import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TTRPGSheet, DotTrackerConfig } from '../../types/ttrpg';
import { TTRPGService } from '../../services/TTRPGService';
import { supabase } from '../../lib/supabase';
import {
    X, Shield, Moon, PawPrint, Sparkles, AlertTriangle,
    Cloud, RefreshCw, Dices, Coins, Zap
} from 'lucide-react';

interface CharacterSheetEditorProps {
    sheetId: string;
    userId: string;
    onClose: () => void;
}

export default function CharacterSheetEditor({ sheetId, userId, onClose }: CharacterSheetEditorProps) {
    const { t } = useTranslation();
    const [sheet, setSheet] = useState<TTRPGSheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Room Sync Code State & References
    const [roomCode, setRoomCode] = useState(() => localStorage.getItem(`cf_player_room_code_${sheetId}`) || '');
    const channelRef = useRef<any>(null);

    // Save Room Code to localstorage
    useEffect(() => {
        localStorage.setItem(`cf_player_room_code_${sheetId}`, roomCode);
    }, [roomCode, sheetId]);

    // Drawer and utility states
    const [showQuickRoller, setShowQuickRoller] = useState(false);
    const [diceQty, setDiceQty] = useState(1);
    const [quickRollResult, setQuickRollResult] = useState<{ rolls: number[]; sum: number } | null>(null);

    // Coin Flip state
    const [isFlipping, setIsFlipping] = useState(false);
    const [coinResult, setCoinResult] = useState<'Cara' | 'Cruz' | null>(null);

    // References for debouncing
    const isFirstLoad = useRef(true);
    const localSheetRef = useRef<TTRPGSheet | null>(null);

    // Supabase Channel Subscription for Room code
    useEffect(() => {
        if (!roomCode) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            return;
        }

        const roomName = `ttrpg_room_${roomCode.trim().toLowerCase()}`;
        const channel = supabase.channel(roomName);
        
        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Player subscribed to room: ${roomName}`);
                // Broadcast current sheet on join
                if (localSheetRef.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'sheet_update',
                        payload: localSheetRef.current
                    });
                }
            }
        });
        
        channelRef.current = channel;

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            channelRef.current = null;
        };
    }, [roomCode]);

    // Load sheet from Supabase
    useEffect(() => {
        const fetchSheet = async () => {
            try {
                const allSheets = await TTRPGService.loadSheets(userId);
                const found = allSheets.find(s => s.id === sheetId);
                if (found) {
                    setSheet(found);
                    localSheetRef.current = found;
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSheet();
    }, [sheetId, userId]);

    // Auto-save debounced handler (1200ms)
    useEffect(() => {
        if (!sheet) return;
        if (isFirstLoad.current) {
            isFirstLoad.current = false;
            return;
        }

        setSavingStatus('saving');
        const delayDebounce = setTimeout(async () => {
            try {
                await TTRPGService.saveSheet(sheet);
                setSavingStatus('saved');
                
                // Broadcast updated sheet payload on autosave
                if (channelRef.current && roomCode) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'sheet_update',
                        payload: sheet
                    });
                }

                setTimeout(() => {
                    setSavingStatus('idle');
                }, 1500);
            } catch (e) {
                console.error('Failed to autosave TTRPG sheet:', e);
                setSavingStatus('idle');
            }
        }, 1200);

        return () => clearTimeout(delayDebounce);
    }, [sheet]);

    const updateSheet = (updater: (prev: TTRPGSheet) => TTRPGSheet) => {
        setSheet(prev => {
            if (!prev) return prev;
            const next = updater(prev);
            localSheetRef.current = next;
            return next;
        });
    };

    const handleTextChange = (field: keyof TTRPGSheet, value: string) => {
        updateSheet(prev => ({
            ...prev,
            [field]: value
        }));
    };



    const handleTraitChange = (category: 'attributes' | 'abilities', subCategory: string, traitId: string, value: number) => {
        updateSheet(prev => {
            const list = prev.sheet_data[category][subCategory] || [];
            const updated = list.map((item: DotTrackerConfig) =>
                item.id === traitId ? { ...item, current_value: value } : item
            );
            return {
                ...prev,
                sheet_data: {
                    ...prev.sheet_data,
                    [category]: {
                        ...prev.sheet_data[category],
                        [subCategory]: updated
                    }
                }
            };
        });
    };

    const handleVirtueChange = (virtue: 'conscience' | 'self_control' | 'courage', value: number) => {
        updateSheet(prev => ({
            ...prev,
            sheet_data: {
                ...prev.sheet_data,
                virtues: {
                    ...prev.sheet_data.virtues,
                    [virtue]: value
                }
            }
        }));
    };

    const handleHealthCheckboxChange = (index: number, checked: boolean) => {
        updateSheet(prev => {
            const currentHealth = [...prev.sheet_data.health];
            currentHealth[index] = { ...currentHealth[index], checked };
            return {
                ...prev,
                sheet_data: {
                    ...prev.sheet_data,
                    health: currentHealth
                }
            };
        });
    };

    const handleBloodChange = (value: number) => {
        updateSheet(prev => ({
            ...prev,
            sheet_data: {
                ...prev.sheet_data,
                blood_pool: {
                    ...prev.sheet_data.blood_pool,
                    current: Math.max(0, Math.min(value, prev.sheet_data.blood_pool.max))
                }
            }
        }));
    };

    const handleWillpowerChange = (field: 'rating' | 'pool', value: number) => {
        updateSheet(prev => ({
            ...prev,
            sheet_data: {
                ...prev.sheet_data,
                willpower: {
                    ...prev.sheet_data.willpower,
                    [field]: Math.max(0, Math.min(value, 10))
                }
            }
        }));
    };

    const handleDndFieldChange = (field: string, value: any) => {
        updateSheet(prev => {
            const dnd = prev.sheet_data.dnd_data || {
                inspiration: false,
                proficiency_bonus: 2,
                ac: 10,
                initiative: 0,
                speed: '30 pies',
                hp_max: 10,
                hp_current: 10,
                hp_temp: 0,
                hit_dice_total: '1d6',
                hit_dice_current: '1d6',
                death_saves: { successes: 0, failures: 0 },
                passive_perception: 10
            };
            return {
                ...prev,
                sheet_data: {
                    ...prev.sheet_data,
                    dnd_data: {
                        ...dnd,
                        [field]: value
                    }
                }
            };
        });
    };

    // Quick roller
    const triggerQuickRoll = (faces: number) => {
        const rolls: number[] = [];
        let sum = 0;
        for (let i = 0; i < diceQty; i++) {
            const val = Math.floor(Math.random() * faces) + 1;
            rolls.push(val);
            sum += val;
        }
        setQuickRollResult({ rolls, sum });

        // Broadcast roll
        const rollPayload = {
            id: `roll_${Math.random().toString(36).substring(2, 11)}`,
            characterName: sheet?.characterName || 'Personaje',
            system: sheet?.system || 'Sistema',
            rolls,
            faces,
            sum,
            timestamp: Date.now(),
            label: `Lanzó ${diceQty}d${faces}`
        };

        if (channelRef.current && roomCode) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'dice_roll',
                payload: rollPayload
            });
        }
    };

    // Click trait roll
    const triggerTraitRoll = (label: string, value: number) => {
        let rolls: number[] = [];
        let sum = 0;
        let rollLabel = '';
        let faces = 10;

        if (sheet?.system === 'Fantasía Épica (5e)') {
            // DnD 5e attribute roll: 1d20 + mod
            const mod = Math.floor((value - 10) / 2);
            const val = Math.floor(Math.random() * 20) + 1;
            rolls = [val];
            sum = val + mod;
            faces = 20;
            rollLabel = `Lanzó ${label} (1d20 ${mod >= 0 ? `+${mod}` : mod})`;
        } else {
            // Gothic system: pool of d10s equal to value
            const numDice = Math.max(1, value);
            for (let i = 0; i < numDice; i++) {
                const val = Math.floor(Math.random() * 10) + 1;
                rolls.push(val);
                sum += val;
            }
            faces = 10;
            rollLabel = `Lanzó ${label} (${value})`;
        }

        // Show in the quick roller UI
        setQuickRollResult({ rolls, sum });
        setDiceQty(sheet?.system === 'Fantasía Épica (5e)' ? 1 : Math.max(1, value));
        setShowQuickRoller(true); // Open the drawer to show the results

        // Broadcast roll
        const rollPayload = {
            id: `roll_${Math.random().toString(36).substring(2, 11)}`,
            characterName: sheet?.characterName || 'Personaje',
            system: sheet?.system || 'Sistema',
            rolls,
            faces,
            sum,
            timestamp: Date.now(),
            label: rollLabel
        };

        if (channelRef.current && roomCode) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'dice_roll',
                payload: rollPayload
            });
        }
    };

    // Coin flipper
    const triggerCoinFlip = () => {
        if (isFlipping) return;
        setIsFlipping(true);
        setCoinResult(null);

        setTimeout(() => {
            setIsFlipping(false);
            const res = Math.random() > 0.5 ? 'Cara' : 'Cruz';
            setCoinResult(res);
        }, 1200);
    };

    const getSystemIcon = (system: string) => {
        switch (system) {
            case 'Criatura de la Noche':
            case 'Edad Oscura':
                return <Moon className="w-6 h-6 text-accent-red" />;
            case 'Hombre Lobo':
                return <PawPrint className="w-6 h-6 text-amber-500" />;
            case 'La Leyenda de los 5 Anillos (4a Ed)':
                return <Sparkles className="w-6 h-6 text-brand-secondary" />;
            default:
                return <Shield className="w-6 h-6 text-brand-primary" />;
        }
    };

    const isGothicSystem = sheet && ['Criatura de la Noche', 'Edad Oscura', 'Hombre Lobo'].includes(sheet.system);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-bg-main h-screen gap-4">
                <RefreshCw className="animate-spin text-brand-primary" size={40} />
                <p className="text-text-muted font-bold uppercase tracking-widest text-xs">{t('ttrpg.editor.loading', 'Cargando hoja de personaje...')}</p>
            </div>
        );
    }

    if (!sheet) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-bg-main h-screen p-8 text-center gap-6">
                <AlertTriangle size={56} className="text-accent-red animate-bounce" />
                <div>
                    <h2 className="text-2xl font-black text-text-main uppercase">{t('ttrpg.editor.notFound', 'Ficha no encontrada')}</h2>
                    <p className="text-text-muted text-sm mt-2">{t('ttrpg.editor.notFoundDesc', 'La hoja de personaje solicitada no pudo ser recuperada.')}</p>
                </div>
                <button onClick={onClose} className="px-6 py-3 bg-brand-primary text-text-inv font-black rounded-xl hover:bg-brand-primary-light transition">
                    {t('common.close')}
                </button>
            </div>
        );
    }

    const isGenericSystem = ['Sendas del Pionero', 'La Leyenda de los 5 Anillos (4a Ed)'].includes(sheet.system);

    return (
        <div className="flex-1 flex flex-col h-full bg-bg-main overflow-hidden relative">
            <style>{`
                @keyframes spin-sync {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .rotate-sync {
                    animation: spin-sync 1.5s infinite linear;
                }
                @keyframes flip-2d-coin {
                    0% { transform: scaleY(1); }
                    50% { transform: scaleY(0); }
                    100% { transform: scaleY(1); }
                }
                .coin-flipping-active {
                    animation: flip-2d-coin 0.2s infinite linear;
                }
                .spring-bounce {
                    animation: springBounce 0.4s ease-out;
                }
                @keyframes springBounce {
                    0% { transform: scale(0.3); }
                    70% { transform: scale(1.15); }
                    90% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
            `}</style>

            {/* TOP BAR / HEADER */}
            <header className="flex-shrink-0 bg-bg-side border-b border-divider-theme px-6 py-4 flex justify-between items-center shadow-lg relative z-30">
                <div className="flex items-center gap-4 min-w-0">
                    {getSystemIcon(sheet.system)}
                    <div className="min-w-0">
                        <h2 className="font-black text-text-main text-lg uppercase tracking-tight truncate">{sheet.characterName || 'Personaje Sin Nombre'}</h2>
                        <p className="text-xs text-text-muted truncate uppercase tracking-widest font-semibold">{sheet.system}</p>
                    </div>
                </div>

                {/* Sincronización Status */}
                <div className="flex items-center gap-4">
                    {/* Room Code Input */}
                    <div className="flex items-center gap-2 bg-bg-sub/50 px-3 py-1.5 rounded-xl border border-divider-theme">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Sala GM:</span>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={e => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            placeholder="código..."
                            className="bg-transparent border-none p-0 text-xs font-bold text-text-main focus:ring-0 focus:outline-none w-24"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {savingStatus === 'saving' && (
                            <div className="flex items-center gap-2 text-brand-secondary text-xs font-bold uppercase tracking-wider">
                                <RefreshCw className="w-3.5 h-3.5 rotate-sync" />
                                <span>{t('ttrpg.editor.saving', 'Guardando...')}</span>
                            </div>
                        )}
                        {savingStatus === 'saved' && (
                            <div className="flex items-center gap-2 text-accent-green text-xs font-bold uppercase tracking-wider">
                                <Cloud className="w-4 h-4" />
                                <span>{t('ttrpg.editor.saved', 'Guardado')}</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowQuickRoller(!showQuickRoller)}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition border
                            ${showQuickRoller
                                ? 'bg-brand-primary text-text-inv border-brand-primary shadow-lg shadow-brand-primary/20'
                                : 'bg-bg-sub/50 text-text-main border-divider-theme hover:bg-bg-sub'
                            }`}
                    >
                        <Dices size={14} />
                        {t('ttrpg.quickRoll', 'Dados')}
                    </button>

                    <button onClick={onClose} className="p-2 bg-bg-sub hover:bg-bg-sub/80 rounded-xl transition text-text-muted hover:text-text-main">
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* COLLAPSIBLE QUICK ROLLER DRAWER */}
            {showQuickRoller && (
                <div className="flex-shrink-0 bg-bg-side border-b border-divider-theme p-5 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-md relative z-25 animate-in slide-in-from-top duration-300">
                    {/* Dice Roller */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                            <Dices size={14} className="text-brand-primary" />
                            {t('ttrpg.roller.title', 'Quick Roller de Dados')}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">{t('ttrpg.quantity', 'Cantidad')}:</span>
                            <div className="flex items-center gap-1.5 flex-1">
                                {[1, 2, 3, 4, 5, 10].map(qty => (
                                    <button
                                        key={qty}
                                        onClick={() => setDiceQty(qty)}
                                        className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${diceQty === qty
                                            ? 'bg-brand-primary text-text-inv border-brand-primary'
                                            : 'bg-bg-sub/30 border-divider-theme text-text-muted hover:border-brand-primary/40'
                                        }`}
                                    >
                                        {qty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {[4, 6, 8, 10, 12, 20, 100].map(faces => (
                                <button
                                    key={faces}
                                    onClick={() => triggerQuickRoll(faces)}
                                    className="py-2 bg-bg-sub/20 hover:bg-brand-primary hover:text-text-inv border border-divider-theme rounded-xl font-bold text-xs transition"
                                >
                                    d{faces}
                                </button>
                            ))}
                        </div>

                        {quickRollResult && (
                            <div className="p-3 bg-bg-sub border border-divider-theme rounded-xl flex items-center justify-between text-sm animate-in zoom-in-95">
                                <div className="flex flex-wrap gap-1">
                                    {quickRollResult.rolls.map((r, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-bg-side border border-divider-theme rounded text-xs font-black text-brand-primary">
                                            {r}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-text-muted mr-2">Suma:</span>
                                    <span className="font-black text-text-main text-base">{quickRollResult.sum}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Elastic Coin Flipper */}
                    <div className="space-y-4 border-l border-divider-theme pl-6">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                            <Coins size={14} className="text-brand-secondary" />
                            {t('ttrpg.flipper.title', 'Lanzador de Moneda')}
                        </h4>

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <button
                                    onClick={triggerCoinFlip}
                                    disabled={isFlipping}
                                    className={`w-16 h-16 rounded-full border-4 border-amber-500 bg-gradient-to-br from-amber-400 to-amber-600 text-text-inv font-black flex items-center justify-center shadow-lg active:scale-95 transition-all
                                        ${isFlipping ? 'coin-flipping-active cursor-not-allowed' : 'hover:scale-105'}`}
                                >
                                    {isFlipping ? '?' : '🪙'}
                                </button>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-text-muted">{t('ttrpg.flipper.hint', 'Prueba tu suerte al cara o cruz')}</p>
                                {coinResult && !isFlipping && (
                                    <div className="text-lg font-black text-amber-500 uppercase tracking-wide spring-bounce flex items-center gap-1.5">
                                        <Zap size={16} className="text-amber-500" />
                                        <span>Resultado: {coinResult}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SCROLLABLE SHEET EDITOR BODY */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin">
                
                {/* GENERIC OR IN-DEVELOPMENT SYSTEMS */}
                {isGenericSystem && (
                    <div className="max-w-2xl mx-auto py-12 px-6 bg-bg-side rounded-[3rem] border border-divider-theme shadow-xl text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center mx-auto">
                            <Sparkles size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-text-main uppercase tracking-tighter italic">Ficha en Desarrollo</h3>
                            <p className="text-text-muted text-sm max-w-md mx-auto">
                                El sistema de juego <span className="font-bold text-text-sub">{sheet.system}</span> está en fase de desarrollo en Ciudad Friki Web. Su editor visual nativo estará disponible muy pronto.
                            </p>
                        </div>

                        <div className="border-t border-divider-theme/40 pt-6 space-y-4 max-w-sm mx-auto text-left text-xs bg-bg-sub/20 p-5 rounded-2xl border">
                            <h4 className="font-bold text-text-main uppercase tracking-wider mb-2">Metadatos de Personaje</h4>
                            <div className="grid grid-cols-2 gap-y-2 text-text-muted">
                                <span className="font-bold">Nombre:</span>
                                <input
                                    type="text"
                                    value={sheet.characterName}
                                    onChange={e => handleTextChange('characterName', e.target.value)}
                                    className="bg-transparent text-text-main font-bold border-b border-divider-theme focus:outline-none focus:border-brand-primary"
                                />
                                <span className="font-bold">Jugador:</span>
                                <input
                                    type="text"
                                    value={sheet.player}
                                    onChange={e => handleTextChange('player', e.target.value)}
                                    className="bg-transparent text-text-main border-b border-divider-theme focus:outline-none focus:border-brand-primary"
                                />
                                <span className="font-bold">Crónica:</span>
                                <input
                                    type="text"
                                    value={sheet.chronicle}
                                    onChange={e => handleTextChange('chronicle', e.target.value)}
                                    className="bg-transparent text-text-main border-b border-divider-theme focus:outline-none focus:border-brand-primary"
                                />
                                <span className="font-bold">Creación:</span>
                                <span>{new Date(sheet.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* GOTHIC SYSTEMS NATIVE VISUAL EDITOR (V20, EDAD OSCURA, HOMBRE LOBO) */}
                {isGothicSystem && (
                    <div className="max-w-4xl mx-auto space-y-10">
                        {/* 1. Header GRID (3x3) */}
                        <div className="bg-bg-side rounded-3xl p-6 border border-divider-theme shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nombre</label>
                                <input
                                    type="text"
                                    value={sheet.characterName}
                                    onChange={e => handleTextChange('characterName', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Jugador</label>
                                <input
                                    type="text"
                                    value={sheet.player}
                                    onChange={e => handleTextChange('player', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Crónica</label>
                                <input
                                    type="text"
                                    value={sheet.chronicle}
                                    onChange={e => handleTextChange('chronicle', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Naturaleza</label>
                                <input
                                    type="text"
                                    value={sheet.nature}
                                    onChange={e => handleTextChange('nature', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Conducta</label>
                                <input
                                    type="text"
                                    value={sheet.demeanor}
                                    onChange={e => handleTextChange('demeanor', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Concepto</label>
                                <input
                                    type="text"
                                    value={sheet.concept}
                                    onChange={e => handleTextChange('concept', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    {sheet.system === 'Hombre Lobo' ? 'Tribu' : 'Clan'}
                                </label>
                                <input
                                    type="text"
                                    value={sheet.clan}
                                    onChange={e => handleTextChange('clan', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    {sheet.system === 'Hombre Lobo' ? 'Rango' : 'Generación'}
                                </label>
                                <input
                                    type="text"
                                    value={sheet.generation}
                                    onChange={e => handleTextChange('generation', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    {sheet.system === 'Hombre Lobo' ? 'Auspicio / Raza' : 'Sire'}
                                </label>
                                <input
                                    type="text"
                                    value={sheet.sire}
                                    onChange={e => handleTextChange('sire', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                        </div>

                        {/* 2. ATRIBUTOS (Físicos, Sociales, Mentales) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-text-muted uppercase tracking-widest border-b border-divider-theme pb-2">Atributos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(sheet.sheet_data.attributes).map(([cat, list]) => (
                                    <div key={cat} className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-3">
                                        <h4 className="font-bold text-sm text-brand-primary uppercase border-b border-divider-theme/40 pb-1">{cat}</h4>
                                        <div className="space-y-2">
                                            {list.map(attr => (
                                                <div key={attr.id} className="flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => triggerTraitRoll(attr.label, attr.current_value)}
                                                        className="text-xs font-semibold text-text-sub hover:text-brand-primary transition-colors cursor-pointer text-left focus:outline-none"
                                                        title={`Lanzar ${attr.label}`}
                                                    >
                                                        {t('ttrpg.traits.' + attr.label, attr.label)}
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: attr.max_dots }).map((_, i) => {
                                                            const val = i + 1;
                                                            const active = val <= attr.current_value;
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    onClick={() => handleTraitChange('attributes', cat, attr.id, val === attr.current_value ? val - 1 : val)}
                                                                    className={`w-3.5 h-3.5 rounded-full border transition-all
                                                                        ${active ? 'bg-brand-primary border-brand-primary' : 'border-text-muted/30 hover:border-brand-primary/50'}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. HABILIDADES (Talentos, Técnicas, Conocimientos) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-text-muted uppercase tracking-widest border-b border-divider-theme pb-2">Habilidades</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(sheet.sheet_data.abilities).map(([cat, list]) => (
                                    <div key={cat} className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-3">
                                        <h4 className="font-bold text-sm text-brand-secondary uppercase border-b border-divider-theme/40 pb-1">{cat}</h4>
                                        <div className="space-y-2">
                                            {list.map(ability => (
                                                <div key={ability.id} className="flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => triggerTraitRoll(ability.label, ability.current_value)}
                                                        className="text-xs font-semibold text-text-sub hover:text-brand-secondary transition-colors cursor-pointer text-left focus:outline-none"
                                                        title={`Lanzar ${ability.label}`}
                                                    >
                                                        {t('ttrpg.traits.' + ability.label, ability.label)}
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: ability.max_dots }).map((_, i) => {
                                                            const val = i + 1;
                                                            const active = val <= ability.current_value;
                                                            return (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    onClick={() => handleTraitChange('abilities', cat, ability.id, val === ability.current_value ? val - 1 : val)}
                                                                    className={`w-3.5 h-3.5 rounded-full border transition-all
                                                                        ${active ? 'bg-brand-secondary border-brand-secondary' : 'border-text-muted/30 hover:border-brand-secondary/50'}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. VENTAJAS & OTROS (Virtudes, Fuerza de Voluntad, Sangre, Salud) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Ventajas & Pools */}
                            <div className="space-y-6">
                                {/* Virtudes (only for non-Werewolf) */}
                                {sheet.system !== 'Hombre Lobo' && (
                                    <div className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-4">
                                        <h4 className="font-bold text-sm text-text-main uppercase border-b border-divider-theme/40 pb-1">Virtudes</h4>
                                        <div className="space-y-3">
                                            {['conscience', 'self_control', 'courage'].map(vKey => {
                                                const vName = vKey === 'conscience' ? 'Conciencia / Convicción' : vKey === 'self_control' ? 'Autocontrol / Instinto' : 'Coraje';
                                                const value = sheet.sheet_data.virtues[vKey as 'conscience' | 'self_control' | 'courage'] || 1;
                                                return (
                                                    <div key={vKey} className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-text-sub">{vName}</span>
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: 5 }).map((_, i) => {
                                                                const val = i + 1;
                                                                const active = val <= value;
                                                                return (
                                                                    <button
                                                                        key={i}
                                                                        type="button"
                                                                        onClick={() => handleVirtueChange(vKey as any, val === value ? val - 1 : val)}
                                                                        className={`w-3.5 h-3.5 rounded-full border transition-all
                                                                            ${active ? 'bg-brand-primary border-brand-primary' : 'border-text-muted/30 hover:border-brand-primary/50'}`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Pools: Willpower & Blood Pool/Gnosis */}
                                <div className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-5">
                                    <h4 className="font-bold text-sm text-text-main uppercase border-b border-divider-theme/40 pb-1">Recursos</h4>
                                    
                                    {/* Willpower */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-text-sub">
                                            <span>Fuerza de Voluntad (Permanente)</span>
                                            <span className="text-brand-primary font-black">{sheet.sheet_data.willpower.rating}/10</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {Array.from({ length: 10 }).map((_, i) => {
                                                const val = i + 1;
                                                const active = val <= sheet.sheet_data.willpower.rating;
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => handleWillpowerChange('rating', val)}
                                                        className={`w-3.5 h-3.5 rounded-full border transition ${active ? 'bg-brand-primary border-brand-primary' : 'border-text-muted/30'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-text-sub pt-1">
                                            <span>Fuerza de Voluntad (Temporal/Gasto)</span>
                                            <span className="text-brand-secondary font-black">{sheet.sheet_data.willpower.pool}/10</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {Array.from({ length: 10 }).map((_, i) => {
                                                const val = i + 1;
                                                const active = val <= sheet.sheet_data.willpower.pool;
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => handleWillpowerChange('pool', val)}
                                                        className={`w-3.5 h-3.5 rounded border transition ${active ? 'bg-brand-secondary border-brand-secondary' : 'border-text-muted/30'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Blood Pool / Gnosis */}
                                    <div className="space-y-2 pt-2 border-t border-divider-theme/40">
                                        <div className="flex justify-between text-xs font-bold text-text-sub">
                                            <span>
                                                {sheet.system === 'Hombre Lobo' ? 'Gnosis (Reserva)' : 'Reserva de Sangre'}
                                            </span>
                                            <span className="text-amber-500 font-black">{sheet.sheet_data.blood_pool.current} / {sheet.sheet_data.blood_pool.max}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min={0}
                                                max={sheet.sheet_data.blood_pool.max}
                                                value={sheet.sheet_data.blood_pool.current}
                                                onChange={e => handleBloodChange(parseInt(e.target.value) || 0)}
                                                className="flex-1 accent-amber-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Health states checkboxes */}
                            <div className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-4">
                                <h4 className="font-bold text-sm text-text-main uppercase border-b border-divider-theme/40 pb-1">Salud & Heridas</h4>
                                <div className="divide-y divide-divider-theme/30">
                                    {sheet.sheet_data.health.map((state, idx) => (
                                        <div key={state.id} className="flex items-center justify-between py-2 text-xs">
                                            <span className="font-bold text-text-sub">{state.label}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] text-accent-red font-bold">
                                                    {state.penalty === 0 ? '0' : state.penalty === -99 ? 'Incapacitado' : `${state.penalty}`}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={state.checked}
                                                    onChange={e => handleHealthCheckboxChange(idx, e.target.checked)}
                                                    className="w-4 h-4 rounded text-brand-primary accent-brand-primary focus:ring-brand-primary"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. NARRATIVE TEXTAREAS (Backstory, Weakness, Notes) */}
                        <div className="bg-bg-side rounded-3xl p-6 border border-divider-theme shadow-md space-y-6">
                            <div className="space-y-2">
                                <h4 className="font-bold text-xs text-text-muted uppercase tracking-widest border-b border-divider-theme/40 pb-1">Trasfondo / Historia</h4>
                                <textarea
                                    rows={4}
                                    value={sheet.backstory}
                                    onChange={e => handleTextChange('backstory', e.target.value)}
                                    placeholder="Escribe la historia de tu personaje..."
                                    className="w-full bg-bg-sub/20 border border-divider-theme rounded-2xl p-4 text-sm text-text-main focus:outline-none focus:border-brand-primary resize-y"
                                />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-xs text-text-muted uppercase tracking-widest border-b border-divider-theme/40 pb-1">Debilidad de Clan / Tribu</h4>
                                <textarea
                                    rows={3}
                                    value={sheet.weakness}
                                    onChange={e => handleTextChange('weakness', e.target.value)}
                                    placeholder="Describe la debilidad racial o de clan..."
                                    className="w-full bg-bg-sub/20 border border-divider-theme rounded-2xl p-4 text-sm text-text-main focus:outline-none focus:border-brand-primary resize-y"
                                />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-xs text-text-muted uppercase tracking-widest border-b border-divider-theme/40 pb-1">Notas de la Crónica</h4>
                                <textarea
                                    rows={3}
                                    value={sheet.notes}
                                    onChange={e => handleTextChange('notes', e.target.value)}
                                    placeholder="Anotaciones de la campaña, objetivos o secretos..."
                                    className="w-full bg-bg-sub/20 border border-divider-theme rounded-2xl p-4 text-sm text-text-main focus:outline-none focus:border-brand-primary resize-y"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* DND 5E NATIVE VISUAL EDITOR */}
                {sheet.system === 'Fantasía Épica (5e)' && sheet.sheet_data.dnd_data && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
                        {/* Header Grid */}
                        <div className="bg-bg-side rounded-3xl p-6 border border-divider-theme shadow-md grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Nombre</label>
                                <input
                                    type="text"
                                    value={sheet.characterName}
                                    onChange={e => handleTextChange('characterName', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Clase de Conjuros</label>
                                <input
                                    type="text"
                                    value={sheet.sheet_data.dnd_data.spellcasting_class || ''}
                                    onChange={e => handleDndFieldChange('spellcasting_class', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Iniciativa</label>
                                <input
                                    type="number"
                                    value={sheet.sheet_data.dnd_data.initiative || 0}
                                    onChange={e => handleDndFieldChange('initiative', parseInt(e.target.value) || 0)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Velocidad</label>
                                <input
                                    type="text"
                                    value={sheet.sheet_data.dnd_data.speed || ''}
                                    onChange={e => handleDndFieldChange('speed', e.target.value)}
                                    className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-sm text-text-main focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                        </div>

                        {/* AC, HP and Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* AC, Speed & Proficiencies */}
                            <div className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-4 flex flex-col justify-between">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-text-sub">Clase de Armadura (AC)</span>
                                    <input
                                        type="number"
                                        value={sheet.sheet_data.dnd_data.ac}
                                        onChange={e => handleDndFieldChange('ac', parseInt(e.target.value) || 10)}
                                        className="w-16 px-2 py-1 bg-bg-sub border border-divider-theme rounded-lg text-center font-black text-brand-primary focus:outline-none"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-divider-theme/40">
                                    <span className="text-sm font-bold text-text-sub">Bono de Competencia</span>
                                    <input
                                        type="number"
                                        value={sheet.sheet_data.dnd_data.proficiency_bonus}
                                        onChange={e => handleDndFieldChange('proficiency_bonus', parseInt(e.target.value) || 2)}
                                        className="w-16 px-2 py-1 bg-bg-sub border border-divider-theme rounded-lg text-center font-black text-brand-secondary focus:outline-none"
                                    />
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-divider-theme/40">
                                    <span className="text-sm font-bold text-text-sub">Inspiración</span>
                                    <input
                                        type="checkbox"
                                        checked={sheet.sheet_data.dnd_data.inspiration}
                                        onChange={e => handleDndFieldChange('inspiration', e.target.checked)}
                                        className="w-5 h-5 rounded text-amber-500 accent-amber-500"
                                    />
                                </div>
                            </div>

                            {/* HP Tracker */}
                            <div className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-4">
                                <h4 className="font-bold text-xs text-text-muted uppercase tracking-widest border-b border-divider-theme/40 pb-1">Puntos de Vida (HP)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-text-muted font-bold block">HP Máximo</label>
                                        <input
                                            type="number"
                                            value={sheet.sheet_data.dnd_data?.hp_max || 10}
                                            onChange={e => handleDndFieldChange('hp_max', parseInt(e.target.value) || 10)}
                                            className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-center font-black text-text-main focus:outline-none focus:border-brand-primary"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-text-muted font-bold block">HP Actual</label>
                                        <input
                                            type="number"
                                            value={sheet.sheet_data.dnd_data?.hp_current ?? 10}
                                            onChange={e => handleDndFieldChange('hp_current', Math.min(sheet.sheet_data.dnd_data?.hp_max || 10, parseInt(e.target.value) || 0))}
                                            className="w-full bg-bg-sub/30 border border-divider-theme px-3 py-1.5 rounded-xl text-center font-black text-brand-primary focus:outline-none focus:border-brand-primary"
                                        />
                                    </div>
                                </div>
                                <div className="w-full bg-divider-theme/30 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-brand-primary h-full transition-all duration-300"
                                        style={{ width: `${Math.min(100, Math.max(0, ((sheet.sheet_data.dnd_data?.hp_current || 0) / (sheet.sheet_data.dnd_data?.hp_max || 10)) * 100))}%` }}
                                    />
                                </div>
                            </div>

                            {/* Attributes */}
                            <div className="bg-bg-side rounded-2xl p-5 border border-divider-theme space-y-3">
                                <h4 className="font-bold text-xs text-text-muted uppercase tracking-widest border-b border-divider-theme/40 pb-1">Atributos 5e</h4>
                                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                    {sheet.sheet_data.attributes['Atributos']?.map(attr => {
                                        const mod = Math.floor((attr.current_value - 10) / 2);
                                        return (
                                            <div key={attr.id} className="flex justify-between items-center text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => triggerTraitRoll(attr.label, attr.current_value)}
                                                    className="font-bold text-text-sub hover:text-brand-primary transition-colors cursor-pointer text-left focus:outline-none"
                                                    title={`Lanzar ${attr.label}`}
                                                >
                                                    {attr.label}
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={attr.current_value}
                                                        onChange={e => handleTraitChange('attributes', 'Atributos', attr.id, parseInt(e.target.value) || 10)}
                                                        className="w-12 px-2 py-0.5 bg-bg-sub border border-divider-theme rounded text-center text-text-main focus:outline-none"
                                                    />
                                                    <span className={`w-8 text-center font-black rounded ${mod >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                                                        {mod >= 0 ? `+${mod}` : mod}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Backstory & Personality */}
                        <div className="bg-bg-side rounded-3xl p-6 border border-divider-theme shadow-md space-y-4">
                            <h4 className="font-bold text-xs text-text-muted uppercase tracking-widest border-b border-divider-theme/40 pb-1">Detalles Narrativos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-text-muted font-bold">Rasgos de Personalidad</label>
                                    <textarea
                                        rows={3}
                                        value={sheet.sheet_data.dnd_data.personality_traits || ''}
                                        onChange={e => handleDndFieldChange('personality_traits', e.target.value)}
                                        className="w-full bg-bg-sub/20 border border-divider-theme rounded-xl p-3 text-xs text-text-main focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-text-muted font-bold">Ideales</label>
                                    <textarea
                                        rows={3}
                                        value={sheet.sheet_data.dnd_data.ideals || ''}
                                        onChange={e => handleDndFieldChange('ideals', e.target.value)}
                                        className="w-full bg-bg-sub/20 border border-divider-theme rounded-xl p-3 text-xs text-text-main focus:outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
