import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Coins, Search, ShieldAlert, Loader2, List, UserCheck, Calendar,
    Sparkles, X, Plus, ShoppingCart, Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAvatarSource } from '../../config/avatars';

interface SearchedUser {
    id: string;
    username: string;
    email: string;
    role: string;
    avatar_url: string | null;
    can_bill_frikicoins: boolean;
}

interface BillerAwardLog {
    id: string;
    biller_id: string;
    target_user_id: string;
    amount_pesos: number;
    frikicoins_awarded: number;
    created_at: string;
    biller?: { username: string } | null;
    target?: { username: string } | null;
}

interface BillerChargeLog {
    id: string;
    amount_fc: number;
    concept: string;
    status: 'pending' | 'completed' | 'cancelled' | 'expired';
    created_at: string;
    completed_at: string | null;
    biller?: { username: string } | null;
    customer?: { username: string } | null;
}

interface VipPass {
    id: string;
    user_id: string;
    username: string;
    full_name?: string;
    email?: string;
    avatar_url: string | null;
    event_id: string;
    event_title: string;
    event_date: string;
    event_end_date: string | null;
    multiplier: number;
    starts_at: string;
    expires_at: string;
    is_active: boolean;
    notes?: string | null;
    activated_by_id?: string;
    activated_by_username?: string | null;
    created_at: string;
}

interface EventOption {
    id: string;
    title: string;
    date: string;
    end_date: string | null;
}

