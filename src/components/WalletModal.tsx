import { useState, useEffect } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Copy, Loader2, Star, TrendingUp, AlertCircle, Send, History, Home as HomeIcon, Camera } from 'lucide-react';
import { UserService, type Transaction } from '../services/UserService';
import { useTranslation } from 'react-i18next';
import { WalletScanner } from './WalletScanner';

type Tab = 'main' | 'send' | 'history' | 'scan';

export default function WalletModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('main');

    // Core data
    const [wallet, setWallet] = useState<{ id: string, balance: number, deposit_qr: string } | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);
    const TX_PAGE = 10;

    // Send logic
    const [recipientQr, setRecipientQr] = useState('');
    const [amount, setAmount] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchWalletData();
            setActiveTab('main');
            setRecipientQr('');
            setAmount('');
        }
    }, [isOpen, userId]);

    const fetchWalletData = async () => {
        setIsLoading(true);
        try {
            const { wallet: walletRes, error: walletError } = await UserService.getWallet(userId);
            if (walletError) throw walletError;
            setWallet(walletRes);

            if (walletRes?.id) {
                const { transactions: txRes, error: txError } = await UserService.getTransactions(userId);
                if (txError) throw txError;
                setTransactions(txRes || []);
            }
        } catch (err: any) {
            console.error('Error fetching wallet:', err);
            setError(err.message || t('wallet.loadError'));
        } finally {
            setIsLoading(false);
        }
    };

    const copyQR = () => {
        if (wallet?.deposit_qr) {
            navigator.clipboard.writeText(wallet.deposit_qr);
            alert(t('common.copied'));
        }
    };

    const handleTransfer = async () => {
        const amountNum = parseInt(amount);
        if (!recipientQr || !amount || isNaN(amountNum) || amountNum <= 0) {
            alert(t('wallet.enterAmount', 'Por favor ingresa un código QR y un monto válido.'));
            return;
        }

        if (wallet && amountNum > wallet.balance) {
            alert(t('wallet.insufficientFunds', 'Fondos insuficientes.'));
            return;
        }

        if (confirm(t('wallet.confirmMessage', { amount: amountNum, recipient: recipientQr }))) {
            setSending(true);
            try {
                const { success, message, error } = await UserService.transferFrikicoins(userId, recipientQr, amountNum);
                if (success) {
                    alert(t('wallet.successTransfer', 'Transferencia exitosa.'));
                    setRecipientQr('');
                    setAmount('');
                    setActiveTab('main');
                    await fetchWalletData();
                } else {
                    alert(message || error || t('common.error'));
                }
            } catch (err: any) {
                console.error(err);
                alert(err.message || t('common.error'));
            } finally {
                setSending(false);
            }
        }
    };

    const processScannedData = async (data: string) => {
        if (data.startsWith('ASSIGN:') || data.startsWith('EVENT:')) {
            const isAssignment = data.startsWith('ASSIGN:');
            setIsLoading(true);
            setActiveTab('main'); // Switch to a loading view conceptually

            try {
                let response;
                if (isAssignment) {
                    response = await UserService.redeemAssignment(data.replace('ASSIGN:', ''), userId);
                } else {
                    response = await UserService.redeemEventCode(data.replace('EVENT:', ''), userId);
                }

                if (response.success) {
                    alert(t('wallet.event.redeemSuccess', { amount: response.amount }));
                    await fetchWalletData();
                    setActiveTab('history');
                } else {
                    alert(response.message || response.error || t('wallet.event.redeemError'));
                }
            } catch (error: any) {
                console.error('Redemption error:', error);
                alert(error.message || t('common.error'));
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Must start with FRIKI:
        if (data.startsWith('FRIKI:')) {
            setRecipientQr(data);
            setActiveTab('send');
        } else {
            alert(t('wallet.invalidQrCode', 'Código QR inválido. Debe comenzar con FRIKI:, ASSIGN:, o EVENT:'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in backdrop-blur-md transition-all">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-bg-pop shadow-2xl rounded-[3rem] overflow-hidden flex flex-col border border-border-theme animate-in zoom-in duration-500 max-h-[90vh]">

                {/* Header Navigation */}
                <header className="px-8 pt-8 pb-4 border-b border-border-theme bg-bg-pop sticky top-0 z-20">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <Wallet size={24} />
                                <span className="font-extrabold uppercase tracking-[0.2em] text-sm text-text-main">{t('wallet.title')}</span>
                            </div>
                            <h2 className="text-3xl font-black italic text-text-main tracking-tighter uppercase leading-none">Frikicoins</h2>
                        </div>
                        <button onClick={onClose} className="p-3 bg-bg-sub hover:bg-brand-primary/10 hover:text-brand-primary rounded-2xl transition-all shadow-md active:scale-95 text-text-muted">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex gap-2 p-1 bg-bg-sub/50 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('main')}
                            className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'main' ? 'bg-bg-pop shadow-sm text-brand-primary' : 'text-text-muted hover:text-text-main'}`}
                        >
                            <HomeIcon size={14} /> {t('wallet.tabs.main')}
                        </button>
                        <button
                            onClick={() => setActiveTab('send')}
                            className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'send' || activeTab === 'scan' ? 'bg-bg-pop shadow-sm text-brand-primary' : 'text-text-muted hover:text-text-main'}`}
                        >
                            <Send size={14} /> {t('wallet.tabs.send')}
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'history' ? 'bg-bg-pop shadow-sm text-brand-primary' : 'text-text-muted hover:text-text-main'}`}
                        >
                            <History size={14} /> {t('wallet.tabs.history')}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative">
                    {/* Scanner Overlay */}
                    {activeTab === 'scan' && (
                        <div className="absolute inset-0 z-50 bg-bg-main">
                            <WalletScanner
                                onClose={() => setActiveTab('send')}
                                onScan={(data) => processScannedData(data)}
                            />
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                            <Loader2 className="animate-spin text-brand-primary" size={48} />
                            <p className="font-black text-xs uppercase tracking-widest text-text-muted">{t('wallet.syncing')}</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'main' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    {/* Balance Card */}
                                    <div className="relative rounded-[2.5rem] bg-bg-tertiary overflow-hidden p-8 shadow-2xl border border-ui-border group">
                                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                                            <TrendingUp size={120} className="text-brand-secondary" />
                                        </div>
                                        <div className="relative z-10 flex flex-col items-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{t('wallet.totalAvailable')}</p>
                                            <div className="flex items-center gap-3 text-5xl md:text-6xl font-black italic text-brand-secondary tracking-tighter mb-8 drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                                <Star size={32} className="fill-brand-secondary" />
                                                {wallet?.balance.toLocaleString('es-CO') || '0'}
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                                <button onClick={() => setActiveTab('send')} className="flex-1 bg-brand-primary text-text-inv rounded-2xl border border-transparent py-4 hover:bg-brand-primary-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20">
                                                    <Send size={20} />
                                                    <span className="text-xs font-black uppercase tracking-widest">{t('wallet.send')}</span>
                                                </button>
                                                <button onClick={copyQR} className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 py-4 hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-text-main group">
                                                    <Copy size={20} className="group-hover:text-brand-primary transition-colors text-text-muted" />
                                                    <span className="text-xs font-black uppercase tracking-widest">{t('common.copy')} QR</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Section */}
                                    <div className="bg-bg-sub border-2 border-dashed border-border-theme rounded-[2.5rem] p-8 flex flex-col items-center text-center">
                                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-6">{t('wallet.transactionalId', 'Mi Identificador Transaccional')}</p>
                                        <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-brand-primary/20 hover:border-brand-primary transition-all duration-500 group">
                                            {wallet?.deposit_qr ? (
                                                <img
                                                    alt="Deposit QR"
                                                    className="w-48 h-48 group-hover:scale-[1.05] transition-transform duration-500"
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${wallet.deposit_qr}`}
                                                />
                                            ) : (
                                                <div className="w-48 h-48 flex items-center justify-center bg-bg-sub text-text-muted">{t('common.loading')}</div>
                                            )}
                                        </div>
                                        <div className="mt-8 flex flex-col items-center gap-2 w-full max-w-xs">
                                            <span className="font-mono text-xs font-black text-brand-primary bg-bg-side px-4 py-2 rounded-xl border border-border-theme select-all break-all w-full text-center uppercase tracking-tighter">
                                                {wallet?.deposit_qr}
                                            </span>
                                            <button 
                                                onClick={copyQR}
                                                className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-xl transition"
                                            >
                                                <Copy size={14} />
                                                {t('wallet.copyQrCode', 'Copiar Código')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'send' || activeTab === 'scan') && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <h3 className="text-xl font-black uppercase text-text-main italic tracking-tighter">{t('wallet.send', 'Enviar Frikicoins')}</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">{t('wallet.recipientQr', 'QR del Destinatario')}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={recipientQr}
                                                    onChange={e => setRecipientQr(e.target.value)}
                                                    placeholder="Ej: FRIKI:12345ABC"
                                                    className="flex-1 bg-bg-side border border-border-theme rounded-2xl px-4 py-4 text-text-main text-sm font-mono focus:outline-none focus:border-brand-primary transition-colors"
                                                />
                                                <button onClick={() => setActiveTab('scan')} className="w-14 rounded-2xl bg-bg-side border border-border-theme flex items-center justify-center text-text-muted hover:text-brand-primary transition-colors">
                                                    <Camera size={24} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 block">{t('wallet.amount', 'Cantidad')}</label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-bg-side border border-border-theme rounded-2xl px-4 py-4 text-text-main text-2xl font-black italic focus:outline-none focus:border-brand-primary transition-colors"
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleTransfer}
                                                disabled={sending}
                                                className={`w-full py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-sm
                                                    ${sending ? 'bg-bg-side text-text-muted cursor-not-allowed' : 'bg-brand-primary text-text-inv hover:bg-brand-primary-light shadow-lg shadow-brand-primary/20'}`}
                                            >
                                                {sending ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('wallet.confirmTransfer', 'Confirmar Envío')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center justify-between border-b border-border-theme pb-4">
                                        <h3 className="text-xl font-black uppercase text-text-main italic tracking-tighter">{t('wallet.history')}</h3>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">{transactions.length} {t('wallet.records')}</span>
                                    </div>

                                    <div className="space-y-4">
                                        {transactions.length > 0 ? transactions.slice(0, visibleCount).map((tx) => {
                                            const isReceived = tx.to_user === userId;
                                            const isP2P = tx.type === 'transfer' || tx.type === 'p2p' || (!tx.type && tx.from_user && tx.to_user);
                                            let descriptionText = tx.description;
                                            if (descriptionText) {
                                                // Display fix for Fix #14 (Encoding issue fallback)
                                                descriptionText = descriptionText.replace(/\bDia \b/g, 'Día ').replace(/\bdia \b/g, 'día ').replace(/ - Dia (\d+)/g, ' - Día $1');
                                            } else if (isP2P) {
                                                if (isReceived) {
                                                    descriptionText = t('wallet.receivedFrom', { username: tx.from_profile?.username ? `@${tx.from_profile.username}` : '@Usuario' });
                                                    if (!descriptionText || descriptionText.includes('wallet.receivedFrom')) {
                                                        descriptionText = `Recibido de ${tx.from_profile?.username ? `@${tx.from_profile.username}` : '@Usuario'}`;
                                                    }
                                                } else {
                                                    descriptionText = t('wallet.sentTo', { username: tx.to_profile?.username ? `@${tx.to_profile.username}` : '@Usuario' });
                                                    if (!descriptionText || descriptionText.includes('wallet.sentTo')) {
                                                        descriptionText = `Enviado a ${tx.to_profile?.username ? `@${tx.to_profile.username}` : '@Usuario'}`;
                                                    }
                                                }
                                            } else {
                                                descriptionText = isReceived ? t('wallet.received') : t('wallet.sent');
                                            }

                                            return (
                                                <div key={tx.id} className="group relative flex items-center justify-between p-5 rounded-2xl bg-bg-side border border-border-theme hover:border-brand-primary/30 transition-all cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm
                                                            ${isReceived ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                                                            {isReceived ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-black text-text-main text-base leading-tight break-words">
                                                                {descriptionText}
                                                            </h4>
                                                            <div className="flex items-start gap-2 mt-2 flex-wrap sm:flex-nowrap">
                                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0 ${isReceived ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                                                                    {tx.type || (isReceived ? t('wallet.income') : t('wallet.expense'))}
                                                                </span>
                                                                <p className="text-[10px] font-bold text-text-muted">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className={`font-black text-lg italic tracking-tighter ${isReceived ? 'text-accent-green' : 'text-accent-red'}`}>
                                                            {isReceived ? '+' : '-'}{tx.amount.toLocaleString('es-CO')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center grayscale">
                                                <AlertCircle size={32} className="mb-2 text-text-muted" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{t('wallet.noActivity')}</p>
                                            </div>
                                        )}
                                        {transactions.length > visibleCount && (
                                            <button
                                                onClick={() => setVisibleCount(c => c + TX_PAGE)}
                                                className="w-full py-4 text-xs font-black uppercase tracking-widest text-brand-primary border border-brand-primary/20 rounded-2xl hover:bg-brand-primary/5 transition"
                                            >
                                                {t('tavern.loadMore', 'Ver más')} ({transactions.length - visibleCount})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <footer className="p-6 border-t border-border-theme bg-bg-sub/50 flex flex-col items-center shrink-0">
                    <p className="text-[8px] font-medium text-text-muted uppercase tracking-tighter max-w-[90%] text-center">{t('wallet.infoDisclaimer', 'Protege tu código, Frikicoins no pueden ser reverts.')}</p>
                </footer>
            </div>
        </div>
    );
}
