import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Store, Package, ShoppingBag, Send, Heart, RefreshCcw, MapPin, Mail, Trash2 } from 'lucide-react';
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
    onStatusChange: () => void;
}

function AdminStoreChatModal({ orderId, adminId, onClose, onStatusChange }: AdminStoreChatModalProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [order, setOrder] = useState<any>(null);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [updating, setUpdating] = useState(false);

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
            supabase.from('store_purchases').select('*, store_items(title), profiles:buyer_id(username, avatar_url)').eq('id', orderId).single(),
        ]);
        if (msgRes.data) setMessages(msgRes.data);
        if (orderRes.data) setOrder(orderRes.data);
    };

    const sendMsg = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await supabase.from('store_messages').insert({
                purchase_id: orderId, sender_id: adminId,
                sender_role: 'admin', content: text.trim(),
            });
            setText('');
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const updateOrder = async (payload: any) => {
        setUpdating(true);
        try {
            await supabase.from('store_purchases').update(payload).eq('id', orderId);
            await loadChat();
            onStatusChange();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className="bg-bg-side relative w-full max-w-lg h-[80vh] rounded-2xl flex flex-col border border-border-theme shadow-2xl animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-divider-theme shrink-0">
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-text-main text-sm truncate">{order?.store_items?.title ?? 'Chat de entrega'}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                            @{order?.profiles?.username ?? '...'} · {order?.status === 'delivered' ? '✅ Entregado' : order?.status === 'cancelled' ? '❌ Cancelado' : '⏳ Pendiente'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-bg-sub rounded-xl transition text-text-muted">
                        <X size={20} />
                    </button>
                </div>

                {/* Quick Actions for Pending Orders */}
                {order?.status === 'pending_delivery' && (
                    <div className="px-4 py-2 border-b border-divider-theme bg-amber-500/5 flex flex-wrap gap-2 shrink-0">
                        <button
                            onClick={() => updateOrder({ delivery_method: 'pickup' })}
                            disabled={updating}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition ${order.delivery_method === 'pickup' ? 'bg-amber-500 text-black' : 'bg-bg-sub text-amber-500 border border-amber-500/20'}`}
                        >
                            <MapPin size={12} /> Punto Recogida
                        </button>
                        <button
                            onClick={() => updateOrder({ delivery_method: 'mail' })}
                            disabled={updating}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition ${order.delivery_method === 'mail' ? 'bg-amber-500 text-black' : 'bg-bg-sub text-amber-500 border border-amber-500/20'}`}
                        >
                            <Mail size={12} /> Envío Correo
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => {
                                if (window.confirm('¿Confirmar que el producto fue entregado?')) {
                                    updateOrder({ status: 'delivered' });
                                }
                            }}
                            disabled={updating}
                            className="bg-green-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-green-400 disabled:opacity-50"
                        >
                            ✅ Entregado
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('¿Cancelar este pedido? Los FC no se devolverán automáticamente.')) {
                                    updateOrder({ status: 'cancelled' });
                                }
                            }}
                            disabled={updating}
                            className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-red-500 hover:text-white disabled:opacity-50"
                        >
                            ❌ Cancelar
                        </button>
                    </div>
                )}

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


