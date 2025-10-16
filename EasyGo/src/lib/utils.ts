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
