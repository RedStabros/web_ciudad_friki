import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Users, Calendar, Trophy, FileText, Loader2, Database, Zap } from 'lucide-react';
import { SuperAdminService } from '../../services/SuperAdminService';

export default function AdminMetrics() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const { data } = await SuperAdminService.getAdminStats();
        if (data) {
            setStats(data[0] || data); // Sometimes RPC returns array of 1 element
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-brand-primary mb-2" size={40} />
                <p className="text-sm font-bold uppercase tracking-widest text-text-sub">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-text-main flex items-center gap-2 mb-6">
                <Activity className="text-brand-primary" /> {t('admin.metrics.title', 'Métricas Globales')}
            </h1>

            {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Users */}
                    <div className="bg-bg-side border border-border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted font-bold uppercase">{t('admin.metrics.totalUsers', 'Total Usuarios')}</p>
                            <p className="text-3xl font-black text-text-main">{stats.total_users || 0}</p>
                        </div>
                    </div>

                    {/* Events */}
                    <div className="bg-bg-side border border-border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted font-bold uppercase">{t('admin.metrics.totalEvents', 'Total Eventos')}</p>
                            <p className="text-3xl font-black text-text-main">{stats.total_events || 0}</p>
                            <p className="text-xs text-text-sub">{stats.active_events || 0} {t('common.active', 'Activos')}</p>
                        </div>
                    </div>

                    {/* Trivias */}
                    <div className="bg-bg-side border border-border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shrink-0">
                            <Trophy size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted font-bold uppercase">{t('admin.metrics.triviaAttempts', 'Intentos Trivia')}</p>
                            <p className="text-3xl font-black text-text-main">{stats.trivia_attempts || 0}</p>
                        </div>
                    </div>

                    {/* Surveys */}
                    <div className="bg-bg-side border border-border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                            <FileText size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted font-bold uppercase">{t('admin.metrics.surveyStats', 'Respuestas Encuestas')}</p>
                            <p className="text-3xl font-black text-text-main">{stats.survey_stats || stats.survey_responses || 0}</p>
                        </div>
                    </div>

                    {/* Economy */}
                    <div className="bg-bg-side border border-border-theme rounded-[2rem] p-6 shadow-sm flex items-center gap-4 md:col-span-2 lg:col-span-4 bg-gradient-to-r from-bg-side to-brand-primary/5">
                        <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                            <Database size={28} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-brand-primary font-bold uppercase">{t('admin.metrics.economy', 'Economía (Frikicoins emitidos)')}</p>
                            <p className="text-4xl font-black text-text-main mt-1 flex items-center gap-2">
                                <Zap size={24} className="text-brand-primary animate-pulse" />
                                {stats.total_frikicoins_issued || stats.frikicoins_issued || 0} FC
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-text-muted border-2 border-dashed border-border-theme rounded-2xl">
                    <p>{t('common.error', 'Ocurrió un error al cargar')}</p>
                </div>
            )}
        </div>
    );
}
