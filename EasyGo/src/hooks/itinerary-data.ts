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

    async function getItineraries(start: [number, number], end: [number, number], startName: string, endName: string, driveType: "carpark" | "direct") {
        const url = `/api/get-itineraries?startLat=${start[0]}&startLon=${start[1]}&endLat=${end[0]}&endLon=${end[1]}&startName=${startName}&endName=${endName}&driveType=${driveType}`
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
        startName: string,
        endName: string,
        filters: ConvenienceFilter,
        driveType: "carpark" | "direct"
    ) {
        try {
            setLoading(true)
            const itineraries = await getItineraries(start, end, startName, endName, driveType)
            const scored = await getScore(itineraries, filters)

            //AGAIN, NEVER REPLICATE THIS PATCHJOB
            const processedScores = {
            ...scored,

            
            best: scored.best.map((r) => {
            const mode = r.itinerary.mode.toLowerCase();
            const data = r.itinerary.data;

            const updatedLegs = data.legs.map((leg) => {
                // handle driving-based best itineraries
                const isDriveMixed =
                mode.includes("drive") || mode.includes("driving") || "nearestCarpark" in data;

                if (leg.mode === "WALK" && isDriveMixed) {
                const driveData = data as DrivingItineraryData;
                const carparkName = driveData.nearestCarpark?.name ?? "nearest carpark";
                const destination = endName ?? "Destination";
                return {
                    ...leg,
                    description: `Walk from ${carparkName} to ${destination} (${(
                    leg.distance / 1000
                    ).toFixed(2)} km)`,
                };
                }

                if (leg.mode === "WALK" && (mode.includes("walk") || mode.includes("simplewalking"))) {
                return {
                    ...leg,
                    description: `Walk from ${startName ?? "Origin"} to ${
                    endName ?? "Destination"
                    } (${(leg.distance / 1000).toFixed(2)} km)`,
                };
                }

                return leg;
            });

            return {
                ...r,
                itinerary: {
                ...r.itinerary,
                data: {
                    ...data,
                    legs: updatedLegs,
                },
                },
            };
            }),

            


            driving: scored.driving.map((r) => ({
                ...r,
                itinerary: {
                ...r.itinerary,
                data: {
                    ...r.itinerary.data,
                    legs: r.itinerary.data.legs.map((leg) => ({
                    ...leg,
                    description:
                        leg.mode === "WALK"
                        ? `Walk from Carpark: ${
                            (r.itinerary.data).nearestCarpark?.name  ??
                            "nearest carpark"
                            } to ${endName} (${(
                            leg.distance / 1000
                            ).toFixed(2)} km)`
                        : leg.description,
                    })),
                },
                },
            })),

            walking: scored.walking.map((r) => ({
                ...r,
                itinerary: {
                ...r.itinerary,
                data: {
                    ...r.itinerary.data,
                    legs: r.itinerary.data.legs.map((leg) => ({
                    ...leg,
                    description:
                        leg.mode === "WALK"
                        ? `Walk from <b>${startName}</b> to <b>${endName}</b> (${(
                            leg.distance / 1000
                            ).toFixed(2)} km)`
                        : leg.description,
                    })),
                },
                },
            })),
            };
            console.log("Processed Scores:", processedScores);
            setRoutes(processedScores)
            return processedScores
        } finally {
            setLoading(false)
        }
    }

    return { routes, loading, getItinerariesAndScore, getScore, setRoutes }
}
