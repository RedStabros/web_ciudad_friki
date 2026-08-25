import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Plus, Loader2, Search, X, Edit, Power, PowerOff, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { LocationPicker } from '../../components/LocationPicker';
import { injectLatLng } from '../../utils/geoUtils';

const ALLY_TYPES = [
    { value: 'STORE', labelKey: 'adminAllies.types.STORE', defaultLabel: 'Tienda Friki / TCG' },
    { value: 'GAMING_CENTER', labelKey: 'adminAllies.types.GAMING_CENTER', defaultLabel: 'Centro Gaming / Arcade' },
    { value: 'CULTURAL', labelKey: 'adminAllies.types.CULTURAL', defaultLabel: 'Cultural / Biblioteca' },
    { value: 'FOOD', labelKey: 'adminAllies.types.FOOD', defaultLabel: 'Restaurante / Café' },
    { value: 'EVENT_VENUE', labelKey: 'adminAllies.types.EVENT_VENUE', defaultLabel: 'Sede de Eventos' },
];

interface SponsoredLocation {
    id: string;
    name: string;
    description: string | null;
    contact_info: string | null;
    address_text: string | null;
    location_type: string;
    image_url: string | null;
    lat: number | null;
    lng: number | null;
    location: any;
    is_active: boolean;
    allow_reviews: boolean;
}

