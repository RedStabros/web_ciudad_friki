import { useState, useEffect } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Copy, Share2, Loader2, Star, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { UserService, type Transaction } from '../services/UserService';

export default function WalletModal({ isOpen, onClose, userId }: { isOpen: boolean, onClose: () => void, userId: string }) {
    const [wallet, setWallet] = useState<{ id: string, balance: number, deposit_qr: string } | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);

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

            // Fetch transactions if wallet exists
            if (walletRes?.id) {
                const { transactions: txRes, error: txError } = await UserService.getTransactions(userId);
                if (txError) throw txError;
                setTransactions(txRes || []);
            }
        } catch (err: any) {
            console.error('Error fetching wallet:', err);
            setError(err.message || 'Error al cargar billetera');
        } finally {
            setIsLoading(false);
        }
    };

    const copyQR = () => {
        if (wallet?.deposit_qr) {
            navigator.clipboard.writeText(`FRIKI:${wallet.deposit_qr}`);
            alert('Código copiado al portapapeles');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in backdrop-blur-md transition-all">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-surface-light dark:bg-card-dark shadow-2xl rounded-[3rem] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-500 max-h-[90vh]">
                <header className="p-8 pb-4 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Wallet size={24} />
                            <span className="font-extrabold uppercase tracking-[0.2em] text-sm">Mi Billetera</span>
                        </div>
                        <h2 className="text-3xl font-black italic dark:text-white tracking-tighter uppercase leading-none">Frikicoins</h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all shadow-md active:scale-95 text-slate-400">
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                            <Loader2 className="animate-spin text-primary" size={48} />
                            <p className="font-black text-xs uppercase tracking-widest text-slate-400">Sincronizando con el Banco Central Friki...</p>
                        </div>
                    ) : (
                        <>
                            {/* Balance Card */}
                            <div className="relative rounded-[2.5rem] bg-slate-900 overflow-hidden p-8 shadow-2xl border border-white/10 group">
                                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                                    <TrendingUp size={120} className="text-secondary" />
                                </div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Disponible</p>
                                    <div className="flex items-center gap-3 text-5xl md:text-6xl font-black italic text-secondary tracking-tighter mb-8 drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                        <Star size={32} className="fill-secondary" />
                                        {wallet?.balance.toLocaleString('es-CO') || '0'}
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <button onClick={copyQR} className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 py-4 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-1 group">
                                            <Copy size={20} className="group-hover:text-secondary group-hover:scale-110 transition-all" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Copiar QR</span>
                                        </button>
                                        <button className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 py-4 hover:bg-white/20 transition-all flex flex-col items-center justify-center gap-1 group">
                                            <Share2 size={20} className="group-hover:text-primary group-hover:scale-110 transition-all" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Compartir</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* QR Section */}
                            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center text-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Tu Identidad Transaccional</p>
                                <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-primary/20 hover:border-primary transition-all duration-500 group">
                                    {wallet?.deposit_qr ? (
                                        <img
                                            alt="Deposit QR"
                                            className="w-48 h-48 mix-blend-multiply group-hover:scale-[1.05] transition-transform duration-500"
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=FRIKI:${wallet.deposit_qr}`}
                                        />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400">Cargando</div>
                                    )}
                                </div>
                                <p className="mt-8 font-mono text-xs font-black text-primary opacity-60 break-all max-w-[80%] uppercase tracking-tighter">FRIKI:{wallet?.deposit_qr}</p>
                            </div>

                            {/* Transactions History */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                    <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white italic tracking-tighter">Historial de Operaciones</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{transactions.length} RÉCORDS</span>
                                </div>

                                <div className="space-y-4">
                                    {transactions.length > 0 ? transactions.map((tx) => {
                                        const isReceived = tx.to_user === userId;
                                        return (
                                            <div key={tx.id} className="group relative flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-all cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm
                                                        ${isReceived ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {isReceived ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-black text-slate-900 dark:text-white text-base leading-tight truncate">
                                                            {tx.description || (isReceived ? 'Frikicoins recibidos' : 'Transferencia enviada')}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isReceived ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                {tx.type || (isReceived ? 'INGRESO' : 'EGRESO')}
                                                            </span>
                                                            <p className="text-[10px] font-bold text-slate-400">{new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-lg italic tracking-tighter ${isReceived ? 'text-green-500' : 'text-red-500'}`}>
                                                        {isReceived ? '+' : '-'}{tx.amount.toLocaleString('es-CO')}
                                                    </p>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <CheckCircle2 size={12} className="text-primary" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-primary">COMPLETADO</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="flex flex-col items-center justify-center py-10 opacity-30 text-center grayscale">
                                            <AlertCircle size={32} className="mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Sin actividad reciente</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <footer className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Seguridad Bancaria S.A.</p>
                    <p className="text-[8px] font-medium text-slate-400 uppercase tracking-tighter max-w-[80%] text-center">Esta billetera es de carácter informativo. Para transferencias, utiliza la aplicación móvil oficial de Ciudad Friki.</p>
                </footer>
            </div>
        </div>
    );
}
