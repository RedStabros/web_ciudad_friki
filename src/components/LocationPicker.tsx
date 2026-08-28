import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, Crosshair, MapPin } from 'lucide-react';

// Custom icons using standard Leaflet styling
const createCustomIcon = (color: string) => {
    return L.divIcon({
        className: 'custom-pin-container',
        html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
                <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: absolute;"></div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
    });
};

const iconEventGold = createCustomIcon('#f59e0b');

// Component to handle map events
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

// Component to handle smart zoom and centering, but without forced centering on every render
function SmartMapController({ center }: { center: [number, number] }) {
    const map = useMap();
    const prevCenter = useRef(center);

    useEffect(() => {
        // Only center if it's the very first time, or if the external center changes significantly (e.g. from search)
        const dist = Math.abs(prevCenter.current[0] - center[0]) + Math.abs(prevCenter.current[1] - center[1]);
        if (dist > 0.001) {
            map.flyTo(center, 15, { animate: true, duration: 0.5 });
            prevCenter.current = center;
        }
    }, [center, map]);

    return null;
}

interface LocationPickerProps {
    initialLat?: number | null;
    initialLng?: number | null;
    onLocationChange: (lat: number, lng: number) => void;
    onAddressFound?: (address: string) => void;
}

export function LocationPicker({ initialLat, initialLng, onLocationChange, onAddressFound }: LocationPickerProps) {
    const { t } = useTranslation();
    const defaultCenter: [number, number] = [6.2442, -75.5812]; // Medellín
    
    const [center, setCenter] = useState<[number, number]>(
        initialLat && initialLng ? [initialLat, initialLng] : defaultCenter
    );
    const [markerPos, setMarkerPos] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : null
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
        setMarkerPos([lat, lng]);
        onLocationChange(lat, lng);
        
        // Reverse Geocoding
        if (onAddressFound) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await res.json();
                if (data && data.display_name) {
                    onAddressFound(data.display_name);
                }
            } catch (error) {
                console.error('Reverse Geocoding error:', error);
            }
        }
    }, [onLocationChange, onAddressFound]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        if (val.trim().length > 3) {
            debounceTimer.current = setTimeout(() => {
                performSearch(val);
            }, 400); // 400ms debounce
        }
    };

    const performSearch = async (query: string) => {
        setIsSearching(true);
        try {
            // Use Nominatim for search, as Google Places requires billing setup/keys which are avoided for cost zero
            // (If strict Google Places is needed, it would be replaced here using Places Service)
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                setCenter([lat, lng]);
                handleLocationSelect(lat, lng);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const getMapTileUrl = () => 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const [isDarkMode, setIsDarkMode] = useState<boolean>(document.documentElement.getAttribute('data-theme') === 'dark-friki');

    useEffect(() => {
        const observer = new MutationObserver(() => setIsDarkMode(document.documentElement.getAttribute('data-theme') === 'dark-friki'));
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    const handleLocateMe = (e: React.MouseEvent) => {
        e.preventDefault();
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setCenter([lat, lng]);
                    handleLocationSelect(lat, lng);
                },
                (error) => {
                    console.error("Location error:", error);
                    alert(t('events.errors.locationDenied', 'No se pudo obtener la ubicación.'));
                }
            );
        }
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={t('common.search', 'Buscar lugar...')}
                    className="w-full bg-bg-sub border border-border-theme text-text-main rounded-xl pl-10 px-4 py-2.5 focus:ring-2 focus:ring-brand-primary outline-none shadow-sm text-sm"
                />
            </div>
            
            <div className={`w-full h-[250px] rounded-xl overflow-hidden border border-border-theme z-0 relative ${isDarkMode ? 'ingress-theme' : ''}`}>
                <button
                    onClick={handleLocateMe}
                    className="absolute top-2 right-2 z-[1000] w-10 h-10 bg-bg-side/90 backdrop-blur-md border border-border-theme rounded-full flex items-center justify-center text-text-main shadow-lg hover:bg-bg-sub transition"
                    title={t('common.myLocation', 'Mi ubicación')}
                >
                    <Crosshair size={18} />
                </button>
                <MapContainer 
                    center={center} 
                    zoom={markerPos ? 15 : 12} 
                    scrollWheelZoom={true} 
                    className="w-full h-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url={getMapTileUrl()}
                    />
                    <MapEvents onLocationSelect={handleLocationSelect} />
                    <SmartMapController center={center} />
                    
                    {markerPos && (
                        <Marker 
                            position={markerPos} 
                            icon={iconEventGold}
                        />
                    )}
                </MapContainer>
            </div>
            <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-text-muted">{t('events.mapInstructions', 'Haz clic en el mapa para ajustar la ubicación exacta.')}</p>
                {markerPos && (
                    <span className="flex items-center gap-1 text-[10px] text-brand-primary font-bold uppercase tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded-full">
                        <MapPin size={10} /> {t('adminAllies.form.pinPlaced', 'Pin ubicado')}
                    </span>
                )}
            </div>
        </div>
    );
}
