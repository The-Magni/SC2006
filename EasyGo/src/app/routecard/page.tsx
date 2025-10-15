"use client"

import { Button } from "@/components/ui/button";
import { getRoute } from "@/lib/onemap/onemapHandler"
import { ItineraryController } from "@/lib/controllers/itinerary-controller"
import { useState } from "react"


export default function Page() {
 async function testDrivingItinerary() {
  console.clear()
  console.log("Testing Driving Itinerary (OneMap /drive)...")

  try {
    const data = await getRoute([1.320394, 103.844478], [1.326868, 103.855789], "drive")

    const itineraries = ItineraryController.parseResponse(data, "drive")
    console.log("Parsed itineraries:", itineraries.length)

    itineraries.forEach((iti, i) => {
      console.group(`🧳 Itinerary ${i + 1}`)
      console.log("Type:", iti.constructor.name)
      console.log("Duration (s):", iti.totalDuration)
      console.log("Distance (m):", iti.totalDistance)
      console.log("Transfers:", iti.totalTransfers)
      console.log("Leg count:", iti.legs.length)
      console.groupEnd()

      iti.legs.forEach((leg, j) => {
        console.group(`  🔹 Instruction ${j + 1}`)
        console.log("Class:", leg.constructor.name)
        console.log("Instruction:", leg.instruction)
        console.log("Road:", leg.roadName)
        console.log("Direction:", leg.direction)
        console.log("Distance text:", leg.distanceText)
        console.log("Description:", leg.getDescription())
        console.log("Start:", leg.start)
        console.log("End:", leg.end)
        console.log("Geometry pairs:", leg.geometry)
        console.groupEnd()
      })
    })

    const html = ItineraryController.summarize(itineraries)
    console.log("Summary HTML:\n", html)

  } catch (err) {
    console.error("Drive itinerary test failed:", err)
  }
}
async function testItineraryClasses() {
  console.clear()
  console.log("Testing Itinerary + RouteLeg class structure...")

  try {
    // Use a known PT route for good test coverage
    const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt")

    // Parse response using your controller
    const itineraries = ItineraryController.parseResponse(data, "pt")
    console.log("Parsed itineraries:", itineraries.length)

    // Iterate through each itinerary and log key structure
    itineraries.forEach((iti, i) => {
      console.group(`Itinerary ${i + 1}`)
      console.log("Type:", iti.constructor.name)
      console.log("Total Duration (s):", iti.totalDuration)
      console.log("Total Distance (m):", iti.totalDistance.toFixed(2))
      console.log("Transfers:", iti.totalTransfers)
      console.log("Fare:", iti.totalFare)
      console.log("Leg count:", iti.legs.length)
      console.log("Summary HTML:", iti.summary)
      console.groupEnd()

      // Check each leg class type and geometry
      iti.legs.forEach((leg, j) => {
        console.group(`  🔹 Leg ${j + 1}`)
        console.log("Class:", leg.constructor.name)
        console.log("Mode:", leg.mode)
        console.log("From:", leg.start?.name, leg.start?.lat, leg.start?.lon)
        console.log("To:", leg.end?.name, leg.end?.lat, leg.end?.lon)
        console.log("Geometry length:", leg.geometry?.length)
        console.log("Description:", leg.getDescription())
        console.groupEnd()
      })
    })

    // Test the summarizer
    console.log("HTML Summary:\n", ItineraryController.summarize(itineraries))

    // 5️⃣ Leaflet polyline test data
    if (itineraries.length > 0) {
      const lines = itineraries[0].getAllPolylines()
      console.log("First itinerary polylines:", lines)
      if (lines[0]?.length > 0) console.log("Geometry looks valid!")
    }

  } catch (err) {
    console.error("Test failed:", err)
  }
}




      const [summary, setSummary] = useState("")

    async function handleDebugRoute() {
        try {
        const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt")

        // Parse into class-based structure
        const itineraries = ItineraryController.parseResponse(data)

        // Render or log
        const summaryHTML = ItineraryController.summarize(itineraries)
        document.querySelector(".summarytarget")!.innerHTML = summaryHTML
        } catch (err) {
        console.error("Failed:", err)
        }
    }

    
    return (
        <div>
            <div>Route Card Page</div>
                        <Button
                variant="secondary"
                size="sm"
                onClick={testItineraryClasses}
                className="mt-2 flex items-center gap-2"
            >
                public transit testcase1
            </Button>
                                    <Button
                variant="secondary"
                size="sm"
                onClick={testDrivingItinerary}
                className="mt-2 flex items-center gap-2"
            >
                drive testcase1
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={handleDebugRoute}
                className="mt-2 flex items-center gap-2"
            >
                TEST I AM A BUTTON
            </Button>
            <div className="summarytarget text-white whitespace-pre-wrap mt-4"></div>
        </div>
    );
}