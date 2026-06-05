import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    XCircle, Loader2, History, ShieldAlert, Mail, User, 
    Clock, Copy, Ban, CheckCircle, Smartphone, MapPin, QrCode
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

interface UserAuditModalProps {
    visible: boolean;
    onClose: () => void;
    userId: string | null;
    username: string;
    isSuperAdmin?: boolean;
}

export default function UserAuditModal({ visible, onClose, userId, username, isSuperAdmin = false }: UserAuditModalProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (visible && userId) {
            fetchUserData();
        }
    }, [visible, userId]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // Fetch User Profile and Wallet using RPC
            const { data: auditData, error: auditError } = await supabase
                .rpc('get_user_audit_info_v2', { p_user_id: userId });

            if (auditError) {
                console.error('Error fetching audit info:', auditError);
            } else {
                setUserInfo(auditData);
            }

            // Fetch Transactions using RPC
            const { data: txData, error: txError } = await supabase
                .rpc('get_user_audit_transactions', { p_user_id: userId });

            if (txError) {
                console.error('Error fetching audit transactions:', txError);
            } else {
                setTransactions(txData || []);
            }
        } catch (error) {
            console.error('Error in fetchUserData:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-CO', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleCopyQR = async () => {
        if (!userInfo?.deposit_qr) return;
        const textToCopy = userInfo.deposit_qr.startsWith('FRIKI:') ? userInfo.deposit_qr : `FRIKI:${userInfo.deposit_qr}`;
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (!visible) return null;

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div 
                className="bg-bg-pop w-full max-w-2xl rounded-3xl border border-border-theme shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-border-theme bg-bg-side flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-xl">
                            <History size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-main leading-tight">
                                {t('adminTools.auditTitle', 'Auditoría de Usuario')}
                            </h2>
                            <p className="text-sm text-brand-primary font-bold">@{username}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-bg-sub rounded-xl transition-colors text-text-muted hover:text-text-main"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-brand-primary">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="font-black animate-pulse">{t('common.loading', 'Cargando datos...')}</p>
                        </div>
                    ) : (
                        <>
                            {/* User Info Card */}
                            {userInfo && (
                                <div className="bg-bg-side border border-border-theme rounded-2xl p-5 space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-8 -mt-8"></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                        <div className="flex items-center gap-2.5 text-sm">
                                            <User size={16} className="text-text-muted" />
                                            <span className="text-text-muted font-medium">Username:</span>
                                            <span className="text-text-main font-bold">@{userInfo.username || username}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm">
                                            <Mail size={16} className="text-text-muted animate-pulse" />
                                            <span className="text-text-muted font-medium">Email:</span>
                                            <span className="text-text-main font-bold truncate">{userInfo.email || 'No disponible'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm">
                                            <ShieldAlert size={16} className="text-text-muted" />
                                            <span className="text-text-muted font-medium">Rol:</span>
                                            <span className="bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                {userInfo.role || 'user'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm">
                                            <Clock size={16} className="text-text-muted" />
                                            <span className="text-text-muted font-medium">Registrado:</span>
                                            <span className="text-text-main font-bold">{userInfo.created_at ? formatDate(userInfo.created_at) : 'No disponible'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 text-sm col-span-1 md:col-span-2">
                                            {userInfo.is_banned ? (
                                                <div className="flex items-center gap-1.5 text-accent-red font-bold">
                                                    <Ban size={16} />
                                                    <span>Estado: Sancionado / Baneado 🚫</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-accent-green font-bold">
                                                    <CheckCircle size={16} />
                                                    <span>Estado: Activo / Limpio ✅</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Private SuperAdmin Info Section */}
                                    {isSuperAdmin && (
                                        <div className="border-t border-border-theme pt-4 mt-2 space-y-4">
                                            <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-widest">
                                                <ShieldAlert size={14} />
                                                <span>Datos Privados (Solo GM / Super Admin)</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pl-1">
                                                {userInfo.full_name && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-text-muted font-bold">Nombre Real:</span>
                                                        <span className="text-text-main font-bold">{userInfo.full_name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Smartphone size={14} className="text-text-muted" />
                                                    <span className="text-text-muted font-bold">Celular:</span>
                                                    <span className="text-text-main font-bold">{userInfo.phone || 'No registrado'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs col-span-1 md:col-span-2">
                                                    <MapPin size={14} className="text-text-muted" />
                                                    <span className="text-text-muted font-bold">Ciudad:</span>
                                                    <span className="text-text-main font-bold">{userInfo.city || 'No registrada'}{userInfo.country ? `, ${userInfo.country}` : ''}</span>
                                                </div>
                                            </div>

                                            {/* Disbursement QR Code */}
                                            {userInfo.deposit_qr ? (
                                                <div className="flex flex-col items-center justify-center pt-3 border-t border-border-theme/50">
                                                    <span className="text-xs font-black text-brand-primary flex items-center gap-1.5 uppercase tracking-wider mb-2">
                                                        <QrCode size={14} /> Código QR de Desembolso
                                                    </span>
                                                    <div className="p-3 bg-white rounded-2xl shadow-md border border-border-theme">
                                                        <QRCodeSVG 
                                                            value={userInfo.deposit_qr.startsWith('FRIKI:') ? userInfo.deposit_qr : `FRIKI:${userInfo.deposit_qr}`}
                                                            size={130}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleCopyQR}
                                                        className="mt-3 flex items-center gap-2 px-4 py-2 bg-bg-pop border border-border-theme rounded-xl text-xs font-bold text-text-main hover:bg-bg-sub transition shadow-sm hover:border-brand-primary"
                                                    >
                                                        {copied ? (
                                                            <>
                                                                <CheckCircle size={14} className="text-accent-green" />
                                                                <span className="text-accent-green">¡Copiado!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy size={14} />
                                                                <span>Copiar Código QR</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-2 text-xs text-text-muted italic border-t border-border-theme/50 pt-3">
                                                    Usuario no ha registrado código QR de desembolso.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transactions History */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-black text-text-muted uppercase tracking-wider">
                                    Últimos 50 Movimientos / Transacciones
                                </h3>

                                {transactions.length === 0 ? (
                                    <div className="text-center py-10 bg-bg-side rounded-2xl border border-dashed border-border-theme text-text-muted italic text-xs">
                                        No se encontraron transacciones registradas para este usuario.
                                    </div>
                                ) : (
                                    <div className="border border-border-theme rounded-2xl overflow-hidden divide-y divide-border-theme bg-bg-side">
                                        {transactions.map((tx: any) => {
                                            const isSender = tx.from_user === userId;
                                            const txColor = isSender ? 'text-accent-red' : 'text-accent-green';
                                            const txSign = isSender ? '-' : '+';
                                            const otherParty = isSender ? tx.to_username : tx.from_username;

                                            return (
                                                <div key={tx.id} className="p-3.5 hover:bg-bg-pop/50 transition-colors flex items-center justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black uppercase text-text-main">
                                                                {tx.type}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">
                                                                {formatDate(tx.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-text-muted truncate mt-0.5">
                                                            {tx.description || (isSender ? `A: @${otherParty || 'Sistema'}` : `De: @${otherParty || 'Sistema'}`)}
                                                        </p>
                                                    </div>
                                                    <div className={`text-right font-black tabular-nums whitespace-nowrap text-sm ${txColor}`}>
                                                        {txSign}{tx.amount.toLocaleString()} ₣
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-bg-side border-t border-border-theme flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-brand-primary text-text-inv text-sm font-black rounded-xl hover:bg-brand-primary-light transition shadow-lg shadow-brand-primary/20"
                    >
                        {t('common.close', 'Cerrar')}
                    </button>
                </div>
            </div>
        </div>
    );
}
