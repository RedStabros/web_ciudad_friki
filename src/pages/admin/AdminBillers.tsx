import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Coins, Search, ShieldAlert, Loader2, List, UserCheck, Calendar } from 'lucide-react';
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

interface BillerLog {
    id: string;
    biller_id: string;
    user_id: string;
    amount: number;
    created_at: string;
    biller: { username: string };
    user: { username: string };
}

export default function AdminBillers() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'permissions' | 'logs'>('permissions');
    
    // Permissions State
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<SearchedUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Logs State
    const [logs, setLogs] = useState<BillerLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const LOGS_PER_PAGE = 20;

    useEffect(() => {
        if (activeTab === 'permissions') {
            handleSearch();
        } else {
            loadLogs(1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

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
                // By default show all admins/workers or people who can already bill
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

    const loadLogs = async (pageNumber: number) => {
        setLoadingLogs(true);
        try {
            const offset = (pageNumber - 1) * LOGS_PER_PAGE;
            
            // Limit to last 30 days
            const date30DaysAgo = new Date();
            date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
            
            const { data, error, count } = await supabase
                .from('frikicoins_biller_logs')
                .select(`
                    id, amount, created_at, biller_id, user_id,
                    biller:profiles!biller_id(username),
                    user:profiles!user_id(username)
                `, { count: 'exact' })
                .gte('created_at', date30DaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .range(offset, offset + LOGS_PER_PAGE - 1);

            if (error) throw error;
            
            // Format data
            const formattedData = (data as any[]).map(item => ({
                ...item,
                biller: Array.isArray(item.biller) ? item.biller[0] : item.biller,
                user: Array.isArray(item.user) ? item.user[0] : item.user
            }));

            setLogs(formattedData);
            setTotalLogs(count || 0);
            setPage(pageNumber);
        } catch (error) {
            console.error('Error loading logs:', error);
            alert(t('common.error', 'Error'));
        } finally {
            setLoadingLogs(false);
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 text-amber-500 p-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <Coins size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminBillers.title', 'Facturadores')}</h1>
                        <p className="text-sm text-amber-500 font-bold">{t('adminBillers.subtitle', 'Gestión de emisión de Frikicoins físicos')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-bg-pop border border-border-theme rounded-xl w-full max-w-md mx-auto sm:mx-0">
                <button
                    onClick={() => setActiveTab('permissions')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                        activeTab === 'permissions' ? 'bg-amber-500 text-white shadow-lg' : 'text-text-muted hover:bg-bg-sub'
                    }`}
                >
                    <UserCheck size={18} /> {t('adminBillers.tabs.permissions', 'Permisos')}
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                        activeTab === 'logs' ? 'bg-amber-500 text-white shadow-lg' : 'text-text-muted hover:bg-bg-sub'
                    }`}
                >
                    <List size={18} /> {t('adminBillers.tabs.logs', 'Auditoría (30d)')}
                </button>
            </div>

            {activeTab === 'permissions' ? (
                <>
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder={t('adminBillers.searchPlaceholder', 'Buscar por @usuario o correo...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-pop border border-border-theme rounded-xl pl-12 pr-4 py-3.5 text-text-main placeholder-text-muted focus:outline-none focus:border-amber-500 transition"
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
                                                        <img src={getAvatarSource(u.avatar_url)} alt="Avatar" className="w-10 h-10 rounded-full bg-bg-main border border-border-theme" />
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
            ) : (
                <>
                    {loadingLogs ? (
                        <div className="flex flex-col items-center justify-center py-12 text-amber-500">
                            <Loader2 className="animate-spin mb-4" size={32} />
                            <p className="font-bold">{t('common.loading', 'Cargando...')}</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 bg-bg-pop border border-border-theme rounded-2xl">
                            <Calendar size={48} className="mx-auto text-text-muted mb-4 opacity-50" />
                            <h3 className="text-xl font-black text-text-main mb-2">{t('adminBillers.logs.emptyTitle', 'Sin registros recientes')}</h3>
                            <p className="text-text-muted">{t('adminBillers.logs.emptyMessage', 'No se han emitido Frikicoins físicos en los últimos 30 días.')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-bg-sub border-b border-border-theme text-xs uppercase text-text-muted font-bold">
                                            <tr>
                                                <th className="px-6 py-4">{t('adminBillers.logs.table.date', 'Fecha')}</th>
                                                <th className="px-6 py-4">{t('adminBillers.logs.table.biller', 'Facturador (Staff)')}</th>
                                                <th className="px-6 py-4">{t('adminBillers.logs.table.receiver', 'Receptor (Usuario)')}</th>
                                                <th className="px-6 py-4 text-right">{t('adminBillers.logs.table.amount', 'Monto')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-theme">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-bg-sub/50 transition">
                                                    <td className="px-6 py-4 text-sm text-text-muted">
                                                        {formatDate(log.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-brand-primary">
                                                        @{log.biller?.username || t('common.unknown', 'Desconocido')}
                                                    </td>
                                                    <td className="px-6 py-4 text-text-main">
                                                        @{log.user?.username || t('common.unknown', 'Desconocido')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="font-black text-amber-500">+{log.amount} FC</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {/* Pagination */}
                            {totalLogs > LOGS_PER_PAGE && (
                                <div className="flex justify-between items-center bg-bg-pop p-4 rounded-xl border border-border-theme">
                                    <span className="text-sm text-text-muted">
                                                        {t('common.showing', 'Mostrando')} {((page - 1) * LOGS_PER_PAGE) + 1} - {Math.min(page * LOGS_PER_PAGE, totalLogs)} {t('common.of', 'de')} {totalLogs}
                                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            disabled={page === 1}
                                            onClick={() => loadLogs(page - 1)}
                                            className="px-3 py-1 bg-bg-sub text-text-main rounded-lg disabled:opacity-50"
                                        >
                                            {t('common.previous', 'Anterior')}
                                        </button>
                                        <button 
                                            disabled={page * LOGS_PER_PAGE >= totalLogs}
                                            onClick={() => loadLogs(page + 1)}
                                            className="px-3 py-1 bg-bg-sub text-text-main rounded-lg disabled:opacity-50"
                                        >
                                            {t('common.next', 'Siguiente')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
