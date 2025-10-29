'use client'
import { BaseItineraryData, DrivingItineraryData, ItineraryData, PublicItineraryData, WalkingItineraryData } from "@/lib/controllers/Parser";
import { useEffect } from "react";

interface GetItinerariesResponse {
    driving: ItineraryData<DrivingItineraryData>[],
    pt: ItineraryData<PublicItineraryData>[],
    walking: ItineraryData<WalkingItineraryData>[]
}

interface GetScoreResponse {
    best: {
        score: number,
        itinerary: ItineraryData<BaseItineraryData>
    }[],
    driving: {
        score: number,
        itinerary: ItineraryData<DrivingItineraryData>
    }[],
    public: {
        score: number,
        itinerary: ItineraryData<PublicItineraryData>
    }[],
    walking: {
        score: number,
        itinerary: ItineraryData<WalkingItineraryData>
    }[]
}

async function getItineraries(start: [number, number], end: [number, number]) {
    const params = {
        startLat: start[0].toString(),
        startLon: start[1].toString(),
        endLat: end[0].toString(),
        endLon: end[1].toString()
    };
    const urlParams = new URLSearchParams(params);
    const url = `/api/get-itineraries?${urlParams.toString()}`;
    const response = await fetch(url);
    const data: GetItinerariesResponse = await response.json();
    return data;
}

async function getScore(itinerariesData: GetItinerariesResponse) {
    const requestBody = {
        filterData: {
            durationWeight: 5,
            walkingDistanceWeight: 5,
            noTransferWeight: 1,
            carparkAvailabilityWeight: 3,
            busWaitTimeWeight: 1,
            platformDensityWeight: 1,
            fareWeight: 1,
        },
        driving: itinerariesData.driving,
        pt: itinerariesData.pt,
        walking: itinerariesData.walking,
    };
    const response = await fetch('/api/get-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
    });
    const data: GetScoreResponse = await response.json();
    return data;
}

export default function Test() {
    useEffect(() => {
        getItineraries([1.397055, 103.747498], [1.2654, 103.8203])
        .then(getScore)
        .then(data => {
            data.public.forEach(i => {
                console.log(i.itinerary.data.summary);
                console.log(i.score);
            })
        });
    }, []);
}