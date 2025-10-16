import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calCrow(lat1: number, lon1: number, lat2: number, lon2: number) {
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

function toRad(degree: number) 
{
    return degree * Math.PI / 180;
}
