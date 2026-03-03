import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
    ArrowLeft, Check, Loader2, X, CheckCircle, Pencil, Copy, Share2, Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { SystemService } from '../services/SystemService';
import { useProfile } from '../hooks/useProfile';
import { UserService } from '../services/UserService';
import { getAvatarSource, AVATARS } from '../config/avatars';
import { useTheme, type Theme } from '../context/ThemeContext';
import { ALL_INTERESTS } from '../config/interests';



const THEME_OPTIONS = [
    { id: 'dark-friki', name: 'Dark Friki', bg: '#1e222a', brand: '#e1192f' },
    { id: 'light-friki', name: 'Light Friki', bg: '#ffffff', brand: '#e1192f' },
    { id: 'amoled', name: 'AMOLED Black', bg: '#000000', brand: '#ff1744' },
    { id: 'pastel', name: 'Pastel Dreams', bg: '#fef3f8', brand: '#ec4899' },
    { id: 'neon', name: 'Neon Cyberpunk', bg: '#0f0f23', brand: '#ff0080' },
    { id: 'autumn', name: 'Warm Autumn', bg: '#2d1b0e', brand: '#ff6b35' },
    { id: 'midnight', name: 'Midnight Purple', bg: '#1a0b2e', brand: '#d8b4fe' },
    { id: 'abyss', name: 'Abyssal Blue', bg: '#0b1120', brand: '#38bdf8' },
    { id: 'sky', name: 'Sky Breeze', bg: '#e0f2fe', brand: '#0284c7' },
    { id: 'crimson', name: 'Crimson Night', bg: '#1a0404', brand: '#dc2626' },
    { id: 'desert', name: 'Desert Sands', bg: '#fef3c7', brand: '#b45309' },
    { id: 'teal', name: 'Oceanic Teal', bg: '#083344', brand: '#06b6d4' },
    { id: 'pastel-purple', name: 'Pastel Lavender', bg: '#fbf5ff', brand: '#a855f7' },
    { id: 'pastel-mint', name: 'Pastel Mint', bg: '#f0fdf4', brand: '#4ade80' },
    { id: 'pastel-peach', name: 'Pastel Peach', bg: '#fffbeb', brand: '#fbbf24' },
    { id: 'retro-gb', name: 'Retro GameBoy', bg: '#8bac0f', brand: '#306230' },
    { id: 'hacker', name: 'Hacker Console', bg: '#000000', brand: '#00ff41' },
    { id: 'fantasy', name: 'High Fantasy', bg: '#0e1a12', brand: '#c9a44c' },
    { id: 'steampunk', name: 'Steampunk', bg: '#2b1b17', brand: '#cd7f32' },
    { id: 'galactic', name: 'Galactic Command', bg: '#080d1a', brand: '#0ea5e9' }
];

