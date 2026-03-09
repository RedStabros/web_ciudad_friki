import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, TrendingUp, Wallet,
    BarChart3, ArrowRightLeft, Globe, RefreshCcw,
    Trophy, ShieldCheck, Clock, Loader2, AlertTriangle,
    Eye
} from 'lucide-react';
import { AdminToolsService, type AdminStats } from '../../services/AdminToolsService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getAvatarSource } from '../../config/avatars';

export default function AdminToolsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [showOnlineModal, setShowOnlineModal] = useState(false);

    useEffect(() => {
        loadData();
        setupPresence();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setRefreshing(true);
        const { data } = await AdminToolsService.getAdminStats();
        if (data) setStats(data);
        setLoading(false);
        setRefreshing(false);
    };

    const setupPresence = () => {
        const channel = supabase.channel('online-admins', {
            config: {
                presence: {
                    key: user?.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const flattened: any[] = [];
                Object.keys(state).forEach((key) => {
                    const presences = state[key] as any[];
                    if (presences && presences.length > 0) {
                        flattened.push({
                            id: key,
                            ...presences[0]
                        });
                    }
                });
                setOnlineUsers(flattened);
                setOnlineCount(flattened.length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && user?.id) {
                    const { data: currentProfile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
                    await channel.track({
                        online_at: new Date().toISOString(),
                        username: currentProfile?.username || (user as any)?.user_metadata?.username || 'Admin',
                        email: user?.email || 'Email no disponible',
                        avatar_url: currentProfile?.avatar_url || (user as any)?.user_metadata?.avatar_url || null,
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted">
                <Loader2 className="animate-spin mb-4 text-brand-primary" size={48} />
                <p className="font-bold">Analizando sistemas centrales...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl shadow-lg border border-brand-primary/30">
                        <LayoutDashboard size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">Herramientas de Admin</h1>
                        <p className="text-sm text-brand-primary font-bold flex items-center gap-1.5">
                            <ShieldCheck size={14} /> Métricas de salud de Ciudad Friki
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-side border border-border-theme rounded-xl text-sm font-bold text-text-main hover:bg-bg-sub transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
                    Actualizar Datos
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Users Count */}
                <div className="bg-gradient-to-br from-bg-pop to-bg-side border border-border-theme rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-8 -mt-8 group-hover:bg-brand-primary/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Total Usuarios</p>
                            <h3 className="text-3xl font-black text-text-main">{stats?.total_accounts.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase">
                        <TrendingUp size={12} /> Creciendo activamente
                    </div>
                </div>

                {/* Economy - Circulation */}
                <div className="bg-gradient-to-br from-bg-pop to-bg-side border border-border-theme rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Masa Monetaria (₣)</p>
                            <h3 className="text-3xl font-black text-text-main">{stats?.circulation_supply.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                        Frikicoins en circulación pública
                    </div>
                </div>

                {/* Online Users */}
                <div
                    onClick={() => setShowOnlineModal(true)}
                    className="bg-gradient-to-br from-bg-pop to-bg-side border border-border-theme rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-accent-green/50 transition-colors cursor-pointer"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/5 rounded-full -mr-8 -mt-8 group-hover:bg-accent-green/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">En Línea Ahora</p>
                            <h3 className="text-3xl font-black text-text-main flex items-center gap-2">
                                {onlineCount}
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-green"></span>
                                </span>
                            </h3>
                        </div>
                        <div className="p-3 bg-accent-green/10 text-accent-green rounded-xl">
                            <Globe size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-accent-green uppercase">
                        Presencia en tiempo real
                    </div>
                </div>
            </div>

            {/* Detailed Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Surveys Stats */}
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-border-theme pb-4">
                        <BarChart3 className="text-brand-primary" size={20} />
                        <h3 className="font-black text-text-main uppercase tracking-wider text-sm">Estado de Encuestas</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">Activas</p>
                            <p className="text-xl font-black text-accent-green">{stats?.active_surveys || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">Borradores</p>
                            <p className="text-xl font-black text-amber-500">{stats?.draft_surveys || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">Pausadas</p>
                            <p className="text-xl font-black text-brand-primary">{stats?.paused_surveys || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">Finalizadas</p>
                            <p className="text-xl font-black text-text-main">{stats?.past_surveys || '0'}</p>
                        </div>
                    </div>
                </div>

                {/* Transaction Stats */}
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-border-theme pb-4">
                        <ArrowRightLeft className="text-brand-secondary" size={20} />
                        <h3 className="font-black text-text-main uppercase tracking-wider text-sm">Registro de Transacciones</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-bg-side rounded-xl border border-border-theme/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase mb-1">Histórico Total</p>
                                <p className="text-2xl font-black text-text-main">{stats?.transactions_total.toLocaleString() || '0'}</p>
                            </div>
                            <Clock className="text-text-muted opacity-20" size={32} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-bg-side rounded-xl border border-border-theme/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent-red"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase mb-1">Últimos 30 Días</p>
                                <p className="text-2xl font-black text-text-main">{stats?.transactions_last_month.toLocaleString() || '0'}</p>
                            </div>
                            <TrendingUp className="text-accent-red opacity-20" size={32} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Top Users Table */}
            <div className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-theme bg-gradient-to-r from-bg-side to-transparent">
                    <div className="flex items-center gap-2 mb-1">
                        <Trophy className="text-amber-500" size={20} />
                        <h3 className="font-black text-text-main uppercase tracking-wider text-sm">Top 5 Fortunas (Whales)</h3>
                    </div>
                    <p className="text-xs text-text-muted font-medium">Los usuarios con mayor balance de Frikicoins en la plataforma.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-bg-side/50 text-[10px] uppercase font-black text-text-muted tracking-widest border-b border-border-theme">
                                <th className="px-6 py-4">Rango</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4 text-right">Balance Total</th>
                                <th className="px-6 py-4 text-center">Poderío</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-theme">
                            {stats?.top_users.map((u, i) => (
                                <tr key={i} className="hover:bg-bg-side/30 transition-colors group">
                                    <td className="px-6 py-4 font-black">
                                        <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs ${i === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                                            i === 1 ? 'bg-slate-300 text-slate-700' :
                                                i === 2 ? 'bg-amber-700/80 text-white' :
                                                    'bg-bg-sub text-text-muted'
                                            }`}>
                                            #{i + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getAvatarSource(u.avatar_url)}
                                                alt={u.username}
                                                className="w-10 h-10 rounded-full border border-border-theme bg-bg-side object-cover shadow-sm"
                                            />
                                            <div>
                                                <span className="font-bold text-text-main block">@{u.username || 'Anonymous'}</span>
                                                <span className="text-[10px] text-text-muted">{u.email || '@'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-text-main tabular-nums text-lg tracking-tight">
                                        {u.balance.toLocaleString()} ₣
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-bg-side h-1.5 rounded-full overflow-hidden border border-border-theme">
                                            <div
                                                className="bg-brand-primary h-full"
                                                style={{ width: `${Math.max(10, 100 - (i * 10))}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!stats?.top_users || stats.top_users.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-text-muted italic">
                                        No hay datos de whales disponibles.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Online Users Modal */}
            {showOnlineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-pop w-full max-w-lg rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border-theme bg-bg-side flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-green/10 text-accent-green rounded-xl">
                                    <Globe size={20} />
                                </div>
                                <h2 className="text-xl font-black text-text-main">Usuarios en Línea ({onlineCount})</h2>
                            </div>
                            <button
                                onClick={() => setShowOnlineModal(false)}
                                className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted"
                            >
                                <RefreshCcw size={20} />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {onlineUsers.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Loader2 className="animate-spin mx-auto mb-4 text-brand-primary opacity-20" size={40} />
                                    <p className="text-text-muted font-bold">Rastreando señales...</p>
                                </div>
                            ) : (
                                onlineUsers.map((u, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-bg-side rounded-2xl border border-border-theme">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={getAvatarSource(u.avatar_url)}
                                                    alt={u.username}
                                                    className="w-12 h-12 rounded-full border-2 border-border-theme bg-bg-side object-cover shadow-sm"
                                                />
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-accent-green rounded-full border-2 border-bg-side"></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main">@{u.username || 'Usuario Friki'}</p>
                                                <p className="text-[10px] text-text-muted font-bold tracking-tighter block -mt-0.5">
                                                    {u.email || '@'}
                                                </p>
                                                <p className="text-[10px] text-brand-primary/70 font-bold uppercase tracking-tighter mt-1">
                                                    Conectado a las {new Date(u.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-bg-pop border border-border-theme rounded-lg">
                                            <Eye size={16} className="text-text-muted" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-bg-side border-t border-border-theme">
                            <button
                                onClick={() => setShowOnlineModal(false)}
                                className="w-full py-3 bg-brand-primary text-text-inv font-black rounded-xl hover:bg-brand-primary-light transition-all shadow-lg shadow-brand-primary/25"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = `
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--border-theme);
    border-radius: 10px;
}
`;
