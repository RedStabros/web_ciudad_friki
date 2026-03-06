import { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    ArrowLeft, ShoppingBag, PackageCheck, Gift,
    RefreshCw, Loader2, MessageCircle,
    ChevronRight, Send, X, Check
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'items' | 'orders' | 'donations';

interface StoreItem {
    id: string;
    title: string;
    description?: string;
    price_fc: number;
    stock: number;
    photos?: string[];
    status: string;
}

interface Order {
    id: string;
    fc_spent: number;
    status: 'pending_delivery' | 'delivered' | 'cancelled';
    buyer_confirmed: boolean;
    created_at: string;
    store_items?: { title: string; photos?: string[] };
}

interface DonationPackage {
    id: string;
    name: string;
    description?: string;
    frikicoin_reward: number;
    price_cents: number;
    bonus_perks?: string[];
    is_active: boolean;
    sort_order: number;
}

// ── Chat Modal ─────────────────────────────────────────────────────────────────
function ChatModal({ orderId, userId, onClose }: { orderId: string; userId: string; onClose: () => void }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [order, setOrder] = useState<any>(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadChat();
        const channel = supabase
            .channel(`chat_${orderId}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'store_messages',
                filter: `purchase_id=eq.${orderId}`
            }, payload => setMessages(prev => [...prev, payload.new]))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [orderId]);

    const loadChat = async () => {
        const [msgRes, orderRes] = await Promise.all([
            supabase.from('store_messages').select('*').eq('purchase_id', orderId).order('created_at'),
            supabase.from('store_purchases').select('*, store_items(title)').eq('id', orderId).single(),
        ]);
        if (msgRes.data) setMessages(msgRes.data);
        if (orderRes.data) setOrder(orderRes.data);
    };

    const sendMsg = async () => {
        if (!text.trim()) return;
        setSending(true);
        await supabase.from('store_messages').insert({
            purchase_id: orderId, sender_id: userId,
            sender_role: 'buyer', content: text.trim(),
        });
        setText('');
        setSending(false);
    };

    const confirmReceived = async () => {
        if (!window.confirm('¿Confirmas que recibiste tu artículo?')) return;
        await supabase.from('store_purchases').update({ buyer_confirmed: true }).eq('id', orderId);
        loadChat();
    };

    const statusText = order?.status === 'delivered' ? '✅ Entregado'
        : order?.status === 'cancelled' ? '❌ Cancelado' : '⏳ Pendiente de entrega';

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-bg-side w-full sm:max-w-lg h-[90vh] sm:h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col border border-border-theme shadow-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-divider-theme shrink-0">
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition text-text-muted">
                        <X size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-text-main text-sm truncate">{order?.store_items?.title ?? 'Chat de entrega'}</p>
                        <p className="text-xs text-text-muted">{statusText}</p>
                    </div>
                    {order?.status === 'pending_delivery' && !order?.buyer_confirmed && (
                        <button onClick={confirmReceived} className="px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs font-black rounded-lg border border-amber-500/30 hover:bg-amber-500/30 transition">
                            Confirmar recibo ✅
                        </button>
                    )}
                    {order?.buyer_confirmed && <span className="text-accent-green text-xs font-bold flex items-center gap-1"><Check size={12} />Recibido</span>}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <p className="text-center text-text-muted text-sm py-8">Aún no hay mensajes. El equipo de FrikiMart se pondrá en contacto pronto.</p>
                    )}
                    {messages.map((m: any) => {
                        const isMine = m.sender_id === userId && m.sender_role === 'buyer';
                        return (
                            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-amber-500 text-black' : 'bg-bg-sub text-text-main border border-divider-theme'}`}>
                                    {!isMine && <p className="text-[10px] font-black text-amber-400 mb-1">FrikiMart 🐉</p>}
                                    <p>{m.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-black/50' : 'text-text-muted'}`}>
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-divider-theme flex gap-3 shrink-0">
                    <input
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-bg-sub border border-border-theme text-text-main rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                        onClick={sendMsg}
                        disabled={sending || !text.trim()}
                        className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition disabled:opacity-50"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FrikiMart() {
    const { t: _t } = useTranslation();
    const { user, session } = useAuth();
    const [tab, setTab] = useState<Tab>('items');
    const [items, setItems] = useState<StoreItem[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [donations, setDonations] = useState<DonationPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState(0);
    const [buying, setBuying] = useState<string | null>(null);
    const [chatOrderId, setChatOrderId] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    if (!session) return <Navigate to="/login" replace />;

    const fetchBalance = useCallback(async () => {
        if (!user?.id) return;
        const { data } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
        if (data) setBalance(data.balance ?? 0);
    }, [user?.id]);

    const fetchItems = useCallback(async () => {
        const { data } = await supabase.from('store_items').select('*').eq('status', 'available').order('created_at', { ascending: false });
        setItems(data ?? []);
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;
        const { data } = await supabase.from('store_purchases')
            .select('*, store_items(title, photos)')
            .eq('buyer_id', user.id)
            .eq('purchase_type', 'physical')
            .order('created_at', { ascending: false });
        setOrders(data ?? []);
    }, [user?.id]);

    const fetchDonations = useCallback(async () => {
        const { data } = await supabase.from('donation_packages').select('*').eq('is_active', true).order('sort_order');
        setDonations(data ?? []);
    }, []);

    const fetchAll = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        await Promise.all([fetchBalance(), fetchItems(), fetchOrders(), fetchDonations()]);
        setLoading(false);
        setRefreshing(false);
    }, [fetchBalance, fetchItems, fetchOrders, fetchDonations]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleBuy = async (item: StoreItem) => {
        if (balance < item.price_fc) {
            alert(`Necesitas ${item.price_fc.toLocaleString()} FC.\nTienes ${balance.toLocaleString()} FC.`);
            return;
        }
        if (!window.confirm(`Comprar "${item.title}" por ${item.price_fc.toLocaleString()} FC?\n\n⚠️ Las compras con Frikicoins no tienen devolución.`)) return;

        setBuying(item.id);
        try {
            const { data, error } = await supabase.rpc('purchase_store_item', { p_item_id: item.id });
            if (error) throw error;
            setSuccessMsg(item.title);
            await Promise.all([fetchBalance(), fetchItems(), fetchOrders()]);
            setChatOrderId(data as string);
        } catch (err: any) {
            const msg = err.message?.includes('INSUFFICIENT_FC') ? 'No tienes suficientes Frikicoins.'
                : err.message?.includes('OUT_OF_STOCK') ? 'Artículo agotado.'
                    : 'Ocurrió un error. Intenta de nuevo.';
            alert(msg);
        } finally {
            setBuying(null);
        }
    };

    const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'items', label: 'Artículos', icon: <ShoppingBag size={15} /> },
        { key: 'orders', label: 'Mis Pedidos', icon: <PackageCheck size={15} /> },
        { key: 'donations', label: 'Donaciones', icon: <Gift size={15} /> },
    ];

    return (
        <div className="min-h-screen bg-bg-main pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-bg-side border-b border-border-theme">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
                    <Link to="/" className="p-2 rounded-xl hover:bg-bg-sub transition text-text-muted hover:text-text-main">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-2.5 flex-1">
                        <img src="/icons/icon_frikimart.png" alt="FrikiMart" className="w-8 h-8 object-contain" />
                        <h1 className="text-lg font-black text-amber-400 uppercase tracking-tight">FrikiMart</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-text-muted uppercase font-bold">Tu balance</p>
                        <p className="text-sm font-black text-amber-400">{balance.toLocaleString()} FC</p>
                    </div>
                    <button
                        onClick={() => fetchAll(true)}
                        disabled={refreshing}
                        className="p-2 rounded-xl hover:bg-bg-sub transition text-text-muted"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="max-w-3xl mx-auto px-4 flex border-t border-border-theme">
                    {TABS.map(tb => (
                        <button
                            key={tb.key}
                            onClick={() => setTab(tb.key)}
                            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${tab === tb.key
                                ? 'border-amber-400 text-amber-400'
                                : 'border-transparent text-text-muted hover:text-text-main'}`}
                        >
                            {tb.icon} {tb.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 pt-6">
                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-3">
                        <Loader2 size={32} className="animate-spin text-amber-400" />
                        <p className="text-text-muted text-sm">Cargando FrikiMart...</p>
                    </div>
                ) : (
                    <>
                        {/* ── Artículos ── */}
                        {tab === 'items' && (
                            <div className="space-y-4">
                                {items.length === 0 ? (
                                    <Empty icon="🛍️" text="No hay artículos disponibles ahora mismo." />
                                ) : items.map(item => {
                                    const photo = item.photos?.[0];
                                    const canAfford = balance >= item.price_fc;
                                    return (
                                        <article key={item.id} className="bg-bg-side border border-border-theme rounded-2xl overflow-hidden shadow-sm hover:border-amber-400/30 transition">
                                            {photo && (
                                                <div className="w-full h-48 overflow-hidden">
                                                    <img src={photo} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {!photo && (
                                                <div className="w-full h-32 bg-bg-sub flex items-center justify-center text-5xl">🏷️</div>
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-black text-text-main text-base leading-tight mb-1">{item.title}</h3>
                                                {item.description && (
                                                    <p className="text-text-muted text-sm mb-3 line-clamp-2">{item.description}</p>
                                                )}
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <p className="text-xl font-black text-amber-400">{item.price_fc.toLocaleString()} FC</p>
                                                        {item.stock === 1 && <p className="text-[11px] text-red-400 font-bold">🔴 ¡Última unidad!</p>}
                                                        {item.stock > 1 && item.stock <= 5 && <p className="text-[11px] text-orange-400 font-bold">⚠️ Quedan {item.stock} unidades</p>}
                                                        {item.stock > 5 && <p className="text-[11px] text-accent-green">✓ {item.stock} disponibles</p>}
                                                    </div>
                                                    <button
                                                        onClick={() => handleBuy(item)}
                                                        disabled={buying === item.id || !!buying}
                                                        className={`px-5 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg ${canAfford
                                                            ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20 active:scale-95'
                                                            : 'bg-bg-sub text-text-muted border border-border-theme cursor-not-allowed'} disabled:opacity-50`}
                                                    >
                                                        {buying === item.id ? <Loader2 size={16} className="animate-spin" /> : canAfford ? 'Comprar' : 'Sin FC'}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Pedidos ── */}
                        {tab === 'orders' && (
                            <div className="space-y-3">
                                {orders.length === 0 ? (
                                    <Empty icon="📦" text="No tienes compras aún." />
                                ) : orders.map(order => {
                                    const photo = order.store_items?.photos?.[0];
                                    const statusColor = order.status === 'delivered' ? 'text-accent-green' : order.status === 'cancelled' ? 'text-accent-red' : 'text-amber-400';
                                    const statusLabel = order.status === 'delivered' ? '✅ Entregado' : order.status === 'cancelled' ? '❌ Cancelado' : '⏳ Pendiente';
                                    return (
                                        <button
                                            key={order.id}
                                            onClick={() => setChatOrderId(order.id)}
                                            className="w-full bg-bg-side border border-border-theme rounded-2xl p-4 flex items-center gap-4 hover:border-amber-400/30 transition text-left"
                                        >
                                            {photo ? (
                                                <img src={photo} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-bg-sub flex items-center justify-center text-2xl shrink-0">🏷️</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-text-main text-sm truncate">{order.store_items?.title ?? 'Artículo'}</p>
                                                <p className="text-amber-400 text-sm font-bold mt-0.5">{order.fc_spent?.toLocaleString()} FC</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
                                                    {order.buyer_confirmed && <span className="text-[10px] text-accent-green">Recibido ✅</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-text-muted text-xs shrink-0">
                                                <MessageCircle size={13} />
                                                <ChevronRight size={14} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Donaciones ── */}
                        {tab === 'donations' && (
                            <div className="space-y-4">
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-2">
                                    <p className="text-amber-400 font-black text-sm mb-1">💳 Donaciones — Próximamente en web</p>
                                    <p className="text-text-muted text-xs leading-relaxed">
                                        Las donaciones con dinero real están disponibles en la app móvil de Ciudad Friki a través de Google Play.
                                        Puedes ver los paquetes disponibles aquí. Para donar, descarga la app.
                                    </p>
                                </div>
                                {donations.length === 0 ? (
                                    <Empty icon="🎁" text="No hay paquetes de donación activos." />
                                ) : donations.map(pkg => (
                                    <div key={pkg.id} className="bg-bg-side border border-border-theme rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">🎁</span>
                                            <h3 className="font-black text-text-main text-base">{pkg.name}</h3>
                                        </div>
                                        {pkg.description && <p className="text-text-muted text-sm mb-3">{pkg.description}</p>}
                                        {pkg.bonus_perks && pkg.bonus_perks.length > 0 && (
                                            <div className="mb-3 space-y-1">
                                                {pkg.bonus_perks.map((perk, i) => (
                                                    <p key={i} className="text-xs text-amber-400">✦ {perk}</p>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xl font-black text-amber-400">+{pkg.frikicoin_reward.toLocaleString()} FC</p>
                                                <p className="text-xs text-text-muted">${(pkg.price_cents / 100).toFixed(2)} USD</p>
                                            </div>
                                            <div className="px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-400 text-xs font-black bg-amber-500/10">
                                                Solo en App 📱
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Success banner */}
            {successMsg && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-bg-side border border-amber-400/40 shadow-2xl rounded-2xl px-6 py-4 max-w-sm w-[90%] text-center animate-in fade-in slide-in-from-bottom-4">
                    <p className="text-3xl mb-2">🐉</p>
                    <p className="font-black text-amber-400 text-base">¡Compra exitosa!</p>
                    <p className="text-text-muted text-sm mt-1 mb-3">{successMsg}</p>
                    <p className="text-text-muted text-xs">Un administrador se pondrá en contacto para coordinar la entrega.</p>
                    <button
                        onClick={() => { setSuccessMsg(null); setTab('orders'); }}
                        className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 text-black font-black text-sm hover:bg-amber-400 transition"
                    >
                        💬 Ver mis pedidos
                    </button>
                </div>
            )}

            {/* Chat Modal */}
            {chatOrderId && user && (
                <ChatModal orderId={chatOrderId} userId={user.id} onClose={() => setChatOrderId(null)} />
            )}
        </div>
    );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function Empty({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
            <span className="text-5xl">{icon}</span>
            <p className="text-text-muted text-sm">{text}</p>
        </div>
    );
}

// ── Visibility hook (exportable for nav/dashboard use) ────────────────────────
export async function getFrikiMartVisibility(userId?: string): Promise<{ globalEnabled: boolean; webEnabled: boolean }> {
    try {
        const { data } = await supabase
            .from('global_settings')
            .select('key, value')
            .in('key', ['store_enabled', 'store_web_enabled']);
        const map: Record<string, any> = {};
        data?.forEach((r: any) => { map[r.key] = r.value; });

        const isSuperuser = userId === import.meta.env.VITE_SUPERUSER_ID;
        const rawWebEnabled = map['store_web_enabled'] ?? false;

        return {
            globalEnabled: map['store_enabled'] ?? false,
            webEnabled: rawWebEnabled || isSuperuser,
        };
    } catch {
        return { globalEnabled: false, webEnabled: false };
    }
}