interface SelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function SelectionModal({ isOpen, onClose, title, children }: SelectionModalProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-bg-side rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[85vh] border border-divider-theme">
                <header className="p-8 pb-4 flex items-center justify-between border-b border-divider-theme">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase text-text-main leading-none">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-all">
                        <X size={24} className="text-text-muted" />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-bg-main/30">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function Profile() {
    const { t } = useTranslation();
    const { session, user, isSuperuser, maintenanceMode, checkMaintenance } = useAuth();
    const { theme: currentTheme, setTheme } = useTheme();
    const userId = user?.id;

    const { profile, wallet, isLoading, refetch } = useProfile(userId);

    const [isSaving, setIsSaving] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        bio: '',
        city: '',
        neighborhood: '',
        phone: '',
        website: '',
        interests: [] as string[],
        avatar_url: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                username: profile.username || '',
                full_name: profile.full_name || '',
                bio: profile.bio || '',
                city: profile.city || '',
                neighborhood: profile.neighborhood || '',
                phone: profile.phone || '',
                website: profile.website || '',
                interests: profile.interests || [],
                avatar_url: profile.avatar_url || 'dragon_01'
            });
        }
    }, [profile]);

    // Protect route
    if (!session && !isLoading) {
        return <Navigate to="/login" replace />;
    }

    const handleSave = async () => {
        if (!userId) return;
        setIsSaving(true);
        try {
            const result = await UserService.updateProfile(userId, formData);
            if (result.error) {
                alert(t('profile.saveError') + ': ' + (result.error as any).message);
            } else {
                refetch();
                alert(t('profile.saveSuccess'));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleCopyQR = () => {
        if (wallet?.deposit_qr) {
            navigator.clipboard.writeText(wallet.deposit_qr);
            alert(t('profile.copySuccess', { code: wallet.deposit_qr }));
        }
    };

    const handleShareQR = async () => {
        if (wallet?.deposit_qr) {
            const shareData = {
                title: t('profile.wallet'),
                text: t('wallet.shareMessage', { username: profile?.username, code: wallet.deposit_qr }),
                url: window.location.href
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    handleCopyQR();
                }
            } catch (err) {
                console.error('Error sharing:', err);
            }
        }
    };

    const handleToggleMaintenance = async () => {
        if (!isSuperuser) return;
        setIsTogglingMaintenance(true);
        try {
            const newMode = !maintenanceMode;
            await SystemService.updateGlobalSetting('maintenance_mode', newMode);
            await checkMaintenance();
            alert(t('settings.admin.maintenanceChanged', { status: newMode ? t('common.active') : t('common.inactive') }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsTogglingMaintenance(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const displayAvatar = getAvatarSource(formData.avatar_url);
    const displayBalance = wallet ? wallet.balance.toLocaleString(localStorage.getItem('i18nextLng') === 'en' ? 'en-US' : 'es-CO') : '0';
    const displayQR = wallet?.deposit_qr || t('common.noData');
    const currentThemeData = THEME_OPTIONS.find(themeOpt => themeOpt.id === currentTheme) || THEME_OPTIONS[0];

    return (
        <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full font-display animate-in fade-in duration-500">

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 rounded-lg hover:bg-bg-sub transition-colors text-text-main">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-bold text-text-main">{t('profile.title')}</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-primary hover:bg-brand-primary-light disabled:opacity-50 text-text-inv font-semibold py-2.5 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {t('common.save')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (Forms & Avatars) */}
                <div className="lg:col-span-7 space-y-8">

                    {/* Avatar Section */}
                    <div className="bg-bg-side rounded-2xl p-8 shadow-md border border-border-theme flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                            <div className="w-32 h-32 rounded-full border-4 border-brand-primary p-1">
                                <img alt="User Avatar" className="w-full h-full rounded-full bg-bg-sub object-cover" src={displayAvatar} />
                            </div>
                            <div className="absolute bottom-0 right-0 bg-brand-primary text-text-inv p-2 rounded-full shadow-lg border-4 border-bg-side flex items-center justify-center hover:bg-brand-primary-light transition-colors">
                                <Pencil size={16} />
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-text-sub font-medium">{t('profile.tapToChange')}</p>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-bg-side rounded-2xl p-8 shadow-md border border-border-theme">
                        <h2 className="text-xl font-bold text-text-main mb-6">{t('profile.personalInfo')}</h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-sub mb-2">{t('onboarding.username')}</label>
                                    <input
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-sub mb-2">{t('onboarding.fullName')}</label>
                                    <input
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        type="text"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-sub mb-2">{t('auth.emailLabel')}</label>
                                <input
                                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all opacity-75 cursor-not-allowed"
                                    readOnly
                                    value={profile?.email || ''}
                                    type="email"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-sub mb-2">{t('onboarding.phone')}</label>
                                    <input
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-sub mb-2">{t('profile.website')}</label>
                                    <input
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        type="text"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-sub mb-2">{t('onboarding.city')}</label>
                                    <input
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-sub mb-2">{t('onboarding.neighborhood')}</label>
                                    <input
                                        className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                                        value={formData.neighborhood}
                                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                        type="text"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-sub mb-2">{t('profile.bio')}</label>
                                <textarea
                                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl py-3 px-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all resize-none"
                                    rows={3}
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column (Wallet & Meta) */}
                <div className="lg:col-span-5 space-y-8">

                    {/* Wallet Section */}
                    <div className="bg-bg-side rounded-2xl p-6 shadow-md border border-border-theme">
                        <h2 className="text-xl font-bold text-text-main mb-6">{t('profile.wallet')}</h2>
                        <div className="border-2 border-dashed border-brand-primary/50 bg-bg-sub rounded-xl p-6 flex flex-col items-center justify-center mb-6 relative">
                            <p className="text-sm text-text-muted mb-4 font-medium">{t('profile.qrLabel')}</p>

                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <img
                                    alt="Wallet QR Code"
                                    className="w-48 h-48 mix-blend-multiply"
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${wallet?.deposit_qr || `FRIKI:QR_${user?.id}`}`}
                                />
                            </div>

                            <p className="mt-4 text-xs text-text-muted text-center break-all font-mono max-w-[80%]">{displayQR}</p>

                            <div className="flex gap-4 mt-6 w-full px-4">
                                <button onClick={handleCopyQR} className="flex-1 flex flex-col items-center justify-center bg-bg-sub/50 hover:bg-bg-sub py-3 rounded-lg transition-colors group">
                                    <Copy size={20} className="text-text-sub mb-1 group-hover:text-brand-primary" />
                                    <span className="text-xs font-medium text-text-sub">{t('common.copy')}</span>
                                </button>
                                <button onClick={handleShareQR} className="flex-1 flex flex-col items-center justify-center bg-bg-sub/50 hover:bg-bg-sub py-3 rounded-lg transition-colors group">
                                    <Share2 size={20} className="text-text-sub mb-1 group-hover:text-brand-primary" />
                                    <span className="text-xs font-medium text-text-sub">{t('common.share')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-bg-sub rounded-xl p-6 text-center border border-border-theme">
                            <p className="text-sm text-text-muted mb-2">{t('profile.balanceLabel')}</p>
                            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-brand-secondary">
                                {displayBalance}
                            </div>
                        </div>
                    </div>

                    {/* Interests Section */}
                    <div className="bg-bg-side rounded-2xl p-6 shadow-md border border-border-theme">
                        <h2 className="text-xl font-bold text-text-main mb-6">{t('profile.interests')}</h2>
                        <p className="text-sm text-text-sub mb-4">{t('profile.interestsSubtitle')}</p>
                        <div className="flex flex-wrap gap-2">
                            {ALL_INTERESTS.map((interest) => {
                                const isSelected = formData.interests.includes(interest);
                                return (
                                    <button
                                        key={interest}
                                        onClick={() => toggleInterest(interest)}
                                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 border
                                            ${isSelected
                                                ? 'bg-brand-primary border-brand-primary text-text-inv'
                                                : 'bg-bg-sub border-border-theme text-text-sub hover:border-brand-primary/50'}`}
                                    >
                                        {t(`profile.interests.${interest}`, interest)}
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div className="bg-bg-side rounded-2xl p-6 shadow-md border border-border-theme">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-text-main">{t('settings.appearance')}</h2>
                            <button
                                onClick={() => setIsThemeModalOpen(true)}
                                className="text-brand-primary hover:underline text-sm font-semibold"
                            >
                                {t('common.change')}
                            </button>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-bg-sub rounded-xl border border-border-theme">
                            <div className="h-10 w-10 rounded-lg shadow-md border border-white/20" style={{ backgroundColor: currentThemeData.bg }}>
                                <div className="w-full h-2 mt-auto" style={{ backgroundColor: currentThemeData.brand }} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-main uppercase tracking-wider">{currentThemeData.name}</p>
                                <p className="text-[10px] text-text-muted uppercase font-black">{t('settings.theme.current')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Admin Panel */}
                    {isSuperuser && (
                        <div className="bg-bg-side border border-brand-secondary/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Shield size={80} className="text-brand-secondary" />
                            </div>
                            <div className="flex items-center gap-2 mb-4 text-brand-secondary">
                                <Shield size={20} />
                                <h2 className="text-lg font-black uppercase italic tracking-tighter">{t('settings.adminTools')}</h2>
                            </div>
                            <div className="flex items-center justify-between gap-4 p-5 bg-bg-sub/50 rounded-2xl border border-divider-theme shadow-inner">
                                <div className="space-y-1">
                                    <p className="font-black text-text-main text-sm uppercase tracking-tight">{t('settings.admin.maintenanceMode')}</p>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">
                                        {t('common.status')}: <span className={maintenanceMode ? 'text-brand-secondary' : 'text-text-muted opacity-50'}>{maintenanceMode ? t('settings.admin.active') : t('settings.admin.inactive')}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleMaintenance}
                                    disabled={isTogglingMaintenance}
                                    className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95
                                        ${maintenanceMode
                                            ? 'bg-brand-secondary text-text-inv hover:bg-brand-secondary-light shadow-brand-secondary/20'
                                            : 'bg-bg-sub border border-border-theme text-text-muted hover:text-text-main'}`}
                                >
                                    {isTogglingMaintenance ? <Loader2 size={12} className="animate-spin" /> : (maintenanceMode ? t('common.finish') : t('common.active'))}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Avatar Selector Modal */}
            <SelectionModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                title={t('profile.modals.avatar')}
            >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {AVATARS.map((avatar) => {
                        const isSelected = formData.avatar_url === avatar.id;
                        return (
                            <button
                                key={avatar.id}
                                onClick={() => {
                                    setFormData({ ...formData, avatar_url: avatar.id });
                                    setIsAvatarModalOpen(false);
                                }}
                                className={`relative group p-1 rounded-2xl border-4 transition-all hover:scale-105 active:scale-95
                                    ${isSelected ? 'border-brand-primary bg-brand-primary/10' : 'border-transparent hover:border-border-theme'}`}
                            >
                                <img
                                    src={avatar.file}
                                    alt={avatar.name}
                                    className="w-full aspect-square object-cover rounded-xl"
                                />
                                {isSelected && (
                                    <div className="absolute -top-2 -right-2 bg-brand-primary text-text-inv p-1.5 rounded-full shadow-lg border-2 border-bg-side">
                                        <Check size={12} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </SelectionModal>

            {/* Theme Selector Modal */}
            <SelectionModal
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                title={t('profile.modals.theme')}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {THEME_OPTIONS.map((t_opt) => {
                        const isSelected = currentTheme === t_opt.id;
                        return (
                            <button
                                key={t_opt.id}
                                onClick={() => setTheme(t_opt.id as Theme)}
                                className={`group p-6 rounded-3xl border-4 transition-all text-left flex items-center justify-between
                                    ${isSelected ? 'border-brand-primary bg-brand-primary/5' : 'border-divider-theme hover:border-brand-primary/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl shadow-lg border-2 border-divider-theme overflow-hidden" style={{ backgroundColor: t_opt.bg }}>
                                        <div className="w-full h-3 mt-auto" style={{ backgroundColor: t_opt.brand }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-widest text-text-main leading-none mb-1">{t_opt.name}</p>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">Base: {t_opt.bg}</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <CheckCircle size={24} className="text-brand-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => setIsThemeModalOpen(false)}
                        className="bg-brand-primary text-text-inv font-black uppercase tracking-widest py-3 px-8 rounded-xl active:scale-95 transition-all shadow-lg shadow-brand-primary/20"
                    >
                        {t('common.confirm')}
                    </button>
                </div>
            </SelectionModal>

        </div>
    );
}
