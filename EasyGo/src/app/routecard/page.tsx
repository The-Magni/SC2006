"use client"

import { Button } from "@/components/ui/button"
import { getRoute } from "@/lib/onemap/onemapHandler"
import { ItineraryController } from "@/lib/controllers/itinerary-controller"

import { PublicItinerary } from "@/lib/entityclass/PublicItinerary"
import { DrivingItinerary } from "@/lib/entityclass/DrivingItinerary"
import { SimpleWalkingItinerary } from "@/lib/entityclass/SimpleWalkingItinerary"
import { TrainRouteLeg } from "@/lib/entityclass/TrainRouteLeg"

import { useEffect, useRef, useState } from "react"
import type { MapDisplayHandle } from "@/components/map-display"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
const Leaflet = dynamic(() => import("leaflet"), { ssr: false })

const MapDisplay = dynamic(() => import("@/components/map-display"), {
  ssr: false,
})
import {
  initLeafletMap,
  clearMapOverlays,
  drawItinerariesOnMap,
} from "@/lib/controllers/leaflethelper-controller"


export default function Page() {
  //temp leaflet map display
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      initLeafletMap("mapdiv").then((map) => (mapRef.current = map))
    }
  }, [])




  
  // ----------------------------------
  // TEST 1: Public Transport
  // ----------------------------------
  async function testPublicTransport() {
    console.clear()
    console.log("Testing Public Transport Itinerary...")

    try {
      const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt")
      const itineraries = ItineraryController.parseResponse(data, "pt")
      
      //map drawing
      const leaflet = await import("leaflet")
      if (!mapRef.current) return
      clearMapOverlays(mapRef.current)
      drawItinerariesOnMap(mapRef.current, itineraries, leaflet)

      //debug log
      console.log("Parsed itineraries:", itineraries.length)
      itineraries.forEach((iti, i) => {
        console.group(`Itinerary ${i + 1}`)
        console.log("Class:", iti.constructor.name)
        console.log("Total Duration (s):", iti.totalDuration)
        console.log("Total Distance (m):", iti.totalDistance.toFixed(2))
        console.log("Transfers:", iti.totalTransfers)
        console.log("Fare:", iti.totalFare)
        console.log("User Mode:", iti.userMode)
        console.groupEnd()

        iti.legs.forEach((leg, j) => {
          console.group(`  🔹 Leg ${j + 1}`)
          console.log("Class:", leg.constructor.name)
          console.log("Mode:", leg.mode)
          console.log("From:", leg.start?.name, leg.start?.lat, leg.start?.lon)
          console.log("To:", leg.end?.name, leg.end?.lat, leg.end?.lon)
          console.log("Geometry length:", leg.geometry?.length)
          console.log("Description:", leg.getDescription())

          if (leg instanceof TrainRouteLeg) {
            console.log("Train Line:", leg.routeName)
            console.log(
              "Station Codes:",
              leg.fromStation?.code ?? "(none)",
              "→",
              leg.toStation?.code ?? "(none)"
            )
          }
          console.groupEnd()
        })
      })

      console.log("Summary:\n", ItineraryController.summarize(itineraries))
    } catch (err) {
      console.error("Public transport test failed:", err)
    }
  }
  // ----------------------------------
  // TEST 2: Driving
  // ----------------------------------
  async function testDrivingItinerary() {
    console.clear()
    console.log("Testing Driving Itinerary...")

    try {
      const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "drive")
      console.log(data)
      const itineraries = ItineraryController.parseResponse(data, "drive")
      //map drawing
      const leaflet = await import("leaflet")
      if (!mapRef.current) return
      clearMapOverlays(mapRef.current)
      drawItinerariesOnMap(mapRef.current, itineraries, leaflet)



      console.log(itineraries)
      console.log("Parsed itineraries:", itineraries.length)
      itineraries.forEach((iti, i) => {
        if (!(iti instanceof DrivingItinerary)) return
        console.group(`Driving Itinerary ${i + 1}`)
        console.log("Class:", iti.constructor.name)
        console.log("Duration (s):", iti.totalDuration)
        console.log("Distance (m):", iti.totalDistance)
        console.log("Transfers:", iti.totalTransfers)
        console.log("Nearest Carpark:", iti.nearestCarpark)
        console.groupEnd()

        iti.legs.forEach((leg, j) => {
          console.group(`  🔹 Driving Leg ${j + 1}`)
          console.log("Instruction:", leg.instruction)
          console.log("Road:", leg.roadName)
          console.log("Direction:", leg.direction)
          console.log("Distance Text:", leg.distanceText)
          console.log("Description:", leg.getDescription())
          console.log("Geometry points:", leg.geometry?.length)
          console.groupEnd()
        })
      })

      const html = ItineraryController.summarize(itineraries)
      console.log("Summary:\n", html)
    } catch (err) {
      console.error("Driving test failed:", err)
    }
  }
  // ------------------------
  // WalkingRoute Test
  // ------------------------