export default function AdminAllies() {
    const { t } = useTranslation();
    const [allies, setAllies] = useState<SponsoredLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAlly, setEditingAlly] = useState<SponsoredLocation | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        contact_info: '',
        address_text: '',
        location_type: 'STORE',
        lat: null as number | null,
        lng: null as number | null,
    });
    
    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchAllies();
    }, []);

    const fetchAllies = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('sponsored_locations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllies((data || []) as SponsoredLocation[]);
        } catch (error) {
            console.error('Error fetching allies:', error);
            alert(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingAlly(null);
        setFormData({ name: '', description: '', contact_info: '', address_text: '', location_type: 'STORE', lat: null, lng: null });
        setImageFile(null);
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (ally: SponsoredLocation) => {
        const allyWithCoords = injectLatLng(ally);
        setEditingAlly(allyWithCoords);
        
        setFormData({
            name: allyWithCoords.name || '',
            description: allyWithCoords.description || '',
            contact_info: allyWithCoords.contact_info || '',
            address_text: allyWithCoords.address_text || '',
            location_type: allyWithCoords.location_type || 'STORE',
            lat: allyWithCoords.lat || null,
            lng: allyWithCoords.lng || null,
        });
        setImagePreview(ally.image_url || null);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `allies/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('event-banners').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('event-banners').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (e) {
            console.error('Error uploading image', e);
            return null;
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.address_text) {
            alert(t('events.errors.requiredFields', 'Faltan campos requeridos'));
            return;
        }
        setIsSubmitting(true);
        try {
            let finalImageUrl = imagePreview;
            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile);
                if (uploadedUrl) finalImageUrl = uploadedUrl;
            }

            let geoLocation = null;
            if (formData.lat && formData.lng) {
                geoLocation = `POINT(${formData.lng} ${formData.lat})`;
            }

            const allyPayload = {
                name: formData.name,
                description: formData.description,
                contact_info: formData.contact_info,
                address_text: formData.address_text,
                location_type: formData.location_type,
                location: geoLocation,
                image_url: finalImageUrl,
                is_active: editingAlly ? editingAlly.is_active : true,
                allow_reviews: editingAlly ? editingAlly.allow_reviews : true,
            };

            if (editingAlly) {
                const { error } = await supabase.from('sponsored_locations').update(allyPayload).eq('id', editingAlly.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('sponsored_locations').insert(allyPayload);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchAllies();
        } catch (error) {
            console.error('Error saving ally:', error);
            alert(t('common.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (ally: SponsoredLocation) => {
        try {
            const newStatus = !ally.is_active;
            const { error } = await supabase.from('sponsored_locations').update({ is_active: newStatus }).eq('id', ally.id);
            if (error) throw error;
            
            setAllies(prev => prev.map(a => a.id === ally.id ? { ...a, is_active: newStatus } : a));
        } catch (error) {
            console.error('Error toggling status:', error);
            alert(t('common.error'));
        }
    };

    const filteredAllies = allies.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300 relative z-10">
            {/* Header */}
            <div className="bg-bg-side p-6 rounded-2xl border border-border-theme flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                
                <div className="flex gap-4 items-center relative z-10">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-purple-500/20">
                        <MapPin size={28} className="text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main leading-tight tracking-tight uppercase italic">{t('admin.sidebar.allies', 'Gestión de Aliados')}</h1>
                        <p className="text-sm text-text-muted mt-1 font-medium max-w-md">
                            {t('adminAllies.description', 'Agrega y administra tiendas, comunidades y negocios aliados para que aparezcan permanentemente en el Mapa Friki.')}
                        </p>
                    </div>
                </div>

                <button 
                    onClick={handleOpenCreate}
                    className="w-full md:w-auto px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-black uppercase text-sm rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 relative z-10"
                >
                    <Plus size={18} /> {t('adminAllies.create', 'Crear Aliado')}
                </button>
            </div>

            {/* List Section */}
            <div className="bg-bg-side rounded-2xl border border-border-theme shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
                <div className="p-4 border-b border-border-theme flex flex-col sm:flex-row gap-4 justify-between bg-bg-pop/50">
                    <div className="relative w-full sm:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-text-muted" />
                        </div>
                        <input
                            type="text"
                            placeholder={t('adminAllies.search', 'Buscar aliado por nombre...')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-bg-main border border-border-theme text-text-main px-4 py-2.5 pl-10 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 opacity-50">
                            <Loader2 className="animate-spin text-purple-500 mb-2" size={32} />
                            <p className="text-xs uppercase font-black tracking-widest">{t('common.loading')}</p>
                        </div>
                    ) : filteredAllies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 opacity-50">
                            <MapPin className="text-text-muted mb-2" size={48} />
                            <p className="text-xs uppercase font-black tracking-widest text-text-muted">{t('adminAllies.empty', 'No hay aliados registrados')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                            {filteredAllies.map(ally => (
                                <div key={ally.id} className={`bg-bg-main border rounded-xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md ${ally.is_active ? 'border-border-theme' : 'border-red-500/30 opacity-75 grayscale-[30%]'}`}>
                                    <div className="h-32 bg-bg-sub relative">
                                        {ally.image_url ? (
                                            <img src={ally.image_url} alt={ally.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-text-muted">
                                                <ImageIcon size={32} opacity={0.5} />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${ally.is_active ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                                {ally.is_active ? 'En Mapa' : 'Oculto'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-bold text-text-main line-clamp-1">{ally.name}</h3>
                                        <p className="text-xs text-text-muted mt-1 line-clamp-2 flex-1">{ally.description || 'Sin descripción'}</p>
                                        
                                        <div className="flex items-center gap-1 mt-3 text-xs text-text-muted">
                                            <MapPin size={12} className="text-purple-500 shrink-0" />
                                            <span className="truncate">{ally.address_text}</span>
                                        </div>

                                        <div className="h-px bg-border-theme my-3"></div>
                                        
                                        <div className="flex gap-2 mt-auto">
                                            <button 
                                                onClick={() => handleOpenEdit(ally)}
                                                className="flex-1 py-1.5 bg-bg-side hover:bg-bg-sub border border-border-theme rounded-lg text-xs font-bold text-text-main transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Edit size={12} /> Editar
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(ally)}
                                                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center border ${ally.is_active ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20'}`}
                                                title={ally.is_active ? t('adminAllies.hideMap', 'Ocultar del Mapa') : t('adminAllies.showMap', 'Mostrar en Mapa')}
                                            >
                                                {ally.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl max-h-[90vh] bg-bg-side rounded-2xl shadow-2xl flex flex-col border border-border-theme overflow-hidden animate-in zoom-in-95 duration-200 z-[70]">
                        <div className="flex items-center justify-between p-5 border-b border-divider-theme bg-bg-pop/50">
                            <h2 className="text-lg font-black uppercase tracking-tight text-text-main italic">
                                {editingAlly ? t('adminAllies.edit', 'Editar Aliado') : t('adminAllies.create', 'Nuevo Aliado')}
                            </h2>
                            <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="text-text-muted hover:text-text-main transition">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <form id="allyForm" onSubmit={handleSave} className="space-y-5">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-sub uppercase tracking-widest mb-1">{t('adminAllies.form.name', 'Nombre del Aliado *')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-bg-main border border-border-theme rounded-xl px-4 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-text-main font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-sub uppercase tracking-widest mb-1">{t('adminAllies.form.description', 'Descripción Breve')}</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            className="w-full bg-bg-main border border-border-theme rounded-xl px-4 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-text-main resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-sub uppercase tracking-widest mb-1">{t('adminAllies.form.contact', 'Info de Contacto (Teléfono/Web)')}</label>
                                        <input
                                            type="text"
                                            value={formData.contact_info}
                                            onChange={e => setFormData({ ...formData, contact_info: e.target.value })}
                                            className="w-full bg-bg-main border border-border-theme rounded-xl px-4 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-text-main"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-4 pt-4 border-t border-divider-theme">
                                    <h3 className="text-sm font-black text-purple-500">{t('adminAllies.form.locationTitle', 'UBICACIÓN')}</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-text-sub uppercase tracking-widest mb-1">{t('adminAllies.form.address', 'Dirección / Referencia *')}</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.address_text}
                                            onChange={e => setFormData({ ...formData, address_text: e.target.value })}
                                            className="w-full bg-bg-main border border-border-theme rounded-xl px-4 py-2.5 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-text-main"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-sub uppercase tracking-widest mb-2">{t('adminAllies.form.pin', 'Fijar en el Mapa (Pin)')}</label>
                                        <div className="border border-border-theme rounded-xl overflow-hidden">
                                            <LocationPicker 
                                                initialLat={formData.lat} 
                                                initialLng={formData.lng} 
                                                onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))}
                                                onAddressFound={(address) => setFormData(prev => ({ ...prev, address_text: address }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Image */}
                                <div className="space-y-4 pt-4 border-t border-divider-theme">
                                    <h3 className="text-sm font-black text-purple-500">{t('adminAllies.form.imageTitle', 'FOTO / LOGO')}</h3>
                                    <div className="relative group">
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="ally-image" />
                                        <label htmlFor="ally-image" className="block w-full cursor-pointer">
                                            {imagePreview ? (
                                                <div className="relative h-40 rounded-xl overflow-hidden border-2 border-purple-500 shadow-lg group">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ImageIcon size={32} className="text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-40 bg-bg-main border-2 border-dashed border-divider-theme rounded-xl flex flex-col items-center justify-center text-text-muted hover:border-purple-500/50 transition-all">
                                                    <ImageIcon size={32} className="mb-2" />
                                                    <span className="font-bold text-sm">{t('adminAllies.form.uploadImage', 'Click para subir foto')}</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="space-y-4 pt-4 border-t border-divider-theme">
                                    <h3 className="text-sm font-black text-purple-500">{t('adminAllies.form.typeTitle', 'TIPO DE ALIADO')}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {ALLY_TYPES.map(type => {
                                            const isSelected = formData.location_type === type.value;
                                            return (
                                                <button
                                                    key={type.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, location_type: type.value })}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border
                                                        ${isSelected
                                                            ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                                                            : 'bg-bg-main text-text-sub border-border-theme hover:border-purple-500/50'}`}
                                                >
                                                    {t(type.labelKey, type.defaultLabel)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-4 border-t border-divider-theme bg-bg-pop/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSubmitting}
                                className="px-5 py-2 rounded-xl font-bold text-text-sub hover:bg-bg-sub transition text-sm"
                            >
                                {t('common.cancel', 'Cancelar')}
                            </button>
                            <button
                                type="submit"
                                form="allyForm"
                                disabled={isSubmitting}
                                className="px-6 py-2 rounded-xl font-black bg-purple-500 text-white hover:bg-purple-600 transition shadow-lg shadow-purple-500/20 flex items-center justify-center min-w-[120px] text-sm uppercase tracking-widest"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (editingAlly ? t('common.saveChanges', 'Guardar Cambios') : t('adminAllies.create', 'Crear Aliado'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
