import { MapDisplayHandle } from "@/components/map-display"
import { OneMapDrivingRouteResponse} from "@/lib/onemap/deserializedClasses/dzDrivingRoutes";
import { OneMapPTResponse} from "@/lib/onemap/deserializedClasses/dzPtRoutes";
import { OneMapWalkingRouteResponse} from "@/lib/onemap/deserializedClasses/dzWalkRoutes";

type OneMapAnyResponse = OneMapPTResponse | OneMapDrivingRouteResponse | OneMapWalkingRouteResponse;

export async function getRoute(
    start: [number, number],
    end: [number, number],
    mode: "pt" | "drive" | "walk" | "cycle" = "pt"
) {
    const [startLat, startLng] = start
    const [endLat, endLng] = end

    const now = new Date()
    const date = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`
    const curtime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`

    let url = ""

    if (mode === "pt") {

        url =
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/onemap/route?start=${startLat},${startLng}` +
            `&end=${endLat},${endLng}` +
            `&routeType=pt` +
            `&date=${date}` +
            `&time=${curtime}` + 
            `&mode=TRANSIT` +
            `&maxWalkDistance=2000` +
            `&numItineraries=5`
    } else {

        url =
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/onemap/route?start=${startLat},${startLng}` +
            `&end=${endLat},${endLng}` +
            `&routeType=${mode}` +
            `&numItineraries=5`

    }

    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include'
    });
    if (!res.ok) {
        const errText = await res.text()
        console.error(`OneMap API failed: ${res.status} →`, errText)
        throw new Error(`OneMap API failed (${res.status})`)
    }

    return await res.json() as OneMapAnyResponse
}
