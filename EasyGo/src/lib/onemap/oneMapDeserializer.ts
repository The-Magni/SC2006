//deserialized response from OneMap Public Transport API
//actually dont use this, i think no point

export interface OneMapPublicTransportResponse {
  requestParameters: RequestParameters;
  plan: Plan;
  metadata?: Metadata;
  debugOutput?: DebugOutput;
  elevationMetadata?: ElevationMetadata;
}

export interface RequestParameters {
  mode: string;
  date: string;
  arriveBy: string;
  showIntermediateStops: string;
  fromPlace: string;
  transferPenalty: string;
  toPlace: string;
  maxWalkDistance: string;
  time: string;
  maxTransfers: string;
  numItineraries: string;
}

export interface Plan {
  date: number;
  from: Location;
  to: Location;
  itineraries: Itinerary[];
}

export interface Location {
  name: string;
  lon: number;
  lat: number;
  vertexType: string;
  stopId?: string;
  stopCode?: string;
  arrival?: number;
  departure?: number;
}

export interface Itinerary {
  duration: number;
  startTime: number;
  endTime: number;
  walkTime: number;
  transitTime: number;
  waitingTime: number;
  walkDistance: number;
  transfers: number;
  fare: string;
  legs: Leg[];
  tooSloped: boolean;
  arrivedAtDestinationWithRentedBicycle: boolean;
}

export interface Leg {
  startTime: number;
  endTime: number;
  distance: number;
  generalizedCost: number;
  mode: string;              
  route: string;              
  routeShortName?: string;
  routeLongName?: string;
  transitLeg: boolean;
  agencyName?: string;
  agencyUrl?: string;
  routeId?: string;
  agencyId?: string;
  tripId?: string;
  serviceDate?: string;
  from: Location;
  to: Location;
  intermediateStops?: Stop[];
  legGeometry: LegGeometry;
  steps?: Step[];
  duration: number;
}

export interface Stop {
  name: string;
  stopId: string;
  stopCode: string;
  lon: number;
  lat: number;
  arrival: number;
  departure: number;
  vertexType: string;
}

export interface LegGeometry {
  points: string;   
  length: number;   
}

export interface Step {
  distance: number;
  relativeDirection: string;
  streetName: string;
  absoluteDirection: string;
  stayOn: boolean;
  area: boolean;
  bogusName: boolean;
  lon: number;
  lat: number;
  elevation: string;
  walkingBike: boolean;
}

export interface Metadata {
  searchWindowUsed: number;
  nextDateTime: number;
  prevDateTime: number;
}

export interface DebugOutput {
  precalculationTime: number;
  directStreetRouterTime: number;
  transitRouterTime: number;
  filteringTime: number;
  renderingTime: number;
  totalTime: number;
  transitRouterTimes: {
    tripPatternFilterTime: number;
    accessEgressTime: number;
    raptorSearchTime: number;
    itineraryCreationTime: number;
  };
}

export interface ElevationMetadata {
  ellipsoidToGeoidDifference: number;
  geoidElevation: boolean;
}