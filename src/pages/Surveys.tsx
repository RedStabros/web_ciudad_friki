import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, CheckCircle2, Clock, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { SurveyService, type Survey } from '../services/SurveyService';
import { useAuth } from '../context/AuthContext';

export default function Surveys() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [votingId, setVotingId] = useState<string | null>(null);

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        setIsLoading(true);
        try {
            const { surveys: data, error: fetchError } = await SurveyService.getSurveys();
            if (fetchError) throw fetchError;
            setSurveys(data || []);
        } catch (err: any) {
            console.error('Error fetching surveys:', err);
            setError(err.message || t('surveys.errorLoading'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVote = async (surveyId: string, optionId: string) => {
        if (!user) return alert(t('auth.signInToVote') || 'Inicia sesión para votar');
        setVotingId(optionId);
        try {
            const { error: voteError } = await SurveyService.vote(surveyId, optionId);
            if (voteError) throw voteError;
            // Refresh surveys to show updated results
            fetchSurveys();
        } catch (err: any) {
            console.error('Error voting:', err);
            alert(err.message || t('surveys.errorSubmitting'));
        } finally {
            setVotingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
                <p className="text-text-muted font-medium uppercase tracking-widest text-[10px]">{t('surveys.loading')}</p>
            </div>
        );
    }

    const activeSurveys = surveys.filter(s => s.is_active);
    const pastSurveys = surveys.filter(s => !s.is_active);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-12 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-divider-theme pb-8">
                <div>
                    <div className="flex items-center gap-2 text-brand-primary mb-2">
                        <BarChart3 size={24} />
                        <span className="font-black uppercase tracking-widest text-[10px]">{t('common.community')}</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-text-main tracking-tight uppercase italic">{t('surveys.title')} Friki</h1>
                    <p className="text-text-sub mt-2 text-lg font-medium">{t('surveys.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-5 py-2.5 rounded-2xl border border-brand-primary/20 shadow-lg shadow-brand-primary/5">
                    <TrendingUp size={18} />
                    <span className="font-black text-xs uppercase tracking-tight">{activeSurveys.length} {t('common.active')}</span>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
                    <AlertCircle size={24} />
                    <p className="font-medium">{error}</p>
                    <button onClick={fetchSurveys} className="ml-auto underline font-bold">{t('common.retry')}</button>
                </div>
            )}

            {/* Active Surveys Section */}
            <section className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-1.5 bg-brand-primary rounded-full" />
                    <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">{t('surveys.hot')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeSurveys.length > 0 ? activeSurveys.map((survey) => (
                        <SurveyCard
                            key={survey.id}
                            survey={survey}
                            onVote={handleVote}
                            isVoting={votingId}
                        />
                    )) : (
                        <div className="col-span-full py-16 text-center bg-bg-side rounded-[2.5rem] border-2 border-dashed border-divider-theme opacity-50 flex flex-col items-center">
                            <BarChart3 className="text-text-muted mb-4" size={48} />
                            <p className="text-text-sub italic font-bold uppercase tracking-widest text-xs">{t('surveys.noActiveSurveys')}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Past Surveys Section */}
            {pastSurveys.length > 0 && (
                <section className="space-y-8 opacity-60 hover:opacity-100 transition-all duration-500">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-1.5 bg-text-muted rounded-full" />
                        <h2 className="text-2xl font-black text-text-main uppercase tracking-tight">{t('surveys.completed')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pastSurveys.map((survey) => (
                            <SurveyCard
                                key={survey.id}
                                survey={survey}
                                onVote={() => { }}
                                isVoting={null}
                                isPast
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function SurveyCard({ survey, onVote, isVoting, isPast = false }: {
    survey: Survey,
    onVote: (sId: string, oId: string) => void,
    isVoting: string | null,
    isPast?: boolean
}) {
    const totalVotes = (survey.options || []).reduce((sum, opt) => sum + (opt.votes_count || 0), 0);

    return (
        <article className="bg-bg-side rounded-3xl p-6 shadow-xl border border-divider-theme transition-all hover:border-brand-primary/30 relative overflow-hidden group">
            {isPast && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase bg-bg-sub border border-divider-theme px-2 py-1 rounded-md text-text-muted">
                    <CheckCircle2 size={12} /> {t('surveys.completed')}
                </div>
            )}
            {!isPast && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold uppercase bg-brand-primary/10 px-2 py-1 rounded-md text-brand-primary">
                    <Clock size={12} /> {new Date(survey.expires_at).toLocaleDateString()}
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-bold text-text-main mb-2 leading-tight pr-12">{survey.title}</h3>
                <p className="text-sm text-text-sub line-clamp-2">{survey.description}</p>
            </div>
            <div className="space-y-3">
                {(survey.options || []).map((option) => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
                    const isUserVote = survey.user_voted; // Assuming this is joined or checked

                    return (
                        <div key={option.id} className="relative group/option">
                            <button
                                disabled={isPast || isUserVote || isVoting !== null}
                                onClick={() => onVote(survey.id, option.id)}
                                className={`w-full relative z-10 px-5 py-4 rounded-[1.25rem] border-2 text-left transition-all flex items-center justify-between shadow-inner
                                    ${isUserVote && option.votes_count > 0 ? 'border-brand-primary bg-brand-primary/5' : 'border-divider-theme bg-bg-sub/50 hover:border-brand-primary/30'}`}
                            >
                                <span className="font-black text-sm text-text-main uppercase tracking-tight">{option.text}</span>
                                {(isPast || isUserVote) && (
                                    <span className="font-black text-xs text-brand-primary italic">{percentage}%</span>
                                )}
                                {isVoting === option.id && <Loader2 size={16} className="animate-spin text-brand-primary" />}
                            </button>

                            {/* Progress Bar background */}
                            {(isPast || isUserVote) && (
                                <div
                                    className="absolute inset-0 bg-primary/10 rounded-xl transition-all duration-1000 ease-out"
                                    style={{ width: `${percentage}%`, zIndex: 0 }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
                <span className="bg-bg-sub px-3 py-1 rounded-full border border-divider-theme">{totalVotes} {t('surveys.responses')}</span>
                {survey.id_reward && (
                    <div className="flex items-center gap-1.5 text-brand-secondary">
                        <Star size={12} className="fill-brand-secondary" />
                        {t('surveys.rewardActive')}
                    </div>
                )}
            </div>
        </article >
    );
}
