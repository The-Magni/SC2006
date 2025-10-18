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
        const normalizedWalkingDistanceScore = this.normalizeValue(itineraryList, i => i.getWalkingDistance());

        // filter itinerary based on mode of transport
        const ptItineraryList: Itinerary[] = [], drivingItineraryList: Itinerary[] = [];
        for (const itinerary of itineraryList) {
            switch (itinerary.userMode) {
                case 'pt':
                    ptItineraryList.push(itinerary);
                    break;
                case 'drive':
                    drivingItineraryList.push(itinerary);
                    break;
            }
        }


        switch (this.itinerary.userMode) {
            case 'pt':
                const normalizedNoTransferScore = this.normalizeValue(ptItineraryList, i => i.totalTransfers);
                const normalizedFareScore = this.normalizeValue(ptItineraryList, i => i.totalFare);
                const normalizedBusWaitTimeScore = 0; // later will be assigned
                this.score = this.userPreference.durationWeight * (1 - normalizedDurationScore) +
                this.userPreference.walkingDistanceWeight + (1 - normalizedWalkingDistanceScore) +
                this.userPreference.noTransferWeight * (1 - normalizedNoTransferScore) +
                this.userPreference.fareWeight * (1 - normalizedFareScore) +
                this.userPreference.busWaitTimeWeight * (1 - normalizedBusWaitTimeScore);
                this.score /= this.userPreference.getTotalWeightPublicTransport();
                break;
            case 'walk':
                this.score = this.userPreference.durationWeight * normalizedDurationScore
                + this.userPreference.walkingDistanceWeight * normalizedWalkingDistanceScore;
                this.score /= this.userPreference.getTotalWeightWalking();
                break;
            case 'drive':
                break;
        }
    }
}