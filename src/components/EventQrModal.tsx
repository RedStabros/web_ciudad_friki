import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Ticket, X, Loader2, Download, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface EventCode {
    id: string;
    code: string;
    description: string;
    valid_from: string;
}

interface EventQrModalProps {
    event: { id: string; title: string; qr_reward_amount?: number };
    onClose: () => void;
}

export function EventQrModal({ event, onClose }: EventQrModalProps) {
    const { t } = useTranslation();
    const [codes, setCodes] = useState<EventCode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCodes = async () => {
            setLoading(true);
            try {
                // Fetch codes for this event. 
                // Wait, if it's an old event, they might not have event_codes generated yet, 
                // in which case the default fallback is `ciudadfriki://event-reward/${event.id}`.
                const { data, error } = await supabase
                    .from('event_codes')
                    .select('*')
                    .eq('event_id', event.id)
                    .order('valid_from', { ascending: true });
                
                if (error) throw error;

                if (data && data.length > 0) {
                    setCodes(data);
                } else {
                    // Fallback to legacy single QR mode if no codes in DB
                    setCodes([{
                        id: 'legacy',
                        code: event.id, // Mobile app parses legacy format if length is small, but let's just construct the full URL
                        description: t('events.qrModal.legacyDesc'),
                        valid_from: ''
                    }]);
                }
            } catch (err) {
                console.error("Failed to fetch event codes", err);
            } finally {
                setLoading(false);
            }
        };

        if (event) {
            fetchCodes();
        }
    }, [event]);

    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const handleDownloadTicketPng = async (cardId: string, filename: string) => {
        const node = document.getElementById(cardId);
        if (!node) return;
        setDownloadingId(cardId);
        try {
            const dataUrl = await toPng(node, {
                quality: 0.98,
                pixelRatio: 2,
                backgroundColor: '#181d27'
            });
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Error exporting ticket as PNG:', err);
            alert('No se pudo generar la imagen del boleto');
        } finally {
            setDownloadingId(null);
        }
    };

    const renderCard = (codeItem: EventCode) => {
        // Fallback value for legacy events vs new generated event codes
        const qrValue = codeItem.id === 'legacy' 
            ? `ciudadfriki://event-reward/${event.id}` 
            : `ciudadfriki://event-reward/${codeItem.code}`;

        // Local Colombia/Browser date check (avoids UTC shift after 7 PM)
        const now = new Date();
        const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let isTodayActive = false;
        if (codeItem.valid_from) {
            const vfDate = new Date(codeItem.valid_from);
            const vfLocalStr = `${vfDate.getFullYear()}-${String(vfDate.getMonth() + 1).padStart(2, '0')}-${String(vfDate.getDate()).padStart(2, '0')}`;
            isTodayActive = vfLocalStr === todayLocalStr || codeItem.valid_from.startsWith(todayLocalStr);
        }

        const isChallenge = codeItem.description && (
            codeItem.description.toLowerCase().includes('reto') ||
            codeItem.description.toLowerCase().includes('dinám') ||
            codeItem.description.toLowerCase().includes('dinam')
        );

        const cardElementId = `ticket-pass-${codeItem.id}`;
        const passHeader = isChallenge ? 'CIUDAD FRIKI • RETO / DINÁMICA' : 'CIUDAD FRIKI • EVENT PASS';
        const passColor = isChallenge ? 'bg-purple-600' : 'bg-brand-primary';

        return (
            <div key={codeItem.id} className="w-full max-w-sm mb-6 flex flex-col items-center">
                {isTodayActive && (
                    <div className="mb-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <span>{t('events.qrModal.activeToday', '🟢 ACTIVO HOY')}</span>
                    </div>
                )}
                {/* Exportable Ticket Card (Consistent credential styling across all themes) */}
                <div
                    id={cardElementId}
                    className={`w-full bg-[#181d27] border ${isTodayActive ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-gray-700/80'} rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden`}
                >
                    {/* Top Pass Category Bar */}
                    <div className={`w-full py-1.5 px-3 rounded-xl ${passColor} text-white font-black text-[10px] tracking-widest uppercase mb-4 flex items-center justify-center gap-1.5 shadow-md`}>
                        <Sparkles size={12} />
                        <span>{passHeader}</span>
                    </div>

                    <div className="bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] px-3.5 py-1 rounded-full shadow-md flex items-center gap-1 mb-2">
                        <Ticket size={12} /> {event.qr_reward_amount || 10} FC
                    </div>
                    
                    <h3 className="font-black text-white text-xl mt-1 mb-1">{event.title}</h3>
                    <p className="text-amber-400 font-bold text-xs mb-4">
                        {codeItem.description ? codeItem.description.replace('Dia', 'Día') : t('events.qrModal.defaultDesc', 'Asistencia Oficial')}
                    </p>

                    <div className="bg-white p-4 rounded-2xl mb-4 shadow-inner flex justify-center">
                        <QRCodeSVG 
                            value={qrValue} 
                            size={190}
                            level="H"
                            fgColor="#111827"
                        />
                    </div>

                    <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                        Escanea con la app oficial Ciudad Friki
                    </p>
                </div>

                {/* Actions Below Ticket (not included in PNG) */}
                <div className="flex gap-2 w-full mt-3">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(qrValue);
                            alert(t('events.qrModal.copied', '¡Enlace copiado!'));
                        }}
                        className="flex-1 flex justify-center items-center gap-2 text-text-muted hover:text-brand-primary bg-bg-sub py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                        <Copy size={15} /> {t('events.qrModal.copyLink', 'Copiar Enlace')}
                    </button>
                    <button
                        onClick={() => handleDownloadTicketPng(cardElementId, `Boleto_${event.title.replace(/\s+/g, '_')}`)}
                        disabled={downloadingId === cardElementId}
                        className="flex-1 flex justify-center items-center gap-2 text-text-inv bg-brand-primary hover:bg-brand-primary-light py-2.5 rounded-xl font-black text-xs transition shadow-md shadow-brand-primary/20 cursor-pointer disabled:opacity-50"
                    >
                        {downloadingId === cardElementId ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        <span>{t('events.downloadPng', 'Descargar PNG')}</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[300] flex flex-col items-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto pt-20 pb-10">
            <button 
                onClick={onClose}
                className="fixed top-6 right-6 p-2 rounded-full bg-bg-side/50 hover:bg-bg-side border border-border-theme transition z-[310] text-text-main shadow-xl"
            >
                <X size={24} />
            </button>
            
            <div className="w-full max-w-md flex flex-col items-center">
                <h2 className="text-2xl font-black text-text-main mb-2 tracking-tight">{t('events.qrModal.title')}</h2>
                <p className="text-text-muted text-sm text-center mb-8 px-4">
                    {t('events.qrModal.subtitle')}
                    {codes.length > 1 && t('events.qrModal.multiDayHint')}
                </p>

                {loading ? (
                    <div className="flex flex-col items-center p-10 gap-4">
                        <Loader2 size={40} className="animate-spin text-brand-primary" />
                        <span className="text-text-muted font-medium">{t('events.qrModal.generating')}</span>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center gap-4">
                        {codes.map(renderCard)}
                    </div>
                )}
            </div>
        </div>
    );
}
