import { useState, useEffect } from 'react';
import {
    X, Download, Users, BarChart3, ListOrdered,
    ChevronRight, ArrowLeft, Star, Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SurveyAdminService } from '../../services/SurveyAdminService';
import { getAvatarSource } from '../../config/avatars';
import type { AdminSurvey, SurveyAnalytics, SurveyResponseDetail, SurveyQuestion } from '../../types/survey';

interface SurveyAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    survey: (AdminSurvey & { questions: SurveyQuestion[] }) | null;
}

export function SurveyAnalyticsModal({ isOpen, onClose, survey }: SurveyAnalyticsModalProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'stats' | 'responses'>('stats');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<SurveyAnalytics | null>(null);
    const [responses, setResponses] = useState<SurveyResponseDetail[]>([]);
    const [selectedResponse, setSelectedResponse] = useState<SurveyResponseDetail | null>(null);

    useEffect(() => {
        if (isOpen && survey) {
            if (activeTab === 'stats' && !stats) {
                loadStats();
            } else if (activeTab === 'responses' && responses.length === 0) {
                loadResponses();
            }
        }
    }, [isOpen, survey, activeTab]);

    const loadStats = async () => {
        if (!survey) return;
        setLoading(true);
        const { data, error } = await SurveyAdminService.getSurveyStats(survey.id);
        if (error) {
            alert('Error al cargar estadísticas');
        } else if (data) {
            setStats(data);
        }
        setLoading(false);
    };

    const loadResponses = async () => {
        if (!survey) return;
        setLoading(true);
        const { data, error } = await SurveyAdminService.getSurveyResponses(survey.id, 50, 0);
        if (error) {
            alert('Error al cargar respuestas');
        } else if (data) {
            setResponses(data);
        }
        setLoading(false);
    };

    const handleExport = async () => {
        if (!survey) return;

        try {
            setLoading(true);
            const { data, error } = await SurveyAdminService.getAllSurveyResponses(survey.id);

            if (error || !data) {
                alert('Error al exportar datos');
                setLoading(false);
                return;
            }

            if (data.length === 0) {
                alert('No hay respuestas para exportar');
                setLoading(false);
                return;
            }

            // Generate CSV
            const BOM = '\uFEFF';
            const questionHeaders = survey.questions.map(q => `"${q.text.replace(/"/g, '""')}"`).join(',');
            const csvHeader = `"Usuario","Fecha",${questionHeaders}\n`;

            const csvRows = data.map(item => {
                const answers = survey.questions.map(q => {
                    const ans = item.answers[q.id];
                    let val = '';
                    if (Array.isArray(ans)) val = ans.join('; ');
                    else if (ans !== null && ans !== undefined) val = String(ans);
                    return `"${val.replace(/"/g, '""')}"`;
                }).join(',');

                const date = new Date(item.created_at).toLocaleString();
                const user = item.username || 'Anónimo';
                return `"${user.replace(/"/g, '""')}","${date}",${answers}`;
            }).join('\n');

            const csvContent = BOM + csvHeader + csvRows;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `survey_results_${survey.title.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Export error:', error);
            alert('Error al exportar');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !survey) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-bg-side w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-border-theme relative slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-theme bg-bg-pop">
                    <div>
                        <h2 className="text-xl font-black text-text-main flex items-center gap-2">
                            <BarChart3 className="text-amber-500" /> {t('adminSurveys.analytics.title')}
                        </h2>
                        <p className="text-sm text-text-muted font-bold">{survey.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExport} className="p-2.5 text-text-muted hover:text-brand-primary rounded-xl hover:bg-bg-side transition" title={t('adminSurveys.analytics.exportHint')}>
                            <Download size={22} />
                        </button>
                        <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main rounded-full hover:bg-bg-side transition">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-theme bg-bg-pop">
                    <button
                        onClick={() => { setActiveTab('stats'); setSelectedResponse(null); }}
                        className={`flex-1 py-4 font-bold text-sm transition-colors relative ${activeTab === 'stats' ? 'text-amber-500' : 'text-text-muted hover:text-text-main'}`}
                    >
                        {t('adminSurveys.analytics.statsTab')}
                        {activeTab === 'stats' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('responses')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors relative ${activeTab === 'responses' ? 'text-amber-500' : 'text-text-muted hover:text-text-main'}`}
                    >
                        {t('adminSurveys.analytics.responsesTab')}
                        {activeTab === 'responses' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-bg-side">
                    {loading && !selectedResponse ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-amber-500" size={40} />
                            <p className="text-text-muted font-bold">{t('adminSurveys.analytics.loading')}</p>
                        </div>
                    ) : selectedResponse ? (
                        <div className="p-6">
                            <button onClick={() => setSelectedResponse(null)} className="flex items-center gap-2 text-text-muted hover:text-text-main font-bold mb-6 transition">
                                <ArrowLeft size={20} /> {t('adminSurveys.analytics.backToList')}
                            </button>

                            <div className="bg-bg-pop border border-border-theme rounded-2xl overflow-hidden mb-6">
                                <div className="p-4 bg-bg-side border-b border-border-theme flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-bg-pop border-2 border-border-theme flex items-center justify-center overflow-hidden shadow-sm">
                                        <img
                                            src={getAvatarSource(selectedResponse.avatar_url)}
                                            alt={selectedResponse.username}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-text-main text-lg">{selectedResponse.username || t('adminSurveys.analytics.anonymous')}</h3>
                                        <p className="text-xs text-text-muted font-bold tracking-tight">{new Date(selectedResponse.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    {survey.questions.map((q, i) => {
                                        const answer = selectedResponse.answers[q.id];
                                        return (
                                            <div key={q.id} className="space-y-2">
                                                <p className="text-sm font-bold text-text-sub">{i + 1}. {q.text}</p>
                                                <div className="bg-bg-side p-4 rounded-xl border border-border-theme">
                                                    <p className="text-text-main">
                                                        {Array.isArray(answer) ? answer.join(', ') : (answer || <span className="text-text-muted italic">{t('adminSurveys.analytics.noAnswer')}</span>)}
                                                        {q.type === 'rating' && answer && <span className="ml-2 text-amber-500">★</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'stats' ? (
                        <div className="p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex items-center gap-4">
                                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-text-main">{survey.response_count}</p>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('adminSurveys.analytics.totalResponses')}</p>
                                    </div>
                                </div>
                                <div className="bg-bg-pop border border-border-theme rounded-2xl p-4 flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                                        <ListOrdered size={24} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-text-main">{survey.questions.length}</p>
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">{t('adminSurveys.analytics.questions')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Question Progressions */}
                            {survey.questions.map((q, i) => {
                                const qStats = stats?.[q.id];
                                if (!qStats) return null;

                                return (
                                    <div key={q.id} className="bg-bg-pop border border-border-theme rounded-2xl p-6 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <span className="text-xs font-black text-amber-500 uppercase tracking-tighter">{t('adminSurveys.analytics.questionPrefix')} {i + 1}</span>
                                                <h4 className="font-bold text-text-main leading-tight">{q.text}</h4>
                                            </div>
                                            <span className="px-2 py-1 bg-bg-side border border-border-theme rounded text-[10px] font-black uppercase text-text-muted">
                                                {q.type}
                                            </span>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            {(q.type === 'single_choice' || q.type === 'multiple_choice') && q.options?.map((opt) => {
                                                const count = qStats.counts?.[opt] || 0;
                                                const total = Object.values(qStats.counts || {}).reduce((a, b) => a + (b as number), 0);
                                                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                                                return (
                                                    <div key={opt} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-text-sub font-medium">{opt}</span>
                                                            <span className="text-text-main font-bold">{count} ({percentage}%)</span>
                                                        </div>
                                                        <div className="h-2 bg-bg-side rounded-full overflow-hidden border border-border-theme/50">
                                                            <div
                                                                className="h-full bg-amber-500 transition-all duration-500"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {q.type === 'rating' && (
                                                <div className="flex items-center justify-center py-4 bg-bg-side rounded-xl border border-border-theme">
                                                    <div className="text-center">
                                                        <p className="text-4xl font-black text-text-main leading-none mb-1">{qStats.average || 0}</p>
                                                        <div className="flex justify-center mb-1">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} size={16} fill={s <= Math.round(qStats.average || 0) ? "#f59e0b" : "none"} className={s <= Math.round(qStats.average || 0) ? "text-amber-500" : "text-text-muted"} />
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-text-muted font-bold">{t('adminSurveys.analytics.averageRating')}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {q.type === 'text' && (
                                                <div className="space-y-2">
                                                    <p className="text-xs text-text-muted font-bold mb-2 uppercase">{t('adminSurveys.analytics.latestResponses')}</p>
                                                    {qStats.samples?.map((sample, idx) => (
                                                        <div key={idx} className="bg-bg-side p-3 rounded-lg border border-border-theme text-sm text-text-main italic">
                                                            "{sample}"
                                                        </div>
                                                    ))}
                                                    {!qStats.samples?.length && <p className="text-sm text-text-muted italic">{t('adminSurveys.analytics.noResponses')}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="divide-y divide-border-theme">
                            {responses.map((resp) => (
                                <button
                                    key={resp.id}
                                    onClick={() => setSelectedResponse(resp)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-bg-pop transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-bg-pop border-2 border-border-theme flex items-center justify-center overflow-hidden shadow-sm">
                                            <img
                                                src={getAvatarSource(resp.avatar_url)}
                                                alt={resp.username}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-text-main leading-tight">{resp.username || t('adminSurveys.analytics.anonymous')}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase">{new Date(resp.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-text-muted group-hover:text-amber-500 transition-colors" />
                                </button>
                            ))}
                            {responses.length === 0 && (
                                <div className="p-20 text-center">
                                    <Users className="mx-auto text-text-muted opacity-20 mb-4" size={64} />
                                    <p className="text-text-muted font-bold">{t('adminSurveys.analytics.noResponses')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
