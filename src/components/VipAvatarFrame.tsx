import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Calendar, Zap, X } from 'lucide-react';
import { getAvatarSource } from '../config/avatars';

export interface VipPassInfo {
    has_vip?: boolean;
    pass_id?: string;
    event_id?: string;
    event_title?: string;
    event_banner?: string | null;
    multiplier?: number;
    starts_at?: string;
    expires_at?: string;
    days_left?: number;
    seconds_left?: number;
    notes?: string | null;
}

interface VipAvatarFrameProps {
    avatarUrl: string | null;
    size?: number; // size in px, e.g. 40, 48, 64, 80
    hasVip?: boolean;
    vipInfo?: VipPassInfo | null;
    onPressAvatar?: () => void;
    showBadge?: boolean;
    className?: string;
}

export function VipAvatarFrame({
    avatarUrl,
    size = 48,
    hasVip = false,
    vipInfo = null,
    onPressAvatar,
    showBadge = true,
    className = '',
}: VipAvatarFrameProps) {
    const { t } = useTranslation();
    const [infoModalVisible, setInfoModalVisible] = useState(false);

    const isVip = hasVip || Boolean(vipInfo?.has_vip);
    const multiplier = vipInfo?.multiplier || 2;

    const handlePress = () => {
        if (isVip && vipInfo) {
            setInfoModalVisible(true);
        } else if (onPressAvatar) {
            onPressAvatar();
        }
    };

    const handleBadgePress = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isVip) {
            setInfoModalVisible(true);
        }
    };

    const formatExpiration = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString([], {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <>
            <div
                className={`relative inline-flex items-center justify-center cursor-pointer ${className}`}
                style={{ width: size, height: size }}
                onClick={handlePress}
            >
                {/* Glow ring for VIP */}
                {isVip && (
                    <div
                        className="absolute inset-0 rounded-full border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse"
                        style={{ width: size, height: size }}
                    />
                )}

                {/* Avatar Image */}
                <img
                    src={getAvatarSource(avatarUrl)}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover relative z-10"
                />

                {/* VIP Badge */}
                {isVip && showBadge && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={handleBadgePress}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleBadgePress(e as any);
                            }
                        }}
                        title={t('vip.activeBadgeTitle', 'Pase VIP Activo - Click para ver detalles')}
                        className="absolute -bottom-1 -right-1 z-20 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md border border-amber-200 flex items-center gap-0.5 hover:scale-110 transition-transform cursor-pointer select-none"
                    >
                        <span>👑</span>
                        <span>x{multiplier}</span>
                    </span>
                )}
            </div>

            {/* VIP Pass Info Modal */}
            {infoModalVisible && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setInfoModalVisible(false)}
                >
                    <div
                        className="bg-bg-side w-full max-w-sm rounded-2xl border-2 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)] overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 p-4 text-black text-center relative">
                            <button
                                onClick={() => setInfoModalVisible(false)}
                                className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/40 text-black transition"
                            >
                                <X size={16} />
                            </button>
                            <div className="inline-flex p-2 rounded-full bg-black/10 mb-1">
                                <Sparkles size={24} className="text-black" />
                            </div>
                            <h3 className="font-black text-base uppercase tracking-wider">
                                {t('vip.title', 'Pase VIP de Evento')}
                            </h3>
                            <p className="text-xs font-bold opacity-90">
                                {t('vip.subtitle', 'Manilla Digital Activa')}
                            </p>
                        </div>

                        {/* Body Details */}
                        <div className="p-5 space-y-4">
                            <div className="text-center">
                                <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-400 font-black text-xs uppercase tracking-widest rounded-full border border-amber-400/40">
                                    ⚡ {multiplier}x Multiplicador de Frikicoins
                                </span>
                            </div>

                            {vipInfo?.event_title && (
                                <div className="p-3 bg-bg-sub rounded-xl border border-border-theme">
                                    <div className="text-[10px] text-text-muted font-black uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Calendar size={12} /> {t('vip.event', 'Evento Asociado')}
                                    </div>
                                    <div className="font-bold text-text-main text-sm">
                                        {vipInfo.event_title}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 text-xs text-text-sub">
                                <div className="flex items-center justify-between p-2 bg-bg-sub/60 rounded-lg">
                                    <span className="flex items-center gap-1.5 text-text-muted">
                                        <Zap size={14} className="text-amber-400" /> {t('vip.rewards', 'Recompensas x2:')}
                                    </span>
                                    <span className="font-bold text-text-main">
                                        {t('vip.appliesTo', 'Asistencias y Stands')}
                                    </span>
                                </div>

                                {vipInfo?.expires_at && (
                                    <div className="flex items-center justify-between p-2 bg-bg-sub/60 rounded-lg">
                                        <span className="text-text-muted">{t('vip.expires', 'Válido hasta:')}</span>
                                        <span className="font-bold text-amber-400">
                                            {formatExpiration(vipInfo.expires_at)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setInfoModalVisible(false)}
                                className="w-full py-2.5 rounded-xl font-bold bg-amber-400 text-black hover:bg-amber-300 transition shadow-md"
                            >
                                {t('common.close', 'Entendido')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

