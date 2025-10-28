// src/types/onemap-route.ts

export interface OneMapDrivingRouteResponse {
  status_message: string
  route_geometry: string
  status: number
  route_instructions: RouteInstruction[]
  route_name: string[]
  route_summary: RouteSummary
  alternativeroute?: AlternativeRoute[]
  viaRoute?: string
  subtitle?: string
  phyroute?: PhysicalRoute
}

export type RouteInstruction = [
  string,  // action
  string,  // road
  number,  // distance
  string,  // coord "lat,lon"
  number,  // seconds
  string,  // distanceText
  string,  // dirStart
  string,  // dirEnd
  string,  // mode
  string   // instruction text
]

export interface RouteSummary {
  start_point: string
  end_point: string
  total_time: number
  total_distance: number
}

export interface AlternativeRoute {
  status_message: string
  route_geometry: string
  status: number
  route_instructions: RouteInstruction[]
  route_name: string[]
  route_summary: RouteSummary
  viaRoute?: string
  subtitle?: string
}

export interface PhysicalRoute {
  status_message: string
  route_geometry: string
  status: number
  route_instructions: RouteInstruction[]
  route_name: string[]
  route_summary: RouteSummary
  viaRoute?: string
  subtitle?: string
}
