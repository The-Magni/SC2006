import { getLeaflet } from "@/lib/controllers/leaflet/leaflet-client";
import { WalkingItineraryData } from "@/lib/controllers/Parser";

export async function drawWalkingRoute(map: L.Map, data: WalkingItineraryData): Promise<void> {
    const L = await getLeaflet();
    if (!L) return;

    // Draw walking path
    const poly = L.polyline(data.polyLineCoords, { color: "green", weight: 4 }).addTo(map);

    // Find midpoint of the path
    const midIndex = Math.floor(data.polyLineCoords.length / 2);
    const midpoint = data.polyLineCoords[midIndex] || data.polyLineCoords[0];

    // Popup at midpoint (always open)
    const popup = L.popup({
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        offset: L.point(0, -10),
    })
        .setLatLng(midpoint)
        .setContent(`
        <div style="font-size:13px; line-height:1.3;">
            <b>🚶 Walking Route</b><br>
            Distance: ${(data.totalDistance / 1000).toFixed(2)} km<br>
            Duration: ${(data.totalDuration / 60).toFixed(0)} min
        </div>
        `);

    map.addLayer(popup);

    // Start marker
    if (data.polyLineCoords.length > 0) {
        L.circleMarker(data.polyLineCoords[0], {
        radius: 6,
        color: "#34C759",
        fillColor: "#34C759",
        fillOpacity: 0.8,
        })
        .addTo(map)
        .bindPopup("<b>Start of Walk</b>")
        .openPopup();
    }

    // End marker
    const end = data.polyLineCoords[data.polyLineCoords.length - 1];
    if (end) {
        L.circleMarker(end, {
        radius: 6,
        color: "#FF3B30",
        fillColor: "#FF3B30",
        fillOpacity: 0.8,
        })
        .addTo(map)
        .bindPopup("<b>Destination</b>")
        .openPopup();
    }

    // Auto-fit map
    map.fitBounds(data.polyLineCoords, { padding: [40, 40] });
}
