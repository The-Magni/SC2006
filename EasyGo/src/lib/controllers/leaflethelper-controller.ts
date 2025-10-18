
export interface LatLng {
  lat: number
  lng: number
}


export function decodePolyline(encoded: string): LatLng[] {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates: LatLng[] = []

  while (index < encoded.length) {
    let b, shift = 0, result = 0

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1)
    lat += deltaLat

    // Decode longitude
    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1)
    lng += deltaLng

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return coordinates
}
import type { DrivingItinerary } from "@/lib/entityclass/DrivingItinerary"
import type { PublicItinerary } from "@/lib/entityclass/PublicItinerary"
import type { BaseItinerary } from "@/lib/entityclass/BaseItinerary"


export async function initLeafletMap(mapContainerId: string): Promise<L.Map> {
  const leaflet = await import("leaflet")

  const map = leaflet.map(mapContainerId, {
    center: [1.3521, 103.8198],
    zoom: 13,
  })

  leaflet
    .tileLayer("https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png", {
      detectRetina: true,
      maxZoom: 19,
      minZoom: 11,
      attribution:
        '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;vertical-align:middle;"/>&nbsp;' +
        '<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;' +
        '<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>',
    })
    .addTo(map)

  return map
}

/**
 * Clears all drawn polylines and markers, keeping only the base tile layer.
 */
export async function clearMapOverlays(map: L.Map) {
  const leaflet = await import("leaflet")
  map.eachLayer((layer) => {
    if (!(layer instanceof L.TileLayer)) map.removeLayer(layer)
  })
}
export async function drawItinerariesOnMap(
  map: L.Map,
  itineraries: BaseItinerary[],
  leaflet: any,
  colorScheme = {
    drive: "red",
    public: ["#007AFF", "#34C759", "#AF52DE", "#FF9500"],
  }
) {
  
  if (!map || !leaflet) return

  // Clear existing overlays before redrawing
  await clearMapOverlays(map)
  console.log(itineraries)

  const itiList = Array.isArray(itineraries) ? itineraries : [itineraries]
  const driveColors = ["#FF3B30", "#34C759", "#007AFF", "#FF9500", "#AF52DE"]
  let itiIndex = 0
  itiList.forEach((iti, i) => {
    itiIndex++

    //Driving has their polyline per itinerary, public trnasport has polylines per leg
    //hence need to split

    // Detect Driving Itinerary 
if (iti.userMode == "drive") {
      const driving = iti as DrivingItinerary
      const color = driveColors[i % driveColors.length]

      const polyline = L.polyline(driving.polylineCoords, {
        color,
        weight: 5,
        opacity: 0.8,
      }).addTo(map)

      // Add label popup
      const label =
        driving.userMode === "fastest"
          ? "🚗 Fastest Route"
          : driving.userMode === "shortest"
          ? "🛣️ Shortest Route"
          : driving.userMode?.startsWith("alternative")
          ? `🧭 ${driving.userMode.replace("_", " ")}`
          : "🚘 Driving Route " + itiIndex

polyline.bindTooltip(
  `<b>${label}</b><br>${(driving.totalDistance / 1000).toFixed(1)} km • ${(driving.totalDuration / 60).toFixed(0)} min
  <div>via ${driving.viaRoute}</div>`,
  {
    permanent: true,
    direction: "center",
    className: "route-label-tooltip",
    offset: L.point(0, 0),
  }
).openTooltip()
      // Zoom to fit all
      if (i === 0) map.fitBounds(polyline.getBounds())

      // Add markers for start and end points
      const start = driving.polylineCoords[0]
      const end = driving.polylineCoords[driving.polylineCoords.length - 1]
      if (start && end) {
        L.marker(start).addTo(map).bindPopup(`<b>Start</b>`)
        L.marker(end).addTo(map).bindPopup(`<b>Destination</b>`)
      }
    }



    // Detect Public Transport Itinerary (multiple legs)
    else if (iti.userMode == "pt")  {
      const publicIti = iti as any as PublicItinerary
      publicIti.legs.forEach((leg: any, j: number) => {
        if (!leg.geometry) return
        const points = leg.geometry.map((p: any) => [p.lat, p.lng]) as [number, number][]
        const color = colorScheme.public[j % colorScheme.public.length]

        const poly = leaflet.polyline(points, { color, weight: 4 }).addTo(map)
        poly.bindPopup(
          `<b>Itinerary ${itiIndex} - Leg ${j + 1}</b><br>${leg.mode ?? "Walk"}<br>${leg.description ?? ""}`
        )
      })
    }


    //walking draw polyline
    else if (iti.userMode == "walk") {
      console.log("i am walking")
      const color = iti.userMode === "walk" ? "green" : "blue"
      const poly = leaflet.polyline(iti.polylineCoords, { color, weight: 4 }).addTo(map)
      poly.bindPopup(`${iti.userMode} – ${iti.summary}`, { autoClose: false }).openPopup()
    }

  })

  //Auto-fit map to all polylines
  const allPoints: [number, number][] = []
  itiList.forEach((it) => {
    if ("polylineCoords" in it && Array.isArray((it as any).polylineCoords)) {
      allPoints.push(...(it as any).polylineCoords)
    } else if ("legs" in it && Array.isArray((it as any).legs)) {
      ;(it as any).legs.forEach((l: any) => {
        if (l.geometry) allPoints.push(...l.geometry.map((p: any) => [p.lat, p.lng]))
      })
    }
  })
  if (allPoints.length > 0) map.fitBounds(leaflet.latLngBounds(allPoints))
}