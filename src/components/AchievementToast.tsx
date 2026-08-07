import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ToastProps {
    achievement: {
        name_es: string;
        name_en: string;
        icon_url: string;
        tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'special';
    };
    onClose: () => void;
}

export default function AchievementToast({ achievement, onClose }: ToastProps) {
    const { t, i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for transition
        }, 5000);
        return () => clearTimeout(timer);
    }, []); // Run once on mount

    const name = i18n.language === 'en' ? achievement.name_en : achievement.name_es;

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'special': return '/icons/tiers/tier_special512x512.png';
            case 'diamond': return '/icons/tiers/tier_diamond512x512.png';
            case 'gold': return '/icons/tiers/tier_gold512x512.png';
            case 'silver': return '/icons/tiers/tier_silver512x512.png';
            default: return '/icons/tiers/tier_bronze512x512.png';
        }
    };

    const tierColors = {
        bronze: 'border-orange-400 bg-orange-400/20 text-orange-400',
        silver: 'border-slate-300 bg-slate-300/20 text-slate-300',
        gold: 'border-amber-400 bg-amber-400/20 text-amber-400',
        diamond: 'border-cyan-400 bg-cyan-400/20 text-cyan-400',
        special: 'border-purple-400 bg-purple-400/20 text-purple-400'
    };

    return (
        <div className={`fixed bottom-20 sm:bottom-6 sm:right-6 left-4 right-4 sm:left-auto z-[400] transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
            <div className={`bg-bg-side border-2 rounded-2xl p-4 shadow-2xl flex items-center gap-4 ${tierColors[achievement.tier]}`}>
                <div className="w-12 h-12 rounded-xl bg-bg-main flex items-center justify-center shrink-0 border border-border-theme overflow-hidden">
                    {achievement.icon_url ? (
                        <img src={achievement.icon_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <img src={getTierIcon(achievement.tier)} alt={achievement.tier} className="w-8 h-8 object-contain" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        {t('achievements.unlocked_toast')}
                    </p>
                    <p className="font-black text-base leading-tight truncate text-text-main mt-0.5">
                        {name}
                    </p>
                </div>
                <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className="p-2 -mr-2 text-text-muted hover:text-text-main">
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
