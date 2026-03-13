import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Shield, ShieldAlert, Wrench, Briefcase, User, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getAvatarSource } from '../../config/avatars';

interface SearchedUser {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'worker' | 'tecnico' | 'admin';
    avatar_url: string | null;
}

export default function AdminRoles() {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<SearchedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const isSuperuser = currentUser?.id === import.meta.env.VITE_SUPERUSER_ID;

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoading(true);
        try {
            let query = supabase
                .from('profiles')
                .select('id, username, email, role, avatar_url')
                .limit(50);

            if (searchQuery.trim()) {
                query = query.or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
            } else {
                // By default show all admins/workers
                query = query.neq('role', 'user');
            }

            const { data, error } = await query;
            if (error) throw error;
            setUsers(data as SearchedUser[]);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert(t('adminRoles.errors.search'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateRole = async (userId: string, newRole: string) => {
        if (userId === import.meta.env.VITE_SUPERUSER_ID) {
            return alert(t('adminRoles.errors.superAdminProtect'));
        }

        if (!window.confirm(t('adminRoles.errors.confirmUpdate', { role: newRole.toUpperCase() }))) return;

        setUpdatingId(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
        } catch (error) {
            console.error('Error updating role:', error);
            alert(t('adminRoles.errors.update'));
        } finally {
            setUpdatingId(null);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield size={16} className="text-accent-red mt-0.5" />;
            case 'tecnico': return <Wrench size={16} className="text-amber-500 mt-0.5" />;
            case 'worker': return <Briefcase size={16} className="text-brand-primary mt-0.5" />;
            default: return <User size={16} className="text-text-muted mt-0.5" />;
        }
    };

    const roles = [
        { value: 'user', label: t('adminRoles.roleLabels.user'), className: 'text-text-main' },
        { value: 'worker', label: t('adminRoles.roleLabels.worker'), className: 'text-brand-primary font-bold' },
        { value: 'tecnico', label: t('adminRoles.roleLabels.tecnico'), className: 'text-amber-500 font-bold' },
        { value: 'admin', label: t('adminRoles.roleLabels.admin'), className: 'text-accent-red font-black' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-primary/20 text-brand-primary p-3 rounded-xl border border-brand-primary/30 shadow-[0_0_15px_rgba(var(--brand-primary),0.2)]">
                        <Users size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">{t('adminRoles.title')}</h1>
                        <p className="text-sm text-brand-primary font-bold">{t('adminRoles.subtitle')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden">

                <form onSubmit={handleSearch} className="relative mb-6 group">
                    <div className="absolute inset-0 bg-brand-primary/5 rounded-xl blur-md scale-95 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <input
                        type="text"
                        placeholder={t('adminRoles.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full relative bg-bg-side border border-border-theme text-text-main px-4 py-3.5 pl-12 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-text-muted font-medium shadow-inner"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted z-10" size={20} />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-primary text-text-inv px-5 py-2 rounded-lg text-sm font-black hover:bg-brand-primary-light transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-brand-primary/20 z-10"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : t('adminRoles.searchButton')}
                    </button>
                </form>

                <div className="overflow-x-auto rounded-xl border border-border-theme lg:overflow-visible">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-bg-side border-b border-border-theme text-xs uppercase tracking-wider text-text-muted font-black">
                                <th className="p-4 pl-6">{t('adminRoles.profileHeader')}</th>
                                <th className="p-4">{t('adminRoles.emailHeader')}</th>
                                <th className="p-4">{t('adminRoles.permissionsHeader')}</th>
                                <th className="p-4 text-center pr-6">{t('adminRoles.rangeSelectorHeader')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-theme">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-text-muted">
                                        <Loader2 size={32} className="animate-spin mx-auto mb-3 text-brand-primary" />
                                        {t('adminRoles.indexing')}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-text-muted">
                                        <div className="bg-bg-side border border-border-theme w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search size={24} className="text-text-muted opacity-50" />
                                        </div>
                                        <p className="font-bold text-text-main mb-1">{t('adminRoles.noMatches')}</p>
                                        <p className="text-sm">{t('adminRoles.noMatchesHint')}</p>
                                    </td>
                                </tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id} className="hover:bg-bg-side/40 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={getAvatarSource(u.avatar_url)}
                                                    alt={u.username}
                                                    className="w-10 h-10 rounded-full border-2 border-border-theme bg-bg-side object-cover"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-main flex items-center gap-2">
                                                    @{u.username || t('common.noUsername')}
                                                        {u.id === currentUser?.id && <span className="text-[9px] bg-brand-primary text-text-inv px-1.5 py-0.5 rounded-sm font-black uppercase inline-block leading-none">{t('common.you')}</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-text-sub font-medium truncate max-w-[200px]" title={u.email}>
                                            {u.email || '—'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 bg-gradient-to-r from-bg-side to-transparent w-fit px-3 py-1.5 rounded-lg border border-border-theme/50 shadow-inner">
                                                {getRoleIcon(u.role)}
                                                <span className="text-sm font-black capitalize text-text-main tracking-tight">{u.role}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6 align-middle">
                                            <div className="inline-flex items-center relative w-full sm:w-auto">
                                                <select
                                                    disabled={updatingId === u.id || (!isSuperuser && u.role === 'admin')}
                                                    value={u.role}
                                                    onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                                    className={`w-full sm:w-[130px] appearance-none bg-bg-pop border-2 border-border-theme text-xs font-black rounded-xl pl-3 pr-8 py-2.5 outline-none focus:border-brand-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm ${roles.find(r => r.value === u.role)?.className}`}
                                                >
                                                    {roles.map(r => (
                                                        <option key={r.value} value={r.value} className="text-text-main font-semibold bg-bg-pop">
                                                        {t('adminRoles.to')} {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {updatingId === u.id ? (
                                                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-brand-primary pointer-events-none" />
                                                ) : (
                                                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 bg-gradient-to-r from-bg-side to-bg-side/30 border border-border-theme p-5 rounded-2xl flex flex-col md:flex-row gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="bg-brand-primary/10 text-brand-primary w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner relative z-10 border border-brand-primary/20">
                        <ShieldAlert size={24} />
                    </div>
                    <div className="text-xs text-text-sub space-y-2 flex-1 relative z-10">
                        <strong className="text-text-main uppercase font-black tracking-widest text-xs">{t('adminRoles.powerTitle')}</strong>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                            <div className="bg-bg-pop/50 border border-border-theme p-3 rounded-xl hover:border-brand-primary/30 transition-colors">
                                <div className="flex items-center gap-1.5 text-brand-primary font-black mb-1"><Briefcase size={12} /> {t('adminRoles.workersTitle')}</div>
                                <span className="text-[10px] leading-tight">{t('adminRoles.workersDesc')}</span>
                            </div>
                            <div className="bg-bg-pop/50 border border-border-theme p-3 rounded-xl hover:border-amber-500/30 transition-colors">
                                <div className="flex items-center gap-1.5 text-amber-500 font-black mb-1"><Wrench size={12} /> {t('adminRoles.techniciansTitle')}</div>
                                <span className="text-[10px] leading-tight">{t('adminRoles.techniciansDesc')}</span>
                            </div>
                            <div className="bg-bg-pop/50 border border-border-theme p-3 rounded-xl hover:border-accent-red/30 transition-colors">
                                <div className="flex items-center gap-1.5 text-accent-red font-black mb-1"><Shield size={12} /> {t('adminRoles.adminsTitle')}</div>
                                <span className="text-[10px] leading-tight">{t('adminRoles.adminsDesc')}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