async function testWalkingItinerary() {
  console.clear()
  console.log("Testing Walking Itinerary...")

  try {
    const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "walk")
    const itineraries = ItineraryController.parseResponse(data, "walk")

    console.log("Parsed itineraries:", itineraries.length)
    console.log(data)

    //Inspect itinerary details
    itineraries.forEach((iti, i) => {
      if (!(iti instanceof SimpleWalkingItinerary)) return

      console.group(`Walking Itinerary ${i + 1}`)
      console.log("Class:", iti.constructor.name)
      console.log("Duration (s):", iti.totalDuration)
      console.log("Distance (m):", iti.totalDistance)
      console.log("Mode:", iti.userMode)
      console.log("Polyline Points:", iti.polylineCoords?.length)
      console.groupEnd()

      iti.legs.forEach((leg, j) => {
        console.group(`  🚶 Leg ${j + 1}`)
        console.log("Mode:", leg.mode)
        console.log("Distance:", leg.distance)
        console.log("Duration:", leg.duration)
        console.log("Geometry points:", leg.geometry?.length)
        console.log("Description:", leg.getDescription?.() ?? leg.description)
        console.groupEnd()
      })
    })

    const leaflet = await import("leaflet")
    if (mapRef.current) {
      clearMapOverlays(mapRef.current)
      drawItinerariesOnMap(mapRef.current, itineraries, leaflet)
    }
  } catch (err) {
    console.error("Walking itinerary test failed:", err)
  }
}


  
  // ------------------------
  // Page renderting test
  // ------------------------
  const [summary, setSummary] = useState("")

  async function handleDebugRoute() {
    try {
      const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt")
      const itineraries = ItineraryController.parseResponse(data)
      const summaryHTML = ItineraryController.summarize(itineraries)
      setSummary(summaryHTML)
    } catch (err) {
      console.error("Debug test failed:", err)
    }
  }


  return (
    <div className="p-4 space-y-4 text-white">
      <h2 className="text-lg font-semibold">Route Test Page</h2>
      <h3 className="text-lg">Test Locations: Yew Tee MRT Station & Harbourfront MRT Station</h3>
      <div>Check console log for output</div>
      <Button onClick={testPublicTransport} variant="secondary" size="sm">
        Test Public Transport
      </Button>

      <Button onClick={testDrivingItinerary} variant="secondary" size="sm">
        Test Driving Route
      </Button>
      <Button onClick={testWalkingItinerary} variant="secondary" size="sm">
        Test Walking Route (returns 1 only)
      </Button>
      <Button onClick={handleDebugRoute} variant="secondary" size="sm">
        Render HTML Summary
      </Button>

      <div
        className="summarytarget text-white whitespace-pre-wrap mt-4"
        dangerouslySetInnerHTML={{ __html: summary }}
      />

              
    <div
      id="mapdiv"
      className="w-full h-[500px] mt-4 border border-gray-700 rounded-lg"
    ></div>
    </div>
    
  )
}
