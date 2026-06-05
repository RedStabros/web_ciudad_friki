import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { TTRPGSheet } from '../types/ttrpg';
import { SEO } from '../components/SEO';

import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import {
    Shield, Moon, PawPrint, Sparkles, Users,
    Wifi, WifiOff, Copy, Trash2, Dices, X, Loader2
} from 'lucide-react';

interface WatchedSheet extends TTRPGSheet {
    last_updated_at?: number;
    is_online?: boolean;
}

interface RollLogItem {
    id: string;
    characterName: string;
    system: string;
    rolls: number[];
    faces: number;
    sum: number;
    timestamp: number;
    label?: string;
}

export default function GMScreen() {
    const { t } = useTranslation();
    const { profile, ttrpg, featuresLoading } = useApp();

    // GM Config
    const [roomCode, setRoomCode] = useState(() => localStorage.getItem('cf_gm_room_code') || 'mesa_ciudad_friki');
    const [isSharing, setIsSharing] = useState(false);

    // Connected Sheets & Rolls
    const [playerSheets, setPlayerSheets] = useState<Record<string, WatchedSheet>>({});
    const [rollsLog, setRollsLog] = useState<RollLogItem[]>([]);

    if (featuresLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={32} />
                <p className="text-text-muted font-bold uppercase tracking-widest text-xs">Cargando...</p>
            </div>
        );
    }

    if (!ttrpg && profile?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center px-8 max-w-md mx-auto">
                <Dices className="w-24 h-24 text-text-muted opacity-30 mb-6 mx-auto animate-pulse" />
                <h2 className="text-2xl font-black text-text-main uppercase tracking-tight italic">{t('ttrpg.closed', 'Mesa de Rol Cerrada')}</h2>
                <p className="text-text-muted mt-2 text-sm">{t('ttrpg.closedSubtitle', 'La mesa de rol (TTRPG) y la pantalla de GM están desactivadas temporalmente.')}</p>
            </div>
        );
    }

    useEffect(() => {
        localStorage.setItem('cf_gm_room_code', roomCode);
    }, [roomCode]);

    // Supabase Realtime Broadcast Channel for Room sync
    useEffect(() => {
        if (!roomCode) return;
        
        setIsSharing(true);
        const roomName = `ttrpg_room_${roomCode.trim()}`;
        const channel = supabase.channel(roomName, {
            config: { broadcast: { self: false } }
        });

        // Listen for player updates
        channel.on('broadcast', { event: 'sheet_update' }, (payload) => {
            const updatedSheet = payload.payload as TTRPGSheet;
            if (updatedSheet) {
                setPlayerSheets(prev => ({
                    ...prev,
                    [updatedSheet.id]: {
                        ...prev[updatedSheet.id],
                        ...updatedSheet,
                        last_updated_at: Date.now(),
                        is_online: true
                    }
                }));
            }
        });

        // Listen for player rolls
        channel.on('broadcast', { event: 'dice_roll' }, (payload) => {
            const roll = payload.payload as RollLogItem;
            if (roll) {
                setRollsLog(prev => [roll, ...prev].slice(0, 50));
                
                // Also update online status for that character sheet if present
                if (roll.characterName) {
                    setPlayerSheets(prev => {
                        const match = Object.values(prev).find(s => s.characterName === roll.characterName);
                        if (match) {
                            return {
                                ...prev,
                                [match.id]: {
                                    ...prev[match.id],
                                    is_online: true,
                                    last_updated_at: Date.now()
                                }
                            };
                        }
                        return prev;
                    });
                }
            }
        });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log(`Connected to GM Screen room: ${roomName}`);
            }
        });

        return () => {
            setIsSharing(false);
            supabase.removeChannel(channel);
        };
    }, [roomCode]);

    // Supabase Realtime Postgres Changes for database update sync
    useEffect(() => {
        const dbChannel = supabase.channel('ttrpg_db_gm_monitor')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'ttrpg_sheets'
            }, (payload) => {
                const remoteSheet = payload.new.payload as TTRPGSheet;
                if (remoteSheet) {
                    setPlayerSheets(prev => {
                        if (prev[remoteSheet.id]) {
                            return {
                                ...prev,
                                [remoteSheet.id]: {
                                    ...prev[remoteSheet.id],
                                    ...remoteSheet,
                                    last_updated_at: Date.now()
                                }
                            };
                        }
                        return prev;
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(dbChannel);
        };
    }, []);

    // Set offline state after 30 seconds of inactivity
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setPlayerSheets(prev => {
                let changed = false;
                const updated = { ...prev };
                Object.keys(updated).forEach(id => {
                    const sheet = updated[id];
                    if (sheet.is_online && sheet.last_updated_at && now - sheet.last_updated_at > 35000) {
                        updated[id] = { ...sheet, is_online: false };
                        changed = true;
                    }
                });
                return changed ? updated : prev;
            });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const copyInviteLink = () => {
        navigator.clipboard.writeText(roomCode);
        alert(`Código de sala copiado: ${roomCode}. Compártelo con tus jugadores para que lo configuren en sus fichas.`);
    };

    const getSystemIcon = (system: string) => {
        switch (system) {
            case 'Criatura de la Noche':
            case 'Edad Oscura':
                return <Moon className="w-4 h-4 text-accent-red" />;
            case 'Hombre Lobo':
                return <PawPrint className="w-4 h-4 text-amber-500" />;
            case 'La Leyenda de los 5 Anillos (4a Ed)':
                return <Sparkles className="w-4 h-4 text-brand-secondary" />;
            default:
                return <Shield className="w-4 h-4 text-brand-primary" />;
        }
    };

    const removeSheetFromMonitor = (sheetId: string) => {
        setPlayerSheets(prev => {
            const copy = { ...prev };
            delete copy[sheetId];
            return copy;
        });
    };

    const sheetsList = Object.values(playerSheets);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-500">
            <SEO
                title="GM Screen - Director de Juego - Ciudad Friki"
                description="Visualiza las fichas de tus jugadores y sus tiradas de dados en tiempo real."
            />

            {/* HEADER ROW */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-divider-theme pb-6">
                <div>
                    <h1 className="text-4xl font-black text-text-main uppercase tracking-tighter italic flex items-center gap-2.5">
                        <Users className="text-brand-primary w-8 h-8" />
                        GM Screen / Director de Juego
                    </h1>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">Monitoreo y tiradas en tiempo real</p>
                </div>

                {/* ROOM CONTROLS */}
                <div className="flex items-center gap-3 w-full md:w-auto bg-bg-side p-3 rounded-2xl border border-divider-theme shadow-sm">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest pl-2">Mesa GM:</span>
                    <input
                        type="text"
                        value={roomCode}
                        onChange={e => setRoomCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        className="bg-bg-sub border border-divider-theme px-3 py-1.5 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:border-brand-primary max-w-[160px]"
                    />
                    <button
                        onClick={copyInviteLink}
                        className="p-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-text-inv rounded-xl transition-all"
                        title="Copiar código"
                    >
                        <Copy size={16} />
                    </button>
                    {isSharing ? (
                        <span className="w-2.5 h-2.5 bg-accent-green rounded-full animate-pulse mr-2" title="Sala Activa" />
                    ) : (
                        <span className="w-2.5 h-2.5 bg-accent-red rounded-full mr-2" title="Sala Desconectada" />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* HORIZONTAL WIDE GRID FOR CHARACTER SHEETS */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-text-main text-lg uppercase tracking-tight">Fichas de Jugadores ({sheetsList.length})</h3>
                        {sheetsList.length > 0 && (
                            <button
                                onClick={() => setPlayerSheets({})}
                                className="text-xs font-bold text-accent-red hover:underline flex items-center gap-1"
                            >
                                <Trash2 size={12} />
                                Limpiar Monitor
                            </button>
                        )}
                    </div>

                    {sheetsList.length === 0 ? (
                        <div className="py-24 bg-bg-side rounded-[3rem] border border-divider-theme text-center p-8 space-y-4">
                            <WifiOff size={48} className="mx-auto text-text-muted opacity-30 animate-pulse" />
                            <div className="space-y-1">
                                <p className="font-bold text-text-muted">Esperando conexiones de jugadores...</p>
                                <p className="text-xs text-text-muted max-w-sm mx-auto">
                                    Pide a tus jugadores que escriban el código de sala <span className="font-bold text-brand-primary bg-bg-sub px-1.5 py-0.5 rounded">{roomCode}</span> en su editor de fichas web o móvil. Sus estadísticas se sincronizarán al instante.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {sheetsList.map(sheet => {
                                const hpCur = sheet.sheet_data.dnd_data?.hp_current ?? 1;
                                const hpMax = sheet.sheet_data.dnd_data?.hp_max ?? 1;
                                const hpPct = Math.min(100, Math.max(0, (hpCur / hpMax) * 100));

                                return (
                                    <div
                                        key={sheet.id}
                                        className="bg-bg-side border border-divider-theme rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 border-l-4 border-l-brand-primary"
                                    >
                                        {/* Status Header */}
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="min-w-0">
                                                <h4 className="font-black text-text-main text-base truncate">{sheet.characterName}</h4>
                                                <p className="text-xs text-text-muted truncate flex items-center gap-1.5 uppercase font-semibold">
                                                    {getSystemIcon(sheet.system)}
                                                    <span>{sheet.system}</span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-text-muted bg-bg-sub/60 px-2 py-0.5 rounded-full font-bold">
                                                    @{sheet.player || 'Sin jugador'}
                                                </span>
                                                <button
                                                    onClick={() => removeSheetFromMonitor(sheet.id)}
                                                    className="p-1 hover:bg-bg-sub rounded text-text-muted hover:text-accent-red transition"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Gothic Systems quick summary */}
                                        {['Criatura de la Noche', 'Edad Oscura', 'Hombre Lobo'].includes(sheet.system) && (
                                            <div className="grid grid-cols-2 gap-3 text-xs bg-bg-sub/30 p-3 rounded-2xl border border-divider-theme/40">
                                                <div>
                                                    <p className="text-[10px] text-text-muted font-bold uppercase">Sangre / Gnosis</p>
                                                    <p className="font-black text-amber-500 text-sm">{sheet.sheet_data.blood_pool.current} / {sheet.sheet_data.blood_pool.max}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-text-muted font-bold uppercase">Voluntad</p>
                                                    <p className="font-black text-brand-primary text-sm">{sheet.sheet_data.willpower.pool} / {sheet.sheet_data.willpower.rating}</p>
                                                </div>
                                                <div className="col-span-2 pt-1 border-t border-divider-theme/30 flex justify-between items-center">
                                                    <span className="text-[10px] text-text-muted font-bold uppercase">Heridas marcadas</span>
                                                    <span className="font-bold text-accent-red">
                                                        {sheet.sheet_data.health.filter(h => h.checked).length} / 7
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* DND 5e quick summary */}
                                        {sheet.system === 'Fantasía Épica (5e)' && sheet.sheet_data.dnd_data && (
                                            <div className="space-y-2.5 bg-bg-sub/30 p-3 rounded-2xl border border-divider-theme/40">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-text-muted">Puntos de Vida</span>
                                                    <span className="font-black text-brand-primary">{hpCur} / {hpMax}</span>
                                                </div>
                                                <div className="w-full bg-divider-theme/30 h-2 rounded-full overflow-hidden">
                                                    <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase pt-1">
                                                    <span>AC: <span className="text-text-main font-black">{sheet.sheet_data.dnd_data.ac}</span></span>
                                                    <span>Inic: <span className="text-text-main font-black">+{sheet.sheet_data.dnd_data.initiative}</span></span>
                                                    <span>Velocidad: <span className="text-text-main font-black">{sheet.sheet_data.dnd_data.speed}</span></span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Generic sheets */}
                                        {!['Criatura de la Noche', 'Edad Oscura', 'Hombre Lobo', 'Fantasía Épica (5e)'].includes(sheet.system) && (
                                            <div className="text-xs bg-bg-sub/30 p-3 rounded-2xl border border-divider-theme/40 text-text-muted italic text-center">
                                                Visualizando metadatos básicos. Edición en desarrollo.
                                            </div>
                                        )}

                                        {/* Status Online indicator */}
                                        <div className="flex justify-between items-center pt-2 border-t border-divider-theme/40 text-[10px] text-text-muted">
                                            <span>Sincronizado: {new Date(sheet.updated_at).toLocaleTimeString()}</span>
                                            {sheet.is_online ? (
                                                <span className="flex items-center gap-1 text-accent-green font-bold uppercase">
                                                    <Wifi size={10} /> En línea
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-text-muted font-bold uppercase">
                                                    <WifiOff size={10} /> Ausente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* GAME MASTER ROLLS LOG */}
                <div className="space-y-6">
                    <h3 className="font-black text-text-main text-lg uppercase tracking-tight flex items-center gap-2">
                        <Dices className="text-brand-primary w-5 h-5" />
                        Historial de Tiradas
                    </h3>

                    <div className="bg-bg-side border border-divider-theme rounded-3xl p-5 shadow-xl flex flex-col h-[500px]">
                        {rollsLog.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-40">
                                <Dices size={36} className="text-text-muted mb-2 animate-pulse" />
                                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Sin tiradas aún</p>
                                <p className="text-[10px] text-text-muted mt-1">Los dados lanzados por jugadores suscritos aparecerán aquí.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                                {rollsLog.map((log) => (
                                    <div key={log.id} className="p-3 bg-bg-sub/40 border border-divider-theme rounded-xl space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-black text-brand-primary truncate max-w-[120px]">@{log.characterName}</span>
                                            <span className="text-text-muted font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        </div>
                                        <p className="text-xs text-text-muted italic leading-tight">
                                            {log.label || `Lanzó ${log.rolls.length}d${log.faces}`}
                                        </p>
                                        <div className="flex justify-between items-center pt-1 border-t border-divider-theme/40">
                                            <div className="flex flex-wrap gap-1">
                                                {log.rolls.map((r, idx) => (
                                                    <span key={idx} className="inline-block px-1.5 py-0.2 bg-bg-side border border-divider-theme rounded text-[10px] font-black text-text-main">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className="text-sm font-black text-brand-secondary">
                                                = {log.sum}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
