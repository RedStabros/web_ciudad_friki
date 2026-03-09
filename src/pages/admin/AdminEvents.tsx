import { useState, useEffect } from 'react';
import { CalendarCheck, Loader2, CheckCircle, XCircle, Ban, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EventDetailsModal } from '../../components/EventDetailsModal';
import type { FrikiEvent } from '../../services/EventService';

export default function AdminEvents() {
    const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'history'>('pending');
    const [events, setEvents] = useState<FrikiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modals
    const [selectedEvent, setSelectedEvent] = useState<FrikiEvent | null>(null);
    const [viewEvent, setViewEvent] = useState<FrikiEvent | null>(null);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [sponsorModalVisible, setSponsorModalVisible] = useState(false);
    const [isSponsored, setIsSponsored] = useState(false);

    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('events')
                .select(`
                    *,
                    created_by_profile:profiles!events_created_by_fkey(username, email)
                `)
                .order('created_at', { ascending: false });

            const today = new Date().toISOString().split('T')[0];

            if (activeTab === 'pending') {
                query = query.eq('status', 'pending');
            } else if (activeTab === 'published') {
                query = query.in('status', ['approved', 'delayed']).gte('date', today);
            } else {
                query = query.or(`status.eq.rejected,status.eq.cancelled,date.lt.${today}`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setEvents(data as FrikiEvent[] || []);
        } catch (error) {
            console.error('Error fetching admin events:', error);
            alert('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (event: FrikiEvent) => {
        setSelectedEvent(event);
        setIsSponsored(false);
        setSponsorModalVisible(true);
    };

    const confirmApprove = async () => {
        if (!selectedEvent) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('events')
                .update({
                    status: 'approved',
                    is_sponsored: isSponsored,
                    rejection_reason: null
                })
                .eq('id', selectedEvent.id);

            if (error) {
                if (error.message.includes('Cannot have more than 2 sponsored events')) {
                    alert('Límite alcanzado: Máximo 2 eventos patrocinados permitidos.');
                    return;
                }
                throw error;
            }

            setSponsorModalVisible(false);
            fetchEvents();
        } catch (error) {
            console.error('Error approving event:', error);
            alert('Error al aprobar el evento');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = (event: FrikiEvent) => {
        setSelectedEvent(event);
        setRejectionReason('');
        setRejectModalVisible(true);
    };

    const confirmReject = async () => {
        if (!selectedEvent) return;
        if (!rejectionReason.trim()) {
            alert('Por favor, ingresa una razón para el rechazo.');
            return;
        }

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('events')
                .update({
                    status: 'rejected',
                    rejection_reason: rejectionReason,
                    is_sponsored: false
                })
                .eq('id', selectedEvent.id);

            if (error) throw error;

            setRejectModalVisible(false);
            fetchEvents();
        } catch (error) {
            console.error('Error rejecting event:', error);
            alert('Error al rechazar el evento');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSponsorStatus = async (event: FrikiEvent, newValue: boolean) => {
        try {
            setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_sponsored: newValue } : e));

            const { error } = await supabase
                .from('events')
                .update({ is_sponsored: newValue })
                .eq('id', event.id);

            if (error) {
                setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_sponsored: !newValue } : e));
                if (error.message.includes('Cannot have more than 2 sponsored events')) {
                    alert('No se permiten más de 2 eventos patrocinados simultáneos.');
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error toggling sponsor:', error);
            setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_sponsored: !newValue } : e));
            alert('Error al actualizar patrocinio');
        }
    };

    const cancelEvent = async (event: FrikiEvent) => {
        if (!window.confirm('¿Estás seguro de cancelar este evento? Quedará marcado como cancelado y se notificará.')) return;

        try {
            const { error } = await supabase
                .from('events')
                .update({ status: 'cancelled' })
                .eq('id', event.id);
            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error('Error cancelling event:', error);
            alert('Error al cancelar evento');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 text-amber-500 p-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <CalendarCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">Moderación de Eventos</h1>
                        <p className="text-sm text-amber-500 font-bold">Aprobar o rechazar eventos de la comunidad</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 gap-2 overflow-x-auto hide-scrollbar">
                {[
                    { id: 'pending', label: 'Pendientes' },
                    { id: 'published', label: 'Publicados' },
                    { id: 'history', label: 'Historial' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'border-amber-500 text-amber-500'
                            : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
                        <p className="font-bold">Cargando eventos...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                        <CalendarCheck className="opacity-20 mb-4" size={48} />
                        <p className="font-bold text-text-main text-lg mb-1">Cero eventos en esta lista</p>
                        <p className="text-sm max-w-sm">No hay eventos comunitarios que coincidan con la pestaña seleccionada.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map(event => (
                            <div key={event.id} className="bg-bg-side border border-border-theme rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all flex flex-col group relative">
                                {event.is_sponsored && (
                                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow-lg">
                                        <Star size={10} /> Destacado
                                    </div>
                                )}
                                <div
                                    className="h-32 bg-bg-pop relative cursor-pointer overflow-hidden"
                                    onClick={() => setViewEvent(event)}
                                >
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Ver Detalles</span>
                                    </div>
                                    <img
                                        src={event.banner_url || 'https://via.placeholder.com/400x200?text=No+Image'}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                        <p className="text-white font-black leading-tight line-clamp-1 truncate">{event.title}</p>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <p className="text-xs text-brand-primary font-bold mb-1">📅 {event.date} • 📍 {event.location}</p>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-3">
                                        Por: {(event as any).created_by_profile?.username || 'Usuario'}
                                    </p>

                                    <div className="mt-auto pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                                        {activeTab === 'pending' && (
                                            <>
                                                <button onClick={() => handleReject(event)} className="flex-1 py-2 rounded-xl bg-accent-red/10 text-accent-red font-bold text-xs hover:bg-accent-red hover:text-white transition flex items-center justify-center gap-1.5">
                                                    <XCircle size={14} /> Rechazar
                                                </button>
                                                <button onClick={() => handleApprove(event)} className="flex-1 py-2 rounded-xl bg-accent-green/10 text-accent-green font-bold text-xs hover:bg-accent-green hover:text-white transition flex items-center justify-center gap-1.5">
                                                    <CheckCircle size={14} /> Aprobar
                                                </button>
                                            </>
                                        )}
                                        {activeTab === 'published' && (
                                            <>
                                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-border-theme text-amber-500 focus:ring-amber-500 bg-bg-pop"
                                                        checked={event.is_sponsored}
                                                        onChange={(e) => toggleSponsorStatus(event, e.target.checked)}
                                                    />
                                                    <span className="text-xs font-bold text-text-main">Patrocinar</span>
                                                </label>
                                                <button onClick={() => cancelEvent(event)} className="py-1.5 px-3 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 font-bold text-xs transition">
                                                    Cancelar
                                                </button>
                                            </>
                                        )}
                                        {activeTab === 'history' && (
                                            <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${event.status === 'rejected' ? 'text-accent-red bg-accent-red/10' :
                                                event.status === 'cancelled' ? 'text-amber-500 bg-amber-500/10' :
                                                    'text-text-muted bg-bg-pop'
                                                }`}>
                                                {event.status === 'approved' ? 'Finalizado' : event.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-bg-side border border-border-theme rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <div className="bg-accent-red/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto text-accent-red">
                            <Ban size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-center text-text-main mb-1">Rechazar Evento</h2>
                        <p className="text-text-muted text-center text-sm mb-6">"{selectedEvent?.title}"</p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-text-sub mb-2">Motivo del rechazo (Visible para el autor):</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Ej: No cumple con las normativas comunitarias..."
                                className="w-full bg-bg-pop border border-border-theme text-text-main rounded-xl p-3 h-32 resize-none focus:ring-2 focus:ring-accent-red focus:border-transparent outline-none"
                            ></textarea>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectModalVisible(false)}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-text-main bg-bg-pop hover:bg-bg-sub border border-border-theme transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-accent-red hover:bg-red-600 transition flex items-center justify-center shadow-lg shadow-accent-red/30 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : 'Rechazar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sponsor / Approve Modal */}
            {sponsorModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-bg-side border border-border-theme rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
                        <div className="bg-accent-green/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto text-accent-green">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-center text-text-main mb-1">Aprobar Evento</h2>
                        <p className="text-text-muted text-center text-sm mb-6">"{selectedEvent?.title}" saldrá en vivo al mapa.</p>

                        <div className="mb-6 bg-bg-pop rounded-xl border border-border-theme p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="font-bold text-text-main flex items-center gap-1"><Star size={16} className="text-amber-500" /> Patrocinar Evento</span>
                                    <p className="text-xs text-text-muted mt-1 max-w-[200px]">Aparecerá fijado arriba en la app. Máximo 2 eventos simultáneos permitidos.</p>
                                </div>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        checked={isSponsored}
                                        onChange={(e) => setIsSponsored(e.target.checked)}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-border-theme transition-transform duration-200"
                                        style={{ transform: isSponsored ? 'translateX(100%)' : 'translateX(0)', borderColor: isSponsored ? '#f59e0b' : '' }}
                                    />
                                    <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${isSponsored ? 'bg-amber-500' : 'bg-bg-side border border-border-theme'}`}></label>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSponsorModalVisible(false)}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-text-main bg-bg-pop hover:bg-bg-sub border border-border-theme transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmApprove}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-accent-green hover:bg-green-600 transition flex items-center justify-center shadow-lg shadow-accent-green/30 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : '¡Aprobar Ahora!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Details Viewer */}
            {viewEvent && (
                <EventDetailsModal
                    isOpen={!!viewEvent}
                    onClose={() => setViewEvent(null)}
                    event={viewEvent}
                    isAdminMode={true}
                />
            )}
        </div>
    );
}
