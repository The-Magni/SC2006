import * as L from "leaflet";

export function fitToAll(map: L.Map, coords: [number, number][][]) {
    const allPoints = coords.flat();
    if (allPoints.length) map.fitBounds(L.latLngBounds(allPoints));
}
