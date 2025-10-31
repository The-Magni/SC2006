import "leaflet/dist/leaflet.css";


let L: typeof import("leaflet") | null = null;

export async function getLeaflet() {
  if (typeof window === "undefined") return null;
  if (!L) {
    L = await import("leaflet");
    await import("leaflet");
  }
  return L;
}
