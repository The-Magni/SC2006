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
import drawPolylines from "@/lib/onemap/onemapHandler"
import "leaflet/dist/leaflet.css"
const Leaflet = dynamic(() => import("leaflet"), { ssr: false })

const MapDisplay = dynamic(() => import("@/components/map-display"), {
  ssr: false,
})



export default function Page() {
  //temp leaflet map display
  const mapRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

useEffect(() => {
  async function initMap() {
    const L = await import("leaflet")
    if (!mapRef.current) {
      const map = L.map("mapdiv", {
        center: [1.3521, 103.8198],
        zoom: 13,
      })
      L.tileLayer("https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png", {
        detectRetina: true,
        maxZoom: 19,
        minZoom: 11,
        attribution:
            '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>',
      }).addTo(map)
      mapRef.current = map
    }
  }
  if (typeof window !== "undefined") initMap()
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
      <h3 className="text-lg">Test Locations: </h3>

      <Button onClick={testPublicTransport} variant="secondary" size="sm">
        Test Public Transport
      </Button>

      <Button onClick={testDrivingItinerary} variant="secondary" size="sm">
        Test Driving Route
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
