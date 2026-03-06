import { useState, useEffect } from 'react';
import {
    ShieldAlert, CheckCircle2, XCircle, FileText, MessageSquare,
    Settings, Loader2, Beer, AlertTriangle
} from 'lucide-react';
import { TavernAdminService } from '../../services/TavernAdminService';
import type { PendingReviewItem } from '../../services/TavernAdminService';
import { useAuth } from '../../context/AuthContext';

export default function AdminTavern() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<'pending' | 'settings'>('pending');
    const [pendingItems, setPendingItems] = useState<PendingReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [tavernEnabled, setTavernEnabled] = useState(true);
    const [savingSetting, setSavingSetting] = useState(false);

    useEffect(() => {
        if (user) {
            loadPendingReviews();
            loadSettings();
        }
    }, [user]);

    const loadPendingReviews = async () => {
        setLoading(true);
        const data = await TavernAdminService.getPendingReviews();
        setPendingItems(data);
        setLoading(false);
    };

    const loadSettings = async () => {
        const enabled = await TavernAdminService.getGlobalSetting('tavern_enabled');
        setTavernEnabled(enabled);
    };

    const toggleGlobalTavernStatus = async () => {
        setSavingSetting(true);
        const newVal = !tavernEnabled;
        const { error } = await TavernAdminService.toggleGlobalSetting('tavern_enabled', newVal);
        if (error) {
            alert('Error actualizando estado de La Taberna');
        } else {
            setTavernEnabled(newVal);
        }
        setSavingSetting(false);
    };

    const processItem = async (id: string, type: 'thread' | 'reply', approve: boolean) => {
        setProcessingId(id);
        const { error } = await TavernAdminService.processReview(id, type, approve);
        if (error) {
            alert('No se pudo procesar: ' + error.message);
        } else {
            setPendingItems(prev => prev.filter(item => item.id !== id));
        }
        setProcessingId(null);
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 text-amber-500 p-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight">Admin: La Taberna</h1>
                        <p className="text-sm text-amber-500 font-bold">Moderación de posts reportados y ajustes globales</p>
                    </div>
                </div>
            </div>

            {/* Tabbed Navigation */}
            <div className="flex items-center gap-2 border-b border-border-theme bg-bg-pop rounded-t-2xl px-2 pt-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                        }`}
                >
                    <AlertTriangle size={18} /> Cola de AutoMod {pendingItems.length > 0 && `(${pendingItems.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-3 text-sm font-black border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'settings' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main hover:bg-bg-side/50 rounded-t-xl'
                        }`}
                >
                    <Settings size={18} /> Ajustes Globales 🔒
                </button>
            </div>

            {/* List */}
            <div className="bg-bg-pop border border-t-0 border-border-theme rounded-b-2xl p-4 sm:p-6 shadow-sm min-h-[400px]">
                {activeTab === 'pending' ? (
                    loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                            <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
                            <p className="font-bold">Buscando reportes...</p>
                        </div>
                    ) : pendingItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center">
                            <CheckCircle2 className="text-accent-green mb-4 opacity-50" size={48} />
                            <p className="font-bold text-text-main text-lg mb-1">Todo limpio y en orden</p>
                            <p className="text-sm max-w-sm mb-4">No hay publicaciones ocultas esperando revisión por AutoMod.</p>
                            <button onClick={loadPendingReviews} className="text-amber-500 hover:underline font-bold text-sm">Actualizar cola</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {pendingItems.map(item => (
                                <div key={item.id} className="bg-bg-side border border-border-theme hover:border-amber-500/50 transition-colors rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12"></div>

                                    <div className="flex justify-between items-start z-10">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase text-white flex items-center gap-1 ${item.type === 'thread' ? 'bg-brand-primary' : 'bg-brand-secondary'}`}>
                                                {item.type === 'thread' ? <FileText size={10} /> : <MessageSquare size={10} />}
                                                {item.type === 'thread' ? 'Hilo' : 'Respuesta'}
                                            </span>
                                            <span className="text-xs text-text-muted font-bold">
                                                @{item.profiles?.username || 'Usuario'} • {formatDate(item.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 z-10 text-xs font-black">
                                        <div className="flex items-center gap-1 text-accent-red bg-accent-red/10 px-2 py-1 rounded-md border border-accent-red/20">
                                            <AlertTriangle size={12} /> {item.report_count} Reportes
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                                            {item.downvotes} Dislikes
                                        </div>
                                    </div>

                                    <div className="bg-bg-pop p-3 rounded-xl border border-border-theme z-10">
                                        {item.type === 'thread' && item.title && (
                                            <h3 className="font-black text-text-main mb-2 underline decoration-border-theme underline-offset-2">{item.title}</h3>
                                        )}
                                        <p className="text-sm text-text-secondary italic">"{item.content.replace(/<[^>]+>/g, '')}"</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-border-theme z-10">
                                        <button
                                            onClick={() => processItem(item.id, item.type, true)}
                                            disabled={processingId === item.id}
                                            className="px-3 py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-accent-green/10 text-accent-green hover:bg-accent-green hover:text-white border border-accent-green/30 transition disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={16} /> Restaurar Post
                                        </button>
                                        <button
                                            onClick={() => processItem(item.id, item.type, false)}
                                            disabled={processingId === item.id}
                                            className="px-3 py-2 flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white border border-accent-red/30 transition disabled:opacity-50"
                                        >
                                            <XCircle size={16} /> Mantener Oculto
                                        </button>
                                    </div>
                                    {processingId === item.id && (
                                        <div className="absolute inset-0 bg-bg-side/80 backdrop-blur-sm z-20 flex pt-16 items-start justify-center">
                                            <Loader2 className="animate-spin text-amber-500" size={32} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="max-w-2xl">
                        <h2 className="text-xl font-black text-text-main mb-6 flex items-center gap-2">
                            <Settings size={20} className="text-amber-500" /> Preferencias Globales
                        </h2>

                        <div className="bg-bg-side border border-border-theme rounded-2xl p-5 flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${tavernEnabled ? 'bg-amber-500/20 text-amber-500' : 'bg-border-theme text-text-muted'}`}>
                                        <Beer size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-main">Disponibilidad de "La Taberna"</h3>
                                        <p className="text-sm text-text-secondary mt-1 max-w-sm">Si apagas este interruptor, el foro social de La Taberna desaparecerá para todos los usuarios. Útil por mantenimiento o castigos comunitarios masivos.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-3">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={tavernEnabled}
                                        onChange={toggleGlobalTavernStatus}
                                        disabled={savingSetting}
                                    />
                                    <div className="w-14 h-7 bg-bg-pop border border-border-theme peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500">
                                    </div>
                                </label>
                            </div>
                            {savingSetting && <p className="text-xs text-brand-primary flex gap-1 items-center justify-end"><Loader2 className="animate-spin" size={12} /> Guardando...</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
