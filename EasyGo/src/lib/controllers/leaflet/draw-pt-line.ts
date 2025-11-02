import { getLeaflet } from "@/lib/controllers/leaflet/leaflet-client";
import { PublicItineraryData } from "@/lib/controllers/Parser";

export async function drawPublicRoute(map: L.Map, data: PublicItineraryData): Promise<void> {
    const L = await getLeaflet();
    if (!L) return;

  // Default cycling colors for non-MRT modes
    const defaultColors = ["#007AFF", "#34C759", "#AF52DE", "#FF9500"];

  // MRT line colors (based on LTA official palette)
    const mrtColors: Record<string, string> = {
        NS: "#D42A2F", // North South - Red
        EW: "#009645", // East West - Green
        NE: "#9900AA", // North East - Purple
        CC: "#FA9E0D", // Circle - Yellow/Orange
        DT: "#005EC4", // Downtown - Blue
        TE: "#9D5B25", // Thomson-East Coast - Brown
        BP: "#748477", // Bukit Panjang LRT - Grey
        SE: "#748477", // Sengkang LRT - Grey
        PE: "#748477", // Punggol LRT - Grey
    };

    const allPoints: [number, number][] = [];

    data.legs.forEach((leg, i) => {
    // Determine color
    let color = defaultColors[i % defaultColors.length];

    // If it's a train leg, check if line code (e.g., NS, EW) appears in description or name
    if (leg.mode === "SUBWAY") {
        const lineMatch = leg.description.match(/\b(NS|EW|NE|CC|DT|TE|BP|SE|PE)\b/);
        if (lineMatch) {
        const lineCode = lineMatch[1] as keyof typeof mrtColors;
        if (mrtColors[lineCode]) {
            color = mrtColors[lineCode];
        }
        }
    }

    const points = leg.geometry.map((p) => [p.lat, p.lng]) as [number, number][];
    allPoints.push(...points);

    const poly = L.polyline(points, {
    color: leg.mode === "WALK" ? "#ffffff" : color, // grey if walking
    weight: leg.mode === "WALK" ? 3 : 4,
    dashArray: leg.mode === "WALK" ? "6 8" : undefined, // dotted pattern for walking
    opacity: 0.8,
    }).addTo(map);

    // Compute segment midpoint
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
            Distance: ${(leg.distance / 1000).toFixed(2)} km<br>
            </div>
        `);

        map.addLayer(legPopup);

        // Transfer markers between legs
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

            const transferPopup = L.popup()
            .setLatLng([transferPoint.lat, transferPoint.lng])
            .setContent(
                `<div style="font-size:13px; line-height:1.3;">
                <b>🔁 Transfer</b><br>
                From <b>${leg.mode}</b> → <b>${nextLeg.mode}</b>
                </div>`
            );

            // Optional: uncomment to show transfer popups by default
            // map.addLayer(transferPopup);
        }
        }
    });

    // Add start and destination markers
  // === Start marker ===
    const firstLeg = data.legs[0];
    if (firstLeg?.geometry.length) {
        const start = firstLeg.geometry[0]; // ✅ same as original
        const startCircle = L.circleMarker([start.lat, start.lng], {
        radius: 6,
        color: "#007AFF",
        fillColor: "#007AFF",
        fillOpacity: 0.8,
        }).addTo(map);

        const startPopup = L.popup({
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        offset: L.point(0, -10),
        })
        .setLatLng([start.lat, start.lng])
        .setContent("<b>Start of Journey</b>");
        map.addLayer(startPopup);
    }

    // === Destination marker ===
    const lastLeg = data.legs[data.legs.length - 1];
    if (lastLeg?.geometry.length) {
        const end = lastLeg.geometry[lastLeg.geometry.length - 1]; // ✅ same as original
        const endCircle = L.circleMarker([end.lat, end.lng], {
        radius: 6,
        color: "#FF3B30",
        fillColor: "#FF3B30",
        fillOpacity: 0.8,
        }).addTo(map);

        const endPopup = L.popup({
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        offset: L.point(0, -10),
        })
        .setLatLng([end.lat, end.lng])
        .setContent("<b>Destination</b>");
        map.addLayer(endPopup);
    }

    if (allPoints.length > 0) map.fitBounds(allPoints, { padding: [40, 40] });
}
