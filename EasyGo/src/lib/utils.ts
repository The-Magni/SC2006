import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LatLng } from "./entityclass/RouteLeg";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calCrow(lat1: number, lon1: number, lat2: number, lon2: number) { // calculate distance based on lat long
      const R = 6371; // km
      const dLat = toRad(lat2-lat1);
      const dLon = toRad(lon2-lon1);
      lat1 = toRad(lat1);
      lat2 = toRad(lat2);

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c;
      return d;
}

export function getNearestLocation(locations: [number, number][], geometry: LatLng[]) {
    const totalDistances = locations.map(location => calDistance(location[0], location[1], geometry));
    const minTotalDistance = Math.min(...totalDistances);
    const minIndex = totalDistances.indexOf(minTotalDistance);
    return locations[minIndex];
}

export function calDistancePointLine(pointLat: number, pointLon: number,
	lineLat1: number, lineLon1: number, lineLat2: number, lineLon2: number
): number {
	const reFlat = (pointLat + lineLat1 + lineLat2) / 3;
	const [x0, y0] = latLon2xy(pointLat, pointLon, reFlat);
	const [x1, y1] = latLon2xy(lineLat1, lineLon1, reFlat);
	const [x2, y2] = latLon2xy(lineLat2, lineLon2, reFlat);

	// line equation
	const A = y2 - y1;
	const B = x1 - x2;
	const C = -A * x1 - B * y1;
	return Math.abs(A*x0 + B*y0 + C) / Math.sqrt(A*A + B*B);
}

export function getStopNumber(trainStop: string) {
	return parseInt(trainStop.match(/\d+/)?.[0] || '');
}

function latLon2xy(lat: number, lon: number, reFlat: number): [number, number] {
	const R = 6371; // km
	const x = R * toRad(lon) * Math.cos(toRad(reFlat));
	const y = R * toRad(lat);
	return [x, y];
}

function calDistance(lat: number, long: number, geometry: LatLng[]): number {
    let totalDistance = 0;
    geometry.forEach(point => {
        const distance = calCrow(lat, long, point.lat, point.lng);
        totalDistance += distance;
    });
    return totalDistance;
}

function toRad(degree: number) 
{
    return degree * Math.PI / 180;
}
