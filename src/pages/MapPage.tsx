import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { EventService, type FrikiEvent } from '../services/EventService';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/SEO';
import { EventDetailsModal } from '../components/EventDetailsModal';
import { Loader2, X, SlidersHorizontal, Crosshair, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { parseGeoLocation } from '../utils/geoUtils';

// Custom icons using standard Leaflet styling to emulate the app pins
const createCustomIcon = (color: string, iconUrl?: string) => {
    return L.divIcon({
        className: 'custom-pin-container',
        html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: absolute;"></div>
                ${iconUrl ? `<img src="${iconUrl}" style="width: 16px; height: 16px; z-index: 10; border-radius: 50%; object-fit: cover;" />` : ''}
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
    });
};

const iconEventGold = createCustomIcon('#f59e0b'); // Gold — events
const allyIcons: Record<string, L.DivIcon> = {
    STORE: createCustomIcon('#f97316'),         // Orange — Tienda Friki
    GAMING_CENTER: createCustomIcon('#8b5cf6'), // Purple — Centro Gaming
    CULTURAL: createCustomIcon('#06b6d4'),      // Cyan — Cultural
    FOOD: createCustomIcon('#ef4444'),          // Red — Comida
    EVENT_VENUE: createCustomIcon('#10b981'),   // Green — Sedes
    DEFAULT: createCustomIcon('#8b5cf6')
};

// Map Controller for imperative actions and events
function MapController({ center, onMoveEnd }: { center: [number, number], onMoveEnd: () => void }) {
    const map = useMap();
    
    // FlyTo when center changes
    useEffect(() => {
        if (center[0] !== map.getCenter().lat || center[1] !== map.getCenter().lng) {
            map.flyTo(center, 15, { duration: 1.5 });
        }
    }, [center, map]);

    // Debounce moveend
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const handleMoveEnd = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                onMoveEnd();
            }, 400);
        };
        map.on('moveend', handleMoveEnd);
        return () => {
            map.off('moveend', handleMoveEnd);
            clearTimeout(timeout);
        };
    }, [map, onMoveEnd]);

    return null;
}

