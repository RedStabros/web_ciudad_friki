import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
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

export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!email) {
            setError(t('auth.emailRequired'));
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError(t('auth.invalidEmail'));
            setLoading(false);
            return;
        }

        if (mode === 'reset') {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) {
                setError(error.message);
            } else {
                setMessage(t('auth.recoveryEmailSent'));
            }
            setLoading(false);
            return;
        }

        // For login & signup
        if (!password) {
            setError(t('auth.passwordRequired', 'Contraseña requerida'));
            setLoading(false);
            return;
        }

        if (mode === 'signup') {
            if (password !== confirmPassword) {
                setError(t('auth.passwordsDoNotMatch'));
                setLoading(false);
                return;
            }

            const rules = validatePassword(password);
            const allRulesMet = Object.values(rules).every(Boolean);
            if (!allRulesMet) {
                setError(t('profile.passwordRules') + ' ' + t('auth.fillAllFields', 'Debe cumplir todas las reglas.'));
                setLoading(false);
                return;
            }

            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });

            if (error) {
                if (error.message.includes('already registered') || error.message.includes('already exists')) {
                    setError(t('auth.userExistsMessage'));
                } else {
                    setError(error.message || t('auth.error'));
                }
            } else {
                setMessage(t('auth.signUpSuccessMessage'));
                setMode('login');
                setPassword('');
                setConfirmPassword('');
            }
        } else {
            // Login
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message || t('auth.error'));
            } else {
                navigate('/');
            }
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) setError(error.message);
    };

    const isSignUp = mode === 'signup';
    const isReset = mode === 'reset';

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] animate-fade-in px-4 py-12 md:py-20">
            <div className="bg-bg-side border border-border-theme w-full max-w-md p-8 rounded-3xl shadow-xl shadow-brand-primary/5">

                <div className="text-center mb-8">
                    <img src="/assets/adaptive-icon.png" alt="Dragon" className="w-20 h-20 mx-auto mb-4 drop-shadow-lg" />
                    <h1 className="text-3xl font-black tracking-tighter text-text-main mb-1">
                        {isReset ? t('auth.accessRecovery') : (isSignUp ? t('auth.signUp', 'Crear Cuenta') : t('auth.welcomeBack'))}
                    </h1>
                    <p className="text-text-sub">
                        {isReset ? t('auth.recoverySubtitle') : t('auth.loginSubtitle')}
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

                <form onSubmit={handleAuth} className="flex flex-col gap-4">

                    <div>
                        <label className="block text-sm font-bold text-text-sub mb-1 ml-1" htmlFor="email">
                            {t('auth.emailLabel')}
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-bg-sub text-text-main px-4 py-3 rounded-xl border border-border-theme hover:border-text-sub focus:border-brand-primary focus:outline-none transition-colors"
                            placeholder={t('auth.emailPlaceholder')}
                            required
                        />
                    </div>

                    {!isReset && (
                        <div>
                            <label className="block text-sm font-bold text-text-sub mb-1 ml-1" htmlFor="password">
                                {t('auth.passwordLabel')}
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
                    )}

                    {isSignUp && (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-text-sub mb-1 ml-1" htmlFor="confirmPassword">
                                    {t('auth.confirmPassword', 'Confirmar Contraseña')}
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
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brand-primary hover:bg-brand-primary-light text-text-inv font-bold py-3.5 rounded-xl transition-colors mt-2 flex items-center justify-center disabled:opacity-50 shadow-lg shadow-brand-primary/20"
                    >
                        {loading ? t('auth.loading') : (isReset ? t('auth.recoveryButton') : (isSignUp ? t('auth.signUp', 'Crear Cuenta') : t('auth.loginButton')))}
                    </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-4">
                    {!isReset && (
                        <button
                            onClick={() => { setMode('reset'); setError(null); setMessage(null); }}
                            className="text-sm font-bold text-text-sub hover:text-brand-primary transition-colors"
                        >
                            {t('auth.forgotPassword')}
                        </button>
                    )}

                    {isReset && (
                        <button
                            onClick={() => { setMode('login'); setError(null); setMessage(null); }}
                            className="text-sm font-bold text-text-sub hover:text-brand-primary transition-colors"
                        >
                            {t('auth.backToLogin')}
                        </button>
                    )}

                    {!isReset && (
                        <>
                            <div className="flex items-center w-full gap-4 opacity-60">
                                <hr className="flex-1 border-border-theme" />
                                <span className="text-xs font-bold text-text-sub">{t('auth.loginWith')}</span>
                                <hr className="flex-1 border-border-theme" />
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full bg-white hover:bg-gray-100 text-[#1a1a24] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-3 border border-gray-200 shadow-md active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {t('auth.continueWithGoogle')}
                            </button>

                            <button
                                onClick={() => { setMode(isSignUp ? 'login' : 'signup'); setError(null); setMessage(null); }}
                                className="text-sm text-text-sub hover:text-text-main transition-colors mt-2"
                            >
                                {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}{' '}
                                <span className="font-bold text-brand-primary hover:text-brand-primary-light">
                                    {isSignUp ? t('auth.signIn') : t('auth.signUp', 'Crear Cuenta')}
                                </span>
                            </button>
                        </>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-divider-theme flex flex-col items-center justify-center gap-2">
                    <p className="text-xs text-text-sub text-center w-full">{t('auth.agreeTo', 'Al continuar, aceptas nuestros')} <Link to="/legal/terms" className="text-brand-primary hover:underline">{t('auth.terms', 'Términos y Condiciones')}</Link> {t('auth.and', 'y')} <Link to="/legal/privacy" className="text-brand-primary hover:underline">{t('auth.privacy', 'Política de Privacidad')}</Link></p>
                </div>

            </div>

        </div>
    );
}
