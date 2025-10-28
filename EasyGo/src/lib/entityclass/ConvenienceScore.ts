import type { BaseItinerary } from "./BaseItinerary";
import type { DrivingItinerary } from "./DrivingItinerary";
import type { PublicItinerary } from "./PublicItinerary";
import type { SimpleWalkingItinerary } from "./SimpleWalkingItinerary";
import { ConvenienceScoreFilterPreference } from "./ConvenienceScoreFilterPreference";

interface MaxMin {
    max: number; 
    min: number;
}


function getMaxMin<T extends BaseItinerary>(
    itineraryList: T[],
    selector: (itinerary: T) => number
): MaxMin {
    const maxMin: MaxMin = {
        max: -Infinity,
        min: Infinity
    };
    itineraryList.forEach(i => {
        if (selector(i) > maxMin.max)
            maxMin.max = selector(i);
        if (selector(i) < maxMin.min)
            maxMin.min = selector(i);
    })
    return maxMin;
} 


export class Bound { // a class store max and min of data for the convenience score
    duration: MaxMin;
    walkingDistance: MaxMin;
    noTransfer: MaxMin;
    fare: MaxMin;
    busWaitTime: MaxMin;
    platformDensity: MaxMin;
    carparkAvailability: MaxMin;

    public constructor(itineraries: BaseItinerary[]) {
        this.duration = getMaxMin<BaseItinerary>(itineraries, i => i.totalDuration);
        this.walkingDistance = getMaxMin<BaseItinerary>(itineraries, i => i.walkingDistance);
        const publicItineraries = itineraries.filter(i => isPublicItinerary(i));
        const drivingItineraries = itineraries.filter(i => isDrivingItinerary(i));
        this.noTransfer = getMaxMin<PublicItinerary>(publicItineraries, i => i.totalTransfers);
        this.fare = getMaxMin<PublicItinerary>(publicItineraries, i => i.totalFare || 0);
        this.busWaitTime = getMaxMin<PublicItinerary>(publicItineraries, i => i.busWaitTime)
        this.platformDensity = getMaxMin<PublicItinerary>(publicItineraries, i => i.platformDensity);
        this.carparkAvailability = getMaxMin<DrivingItinerary>(drivingItineraries, i => i.nearestCarpark?.availableLots || 0);
    }
}



function normalize(value: number, maxMin: MaxMin): number {
    if (maxMin.max - maxMin.min <= 1e-3)
        return 1; // avoid division by 0
    return (value - maxMin.min) / (maxMin.max - maxMin.min);
}

function isWalkingItinerary(itinerary: BaseItinerary): itinerary is SimpleWalkingItinerary {
    return itinerary.mode === 'SimpleWalkingItinerary';
}

function isDrivingItinerary(itinerary: BaseItinerary): itinerary is DrivingItinerary {
    return itinerary.mode === 'DrivingItinerary';
}

function isPublicItinerary(itinerary: BaseItinerary): itinerary is PublicItinerary {
    return itinerary.mode === 'PublicItinerary';
}

interface ScoringStrategy {
    calculate(
        initScore: number,
        itinerary: BaseItinerary, 
        userPreference: ConvenienceScoreFilterPreference, 
        bound: Bound): number;
}

class WalkingScoring implements ScoringStrategy {
    public calculate(
        initScore: number,
        itinerary: BaseItinerary, 
        userPreference: ConvenienceScoreFilterPreference, 
        bound: Bound
    ): number {
        if (!isWalkingItinerary(itinerary))
            throw new Error('This is not walking itinerary');
        if (userPreference.getTotalWeightWalking() <= 1e-3) // avoid division by 0
            return 0;
        return initScore / userPreference.getTotalWeightWalking() * 9 + 1; // ensure in the range 1-10       
    }
}

class PublicScoring implements ScoringStrategy {
    public calculate(
        initScore: number,
        itinerary: BaseItinerary, 
        userPreference: ConvenienceScoreFilterPreference, 
        bound: Bound
    ): number {
        if (!isPublicItinerary(itinerary))
            throw new Error('This is not pt itinerary');
        const normalizedNoTransferScore = normalize(itinerary.totalTransfers, bound.noTransfer);
        const normalizedFareScore = normalize(itinerary.totalFare || 0, bound.fare);
        const normalizedBusWaitTimeScore = normalize(itinerary.busWaitTime, bound.busWaitTime);
        const normalizedPlatformDensityScore = normalize(itinerary.platformDensity, bound.platformDensity);
        
        const score = initScore + 
        userPreference.noTransferWeight * (1 - normalizedNoTransferScore) +
        userPreference.fareWeight * (1 - normalizedFareScore) +
        userPreference.busWaitTimeWeight * (1 - normalizedBusWaitTimeScore) +
        userPreference.platformDensityWeight * (1 - normalizedPlatformDensityScore);
        if (userPreference.getTotalWeightPublicTransport() <= 1e-3)
            return 0;
        return score / userPreference.getTotalWeightPublicTransport() * 9 + 1; // ensure in the range 1-10
    }
}

class DrivingScoring implements ScoringStrategy {
    public calculate(
        initScore: number,
        itinerary: BaseItinerary, 
        userPreference: ConvenienceScoreFilterPreference, 
        bound: Bound
    ): number {
        if (!isDrivingItinerary(itinerary))
            throw new Error('This is not driving itinerary');
        const normalizedCarparkAvailabilityScore = normalize(itinerary.nearestCarpark?.availableLots || 0, bound.carparkAvailability);
        const score = initScore +
        userPreference.carparkAvailabilityWeight * normalizedCarparkAvailabilityScore;
        if (userPreference.getTotalWeightDriving() <= 1e-3)
            return 0;
        return score / userPreference.getTotalWeightDriving() * 9 + 1;
    }
}

export class ConvenienceScoreFactory {
    public static create(itinerary: BaseItinerary) {
        if (isWalkingItinerary(itinerary))
            return new ConvenienceScore(itinerary, new WalkingScoring());
        if (isPublicItinerary(itinerary))
            return new ConvenienceScore(itinerary, new PublicScoring());
        if (isDrivingItinerary(itinerary))
            return new ConvenienceScore(itinerary, new DrivingScoring());
        throw new Error('Invalid itinerary type');
    }
}


export class ConvenienceScore {
    private itinerary: BaseItinerary;
    private strategy: ScoringStrategy;
    private score: number;

    public constructor(itinerary: BaseItinerary, strategy: ScoringStrategy) {
        this.itinerary = itinerary;
        this.strategy = strategy;
        this.score = 0;
    }

    public computeScore(bound: Bound, userPreference: ConvenienceScoreFilterPreference): void {
        const normalizedDurationScore = normalize(this.itinerary.totalDuration, bound.duration);
        const normalizedWalkingDistanceScore = normalize(this.itinerary.walkingDistance, bound.walkingDistance);
        this.score = userPreference.durationWeight * (1 - normalizedDurationScore)
        + userPreference.walkingDistanceWeight * (1 - normalizedWalkingDistanceScore);
        this.score = this.strategy.calculate(this.score, this.itinerary, userPreference, bound);
    }

    public setScore(score: number): void {
        this.score = score;
    }

    public getScore(): number {
        return this.score;
    }
}