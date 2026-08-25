import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MaintenancePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center p-6 text-center transition-colors duration-300">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                {/* Maintenance Image */}
                <div className="mb-10 relative mx-auto w-72 h-72">
                    <div className="absolute inset-0 bg-brand-primary/30 rounded-[3rem] blur-2xl animate-pulse"></div>
                    <div className="relative z-10 w-full h-full p-2 bg-bg-side rounded-[3rem] shadow-2xl border border-divider-theme overflow-hidden flex items-center justify-center">
                        <img
                            src="/assets/maintenance.png"
                            alt="Ciudad Friki Under Construction"
                            className="w-full h-full object-cover rounded-[2.5rem]"
                        />
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-text-main mb-4 tracking-tight font-display italic uppercase">
                    {t('maintenance.title')}
                </h1>

                <p className="text-text-sub text-lg mb-10 leading-relaxed font-black uppercase tracking-tighter opacity-70">
                    {t('maintenance.message')}
                </p>

                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-secondary/10 border border-brand-secondary/20 rounded-full text-brand-secondary text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-secondary/5">
                        <AlertCircle size={16} />
                        <span>{t('maintenance.scheduled')}</span>
                    </div>

                    <div className="pt-6">
                        {user ? (
                            <button
                                onClick={async () => {
                                    await signOut();
                                    navigate('/login');
                                }}
                                className="group flex items-center gap-3 mx-auto px-8 py-4 bg-bg-side hover:bg-bg-sub text-text-muted hover:text-text-main rounded-2xl transition-all duration-300 border border-divider-theme shadow-xl hover:shadow-accent-red/10"
                            >
                                <LogOut size={18} className="group-hover:-translate-x-1 transition duration-300 text-accent-red" />
                                <span className="font-black text-sm uppercase tracking-widest">
                                    {t('maintenance.logout', 'Cerrar Sesión')}
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="group flex items-center gap-3 mx-auto px-8 py-4 bg-bg-side hover:bg-bg-sub text-text-muted hover:text-text-main rounded-2xl transition-all duration-300 border border-divider-theme shadow-xl hover:shadow-brand-primary/10"
                            >
                                <Lock size={18} className="group-hover:rotate-12 transition duration-300 text-brand-primary" />
                                <span className="font-black text-sm uppercase tracking-widest">
                                    {t('maintenance.adminLogin')}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
