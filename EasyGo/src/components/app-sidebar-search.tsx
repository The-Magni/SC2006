"use client"

import * as React from "react"
import { RefObject, useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"
import { NavUser } from "@/components/nav-user"
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Star, Car, Bus, Footprints, Circle, MapPinIcon, ListFilterIcon, Bookmark, LucideIcon } from "lucide-react";
import { OneMapSearchResult } from "@/lib/onemap/onemapAutoFill";
import type { MapDisplayHandle } from "@/components/map-display";
import {
  initLeafletMap,
  clearMapOverlays,
  drawItinerariesOnMap,
} from "@/lib/controllers/leaflethelper-controller"



type SidebarSearchProps = {
  options: OneMapSearchResult[];
  loading: boolean;
  debouncedFetch: (value: string) => void;
  setOptions: React.Dispatch<React.SetStateAction<OneMapSearchResult[]>>;
  setLayoutInURL: (layout: "search" | "default" | "route") => void;
  setStartValue: (value: OneMapSearchResult | null) => void;
  setEndValue: (value: OneMapSearchResult | null) => void;
  startValue: OneMapSearchResult | null;
  endValue: OneMapSearchResult | null;
  mapRef: RefObject<MapDisplayHandle | null>;
  // Add new typing for routing data @John
};





// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  }
}

// Sample routing data
const routes = {
  best: [
    // --- Drive ---
    { name: "via Seletar Expressway", distance: 32.9, time: 54, score: 7.8, type: "drive" },
    { name: "via PIE & Clementi Rd", distance: 28.5, time: 45, score: 8.5, type: "drive" },
    { name: "KJE/BKE Route", distance: 35.1, time: 50, score: 7.3, type: "drive" }, // New

    // --- Public ---
    { name: "MRT & Bus 190/961", distance: 35, time: 85, score: 6.2, type: "public" },
    { name: "MRT via North-South Line", distance: 40, time: 70, score: 7.5, type: "public" },
    { name: "Express Bus 151", distance: 30, time: 65, score: 6.8, type: "public" }, // New
    { name: "LRT/MRT via Circle Line", distance: 42, time: 95, score: 5.9, type: "public" }, // New

    // --- Walk ---
    { name: "Direct Walk through Park", distance: 3.5, time: 60, score: 9.1, type: "walk" },
    { name: "Walk via Main Street", distance: 4.2, time: 75, score: 8.0, type: "walk" },
    { name: "Scenic River Walk", distance: 4.8, time: 80, score: 7.9, type: "walk" }, // New
  ],
  drive: [
    { name: "via Seletar Expressway", distance: 32.9, time: 54, score: 7.8, type: "drive" },
    { name: "via PIE & Clementi Rd", distance: 28.5, time: 45, score: 8.5, type: "drive" },
    { name: "KJE/BKE Route", distance: 35.1, time: 50, score: 7.3, type: "drive" }, // New
    { name: "Coastal Highway Route", distance: 30.5, time: 48, score: 8.2, type: "drive" }, // New
  ],
  public: [
    { name: "MRT & Bus 190/961", distance: 35, time: 85, score: 6.2, type: "public" },
    { name: "MRT via North-South Line", distance: 40, time: 70, score: 7.5, type: "public" },
    { name: "Express Bus 151", distance: 30, time: 65, score: 6.8, type: "public" }, // New
    { name: "LRT/MRT via Circle Line", distance: 42, time: 95, score: 5.9, type: "public" }, // New
    { name: "Ferry + Bus Connection", distance: 25, time: 105, score: 5.1, type: "public" }, // New
  ],
  walk: [
    { name: "Direct Walk through Park", distance: 3.5, time: 60, score: 9.1, type: "walk" },
    { name: "Walk via Main Street", distance: 4.2, time: 75, score: 8.0, type: "walk" },
    { name: "Scenic River Walk", distance: 4.8, time: 80, score: 7.9, type: "walk" }, // New
    { name: "Shortest Sidewalk Path", distance: 3.2, time: 55, score: 8.8, type: "walk" }, // New
  ]
};

const transportModes = [
  { id: "best", icon: Star, label: "Best" },
  { id: "drive", icon: Car, label: "Driving" },
  { id: "public", icon: Bus, label: "Public" },
  { id: "walk", icon: Footprints, label: "Walk" },
] as const

