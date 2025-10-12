"use client"

import { Button } from "@/components/ui/button";
import { getRoute } from "@/lib/onemap/onemapHandler"
import { ItineraryController } from "@/lib/controllers/itinerary-controller"
import { useState } from "react"


export default function Page() {
      const [summary, setSummary] = useState("")

    async function handleDebugRoute() {
        const data = await getRoute([1.397055, 103.747498], [1.2654, 103.8203], "pt")
        console.log(data)
        if (data.plan) {
            const itineraries = ItineraryController.parseResponse(data)
            let summaryText = "";
            itineraries.forEach((itinerary, index) => {
                summaryText += `Itinerary ${index + 1}:\n${itinerary.summary}\n\n`;
            });
            setSummary(summaryText);

        
        } 
        else {
            console.log("Simple route:", data.route_name)
        }
    }

    
    return (
        <div>
            <div>Route Card Page</div>
            <Button
                variant="secondary"
                size="sm"
                onClick={handleDebugRoute}
                className="mt-2 flex items-center gap-2"
            >
                TEST I AM A BUTTON
            </Button>
            <div className="summarytarget whitespace-pre-wrap text-white">{summary || "No route loaded yet."}</div>
        </div>
    );
}