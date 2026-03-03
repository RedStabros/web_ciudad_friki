import { useState, useEffect } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Copy, Share2, Loader2, Star, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { UserService, type Transaction } from '../services/UserService';
import { useTranslation } from 'react-i18next';

export default function WalletModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
    const { t } = useTranslation();
    const [wallet, setWallet] = useState<{ id: string, balance: number, deposit_qr: string } | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(10);  // pagination
    const TX_PAGE = 10;

    useEffect(() => {
        if (isOpen && userId) {
            fetchWalletData();
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
            navigator.clipboard.writeText(`FRIKI:${wallet.deposit_qr}`);
            alert(t('common.copied'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in backdrop-blur-md transition-all">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-bg-pop shadow-2xl rounded-[3rem] overflow-hidden flex flex-col border border-border-theme animate-in zoom-in duration-500 max-h-[90vh]">
                <header className="p-8 pb-4 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Wallet size={24} />
                            <span className="font-extrabold uppercase tracking-[0.2em] text-sm text-text-main">{t('wallet.title')}</span>
                        </div>
                        <h2 className="text-3xl font-black italic text-text-main tracking-tighter uppercase leading-none">Frikicoins</h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-bg-sub rounded-2xl transition-all shadow-md active:scale-95 text-text-muted">
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                            <Loader2 className="animate-spin text-brand-primary" size={48} />
                            <p className="font-black text-xs uppercase tracking-widest text-text-muted">{t('wallet.syncing')}</p>
                        </div>
                    ) : (
                        <>
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
                                    <div className="flex gap-4 w-full">
                                        <button onClick={copyQR} className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 py-4 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-1 group">
                                            <Copy size={20} className="group-hover:text-brand-secondary group-hover:scale-110 transition-all text-text-muted" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{t('common.copy')} QR</span>
                                        </button>
                                        <button className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 py-4 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-1 group">
                                            <Share2 size={20} className="group-hover:text-brand-primary group-hover:scale-110 transition-all text-text-muted" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{t('common.share')}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* QR Section */}
                            <div className="bg-bg-sub border-2 border-dashed border-border-theme rounded-[2rem] p-8 flex flex-col items-center text-center">
                                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-6">{t('wallet.transactionalId')}</p>
                                <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-brand-primary/20 hover:border-brand-primary transition-all duration-500 group">
                                    {wallet?.deposit_qr ? (
                                        <img
                                            alt="Deposit QR"
                                            className="w-48 h-48 mix-blend-multiply group-hover:scale-[1.05] transition-transform duration-500"
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=FRIKI:${wallet.deposit_qr}`}
                                        />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center bg-bg-sub text-text-muted">{t('common.loading')}</div>
                                    )}
                                </div>
                                <p className="mt-8 font-mono text-xs font-black text-brand-primary opacity-60 break-all max-w-[80%] uppercase tracking-tighter">FRIKI:{wallet?.deposit_qr}</p>
                            </div>

                            {/* Transactions History */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-border-theme pb-4">
                                    <h3 className="text-xl font-black uppercase text-text-main italic tracking-tighter">{t('wallet.history')}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">{transactions.length} {t('wallet.records')}</span>
                                </div>

                                <div className="space-y-4">
                                    {transactions.length > 0 ? transactions.slice(0, visibleCount).map((tx) => {
                                        const isReceived = tx.to_user === userId;
                                        return (
                                            <div key={tx.id} className="group relative flex items-center justify-between p-5 rounded-2xl bg-bg-side border border-border-theme hover:border-brand-primary/30 transition-all cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm
                                                        ${isReceived ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                                                        {isReceived ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-text-main text-base leading-tight truncate">
                                                            {tx.description || (isReceived ? t('wallet.received') : t('wallet.sent'))}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isReceived ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                                                                {tx.type || (isReceived ? t('wallet.income') : t('wallet.expense'))}
                                                            </span>
                                                            <p className="text-[10px] font-bold text-text-muted">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-lg italic tracking-tighter ${isReceived ? 'text-accent-green' : 'text-accent-red'}`}>
                                                        {isReceived ? '+' : '-'}{tx.amount.toLocaleString('es-CO')}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <CheckCircle2 size={12} className="text-brand-primary" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary">{t('wallet.completed')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center grayscale">
                                            <AlertCircle size={32} className="mb-2 text-text-muted" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{t('wallet.noActivity')}</p>
                                        </div>
                                    )}
                                    {/* Load more */}
                                    {transactions.length > visibleCount && (
                                        <button
                                            onClick={() => setVisibleCount(c => c + TX_PAGE)}
                                            className="w-full py-3 text-xs font-black uppercase tracking-widest text-brand-primary border border-brand-primary/20 rounded-2xl hover:bg-brand-primary/5 transition"
                                        >
                                            {t('tavern.loadMore', 'Ver más')} ({transactions.length - visibleCount} {t('wallet.records', 'restantes').toLowerCase()})
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <footer className="p-8 border-t border-border-theme bg-bg-sub/50 flex flex-col items-center">
                    <p className="text-[8px] font-medium text-text-muted uppercase tracking-tighter max-w-[80%] text-center">{t('wallet.infoDisclaimer')}</p>
                </footer>
            </div>
        </div>
    );
}
