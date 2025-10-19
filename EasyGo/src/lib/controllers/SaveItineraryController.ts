import { Account } from "../entityclass/Account";
import { BaseItinerary } from "../entityclass/BaseItinerary";

export class SaveItineraryController {
    private account: Account;
    private itinerary: BaseItinerary;

    public constructor(account: Account, itinerary: BaseItinerary) {
        this.account = account;
        this.itinerary = itinerary;
    }

    public saveRoute(): void {

    }

    public deleteRoute(): void {
        
    }
}