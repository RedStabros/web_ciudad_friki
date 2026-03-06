import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Store, Package, ShoppingBag, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StoreItem {
    id: string;
    title: string;
    description: string;
    price_fc: number;
    stock: number;
    photos: string[];
    status: string;
}

interface AdminStoreChatModalProps {
    orderId: string;
    adminId: string;
    onClose: () => void;
}

function AdminStoreChatModal({ orderId, adminId, onClose }: AdminStoreChatModalProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [order, setOrder] = useState<any>(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadChat();
        const channel = supabase
            .channel(`admin_chat_${orderId}`)
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
            purchase_id: orderId, sender_id: adminId,
            sender_role: 'admin', content: text.trim(),
        });
        setText('');
        setSending(false);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="bg-bg-side relative w-full max-w-lg h-[80vh] rounded-2xl flex flex-col border border-border-theme shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-divider-theme shrink-0">
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-text-main text-sm truncate">{order?.store_items?.title ?? 'Chat de entrega (Admin)'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition text-text-muted">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <p className="text-center text-text-muted text-sm py-8">Sin mensajes aún.</p>
                    )}
                    {messages.map((m: any) => {
                        const isMine = m.sender_id === adminId && m.sender_role === 'admin';
                        return (
                            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-amber-500 text-black' : 'bg-bg-sub text-text-main border border-divider-theme'}`}>
                                    {!isMine && <p className="text-[10px] font-black text-brand-primary mb-1">Comprador</p>}
                                    <p>{m.content}</p>
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
                        placeholder="Escribe como equipo FrikiMart..."
                        className="flex-1 bg-bg-sub border border-border-theme text-text-main rounded-xl px-4 py-2 text-sm outline-none"
                    />
                    <button
                        onClick={sendMsg}
                        disabled={sending || !text.trim()}
                        className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 disabled:opacity-50"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}


export function AdminFrikiMart({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { user } = useAuth();
    const [tab, setTab] = useState<'items' | 'orders'>('orders');

    // Items state
    const [items, setItems] = useState<StoreItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Orders state
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [chatOrder, setChatOrder] = useState<string | null>(null);

    // Form stuff for editing items
    const [editingItem, setEditingItem] = useState<Partial<StoreItem> | null>(null);

    useEffect(() => {
        if (isOpen) {
            tab === 'items' ? fetchItems() : fetchOrders();
        }
    }, [isOpen, tab]);

    const fetchItems = async () => {
        setLoadingItems(true);
        const { data } = await supabase.from('store_items').select('*').order('created_at', { ascending: false });
        if (data) setItems(data);
        setLoadingItems(false);
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        const { data } = await supabase.from('store_purchases')
            .select('*, store_items(title), profiles:buyer_id(username)')
            .order('created_at', { ascending: false });
        if (data) setOrders(data);
        setLoadingOrders(false);
    };

    const handleSaveItem = async () => {
        if (!editingItem?.title || !editingItem.price_fc) return alert('Completa título y precio');

        const payload = {
            title: editingItem.title,
            description: editingItem.description || '',
            price_fc: editingItem.price_fc,
            stock: editingItem.stock || 0,
            status: editingItem.status || 'available',
        };

        if (editingItem.id) {
            await supabase.from('store_items').update(payload).eq('id', editingItem.id);
        } else {
            await supabase.from('store_items').insert(payload);
        }

        setEditingItem(null);
        fetchItems();
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        if (!window.confirm(`¿Cambiar estado a ${status}?`)) return;
        await supabase.from('store_purchases').update({ status }).eq('id', orderId);
        fetchOrders();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-bg-side rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-amber-500/20">
                <header className="p-6 pb-4 flex items-center justify-between border-b border-divider-theme bg-amber-500/5">
                    <div className="flex items-center gap-3 text-amber-500">
                        <Store size={28} />
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                            Admin FrikiMart
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition-all">
                        <X size={24} className="text-text-muted" />
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-divider-theme px-6">
                    <button
                        onClick={() => setTab('orders')}
                        className={`py-3 px-6 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${tab === 'orders' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        <Package className="inline-block mr-2" size={14} /> Pedidos
                    </button>
                    <button
                        onClick={() => setTab('items')}
                        className={`py-3 px-6 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${tab === 'items' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        <ShoppingBag className="inline-block mr-2" size={14} /> Inventario
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-bg-main/30">
                    {/* ORDERS TAB */}
                    {tab === 'orders' && (
                        <div className="space-y-4">
                            {loadingOrders ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" /></div>
                            ) : orders.map(order => (
                                <div key={order.id} className="bg-bg-side border border-border-theme p-4 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm">{order.store_items?.title} <span className="text-amber-500">({order.fc_spent} FC)</span></p>
                                        <p className="text-xs text-text-muted">Comprador: @{order.profiles?.username}</p>
                                        <p className="text-xs text-text-muted">Estado actual: <strong className={order.status === 'delivered' ? 'text-green-500' : order.status === 'cancelled' ? 'text-red-500' : 'text-amber-500'}>{order.status}</strong></p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setChatOrder(order.id)}
                                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-black uppercase rounded-lg hover:bg-blue-500/20"
                                        >
                                            Chat
                                        </button>
                                        {order.status !== 'delivered' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-black uppercase rounded-lg hover:bg-green-500/20"
                                            >
                                                ✔ Entregado
                                            </button>
                                        )}
                                        {order.status !== 'cancelled' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                className="px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-black uppercase rounded-lg hover:bg-red-500/20"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ITEMS TAB */}
                    {tab === 'items' && !editingItem && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setEditingItem({ status: 'available', stock: 1 })}
                                className="w-full py-4 border-2 border-dashed border-amber-500/30 text-amber-500 rounded-2xl font-black uppercase text-sm hover:bg-amber-500/10 transition"
                            >
                                + Agregar Artículo
                            </button>
                            {loadingItems ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" /></div>
                            ) : items.map(item => (
                                <div key={item.id} className="bg-bg-side border border-border-theme p-4 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-sm">{item.title} <span className="text-amber-500">({item.price_fc} FC)</span></p>
                                        <p className="text-xs text-text-muted">Stock: {item.stock} | Estado: {item.status}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingItem(item)}
                                        className="px-3 py-1.5 bg-bg-sub border border-border-theme text-text-main text-xs font-black uppercase rounded-lg hover:bg-bg-main"
                                    >
                                        Editar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* EDIT ITEM */}
                    {tab === 'items' && editingItem && (
                        <div className="bg-bg-side border border-border-theme p-6 rounded-2xl space-y-4">
                            <h3 className="font-black text-lg text-amber-500 mb-4">{editingItem.id ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">Título</label>
                                <input
                                    value={editingItem.title || ''}
                                    onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                                    className="w-full bg-bg-sub border border-border-theme p-2 rounded-lg text-text-main text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">Precio (FC)</label>
                                <input
                                    type="number"
                                    value={editingItem.price_fc || ''}
                                    onChange={e => setEditingItem({ ...editingItem, price_fc: Number(e.target.value) })}
                                    className="w-full bg-bg-sub border border-border-theme p-2 rounded-lg text-text-main text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">Stock</label>
                                <input
                                    type="number"
                                    value={editingItem.stock || 0}
                                    onChange={e => setEditingItem({ ...editingItem, stock: Number(e.target.value) })}
                                    className="w-full bg-bg-sub border border-border-theme p-2 rounded-lg text-text-main text-sm outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">Estado</label>
                                <select
                                    value={editingItem.status}
                                    onChange={e => setEditingItem({ ...editingItem, status: e.target.value })}
                                    className="w-full bg-bg-sub border border-border-theme p-2 rounded-lg text-text-main text-sm outline-none"
                                >
                                    <option value="available">Activo</option>
                                    <option value="hidden">Oculto</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-4 py-2 bg-bg-sub border border-border-theme text-text-muted rounded-xl font-bold text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveItem}
                                    className="px-4 py-2 bg-amber-500 text-black rounded-xl font-black uppercase text-sm"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {chatOrder && user && (
                <AdminStoreChatModal orderId={chatOrder} adminId={user.id} onClose={() => setChatOrder(null)} />
            )}
        </div>
    );
}
