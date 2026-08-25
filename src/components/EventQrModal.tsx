import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Ticket, X, Loader2 } from 'lucide-react';
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

    const renderCard = (codeItem: EventCode) => {
        // Fallback value for legacy events vs new generated event codes
        const qrValue = codeItem.id === 'legacy' 
            ? `ciudadfriki://event-reward/${event.id}` 
            : `ciudadfriki://event-reward/${codeItem.code}`;

        return (
            <div key={codeItem.id} className="bg-bg-side border border-border-theme rounded-2xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-lg mb-6 relative">
                <div className="absolute -top-4 bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Ticket size={12} /> {event.qr_reward_amount} FC
                </div>
                
                <h3 className="font-black text-text-main text-xl mt-2 mb-1">{event.title}</h3>
                <p className="text-brand-primary font-bold text-sm mb-4">
                    {codeItem.description ? codeItem.description.replace('Dia', 'Día') : t('events.qrModal.defaultDesc')}
                </p>

                <div className="bg-white p-4 rounded-2xl mb-6 shadow-inner w-full flex justify-center">
                    <QRCodeSVG 
                        value={qrValue} 
                        size={200}
                        level="H"
                        fgColor="#1e222a"
                    />
                </div>

                <div className="flex gap-2 w-full">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(qrValue);
                            alert(t('events.qrModal.copied'));
                        }}
                        className="flex-1 flex justify-center items-center gap-2 text-text-muted hover:text-brand-primary bg-bg-sub py-2.5 rounded-xl font-bold transition"
                    >
                        <Copy size={16} /> {t('events.qrModal.copyLink')}
                    </button>
                    {/* Placeholder for download, requires html2canvas logic if we want it fully working, but user asked for individual containers so they can screenshot */}
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
