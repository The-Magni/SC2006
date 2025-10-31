"use client";

import { useEffect, RefObject } from "react";
import dynamic from "next/dynamic";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarRoute } from "@/components/app-sidebar-route"; // The new sidebar
import type { MapDisplayHandle } from "@/components/map-display";
import { drawItinerariesOnMap, clearMapOverlays } from "@/lib/controllers/leaflethelper-controller";

const MapDisplay = dynamic(() => import("@/components/map-display"), {
  ssr: false,
});

// This type should be refined to match your exact serialized ItineraryScore object
type SelectedItinerary = {
  score: number;
  itinerary: {
    userMode: string;
    totalDuration: number;
    totalDistance: number;
    totalFare: number;
    summary: string;
    viaRoute?: string;
    polylineCoords?: [number, number][]; // For driving/walking
    legs: Array<{
      mode: string;
      description: string;
      distance: number;
      geometry?: { lat: number, lng: number }[]; // For public transport
    }>;
  };
};

type LayoutRouteProps = {
  selectedItinerary: SelectedItinerary | null;
  setLayoutInURL: (layout: "search" | "default" | "route") => void;
  mapRef: RefObject<MapDisplayHandle | null>;
};

export default function LayoutRoute({
                                      selectedItinerary,
                                      setLayoutInURL,
                                      mapRef,
                                    }: LayoutRouteProps) {

  // This effect will run when the layout loads and draw the selected route on the map
  useEffect(() => {
    if (mapRef.current && selectedItinerary) {
      const drawRoute = async () => {
        const leaflet = (await import("leaflet")).default;
        const map = mapRef.current!.map;

        // Use your existing functions from leaflethelper-controller
        clearMapOverlays(map);
        // drawItinerariesOnMap expects an array, so we pass the selected one in an array
        drawItinerariesOnMap(map, [selectedItinerary.itinerary as any], leaflet);
      };
      drawRoute();
    }
  }, [selectedItinerary, mapRef]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebarRoute
        selectedItinerary={selectedItinerary}
        setLayoutInURL={setLayoutInURL}
      />
      <SidebarInset>
        {/* We remove the header/search bar for a cleaner "details" view */}
        <div className="flex flex-1 flex-col pt-0">
          <MapDisplay ref={mapRef} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}