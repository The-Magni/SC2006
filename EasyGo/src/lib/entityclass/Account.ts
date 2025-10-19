import { BaseItinerary } from "./BaseItinerary";

export class Account {
    private id: number;
    private email: string;
    private firstName: string;
    private lastName: string;
    private password: string;
    private savedRoutes: BaseItinerary[];
}