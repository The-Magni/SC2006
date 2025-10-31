"use client"

import { type OneMapSearchResult, fetchResults } from "@/lib/onemap/onemapAutoFill"
import { useState, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import LayoutDefault from "@/components/layout-default";
import LayoutSearch from "@/components/layout-search";
import LayoutRoute from "@/components/layout-route";
import SignupForm from "@/components/layout-signup";
import LoginForm from "@/components/layout-login";
import type { MapDisplayHandle } from "@/components/map-display";
import debounce from "lodash/debounce"

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
    legs: Array<{
      mode: string;
      description: string;
      distance: number;
    }>;
  };
};

export default function Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const layout = searchParams.get("layout") || "default" // default if missing
  const [startValue, setStartValue] = useState<OneMapSearchResult | null>(null)
  const [endValue, setEndValue] = useState<OneMapSearchResult | null>(null)
  const mapRef = useRef<MapDisplayHandle | null>(null)

  // --- 2. Add state for the selected route ---
  const [selectedItinerary, setSelectedItinerary] = useState<SelectedItinerary | null>(null);

  // OneMap auto-complete function
  const [options, setOptions] = useState<OneMapSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  // Debounce to prevent API spamming
  const debouncedFetch = useMemo(
    () =>
      debounce(async (val: string) => {
        if (!val || val.length < 2) return
        setLoading(true)
        try {
          const results = await fetchResults(val)
          setOptions(results)
        } catch (err) {
          console.error("Search error:", err)
        } finally {
          setLoading(false)
        }
      }, 400),
    []
  )

  const setLayoutInURL = (nextLayout: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("layout", nextLayout)
    router.push(`?${params.toString()}`)
  }

  if (layout === "search") {
    return (
      <LayoutSearch
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
    )
  } else if (layout === "route") {
    return (
      <LayoutRoute
        selectedItinerary = {selectedItinerary}
        setLayoutInURL = {setLayoutInURL}
        mapRef = {mapRef}
      />
    );
  } else if (layout === "signup") {
    return (
      <SignupForm />
    )
  } else if (layout === "login") {
    return (
      <LoginForm />
    )
  } else {
    return (
      <LayoutDefault
        options = {options}
        loading = {loading}
        debouncedFetch = {debouncedFetch}
        setOptions = {setOptions}
        setLayoutInURL = {setLayoutInURL}
        setEndValue = {setEndValue}
        mapRef = {mapRef}
      />
    )
  }
}