const filterConfig = {
  best: [
    { label: "Time Taken", id: "time-taken" },
    { label: "Amount of Walking", id: "amount-of-walking" },
    { label: "Number of Transfers", id: "number-of-transfers" },
    { label: "Crowd Level", id: "crowd-level" },
    { label: "Bus Wait Time", id: "bus-wait-time" },
    { label: "Fare Cost", id: "fare-cost" },
    { label: "Carpark Availability", id: "carpark-availability" },
  ],
  drive: [
    { label: "Time Taken", id: "time-taken" },
    { label: "Amount of Walking", id: "amount-of-walking" },
    { label: "Carpark Availability", id: "carpark-availability" },
  ],
  public: [
    { label: "Time Taken", id: "time-taken" },
    { label: "Amount of Walking", id: "amount-of-walking" },
    { label: "Number of Transfers", id: "number-of-transfers" },
    { label: "Crowd Level", id: "crowd-level" },
    { label: "Bus Wait Time", id: "bus-wait-time" },
    { label: "Fare Cost", id: "fare-cost" },
  ],
  walk: [
    { label: "Time Taken", id: "time-taken" },
    { label: "Amount of Walking", id: "amount-of-walking" },
  ]
} as const;

// Initialize filter weights for all filter IDs
const initialFilterWeights: Record<string, number> = Object.keys(filterConfig).reduce(
  (acc, mode) => ({
    ...acc,
    ...filterConfig[mode as keyof typeof filterConfig].reduce(
      (innerAcc, filter) => ({
        ...innerAcc,
        [filter.id]: 5, // Default value of 5 for all filters
      }),
      {} as Record<string, number>
    ),
  }),
  {} as Record<string, number>
);

// Reusable FilterItem component to reduce repetition
const FilterItem = ({ label, value, onValueChange }: { label: string; value: number; onValueChange: (value: number[]) => void; }) => (
  <div className="py-3">
    <span className="text-white">{label}</span>
    <Slider className="py-3" value={[value]} min={0} max={10} step={1} onValueChange={onValueChange} />
    <div className="flex items-center justify-between text-muted-foreground text-xs">
      <span>Least Important</span>
      <span>Most Important</span>
    </div>
  </div>
);

const getRouteIcon = (type: string): LucideIcon => {
  switch (type) {
    case 'drive':
      return Car;
    case 'public':
      return Bus;
    case 'walk':
      return Footprints;
    default:
      return MapPinIcon; // Fallback icon
  }
};

// Reusable RouteCard component to reduce repetition
const RouteCard = ({ route }: { route: {
    name: string;
    distance: number;
    time: number;
    score: number;
    type: string;
    assignedCarpark: string
  };}) => {
  const RouteIcon = getRouteIcon(route.type);

  return (
    <div className="px-1 pt-4">
      <Card className="cursor-pointer">
        <CardHeader>
          <div className="flex items-center">
            <RouteIcon className="h-5 w-5 mr-2" />

            <CardTitle>{route.name}</CardTitle>
          </div>
          <CardDescription>Distance: {route.distance} km</CardDescription>
          <CardAction><Bookmark className="h-5 w-5 hover:text-blue-500 transition duration-150" /></CardAction>
        </CardHeader>
        <CardContent>
          <p>Time: {route.time} min</p>
        </CardContent>
        <CardFooter>
          <p>Convenience Score: {route.score.toFixed(2)}</p>
        </CardFooter>
      </Card>
    </div>
  )
};




