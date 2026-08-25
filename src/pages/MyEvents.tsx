import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Calendar, MapPin, Heart, Bookmark, Eye,
    Pencil, Clock, XCircle, ArrowLeft,
    CalendarX, RefreshCw, Loader2, AlertTriangle, Ticket,
} from 'lucide-react';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { CreateEventModal } from '../components/CreateEventModal';
import { EventQrModal } from '../components/EventQrModal';
import { isEventFinished, hasEventStarted } from '../utils/dateUtils';
import { injectLatLng } from '../utils/geoUtils';



// ── Types ──────────────────────────────────────────────────────────────────
interface MyEvent {
    id: string;
    title: string;
    description?: string;
    date: string;
    end_date?: string | null;
    start_time?: string;
    end_time?: string | null;
    location?: string;
    maps_location_url?: string;
    banner_url?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'delayed';
    price_min?: number | null;
    external_link?: string;
    whatsapp?: string;
    organizer_email?: string;
    tags?: string[];
    is_sponsored?: boolean;
    likes_count?: number;
    saved_count?: number;
    views_count?: number;
    rejection_reason?: string | null;
    qr_requested?: boolean;
    qr_approved?: boolean;
    qr_reward_amount?: number;
    parent_event_id?: string | null;
    edition_number?: number | null;
}

type Tab = 'published' | 'saved';

// ── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { labelKey: string; cls: string }> = {
    approved: { labelKey: 'myEvents.status.approved', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    pending: { labelKey: 'myEvents.status.pending', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    rejected: { labelKey: 'myEvents.status.rejected', cls: 'bg-accent-red/20 text-accent-red border-accent-red/30' },
    cancelled: { labelKey: 'myEvents.status.cancelled', cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    delayed: { labelKey: 'myEvents.status.delayed', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    finished: { labelKey: 'myEvents.status.finished', cls: 'bg-bg-sub text-text-muted border-border-theme' },
};

function isEventPast(event: MyEvent): boolean {
    return isEventFinished(event.date, event.end_date);
}

function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslation();
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.cls}`}>
            {t(cfg.labelKey)}
        </span>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function MyEvents() {
    const { t } = useTranslation();
    const { user, session } = useAuth();

    const [tab, setTab] = useState<Tab>('published');
    const [events, setEvents] = useState<MyEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);
    const [eventToEdit, setEventToEdit] = useState<MyEvent | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ action: 'cancel' | 'postpone'; eventId: string } | null>(null);
    const [_savedIds, setSavedIds] = useState<string[]>([]);
    const [_likedIds, setLikedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [qrModalEvent, setQrModalEvent] = useState<MyEvent | null>(null);

    const handleLaunchEdition = (event: MyEvent) => {
        const editionEvent = {
            ...event,
            id: undefined,
            date: '',
            start_time: '',
            end_date: '',
            end_time: '',
            status: 'pending',
            qr_approved: false,
            parent_event_id: event.parent_event_id || event.id,
            edition_number: (event.edition_number || 1) + 1
        };
        setEventToEdit(editionEvent as any);
        setShowCreateModal(true);
    };

    const fetchEvents = useCallback(async (isRefresh = false) => {
        if (!user?.id) return;
        if (isRefresh) setRefreshing(true); else setLoading(true);

        try {
            let data: MyEvent[] = [];

            if (tab === 'published') {
                const { data: rows, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                data = (rows || []).map((row: any) => injectLatLng(row));
            } else {
                const { data: rows, error } = await supabase
                    .from('saved_events')
                    .select('event:events(*)')
                    .eq('user_id', user.id);
                if (error) throw error;
                data = (rows || [])
                    .map((r: any) => injectLatLng(r.event))
                    .filter(Boolean)
                    .sort((a: MyEvent, b: MyEvent) =>
                        new Date(`${a.date}T${a.start_time || '00:00'}`).getTime() -
                        new Date(`${b.date}T${b.start_time || '00:00'}`).getTime()
                    );
            }

            // Fetch likes & saves
            const [{ data: likes }, { data: saves }] = await Promise.all([
                supabase.from('event_likes').select('event_id').eq('user_id', user.id),
                supabase.from('saved_events').select('event_id').eq('user_id', user.id),
            ]);
            setLikedIds(likes?.map((l: any) => l.event_id) || []);
            setSavedIds(saves?.map((s: any) => s.event_id) || []);
            setEvents(data);
        } catch (e) {
            console.error('MyEvents fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, tab]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const updateStatus = async (eventId: string, newStatus: string) => {
        setActionLoading(eventId);
        try {
            const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', eventId);
            if (error) throw error;
            setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus as any } : e));
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); setConfirmModal(null); }
    };

    const handleUnsave = async (eventId: string) => {
        setActionLoading(eventId);
        try {
            await supabase.from('saved_events').delete().eq('user_id', user!.id).eq('event_id', eventId);
            setSavedIds(prev => prev.filter(id => id !== eventId));
            if (tab === 'saved') setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    // Must be after all hooks
    if (!session) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen bg-bg-main pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-bg-side border-b border-border-theme">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to="/profile" className="p-2 rounded-xl hover:bg-bg-sub transition text-text-muted hover:text-text-main">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-black text-text-main uppercase tracking-tight leading-none">
                            {t('myEvents.title')}
                        </h1>
                        <p className="text-xs text-text-muted font-medium mt-0.5">
                            {tab === 'published' ? t('myEvents.publishedEvents') : t('myEvents.savedEvents')}
                        </p>
                    </div>
                    <button
                        onClick={() => fetchEvents(true)}
                        disabled={refreshing}
                        className="ml-auto p-2 rounded-xl hover:bg-bg-sub transition text-text-muted hover:text-text-main"
                    >
                        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-3xl mx-auto px-4 flex border-t border-border-theme">
                    {(['published', 'saved'] as Tab[]).map(t2 => (
                        <button
                            key={t2}
                            onClick={() => setTab(t2)}
                            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${tab === t2
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-text-muted hover:text-text-main'
                                }`}
                        >
                            {t2 === 'published' ? t('myEvents.tabPublished') : t('myEvents.tabSaved')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-3">
                        <Loader2 size={32} className="animate-spin text-brand-primary" />
                        <p className="text-text-muted text-sm font-medium">{t('myEvents.loading')}</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center py-20 gap-4 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-bg-sub border border-border-theme flex items-center justify-center">
                            <CalendarX size={28} className="text-text-muted" />
                        </div>
                        <div>
                            <p className="text-text-main font-black text-base">
                                {tab === 'published' ? t('myEvents.noCreated') : t('myEvents.noSaved')}
                            </p>
                            <p className="text-text-muted text-sm mt-1">
                                {tab === 'published'
                                    ? t('myEvents.createFirst')
                                    : t('myEvents.saveLater')}
                            </p>
                        </div>
                        {tab === 'published' && (
                            <Link
                                to="/"
                                className="px-5 py-2.5 bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-primary/90 transition"
                            >
                                {t('myEvents.createButton')}
                            </Link>
                        )}
                    </div>
                ) : (
                    events.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            tab={tab}
                            actionLoading={actionLoading === event.id}
                            onView={() => setSelectedEvent(event)}
                            onEdit={() => setEventToEdit(event)}
                            onUnsave={() => handleUnsave(event.id)}
                            onConfirmAction={(action) => setConfirmModal({ action, eventId: event.id })}
                            onLaunchEdition={() => handleLaunchEdition(event)}
                            onViewQr={() => setQrModalEvent(event)}
                        />
                    ))
                )}
            </div>

            {/* QR Code Modal */}
            {qrModalEvent && (
                <EventQrModal
                    event={qrModalEvent}
                    onClose={() => setQrModalEvent(null)}
                />
            )}

            {/* Confirm Action Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-bg-side border border-border-theme rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-orange-400" />
                            </div>
                            <h3 className="font-black text-text-main text-base">
                                {confirmModal.action === 'cancel' ? t('myEvents.cancelTitle') : t('myEvents.postponeTitle')}
                            </h3>
                        </div>
                        <p className="text-text-muted text-sm mb-6">
                            {confirmModal.action === 'cancel'
                                ? t('myEvents.cancelWarning')
                                : t('myEvents.postponeWarning')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 py-2.5 rounded-xl border border-border-theme text-text-muted hover:text-text-main hover:bg-bg-sub transition text-sm font-bold"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => updateStatus(confirmModal.eventId, confirmModal.action === 'cancel' ? 'cancelled' : 'delayed')}
                                disabled={!!actionLoading}
                                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 transition disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('myEvents.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent as any}
                    isOpen={!!selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}

            {/* Create/New Event shortcut */}
            {(showCreateModal || eventToEdit) && (
                <CreateEventModal
                    isOpen={true}
                    initialData={eventToEdit as any}
                    onClose={() => { setShowCreateModal(false); setEventToEdit(null); }}
                    onCreated={() => { setShowCreateModal(false); setEventToEdit(null); fetchEvents(); }}
                />
            )}
        </div>
    );
}