export function AdminFrikiMartContent() {
    const { user, isSuperuser } = useAuth();
    const [tab, setTab] = useState<'items' | 'orders' | 'donations'>('orders');

    // Items state
    const [items, setItems] = useState<StoreItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Orders state
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Donations state
    const [packages, setPackages] = useState<any[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(false);

    const [chatOrder, setChatOrder] = useState<string | null>(null);

    // Form stuff for editing items
    const [editingItem, setEditingItem] = useState<Partial<StoreItem> | null>(null);
    const [editingPackage, setEditingPackage] = useState<any | null>(null);

    useEffect(() => {
        if (tab === 'items') fetchItems();
        else if (tab === 'orders') fetchOrders();
        else if (tab === 'donations' && isSuperuser) fetchPackages();
    }, [tab, isSuperuser]);

    const fetchItems = async () => {
        setLoadingItems(true);
        const { data } = await supabase.from('store_items').select('*').order('created_at', { ascending: false });
        if (data) setItems(data);
        setLoadingItems(false);
    };

    const fetchOrders = async () => {
        setLoadingOrders(true);
        const { data } = await supabase.from('store_purchases')
            .select('*, store_items(title, photos), profiles:buyer_id(username, avatar_url)')
            .eq('purchase_type', 'physical')
            .order('created_at', { ascending: false });
        if (data) setOrders(data);
        setLoadingOrders(false);
    };

    const fetchPackages = async () => {
        if (!isSuperuser) return;
        setLoadingPackages(true);
        const { data } = await supabase.from('donation_packages').select('*').order('sort_order');
        if (data) setPackages(data);
        setLoadingPackages(false);
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



    const handleSavePackage = async () => {
        if (!editingPackage?.name || !editingPackage.frikicoin_reward || !editingPackage.price_cents || !editingPackage.google_product_id) {
            return alert('Completa todos los campos obligatorios');
        }

        const payload = {
            name: editingPackage.name.trim(),
            description: editingPackage.description?.trim() || '',
            frikicoin_reward: Number(editingPackage.frikicoin_reward),
            price_cents: Number(editingPackage.price_cents),
            google_product_id: editingPackage.google_product_id.trim(),
            sort_order: Number(editingPackage.sort_order || 0),
            is_active: editingPackage.is_active ?? false,
        };

        if (editingPackage.id) {
            await supabase.from('donation_packages').update(payload).eq('id', editingPackage.id);
        } else {
            await supabase.from('donation_packages').insert(payload);
        }

        setEditingPackage(null);
        fetchPackages();
    };

    const handleDeletePackage = async (id: string) => {
        if (!window.confirm('¿Eliminar este paquete permanentemente?')) return;
        await supabase.from('donation_packages').delete().eq('id', id);
        fetchPackages();
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
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
                {isSuperuser && (
                    <button
                        onClick={() => setTab('donations')}
                        className={`py-3 px-6 font-black text-xs uppercase tracking-widest border-b-2 transition-all ${tab === 'donations' ? 'border-amber-500 text-amber-500' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    >
                        <Heart className="inline-block mr-2" size={14} /> Donaciones
                    </button>
                )}
                <div className="flex-1" />
                <button
                    onClick={() => {
                        if (tab === 'items') fetchItems();
                        else if (tab === 'orders') fetchOrders();
                        else if (tab === 'donations') fetchPackages();
                    }}
                    className="p-3 text-text-muted hover:text-amber-500 transition"
                >
                    <RefreshCcw size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-bg-main/30">
                {/* ORDERS TAB */}
                {tab === 'orders' && (
                    <div className="space-y-4">
                        {loadingOrders ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" /></div>
                        ) : orders.map(order => (
                            <div key={order.id} className="bg-bg-side border border-border-theme p-4 rounded-2xl flex items-center justify-between border-l-4" style={{ borderColor: order.status === 'delivered' ? '#34d399' : order.status === 'cancelled' ? '#f87171' : '#f59e0b' }}>
                                <div>
                                    <p className="font-bold text-sm">{order.store_items?.title} <span className="text-amber-500">({order.fc_spent} FC)</span></p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-text-muted">@{order.profiles?.username}</p>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${order.status === 'delivered' ? 'bg-green-500/10 text-green-500' : order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {order.status === 'delivered' ? 'Entregado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                        </div>
                                        {order.delivery_method && (
                                            <div className="text-[10px] font-bold text-text-muted opacity-60">
                                                · {order.delivery_method === 'pickup' ? '📍 Pickup' : '📬 Correo'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setChatOrder(order.id)}
                                        className="w-10 h-10 bg-bg-sub border border-border-theme flex items-center justify-center rounded-xl hover:bg-bg-main text-text-muted hover:text-amber-500 transition shadow-sm"
                                    >
                                        <Send size={16} className="-rotate-45 -translate-y-0.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* DONATIONS TAB */}
                {tab === 'donations' && isSuperuser && (
                    <div className="space-y-4">
                        {!editingPackage && (
                            <button
                                onClick={() => setEditingPackage({ sort_order: 0, is_active: false })}
                                className="w-full py-4 border-2 border-dashed border-amber-500/30 text-amber-500 rounded-2xl font-black uppercase text-sm hover:bg-amber-500/10 transition"
                            >
                                + Nuevo Paquete IAP
                            </button>
                        )}

                        {loadingPackages ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" /></div>
                        ) : !editingPackage && packages.map(pkg => (
                            <div key={pkg.id} className={`bg-bg-side border p-4 rounded-2xl flex items-center justify-between transition ${pkg.is_active ? 'border-amber-500/30 shadow-sm' : 'border-border-theme opacity-60'}`}>
                                <div>
                                    <p className="font-bold text-sm tracking-tight">{pkg.name} <span className="text-amber-500">({pkg.frikicoin_reward} FC)</span></p>
                                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                                        ${(pkg.price_cents / 100).toFixed(2)} · {pkg.google_product_id}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingPackage(pkg)}
                                        className="px-3 py-1.5 bg-bg-sub border border-border-theme text-text-main text-xs font-black uppercase rounded-lg"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeletePackage(pkg.id)}
                                        className="p-1.5 text-text-muted hover:text-red-500 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {editingPackage && (
                            <div className="bg-bg-side border border-border-theme p-6 rounded-3xl space-y-4 animate-in slide-in-from-bottom-2">
                                <h3 className="font-black text-lg text-amber-500 leading-none mb-4 uppercase italic">
                                    {editingPackage.id ? 'Editar Paquete' : 'Nuevo Paquete IAP'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Nombre</label>
                                        <input
                                            value={editingPackage.name || ''}
                                            onChange={e => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                            placeholder="Ej: Caja Mágica"
                                            className="w-full bg-bg-sub border border-border-theme p-2.5 rounded-xl text-text-main text-sm outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Google SKU</label>
                                        <input
                                            value={editingPackage.google_product_id || ''}
                                            onChange={e => setEditingPackage({ ...editingPackage, google_product_id: e.target.value })}
                                            placeholder="fc_pack_100"
                                            className="w-full bg-bg-sub border border-border-theme p-2.5 rounded-xl text-text-main text-sm outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">FC Recompensa</label>
                                        <input
                                            type="number"
                                            value={editingPackage.frikicoin_reward || ''}
                                            onChange={e => setEditingPackage({ ...editingPackage, frikicoin_reward: e.target.value })}
                                            className="w-full bg-bg-sub border border-border-theme p-2.5 rounded-xl text-text-main text-sm outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Precio (Centavos)</label>
                                        <input
                                            type="number"
                                            value={editingPackage.price_cents || ''}
                                            onChange={e => setEditingPackage({ ...editingPackage, price_cents: e.target.value })}
                                            placeholder="199 = $1.99"
                                            className="w-full bg-bg-sub border border-border-theme p-2.5 rounded-xl text-text-main text-sm outline-none focus:border-amber-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-bg-sub rounded-2xl border border-divider-theme">
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-text-main">Activo en la plataforma</p>
                                        <p className="text-[10px] text-text-muted uppercase tracking-tight">Determina si los usuarios pueden verlo.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={editingPackage.is_active} onChange={e => setEditingPackage({ ...editingPackage, is_active: e.target.checked })} />
                                        <div className="w-11 h-6 bg-bg-side rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                                    </label>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        onClick={() => setEditingPackage(null)}
                                        className="px-6 py-2.5 bg-bg-sub border border-border-theme text-text-muted rounded-xl font-bold text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSavePackage}
                                        className="px-8 py-2.5 bg-amber-500 text-black rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        )}
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
            {chatOrder && user && (
                <AdminStoreChatModal
                    orderId={chatOrder}
                    adminId={user.id}
                    onClose={() => setChatOrder(null)}
                    onStatusChange={fetchOrders}
                />
            )}
        </div>
    );
}

export function AdminFrikiMart({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
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

                <AdminFrikiMartContent />
            </div>
        </div>
    );
}