// Add routing data prop @John
export function AppSidebarSearch({ options, loading, debouncedFetch, setOptions, setLayoutInURL, setStartValue, setEndValue, startValue, endValue, mapRef, ...props}: SidebarSearchProps & React.ComponentProps<typeof Sidebar>) {
  const [selectedMode, setSelectedMode] = useState<"best" | "drive" | "public" | "walk">("best");
  const [inputStartValue, setInputStartValue] = useState("");
  const [inputEndValue, setInputEndValue] = useState("");
  const [filterWeights, setFilterWeights] = useState<Record<string, number>>(initialFilterWeights);
  const {state} = useSidebar();
  const [routeResults, setRouteResults] = useState<{
    best: any[];
    driving: any[];
    public: any[];
    walking: any[];
  } | null>(null);


  const isCollapsed = state === "collapsed"
  // Temporary button state
  const [isToggled, setIsToggled] = useState(false);

  // Handle filter value changes
  const handleFilterChange = (filterId: string, value: number[]) => {
    setFilterWeights((prev) => ({
      ...prev,
      [filterId]: value[0]
    }));
  };
  
  // Uncomment once bug is fixed
  /*
  routes[selectedMode].map((route) => {
    // Update route.score here
    // route.score = filterWeights["time-taken"] * 2;
  })
  */
  const handleDrawRoutes = async (mode: "best" | "drive" | "public" | "walk") => {
    if (!mapRef?.current || !routeResults) return

    const leaflet = await import("leaflet")
    const map = mapRef.current.map;
    // Get the correct set of itineraries
    const itineraries =
      mode === "best"
        ? routeResults.best.map((r: any) => r.itinerary)
        : mode === "drive"
        ? routeResults.driving.map((r: any) => r.itinerary)
        : mode === "public"
        ? routeResults.public.map((r: any) => r.itinerary)
        : routeResults.walking.map((r: any) => r.itinerary)

    // Clear and draw
    clearMapOverlays(map)
    drawItinerariesOnMap(map, itineraries, leaflet, {
      drive: "red",
      public: ["#007AFF", "#34C759", "#AF52DE"],
    })
  }
  useEffect(() => {
    if (startValue && endValue) {
      // Get routes and plot polyline here @John
      console.log("Get Route");
    }
  }, [isToggled]); // Dependencies: Only run when 'isToggled' change

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            {!isCollapsed && (
              <div className="grid grid-cols-4 gap-2 px-2 py-2">
                {transportModes.map((mode) => {
                  const active = selectedMode === mode.id
                  return (
                    <Button
                      key={mode.id}
                      variant="ghost"
                      onClick={() => {
                        setSelectedMode(mode.id)
                        handleDrawRoutes(mode.id) // 🚀 Draw polylines on click
                      }}
                      className="flex flex-col items-center gap-1 h-12"
                    >
                      <mode.icon
                        className={`size-5 transition-colors ${
                          active ? "text-blue-500" : "text-white"
                        }`}
                      />
                      <span
                        className={`text-xs transition-colors ${
                          active ? "text-blue-500" : "text-white"
                        }`}
                      >
                      {mode.label}
                    </span>
                    </Button>
                  )
                })}
              </div>
            )}

            {!isCollapsed && (
              <div className="px-2 pt-4 flex items-center gap-3">
                <Circle className="h-3 w-3"></Circle>
                <Autocomplete
                  disablePortal
                  freeSolo
                  options={options}
                  getOptionLabel={(option: OneMapSearchResult | string) =>
                    typeof option === "string" ? option : option.SEARCHVAL
                  }
                  filterOptions={(x) => x}
                  loading={loading}
                  inputValue={startValue ? startValue.SEARCHVAL : inputStartValue}
                  onInputChange={(event, newInputValue) => {
                    setInputStartValue(newInputValue);

                    if (startValue) {
                      setStartValue(null);
                    }

                    if (newInputValue.length >= 2) {
                      debouncedFetch(newInputValue)
                    } else {
                      setOptions([])
                    }
                  }}

                  // Uses mapRef from map display to get long lat to pan to
                  onChange={(event, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      // const lat = parseFloat(newValue.LATITUDE)
                      // const lng = parseFloat(newValue.LONGITUDE)

                      setStartValue(newValue)
                    }
                  }}

                  // Formats the output of the dropdown list from the OneMapSearchResult type
                  renderOption={(props, option) => {
                    const {key, ...restProps} = props;
                    const opt = typeof option === "string" ? { SEARCHVAL: option, POSTAL: "", ROAD_NAME: ""} : option
                    return (
                      <li
                        key={`${opt.SEARCHVAL}-${opt.POSTAL || Math.random()}`}
                        {...restProps}
                        className="flex flex-col px-3 py-2 border-b border-[ffffff26] last:border-0 hover:bg-[#333333] transition-colors cursor-pointer"
                      >
                        <span className="text-white font-medium">{opt.SEARCHVAL}</span>
                        {opt.POSTAL && (
                          <span className="text-sm text-neutral-400">{opt.ROAD_NAME} {opt.POSTAL}</span>
                        )}
                      </li>
                    )
                  }}

                  // Only use is to make MUI search bar dark and fit the dark theme
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Choose starting point..."
                      variant="outlined"
                      size="small"
                      className="shadow-lg"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#121212",
                          "& fieldset": { border: "1px solid #ffffff26" },
                          "&:hover fieldset": { border: "1px solid #ffffff26" },
                          "&.Mui-focused fieldset": { border: "1px solid #2196F3" },
                        },
                        "& .MuiInputBase-input": {
                          color: "#fff",
                          "&::placeholder": { color: "#999", opacity: 1 }, // Placeholder styling
                          fontSize: "0.875rem", // Smaller font size (14px)
                        },
                        "& .MuiSvgIcon-root": { color: "#fff" }
                      }}
                    />
                  )}

                  slotProps={{
                    paper: {
                      sx: {
                        backgroundColor: "#121212",
                        color: "#fff",
                        borderRadius: "0.75rem",
                        boxShadow: "0px 4px 10px rgba(0,0,0,0.5)"
                      },
                    },
                  }}

                  className="flex-1"
                />
              </div>
            )}

            {!isCollapsed && (
              <div className="px-2 pt-4 flex items-center gap-3">
                <MapPinIcon className="h-3 w-3"></MapPinIcon>
                <Autocomplete
                  disablePortal
                  freeSolo
                  options={options}
                  getOptionLabel={(option: OneMapSearchResult | string) =>
                    typeof option === "string" ? option : option.SEARCHVAL
                  }
                  filterOptions={(x) => x}
                  loading={loading}
                  inputValue={endValue ? endValue.SEARCHVAL : inputEndValue}
                  onInputChange={(event, newInputValue) => {
                    setInputEndValue(newInputValue);

                    if (endValue) {
                      setEndValue(null);
                    }

                    if (newInputValue.length >= 2) {
                      debouncedFetch(newInputValue)
                    } else {
                      setOptions([])
                    }
                  }}

                  // Uses mapRef from map display to get long lat to pan to
                  onChange={(event, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      // const lat = parseFloat(newValue.LATITUDE)
                      // const lng = parseFloat(newValue.LONGITUDE)

                      setEndValue(newValue)
                    }
                  }}

                  // Formats the output of the dropdown list from the OneMapSearchResult type
                  renderOption={(props, option) => {
                    const {key, ...restProps} = props;
                    const opt = typeof option === "string" ? { SEARCHVAL: option, POSTAL: "", ROAD_NAME: ""} : option
                    return (
                      <li
                        key={`${opt.SEARCHVAL}-${opt.POSTAL || Math.random()}`}
                        {...restProps}
                        className="flex flex-col px-3 py-2 border-b border-[ffffff26] last:border-0 hover:bg-[#333333] transition-colors cursor-pointer"
                      >
                        <span className="text-white font-medium">{opt.SEARCHVAL}</span>
                        {opt.POSTAL && (
                          <span className="text-sm text-neutral-400">{opt.ROAD_NAME} {opt.POSTAL}</span>
                        )}
                      </li>
                    )
                  }}

                  // Only use is to make MUI search bar dark and fit the dark theme
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Choose destination..."
                      variant="outlined"
                      size="small"
                      className="shadow-lg"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#121212",
                          "& fieldset": { border: "1px solid #ffffff26" },
                          "&:hover fieldset": { border: "1px solid #ffffff26" },
                          "&.Mui-focused fieldset": { border: "1px solid #2196F3" },
                        },
                        "& .MuiInputBase-input": {
                          color: "#fff",
                          "&::placeholder": { color: "#999", opacity: 1 }, // Placeholder styling
                          fontSize: "0.875rem", // Smaller font size (14px)
                        },
                        "& .MuiSvgIcon-root": {color: "#fff"}
                      }}
                    />
                  )}

                  slotProps={{
                    paper: {
                      sx: {
                        backgroundColor: "#121212",
                        color: "#fff",
                        borderRadius: "0.75rem",
                        boxShadow: "0px 4px 10px rgba(0,0,0,0.5)"
                      },
                    },
                  }}

                  className="flex-1"
                />
              </div>
            )}

            {!isCollapsed && (
              <div className="px-2 pt-4">
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <div className="flex items-start gap-3">
                        <ListFilterIcon className="h-5 w-5" />
                        Filters
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      {
                        filterConfig[selectedMode].map((filter) => (
                          <FilterItem key={filter.id} label={filter.label} value={filterWeights[filter.id]} onValueChange={(value) => handleFilterChange(filter.id, value)} />
                        ))
                      }
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}


            
            {!isCollapsed && (
            <div className="px-2 pt-4">
              <Button
                className="w-full cursor-pointer"
                variant="outline"
                onClick={async () => {
                  if (!startValue || !endValue) {
                    alert("Please select both start and end points first.");
                    return;
                  }

                  const body = {
                    start: [parseFloat(startValue.LATITUDE), parseFloat(startValue.LONGITUDE)],
                    end: [parseFloat(endValue.LATITUDE), parseFloat(endValue.LONGITUDE)],
                    filterData: {
                      durationWeight: filterWeights["time-taken"],
                      walkingDistanceWeight: filterWeights["amount-of-walking"],
                      noTransferWeight: filterWeights["number-of-transfers"],
                      carparkAvailabilityWeight: filterWeights["carpark-availability"],
                      busWaitTimeWeight: filterWeights["bus-wait-time"],
                      platformDensityWeight: filterWeights["crowd-level"],
                      fareWeight: filterWeights["fare-cost"],
                    },
                  };

                  try {
                    const res = await fetch("/api/test-convenience", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    });

                    if (!res.ok) {
                      throw new Error(`Server error ${res.status}`);
                    }
                    const data = await res.json();
                    console.log("Received itineraries:", data);

                    setRouteResults(data);
                  } catch (err) {
                    console.error("Error fetching routes:", err);
                  }
                }}
              >
                Get Routes
              </Button>

              
            </div>
            )}
            
            {/* Temporary Button */}

          </SidebarGroupContent>
        </SidebarGroup>



        <SidebarGroup>
          <SidebarGroupLabel>Routes</SidebarGroupLabel>
