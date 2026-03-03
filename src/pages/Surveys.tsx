import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Clock, Loader2, AlertCircle, TrendingUp, Star, ChevronRight, X, Layout } from 'lucide-react';
import { SurveyService, type Survey } from '../services/SurveyService';
import { useAuth } from '../context/AuthContext';

function SurveyVotingModal({ survey, onClose, onVote, isVoting }: {
    survey: Survey,
    onClose: () => void,
    onVote: (sId: string, oId: string) => void,
    isVoting: string | null
}) {
    const { t } = useTranslation();
    const totalVotes = (survey.options || []).reduce((sum, opt) => sum + (opt.votes_count || 0), 0);

    return (
        <div className="fixed inset-0 z-[200] bg-ui-overlay backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-bg-side w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border border-divider-theme flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-divider-theme bg-bg-sub/30 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h2 className="font-black text-text-main uppercase tracking-tight">{survey.title}</h2>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest italic">
                                {t('surveys.responses')}: {totalVotes}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-bg-sub rounded-2xl transition">
                        <X size={24} className="text-text-muted" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                    <p className="text-text-sub font-medium leading-relaxed border-l-4 border-brand-primary pl-6 py-2">
                        {survey.description}
                    </p>

                    <div className="space-y-4">
                        {(survey.options || []).map((option) => {
                            const percentage = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
                            const isUserVote = survey.user_voted;

                            return (
                                <div key={option.id} className="relative group/option">
                                    <button
                                        disabled={isUserVote || isVoting !== null}
                                        onClick={() => onVote(survey.id, option.id)}
                                        className={`w-full relative z-10 px-8 py-6 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between shadow-inner
                                            ${isUserVote && option.votes_count > 0 ? 'border-brand-primary bg-brand-primary/5' : 'border-divider-theme bg-bg-sub/50 hover:border-brand-primary/30'}`}
                                    >
                                        <span className="font-black text-lg text-text-main uppercase tracking-tight">{option.text}</span>
                                        {isUserVote && (
                                            <span className="font-black text-xl text-brand-primary italic">{percentage}%</span>
                                        )}
                                        {isVoting === option.id && <Loader2 size={24} className="animate-spin text-brand-primary" />}
                                    </button>

                                    {isUserVote && (
                                        <div
                                            className="absolute inset-0 bg-brand-primary/10 rounded-[2rem] transition-all duration-1000 ease-out"
                                            style={{ width: `${percentage}%`, zIndex: 0 }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-8 border-t border-divider-theme bg-bg-sub/30">
                    <button
                        onClick={onClose}
                        className="w-full bg-bg-sub text-text-main py-5 rounded-3xl font-black text-xl border border-divider-theme hover:bg-divider-theme transition-all"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SurveyCard({ survey, onClick }: {
    survey: Survey,
    onClick: () => void
}) {
    const { t } = useTranslation();

    return (
        <article
            onClick={() => !survey.user_voted && onClick()}
            className={`bg-bg-side rounded-[3rem] p-8 shadow-xl border border-divider-theme transition-all relative overflow-hidden ${survey.user_voted ? 'opacity-75 cursor-default' : 'hover:border-brand-primary/50 cursor-pointer group'}`}
        >
            <div className="absolute -top-10 -right-10 p-20 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
                <Layout size={100} className="text-brand-primary" />
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-2 bg-brand-primary/10 px-3 py-1.5 rounded-xl border border-brand-primary/20">
                    <Clock size={14} className="text-brand-primary" />
                    <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest">
                        {survey.expire_date ? new Date(survey.expire_date).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
                {survey.reward_amount && survey.reward_amount > 0 && (
                    <div className="flex items-center gap-1.5 text-brand-secondary bg-brand-secondary/10 px-3 py-1.5 rounded-xl border border-brand-secondary/20">
                        <Star size={14} className="fill-brand-secondary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">+{survey.reward_amount} FKC</span>
                    </div>
                )}
            </div>

            <div className="mb-12 relative z-10">
                <h3 className="text-3xl font-black text-text-main mb-4 leading-none uppercase italic tracking-tighter group-hover:text-brand-primary transition-colors">{survey.title}</h3>
                <p className="text-text-sub font-medium line-clamp-2 min-h-[3rem]">{survey.description}</p>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-divider-theme relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">{t('surveys.new', '¡NUEVA!')}</span>
                </div>
                <div className={`px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-xl transition-all flex items-center gap-2 ${survey.user_voted ? 'bg-bg-sub text-text-muted' : 'bg-brand-primary text-text-inv group-hover:scale-105 active:scale-95 shadow-brand-primary/30'}`}>
                    {survey.user_voted ? t('surveys.completed') : t('nav.surveys')}
                    {!survey.user_voted && <ChevronRight size={16} />}
                </div>
            </div>
        </article>
    );
}

export default function Surveys() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [votingId, setVotingId] = useState<string | null>(null);
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => {
        setIsLoading(true);
        try {
            const { surveys: data, error: fetchError } = await SurveyService.getSurveys();
            if (fetchError) throw fetchError;
            // Only active surveys as requested: "las pasadas no deben verse"
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

            // Refresh local data for the selected survey to show updated results
            const updatedSurveys = await SurveyService.getSurveys();
            const surveyData = (updatedSurveys.surveys || []).find(s => s.id === surveyId);
            if (surveyData) {
                setSelectedSurvey(surveyData);
                setSurveys(updatedSurveys.surveys || []);
            }
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
                <p className="text-text-muted font-black uppercase tracking-widest text-[10px]">{t('surveys.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-20 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-divider-theme pb-12 px-4">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 text-brand-primary mb-4">
                        <BarChart3 size={32} />
                        <span className="font-black uppercase tracking-[0.2em] text-xs">{t('common.community')}</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-text-main tracking-tight uppercase italic leading-[0.8] mb-6">
                        {t('surveys.title')} <span className="text-brand-primary">FRIKI</span>
                    </h1>
                    <p className="text-text-sub text-xl font-medium border-l-4 border-brand-primary pl-6 py-2">
                        {t('surveys.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-bg-side px-8 py-4 rounded-[2rem] border border-divider-theme shadow-2xl">
                    <div className="h-3 w-3 bg-brand-primary rounded-full animate-pulse" />
                    <span className="font-black text-sm uppercase tracking-tight text-text-main">{surveys.length} {t('common.active')}</span>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-8 rounded-[3rem] flex items-center gap-6 text-red-600 dark:text-red-400 shadow-2xl">
                    <AlertCircle size={32} />
                    <div className="flex-1">
                        <p className="font-black uppercase tracking-tight">{t('common.error')}</p>
                        <p className="text-sm font-medium opacity-80">{error}</p>
                    </div>
                    <button onClick={fetchSurveys} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase hover:scale-105 transition shadow-lg shadow-red-600/20">{t('common.retry')}</button>
                </div>
            )}

            <section className="space-y-12">
                <div className="flex items-center gap-4 px-4">
                    <div className="bg-brand-primary p-3 rounded-2xl shadow-xl text-text-inv rotate-[-5deg]">
                        <TrendingUp size={24} />
                    </div>
                    <h2 className="text-4xl font-black text-text-main uppercase tracking-tighter italic">{t('surveys.hot')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {surveys.length > 0 ? surveys.map((survey) => (
                        <SurveyCard
                            key={survey.id}
                            survey={survey}
                            onClick={() => setSelectedSurvey(survey)}
                        />
                    )) : (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-bg-side rounded-[4rem] border-4 border-dashed border-divider-theme opacity-50">
                            <BarChart3 className="text-text-muted mb-6" size={80} />
                            <p className="text-2xl font-black uppercase italic tracking-widest text-text-muted">{t('surveys.noActiveSurveys')}</p>
                        </div>
                    )}
                </div>
            </section>

            {selectedSurvey && (
                <SurveyVotingModal
                    survey={selectedSurvey}
                    onClose={() => setSelectedSurvey(null)}
                    onVote={handleVote}
                    isVoting={votingId}
                />
            )}
        </div>
    );
}
