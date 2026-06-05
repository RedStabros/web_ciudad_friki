import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { TTRPGService } from '../services/TTRPGService';
import type { TTRPGSheet } from '../types/ttrpg';
import CharacterSheetEditor from '../components/TTRPG/CharacterSheetEditor';
import { SEO } from '../components/SEO';
import {
    Dices, Search, Plus, Trash2, Moon, PawPrint, Shield, Sparkles,
    ChevronDown, RefreshCw, Eye, BookOpen,
    User, Info, X
} from 'lucide-react';



export default function TTRPGPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { profile, ttrpg, featuresLoading } = useApp();

    // Sheets list
    const [sheets, setSheets] = useState<TTRPGSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});

    // Modals
    const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

    // Dice rolling
    const [diceQty, setDiceQty] = useState(1);
    const [rollResult, setRollResult] = useState<{
        qty: number;
        faces: number;
        rolls: number[];
        sum: number;
    } | null>(null);

    if (featuresLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <RefreshCw className="animate-spin text-brand-primary" size={32} />
                <p className="text-text-muted font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
            </div>
        );
    }

    if (!ttrpg && profile?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center px-8 max-w-md mx-auto">
                <Dices className="w-24 h-24 text-text-muted opacity-30 mb-6 mx-auto animate-pulse" />
                <h2 className="text-2xl font-black text-text-main uppercase tracking-tight italic">{t('ttrpg.closed', 'Mesa de Rol Cerrada')}</h2>
                <p className="text-text-muted mt-2 text-sm">{t('ttrpg.closedSubtitle', 'La mesa de rol (TTRPG) está desactivada temporalmente.')}</p>
            </div>
        );
    }

    const loadSheetsList = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await TTRPGService.loadSheets(user.id);
            setSheets(data);
            
            // Auto expand systems that have sheets
            const initialExpanded: Record<string, boolean> = {};
            data.forEach(s => {
                if (s.system) initialExpanded[s.system] = true;
            });
            setExpandedSystems(initialExpanded);
        } catch (error) {
            console.error('Error fetching sheets:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSheetsList();
    }, [loadSheetsList]);

    const getSystemIcon = (system: string) => {
        switch (system) {
            case 'Criatura de la Noche':
            case 'Edad Oscura':
                return <Moon className="w-5 h-5 text-accent-red" />;
            case 'Hombre Lobo':
                return <PawPrint className="w-5 h-5 text-amber-500" />;
            case 'La Leyenda de los 5 Anillos (4a Ed)':
                return <Sparkles className="w-5 h-5 text-brand-secondary" />;
            default:
                return <Shield className="w-5 h-5 text-brand-primary" />;
        }
    };

    const getSystemTranslation = (system: string) => {
        switch (system) {
            case 'Criatura de la Noche': return t('ttrpg.systems.vampire', 'Criatura de la Noche');
            case 'Edad Oscura': return t('ttrpg.systems.darkAges', 'Edad Oscura');
            case 'Hombre Lobo': return t('ttrpg.systems.werewolf', 'Hombre Lobo');
            case 'Fantasía Épica (5e)': return t('ttrpg.systems.dnd', 'Fantasía Épica (5e)');
            case 'Sendas del Pionero': return t('ttrpg.systems.pathfinder', 'Sendas del Pionero');
            case 'La Leyenda de los 5 Anillos (4a Ed)': return t('ttrpg.systems.l5r', 'La Leyenda de los 5 Anillos (4a Ed)');
            default: return system;
        }
    };

    const handleCreateSheet = (system: string) => {
        setSelectedSystem(system);
        setShowCreateModal(false);
        setShowTemplateModal(true);
    };

    const createSheetAction = async (isBlank: boolean) => {
        if (!user || !selectedSystem) return;
        try {
            let charName = t('ttrpg.systems.newCharacter', 'Nuevo Personaje');
            let playerName = profile?.username || 'Jugador';

            if (!isBlank) {
                if (selectedSystem === 'Criatura de la Noche') {
                    charName = 'Alucard Tepes';
                    playerName = 'Mauricio Saldarriaga';
                } else if (selectedSystem === 'Edad Oscura') {
                    charName = 'Alucard de Valois';
                    playerName = 'Mauricio Saldarriaga';
                } else if (selectedSystem === 'Hombre Lobo') {
                    charName = 'Fenrir Colmillo de Fuego';
                    playerName = 'Mauricio Saldarriaga';
                } else if (selectedSystem === 'Fantasía Épica (5e)') {
                    charName = 'Eldrin Hojasombría';
                    playerName = 'Mauricio Saldarriaga';
                } else if (selectedSystem === 'Sendas del Pionero') {
                    charName = 'Valeros el Valiente';
                    playerName = 'Mauricio Saldarriaga';
                }
            }

            const newSheet = TTRPGService.createDefaultSheet(
                user.id,
                playerName,
                charName,
                isBlank,
                selectedSystem
            );
            await TTRPGService.saveSheet(newSheet);
            setShowTemplateModal(false);
            loadSheetsList();
            setSelectedSheetId(newSheet.id);
        } catch (error) {
            console.error('Error creating TTRPG sheet:', error);
            alert('No se pudo crear la ficha de personaje.');
        }
    };

    const handleDeleteSheet = async (sheetId: string, charName: string) => {
        const confirmMessage = t('ttrpg.deleteSheetConfirm', { defaultValue: `¿Estás seguro de que deseas eliminar permanentemente la ficha de ${charName}?`, charName });
        if (window.confirm(confirmMessage)) {
            try {
                await TTRPGService.deleteSheet(sheetId);
                loadSheetsList();
            } catch (error) {
                console.error('Error deleting sheet:', error);
                alert('No se pudo eliminar la ficha.');
            }
        }
    };

    const toggleSystemExpand = (system: string) => {
        setExpandedSystems(prev => ({
            ...prev,
            [system]: !prev[system]
        }));
    };

    // Filter sheets by search query
    const filteredSheets = sheets.filter(sheet => {
        const query = searchQuery.toLowerCase();
        return (
            sheet.characterName.toLowerCase().includes(query) ||
            (sheet.player || '').toLowerCase().includes(query) ||
            (sheet.concept || '').toLowerCase().includes(query) ||
            (sheet.clan || '').toLowerCase().includes(query) ||
            sheet.system.toLowerCase().includes(query)
        );
    });

    // Group sheets by system
    const sheetsBySystem = filteredSheets.reduce((acc, sheet) => {
        const sys = sheet.system || 'Criatura de la Noche';
        if (!acc[sys]) acc[sys] = [];
        acc[sys].push(sheet);
        return acc;
    }, {} as Record<string, TTRPGSheet[]>);

    const rollDice = (qty: number, faces: number) => {
        const rolls: number[] = [];
        let sum = 0;
        for (let i = 0; i < qty; i++) {
            const val = Math.floor(Math.random() * faces) + 1;
            rolls.push(val);
            sum += val;
        }
        setRollResult({ qty, faces, rolls, sum });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-16 animate-in fade-in duration-700">
            <SEO 
                title={t('seo.ttrpg.title', 'Mesa de Rol / TTRPG - Ciudad Friki')}
                description={t('seo.ttrpg.description', 'Administra tus hojas de personaje e interactúa con tu mesa de rol.')}
                keywords="ttrpg, rol, vampire, werewolf, pathfinder, dnd"
            />

            {/* HERO SECTION */}
            <div className="relative rounded-[4rem] overflow-hidden bg-bg-side text-text-main p-10 md:p-14 shadow-2xl border border-divider-theme group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 opacity-100 transition-opacity duration-1000" />
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12 group-hover:scale-105 group-hover:rotate-[20deg] transition-transform duration-1000">
                    <Dices size={380} className="text-text-muted" />
                </div>
                <div className="relative z-10 space-y-6 max-w-3xl">
                    <div className="inline-flex items-center gap-3 bg-brand-primary/10 px-5 py-2 rounded-full border border-brand-primary/20">
                        <Dices size={18} className="text-brand-primary" />
                        <span className="font-black text-xs tracking-widest text-brand-primary uppercase italic">{t('ttrpg.roleplayTitle', 'Mesa de Rol Virtual')}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none uppercase text-transparent bg-clip-text bg-gradient-to-b from-text-main to-text-main/70">
                        {t('ttrpg.hero.title', 'Utilidades de Rol')}
                    </h1>
                    <p className="text-lg text-text-sub font-medium leading-relaxed max-w-xl border-l-4 border-brand-primary pl-5">
                        {t('ttrpg.hero.subtitle', 'Crea tus hojas de personaje, lanza dados y sincronízalas en tiempo real con tu Director de Juego.')}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-brand-primary hover:bg-brand-primary-light text-text-inv font-black uppercase tracking-widest text-xs px-6 py-4 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-brand-primary/20 active:scale-95"
                        >
                            <Plus size={16} />
                            {t('ttrpg.createSheet', 'Crear Ficha')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* SHEETS DIRECTORY */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between gap-4 border-b border-divider-theme pb-6">
                        <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter italic flex items-center gap-3">
                            <BookOpen className="text-brand-primary w-7 h-7" />
                            {t('ttrpg.mySheets', 'Mis Hojas de Personaje')}
                        </h2>
                        <div className="relative max-w-xs w-full">
                            <input
                                type="text"
                                placeholder={t('ttrpg.searchPlaceholder', 'Buscar fichas...')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-divider-theme bg-bg-side text-text-main text-sm focus:outline-none focus:border-brand-primary/50 transition-colors"
                            />
                            <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <RefreshCw className="animate-spin text-brand-primary" size={32} />
                            <p className="text-text-muted font-bold uppercase tracking-widest text-xs">{t('common.loading')}</p>
                        </div>
                    ) : sheets.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center bg-bg-side rounded-[3rem] border-4 border-dashed border-divider-theme">
                            <Info size={56} className="mb-4 text-text-muted opacity-30" />
                            <p className="text-xl font-bold text-text-muted">{t('ttrpg.noSheets', 'No tienes fichas creadas aún.')}</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="mt-6 bg-brand-primary hover:bg-brand-primary-light text-text-inv font-black uppercase text-xs px-6 py-3.5 rounded-xl transition"
                            >
                                {t('ttrpg.createSheetFirst', 'Crear tu primera ficha')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(sheetsBySystem).map(([systemName, systemSheets]) => {
                                const isExpanded = expandedSystems[systemName] !== false;
                                return (
                                    <div key={systemName} className="bg-bg-side border border-divider-theme rounded-3xl overflow-hidden shadow-lg transition-all duration-300">
                                        <button
                                            onClick={() => toggleSystemExpand(systemName)}
                                            className="w-full flex items-center justify-between p-5 bg-bg-sub/20 hover:bg-bg-sub/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getSystemIcon(systemName)}
                                                <span className="font-black text-text-main text-lg uppercase tracking-tight">{getSystemTranslation(systemName)}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="bg-bg-sub border border-divider-theme px-3 py-1 rounded-full text-xs font-bold text-text-muted">
                                                    {systemSheets.length} {systemSheets.length === 1 ? t('ttrpg.sheetSingular', 'ficha') : t('ttrpg.sheetPlural', 'fichas')}
                                                </span>
                                                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-divider-theme p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                                {systemSheets.map(sheet => (
                                                    <div
                                                        key={sheet.id}
                                                        className="group bg-bg-sub/20 hover:bg-bg-sub/40 border border-divider-theme hover:border-brand-primary/30 p-5 rounded-2xl flex items-center justify-between transition-all duration-300"
                                                    >
                                                        <div
                                                            onClick={() => setSelectedSheetId(sheet.id)}
                                                            className="flex-1 cursor-pointer min-w-0"
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <User size={14} className="text-brand-secondary flex-shrink-0" />
                                                                <h4 className="font-black text-text-main text-base truncate group-hover:text-brand-primary transition-colors">{sheet.characterName}</h4>
                                                            </div>
                                                            <p className="text-xs text-text-muted flex items-center gap-1.5 truncate">
                                                                <span>{sheet.player || t('ttrpg.noPlayer', 'Sin jugador')}</span>
                                                                {sheet.chronicle && (
                                                                    <>
                                                                        <span className="w-1.5 h-1.5 bg-divider-theme rounded-full" />
                                                                        <span className="italic">{sheet.chronicle}</span>
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 pl-4">
                                                            <button
                                                                onClick={() => setSelectedSheetId(sheet.id)}
                                                                className="p-2.5 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-text-inv rounded-xl transition-all"
                                                                title="Editar ficha"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSheet(sheet.id, sheet.characterName)}
                                                                className="p-2.5 bg-accent-red/10 hover:bg-accent-red text-accent-red hover:text-text-inv rounded-xl transition-all"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* DICE ROLLING PANEL */}
                <div className="space-y-8">
                    <div className="border-b border-divider-theme pb-6">
                        <h2 className="text-3xl font-black text-text-main uppercase tracking-tighter italic flex items-center gap-3">
                            <Dices className="text-brand-primary w-7 h-7" />
                            {t('ttrpg.quickRoll', 'Tiradas Rápidas')}
                        </h2>
                    </div>

                    <div className="bg-bg-side border border-divider-theme rounded-3xl p-6 shadow-xl space-y-6">
                        {/* Qty Selector */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest block">{t('ttrpg.diceQuantity', 'Cantidad de dados')}</label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5, 10].map(qty => (
                                    <button
                                        key={qty}
                                        onClick={() => setDiceQty(qty)}
                                        className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-all ${diceQty === qty
                                            ? 'bg-brand-primary text-text-inv border-brand-primary'
                                            : 'bg-bg-sub/30 text-text-muted border-divider-theme hover:border-brand-primary/40'
                                        }`}
                                    >
                                        {qty}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-text-muted">{t('ttrpg.customQty', 'Otro:')}</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={diceQty}
                                    onChange={e => setDiceQty(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-20 px-3 py-1 bg-bg-sub/50 border border-divider-theme rounded-lg text-text-main text-xs text-center focus:outline-none focus:border-brand-primary/50"
                                />
                            </div>
                        </div>

                        {/* Dice Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            {[4, 6, 8, 10, 12, 20, 100].map(faces => (
                                <button
                                    key={faces}
                                    onClick={() => rollDice(diceQty, faces)}
                                    className="aspect-square bg-bg-sub/30 border-2 border-divider-theme hover:border-brand-primary/60 hover:bg-bg-sub rounded-2xl flex flex-col items-center justify-center p-2 transition-all group"
                                >
                                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🎲</span>
                                    <span className="text-xs font-black text-text-main">d{faces}</span>
                                </button>
                            ))}
                        </div>

                        {/* Roll Result Display */}
                        {rollResult && (
                            <div className="p-4 bg-bg-sub/40 border border-divider-theme rounded-2xl space-y-2 animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center text-xs text-text-muted font-bold uppercase tracking-wider">
                                    <span>Tirada realizada</span>
                                    <span className="text-brand-primary">{rollResult.qty}d{rollResult.faces}</span>
                                </div>
                                <div className="text-text-main text-sm font-semibold flex flex-wrap gap-1.5 py-1">
                                    {rollResult.rolls.map((r, i) => (
                                        <span key={i} className="inline-flex items-center justify-center min-w-[28px] h-7 bg-bg-side border border-divider-theme rounded-lg text-xs font-black">
                                            {r}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex justify-between items-end pt-2 border-t border-divider-theme/40">
                                    <span className="text-xs text-text-muted">{t('ttrpg.totalSum', 'Suma total')}</span>
                                    <span className="text-2xl font-black text-brand-primary italic">{rollResult.sum}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CREATE SHEET SYSTEM SELECTION MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[200] bg-ui-overlay backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-bg-side border border-divider-theme rounded-[3rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-divider-theme pb-4">
                            <h3 className="font-black text-text-main text-xl uppercase tracking-tight flex items-center gap-2">
                                <Dices className="text-brand-primary w-5 h-5" />
                                {t('ttrpg.selectSystem', 'Selecciona el Sistema')}
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-bg-sub rounded-xl transition">
                                <X size={20} className="text-text-muted" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                            {[
                                { id: 'Criatura de la Noche', label: t('ttrpg.systems.vampire', 'Criatura de la Noche'), desc: t('ttrpg.systems.vampireDesc', 'Reglas de terror gótico contemporáneo'), icon: <Moon className="w-5 h-5 text-accent-red" /> },
                                { id: 'Edad Oscura', label: t('ttrpg.systems.darkAges', 'Edad Oscura'), desc: t('ttrpg.systems.darkAgesDesc', 'Terror medieval e histórico adaptado'), icon: <Moon className="w-5 h-5 text-accent-red opacity-60" /> },
                                { id: 'Hombre Lobo', label: t('ttrpg.systems.werewolf', 'Hombre Lobo'), desc: t('ttrpg.systems.werewolfDesc', 'Furia de Gaia y combate espiritual'), icon: <PawPrint className="w-5 h-5 text-amber-500" /> },
                                { id: 'Fantasía Épica (5e)', label: t('ttrpg.systems.dnd', 'Fantasía Épica (5e)'), desc: t('ttrpg.systems.dndDesc', 'Rol clásico de mazmorras y héroes'), icon: <Shield className="w-5 h-5 text-brand-primary" /> },
                                { id: 'Sendas del Pionero', label: t('ttrpg.systems.pathfinder', 'Sendas del Pionero'), desc: t('ttrpg.systems.pathfinderDesc', 'Fantasía táctica de exploradores'), icon: <Shield className="w-5 h-5 text-brand-primary opacity-60" /> },
                                { id: 'La Leyenda de los 5 Anillos (4a Ed)', label: t('ttrpg.systems.l5r', 'La Leyenda de los 5 Anillos (4a Ed)'), desc: t('ttrpg.systems.l5rDesc', 'Samuráis, honor, drama elemental y clanes'), icon: <Sparkles className="w-5 h-5 text-brand-secondary" /> }
                            ].map(sys => (
                                <button
                                    key={sys.id}
                                    onClick={() => handleCreateSheet(sys.id)}
                                    className="w-full text-left flex items-start p-3 bg-bg-sub/10 hover:bg-bg-sub/40 border border-divider-theme hover:border-brand-primary/40 rounded-2xl gap-3 transition"
                                >
                                    <div className="p-2.5 bg-bg-side border border-divider-theme rounded-xl flex items-center justify-center flex-shrink-0">
                                        {sys.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-text-main text-sm truncate">{sys.label}</h4>
                                        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{sys.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TEMPLATE SELECTION MODAL */}
            {showTemplateModal && selectedSystem && (
                <div className="fixed inset-0 z-[200] bg-ui-overlay backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
                    <div className="bg-bg-side border border-divider-theme rounded-[3rem] p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="text-center space-y-2">
                            <div className="p-4 bg-brand-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-brand-primary">
                                <BookOpen size={28} />
                            </div>
                            <h3 className="font-black text-text-main text-lg uppercase tracking-tight">{t('ttrpg.templateTitle', 'Plantilla de Personaje')}</h3>
                            <p className="text-text-muted text-xs">
                                {t('ttrpg.templateMessage', '¿Deseas crear la ficha de {{system}} en blanco o con datos de ejemplo precargados?', { system: getSystemTranslation(selectedSystem) })}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => createSheetAction(true)}
                                className="w-full py-3.5 rounded-2xl bg-bg-sub hover:bg-bg-sub/80 border border-divider-theme text-text-main font-bold text-sm transition"
                            >
                                {t('ttrpg.blankSheet', 'Ficha en Blanco')}
                            </button>
                            <button
                                onClick={() => createSheetAction(false)}
                                className="w-full py-3.5 rounded-2xl bg-brand-primary hover:bg-brand-primary-light text-text-inv font-black text-sm uppercase tracking-wider transition"
                            >
                                {t('ttrpg.exampleSheet', 'Ficha de Ejemplo')}
                            </button>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="w-full py-3.5 rounded-2xl border border-divider-theme text-text-muted font-bold text-sm hover:bg-bg-sub/40 transition"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL CHARACTER SHEET EDITOR MODAL */}
            {selectedSheetId && (
                <div className="fixed inset-0 z-[150] bg-bg-main overflow-hidden flex flex-col">
                    <CharacterSheetEditor
                        sheetId={selectedSheetId}
                        userId={user?.id || ''}
                        onClose={() => {
                            setSelectedSheetId(null);
                            loadSheetsList();
                        }}
                    />
                </div>
            )}
        </div>
    );
}
