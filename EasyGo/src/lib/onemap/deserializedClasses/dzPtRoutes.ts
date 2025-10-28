// src/types/onemap-pt.ts

export interface OneMapPTResponse {
  requestParameters: RequestParameters
  plan: Plan
  metadata: Metadata
  previousPageCursor?: string
  nextPageCursor?: string
  debugOutput?: DebugOutput
  elevationMetadata?: ElevationMetadata
}

export interface RequestParameters {
  mode: string 
  date: string 
  arriveBy: string
  showIntermediateStops: string
  fromPlace: string // "lat,lon"
  transferPenalty: string
  toPlace: string
  maxWalkDistance: string
  time: string 
  maxTransfers: string
  numItineraries: string 
}

export interface Plan {
  date: number
  from: Vertex
  to: Vertex
  itineraries: Itinerary[]
}

export interface Vertex {
  name: string
  lon: number
  lat: number
  vertexType: string
  stopId?: string
  stopCode?: string
  arrival?: number
  departure?: number
  stopIndex?: number
  stopSequence?: number
}

export interface Itinerary {
  duration: number
  startTime: number
  endTime: number
  walkTime: number
  transitTime: number
  waitingTime: number
  walkDistance: number
  walkLimitExceeded: boolean
  generalizedCost: number
  elevationLost: number
  elevationGained: number
  transfers: number
  fare: string
  tooSloped: boolean
  arrivedAtDestinationWithRentedBicycle: boolean
  legs: Leg[]
}


export interface legGeometry {
  points: string
  length: number
}

export interface Step {
  distance: number
  relativeDirection: string
  streetName: string
  absoluteDirection: string
  stayOn: boolean
  area: boolean
  bogusName: boolean
  lon: number
  lat: number
  elevation: string
  walkingBike: boolean
}

export interface Metadata {
  searchWindowUsed: number
  nextDateTime: number
  prevDateTime: number
}

export interface DebugOutput {
  precalculationTime: number
  directStreetRouterTime: number
  transitRouterTime: number
  filteringTime: number
  renderingTime: number
  totalTime: number
  transitRouterTimes: TransitRouterTimes
}

export interface TransitRouterTimes {
  tripPatternFilterTime: number
  accessEgressTime: number
  raptorSearchTime: number
  itineraryCreationTime: number
}

export interface ElevationMetadata {
  ellipsoidToGeoidDifference: number
  geoidElevation: boolean
}

export interface Location {
    name?: string
    lat: number
    lon: number
    stopCode?: string
}

export interface BaseLeg {
  startTime: number
  endTime: number
  distance: number
  mode: string
  from: Location
    duration: number
  to: Location
    legGeometry : legGeometry

}

export interface TransitLeg extends BaseLeg {
  transitLeg: true
  route: string
  routeType: number
  routeId?: string
  tripId?: string
  serviceDate?: string
  agencyName?: string
  agencyId?: string
  agencyUrl?: string
  agencyTimeZoneOffset?: number
  interlineWithPreviousLeg?: boolean
}

export interface WalkLeg extends BaseLeg {
  transitLeg: false
  duration: number
  steps: Step[]
}

export interface Step {
  distance: number
  streetName: string
  absoluteDirection: string
  relativeDirection: string
  lat: number
  lon: number
}

export type Leg = TransitLeg | WalkLeg

