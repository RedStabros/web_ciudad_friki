import { useState, useEffect } from 'react';
import { Gamepad2, Loader2, Play, Pause, XCircle, Edit3, PieChart, Timer, Target, PlusCircle, Filter } from 'lucide-react';
import { TriviaAdminService } from '../../services/TriviaAdminService';
import { Trivia, TriviaStatus } from '../../types/trivia';
import { TriviaBuilderModal } from '../../components/admin/TriviaBuilderModal';
import { useAuth } from '../../context/AuthContext';

export default function AdminTrivias() {
    const { user } = useAuth();
    const [trivias, setTrivias] = useState<Trivia[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | TriviaStatus>('all');

    // Stats
    const [stats, setStats] = useState({ total: 0, active: 0, drafts: 0, paused: 0, attempts: 0 });

    // Modals
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [triviaToEdit, setTriviaToEdit] = useState<Trivia | null>(null);

    useEffect(() => {
        if (user) {
            loadTrivias();
        }
    }, [user]);

    const loadTrivias = async () => {
        setLoading(true);
        try {
            const data = await TriviaAdminService.getAllTriviasWithStats();
            setTrivias(data);
            setStats({
                total: data.length,
                active: data.filter(s => s.status === 'active').length,
                drafts: data.filter(s => s.status === 'draft').length,
                paused: data.filter(s => s.status === 'paused').length,
                attempts: data.reduce((sum, s) => sum + (s.attempt_count || 0), 0),
            });
        } catch (error) {
            console.error('Error loading admin trivias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (triviaId: string, newStatus: TriviaStatus) => {
        try {
            const { error } = await TriviaAdminService.changeTriviaStatus(triviaId, newStatus);
            if (error) throw error;
            loadTrivias();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    const getStatusColor = (status: TriviaStatus) => {
        switch (status) {
            case 'active': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
            case 'draft': return 'bg-border-theme text-text-muted border-border-theme';
            case 'paused': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'expired': return 'bg-accent-red/20 text-accent-red border-accent-red/30';
            case 'cancelled': return 'bg-black/50 text-text-sub border-border-theme';
            case 'closed': return 'bg-brand-secondary/20 text-brand-secondary border-brand-secondary/30';
            default: return 'bg-bg-pop text-text-muted border-border-theme';
        }
    };

    const getStatusLabel = (status: TriviaStatus) => {
        const labels: Record<TriviaStatus, string> = {
            active: 'En Curso',
            draft: 'Borrador',
            paused: 'Pausada',
            expired: 'Caducada',
            cancelled: 'Cancelada',
            closed: 'Cerrada'
        };
        return labels[status] || status;
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
    };

    const filteredTrivias = activeFilter === 'all'
        ? trivias
        : trivias.filter(s => s.status === activeFilter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <Gamepad2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">Panel de Trivias</h1>
                        <p className="text-sm text-brand-primary font-bold">Desafíos cronometrados para la comunidad</p>
                    </div>
                </div>

                <button
                    onClick={() => { setTriviaToEdit(null); setIsBuilderOpen(true); }}
                    className="bg-brand-primary hover:bg-blue-600 text-white font-black py-2.5 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-brand-primary/20 justify-center"
                >
                    <PlusCircle size={20} /> Crear Trivia
                </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-text-main mb-1 leading-none">{stats.total}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">Total Creadas</span>
                </div>
                <div className="bg-bg-pop border border-accent-green/30 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent-green/5 rounded-full -mr-8 -mt-8"></div>
                    <span className="text-2xl font-black text-accent-green mb-1 leading-none">{stats.active}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">Activas</span>
                </div>
                <div className="bg-bg-pop border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-amber-500 mb-1 leading-none">{stats.paused}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">Pausadas</span>
                </div>
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-text-sub mb-1 leading-none">{stats.drafts}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">Borradores</span>
                </div>
                <div className="col-span-2 md:col-span-1 bg-[#6366f1]/10 border border-[#6366f1]/30 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-[#6366f1] mb-1 leading-none flex items-center gap-1"><Target size={20} /> {stats.attempts}</span>
                    <span className="text-xs font-bold text-[#6366f1] uppercase text-center">Intentos Globales</span>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div className="flex items-center gap-2 border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 overflow-x-auto hide-scrollbar">
                {(['all', 'active', 'draft', 'paused', 'closed'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${activeFilter === filter
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                            }`}
                    >
                        {filter === 'all' ? 'Todas' : getStatusLabel(filter as TriviaStatus)}
                    </button>
                ))}
            </div>

            {/* Trivias List */}
            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                        <p className="font-bold">Cargando Trivias...</p>
                    </div>
                ) : trivias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                        <Gamepad2 className="opacity-20 mb-4" size={48} />
                        <p className="font-bold text-text-main text-lg mb-1">Tu primer desafío</p>
                        <p className="text-sm max-w-sm mb-4">Crea una trivia con tiempo límite para que la comunidad compita.</p>
                        <button
                            onClick={() => { setTriviaToEdit(null); setIsBuilderOpen(true); }}
                            className="text-brand-primary font-bold hover:underline"
                        >
                            Crear Nueva
                        </button>
                    </div>
                ) : filteredTrivias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Filter className="opacity-20 mb-4" size={32} />
                        <p className="font-bold">No hay trivias con este filtro.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTrivias.map(item => (
                            <div key={item.id} className="bg-bg-side border border-border-theme hover:border-brand-primary/50 transition-colors rounded-2xl p-5 flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-black text-lg text-text-main flex-1 leading-tight line-clamp-2" title={item.title}>
                                            {item.title}
                                        </h3>
                                        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md border whitespace-nowrap ${getStatusColor(item.status)}`}>
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </div>
                                    {item.description && (
                                        <p className="text-xs text-text-muted font-bold line-clamp-2 mb-4">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme">
                                            <Target size={14} className="text-[#6366f1]" /> {item.attempt_count || 0} Intentos
                                        </div>
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme">
                                            <PieChart size={14} className="text-brand-secondary" /> {item.total_points || 0} Pts Base
                                        </div>
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme">
                                            <Timer size={14} className="text-amber-500" /> {formatTime(item.time_limit_seconds)}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border-theme pt-3 mt-auto w-full flex flex-wrap gap-2">
                                    {item.status === 'active' && (
                                        <button onClick={() => handleStatusChange(item.id, 'paused')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/30 transition text-text-sub bg-bg-pop">
                                            <Pause size={14} /> Pausar
                                        </button>
                                    )}
                                    {item.status === 'paused' && (
                                        <button onClick={() => handleStatusChange(item.id, 'active')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-accent-green/30 bg-accent-green/10 text-accent-green hover:bg-accent-green hover:text-white transition">
                                            <Play size={14} /> Reanudar
                                        </button>
                                    )}
                                    {item.status === 'draft' && (
                                        <button onClick={() => handleStatusChange(item.id, 'active')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-primary/30 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white transition">
                                            <Play size={14} /> Publicar
                                        </button>
                                    )}
                                    {item.status !== 'cancelled' && item.status !== 'expired' && item.status !== 'closed' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('¿Cancelar esta trivia? No habrán más intentos.'))
                                                    handleStatusChange(item.id, 'cancelled')
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition"
                                        >
                                            <XCircle size={14} /> Cancelar
                                        </button>
                                    )}

                                    <button
                                        onClick={() => { setTriviaToEdit(item); setIsBuilderOpen(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/50 transition bg-bg-pop ml-auto"
                                    >
                                        <Edit3 size={14} /> Editar
                                    </button>

                                    {(item.attempt_count || 0) > 0 && (
                                        <button
                                            onClick={() => alert('Resultados y Analytics en desarrollo...')}
                                            className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-sm font-black rounded-xl bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/30 hover:bg-brand-secondary hover:text-white transition"
                                        >
                                            <PieChart size={16} /> Ver Analytics
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TriviaBuilderModal
                isOpen={isBuilderOpen}
                onClose={() => { setIsBuilderOpen(false); setTriviaToEdit(null); }}
                triviaToEdit={triviaToEdit}
                onSave={() => { setIsBuilderOpen(false); setTriviaToEdit(null); loadTrivias(); }}
            />
        </div>
    );
}
