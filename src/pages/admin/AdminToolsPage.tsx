import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, Users, TrendingUp, Wallet,
    BarChart3, ArrowRightLeft, Globe, RefreshCcw,
    Trophy, ShieldCheck, Clock, Loader2,
    Eye, Share2, MessageSquare, Swords
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { shareContent } from '../../utils/shareContent';
import { AdminToolsService, type AdminStats } from '../../services/AdminToolsService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getAvatarSource } from '../../config/avatars';
import UserAuditModal from '../../components/admin/UserAuditModal';
import { Link } from 'react-router-dom';

export default function AdminToolsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [showOnlineModal, setShowOnlineModal] = useState(false);
    const [isSharingWhales, setIsSharingWhales] = useState(false);
    const whalesRef = useRef<HTMLDivElement>(null);
    const [auditModalVisible, setAuditModalVisible] = useState(false);
    const [auditUser, setAuditUser] = useState<{ id: string; username: string } | null>(null);

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

    const shareWhalesImage = async () => {
        if (!whalesRef.current || isSharingWhales) return;

        setIsSharingWhales(true);
        const el = whalesRef.current;

        // 1. Inyectamos estilos temporales para que la tabla se vea perfecta
        const tempStyle = document.createElement('style');
        tempStyle.innerHTML = `
            .share-hide { display: none !important; }
            .no-scroll { overflow: visible !important; width: 100% !important; }
        `;
        document.head.appendChild(tempStyle);

        // 2. Marcamos temporalmente lo que no queremos que salga
        const button = el.querySelector('button');
        const scrollArea = el.querySelector('.overflow-x-auto');
        if (button) button.classList.add('share-hide');
        if (scrollArea) scrollArea.classList.add('no-scroll');

        try {
            // 3. Capturamos a PNG (más estable que toBlob en algunos navegadores)
            const dataUrl = await toPng(el, {
                backgroundColor: '#0f172a',
                pixelRatio: 2,
                style: {
                    borderRadius: '0'
                }
            });

            // 4. Convertimos el dataUrl a Blob para compartir
            const resp = await fetch(dataUrl);
            const blob = await resp.blob();

            if (blob) {
                const file = new File([blob], t('settings.whalesFilename'), { type: 'image/png' });
                await shareContent({
                    title: t('settings.whalesTitle'),
                    text: t('settings.whalesText'),
                    url: window.location.origin,
                    file
                });
            }
        } catch (error) {
            console.error('Error sharing image:', error);
        } finally {
            // 5. Limpieza absoluta
            if (button) button.classList.remove('share-hide');
            if (scrollArea) scrollArea.classList.remove('no-scroll');
            document.head.removeChild(tempStyle);
            setIsSharingWhales(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-text-muted">
                <Loader2 className="animate-spin mb-4 text-brand-primary" size={48} />
                <p className="font-bold">{t('settings.analyzingSystem')}</p>
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
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('settings.adminTools')}</h1>
                        <p className="text-sm text-brand-primary font-bold flex items-center gap-1.5">
                            <ShieldCheck size={14} /> {t('settings.healthMetrics')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadData}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-side border border-border-theme rounded-xl text-sm font-bold text-text-main hover:bg-bg-sub transition-colors shadow-sm disabled:opacity-50"
                >
                    <RefreshCcw size={16} className={refreshing ? "animate-spin" : ""} />
                    {t('common.refresh')}
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users Count */}
                <div className="bg-gradient-to-br from-bg-pop to-bg-side border border-border-theme rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-8 -mt-8 group-hover:bg-brand-primary/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{t('settings.totalAccounts')}</p>
                            <h3 className="text-3xl font-black text-text-main">{stats?.total_accounts.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase">
                        <TrendingUp size={12} /> {t('settings.growingActively')}
                    </div>
                </div>

                {/* Economy - Circulation */}
                <div className="bg-gradient-to-br from-bg-pop to-bg-side border border-border-theme rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{t('settings.monetaryMass')}</p>
                            <h3 className="text-3xl font-black text-text-main">{stats?.circulation_supply.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                            <Wallet size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                        {t('settings.circulationSupplyDesc')}
                    </div>
                </div>

                {/* Economy - Admin Reserve */}
                <div className="bg-gradient-to-br from-bg-pop to-bg-side border border-border-theme rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-8 -mt-8 group-hover:bg-brand-primary/10 transition-colors"></div>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{t('settings.adminSupply')}</p>
                            <h3 className="text-3xl font-black text-text-main">{stats?.admin_supply.toLocaleString() || '0'}</h3>
                        </div>
                        <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl">
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase">
                        {t('settings.adminSupplyDesc', 'Frikicoins en cuentas de administradores')}
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
                            <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">{t('settings.onlineUsers')}</p>
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
                        {t('settings.realTimePresence')}
                    </div>
                </div>
            </div>

            {/* Detailed Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Surveys Stats */}
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-border-theme pb-4">
                        <BarChart3 className="text-brand-primary" size={20} />
                        <h3 className="font-black text-text-main uppercase tracking-wider text-sm">{t('settings.surveysStatus')}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('adminSurveys.statusLabels.active')}</p>
                            <p className="text-xl font-black text-accent-green">{stats?.active_surveys || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('adminSurveys.statusLabels.draft')}</p>
                            <p className="text-xl font-black text-amber-500">{stats?.draft_surveys || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('adminSurveys.statusLabels.paused')}</p>
                            <p className="text-xl font-black text-brand-primary">{stats?.paused_surveys || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('adminSurveys.statusLabels.finished')}</p>
                            <p className="text-xl font-black text-text-main">{stats?.past_surveys || '0'}</p>
                        </div>

                        <div className="col-span-2 mt-2 pt-3 border-t border-border-theme/50 flex justify-between items-center text-xs text-text-muted font-bold">
                            <span>{t('adminSurveys.stats.totalCreated', 'Total Creadas')}: <span className="text-text-main font-black">{stats?.surveys_total || '0'}</span></span>
                            <span>{t('adminSurveys.stats.globalResponses', 'Respuestas Globales')}: <span className="text-brand-secondary font-black">{stats?.survey_responses_total || '0'}</span></span>
                        </div>
                    </div>
                </div>

                {/* Transaction Stats */}
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-border-theme pb-4">
                        <ArrowRightLeft className="text-brand-secondary" size={20} />
                        <h3 className="font-black text-text-main uppercase tracking-wider text-sm">{t('settings.transactionsLog')}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-bg-side rounded-xl border border-border-theme/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('common.totalHistorial') || 'Histórico Total'}</p>
                                <p className="text-2xl font-black text-text-main">{stats?.transactions_total.toLocaleString() || '0'}</p>
                            </div>
                            <Clock className="text-text-muted opacity-25" size={32} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-bg-side rounded-xl border border-border-theme/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent-red"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('settings.transactionsMonth')}</p>
                                <p className="text-2xl font-black text-text-main">{stats?.transactions_last_month.toLocaleString() || '0'}</p>
                            </div>
                            <TrendingUp className="text-accent-red opacity-25" size={32} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-bg-side rounded-xl border border-border-theme/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('settings.transactionsP2PTotal', 'P2P Envíos (Total)')}</p>
                                <p className="text-2xl font-black text-text-main">{stats?.transactions_p2p_total.toLocaleString() || '0'}</p>
                            </div>
                            <ArrowRightLeft className="text-brand-primary opacity-25" size={32} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-bg-side rounded-xl border border-border-theme/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-accent-green"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('settings.transactionsP2PMonth', 'P2P Envíos (30d)')}</p>
                                <p className="text-2xl font-black text-text-main">{stats?.transactions_p2p_last_month.toLocaleString() || '0'}</p>
                            </div>
                            <TrendingUp className="text-accent-green opacity-25" size={32} />
                        </div>
                    </div>
                </div>

            </div>

            {/* Community & Gaming Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* La Taberna Stats */}
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-border-theme pb-4">
                        <MessageSquare className="text-amber-500" size={20} />
                        <h3 className="font-black text-text-main uppercase tracking-wider text-sm">{t('adminTavern.title', 'La Taberna (Métricas)')}</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50 text-center">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('settings.stats.tavernThreads', 'Hilos Totales')}</p>
                            <p className="text-2xl font-black text-text-main">{stats?.tavern_threads_total || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50 text-center">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('settings.stats.tavernReplies', 'Respuestas')}</p>
                            <p className="text-2xl font-black text-text-main">{stats?.tavern_replies_total || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-4 rounded-xl border border-border-theme/50 text-center">
                            <p className="text-[10px] font-black text-text-muted uppercase mb-1">{t('settings.stats.tavernLikes', 'Likes Totales')}</p>
                            <p className="text-2xl font-black text-accent-red">{stats?.tavern_likes_total || '0'}</p>
                        </div>
                    </div>
                </div>

                {/* Gaming & TTRPG Stats */}
                <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 border-b border-border-theme pb-4">
                        <Swords className="text-brand-primary" size={20} />
                        <h3 className="font-black text-text-main uppercase tracking-wider text-sm">{t('settings.stats.gamingSection', 'Actividad de Juegos')}</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-bg-side p-3 rounded-xl border border-border-theme/50 text-center">
                            <p className="text-[9px] font-black text-text-muted uppercase mb-1">{t('settings.stats.duels', 'Duelos VS')}</p>
                            <p className="text-xl font-black text-[#f472b6]">{stats?.trivia_duels_completed || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-3 rounded-xl border border-border-theme/50 text-center">
                            <p className="text-[9px] font-black text-text-muted uppercase mb-1">{t('settings.stats.sheets', 'Fichas Rol')}</p>
                            <p className="text-xl font-black text-purple-500">{stats?.ttrpg_sheets_total || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-3 rounded-xl border border-border-theme/50 text-center">
                            <p className="text-[9px] font-black text-text-muted uppercase mb-1">{t('settings.stats.rolls', 'Tiradas')}</p>
                            <p className="text-xl font-black text-brand-secondary">{stats?.ttrpg_rolls_total || '0'}</p>
                        </div>
                        <div className="bg-bg-side p-3 rounded-xl border border-border-theme/50 text-center">
                            <p className="text-[9px] font-black text-text-muted uppercase mb-1">{t('settings.stats.tcg', 'TCG Arena')}</p>
                            <p className="text-xl font-black text-brand-primary">{stats?.tcg_matches_total || '0'}</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Top Users Table */}
            <div ref={whalesRef} className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-theme bg-gradient-to-r from-bg-side to-transparent flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="text-amber-500" size={20} />
                            <h3 className="font-black text-text-main uppercase tracking-wider text-sm">{t('settings.topUsers')}</h3>
                        </div>
                        <p className="text-xs text-text-muted font-medium">{t('settings.topUsersDesc')}</p>
                    </div>

                    <button
                        onClick={shareWhalesImage}
                        disabled={isSharingWhales}
                        className="p-3 bg-bg-pop border border-border-theme rounded-xl text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm disabled:opacity-50 group"
                         title={t('settings.shareImage')}
                    >
                        {isSharingWhales ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} className="group-hover:scale-110 transition-transform" />}
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-bg-side/50 text-[10px] uppercase font-black text-text-muted tracking-widest border-b border-border-theme">
                                <th className="px-6 py-4">{t('settings.rank')}</th>
                                <th className="px-6 py-4">{t('settings.user')}</th>
                                <th className="px-6 py-4 text-right">{t('settings.totalBalance')}</th>
                                <th className="px-6 py-4 text-center">{t('settings.power')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-theme">
                            {stats?.top_users.map((u, i) => (
                                <tr 
                                    key={i} 
                                    onClick={() => {
                                        if (u.id) {
                                            setAuditUser({ id: u.id, username: u.username });
                                            setAuditModalVisible(true);
                                        }
                                    }}
                                    className="hover:bg-bg-side/50 hover:scale-[1.005] active:scale-[0.998] cursor-pointer transition-all group"
                                >
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
                                                src={getAvatarSource(u.avatar_url || null)}
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
                                        {t('settings.noWhales')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Links Section */}
            <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-border-theme pb-4">
                    <LayoutDashboard className="text-brand-primary" size={20} />
                    <h3 className="font-black text-text-main uppercase tracking-wider text-sm">{t('adminTools.shortcuts.title', 'Accesos Directos')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link to="/admin/billers" className="bg-gradient-to-br from-bg-side to-bg-sub border border-border-theme rounded-xl p-6 flex items-center justify-between group hover:border-amber-500 transition-colors shadow-sm">
                        <div>
                            <h4 className="font-black text-text-main text-lg mb-1 group-hover:text-amber-500 transition-colors">{t('adminTools.shortcuts.billers.title', 'Facturadores y Auditoría')}</h4>
                            <p className="text-xs text-text-muted">{t('adminTools.shortcuts.billers.desc', 'Gestionar permisos y registros de Frikicoins físicos')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <ArrowRightLeft size={24} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    <Link to="/admin/reports" className="bg-gradient-to-br from-bg-side to-bg-sub border border-border-theme rounded-xl p-6 flex items-center justify-between group hover:border-brand-primary transition-colors shadow-sm">
                        <div>
                            <h4 className="font-black text-text-main text-lg mb-1 group-hover:text-brand-primary transition-colors">{t('adminTools.shortcuts.reports.title', 'Reportes del Staff')}</h4>
                            <p className="text-xs text-text-muted">{t('adminTools.shortcuts.reports.desc', 'Gestión de incidencias reportadas por trabajadores')}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <MessageSquare size={24} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
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
                                <h2 className="text-xl font-black text-text-main">{t('settings.onlineUsers')} ({onlineCount})</h2>
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
                                    <p className="text-text-muted font-bold">{t('settings.trackingSignals')}</p>
                                </div>
                            ) : (
                                onlineUsers.map((u, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-bg-side rounded-2xl border border-border-theme">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img
                                                    src={getAvatarSource(u.avatar_url || null)}
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
                                                    {t('settings.connectedAt', { time: new Date(u.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
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
                                {t('infoCard.gotIt')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Modal */}
            <UserAuditModal
                visible={auditModalVisible}
                onClose={() => setAuditModalVisible(false)}
                userId={auditUser?.id || null}
                username={auditUser?.username || ''}
                isSuperAdmin={false}
            />
        </div>
    );
}
