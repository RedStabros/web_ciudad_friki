import { useState, useEffect } from 'react';
import { FileText, Loader2, Play, Pause, XCircle, CheckCircle, Edit3, Trash2, PieChart, Star, PlusCircle, Filter } from 'lucide-react';
import { SurveyAdminService } from '../../services/SurveyAdminService';
import { AdminSurvey, SurveyStatus } from '../../types/survey';
import { SurveyBuilderModal } from '../../components/admin/SurveyBuilderModal';
import { useAuth } from '../../context/AuthContext';

export default function AdminSurveys() {
    const { user } = useAuth();
    const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | SurveyStatus>('all');

    // Stats
    const [stats, setStats] = useState({ total: 0, active: 0, drafts: 0, paused: 0, responses: 0 });

    // Modals
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [surveyToEdit, setSurveyToEdit] = useState<AdminSurvey | null>(null);

    useEffect(() => {
        if (user) {
            loadSurveys();
        }
    }, [user]);

    const loadSurveys = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await SurveyAdminService.getAllSurveys(user.id);
            if (error) throw error;
            if (data) {
                setSurveys(data);
                setStats({
                    total: data.length,
                    active: data.filter(s => s.status === 'active').length,
                    drafts: data.filter(s => s.status === 'draft').length,
                    paused: data.filter(s => s.status === 'paused').length,
                    responses: data.reduce((sum, s) => sum + s.response_count, 0),
                });
            }
        } catch (error) {
            console.error('Error loading admin surveys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (surveyId: string, newStatus: SurveyStatus) => {
        if (!user) return;
        try {
            const { error } = await SurveyAdminService.changeSurveyStatus(user.id, surveyId, newStatus);
            if (error) throw error;
            loadSurveys();
        } catch (error: any) {
            alert('Error al cambiar estado: ' + error.message);
        }
    };

    const getStatusColor = (status: SurveyStatus) => {
        switch (status) {
            case 'active': return 'bg-accent-green/20 text-accent-green border-accent-green/30';
            case 'draft': return 'bg-border-theme text-text-muted border-border-theme';
            case 'scheduled': return 'bg-brand-primary/20 text-brand-primary border-brand-primary/30';
            case 'paused': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'expired': return 'bg-accent-red/20 text-accent-red border-accent-red/30';
            case 'cancelled': return 'bg-black/50 text-text-sub border-border-theme';
            default: return 'bg-bg-pop text-text-muted border-border-theme';
        }
    };

    const getStatusLabel = (status: SurveyStatus) => {
        const labels: Record<SurveyStatus, string> = {
            active: 'Activa',
            draft: 'Borrador',
            scheduled: 'Programada',
            paused: 'Pausada',
            expired: 'Caducada',
            cancelled: 'Cancelada'
        };
        return labels[status] || status;
    };

    const filteredSurveys = activeFilter === 'all'
        ? surveys
        : surveys.filter(s => s.status === activeFilter);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">Panel de Encuestas</h1>
                        <p className="text-sm text-brand-primary font-bold">Investigación y feedback con recompensas</p>
                    </div>
                </div>

                <button
                    onClick={() => { setSurveyToEdit(null); setIsBuilderOpen(true); }}
                    className="bg-brand-primary hover:bg-blue-600 text-white font-black py-2.5 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-brand-primary/20 justify-center"
                >
                    <PlusCircle size={20} /> Crear Encuesta
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
                <div className="col-span-2 md:col-span-1 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-brand-primary mb-1 leading-none flex items-center gap-1"><PieChart size={20} /> {stats.responses}</span>
                    <span className="text-xs font-bold text-brand-primary uppercase text-center">Respuestas Globales</span>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div className="flex items-center gap-2 border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 overflow-x-auto hide-scrollbar">
                {(['all', 'active', 'draft', 'paused', 'expired'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${activeFilter === filter
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                            }`}
                    >
                        {filter === 'all' ? 'Todas' : getStatusLabel(filter as SurveyStatus)}
                    </button>
                ))}
            </div>

            {/* Surveys List */}
            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                        <p className="font-bold">Cargando Encuestas...</p>
                    </div>
                ) : surveys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                        <FileText className="opacity-20 mb-4" size={48} />
                        <p className="font-bold text-text-main text-lg mb-1">Tu primer cuestionario</p>
                        <p className="text-sm max-w-sm mb-4">Crea una encuesta recompensada para interactuar con los ciudadanos.</p>
                        <button
                            onClick={() => { setSurveyToEdit(null); setIsBuilderOpen(true); }}
                            className="text-brand-primary font-bold hover:underline"
                        >
                            Crear Nueva
                        </button>
                    </div>
                ) : filteredSurveys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Filter className="opacity-20 mb-4" size={32} />
                        <p className="font-bold">Vaya, no hay resultados para este filtro.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSurveys.map(item => (
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
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-sm bg-bg-pop px-3 py-1.5 rounded-lg border border-border-theme">
                                            <Star size={14} className="text-amber-500" /> {item.reward_amount} FC
                                        </div>
                                        <div className="flex items-center gap-1 text-text-sub font-bold text-sm bg-bg-pop px-3 py-1.5 rounded-lg border border-border-theme">
                                            <PieChart size={14} className="text-brand-primary" /> {item.response_count} Resp.
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
                                    {item.status !== 'cancelled' && item.status !== 'expired' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('¿Cancelar esta encuesta prementuramente? No habrán más respuestas.'))
                                                    handleStatusChange(item.id, 'cancelled')
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition"
                                        >
                                            <XCircle size={14} /> Cancelar
                                        </button>
                                    )}

                                    <button
                                        onClick={() => { setSurveyToEdit(item); setIsBuilderOpen(true); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-border-theme hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/50 transition bg-bg-pop ml-auto"
                                    >
                                        <Edit3 size={14} /> Editar
                                    </button>

                                    {item.response_count > 0 && (
                                        <button
                                            onClick={() => alert('Resultados en desarrollo...')}
                                            className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-sm font-black rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary hover:text-white transition"
                                        >
                                            <PieChart size={16} /> Ver Resultados
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <SurveyBuilderModal
                isOpen={isBuilderOpen}
                onClose={() => { setIsBuilderOpen(false); setSurveyToEdit(null); }}
                userId={user?.id || ''}
                surveyToEdit={surveyToEdit}
                onSave={() => { setIsBuilderOpen(false); setSurveyToEdit(null); loadSurveys(); }}
            />
        </div>
    );
}
