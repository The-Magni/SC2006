"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NavUser } from "@/components/nav-user";
import {
  ArrowLeft,
  Star,
  Car,
  Bus,
  Footprints,
  MapPin,
  CircleDot,
  Train,
} from "lucide-react";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

// Helper to get the correct icon for each route leg
const getLegIcon = (mode: string) => {
  if (mode.toUpperCase().includes("BUS")) return <Bus className="h-5 w-5 flex-shrink-0" />;
  if (mode.toUpperCase().includes("TRAIN") || mode.toUpperCase().includes("SUBWAY")) return <Train className="h-5 w-5 flex-shrink-0" />;
  if (mode.toUpperCase().includes("WALK")) return <Footprints className="h-5 w-5 flex-shrink-0" />;
  if (mode.toUpperCase().includes("DRIVE")) return <Car className="h-5 w-5 flex-shrink-0" />;
  return <MapPin className="h-5 w-5 flex-shrink-0" />;
};

// This type should be refined to match your exact serialized ItineraryScore object
type SelectedItinerary = {
  score: number;
  itinerary: {
    userMode: string;
    totalDuration: number;
    totalDistance: number;
    totalFare: number;
    summary: string;
    viaRoute?: string;
    legs: Array<{
      mode: string;
      description: string;
      distance: number;
    }>;
  };
};

type SidebarRouteProps = {
  selectedItinerary: SelectedItinerary | null;
  setLayoutInURL: (layout: "search" | "default" | "route") => void;
};

export function AppSidebarRoute({
                                  selectedItinerary,
                                  setLayoutInURL,
                                  ...props
                                }: SidebarRouteProps & Partial<React.ComponentProps<typeof Sidebar>>) {
  if (!selectedItinerary) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLayoutInURL("search")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <p className="p-4 text-sm text-muted-foreground">No route selected.</p>
        </SidebarContent>
      </Sidebar>
    );
  }

  const { itinerary, score } = selectedItinerary;
  const durationMin = Math.round(itinerary.totalDuration / 60);
  const distanceKm = (itinerary.totalDistance / 1000).toFixed(1);
  const routeIcon = getLegIcon(itinerary.userMode);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-16 items-center gap-2 border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          className="-ml-1"
          onClick={() => setLayoutInURL("search")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-medium">Route Details</h2>
      </SidebarHeader>

      <SidebarContent>
        {/* Summary Card */}
        <SidebarGroup>
          <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {routeIcon}
              </span>
              <div>
                <h3 className="font-semibold">
                  {itinerary.viaRoute ? `via ${itinerary.viaRoute}` : itinerary.userMode.toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {durationMin} min ({distanceKm} km)
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 rounded-full bg-yellow-400/20 px-2.5 py-0.5 text-yellow-300">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold">{score.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </SidebarGroup>

        {/* Step-by-Step Instructions */}
        <SidebarGroup>
          <SidebarGroupLabel>Instructions</SidebarGroupLabel>
          <SidebarGroupContent>
            <ol className="relative ml-2 flex flex-col gap-4 border-l pl-8">
              {/* Start Pin */}
              <li className="flex items-start gap-4">
                <span className="absolute -left-4 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 ring-4 ring-background">
                  <CircleDot className="h-5 w-5 text-white" />
                </span>
                <div className="flex-1 pt-1.5">
                  <h4 className="font-semibold">Starting Point</h4>
                  <p className="text-sm text-muted-foreground">Your journey begins here.</p>
                </div>
              </li>

              {/* Itinerary Legs */}
              {itinerary.legs.map((leg, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="absolute -left-4 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted ring-4 ring-background">
                    {getLegIcon(leg.mode)}
                  </span>
                  <div className="flex-1 pt-1.5">
                    {/* The leg.description contains HTML, so we must render it this way */}
                    <div
                      className="text-sm font-medium"
                      dangerouslySetInnerHTML={{ __html: leg.description }}
                    />
                    <p className="text-sm text-muted-foreground">
                      {leg.distance > 0 ? `${leg.distance} m` : ""}
                    </p>
                  </div>
                </li>
              ))}

              {/* End Pin */}
              <li className="flex items-start gap-4">
                <span className="absolute -left-4 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 ring-4 ring-background">
                  <MapPin className="h-5 w-5 text-white" />
                </span>
                <div className="flex-1 pt-1.5">
                  <h4 className="font-semibold">Destination</h4>
                  <p className="text-sm text-muted-foreground">You have arrived.</p>
                </div>
              </li>
            </ol>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}