export default function MapPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [events, setEvents] = useState<FrikiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<FrikiEvent | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'events' | 'allies'>('all');
    const [isFrikiMode, setIsFrikiMode] = useState(true);
    const navigate = useNavigate();
    
    // Default center (can be user's location or city center)
    const [center, setCenter] = useState<[number, number]>([6.2442, -75.5812]); // Medellín as default

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            // Load active events (upcoming + past active)
            const { events: eventData } = await EventService.getFeedEvents(user?.id, 0, 100, 'upcoming');
            
            // Load allies from sponsored_locations
            const { data: allyData } = await supabase
                .from('sponsored_locations')
                .select('*')
                .eq('is_active', true);

            const mappedAllies = (allyData || []).map(loc => ({
                id: loc.id,
                title: loc.name,
                description: loc.description,
                location: loc.address_text,
                geo_location: loc.location,
                banner_url: loc.image_url,
                image_url: loc.image_url,
                tags: ['aliado', loc.location_type],
                is_sponsored: true,
                date: '2020-01-01',
                end_date: '2099-12-31',
                is_free: true,
                price_min: 0,
                status: 'approved',
            } as FrikiEvent));

            setEvents([...(eventData || []), ...mappedAllies]);
        } catch (error) {
            console.error("Error loading map data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkerClick = (event: FrikiEvent) => {
        setSelectedEvent(event);
    };

    const handleViewDetails = () => {
        setIsDetailsModalOpen(true);
    };

    const handleLocateMe = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Update center state, which will trigger MapController to flyTo
                    setCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error("Location error:", error);
                    alert(t('events.errors.locationDenied', 'No se pudo obtener la ubicación. Verifica los permisos de tu navegador.'));
                }
            );
        }
    };

    const handleMapMoveEnd = () => {
        // Triggered after 400ms debounce
        // Could be used to re-fetch events within map bounds if implemented
    };

    // Normal Mode = Positron (Light) base + No filter
    // Friki Mode = Dark Matter (Dark) base + Custom Cyberpunk Filter
    const tileUrl = isFrikiMode 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    const filteredEvents = events.filter(e => {
        const isAlly = e.tags?.includes('aliado');
        if (activeFilter === 'events') return !isAlly;
        if (activeFilter === 'allies') return isAlly;
        return true;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden relative">
            <SEO 
                title={t('nav.map', 'Mapa Friki')}
                description={t('map.seoDescription')}
            />
            
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-main/50 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-brand-primary" size={48} />
                </div>
            )}

            <div className={`flex-1 w-full relative z-0 ${isFrikiMode ? 'ingress-theme' : ''}`}>
                {/* Custom Overlay UI */}
                <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <div className="pointer-events-auto flex flex-col gap-3">
                            <div className="bg-bg-side/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-border-theme shadow-lg inline-block">
                                <h1 className="font-black text-lg text-text-main leading-none">{t('nav.map', 'Mapa Mundo Friki')}</h1>
                            </div>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                                    className="w-12 h-12 bg-bg-side/90 backdrop-blur-md border border-border-theme rounded-full flex items-center justify-center text-text-main shadow-lg hover:bg-bg-sub transition"
                                >
                                    <SlidersHorizontal size={20} />
                                </button>
                                
                                {filterMenuOpen && (
                                    <div className="absolute top-14 left-0 bg-bg-side border border-border-theme rounded-xl shadow-xl w-56 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        <button onClick={() => {setActiveFilter('all'); setFilterMenuOpen(false)}} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 hover:bg-bg-sub ${activeFilter === 'all' ? 'text-brand-primary' : 'text-text-main'}`}>
                                            <div className="w-3 h-3 rounded-full bg-text-muted"></div>
                                            {t('dashboard.filter.all', 'Todos')}
                                        </button>
                                        <button onClick={() => {setActiveFilter('events'); setFilterMenuOpen(false)}} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 hover:bg-bg-sub ${activeFilter === 'events' ? 'text-amber-500' : 'text-text-main'}`}>
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                            {t('events.onlyEvents', 'Solo Eventos')}
                                        </button>
                                        <button onClick={() => {setActiveFilter('allies'); setFilterMenuOpen(false)}} className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-3 hover:bg-bg-sub ${activeFilter === 'allies' ? 'text-purple-500' : 'text-text-main'}`}>
                                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                            {t('events.onlyAllies', 'Solo Aliados')}
                                        </button>
                                        
                                        <div className="h-px bg-border-theme my-2 mx-4"></div>
                                        
                                        <button onClick={() => {setIsFrikiMode(!isFrikiMode); setFilterMenuOpen(false)}} className="w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between hover:bg-bg-sub text-text-main">
                                            <span>{isFrikiMode ? t('map.normalMode', 'Modo Normal') : t('map.frikiMode', 'Modo Friki')}</span>
                                            <div className={`w-8 h-4 rounded-full relative transition-colors ${isFrikiMode ? 'bg-brand-primary' : 'bg-bg-main'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isFrikiMode ? 'left-4.5 right-0.5' : 'left-0.5'}`} style={{ [isFrikiMode ? 'right' : 'left']: '2px' }}></div>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pointer-events-auto flex flex-col gap-3">
                            <button 
                                onClick={() => navigate(-1)}
                                className="w-12 h-12 bg-bg-side/90 backdrop-blur-md border border-border-theme rounded-full flex items-center justify-center text-text-main shadow-lg hover:bg-bg-sub transition"
                            >
                                <X size={20} />
                            </button>
                            <button 
                                onClick={handleLocateMe}
                                className="w-12 h-12 bg-bg-side/90 backdrop-blur-md border border-border-theme rounded-full flex items-center justify-center text-text-main shadow-lg hover:bg-bg-sub transition"
                            >
                                <Crosshair size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Map Legend — bottom-left */}
                <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
                    <div className="bg-bg-side/90 backdrop-blur-md border border-border-theme rounded-xl shadow-lg px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted space-y-1.5">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                            <span>{t('nav.events', 'Eventos')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#f97316' }} />
                            <span>{t('map.legend.store', 'Tienda Friki')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#8b5cf6' }} />
                            <span>{t('map.legend.gaming', 'Centro Gaming')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#06b6d4' }} />
                            <span>{t('map.legend.cultural', 'Cultural')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#ef4444' }} />
                            <span>{t('map.legend.food', 'Comida')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#10b981' }} />
                            <span>{t('map.legend.venue', 'Sedes')}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Sheet Card */}
                {selectedEvent && (
                    <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-auto animate-in slide-in-from-bottom-4">
                        <div 
                            onClick={handleViewDetails}
                            className="bg-bg-side/95 backdrop-blur-xl border border-border-theme shadow-2xl rounded-2xl overflow-hidden cursor-pointer hover:border-brand-primary transition flex items-center max-w-lg mx-auto"
                        >
                            {selectedEvent.banner_url && (
                                <img src={selectedEvent.banner_url} alt={selectedEvent.title} className="w-24 h-24 object-cover" />
                            )}
                            <div className="flex-1 p-4">
                                <h3 className="font-black text-sm text-text-main leading-tight mb-1">{selectedEvent.title}</h3>
                                <p className="text-xs text-text-muted line-clamp-1">{selectedEvent.description}</p>
                            </div>
                            <div className="p-4 text-text-muted">
                                <ChevronRight size={24} />
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(null); }}
                                className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                <MapContainer 
                    center={center} 
                    zoom={14} 
                    scrollWheelZoom={true} 
                    className="w-full h-full"
                    zoomControl={false}
                >
                    <MapController center={center} onMoveEnd={handleMapMoveEnd} />
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url={tileUrl}
                    />
                    
                    {filteredEvents.map((event) => {
                        const coords = parseGeoLocation(event.geo_location);
                        if (!coords) return null;

                        const isAlly = event.tags?.includes('aliado');
                        let icon = iconEventGold;
                        if (isAlly) {
                            const allyType = event.tags?.find(t => Object.keys(allyIcons).includes(t));
                            icon = allyType ? allyIcons[allyType] : allyIcons.DEFAULT;
                        }

                        return (
                            <Marker 
                                key={event.id} 
                                position={coords} 
                                icon={icon}
                                eventHandlers={{
                                    click: () => handleMarkerClick(event),
                                }}
                            />
                        );
                    })}
                </MapContainer>
            </div>
            
            <EventDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                event={selectedEvent}
                onLikeToggle={() => {}}
                onSaveToggle={() => {}}
            />
            
            <style>{`
                .leaflet-container {
                    background: var(--bg-primary);
                }
                
                /* Ingress / Cyberpunk Dark Theme Effect */
                /* Mathematical extraction of secondary streets from dark_all:
                   - Background is RGB 34. Secondary streets are RGB 42. Main are RGB 51.
                   - brightness(310%) shifts secondary streets to ~130 (just above 50% contrast midpoint).
                   - contrast(400%) pushes background down to dark cyan, secondary up to bright cyan, main to neon. */
                .ingress-theme .leaflet-tile {
                    filter: brightness(310%) contrast(400%) sepia(100%) hue-rotate(130deg) saturate(500%) brightness(0.8);
                }
            `}</style>
        </div>
    );
}
