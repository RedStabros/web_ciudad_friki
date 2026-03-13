import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    QrCode, PlusCircle, Loader2, Trash2, Edit3,
    PieChart, UserPlus, XCircle, Search, Power, Shield
} from 'lucide-react';
import { QRAdminService } from '../../services/QRAdminService';
import type { EventCode, QRAssignment } from '../../services/QRAdminService';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminQRs() {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [codes, setCodes] = useState<EventCode[]>([]);
    const [assignments, setAssignments] = useState<QRAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'codes' | 'assignments'>('codes');

    // Stats
    const [stats, setStats] = useState({ total_codes: 0, active_codes: 0, total_assignments: 0 });

    // Modals & form state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRedemptionsModal, setShowRedemptionsModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);

    const [editingCode, setEditingCode] = useState<EventCode | null>(null);
    const [newCodeName, setNewCodeName] = useState('');
    const [points, setPoints] = useState('');
    const [maxUses, setMaxUses] = useState('');
    const [expiryDays, setExpiryDays] = useState('');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    // Assignment modal states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState<any>(null);
    const [selectedEventCode, setSelectedEventCode] = useState<string>('');
    const [assignmentExpiry, setAssignmentExpiry] = useState('');

    const [redemptionsList, setRedemptionsList] = useState<any[]>([]);
    const [loadingRedemptions, setLoadingRedemptions] = useState(false);
    const [currentQrView, setCurrentQrView] = useState('');
    const [currentQrType, setCurrentQrType] = useState<'EVENT' | 'ASSIGN'>('EVENT');

    useEffect(() => {
        if (user) {
            if (activeTab === 'codes') loadCodes();
            else loadAssignments();
        }
    }, [user, activeTab]);

    const loadCodes = async () => {
        setLoading(true);
        try {
            const data = await QRAdminService.getEventCodes();
            setCodes(data);
            setStats(s => ({
                ...s,
                total_codes: data.length,
                active_codes: data.filter(c => c.is_active).length
            }));
        } catch (error) {
            console.error('Error loading QR codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const data = await QRAdminService.getAssignments();
            setAssignments(data);
            setStats(s => ({ ...s, total_assignments: data.length }));
        } catch (error) {
            console.error('Error loading QR assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCode = async () => {
        if (!points || parseInt(points) <= 0) {
            alert(t('adminQRs.errors.invalidPoints'));
            return;
        }

        const fullCode = newCodeName.startsWith('EVENT:') ? newCodeName : `EVENT:${newCodeName || Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        let expiryDate = expiresAt;
        if (expiryDays) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(expiryDays));
            expiryDate = date.toISOString();
        }

        setLoading(true);
        const { error } = await QRAdminService.createOrUpdateCode({
            id: editingCode?.id,
            code: fullCode,
            points: parseInt(points),
            max_uses: maxUses ? parseInt(maxUses) : null,
            expires_at: expiryDate
        });

        if (error) {
            alert(t('adminQRs.errors.saveError', { message: error.message }));
        } else {
            setShowCreateModal(false);
            setEditingCode(null);
            loadCodes();
        }
        setLoading(false);
    };

    const toggleCodeStatus = async (id: string, is_active: boolean) => {
        await QRAdminService.toggleCodeStatus(id, is_active);
        loadCodes();
    };

    const deleteCode = async (id: string) => {
        if (window.confirm(t('adminQRs.errors.deleteConfirm'))) {
            await QRAdminService.deleteCode(id);
            loadCodes();
        }
    };

    const openEditModal = (code: EventCode) => {
        setEditingCode(code);
        setNewCodeName(code.code.startsWith('EVENT:') ? code.code.substring(6) : code.code);
        setPoints(code.points.toString());
        setMaxUses(code.max_uses ? code.max_uses.toString() : '');
        setExpiryDays('');
        setExpiresAt(code.expires_at);
        setShowCreateModal(true);
    };

    const viewRedemptions = async (eventId: string, codeName: string) => {
        setLoadingRedemptions(true);
        setShowRedemptionsModal(true);
        setCurrentQrView(codeName);
        const { data, error } = await QRAdminService.getRedemptions(eventId);
        if (!error && data) {
            setRedemptionsList(data);
        } else {
            setRedemptionsList([]);
            alert(t('adminQRs.errors.loadRedemptionsError'));
        }
        setLoadingRedemptions(false);
    };

    const openQrModal = (code: string, type: 'EVENT' | 'ASSIGN' = 'EVENT') => {
        setCurrentQrView(code);
        setCurrentQrType(type);
        setShowQrModal(true);
    };

    // --- Assign Worker functions ---
    const searchStaff = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        const results = await QRAdminService.searchWorkers(q);
        setSearchResults(results);
        setSearching(false);
    };

    const handleCreateAssignment = async () => {
        if (!selectedWorker || !selectedEventCode) {
            alert(t('adminQRs.errors.selectionRequired'));
            return;
        }

        let expiryDate = null;
        if (assignmentExpiry) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(assignmentExpiry));
            expiryDate = date.toISOString();
        }

        setLoading(true);
        const { error } = await QRAdminService.createAssignment(selectedWorker.id, selectedEventCode, expiryDate);
        if (error) {
            alert(t('common.error') + ': ' + error.message);
        } else {
            setShowAssignModal(false);
            setSelectedWorker(null);
            setSelectedEventCode('');
            setAssignmentExpiry('');
            loadAssignments();
        }
        setLoading(false);
    };

    const deactivateAssignment = async (id: string) => {
        if (window.confirm(t('adminQRs.errors.deactivateConfirm'))) {
            await QRAdminService.deactivateAssignment(id);
            loadAssignments();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <QrCode size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminQRs.title')}</h1>
                        <p className="text-sm text-brand-primary font-bold">{t('adminQRs.subtitle')}</p>
                    </div>
                </div>

                {activeTab === 'codes' ? (
                    <button
                        onClick={() => {
                            setEditingCode(null); setNewCodeName(''); setPoints(''); setMaxUses(''); setExpiryDays(''); setExpiresAt(null); setShowCreateModal(true);
                        }}
                        className="bg-brand-primary hover:bg-blue-600 text-white font-black py-2.5 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-brand-primary/20 justify-center"
                    >
                        <PlusCircle size={20} /> {t('adminQRs.createCode')}
                    </button>
                ) : (
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="bg-[#10b981] hover:bg-[#059669] text-white font-black py-2.5 px-5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-[#10b981]/20 justify-center"
                    >
                        <UserPlus size={20} /> {t('adminQRs.assignCode')}
                    </button>
                )}
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-text-main mb-1 leading-none">{stats.total_codes}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">{t('adminQRs.stats.totalCodes')}</span>
                </div>
                <div className="bg-bg-pop border border-accent-green/30 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent-green/5 rounded-full -mr-8 -mt-8"></div>
                    <span className="text-2xl font-black text-accent-green mb-1 leading-none">{stats.active_codes}</span>
                    <span className="text-xs font-bold text-text-muted uppercase text-center">{t('adminQRs.stats.activeCodes')}</span>
                </div>
                <div className="col-span-2 md:col-span-1 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-4 flex flex-col items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-brand-primary mb-1 leading-none flex items-center gap-1"><Shield size={20} /> {stats.total_assignments}</span>
                    <span className="text-xs font-bold text-brand-primary uppercase text-center">{t('adminQRs.stats.staffAssignments')}</span>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div className="flex items-center gap-2 border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('codes')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${activeTab === 'codes' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                        }`}
                >
                    {t('adminQRs.tabs.global')}
                </button>
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap capitalize ${activeTab === 'assignments' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                        }`}
                >
                    {t('adminQRs.tabs.staff')}
                </button>
            </div>

            {/* List */}
            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                        <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                        <p className="font-bold">{t('common.loading')}</p>
                    </div>
                ) : activeTab === 'codes' ? (
                    codes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                            <QrCode className="opacity-20 mb-4" size={48} />
                            <p className="font-bold text-text-main text-lg mb-1">{t('adminQRs.empty.noCodes')}</p>
                            <p className="text-sm max-w-sm mb-4">{t('adminQRs.empty.noCodesHint')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {codes.map(item => {
                                const isExpired = item.expires_at ? new Date(item.expires_at) < new Date() : false;
                                const isDepleted = item.max_uses ? item.current_uses >= item.max_uses : false;
                                const isLocked = isExpired || isDepleted;

                                return (
                                    <div key={item.id} className="bg-bg-side border border-border-theme hover:border-brand-primary/50 transition-colors rounded-2xl p-5 flex flex-col justify-between group">
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <h3 className="font-black text-lg text-text-main flex-1 break-all" title={item.code}>
                                                    {item.code}
                                                </h3>
                                                <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md border whitespace-nowrap ${item.is_active ? 'bg-accent-green/20 text-accent-green border-accent-green/30' : 'bg-black/50 text-text-sub border-border-theme'}`}>
                                                    {item.is_active ? t('adminQRs.card.active') : t('adminQRs.card.inactive')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme">
                                                    <span className="text-amber-500 font-black">{item.points} FC</span>
                                                </div>
                                                <button onClick={() => viewRedemptions(item.id, item.code)} className="flex items-center gap-1 text-text-sub font-bold text-xs bg-brand-primary/10 hover:bg-brand-primary hover:text-white transition px-2 py-1.5 rounded-lg border border-brand-primary/30 text-brand-primary">
                                                    <PieChart size={14} /> {t('adminQRs.card.redemptions', { current: item.current_uses, max: item.max_uses || '∞' })}
                                                </button>
                                                {item.expires_at && (
                                                    <div className="flex items-center gap-1 text-text-sub font-bold text-xs bg-bg-pop px-2 py-1.5 rounded-lg border border-border-theme w-full mt-1 opacity-70">
                                                        {t('adminQRs.card.expires', { date: new Date(item.expires_at).toLocaleString() })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border-t border-border-theme pt-3 mt-auto w-full flex flex-wrap gap-2 justify-between items-center">
                                            <div className="flex gap-2">
                                                <button onClick={() => toggleCodeStatus(item.id, item.is_active)} disabled={isLocked} className="p-2 bg-bg-pop text-text-muted hover:text-brand-primary disabled:opacity-30 rounded-lg border border-border-theme transition" title={t('common.status')}>
                                                    <Power size={18} />
                                                </button>
                                                <button onClick={() => openEditModal(item)} className="p-2 bg-bg-pop text-text-muted hover:text-amber-500 rounded-lg border border-border-theme transition" title={t('common.edit')}>
                                                    <Edit3 size={18} />
                                                </button>
                                                <button onClick={() => deleteCode(item.id)} className="p-2 bg-bg-pop text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-lg border border-border-theme transition" title={t('common.delete')}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                            <button onClick={() => openQrModal(item.code, 'EVENT')} className="flex items-center gap-1 px-4 py-2 font-black bg-text-main text-bg-pop rounded-xl hover:bg-white transition ml-auto">
                                                <QrCode size={16} /> {t('adminQRs.card.viewQr')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    assignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                            <Shield className="opacity-20 mb-4" size={48} />
                            <p className="font-bold text-text-main text-lg mb-1">{t('adminQRs.empty.noAssignments')}</p>
                            <p className="text-sm max-w-sm mb-4">{t('adminQRs.empty.noAssignmentsHint')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignments.map(item => (
                                <div key={item.id} className="bg-bg-side border border-border-theme rounded-2xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-black text-brand-primary">@{item.profiles?.username || 'Usuario'}</h4>
                                            <p className="text-xs text-text-muted">{item.profiles?.full_name}</p>
                                        </div>
                                        <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md border ${item.is_active ? 'bg-accent-green/20 text-accent-green border-accent-green/30' : 'bg-black/50 text-text-sub border-border-theme'}`}>
                                            {item.is_active ? t('adminQRs.card.active_v') : t('adminQRs.card.inactive_v')}
                                        </span>
                                    </div>
                                    <div className="bg-bg-pop p-3 rounded-xl border border-border-theme font-bold flex flex-col gap-1">
                                        <span className="text-sm text-text-main break-all">QR: {item.event_codes?.code}</span>
                                        <span className="text-xs text-amber-500">{item.event_codes?.points} FC Pts</span>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between border-t border-border-theme pt-3 gap-2">
                                        <span className="text-xs font-bold text-text-sub">{t('adminQRs.card.expires', { date: item.expires_at ? new Date(item.expires_at).toLocaleDateString() : t('common.never') })}</span>
                                        <div className="flex gap-2">
                                            {item.is_active && (
                                                <button onClick={() => deactivateAssignment(item.id)} className="p-1 px-3 text-xs font-bold text-text-sub bg-bg-pop hover:text-accent-red hover:bg-accent-red/10 border border-border-theme rounded-lg transition flex items-center gap-1">
                                                    <XCircle size={14} /> {t('adminQRs.card.revoke')}
                                                </button>
                                            )}
                                            <button onClick={() => openQrModal(`ASSIGN:${item.id}`, 'ASSIGN')} className="p-1 px-3 text-xs font-bold bg-brand-primary text-white rounded-lg transition flex items-center gap-1 shadow-lg shadow-brand-primary/20">
                                                <QrCode size={14} /> {t('common.qr')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Create Code Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-bg-side w-full max-w-md h-full shadow-2xl flex flex-col border-l border-border-theme relative slide-in-from-right duration-300">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-bg-pop">
                            <h2 className="text-xl font-black text-text-main">{editingCode ? t('adminQRs.modals.create.editTitle') : t('adminQRs.modals.create.title')}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-side transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('adminQRs.modals.create.nameLabel')}</label>
                                <input type="text" value={newCodeName} onChange={(e) => setNewCodeName(e.target.value)} className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-brand-primary outline-none" placeholder="Ej: EVENTO2026" />
                                <p className="text-xs text-text-muted mt-1 ml-1">{t('adminQRs.modals.create.nameHint')}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('adminQRs.modals.create.pointsLabel')}</label>
                                <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Ej: 100" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('adminQRs.modals.create.maxUsesLabel')}</label>
                                <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main outline-none" placeholder="Ej: 50" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('adminQRs.modals.create.expiryLabel')}</label>
                                <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main outline-none" placeholder="Ej: 7" />
                                {editingCode && expiresAt && (
                                    <p className="text-xs text-amber-500 mt-2 font-bold">Expira: {new Date(expiresAt).toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-border-theme bg-bg-pop">
                            <button onClick={handleCreateCode} disabled={loading} className="w-full py-3 rounded-xl font-bold bg-brand-primary hover:bg-blue-600 text-white flex items-center justify-center gap-2 transition disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
                                {editingCode ? t('adminQRs.modals.create.saveChanges') : t('adminQRs.modals.create.generate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Worker Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-bg-side w-full max-w-md h-full shadow-2xl flex flex-col border-l border-border-theme relative slide-in-from-right duration-300">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-bg-pop">
                            <h2 className="text-xl font-black text-text-main">{t('adminQRs.modals.assign.title')}</h2>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-side transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1">{t('adminQRs.modals.assign.searchLabel')}</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-[14px] text-text-muted" size={18} />
                                    <input type="text" value={searchQuery} onChange={(e) => searchStaff(e.target.value)} className="w-full bg-bg-pop border border-border-theme rounded-xl pl-12 pr-4 py-3 text-text-main outline-none focus:border-brand-primary" placeholder={t('common.search')} />
                                </div>
                                {searching ? <p className="text-xs text-brand-primary mt-2 font-bold flex items-center gap-1"><Loader2 className="animate-spin" size={12} /> {t('adminQRs.modals.assign.searching')}</p> : null}
                                {searchResults.length > 0 && !selectedWorker && (
                                    <div className="mt-2 bg-bg-pop border border-border-theme rounded-xl overflow-hidden divide-y divide-border-theme max-h-48 overflow-y-auto">
                                        {searchResults.map(w => (
                                            <button key={w.id} onClick={() => { setSelectedWorker(w); setSearchResults([]); }} className="w-full text-left p-3 hover:bg-bg-side transition flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-xs uppercase">{w.username.substring(0, 2)}</div>
                                                <div><p className="font-bold text-text-main text-sm">@{w.username}</p><p className="text-xs text-text-muted uppercase font-black">{w.role}</p></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedWorker && (
                                    <div className="mt-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-3 flex justify-between items-center text-[#10b981]">
                                        <div className="font-bold">@{selectedWorker.username} <span className="text-xs ml-2 opacity-70 uppercase">{selectedWorker.role}</span></div>
                                        <button onClick={() => setSelectedWorker(null)}><XCircle size={18} /></button>
                                    </div>
                                )}
                            </div>

                            {selectedWorker && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-1">{t('adminQRs.modals.assign.selectCode')}</label>
                                        <select value={selectedEventCode} onChange={(e) => setSelectedEventCode(e.target.value)} className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-[#10b981]">
                                            <option value="">{t('adminQRs.modals.assign.selectPlaceholder')}</option>
                                            {codes.filter(c => c.is_active).map(c => (
                                                <option key={c.id} value={c.id}>{c.code} ({c.points} FC)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-1">{t('adminQRs.modals.create.expiryLabel')}</label>
                                        <input type="number" value={assignmentExpiry} onChange={(e) => setAssignmentExpiry(e.target.value)} className="w-full bg-bg-pop border border-border-theme rounded-xl px-4 py-3 text-text-main outline-none focus:ring-2 focus:ring-[#10b981]" placeholder="Ej: 1 (Recomendado)" />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t border-border-theme bg-bg-pop">
                            <button onClick={handleCreateAssignment} disabled={!selectedWorker || !selectedEventCode || loading} className="w-full py-3 rounded-xl font-bold bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center gap-2 transition disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                                {t('adminQRs.modals.assign.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Redemptions Modal */}
            {showRedemptionsModal && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-bg-side w-full max-w-lg shadow-2xl rounded-2xl border border-border-theme relative flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-bg-pop rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-black text-text-main">{t('adminQRs.modals.redemptions.title')}</h2>
                                <p className="text-sm font-bold text-brand-primary break-all">{currentQrView}</p>
                            </div>
                            <button onClick={() => setShowRedemptionsModal(false)} className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-side transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {loadingRedemptions ? (
                                <div className="p-10 text-center text-text-muted flex flex-col items-center">
                                    <Loader2 className="animate-spin mb-3 text-brand-primary" size={32} />
                                    <p className="font-bold">{t('adminQRs.modals.redemptions.loading')}</p>
                                </div>
                            ) : redemptionsList.length === 0 ? (
                                <div className="p-10 text-center text-text-muted">
                                    <p className="font-bold">{t('adminQRs.modals.redemptions.empty')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border-theme">
                                    {redemptionsList.map((item, idx) => (
                                        <div key={idx} className="p-4 hover:bg-bg-pop transition flex items-center justify-between">
                                            <div>
                                                <p className="font-black text-text-main">@{item.username || 'Usuario'}</p>
                                                <p className="text-xs text-text-muted font-bold">{new Date(item.redeemed_at).toLocaleString()}</p>
                                            </div>
                                            <span className="text-xs font-black text-accent-green bg-accent-green/10 px-2 py-1 rounded-md">{t('adminQRs.modals.redemptions.status')}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View QR Code Image Modal */}
            {showQrModal && (
                <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full relative">
                        <button onClick={() => setShowQrModal(false)} className="absolute -top-12 right-0 text-white/50 hover:text-white transition">
                            <XCircle size={32} />
                        </button>
                        <h2 className="text-2xl font-black text-black text-center mb-6 break-all w-full">{currentQrView}</h2>

                        <div className="border-[12px] border-black rounded-xl overflow-hidden bg-white mb-6 p-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                            <QRCodeSVG
                                value={currentQrType === 'EVENT' ? `EVENT:${currentQrView}` : `ASSIGN:${currentQrView}`}
                                size={220}
                                level="H"
                            />
                        </div>

                        <p className="text-center text-sm font-bold text-gray-500">
                            {currentQrType === 'EVENT' ? t('adminQRs.modals.view.eventHint') : t('adminQRs.modals.view.assignHint')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
