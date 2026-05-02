import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      // A veces configuramos el redirect con ?next=/reset-password
      const next = searchParams.get('next') || '/';

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          
          if (isMounted) {
            navigate(next);
          }
        } catch (err: any) {
          console.error('Error in auth callback:', err);
          if (isMounted) setError(err.message || 'Authentication error');
        }
      } else {
        // Fallback: revisar si de casualidad ya hay sesión iniciada por implicit flow o evento
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          navigate(next);
        } else if (isMounted) {
          setError(t('auth.invalidLink', 'Invalid or expired confirmation link.'));
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 animate-fade-in">
      {error ? (
        <div className="bg-bg-side border border-accent-red p-8 rounded-3xl text-center max-w-md shadow-xl">
          <h2 className="text-2xl font-black text-accent-red mb-4">{t('auth.error', 'Authentication Error')}</h2>
          <p className="text-text-main mb-8 font-medium">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-brand-primary hover:bg-brand-primary-light text-text-inv px-6 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-brand-primary/20"
          >
            {t('auth.backToLogin', 'Back to Login')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center bg-bg-side p-8 rounded-3xl border border-border-theme shadow-xl">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-text-main font-black tracking-wide animate-pulse">
            {t('auth.verifying', 'Verifying your session...')}
          </p>
        </div>
      )}
    </div>
  );
}
