"use client"

import { useState } from "react"
import {
    ItineraryData,
    DrivingItineraryData,
    PublicItineraryData,
    WalkingItineraryData,
    BaseItineraryData,
} from "@/lib/controllers/Parser"

export interface GetItinerariesResponse {
    driving: ItineraryData<DrivingItineraryData>[]
    pt: ItineraryData<PublicItineraryData>[]
    walking: ItineraryData<WalkingItineraryData>[]
}

export interface GetScoreResponse {
    best: { score: number; itinerary: ItineraryData<BaseItineraryData> }[]
    driving: { score: number; itinerary: ItineraryData<DrivingItineraryData> }[]
    public: { score: number; itinerary: ItineraryData<PublicItineraryData> }[]
    walking: { score: number; itinerary: ItineraryData<WalkingItineraryData> }[]
}

export interface ConvenienceFilter {
    durationWeight: number
    walkingDistanceWeight: number
    noTransferWeight: number
    carparkAvailabilityWeight: number
    busWaitTimeWeight: number
    platformDensityWeight: number
    fareWeight: number
}

export function useItineraryData() {
    const [routes, setRoutes] = useState<GetScoreResponse | null>(null)
    const [loading, setLoading] = useState(false)

    async function getItineraries(start: [number, number], end: [number, number]) {
        const url = `/api/get-itineraries?startLat=${start[0]}&startLon=${start[1]}&endLat=${end[0]}&endLon=${end[1]}`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to fetch itineraries: ${res.status}`)
        return (await res.json()) as GetItinerariesResponse
    }

    async function getScore(
        itineraries: GetItinerariesResponse,
        filters: ConvenienceFilter
    ) {
    const requestbody = {
        filterData: filters,
        driving: itineraries.driving,
        pt: itineraries.pt,
        walking: itineraries.walking,
        }

        const res = await fetch("/api/get-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestbody),
        })
        if (!res.ok) throw new Error(`Failed to fetch scores: ${res.status}`)
        return (await res.json()) as GetScoreResponse
    }

    async function getItinerariesAndScore(
        start: [number, number],
        end: [number, number],
        filters: ConvenienceFilter
    ) {
        try {
            setLoading(true)
            const itineraries = await getItineraries(start, end)
            const scored = await getScore(itineraries, filters)
            setRoutes(scored)
            return scored
        } finally {
            setLoading(false)
        }
    }

    return { routes, loading, getItinerariesAndScore, getScore, setRoutes }
}