<SidebarGroupContent>

  {!isCollapsed && (
    <>
      {routeResults ? (
        (
          selectedMode === "best"
            ? routeResults.best
            : selectedMode === "drive"
            ? routeResults.driving
            : selectedMode === "public"
            ? routeResults.public
            : routeResults.walking
        )
          .sort((a: any, b: any) =>
            selectedMode === "best" ? b.score - a.score : 0
          )
          // Limit to top 3 for best
          .slice(0, selectedMode === "best" ? 3 : undefined)
          .map((r: any, idx: number) => {
            const iti = r.itinerary;
            const score = r.score ?? 0;

            const mode =
              iti?.userMode === "drive"
                ? "Driving"
                : iti?.userMode === "pt"
                ? "Public Transport"
                : iti?.userMode === "walk"
                ? "Walking"
                : "Route";

            const title =
              mode === "Driving" && iti?.viaRoute
                ? `${mode} via ${iti.viaRoute}`
                : mode === "Public Transport"
                ? "Public Transport Route"
                : mode === "Walking"
                ? "Walking Route"
                : `Best Route (${iti?.userMode ?? "Mixed"})`;

            const keyId = `${selectedMode}-${mode}-${idx}-${iti?.viaRoute ?? iti?.summary ?? "none"}`;

            const distanceKm = (iti?.totalDistance ?? 0) / 1000;
            const durationMin = Math.round((iti?.totalDuration ?? 0) / 60);

            return (
              <RouteCard
                key={keyId}
                route={{
                  name: title,
                  distance: Number.isFinite(distanceKm)
                    ? distanceKm.toFixed(1)
                    : 0,
                  time: durationMin,
                  score,
                  type: iti?.userMode ?? "best",
                  assignedCarpark: "test"
                }}
              />
            );
          })
      ) : (
        <p className="text-muted-foreground text-sm px-3 py-2">
          No routes yet. Click “Get Routes” to fetch available options.
        </p>
      )}
    </>
  )}
</SidebarGroupContent>





        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
