import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../hooks/useAchievements';
import { SEO } from '../components/SEO';
import { ArrowLeft, Loader2, Trophy, Search } from 'lucide-react';

type SortOrder = 'reward' | 'tier';

export default function Achievements() {
    const { t, i18n } = useTranslation();
    const { user, session } = useAuth();
    const { catalog, unlocked, stats, loading } = useAchievements(user?.id);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<SortOrder>('reward');

    const unlockedIds = useMemo(() => new Set(unlocked.map(u => u.achievement_id)), [unlocked]);

    const tierCounts = useMemo(() => {
        const counts = { special: 0, diamond: 0, gold: 0, silver: 0, bronze: 0 };
        unlocked.forEach(u => {
            const ach = catalog.find(a => a.id === u.achievement_id);
            if (ach && counts[ach.tier] !== undefined) {
                counts[ach.tier]++;
            }
        });
        return counts;
    }, [catalog, unlocked]);

    const filteredCatalog = useMemo(() => {
        return catalog
            .filter(ach => {
                const search = searchQuery.toLowerCase();
                const name = i18n.language === 'en' ? ach.name_en : ach.name_es;
                const desc = i18n.language === 'en' ? ach.description_en : ach.description_es;
                return name.toLowerCase().includes(search) || desc.toLowerCase().includes(search);
            })
            .sort((a, b) => {
                const aUnlocked = unlockedIds.has(a.id);
                const bUnlocked = unlockedIds.has(b.id);
                if (aUnlocked && !bUnlocked) return -1;
                if (!aUnlocked && bUnlocked) return 1;

                if (sortOrder === 'tier') {
                    const tierWeights: any = { special: 5, diamond: 4, gold: 3, silver: 2, bronze: 1 };
                    const tierDiff = (tierWeights[b.tier] || 0) - (tierWeights[a.tier] || 0);
                    if (tierDiff !== 0) return tierDiff;
                }
                return b.reward_amount - a.reward_amount;
            });
    }, [catalog, unlockedIds, searchQuery, sortOrder, i18n.language]);

    const getProgress = (ach: any) => {
        if (!stats || !ach.required_metric) return 0;
        const current = stats[ach.required_metric] || 0;
        return Math.min(Number(current), ach.required_value);
    };

    if (!session) return <Navigate to="/login" replace />;

    return (
        <div className="min-h-screen bg-bg-main pb-24">
            <SEO 
                title={t('achievements.title')} 
                description="Vitrina de Logros"
            />
            {/* Header */}
            <div className="sticky top-0 z-30 bg-bg-side border-b border-border-theme">
                <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <Link to="/profile" className="p-2 rounded-xl hover:bg-bg-sub transition text-text-muted hover:text-text-main">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2.5 flex-1">
                            <Trophy className="text-amber-400" size={24} />
                            <h1 className="text-lg font-black text-amber-400 uppercase tracking-tight">{t('achievements.title')}</h1>
                        </div>
                    </div>
                    
                    {/* Resumen de Tiers */}
                    {unlocked.length > 0 && (
                        <div className="flex flex-col items-center justify-center bg-bg-sub rounded-xl p-3 border border-divider-theme">
                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-black mb-1">
                                {Object.entries(tierCounts).filter(([_, count]) => count > 0).map(([tier, count]) => {
                                    const getTierIcon = (t: string) => `/icons/tiers/tier_${t}512x512.png`;
                                    const colorMap: any = { special: 'text-purple-400', diamond: 'text-cyan-400', gold: 'text-amber-400', silver: 'text-slate-300', bronze: 'text-orange-400' };
                                    return (
                                        <div key={tier} className={`flex items-center gap-1 ${colorMap[tier]}`}>
                                            <img src={getTierIcon(tier)} alt={tier} className="w-5 h-5 object-contain" /> 
                                            {count}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-text-muted font-bold">
                                {t('achievements.progress', { unlocked: unlocked.length, total: catalog.length })}
                            </p>
                        </div>
                    )}

                    {/* Barra de búsqueda */}
                    <div className="flex items-center bg-bg-sub border border-border-theme rounded-xl px-3 py-2">
                        <Search size={18} className="text-text-muted mr-2" />
                        <input
                            type="text"
                            placeholder={t('achievements.search', 'Buscar logros...')}
                            className="bg-transparent border-none outline-none text-sm text-text-main flex-1 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filtros de Orden */}
                    <div className="flex bg-bg-sub rounded-xl border border-divider-theme p-1">
                        <button
                            onClick={() => setSortOrder('reward')}
                            className={`flex-1 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${
                                sortOrder === 'reward' ? 'bg-amber-500 text-black shadow-sm' : 'text-text-muted hover:text-text-main'
                            }`}
                        >
                            {t('achievements.sortByReward', 'Por Recompensa')}
                        </button>
                        <button
                            onClick={() => setSortOrder('tier')}
                            className={`flex-1 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${
                                sortOrder === 'tier' ? 'bg-amber-500 text-black shadow-sm' : 'text-text-muted hover:text-text-main'
                            }`}
                        >
                            {t('achievements.sortByTier', 'Por Nivel')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 pt-6">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-400" size={32} /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredCatalog.map(ach => {
                            const isUnlocked = unlockedIds.has(ach.id);
                            const name = i18n.language === 'en' ? ach.name_en : ach.name_es;
                            const desc = i18n.language === 'en' ? ach.description_en : ach.description_es;
                            const progress = getProgress(ach);
                            const percent = Math.floor((progress / ach.required_value) * 100);

                            const tierColors = {
                                bronze: 'border-orange-400/50 bg-orange-400/10 text-orange-400',
                                silver: 'border-slate-300/50 bg-slate-300/10 text-slate-300',
                                gold: 'border-amber-400/50 bg-amber-400/10 text-amber-400',
                                diamond: 'border-cyan-400/50 bg-cyan-400/10 text-cyan-400',
                                special: 'border-purple-400/50 bg-purple-400/10 text-purple-400'
                            };
                            
                            const getTierIcon = (tier: string) => {
                                switch (tier) {
                                    case 'special': return '/icons/tiers/tier_special512x512.png';
                                    case 'diamond': return '/icons/tiers/tier_diamond512x512.png';
                                    case 'gold': return '/icons/tiers/tier_gold512x512.png';
                                    case 'silver': return '/icons/tiers/tier_silver512x512.png';
                                    default: return '/icons/tiers/tier_bronze512x512.png';
                                }
                            };

                            if (ach.is_secret && !isUnlocked) {
                                return (
                                    <div key={ach.id} className="bg-bg-side border border-border-theme rounded-2xl p-4 flex gap-4 items-center opacity-70">
                                        <div className="w-16 h-16 rounded-2xl bg-bg-sub flex items-center justify-center shrink-0 text-3xl">❓</div>
                                        <div>
                                            <h3 className="font-black text-text-muted text-base">{t('achievements.locked')}</h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                <img src={getTierIcon(ach.tier)} alt={ach.tier} className="w-3.5 h-3.5 object-contain grayscale opacity-50" />
                                                <p className="text-xs text-text-muted/50">{t(`achievements.tiers.${ach.tier}`)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={ach.id} className={`bg-bg-side border rounded-2xl p-4 flex gap-4 items-start transition-all ${isUnlocked ? tierColors[ach.tier] : 'border-border-theme opacity-80'}`}>
                                    <div className="w-16 h-16 rounded-2xl bg-bg-sub shrink-0 overflow-hidden flex items-center justify-center border border-border-theme">
                                        {ach.icon_url ? (
                                            <img 
                                                src={ach.icon_url} 
                                                alt={name} 
                                                className={`w-full h-full object-cover ${!isUnlocked && 'grayscale opacity-50'}`} 
                                                onError={(e) => { e.currentTarget.src = getTierIcon(ach.tier); }}
                                            />
                                        ) : (
                                            <img src={getTierIcon(ach.tier)} alt={ach.tier} className={`w-10 h-10 object-contain ${!isUnlocked && 'grayscale opacity-50'}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-black text-base leading-tight pr-2 ${!isUnlocked && 'text-text-muted'}`}>{name}</h3>
                                            <img src={getTierIcon(ach.tier)} alt={ach.tier} className="w-4 h-4 object-contain shrink-0" title={t(`achievements.tiers.${ach.tier}`)} />
                                        </div>
                                        <p className="text-xs text-text-muted mb-3 line-clamp-2">{desc}</p>
                                        
                                        {isUnlocked ? (
                                            <div className="flex items-center gap-2 mt-auto">
                                                <div className="flex-1 h-1.5 bg-bg-sub rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent-green w-full" />
                                                </div>
                                                <span className="text-[10px] font-black text-accent-green uppercase tracking-wider whitespace-nowrap">
                                                    +{ach.reward_amount} FC
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-auto">
                                                <div className="flex-1 h-1.5 bg-bg-sub rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-500" style={{ width: `${percent}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-text-muted whitespace-nowrap">
                                                    {progress}/{ach.required_value}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
