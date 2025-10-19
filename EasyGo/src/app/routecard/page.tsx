"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import {
  initLeafletMap,
  drawItinerariesOnMap,
} from "@/lib/controllers/leaflethelper-controller"

const LeafletPromise = import("leaflet")

export default function Page() {
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      initLeafletMap("mapdiv").then((map) => {
        mapRef.current = map
      })
    }
  }, [])

  async function test() {
    if (!mapRef.current) {
      console.warn("Map not initialized yet!")
      return
    }

    const response = await fetch("/api/test-convenience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: [1.397055, 103.747498],
        end: [1.2654, 103.8203],
        filterData: {
          durationWeight: 1,
          walkingDistanceWeight: 1,
          noTransferWeight: 1,
          carparkAvailabilityWeight: 1,
          busWaitTimeWeight: 1,
          platformDensityWeight: 1,
          fareWeight: 1,
        },
      }),
    })

    if (!response.ok) {
      console.error("API request failed:", response.statusText)
      return
    }

    const data = await response.json()
    console.log("Fetched itineraries:", data)

    const leaflet = (await LeafletPromise).default

    drawItinerariesOnMap(
      mapRef.current,
      [...data.driving, ...data.public, ...data.walking],
      leaflet
    )
  }

  return (
    <>
      <Button onClick={test} variant="secondary" size="sm">
        Test Button
      </Button>
      <div
        id="mapdiv"
        className="w-full h-[500px] mt-4 border border-gray-700 rounded-lg"
      />
    </>
  )
}
