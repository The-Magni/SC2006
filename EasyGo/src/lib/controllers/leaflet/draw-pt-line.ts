import { getLeaflet } from "@/lib/controllers/leaflet/leaflet-client";
import { PublicItineraryData } from "@/lib/controllers/Parser";

export async function drawPublicRoute(map: L.Map, data: PublicItineraryData): Promise<void> {
    const L = await getLeaflet();
    if (!L) return;

    const colors = ["#007AFF", "#34C759", "#AF52DE", "#FF9500", "#FF2D55"];
    const allPoints: [number, number][] = [];

    data.legs.forEach((leg, i) => {
        const color = colors[i % colors.length];
        const points = leg.geometry.map(p => [p.lat, p.lng]) as [number, number][];
        allPoints.push(...points);

        const poly = L.polyline(points, { color, weight: 4 }).addTo(map);

        // --- Compute segment midpoint ---
        const midIndex = Math.floor(points.length / 2);
        const midpoint = points[midIndex] || points[0];

        const legPopup = L.popup({
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        offset: L.point(0, -10),
        })
        .setLatLng(midpoint)
        .setContent(`
            <div style="font-size:13px; line-height:1.3;">
            <b>${leg.mode.toUpperCase()} Segment</b><br>
            ${leg.description}<br>
            Duration: ${Math.round(leg.duration / 60)} min<br>
            Distance: ${(leg.distance / 1000).toFixed(2)} km
            </div>
        `);

        map.addLayer(legPopup);

        if (i < data.legs.length - 1) {
        const nextLeg = data.legs[i + 1];
        const transferPoint = leg.geometry[leg.geometry.length - 1];
        if (transferPoint) {
            const transferMarker = L.circleMarker([transferPoint.lat, transferPoint.lng], {
            radius: 8,
            color: "#FFD60A",
            fillColor: "#FFD60A",
            fillOpacity: 1,
            }).addTo(map);

            const transferPopup = L.popup({

            })
            .setLatLng([transferPoint.lat, transferPoint.lng])
            .setContent(
                `<div style="font-size:13px; line-height:1.3;">
                <b>🔁 Transfer</b><br>
                From <b>${leg.mode}</b> → <b>${nextLeg.mode}</b>
                </div>`
            );

            //map.addLayer(transferPopup);
        }
        }
    });

    const firstLeg = data.legs[0];
    const lastLeg = data.legs[data.legs.length - 1];
    if (firstLeg?.geometry.length) {
        L.circleMarker([firstLeg.geometry[0].lat, firstLeg.geometry[0].lng], {
        radius: 6,
        color: "#007AFF",
        fillColor: "#007AFF",
        fillOpacity: 0.8,
        }).addTo(map).bindPopup("<b>Start of Journey</b>").openPopup();
    }
    if (lastLeg?.geometry.length) {
        const end = lastLeg.geometry[lastLeg.geometry.length - 1];
        L.circleMarker([end.lat, end.lng], {
        radius: 6,
        color: "#ff3b30",
        fillColor: "#ff3b30",
        fillOpacity: 0.8,
        }).addTo(map).bindPopup("<b>Destination</b>").openPopup();
    }

    if (allPoints.length > 0) map.fitBounds(allPoints, { padding: [40, 40] });
    }