export default function AdminBillers() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'permissions' | 'vip' | 'logs'>('permissions');

    // Permissions State
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<SearchedUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // VIP Passes State
    const [vipPasses, setVipPasses] = useState<VipPass[]>([]);
    const [loadingVip, setLoadingVip] = useState(false);
    const [vipSearchQuery, setVipSearchQuery] = useState('');
    const [showActivateVipModal, setShowActivateVipModal] = useState(false);

    // VIP Activation Modal State
    const [userSearchText, setUserSearchText] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<SearchedUser[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
    const [eventsList, setEventsList] = useState<EventOption[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [activateNotes, setActivateNotes] = useState('');
    const [activatingVip, setActivatingVip] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    // Logs State
    const [logSubTab, setLogSubTab] = useState<'charges' | 'awards'>('charges');
    const [awardLogs, setAwardLogs] = useState<BillerAwardLog[]>([]);
    const [chargeLogs, setChargeLogs] = useState<BillerChargeLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const LOGS_PER_PAGE = 20;

    useEffect(() => {
        if (activeTab === 'permissions') {
            handleSearch();
        } else if (activeTab === 'vip') {
            loadVipPasses();
        } else {
            loadLogs(1, logSubTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, logSubTab]);

    // Helpers
    const getTodayColombiaStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-CO') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // ── Staff Permissions ──────────────────────────────────────────────────
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoadingUsers(true);
        try {
            let query = supabase
                .from('profiles')
                .select('id, username, email, role, avatar_url, can_bill_frikicoins')
                .limit(50);

            if (searchQuery.trim()) {
                query = query.or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
            } else {
                query = query.or('role.neq.user,can_bill_frikicoins.eq.true');
            }

            const { data, error } = await query;
            if (error) throw error;
            setUsers(data as SearchedUser[]);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert(t('common.error', 'Error'));
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleToggleBiller = async (userId: string, currentValue: boolean) => {
        setUpdatingId(userId);
        try {
            const newValue = !currentValue;
            const { error } = await supabase
                .from('profiles')
                .update({ can_bill_frikicoins: newValue })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, can_bill_frikicoins: newValue } : u));
        } catch (error) {
            console.error('Error updating biller status:', error);
            alert(t('common.error', 'Error'));
        } finally {
            setUpdatingId(null);
        }
    };

    // ── VIP Passes ─────────────────────────────────────────────────────────
    const loadVipPasses = async () => {
        setLoadingVip(true);
        try {
            const { data, error } = await supabase.rpc('get_active_vip_passes_list');
            if (error) throw error;
            setVipPasses((data as VipPass[]) || []);
        } catch (error) {
            console.error('Error loading VIP passes:', error);
        } finally {
            setLoadingVip(false);
        }
    };

    const openActivateVipModal = async () => {
        setSelectedUser(null);
        setUserSearchText('');
        setUserSearchResults([]);
        setActivateNotes('');
        setShowActivateVipModal(true);

        try {
            const todayStr = getTodayColombiaStr();
            const { data, error } = await supabase
                .from('events')
                .select('id, title, date, end_date')
                .eq('status', 'approved')
                .or(`end_date.gte.${todayStr},date.gte.${todayStr}`)
                .order('date', { ascending: true });

            if (error) throw error;
            const events = (data as EventOption[]) || [];
            setEventsList(events);
            if (events.length > 0) {
                setSelectedEventId(events[0].id);
            }
        } catch (err) {
            console.error('Error loading events for VIP activation:', err);
        }
    };

    const handleSearchVipUsers = async (text: string) => {
        setUserSearchText(text);
        const clean = text.trim().replace('@', '');
        if (clean.length < 2) {
            setUserSearchResults([]);
            return;
        }

        setSearchingUsers(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, email, role, avatar_url, can_bill_frikicoins')
                .or(`username.ilike.%${clean}%,email.ilike.%${clean}%`)
                .limit(8);

            if (error) throw error;
            setUserSearchResults((data as SearchedUser[]) || []);
        } catch (err) {
            console.error('Error searching user for VIP:', err);
        } finally {
            setSearchingUsers(false);
        }
    };

    const handleConfirmActivateVip = async () => {
        if (!selectedUser) {
            alert(t('vipPass.selectUserPrompt', 'Por favor busca y selecciona un usuario'));
            return;
        }
        if (!selectedEventId) {
            alert(t('vipPass.selectEventPrompt', 'Por favor selecciona el evento correspondiente'));
            return;
        }

        setActivatingVip(true);
        try {
            const { data, error } = await supabase.rpc('activate_event_vip_pass', {
                p_target_user_id: selectedUser.id,
                p_event_id: selectedEventId,
                p_notes: activateNotes.trim() || null,
            });

            if (error) throw error;
            if (!data?.success) {
                alert(data?.message || 'Error al activar Pase VIP');
                return;
            }

            alert(data.message || 'Pase VIP activado con éxito');
            setShowActivateVipModal(false);
            loadVipPasses();
        } catch (err: any) {
            console.error('Error activating VIP pass:', err);
            alert(err.message || 'Error al procesar la activación');
        } finally {
            setActivatingVip(false);
        }
    };

    const handleRevokeVip = async (pass: VipPass) => {
        const confirmMsg = t('vipPass.revokeConfirmMsg', {
            username: pass.username,
            event: pass.event_title,
            defaultValue: `¿Estás seguro de revocar el Pase VIP de @${pass.username} para "${pass.event_title}"? Desactivará el multiplicador x2 de inmediato.`
        });
        if (!window.confirm(confirmMsg)) return;

        setRevokingId(pass.id);
        try {
            const { data, error } = await supabase.rpc('revoke_event_vip_pass', {
                p_pass_id: pass.id,
                p_reason: 'Revocado por administrador'
            });

            if (error) throw error;
            if (!data?.success) {
                alert(data?.message || 'No se pudo revocar el pase');
                return;
            }

            alert(data.message || `Pase de @${pass.username} revocado.`);
            loadVipPasses();
        } catch (err: any) {
            console.error('Error revoking VIP pass:', err);
            alert(err.message || 'Error al revocar el Pase VIP');
        } finally {
            setRevokingId(null);
        }
    };

    // ── Logs & Audit ───────────────────────────────────────────────────────
    const loadLogs = async (pageNumber: number, type: 'charges' | 'awards') => {
        setLoadingLogs(true);
        try {
            const offset = (pageNumber - 1) * LOGS_PER_PAGE;

            if (type === 'charges') {
                const { data, error, count } = await supabase
                    .from('frikicoins_biller_charges')
                    .select(`
                        id, amount_fc, concept, status, created_at, completed_at,
                        biller:profiles!biller_id(username),
                        customer:profiles!customer_id(username)
                    `, { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(offset, offset + LOGS_PER_PAGE - 1);

                if (error) throw error;

                const formatted = (data as any[] || []).map(item => ({
                    ...item,
                    biller: Array.isArray(item.biller) ? item.biller[0] : item.biller,
                    customer: Array.isArray(item.customer) ? item.customer[0] : item.customer,
                }));

                setChargeLogs(formatted);
                setTotalLogs(count || 0);
            } else {
                const date30DaysAgo = new Date();
                date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

                const { data, error, count } = await supabase
                    .from('frikicoins_biller_logs')
                    .select(`
                        id, amount_pesos, frikicoins_awarded, created_at,
                        biller:profiles!biller_id(username),
                        target:profiles!target_user_id(username)
                    `, { count: 'exact' })
                    .gte('created_at', date30DaysAgo.toISOString())
                    .order('created_at', { ascending: false })
                    .range(offset, offset + LOGS_PER_PAGE - 1);

                if (error) throw error;

                const formatted = (data as any[] || []).map(item => ({
                    ...item,
                    biller: Array.isArray(item.biller) ? item.biller[0] : item.biller,
                    target: Array.isArray(item.target) ? item.target[0] : item.target,
                }));

                setAwardLogs(formatted);
                setTotalLogs(count || 0);
            }

            setPage(pageNumber);
        } catch (error) {
            console.error('Error loading logs:', error);
            alert(t('common.error', 'Error'));
        } finally {
            setLoadingLogs(false);
        }
    };

    // Filter VIP passes in view
    const filteredVipPasses = vipPasses.filter(p => {
        if (!vipSearchQuery.trim()) return true;
        const q = vipSearchQuery.toLowerCase();
        return (
            p.username.toLowerCase().includes(q) ||
            p.event_title.toLowerCase().includes(q) ||
            (p.full_name && p.full_name.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 text-amber-500 p-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <Coins size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">
                            {t('adminBillers.title', 'Facturadores & Pases VIP')}
                        </h1>
                        <p className="text-sm text-amber-500 font-bold">
                            {t('adminBillers.subtitle', 'Gestión de stands físicos, multiplicadores x2 y auditoría')}
                        </p>
                    </div>
                </div>

                {activeTab === 'vip' && (
                    <button
                        onClick={openActivateVipModal}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-text-inv font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>{t('vipPass.activateBtn', 'Activar Pase VIP')}</span>
                    </button>
                )}
            </div>

            {/* Main Tabs (3 Tabs) */}
            <div className="flex gap-2 p-1 bg-bg-pop border border-border-theme rounded-xl w-full max-w-lg mx-auto sm:mx-0">
                <button
                    onClick={() => setActiveTab('permissions')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                        activeTab === 'permissions' ? 'bg-amber-500 text-white shadow-lg' : 'text-text-muted hover:bg-bg-sub'
                    }`}
                >
                    <UserCheck size={16} /> {t('adminBillers.tabs.permissions', 'Personal')}
                </button>
                <button
                    onClick={() => setActiveTab('vip')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                        activeTab === 'vip' ? 'bg-amber-500 text-white shadow-lg' : 'text-text-muted hover:bg-bg-sub'
                    }`}
                >
                    <Sparkles size={16} /> {t('vipPass.tabTitle', 'Pases VIP')}
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                        activeTab === 'logs' ? 'bg-amber-500 text-white shadow-lg' : 'text-text-muted hover:bg-bg-sub'
                    }`}
                >
                    <List size={16} /> {t('adminBillers.tabs.logs', 'Auditoría')}
                </button>
            </div>

            {/* TAB 1: PERMISSIONS */}
            {activeTab === 'permissions' && (
                <>
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder={t('adminBillers.searchPlaceholder', 'Buscar por @usuario o correo...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-pop border border-border-theme rounded-xl pl-12 pr-28 py-3.5 text-text-main placeholder-text-muted focus:outline-none focus:border-amber-500 transition"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                        <button
                            type="submit"
                            disabled={loadingUsers}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition"
                        >
                            {t('common.search', 'Buscar')}
                        </button>
                    </form>

                    {loadingUsers ? (
                        <div className="flex flex-col items-center justify-center py-12 text-amber-500">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="font-bold">{t('common.loading', 'Cargando...')}</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 bg-bg-pop border border-border-theme rounded-2xl">
                            <ShieldAlert size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
                            <h3 className="text-xl font-black text-text-main mb-2">{t('common.noMatches', 'Sin coincidencias')}</h3>
                        </div>
                    ) : (
                        <div className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-bg-sub border-b border-border-theme text-xs uppercase text-text-muted font-bold">
                                        <tr>
                                            <th className="px-6 py-4">{t('adminBillers.table.user', 'Usuario')}</th>
                                            <th className="px-6 py-4 text-center">{t('adminBillers.table.permission', 'Permiso Facturador')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-theme">
                                        {users.map((u) => (
                                            <tr key={u.id} className="hover:bg-bg-sub/50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={getAvatarSource(u.avatar_url)} alt="Avatar" className="w-10 h-10 rounded-full bg-bg-main border border-border-theme object-cover" />
                                                        <div>
                                                            <div className="font-bold text-text-main">@{u.username}</div>
                                                            <div className="text-xs text-text-muted flex gap-2">
                                                                <span>{u.email}</span>
                                                                <span className="opacity-50">•</span>
                                                                <span className="uppercase">{u.role}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleToggleBiller(u.id, u.can_bill_frikicoins)}
                                                        disabled={updatingId === u.id}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                                            u.can_bill_frikicoins ? 'bg-amber-500' : 'bg-bg-main border border-border-theme'
                                                        } ${updatingId === u.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                                u.can_bill_frikicoins ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* TAB 2: VIP PASSES */}
            {activeTab === 'vip' && (
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('vipPass.searchPlaceholder', 'Buscar por usuario o evento...')}
                            value={vipSearchQuery}
                            onChange={(e) => setVipSearchQuery(e.target.value)}
                            className="w-full bg-bg-pop border border-border-theme rounded-xl pl-12 pr-4 py-3.5 text-text-main placeholder-text-muted focus:outline-none focus:border-amber-500 transition"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    </div>

                    {loadingVip ? (
                        <div className="flex flex-col items-center justify-center py-12 text-amber-500">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="font-bold">{t('common.loading', 'Cargando Pases VIP...')}</p>
                        </div>
                    ) : filteredVipPasses.length === 0 ? (
                        <div className="text-center py-12 bg-bg-pop border border-border-theme rounded-2xl">
                            <Sparkles size={48} className="mx-auto text-amber-500/50 mb-4" />
                            <h3 className="text-xl font-black text-text-main mb-2">
                                {t('vipPass.noActiveTitle', 'No hay Pases VIP activos')}
                            </h3>
                            <p className="text-text-muted text-sm max-w-sm mx-auto">
                                {t('vipPass.noActiveDesc', 'Los pases activados durante eventos con multiplicador x2 aparecerán aquí.')}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-bg-sub border-b border-border-theme text-xs uppercase text-text-muted font-bold">
                                        <tr>
                                            <th className="px-6 py-4">{t('vipPass.table.user', 'Usuario')}</th>
                                            <th className="px-6 py-4">{t('vipPass.table.event', 'Evento')}</th>
                                            <th className="px-6 py-4">{t('vipPass.table.multiplier', 'Beneficio')}</th>
                                            <th className="px-6 py-4">{t('vipPass.table.expires', 'Vigencia')}</th>
                                            <th className="px-6 py-4 text-center">{t('common.actions', 'Acciones')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-theme">
                                        {filteredVipPasses.map((pass) => (
                                            <tr key={pass.id} className="hover:bg-bg-sub/50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={getAvatarSource(pass.avatar_url)}
                                                            alt="Avatar"
                                                            className="w-10 h-10 rounded-full bg-bg-main border-2 border-amber-500 object-cover"
                                                        />
                                                        <div>
                                                            <div className="font-black text-text-main flex items-center gap-1.5">
                                                                <span>@{pass.username}</span>
                                                                <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-black">
                                                                    VIP
                                                                </span>
                                                            </div>
                                                            {pass.full_name && (
                                                                <p className="text-xs text-text-muted">{pass.full_name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-main text-sm">{pass.event_title}</div>
                                                    <p className="text-xs text-text-muted">Fecha: {pass.event_date}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-black text-xs">
                                                        <Sparkles size={12} /> x{pass.multiplier || 2} FC
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-text-muted font-medium">
                                                    Hasta: {formatDate(pass.expires_at)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleRevokeVip(pass)}
                                                        disabled={revokingId === pass.id}
                                                        className="px-3 py-1.5 bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red/20 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                                    >
                                                        {revokingId === pass.id ? (
                                                            <Loader2 size={14} className="animate-spin inline" />
                                                        ) : (
                                                            t('vipPass.revoke', 'Revocar')
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: AUDIT & LOGS */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    {/* Sub-tabs for Logs */}
                    <div className="flex gap-2 border-b border-border-theme pb-2">
                        <button
                            onClick={() => setLogSubTab('charges')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                                logSubTab === 'charges'
                                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                    : 'text-text-muted hover:text-text-main'
                            }`}
                        >
                            <ShoppingCart size={15} /> Cobros Stand / POS
                        </button>
                        <button
                            onClick={() => setLogSubTab('awards')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
                                logSubTab === 'awards'
                                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                                    : 'text-text-muted hover:text-text-main'
                            }`}
                        >
                            <Award size={15} /> Emisión Físico COP (30d)
                        </button>
                    </div>

                    {loadingLogs ? (
                        <div className="flex flex-col items-center justify-center py-12 text-amber-500">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="font-bold">{t('common.loading', 'Cargando registros...')}</p>
                        </div>
                    ) : logSubTab === 'charges' ? (
                        chargeLogs.length === 0 ? (
                            <div className="text-center py-12 bg-bg-pop border border-border-theme rounded-2xl">
                                <ShoppingCart size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
                                <h3 className="text-xl font-black text-text-main mb-2">{t('biller.noCharges', 'Sin cobros registrados')}</h3>
                                <p className="text-text-muted text-sm">{t('biller.noChargesDesc', 'No hay transacciones POS de cobro en stand aún.')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-bg-sub border-b border-border-theme text-xs uppercase text-text-muted font-bold">
                                                <tr>
                                                    <th className="px-6 py-4">{t('biller.date', 'Fecha')}</th>
                                                    <th className="px-6 py-4">{t('biller.staff', 'Staff (Facturador)')}</th>
                                                    <th className="px-6 py-4">{t('biller.client', 'Cliente')}</th>
                                                    <th className="px-6 py-4">{t('biller.concept', 'Concepto')}</th>
                                                    <th className="px-6 py-4 text-center">{t('biller.status', 'Estado')}</th>
                                                    <th className="px-6 py-4 text-right">{t('biller.amount', 'Monto')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-theme">
                                                {chargeLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-bg-sub/50 transition">
                                                        <td className="px-6 py-4 text-xs text-text-muted">
                                                            {formatDate(log.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-brand-primary text-sm">
                                                            @{log.biller?.username || 'Staff'}
                                                        </td>
                                                        <td className="px-6 py-4 text-text-main text-sm">
                                                            {log.customer?.username ? `@${log.customer.username}` : '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs text-text-muted max-w-xs truncate">
                                                            {log.concept}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                                log.status === 'completed'
                                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                                    : log.status === 'pending'
                                                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                                                    : 'bg-accent-red/15 text-accent-red border border-accent-red/30'
                                                            }`}>
                                                                {log.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="font-black text-amber-500">
                                                                {log.amount_fc.toLocaleString('es-CO')} FC
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        awardLogs.length === 0 ? (
                            <div className="text-center py-12 bg-bg-pop border border-border-theme rounded-2xl">
                                <Calendar size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
                                <h3 className="text-xl font-black text-text-main mb-2">{t('adminBillers.logs.emptyTitle', 'Sin registros recientes')}</h3>
                                <p className="text-text-muted">{t('adminBillers.logs.emptyMessage', 'No se han emitido Frikicoins físicos en los últimos 30 días.')}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-bg-sub border-b border-border-theme text-xs uppercase text-text-muted font-bold">
                                                <tr>
                                                    <th className="px-6 py-4">{t('adminBillers.logs.table.date', 'Fecha')}</th>
                                                    <th className="px-6 py-4">{t('adminBillers.logs.table.biller', 'Facturador (Staff)')}</th>
                                                    <th className="px-6 py-4">{t('adminBillers.logs.table.receiver', 'Receptor (Usuario)')}</th>
                                                    <th className="px-6 py-4 text-right">{t('biller.pesosCop', 'Pesos ($ COP)')}</th>
                                                    <th className="px-6 py-4 text-right">{t('adminBillers.logs.table.amount', 'Frikicoins')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-theme">
                                                {awardLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-bg-sub/50 transition">
                                                        <td className="px-6 py-4 text-xs text-text-muted">
                                                            {formatDate(log.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-brand-primary text-sm">
                                                            @{log.biller?.username || t('common.unknown', 'Desconocido')}
                                                        </td>
                                                        <td className="px-6 py-4 text-text-main text-sm">
                                                            @{log.target?.username || t('common.unknown', 'Desconocido')}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-xs text-text-muted">
                                                            ${Number(log.amount_pesos || 0).toLocaleString('es-CO')}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="font-black text-amber-500">
                                                                +{log.frikicoins_awarded} FC
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* Pagination */}
                    {totalLogs > LOGS_PER_PAGE && (
                        <div className="flex justify-between items-center bg-bg-pop p-4 rounded-xl border border-border-theme">
                            <span className="text-xs text-text-muted">
                                {t('common.showing', 'Mostrando')} {((page - 1) * LOGS_PER_PAGE) + 1} - {Math.min(page * LOGS_PER_PAGE, totalLogs)} {t('common.of', 'de')} {totalLogs}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => loadLogs(page - 1, logSubTab)}
                                    className="px-3 py-1 bg-bg-sub text-text-main rounded-lg disabled:opacity-50 text-xs font-bold"
                                >
                                    {t('common.previous', 'Anterior')}
                                </button>
                                <button
                                    disabled={page * LOGS_PER_PAGE >= totalLogs}
                                    onClick={() => loadLogs(page + 1, logSubTab)}
                                    className="px-3 py-1 bg-bg-sub text-text-main rounded-lg disabled:opacity-50 text-xs font-bold"
                                >
                                    {t('common.next', 'Siguiente')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ACTIVATE VIP PASS MODAL */}
            {showActivateVipModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-bg-pop border border-border-theme rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-border-theme pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-text-main leading-none">
                                        {t('vipPass.modalTitle', 'Activar Pase VIP (x2)')}
                                    </h3>
                                    <p className="text-xs text-text-muted mt-1">
                                        Multiplicador presencial para evento oficial
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowActivateVipModal(false)}
                                className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-bg-sub transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search User */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">
                                1. {t('vipPass.searchUserLabel', 'Buscar Usuario (@username o correo)')}
                            </label>
                            <input
                                type="text"
                                placeholder={t('biller.searchPlaceholder', '@usuario o correo...')}
                                value={userSearchText}
                                onChange={(e) => handleSearchVipUsers(e.target.value)}
                                className="w-full bg-bg-side border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-amber-500 transition"
                            />

                            {searchingUsers && (
                                <div className="flex items-center gap-2 text-xs text-amber-500 mt-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>{t('biller.searchingUser', 'Buscando usuario...')}</span>
                                </div>
                            )}

                            {userSearchResults.length > 0 && !selectedUser && (
                                <div className="mt-2 border border-border-theme rounded-xl max-h-40 overflow-y-auto divide-y divide-border-theme bg-bg-side">
                                    {userSearchResults.map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setUserSearchResults([]);
                                            }}
                                            className="w-full p-2.5 text-left flex items-center gap-3 hover:bg-bg-sub transition"
                                        >
                                            <img
                                                src={getAvatarSource(u.avatar_url)}
                                                alt="Avatar"
                                                className="w-8 h-8 rounded-full border border-border-theme"
                                            />
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs text-text-main">@{u.username}</div>
                                                <div className="text-[10px] text-text-muted truncate">{u.email}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedUser && (
                                <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={getAvatarSource(selectedUser.avatar_url)}
                                            alt="Avatar"
                                            className="w-9 h-9 rounded-full border-2 border-amber-500"
                                        />
                                        <div>
                                            <div className="font-black text-xs text-text-main">@{selectedUser.username}</div>
                                            <div className="text-[10px] text-text-muted">{selectedUser.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedUser(null)}
                                        className="text-xs font-bold text-accent-red hover:underline"
                                    >
                                        {t('common.change', 'Cambiar')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Event Selector */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">
                                2. {t('vipPass.selectEventLabel', 'Evento Correspondiente')}
                            </label>
                            {eventsList.length === 0 ? (
                                <p className="text-xs text-text-muted italic">
                                    {t('vipPass.noActiveEvents', 'No hay eventos activos programados para hoy o próximos días.')}
                                </p>
                            ) : (
                                <select
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    className="w-full bg-bg-side border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-amber-500 transition"
                                >
                                    {eventsList.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.title} ({ev.date}{ev.end_date ? ` al ${ev.end_date}` : ''})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Optional Notes */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-text-muted mb-2">
                                3. {t('vipPass.notesLabel', 'Notas / Código de Manilla (Opcional)')}
                            </label>
                            <input
                                type="text"
                                placeholder={t('biller.deliveryNotePlaceholder', 'Ej: Manilla dorada #042 entregada en taquilla')}
                                value={activateNotes}
                                onChange={(e) => setActivateNotes(e.target.value)}
                                className="w-full bg-bg-side border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-amber-500 transition"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowActivateVipModal(false)}
                                className="flex-1 py-3 rounded-xl border border-border-theme text-text-muted font-bold text-xs uppercase tracking-wider hover:bg-bg-sub transition"
                            >
                                {t('common.cancel', 'Cancelar')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmActivateVip}
                                disabled={activatingVip || !selectedUser || !selectedEventId}
                                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-text-inv font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                            >
                                {activatingVip ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Sparkles size={16} />
                                )}
                                <span>{t('vipPass.confirmActivate', 'Activar Pase')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
