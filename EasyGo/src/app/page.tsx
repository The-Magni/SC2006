"use client"

import { type OneMapSearchResult, fetchResults } from "@/lib/onemap/onemapAutoFill"
import { useState, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import LayoutDefault from "@/components/layout-default";
import LayoutSearch from "@/components/layout-search";
import LayoutRoutes from "@/components/layout-routes";
import LayoutSignup from "@/components/layout-signup";
import LayoutLogin from "@/components/layout-login";
import LayoutProfile from "@/components/layout-profile";
import LayoutResetPw from "@/components/layout-reset-pw";
import type { MapDisplayHandle } from "@/components/map-display";
import debounce from "lodash/debounce"


export default function Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const layout = searchParams.get("layout") || "default" // Default if missing
  const [startValue, setStartValue] = useState<OneMapSearchResult | null>(null)
  const [endValue, setEndValue] = useState<OneMapSearchResult | null>(null)
  const mapRef = useRef<MapDisplayHandle | null>(null)

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
  } else if (layout === "routes") {
    return (
      <LayoutRoutes
        options = {options}
        loading = {loading}
        debouncedFetch = {debouncedFetch}
        setOptions = {setOptions}
        setLayoutInURL = {setLayoutInURL}
        setStartValue = {setStartValue}
        setEndValue = {setEndValue}
        mapRef = {mapRef}
      />
    );
  } else if (layout === "signup") {
    return (
      <LayoutSignup />
    )
  } else if (layout === "login") {
    return (
      <LayoutLogin />
    )
  } else if (layout === "profile") {
    return (
      <LayoutProfile />
    );
  } else if (layout === 'reset-pw') {
    return (
      <LayoutResetPw />
    )
  } else {
    return (
      <LayoutDefault
        options = {options}
        loading = {loading}
        debouncedFetch = {debouncedFetch}
        setOptions = {setOptions}
        setLayoutInURL = {setLayoutInURL}
        setStartValue = {setStartValue}
        setEndValue = {setEndValue}
        mapRef = {mapRef}
      />
    )
  }
}
