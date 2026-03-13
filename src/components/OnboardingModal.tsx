import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Coins, ChevronRight, Check, Loader2, Star, MapPin, User, Heart } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface OnboardingModalProps {
    userId: string;
    onFinish: () => void;
}

interface FormData {
    username: string;
    full_name: string;
    country: string;
    city: string;
    bio: string;
    phone: string;
    neighborhood: string;
    interests: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────
const INTERESTS_LIST = [
    { key: 'Anime', emoji: '🌸' },
    { key: 'Manga', emoji: '📚' },
    { key: 'Cosplay', emoji: '🎭' },
    { key: 'Videojuegos', emoji: '🎮' },
    { key: 'Juegos de Mesa', emoji: '🎲' },
    { key: 'Rol', emoji: '🐉' },
    { key: 'Cómics', emoji: '💥' },
    { key: 'Tecnología', emoji: '💻' },
    { key: 'Cine', emoji: '🎬' },
    { key: 'Series', emoji: '📺' },
    { key: 'K-Pop', emoji: '🎵' },
    { key: 'Arte', emoji: '🎨' },
    { key: 'Música', emoji: '🎸' },
    { key: 'Deportes', emoji: '⚽' },
    { key: 'Teatro', emoji: '🎭' },
    { key: 'Cultura', emoji: '🌍' },
    { key: 'SoftCombat', emoji: '⚔️' },
    { key: 'Talleres', emoji: '🔧' },
    { key: 'Educación', emoji: '📖' },
    { key: 'Literatura', emoji: '✍️' },
];

const STEPS = ['identity', 'location', 'interests', 'bio'] as const;
type Step = typeof STEPS[number];

// ── Component ──────────────────────────────────────────────────────────────
export default function OnboardingModal({ userId, onFinish }: OnboardingModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('identity');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [rewardAmount, setRewardAmount] = useState(0);
    const [error, setError] = useState('');

    const [form, setForm] = useState<FormData>({
        username: '',
        full_name: '',
        country: '',
        city: '',
        bio: '',
        phone: '',
        neighborhood: '',
        interests: [],
    });

    const stepIndex = STEPS.indexOf(step);
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    const setField = (key: keyof FormData, value: string | string[]) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const toggleInterest = (key: string) => {
        setForm(prev => ({
            ...prev,
            interests: prev.interests.includes(key)
                ? prev.interests.filter(i => i !== key)
                : [...prev.interests, key],
        }));
    };

    const validateStep = (): string => {
        if (step === 'identity') {
            if (!form.username || form.username.trim().length < 3) return t('onboarding.errors.usernameLength', 'El username debe tener al menos 3 caracteres.');
            if (!form.full_name || form.full_name.trim().length < 2) return t('onboarding.errors.fullNameRequired', 'El nombre completo es obligatorio.');
        }
        if (step === 'location') {
            if (!form.country) return t('onboarding.errors.countryRequired', 'Selecciona tu país.');
            if (!form.city || form.city.trim().length < 2) return t('onboarding.errors.cityRequired', 'Indica tu ciudad.');
        }
        return '';
    };

    const nextStep = () => {
        const err = validateStep();
        if (err) { setError(err); return; }
        setError('');
        const next = STEPS[stepIndex + 1];
        if (next) setStep(next);
    };

    const handleSubmit = async () => {
        const err = validateStep();
        if (err) { setError(err); return; }
        setError('');
        setLoading(true);
        try {
            // Uses a web-specific RPC — does NOT modify the mobile app's complete_profile_and_reward
            const { data, error: rpcError } = await supabase.rpc('web_complete_profile_and_reward', {
                p_user_id: userId,
                p_username: form.username.trim(),
                p_full_name: form.full_name.trim(),
                p_city: form.city.trim(),
                p_country: form.country,
                p_bio: form.bio.trim(),
                p_phone: form.phone.trim(),
                p_neighborhood: form.neighborhood.trim(),
                p_interests: form.interests,
            });

            if (rpcError) throw rpcError;

            if (data?.rewarded) setRewardAmount(data.amount || 1000);
            setDone(true);
        } catch (e: any) {
            setError(e?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ──────────────────────────────────────────────────────
    if (done) {
        return (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="relative w-full max-w-md bg-bg-side rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-accent-yellow/5 to-transparent pointer-events-none" />

                    <div className="relative p-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-accent-yellow/10 border-2 border-accent-yellow/30 flex items-center justify-center mx-auto mb-6 animate-bounce">
                            <Coins size={36} className="text-accent-yellow" />
                        </div>
                        <h2 className="text-2xl font-black text-text-main mb-2">
                            {t('onboarding.successTitle', '¡Bienvenido a Ciudad Friki!')}
                        </h2>
                        {rewardAmount > 0 && (
                            <div className="inline-flex items-center gap-2 bg-accent-yellow/10 border border-accent-yellow/30 rounded-2xl px-5 py-3 my-4">
                                <Star size={18} className="text-accent-yellow fill-accent-yellow" />
                                <span className="text-accent-yellow font-black text-lg">+{rewardAmount} Frikicoins</span>
                                <Star size={18} className="text-accent-yellow fill-accent-yellow" />
                            </div>
                        )}
                        <p className="text-text-sub text-sm font-medium leading-relaxed mb-8">
                            {t('onboarding.successMessage', 'Tu perfil está listo. ¡Explora todo lo que Ciudad Friki tiene para ti!')}
                        </p>
                        <button
                            onClick={onFinish}
                            className="w-full py-4 bg-brand-primary text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-primary/90 transition-all shadow-lg active:scale-95"
                        >
                            {t('onboarding.letsGo')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main modal ──────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-bg-side rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[92vh] flex flex-col">

                {/* Header with reward callout */}
                <div className="shrink-0 bg-gradient-to-r from-brand-primary/20 to-accent-yellow/10 border-b border-border-theme px-8 pt-8 pb-6">
                    {/* Logo placeholder / brand */}
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center gap-2 bg-accent-yellow/10 border border-accent-yellow/30 rounded-2xl px-4 py-2">
                            <Coins size={16} className="text-accent-yellow" />
                            <span className="text-accent-yellow font-black text-sm">
                                {t('onboarding.reward', 'Completa y gana 1,000 Frikicoins')}
                            </span>
                        </div>
                    </div>
                    <h1 className="text-xl font-black text-text-main text-center mb-1">
                        {t('onboarding.title', '¡Configura tu perfil!')}
                    </h1>
                    <p className="text-text-muted text-xs text-center font-medium leading-relaxed">
                        {t('onboarding.subtitle', 'No te lo saltes — esta es tu única oportunidad de recibir el bono de bienvenida.')}
                    </p>

                    {/* Progress bar */}
                    <div className="mt-5 h-1.5 bg-bg-sub rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-primary to-accent-yellow rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        {STEPS.map((s, i) => (
                            <span
                                key={s}
                                className={`text-[9px] font-black uppercase tracking-widest transition-colors ${i <= stepIndex ? 'text-brand-primary' : 'text-text-muted/40'}`}
                            >
                                {t(`onboarding.steps.${s}`, s)}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

                    {/* ── STEP 1: Identity ── */}
                    {step === 'identity' && (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <User size={16} className="text-brand-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-text-muted">{t('onboarding.steps.identity', 'Identidad')}</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-wide">
                                    {t('onboarding.username', 'Nombre de usuario')} <span className="text-accent-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={e => setField('username', e.target.value)}
                                    placeholder={t('onboarding.placeholders.username', '@tu_usuario')}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary transition"
                                    autoCapitalize="none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-wide">
                                    {t('onboarding.fullName', 'Nombre completo')} <span className="text-accent-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.full_name}
                                    onChange={e => setField('full_name', e.target.value)}
                                    placeholder={t('onboarding.placeholders.fullName', 'Tu nombre real')}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-wide">
                                    {t('onboarding.phone', 'Teléfono')} <span className="text-text-muted/50 font-normal normal-case">(opcional)</span>
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setField('phone', e.target.value)}
                                    placeholder="+1 234 567 8900"
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary transition"
                                />
                            </div>
                        </>
                    )}

                    {/* ── STEP 2: Location ── */}
                    {step === 'location' && (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin size={16} className="text-brand-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-text-muted">{t('onboarding.steps.location', 'Ubicación')}</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-wide">
                                    {t('onboarding.country', 'País')} <span className="text-accent-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.country}
                                    onChange={e => setField('country', e.target.value)}
                                    placeholder={t('onboarding.placeholders.selectCountry', 'Ej: Venezuela, Colombia...')}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-wide">
                                    {t('onboarding.city', 'Ciudad')} <span className="text-accent-red">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.city}
                                    onChange={e => setField('city', e.target.value)}
                                    placeholder={t('onboarding.placeholders.selectCity', 'Ej: Caracas, Bogotá...')}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-wide">
                                    {t('onboarding.neighborhood', 'Barrio / Sector')} <span className="text-text-muted/50 font-normal normal-case">(opcional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.neighborhood}
                                    onChange={e => setField('neighborhood', e.target.value)}
                                    placeholder={t('onboarding.placeholders.neighborhood', 'Tu barrio o sector')}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary transition"
                                />
                            </div>
                        </>
                    )}

                    {/* ── STEP 3: Interests ── */}
                    {step === 'interests' && (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                <Heart size={16} className="text-brand-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-text-muted">{t('onboarding.steps.interests', 'Intereses')}</span>
                            </div>
                            <p className="text-xs text-text-muted italic -mt-2">{t('profile.interestsSubtitle', 'Selecciona todo lo que te apasiona')}</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                {INTERESTS_LIST.map(({ key, emoji }) => {
                                    const selected = form.interests.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => toggleInterest(key)}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all ${selected
                                                ? 'bg-brand-primary border-brand-primary text-white shadow-md scale-105'
                                                : 'bg-bg-sub border-border-theme text-text-sub hover:border-brand-primary/50'
                                                }`}
                                        >
                                            <span>{emoji}</span>
                                            {t(`profile.interests_list.${key}`, key)}
                                            {selected && <Check size={11} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── STEP 4: Bio ── */}
                    {step === 'bio' && (
                        <>
                            <div className="flex items-center gap-2 mb-2">
                                <Star size={16} className="text-brand-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-text-muted">{t('onboarding.steps.bio', 'Sobre ti')}</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-sub mb-2 uppercase tracking-wide">
                                    {t('onboarding.bio', 'Cuéntanos sobre ti')} <span className="text-text-muted/50 font-normal normal-case">(opcional)</span>
                                </label>
                                <textarea
                                    value={form.bio}
                                    onChange={e => setField('bio', e.target.value)}
                                    placeholder={t('onboarding.placeholders.bio', 'Comparte tu historia friki...')}
                                    rows={4}
                                    className="w-full bg-bg-sub border border-border-theme rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:border-brand-primary transition resize-none"
                                />
                            </div>
                            {/* Summary card before submit */}
                            <div className="bg-bg-sub/60 border border-border-theme rounded-2xl p-4 space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">{t('onboarding.summary.title')}</p>
                                <div className="flex justify-between text-xs"><span className="text-text-muted">{t('onboarding.summary.username')}</span><span className="font-bold text-text-main">@{form.username}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-text-muted">{t('onboarding.summary.name')}</span><span className="font-bold text-text-main">{form.full_name}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-text-muted">{t('onboarding.summary.city')}</span><span className="font-bold text-text-main">{form.city}, {form.country}</span></div>
                                <div className="flex justify-between text-xs"><span className="text-text-muted">{t('onboarding.summary.interests')}</span><span className="font-bold text-text-main">{form.interests.length} {t('onboarding.summary.selected')}</span></div>
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="text-accent-red text-xs font-bold bg-accent-red/10 px-4 py-2 rounded-xl">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer nav */}
                <div className="shrink-0 px-8 pb-8 pt-4 border-t border-divider-theme flex gap-3">
                    {stepIndex > 0 && (
                        <button
                            onClick={() => { setError(''); setStep(STEPS[stepIndex - 1]); }}
                            className="px-5 py-3 rounded-xl border border-border-theme text-text-muted hover:text-text-main hover:bg-bg-sub transition text-xs font-black uppercase tracking-widest"
                        >
                            {t('common.back', 'Volver')}
                        </button>
                    )}
                    {step !== 'bio' ? (
                        <button
                            onClick={nextStep}
                            className="flex-1 py-3 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-brand-primary/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                        >
                            {t('common.next', 'Siguiente')}
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-3 bg-gradient-to-r from-brand-primary to-accent-yellow text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
                            {loading ? t('common.loading', 'Guardando...') : t('onboarding.submit', 'Completar y recibir 1,000 FC')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
