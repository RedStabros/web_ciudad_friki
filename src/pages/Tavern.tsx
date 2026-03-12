import { useState } from 'react';
import { MessageSquare, Loader2, PlusCircle, Home as HomeIcon, Flame, Clock } from 'lucide-react';
import { useTavernThreads } from '../hooks/useTavern';
import { ThreadCard } from '../components/Tavern/ThreadCard';
import type { ThreadCategory } from '../types/tavern';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { TavernService } from '../services/TavernService';
import { ThreadDetailsModal } from '../components/Tavern/ThreadDetailsModal';
import { CreateThreadModal } from '../components/Tavern/CreateThreadModal';
import { EditThreadModal } from '../components/Tavern/EditThreadModal';
import { getAvatarSource } from '../config/avatars';
import { useProfile } from '../hooks/useProfile';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { useGlobalFeatures } from '../hooks/useGlobalFeatures';

export default function Tavern() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { tavern, loading: featuresLoading } = useGlobalFeatures(user?.id);
    const [category, setCategory] = useState<ThreadCategory>('Todas');
    const [sortBy, setSortBy] = useState<'HOT' | 'NEW'>('NEW');

    const { profile } = useProfile(user?.id);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [threadToEdit, setThreadToEdit] = useState<any>(null);

    const { onlineUsersCount, tavernInteractions } = useOnlineUsers();

    const { threads, isLoading, error, hasMore, loadMore, refetch } = useTavernThreads(category, sortBy);

    if (featuresLoading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-brand-primary" size={48} /></div>;

    if (!tavern) return (
        <div className="flex flex-col items-center justify-center py-32 text-center px-8">
            <img src="/assets/tabern_icon.png" alt="La Taberna" className="w-24 h-24 object-contain opacity-30 mb-6" />
            <h2 className="text-2xl font-black text-text-main">La Taberna Cerrada</h2>
            <p className="text-text-muted mt-2">La Taberna de Ciudad Friki está en mantenimiento. Vuelve más tarde.</p>
        </div>
    );

    const handleThreadClick = (id: string) => {
        setSelectedThreadId(id);
        setIsDetailsModalOpen(true);
    };

    const handleVote = async (id: string, type: 'like' | 'dislike') => {
        if (!user) return alert(t('tavern.loginToVote'));
        await TavernService.interact(id, 'thread', type);
        refetch();
    };

    const handleEdit = (thread: any) => {
        setThreadToEdit(thread);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('tavern.thread.deleteConfirm'))) return;

        try {
            const { error } = await TavernService.deleteThread(id);
            if (error) throw error;
            refetch();
        } catch (err) {
            console.error('Error deleting thread:', err);
            alert(t('tavern.thread.deleteError'));
        }
    };

    const categories: { label: string, value: ThreadCategory, color: string }[] = [
        { label: t('tavern.categories.all'), value: 'Todas', color: 'bg-slate-500' },
        { label: t('tavern.categories.anime'), value: 'Anime/Manga', color: 'bg-accent-red' },
        { label: t('tavern.categories.gaming'), value: 'Gaming/Tech', color: 'bg-indigo-500' },
        { label: t('tavern.categories.culture'), value: 'Cultura/Arte', color: 'bg-emerald-500' },
        { label: t('tavern.categories.events'), value: 'Eventos', color: 'bg-amber-500' },
        { label: t('tavern.categories.offTopic'), value: 'Off-topic', color: 'bg-slate-400' },
    ];
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT SIDEBAR (Tavern Categories & Navigation) */}
            <aside className="hidden lg:block lg:col-span-3">
                <div className="sticky top-24 space-y-4">

                    <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden">
                        <div className="p-4">
                            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">{t('common.navigation', 'Navegación')}</h2>
                            <nav className="space-y-1">
                                <a className="flex items-center px-3 py-2 text-sm font-medium bg-brand-primary/10 text-brand-primary rounded-md" href="#">
                                    <HomeIcon className="text-xl mr-3" size={20} />
                                    {t('tavern.nav.start')}
                                </a>
                                <a className="flex items-center px-3 py-2 text-sm font-medium text-text-sub hover:bg-bg-sub rounded-md transition" href="#">
                                    <Flame className="text-xl mr-3" size={20} />
                                    {t('tavern.nav.popular')}
                                </a>
                                <a className="flex items-center px-3 py-2 text-sm font-medium text-text-sub hover:bg-bg-sub rounded-md transition" href="#">
                                    <Clock className="text-xl mr-3" size={20} />
                                    {t('tavern.nav.new')}
                                </a>
                            </nav>
                        </div>
                    </div>

                    <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden">
                        <div className="p-4">
                            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">{t('tavern.categories.title')}</h2>
                            <div className="flex flex-col gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.value}
                                        onClick={() => setCategory(cat.value)}
                                        className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-md transition ${category === cat.value ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'text-text-sub hover:bg-bg-sub'}`}
                                    >
                                        <div className="flex items-center">
                                            <span className={`w-2 h-2 rounded-full ${cat.color} mr-3`}></span>
                                            {cat.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </aside>

            {/* MAIN CONTENT (Tavern Feed) */}
            <main className="col-span-1 lg:col-span-6">

                {/* Sort Filters */}
                <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setSortBy('NEW')}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${sortBy === 'NEW' ? 'bg-brand-primary text-text-inv shadow-lg shadow-brand-primary/30' : 'bg-bg-sub text-text-sub hover:bg-bg-sub/80 hover:text-text-main'}`}
                        >
                            <Clock size={16} /> {t('tavern.filters.new')}
                        </button>
                        <button
                            onClick={() => setSortBy('HOT')}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${sortBy === 'HOT' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-bg-sub text-text-sub hover:bg-bg-sub/80 hover:text-text-main'}`}
                        >
                            <Flame size={16} /> {t('tavern.filters.hot')}
                        </button>
                    </div>
                </div>

                {/* Create Thread Input Box */}
                <div
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-bg-side rounded-xl shadow-sm border border-border-theme p-4 mb-6 flex items-center gap-3 cursor-pointer hover:border-brand-primary/50 transition group"
                >
                    <div className="h-10 w-10 rounded-full bg-bg-sub border border-border-theme overflow-hidden shrink-0">
                        <img
                            alt="User Avatar"
                            className="h-full w-full object-cover"
                            src={getAvatarSource(profile?.avatar_url || null)}
                        />
                    </div>
                    <div className="bg-bg-sub w-full rounded-full px-4 py-2 text-sm text-text-muted group-hover:bg-bg-sub/80 transition">
                        {t('tavern.createThread', { name: profile?.username || t('common.user') })}
                    </div>
                    <PlusCircle className="text-brand-primary" size={24} />
                </div>

                {/* Threads Feed */}
                <div className="space-y-4">
                    {isLoading && threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-brand-primary" size={40} />
                            <p className="text-text-muted">{t('tavern.loading')}</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 rounded-xl text-center">
                            <p className="text-red-500 font-medium">{t('common.error')}. {t('common.retry')}.</p>
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="bg-bg-side border border-border-theme p-12 rounded-xl text-center">
                            <MessageSquare className="mx-auto text-text-muted mb-4" size={48} />
                            <h3 className="text-text-main font-bold text-lg mb-1">{t('tavern.empty')}</h3>
                            <p className="text-text-muted text-sm">{t('tavern.emptyCategory', { category })}</p>
                        </div>
                    ) : (
                        <>
                            {threads.map(thread => (
                                <ThreadCard
                                    key={thread.id}
                                    thread={thread}
                                    onVote={(type) => handleVote(thread.id, type)}
                                    onClick={() => handleThreadClick(thread.id)}
                                    onEdit={() => handleEdit(thread)}
                                    onDelete={() => handleDelete(thread.id)}
                                />
                            ))}

                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="w-full py-4 text-sm font-bold text-text-muted hover:text-brand-primary transition flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : t('tavern.loadMore')}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* RIGHT SIDEBAR (Community Rules & Top Contributors) */}
            <aside className="hidden xl:block xl:col-span-3 space-y-6">

                <div className="bg-bg-side rounded-xl shadow-sm border border-border-theme overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-bg-side to-bg-main relative shadow-inner">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary via-transparent to-transparent" />
                    </div>
                    <div className="px-5 pb-5 relative">
                        <div className="-mt-8 mb-3">
                            <div className="h-16 w-16 bg-bg-side p-1 rounded-xl shadow-md mx-auto border border-border-theme">
                                <img alt="Logo" className="w-full h-full object-contain rounded-lg" src="/assets/adaptive-icon.png" />
                            </div>
                        </div>
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-lg text-text-main">Ciudad Friki</h3>
                            <p className="text-xs text-text-muted">{t('tavern.description')}</p>
                        </div>

                        <div className="flex justify-between text-center border-t border-b border-divider-theme py-3 mb-4 px-2">
                            <div className="flex flex-col items-center justify-center flex-1 border-r border-divider-theme">
                                <div className="font-bold text-text-main text-lg">{tavernInteractions > 0 ? (tavernInteractions >= 1000 ? `${(tavernInteractions / 1000).toFixed(1)}k+` : tavernInteractions) : '...'}</div>
                                <div className="text-[10px] text-text-muted uppercase tracking-widest">{t('tavern.posts', 'Posteos')}</div>
                            </div>
                            <div className="flex flex-col items-center justify-center flex-1">
                                <div className="font-black text-text-main text-accent-green flex items-center gap-1.5 text-lg">
                                    <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                    {onlineUsersCount}
                                </div>
                                <div className="text-[10px] text-text-muted uppercase tracking-widest">{t('tavern.online', 'Frikis Online')}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('tavern.rules.title')}</h4>
                            <div className="flex items-start gap-2 text-xs text-text-sub">
                                <span className="font-bold text-brand-primary">1.</span>
                                <span>{t('tavern.rules.respect')}</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-text-sub">
                                <span className="font-bold text-brand-primary">2.</span>
                                <span>{t('tavern.rules.tags')}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </aside>

            {/* Modals */}
            <ThreadDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                threadId={selectedThreadId}
            />

            <CreateThreadModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => refetch()}
            />

            <EditThreadModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setThreadToEdit(null);
                }}
                thread={threadToEdit}
                onSuccess={() => refetch()}
            />
        </div>
    );
}
