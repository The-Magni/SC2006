export class ConvenienceScoreFilterPreference {
    durationWeight: number;
    walkingDistanceWeight: number;
    noTransferWeight: number;
    carparkAvailabilityWeight: number;
    busWaitTimeWeight: number;
    platformDensityWeight: number;
    fareWeight: number;

    public constructor(durationWeight: number, noTransferWeight: number, walkingDistanceWeight: number, 
        carparkAvailabilityWeight: number, busWaitTimeWeight: number, 
        platformDensityWeight: number, fareWeight: number
    ) {
        this.durationWeight = durationWeight;
        this.walkingDistanceWeight = walkingDistanceWeight;
        this.noTransferWeight = noTransferWeight;
        this.carparkAvailabilityWeight = carparkAvailabilityWeight;
        this.busWaitTimeWeight = busWaitTimeWeight;
        this.platformDensityWeight = platformDensityWeight;
        this.fareWeight = fareWeight;
    }

    public getTotalWeight(): number {
        return this.durationWeight + this.walkingDistanceWeight + this.noTransferWeight
        + this.carparkAvailabilityWeight + this.busWaitTimeWeight + this.platformDensityWeight
        + this.fareWeight;
    }
}