// ── Event Card Sub-Component ────────────────────────────────────────────────
interface EventCardProps {
    event: MyEvent;
    tab: Tab;
    actionLoading: boolean;
    onView: () => void;
    onEdit: () => void;
    onUnsave: () => void;
    onConfirmAction: (a: 'cancel' | 'postpone') => void;
    onLaunchEdition: () => void;
    onViewQr: () => void;
}

function EventCard({ event, tab, actionLoading, onView, onEdit, onUnsave, onConfirmAction, onLaunchEdition, onViewQr }: EventCardProps) {
    const { t, i18n } = useTranslation();
    const isPast = isEventPast(event);
    const hasStarted = event.date ? hasEventStarted(`${event.date}T${event.start_time || '00:00'}`) : false;
    const isCancelled = event.status === 'cancelled';
    const displayStatus = isPast && !isCancelled ? 'finished' : event.status;
    const showActions = tab === 'published' && !isPast && !isCancelled;

    const dateStr = event.date
        ? new Date(event.date + 'T12:00:00').toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

    return (
        <article className={`bg-bg-side border border-border-theme rounded-2xl overflow-hidden shadow-sm transition-all hover:border-brand-primary/30 ${isPast ? 'opacity-70' : ''}`}>
            {/* Main row */}
            <div
                className="flex gap-0 cursor-pointer"
                onClick={onView}
            >
                {/* Banner */}
                <div className="w-28 shrink-0 bg-bg-sub relative overflow-hidden">
                    {event.banner_url ? (
                        <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" style={{ minHeight: 120 }} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[120px]">
                            <Calendar size={28} className="text-text-muted/30" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-black text-text-main text-sm leading-tight line-clamp-2 flex-1">
                            {event.title}
                        </h3>
                        <StatusBadge status={displayStatus} />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-text-muted text-xs">
                            <Calendar size={11} />
                            <span>{dateStr}</span>
                            {event.start_time && <span className="text-text-muted/50">· {event.start_time.slice(0, 5)}</span>}
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-1.5 text-text-muted text-xs">
                                <MapPin size={11} />
                                <span className="truncate max-w-[180px]">{event.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Stats — only for published tab */}
                    {tab === 'published' && (
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-divider-theme">
                            <div className="flex items-center gap-1 text-xs text-text-muted">
                                <Heart size={11} className="text-accent-red" />
                                <span className="font-bold">{event.likes_count ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-text-muted">
                                <Bookmark size={11} className="text-blue-400" />
                                <span className="font-bold">{event.saved_count ?? 0}</span>
                            </div>
                            {(event.views_count ?? 0) > 0 && (
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Eye size={11} />
                                    <span className="font-bold">{event.views_count}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Rejection reason */}
                    {event.status === 'rejected' && event.rejection_reason && (
                        <p className="mt-2 text-[11px] text-accent-red/80 bg-accent-red/5 border border-accent-red/10 rounded-lg px-2 py-1 leading-snug">
                            💬 {event.rejection_reason}
                        </p>
                    )}
                </div>
            </div>

            {/* Actions footer */}
            <div className="border-t border-divider-theme px-4 py-2.5 flex items-center justify-end gap-2 bg-bg-sub/30 flex-wrap">
                {tab === 'saved' && (
                    <button
                        onClick={onUnsave}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 size={11} className="animate-spin" /> : <Bookmark size={11} />}
                        {t('myEvents.remove')}
                    </button>
                )}

                {tab === 'published' && (
                    <>
                        {event.qr_approved && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewQr(); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border border-amber-400/20 transition"
                            >
                                <Ticket size={11} /> {t('events.viewQr', 'Ver QR')}
                            </button>
                        )}

                        {showActions ? (
                            <>
                                {!hasStarted && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition"
                                    >
                                        <Pencil size={11} /> {t('myEvents.edit')}
                                    </button>
                                )}

                                {(event.status === 'approved' || event.status === 'delayed') && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onConfirmAction('postpone'); }}
                                            disabled={actionLoading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 transition disabled:opacity-50"
                                        >
                                            <Clock size={11} /> {t('myEvents.postpone')}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onConfirmAction('cancel'); }}
                                            disabled={actionLoading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-accent-red/10 text-accent-red hover:bg-accent-red/20 border border-accent-red/20 transition disabled:opacity-50"
                                        >
                                            {actionLoading ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                                            {t('myEvents.cancel')}
                                        </button>
                                    </>
                                )}
                            </>
                        ) : isPast ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onLaunchEdition(); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 border border-brand-primary/20 transition"
                            >
                                <RefreshCw size={11} /> {t('events.launchEdition', 'Nueva Edición')}
                            </button>
                        ) : null}
                    </>
                )}
            </div>
        </article>
    );
}
