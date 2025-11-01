import { useEffect, RefObject } from "react";
import dynamic from "next/dynamic";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebarSearch } from "@/components/app-sidebar-search"
import type { MapDisplayHandle } from "@/components/map-display";
import type { OneMapSearchResult } from "@/lib/onemap/onemapAutoFill";

const MapDisplay = dynamic(() => import("@/components/map-display"), {
  ssr: false,
});

type LayoutSearchProps = {
  options: OneMapSearchResult[];
  loading: boolean;
  debouncedFetch: (value: string) => void;
  setOptions: React.Dispatch<React.SetStateAction<OneMapSearchResult[]>>;
  setLayoutInURL: (layout: "default" | "search" | "routes" | "signup" | "login" | "profile") => void;
  setStartValue: (value: OneMapSearchResult | null) => void;
  setEndValue: (value: OneMapSearchResult | null) => void;
  startValue: OneMapSearchResult | null;
  endValue: OneMapSearchResult | null;
  mapRef: RefObject<MapDisplayHandle | null>;
};


export default function LayoutSearch(
  {
    options,
    loading,
    debouncedFetch,
    setOptions,
    setLayoutInURL,
    setStartValue,
    setEndValue,
    startValue,
    endValue,
    mapRef
  }: LayoutSearchProps
) {
  useEffect(() => {
    if (endValue) {
      if (startValue) {
        // Get routes and plot polyline here @John
      } else {
        mapRef.current?.panTo(parseFloat(endValue.LATITUDE), parseFloat(endValue.LONGITUDE), endValue.ADDRESS)
      }
    }
  }, [startValue, endValue, mapRef]); // Dependencies: Only run when 'startValue', 'endValue', 'mapRef' change

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "400px",
        } as React.CSSProperties
      }
    >
      {/* Need to pass routing data into AppSidebarSearch @John */}
      <AppSidebarSearch
        options = {options}
        loading = {loading}
        debouncedFetch = {debouncedFetch}
        setOptions = {setOptions}
        setLayoutInURL = {setLayoutInURL}
        setStartValue = {setStartValue}
        setEndValue = {setEndValue}
        startValue = {startValue}
        endValue = {endValue}
        mapRef = {mapRef}
      />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
          <SidebarTrigger className="-ml-1" />
        </header>

        <div className="flex flex-1 flex-col pt-0">
          <MapDisplay ref={mapRef} setLayoutInURL={setLayoutInURL} setStartValue={setStartValue} setEndValue={setEndValue} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
