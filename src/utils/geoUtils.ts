/**
 * Parses PostGIS EWKB hex strings or POINT() text into [lat, lng] array.
 * 
 * Used for correctly mapping `geo_location` from the database into `lat` and `lng` properties 
 * required by Leaflet maps and location pickers.
 */
export function parseGeoLocation(geoStr: any): [number, number] | null {
    if (!geoStr) return null;
    
    if (typeof geoStr === 'string') {
        // Check for PostGIS EWKB hex string (starts with 0101000020E6100000 for SRID 4326 Point)
        if (geoStr.startsWith('0101000020E6100000')) {
            try {
                // Extract the next 16 hex chars for longitude, and next 16 for latitude
                const lngHex = geoStr.substring(18, 34);
                const latHex = geoStr.substring(34, 50);
                
                // Simple parsing for little-endian IEEE 754 double
                const parseLEDouble = (hexStr: string) => {
                    const buffer = new ArrayBuffer(8);
                    const view = new DataView(buffer);
                    for (let i = 0; i < 8; i++) {
                        view.setUint8(i, parseInt(hexStr.substring(i * 2, i * 2 + 2), 16));
                    }
                    return view.getFloat64(0, true); // true for little endian
                };
                
                const lng = parseLEDouble(lngHex);
                const lat = parseLEDouble(latHex);
                return [lat, lng];
            } catch (e) {
                console.error("Failed to parse EWKB", e);
            }
        }
        
        // Text representation POINT(lng lat)
        const match = geoStr.match(/POINT\(([-.\d]+)\s+([-.\d]+)\)/i);
        if (match) {
            // match[1] is lng, match[2] is lat
            return [parseFloat(match[2]), parseFloat(match[1])];
        }
    } else if (typeof geoStr === 'object' && geoStr.type === 'Point' && geoStr.coordinates) {
        // GeoJSON format from PostGIS
        return [geoStr.coordinates[1], geoStr.coordinates[0]];
    }
    return null;
}

/**
 * Enriches an event or ally object by parsing its `geo_location` (or `location`) 
 * field and injecting `lat` and `lng` properties into the object.
 */
export function injectLatLng<T extends { geo_location?: any, location?: any, lat?: number | null, lng?: number | null }>(item: T): T {
    const coords = parseGeoLocation(item.geo_location || item.location);
    if (coords) {
        return {
            ...item,
            lat: coords[0],
            lng: coords[1]
        };
    }
    return item;
}
