import { Itinerary } from "./Itinerary";
import { ConvenienceScoreFilterPreference } from "./ConvenienceScoreFilterPreference";

export class ConvenienceScore {
    private score: number;
    private userPreference: ConvenienceScoreFilterPreference;
    private itinerary: Itinerary;

    private normalizeValue(
        itineraryList: Itinerary[],
        selector: (itinerary: Itinerary) => number
    ): number {
        let minValue = selector(this.itinerary);
        let maxValue = selector(this.itinerary);
        itineraryList.forEach(i => {
            const value = selector(i);
            if (value < minValue)
                minValue = value;
            else if (value > maxValue)
                maxValue = value;
        });
        if (minValue === maxValue) // prevent division by 0
            return 1;
        return (selector(this.itinerary) - minValue) / (maxValue - minValue);
    }

    public constructor(itinerary: Itinerary, userPreference: ConvenienceScoreFilterPreference) {
        this.itinerary = itinerary;
        this.userPreference = userPreference;
        this.score = 0;
    }

    public getScore(): number {
        return this.score;
    }

    public computeScore(itineraryList: Itinerary[]): void {
        const normalizedDurationScore = this.normalizeValue(itineraryList, i => i.totalDuration);
        const normalizedFareScore = this.normalizeValue(itineraryList, i => i.totalFare);
        const normalizedNoTransferScore = this.normalizeValue(itineraryList, i => i.totalTransfers);
        const normalizedWalkingDistanceScore = this.normalizeValue(itineraryList, i => i.getWalkingDistance());

        const totalScore = this.userPreference.durationWeight * (1 - normalizedDurationScore)
        + this.userPreference.fareWeight * (1 - normalizedFareScore)
        + this.userPreference.noTransferWeight * (1 - normalizedNoTransferScore)
        + this.userPreference.walkingDistanceWeight * (1 - normalizedWalkingDistanceScore);

        this.score = totalScore / this.userPreference.getTotalWeight();
    }
}