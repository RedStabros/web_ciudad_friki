import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    ShieldAlert, Search, Loader2, UserMinus, UserCheck, 
    ShieldOff, Clock, Gavel, XCircle, 
    Mail, User, Settings
} from 'lucide-react';
import { TavernAdminService, type BanData } from '../../services/TavernAdminService';
import { getAvatarSource } from '../../config/avatars';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import UserHistoryModal from '../../components/admin/UserHistoryModal';
import { History } from 'lucide-react';

interface SearchedUser {
    id: string;
    username: string;
    email: string;
    avatar_url: string | null;
    role: string;
    is_banned: boolean;
    is_shadow_banned: boolean;
    ban_until: string | null;
    ban_reason: string | null;
}

export default function AdminBans() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile(user?.id);
    
    const isSuperuser = user?.id === import.meta.env.VITE_SUPERUSER_ID;
    const isAdmin = profile?.role === 'admin' || isSuperuser;

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<SearchedUser[]>([]);
    const [loading, setLoading] = useState(false);

    // Ban Modal State
    const [showBanModal, setShowBanModal] = useState(false);
    const [banTarget, setBanTarget] = useState<SearchedUser | null>(null);
    const [banData, setBanData] = useState<BanData>({ is_shadow_banned: false, ban_until: null, ban_reason: '' });
    const [isProcessing, setIsProcessing] = useState(false);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyTarget, setHistoryTarget] = useState<{ id: string, username: string } | null>(null);

    if (profileLoading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-primary" size={40} />
        </div>
    );

    if (!isAdmin) return <Navigate to="/" replace />;

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        const results = await TavernAdminService.searchUsers(searchQuery);
        setUsers(results);
        setLoading(false);
    };

    const handleOpenBanModal = (user: SearchedUser) => {
        setBanTarget(user);
        setBanData({ 
            is_shadow_banned: user.is_shadow_banned, 
            ban_until: user.ban_until, 
            ban_reason: user.ban_reason || '' 
        });
        setShowBanModal(true);
    };

    const handleUnban = async (userId: string) => {
        if (!window.confirm(t('adminBans.confirmUnban'))) return;
        
        setIsProcessing(true);
        const { error } = await TavernAdminService.unbanUser(userId);
        if (error) {
            alert(t('common.error'));
        } else {
            setUsers(users.map(u => u.id === userId ? { ...u, is_banned: false, is_shadow_banned: false, ban_until: null, ban_reason: null } : u));
        }
        setIsProcessing(false);
    };

    const executeBan = async () => {
        if (!banTarget) return;
        setIsProcessing(true);
        const { error } = await TavernAdminService.banUser(banTarget.id, banData);
        if (error) {
            alert(t('common.error'));
        } else {
            setShowBanModal(false);
            // Refresh results
            handleSearch();
        }
        setIsProcessing(false);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Permanente';
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-accent-red/20 text-accent-red p-3 rounded-xl shadow-[0_0_15px_rgba(225,25,47,0.2)] border border-accent-red/30">
                        <Gavel size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminBans.title')}</h1>
                        <p className="text-sm text-accent-red font-bold">{t('adminBans.subtitle')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-bg-pop border border-border-theme rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleSearch} className="relative mb-8 group">
                    <div className="absolute inset-0 bg-brand-primary/5 rounded-2xl blur-md scale-95 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <input
                        type="text"
                        placeholder={t('adminBans.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full relative bg-bg-side border border-border-theme text-text-main px-4 py-4 pl-12 rounded-2xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-text-muted font-medium"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted z-10" size={20} />
                    <button
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-text-inv px-6 py-2.5 rounded-xl text-sm font-black hover:bg-brand-primary-light transition-all disabled:opacity-50 flex items-center gap-2 z-10 shadow-lg shadow-brand-primary/20"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : t('adminBans.searchButton')}
                    </button>
                </form>

                <div className="space-y-4">
                    {loading && users.length === 0 ? (
                        <div className="flex flex-col items-center py-20 text-text-muted">
                            <Loader2 className="animate-spin text-brand-primary mb-4" size={40} />
                            <p className="font-bold">{t('adminBans.loading')}</p>
                        </div>
                    ) : users.length === 0 && searchQuery ? (
                        <div className="text-center py-20 bg-bg-side rounded-2xl border border-dashed border-border-theme">
                            <User size={48} className="mx-auto text-text-muted opacity-20 mb-4" />
                            <p className="text-text-muted font-bold">{t('adminBans.noResults')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {users.map(u => (
                                <div key={u.id} className={`bg-bg-side border rounded-2xl p-5 flex flex-col gap-4 transition-all ${u.is_banned ? 'border-accent-red/50 bg-accent-red/5' : u.is_shadow_banned ? 'border-amber-500/50 bg-amber-500/5' : 'border-border-theme hover:border-brand-primary/50'}`}>
                                    <div className="flex items-center gap-4">
                                        <img src={getAvatarSource(u.avatar_url)} alt={u.username} className="w-14 h-14 rounded-2xl border-2 border-border-theme object-cover shadow-sm bg-bg-pop" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-text-main truncate">@{u.username}</h3>
                                                {u.role && u.role !== 'user' && (
                                                    <span className="bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{u.role}</span>
                                                )}
                                                {u.is_banned && <span className="bg-accent-red text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{t('adminBans.banned')}</span>}
                                                {u.is_shadow_banned && <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">{t('adminBans.shadowBanned')}</span>}
                                            </div>
                                            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><Mail size={12} /> {u.email}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setHistoryTarget({ id: u.id, username: u.username });
                                                setShowHistoryModal(true);
                                            }}
                                            className="p-3 bg-bg-pop border border-border-theme text-text-muted hover:text-brand-primary rounded-xl transition-all shadow-sm group"
                                            title={t('adminBans.viewHistory')}
                                        >
                                            <History size={20} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    </div>

                                    {(u.is_banned || u.is_shadow_banned) && (
                                        <div className="bg-bg-pop/50 border border-border-theme p-3 rounded-xl space-y-2">
                                            <div className="flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><Clock size={12} /> Fin: {formatDate(u.ban_until)}</span>
                                            </div>
                                            <p className="text-xs text-text-secondary italic leading-tight">" {u.ban_reason || t('adminBans.noReason') } "</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-auto">
                                        {(u.is_banned || u.is_shadow_banned) ? (
                                            <button 
                                                onClick={() => handleUnban(u.id)}
                                                disabled={isProcessing}
                                                className="flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-black bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green hover:text-white transition-all"
                                            >
                                                <UserCheck size={16} /> {t('adminBans.unbanButton')}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleOpenBanModal(u)}
                                                disabled={isProcessing}
                                                className="flex-1 py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-black bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red hover:text-white transition-all"
                                            >
                                                <ShieldAlert size={16} /> {t('adminBans.banButton')}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleOpenBanModal(u)}
                                            className="p-2.5 bg-bg-pop border border-border-theme text-text-muted hover:text-brand-primary rounded-xl transition-all"
                                            title={t('adminBans.editBan')}
                                        >
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Ban Modal */}
            {showBanModal && banTarget && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setShowBanModal(false)}>
                    <div className="bg-bg-pop w-full max-w-md rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border-theme bg-bg-side flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent-red/20 text-accent-red rounded-xl">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-text-main">{t('adminBans.modal.title')}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-accent-red font-bold">@{banTarget.username}</p>
                                        {banTarget.role && banTarget.role !== 'user' && (
                                            <span className="bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{banTarget.role}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowBanModal(false)} className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-text-muted tracking-widest">{t('adminBans.modal.type')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setBanData({ ...banData, is_shadow_banned: false })}
                                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${!banData.is_shadow_banned ? 'bg-accent-red/10 border-accent-red text-accent-red' : 'bg-bg-side border-border-theme text-text-muted opacity-50'}`}
                                    >
                                        <UserMinus size={20} />
                                        <span className="text-[10px] font-black uppercase">{t('adminBans.modal.banTotal')}</span>
                                    </button>
                                    <button
                                        onClick={() => setBanData({ ...banData, is_shadow_banned: true })}
                                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${banData.is_shadow_banned ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-bg-side border-border-theme text-text-muted opacity-50'}`}
                                    >
                                        <ShieldOff size={20} />
                                        <span className="text-[10px] font-black uppercase">{t('adminBans.modal.shadowBan')}</span>
                                    </button>
                                </div>
                                <p className="text-[10px] text-text-muted italic leading-tight">
                                    {banData.is_shadow_banned 
                                        ? t('adminBans.modal.descShadowBan') 
                                        : t('adminBans.modal.descBanTotal')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-text-muted tracking-widest">{t('adminBans.modal.duration')}</label>
                                <select 
                                    className="w-full bg-bg-side border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-brand-primary"
                                    onChange={(e) => {
                                        const now = new Date();
                                        if (e.target.value === '1') now.setDate(now.getDate() + 1);
                                        else if (e.target.value === '3') now.setDate(now.getDate() + 3);
                                        else if (e.target.value === '7') now.setDate(now.getDate() + 7);
                                        else if (e.target.value === '30') now.setDate(now.getDate() + 30);
                                        else if (e.target.value === '999') now.setFullYear(now.getFullYear() + 10);
                                        setBanData({ ...banData, ban_until: e.target.value === '0' ? null : now.toISOString() });
                                    }}
                                >
                                    <option value="1">{t('adminBans.modal.duration24h')}</option>
                                    <option value="3">{t('adminBans.modal.duration3d')}</option>
                                    <option value="7">{t('adminBans.modal.duration7d')}</option>
                                    <option value="30">{t('adminBans.modal.duration30d')}</option>
                                    <option value="999">{t('adminBans.modal.durationPerm')}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-text-muted tracking-widest">{t('adminBans.modal.reason')}</label>
                                <textarea
                                    value={banData.ban_reason || ''}
                                    onChange={e => setBanData({ ...banData, ban_reason: e.target.value })}
                                    className="w-full bg-bg-side border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-brand-primary h-24 resize-none"
                                    placeholder={t('adminBans.modal.reasonPlaceholder')}
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-bg-side border-t border-border-theme grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowBanModal(false)}
                                className="py-3 text-sm font-black uppercase tracking-widest text-text-muted border border-border-theme rounded-xl hover:bg-bg-sub transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={executeBan}
                                disabled={isProcessing}
                                className={`py-3 text-sm font-black uppercase tracking-widest text-white rounded-xl transition shadow-lg ${banData.is_shadow_banned ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-accent-red hover:bg-accent-red-600 shadow-accent-red/20'} disabled:opacity-50`}
                            >
                                {isProcessing ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('adminBans.banButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* History Modal */}
            {showHistoryModal && historyTarget && (
                <UserHistoryModal 
                    userId={historyTarget.id}
                    username={historyTarget.username}
                    onClose={() => setShowHistoryModal(false)}
                />
            )}
        </div>
    );
}
