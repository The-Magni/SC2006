import { getLeaflet } from "@/lib/controllers/leaflet/leaflet-client";
import { DrivingItineraryData } from "@/lib/controllers/Parser";

export async function drawDrivingRoute(map: L.Map, data: DrivingItineraryData) {
    const L = await getLeaflet();
    if (!L) return;
        const color = "red";
        const poly = L.polyline(data.polyLineCoords, { color, weight: 5 }).addTo(map);

        map.fitBounds(poly.getBounds(), { padding: [40, 40] });

        const start = data.polyLineCoords[0];
        const end = data.polyLineCoords[data.polyLineCoords.length - 1];
        L.marker(start).addTo(map).bindPopup("<b>Start</b>");
        L.marker(end).addTo(map).bindPopup("<b>Destination</b>");
        
            if (data.nearestCarpark && data.nearestCarpark.lat && data.nearestCarpark.lng) {
        const { name, availableLots, lat, lng } = data.nearestCarpark;

        const carparkPopup = `
        <b>🅿️ ${name}</b><br>
        Available lots: ${availableLots}
        `;

        const carparkMarker = L.marker([lat, lng], {
        icon: L.icon({
            iconUrl: "/carpark.png",
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28],
        }),
        })
        .addTo(map)
        .bindPopup(carparkPopup, {
            autoClose: false,
            closeOnClick: false,
            closeButton: false,
        })
        .openPopup();
    }
    
    poly
        .bindPopup(
        `<b>🚗 Driving Route</b><br><b>to ${data.nearestCarpark.name} Carpark</b><br/>${(data.totalDistance / 1000).toFixed(1)} km • ${(data.totalDuration / 60).toFixed(0)} min`
        , {
            autoClose: false,
            closeOnClick: false,
            closeButton: false,
        }
    
    )
        .openPopup();
}
