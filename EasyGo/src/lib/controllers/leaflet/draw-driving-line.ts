import { Incident } from "@/lib/boundary/ExternalApiHandler";
import { getLeaflet } from "@/lib/controllers/leaflet/leaflet-client";
import { DrivingItineraryData } from "@/lib/controllers/Parser";

export async function drawDrivingRoute(map: L.Map, data: DrivingItineraryData) {
    const L = await getLeaflet();
    if (!L) return;
        const color = "red";
        const poly = L.polyline(data.polyLineCoords, { color, weight: 5 }).addTo(map);

        map.fitBounds(poly.getBounds(), { padding: [40, 40] });

    const start = data.polyLineCoords[0];
    if (start) {
        const startCircle = L.circleMarker(start, {
        radius: 6,
        color: "#34C759",
        fillColor: "#34C759",
        fillOpacity: 0.85,
        }).addTo(map);

        const startPopup = L.popup({
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        offset: L.point(0, -10),
        })
        .setLatLng(start)
        .setContent("<b>Start of Drive</b>");

        map.addLayer(startPopup);
    }

    // ====== Circle End Marker ======
    const end = data.polyLineCoords[data.polyLineCoords.length - 1];
    if (end) {
        const endCircle = L.circleMarker(end, {
        radius: 6,
        color: "#FF3B30",
        fillColor: "#FF3B30",
        fillOpacity: 0.85,
        }).addTo(map);

        const endPopup = L.popup({
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        offset: L.point(0, -10),
        })
        .setLatLng(end)
        .setContent("<b>Destination</b>");

        map.addLayer(endPopup);
    }

        

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
    

            // --- Add Incident Icons ---
        if (data.incidents && data.incidents.length > 0) {
            const warningIcon = L.icon({
            iconUrl: "https://cdn-icons-png.flaticon.com/512/564/564619.png", 
            iconSize: [26, 26],
            iconAnchor: [13, 26],
            popupAnchor: [0, -24],
            });

            for (const incident of data.incidents) {
            const { Latitude, Longitude, Type, Message } = incident as Incident;

            const popupContent = `
                <b>${Type}</b><br>
                ${Message}<br>
                <small>(${Latitude.toFixed(4)}, ${Longitude.toFixed(4)})</small>
            `;

            L.marker([Latitude, Longitude], { icon: warningIcon })
                .addTo(map)
                .bindPopup(popupContent, {
                autoClose: false,
                closeOnClick: true,
                closeButton: true,
                });
            }
        }
    const popupDescription =   data.nearestCarpark && !(data.nearestCarpark.lat === 0 && data.nearestCarpark.lng === 0)
        ? `<b>🚗 Driving Route</b><br><b>to ${data.nearestCarpark.name} Carpark</b><br>${(data.totalDistance / 1000).toFixed(1)} km • ${(data.totalDuration / 60).toFixed(0)} min`
        : `<b>🚗 Driving Route (Direct)</b><br>${(data.totalDistance / 1000).toFixed(1)} km • ${(data.totalDuration / 60).toFixed(0)} min`;
    poly
        .bindPopup(
            popupDescription
        , {
            autoClose: false,
            closeOnClick: false,
            closeButton: false,
        }
    
    )
        .openPopup();
}
