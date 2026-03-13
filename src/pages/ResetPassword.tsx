import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';

const validatePassword = (password: string) => {
    return {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };
};

const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    const rules = validatePassword(password);
    const metRules = Object.values(rules).filter(Boolean).length;
    if (metRules <= 2) return 'weak';
    if (metRules <= 4) return 'medium';
    return 'strong';
};

export default function ResetPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // Supabase handles parsing the hash from URL into a session automatically,
        // so `supabase.auth.getUser` will return the user if the recovery link is valid.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Link is valid, we are ready to set a new password
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError(t('auth.passwordsDoNotMatch'));
            setLoading(false);
            return;
        }

        const rules = validatePassword(password);
        const allRulesMet = Object.values(rules).every(Boolean);
        if (!allRulesMet) {
            setError(t('profile.passwordRules') + ' ' + t('auth.fillAllFields'));
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage(t('auth.passwordResetSuccess'));
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }

        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] animate-fade-in px-4 py-12 md:py-20">
            <div className="bg-bg-side border border-border-theme w-full max-w-md p-8 rounded-3xl shadow-xl shadow-brand-primary/5">

                <div className="text-center mb-8">
                    <img src="/assets/adaptive-icon.png" alt="Dragon" className="w-20 h-20 mx-auto mb-4 drop-shadow-lg" />
                    <h1 className="text-3xl font-black tracking-tighter text-text-main mb-1">
                        {t('auth.resetPasswordTitle')}
                    </h1>
                    <p className="text-text-sub">
                        {t('auth.resetPasswordSubtitle')}
                    </p>
                </div>

                {error && (
                    <div className="bg-accent-red/10 border border-accent-red/50 text-accent-red p-3 rounded-xl mb-6 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-accent-green/10 border border-accent-green/50 text-accent-green p-3 rounded-xl mb-6 text-sm font-bold text-center">
                        {message}
                    </div>
                )}

                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">

                    <div>
                        <label className="block text-sm font-bold text-text-sub mb-1 ml-1" htmlFor="password">
                            {t('auth.newPassword')}
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-bg-sub text-text-main px-4 py-3 rounded-xl border border-border-theme hover:border-text-sub focus:border-brand-primary focus:outline-none transition-colors pr-12"
                                placeholder={t('auth.passwordPlaceholder')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-primary transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-text-sub mb-1 ml-1" htmlFor="confirmPassword">
                            {t('auth.confirmNewPassword')}
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-bg-sub text-text-main px-4 py-3 rounded-xl border border-border-theme hover:border-text-sub focus:border-brand-primary focus:outline-none transition-colors pr-12"
                                placeholder={t('auth.passwordPlaceholder')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-primary transition-colors p-1"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {password.length > 0 && (
                        <div className="bg-bg-sub p-4 rounded-xl space-y-3 mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-text-sub">{t('profile.passwordStrength')}: </span>
                                <span className={`text-sm font-black uppercase tracking-widest ${getPasswordStrength(password) === 'weak' ? 'text-accent-red' :
                                    getPasswordStrength(password) === 'medium' ? 'text-brand-secondary' : 'text-accent-green'
                                    }`}>
                                    {t(`profile.${getPasswordStrength(password)}`)}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-text-sub">{t('profile.passwordRules')}</p>
                                {Object.entries(validatePassword(password)).map(([key, met]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        {met ? <CheckCircle2 size={14} className="text-accent-green" /> : <Circle size={14} className="text-text-muted" />}
                                        <span className={`text-xs ${met ? 'text-accent-green' : 'text-text-sub'}`}>
                                            {t(`profile.rule${key.charAt(0).toUpperCase() + key.slice(1)}`)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-primary hover:bg-brand-primary-light text-text-inv font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                    >
                        {loading ? t('auth.loading') : t('auth.updatePassword')}
                    </button>
                </form>

            </div>
        </div>
    );
}
