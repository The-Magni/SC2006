import { BaseItinerary } from "./BaseItinerary";
import { ConvenienceScoreFilterPreference } from "./ConvenienceScoreFilterPreference";
import { DrivingItinerary } from "./DrivingItinerary";
import { PublicItinerary } from "./PublicItinerary";
import { SimpleWalkingItinerary } from "./SimpleWalkingItinerary";

function normalizeValue<T extends BaseItinerary>(
    itinerary: T,
    itineraryList: T[],
    selector: (itinerary: T) => number
): number {
    let minValue = selector(itinerary);
    let maxValue = selector(itinerary);
    itineraryList.forEach(i => {
        const value = selector(i);
        if (value < minValue)
            minValue = value;
        else if (value > maxValue)
            maxValue = value;
    });
    if (minValue === maxValue) // prevent division by 0
        return 1;
    return (selector(itinerary) - minValue) / (maxValue - minValue);
}


export interface ScoringStrategy<T extends BaseItinerary> {
    calculate(
        initScore: number,
        itinerary: T, 
        userPreference: ConvenienceScoreFilterPreference, 
        itineraries: T[]): number;
}

export class WalkingScoring implements ScoringStrategy<SimpleWalkingItinerary> {
    public calculate(
        initScore: number,
        itinerary: SimpleWalkingItinerary, 
        userPreference: ConvenienceScoreFilterPreference, 
        itineraries: SimpleWalkingItinerary[]
    ): number {
        return initScore / userPreference.getTotalWeightWalking() * 9 + 1; // ensure in the range 1-10       
    }
}

export class PublicScoring implements ScoringStrategy<PublicItinerary> {
    public calculate(
        initScore: number,
        itinerary: PublicItinerary, 
        userPreference: ConvenienceScoreFilterPreference, 
        itineraries: PublicItinerary[]
    ): number {
        const normalizedNoTransferScore = normalizeValue<PublicItinerary>(itinerary, itineraries, i => i.totalTransfers);
        const normalizedFareScore = normalizeValue<PublicItinerary>(itinerary, itineraries, i => i.totalFare || 0);
        const normalizedBusWaitTimeScore = normalizeValue<PublicItinerary>(itinerary, itineraries, i => i.busWaitTime);
        const normalizedPlatformDensityScore = normalizeValue<PublicItinerary>(itinerary, itineraries, i => i.platformDensity);
        
        const score = initScore + 
        userPreference.noTransferWeight * (1 - normalizedNoTransferScore) +
        userPreference.fareWeight * (1 - normalizedFareScore) +
        userPreference.busWaitTimeWeight * (1 - normalizedBusWaitTimeScore) +
        userPreference.platformDensityWeight * (1 - normalizedPlatformDensityScore);
        return score / userPreference.getTotalWeightPublicTransport() * 9 + 1; // ensure in the range 1-10
    }
}

export class DrivingScoring implements ScoringStrategy<DrivingItinerary> {
    public calculate(
        initScore: number,
        itinerary: DrivingItinerary, 
        userPreference: ConvenienceScoreFilterPreference, 
        itineraries: DrivingItinerary[]
    ): number {
        const normalizedCarparkAvailabilityScore = normalizeValue<DrivingItinerary>(itinerary, itineraries, i => i.nearestCarpark?.availableLots || 0);
        const score = initScore +
        userPreference.carparkAvailabilityWeight * normalizedCarparkAvailabilityScore;
        return score / userPreference.getTotalWeightDriving() * 9 + 1;
    }
}

export class ConvenienceScoreFactory { //factory pattern
    public static create(itinerary: BaseItinerary) {
        if (itinerary instanceof SimpleWalkingItinerary) 
            return new ConvenienceScore<SimpleWalkingItinerary>(itinerary, new WalkingScoring());
        else if (itinerary instanceof PublicItinerary)
            return new ConvenienceScore<PublicItinerary>(itinerary, new PublicScoring());
        else if (itinerary instanceof DrivingItinerary)
            return new ConvenienceScore<DrivingItinerary>(itinerary, new DrivingScoring());
    }
}

export class ConvenienceScore<T extends BaseItinerary> {
    private score: number;
    private itinerary: T;
    private strategy: ScoringStrategy<T>; // For demonstrate strategy pattern

    public constructor(itinerary: T, strategy: ScoringStrategy<T>) {
        this.itinerary = itinerary;
        this.strategy = strategy;
        this.score = 0;
    }

    public getScore(): number {
        return this.score;
    }

    public computeScore(itineraries: BaseItinerary[], userPreference: ConvenienceScoreFilterPreference): void {
        const normalizedDurationScore = normalizeValue<BaseItinerary>(this.itinerary, itineraries, i => i.totalDuration);
        const normalizedWalkingDistanceScore = normalizeValue<BaseItinerary>(this.itinerary, itineraries, i => i.getWalkingDistance());
        const T_Itineraries = itineraries.filter(i => i instanceof this.itinerary.constructor) as T[];
        
        this.score = userPreference.durationWeight * (1 - normalizedDurationScore)
        + userPreference.walkingDistanceWeight * (1 - normalizedWalkingDistanceScore);
        this.score = this.strategy.calculate(this.score, this.itinerary, userPreference, T_Itineraries);
    }
} 