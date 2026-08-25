import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Loader2, CheckCircle, XCircle, Ban, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { EventDetailsModal } from '../../components/EventDetailsModal';
import { EventQrModal } from '../../components/EventQrModal';
import { injectLatLng } from '../../utils/geoUtils';
import type { FrikiEvent } from '../../services/EventService';
import { getLocalTodayString } from '../../utils/dateUtils';

export default function AdminEvents() {
    const { t } = useTranslation();
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
    const [isQrApproved, setIsQrApproved] = useState(false);
    const [qrRewardAmount, setQrRewardAmount] = useState(0);
    const [showQrModal, setShowQrModal] = useState<FrikiEvent | null>(null);

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

            const today = getLocalTodayString();

            if (activeTab === 'pending') {
                query = query.eq('status', 'pending');
            } else if (activeTab === 'published') {
                query = query.in('status', ['approved', 'delayed']).or(`date.gte.${today},end_date.gte.${today}`);
            } else {
                // History: rejected, cancelled, or passed (date < today AND (end_date < today OR end_date is null))
                // We use eq.rejected, eq.cancelled, and a nested OR for the date logic
                query = query.or(`status.eq.rejected,status.eq.cancelled,and(date.lt.${today},or(end_date.lt.${today},end_date.is.null))`);
            }

            const { data, error } = await query;
            if (error) throw error;
            const mappedEvents = (data || []).map((ev: any) => injectLatLng(ev));
            setEvents(mappedEvents as FrikiEvent[]);
        } catch (error) {
            console.error('Error fetching admin events:', error);
            alert(t('adminEvents.errors.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (event: FrikiEvent) => {
        setSelectedEvent(event);
        setIsSponsored(false);
        setIsQrApproved(event.qr_requested || false);
        setQrRewardAmount(event.qr_reward_amount || 0);
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
                    qr_approved: isQrApproved,
                    qr_reward_amount: isQrApproved ? qrRewardAmount : 0,
                    rejection_reason: null
                })
                .eq('id', selectedEvent.id);

            if (error) {
                if (error.message.includes('Cannot have more than 2 sponsored events')) {
                    alert(t('adminEvents.errors.sponsorLimit'));
                    return;
                }
                throw error;
            }

            setSponsorModalVisible(false);
            fetchEvents();
        } catch (error) {
            console.error('Error approving event:', error);
            alert(t('adminEvents.errors.approveError'));
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
            alert(t('adminEvents.errors.rejectionReasonRequired'));
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
            alert(t('adminEvents.errors.rejectError'));
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
                    alert(t('adminEvents.errors.sponsorLimitSimultaneous'));
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error toggling sponsor:', error);
            setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_sponsored: !newValue } : e));
            alert(t('adminEvents.errors.sponsorError'));
        }
    };

    const cancelEvent = async (event: FrikiEvent) => {
        if (!window.confirm(t('adminEvents.errors.cancelConfirm'))) return;

        try {
            const { error } = await supabase
                .from('events')
                .update({ status: 'cancelled' })
                .eq('id', event.id);
            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error('Error cancelling event:', error);
            alert(t('adminEvents.errors.cancelError'));
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
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminEvents.title')}</h1>
                        <p className="text-sm text-amber-500 font-bold">{t('adminEvents.subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 gap-2 overflow-x-auto hide-scrollbar">
                {[
                    { id: 'pending', label: t('adminEvents.tabs.pending') },
                    { id: 'published', label: t('adminEvents.tabs.published') },
                    { id: 'history', label: t('adminEvents.tabs.history') }
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
                        <p className="font-bold">{t('common.loading')}</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                        <CalendarCheck className="opacity-20 mb-4" size={48} />
                        <p className="font-bold text-text-main text-lg mb-1">{t('adminEvents.empty.noEvents')}</p>
                        <p className="text-sm max-w-sm">{t('adminEvents.empty.noEventsHint')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {events.map(event => (
                            <div key={event.id} className="bg-bg-side border border-border-theme rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all flex flex-col group relative">
                                {event.is_sponsored && (
                                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow-lg">
                                        <Star size={10} /> {t('adminEvents.card.featured')}
                                    </div>
                                )}
                                <div
                                    className="h-32 bg-bg-pop relative cursor-pointer overflow-hidden"
                                    onClick={() => setViewEvent(event)}
                                >
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                                        <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">{t('adminEvents.card.viewDetails')}</span>
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
                                        {t('adminEvents.card.by', { username: (event as any).created_by_profile?.username || 'Usuario' })}
                                    </p>

                                    <div className="mt-auto pt-3 border-t border-border-theme flex items-center justify-between gap-2">
                                        {activeTab === 'pending' && (
                                            <>
                                                <button onClick={() => handleReject(event)} className="flex-1 py-2 rounded-xl bg-accent-red/10 text-accent-red font-bold text-xs hover:bg-accent-red hover:text-white transition flex items-center justify-center gap-1.5">
                                                    <XCircle size={14} /> {t('adminEvents.card.reject')}
                                                </button>
                                                <button onClick={() => handleApprove(event)} className="flex-1 py-2 rounded-xl bg-accent-green/10 text-accent-green font-bold text-xs hover:bg-accent-green hover:text-white transition flex items-center justify-center gap-1.5">
                                                    <CheckCircle size={14} /> {t('adminEvents.card.approve')}
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
                                                    <span className="text-xs font-bold text-text-main">{t('adminEvents.card.sponsor')}</span>
                                                </label>
                                                {event.qr_approved && (
                                                    <button onClick={() => setShowQrModal(event)} className="py-1.5 px-3 rounded-lg text-brand-primary hover:bg-brand-primary/10 font-bold text-xs transition">
                                                        Ver QRs
                                                    </button>
                                                )}
                                                <button onClick={() => cancelEvent(event)} className="py-1.5 px-3 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 font-bold text-xs transition">
                                                    {t('adminEvents.card.cancel')}
                                                </button>
                                            </>
                                        )}
                                        {activeTab === 'history' && (
                                            <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${event.status === 'rejected' ? 'text-accent-red bg-accent-red/10' :
                                                event.status === 'cancelled' ? 'text-amber-500 bg-amber-500/10' :
                                                    'text-text-muted bg-bg-pop'
                                                }`}>
                                                {event.status === 'approved' ? t('adminEvents.card.status.finished') :
                                                    event.status === 'rejected' ? t('adminEvents.card.status.rejected') :
                                                        event.status === 'cancelled' ? t('adminEvents.card.status.cancelled') :
                                                            event.status}
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
                        <h2 className="text-2xl font-black text-center text-text-main mb-1">{t('adminEvents.modals.reject.title')}</h2>
                        <p className="text-text-muted text-center text-sm mb-6">"{selectedEvent?.title}"</p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-text-sub mb-2">{t('adminEvents.modals.reject.reasonLabel')}</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder={t('adminEvents.modals.reject.reasonPlaceholder')}
                                className="w-full bg-bg-pop border border-border-theme text-text-main rounded-xl p-3 h-32 resize-none focus:ring-2 focus:ring-accent-red focus:border-transparent outline-none"
                            ></textarea>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectModalVisible(false)}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-text-main bg-bg-pop hover:bg-bg-sub border border-border-theme transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-accent-red hover:bg-red-600 transition flex items-center justify-center shadow-lg shadow-accent-red/30 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : t('adminEvents.modals.reject.confirm')}
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
                        <h2 className="text-2xl font-black text-center text-text-main mb-1">{t('adminEvents.modals.approve.title')}</h2>
                        <p className="text-text-muted text-center text-sm mb-6">{t('adminEvents.modals.approve.hint', { title: selectedEvent?.title })}</p>

                        <div className="mb-6 bg-bg-pop rounded-xl border border-border-theme p-4">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <span className="font-bold text-text-main flex items-center gap-1"><Star size={16} className="text-amber-500" /> {t('adminEvents.modals.approve.sponsorLabel')}</span>
                                    <p className="text-xs text-text-muted mt-1 max-w-[200px]">{t('adminEvents.modals.approve.sponsorHint')}</p>
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

                        {selectedEvent?.qr_requested && (
                            <div className="mb-6 bg-bg-pop rounded-xl border border-border-theme p-4">
                                <label className="flex items-center justify-between cursor-pointer mb-3">
                                    <div>
                                        <span className="font-bold text-text-main flex items-center gap-1">🪙 Aprobar Frikicoins</span>
                                        <p className="text-xs text-text-muted mt-1 max-w-[200px]">El creador solicitó entregar Frikicoins a los asistentes vía QR.</p>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            checked={isQrApproved}
                                            onChange={(e) => setIsQrApproved(e.target.checked)}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-border-theme transition-transform duration-200"
                                            style={{ transform: isQrApproved ? 'translateX(100%)' : 'translateX(0)', borderColor: isQrApproved ? '#10b981' : '' }}
                                        />
                                        <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${isQrApproved ? 'bg-accent-green' : 'bg-bg-side border border-border-theme'}`}></label>
                                    </div>
                                </label>
                                
                                {isQrApproved && (
                                    <div className="mt-3 pt-3 border-t border-border-theme">
                                        <label className="block text-xs font-bold text-text-sub mb-2">Cantidad de Frikicoins por asistencia</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={qrRewardAmount}
                                            onChange={(e) => setQrRewardAmount(Number(e.target.value))}
                                            className="w-full bg-bg-side border border-border-theme text-text-main rounded-lg p-2 focus:ring-2 focus:ring-accent-green outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSponsorModalVisible(false)}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-text-main bg-bg-pop hover:bg-bg-sub border border-border-theme transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={confirmApprove}
                                disabled={actionLoading}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-accent-green hover:bg-green-600 transition flex items-center justify-center shadow-lg shadow-accent-green/30 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : t('adminEvents.modals.approve.confirm')}
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

            {/* QR Manager Modal */}
            {showQrModal && (
                <EventQrModal
                    event={showQrModal as any}
                    onClose={() => setShowQrModal(null)}
                />
            )}
        </div>
    );
}
