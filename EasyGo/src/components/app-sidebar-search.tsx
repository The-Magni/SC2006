"use client"

import * as React from "react"
import { RefObject, useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"
import { NavUser } from "@/components/nav-user"
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Star, Car, Bus, Footprints, Circle, MapPinIcon, ListFilterIcon, Bookmark, LucideIcon, Loader2, DatabaseIcon } from "lucide-react";
import { OneMapSearchResult } from "@/lib/onemap/onemapAutoFill";
import type { MapDisplayHandle } from "@/components/map-display";
import { ConvenienceFilter, GetItinerariesResponse, useItineraryData } from "@/hooks/itinerary-data"
import { useDebounce } from "use-debounce"

// Polyline drawing imports

import { BaseItineraryData, DrivingItineraryData, ItineraryData} from "@/lib/controllers/Parser";
import { drawItineraryLine } from "@/lib/controllers/leaflet/leaflethelper-controller";

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

// This is sample data.D
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  }
}

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
    case 'DrivingItinerary':
      return Car;
    case 'PublicItinerary':
      return Bus;
    case 'SimpleWalkingItinerary':
      return Footprints;
    default:
      return MapPinIcon; // Fallback icon
  }
};

type Leg = {
  mode: string;
  duration: number;
  distance: number;
  description: string;
}

// Reusable RouteCard component to reduce repetition
const RouteCard = ({
  route,
  onClick
}: {
  route: {
    value: string;
    name: string;
    distance: number;
    time: number;
    score: number;
    type: string;
    legs: Leg[];
  };
  onClick: () => void;
}) => {
  const RouteIcon = getRouteIcon(route.type);

  return (
    <AccordionItem
      value={route.value}
      className="rounded-md border!"
      onClick={onClick}
    >
      {/* This is the trigger, it shows the summary.
        The [data-state=open] selector ensures the corners round correctly when open.
      */}
      <AccordionTrigger className="flex p-4 hover:no-underline">

        <div className="flex w-full items-center gap-3 text-left">
          {/* Icon */}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <RouteIcon className="h-5 w-5" />
          </span>

          {/* Title & Stats */}
          <div className="flex-1">
            <h4 className="font-semibold">{route.name}</h4>
            <p className="text-sm text-muted-foreground">
              {route.time} min ({route.distance.toFixed(1)} km)
            </p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-end gap-2 pl-2">
            <div className="flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-yellow-300">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold">{route.score.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      {/* This is the content, it shows the step-by-step details.
      */}
      <AccordionContent className="p-0">
        {/* Start Pin */}
        <div className="flex items-center gap-6 ml-7 mb-2">
          <Circle className="h-4 w-4 text-white" />
          <h4 className="font-semibold">Start</h4>
        </div>

        {/* Itinerary Legs */}
        {route.legs.map((leg, index) => (
          <div key={index} className="ml-8.5 px-8 py-3 border-l-2 border-l-blue-500">
            <div
              className="text-sm font-medium"
              dangerouslySetInnerHTML={{ __html: leg.description }}
            />
            <p className="text-sm text-muted-foreground">
              {leg.distance > 0 ? `${(leg.distance / 1000).toFixed(1)} km` : ""}
            </p>
          </div>
        ))}

        {/* End Pin */}
        <div className="flex items-center gap-6 ml-7 mt-2 mb-4">
          <MapPinIcon className="h-4 w-4 text-white" />
          <h4 className="font-semibold">End</h4>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};


// Add routing data prop @John
export function AppSidebarSearch({ options, loading, debouncedFetch, setOptions, setLayoutInURL, setStartValue, setEndValue, startValue, endValue, mapRef, ...props}: SidebarSearchProps & React.ComponentProps<typeof Sidebar>) {
  const [selectedMode, setSelectedMode] = useState<"best" | "drive" | "public" | "walk">("best");
  const [inputStartValue, setInputStartValue] = useState("");
  const [inputEndValue, setInputEndValue] = useState("");
  const [filterWeights, setFilterWeights] = useState<Record<string, number>>(initialFilterWeights);
  const [debouncedFilters] = useDebounce(filterWeights, 800);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const {state} = useSidebar();
  const isCollapsed = state === "collapsed"
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Temporary button state
  const [isToggled, setIsToggled] = useState(false);
  const {routes: routeResults, loading: routeLoading, getItinerariesAndScore, getScore, setRoutes } = useItineraryData()

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

  const prevFilters = React.useRef<Record<string, number>>(filterWeights);
  useEffect(() => {
    if (!routeResults) return;
    if (!startValue || !endValue) return;
    if (JSON.stringify(prevFilters.current) === JSON.stringify(debouncedFilters)) {
      return; // If no change, don't spam the API
    }
      prevFilters.current = debouncedFilters; 
      const controller = new AbortController();
      setIsRecalculating(true);

      const filtersForBackend: ConvenienceFilter = {
      durationWeight: debouncedFilters["time-taken"],
      walkingDistanceWeight: debouncedFilters["amount-of-walking"],
      noTransferWeight: debouncedFilters["number-of-transfers"],
      carparkAvailabilityWeight: debouncedFilters["carpark-availability"],
      busWaitTimeWeight: debouncedFilters["bus-wait-time"],
      platformDensityWeight: debouncedFilters["crowd-level"],
      fareWeight: debouncedFilters["fare-cost"],
    };

    const itinerariesPayload: GetItinerariesResponse = {
      driving: routeResults.driving.map((r) => r.itinerary),
      pt: routeResults.public.map((r) => r.itinerary),
      walking: routeResults.walking.map((r) => r.itinerary),
    };

    (async () => {
      try {
        const newScores = await getScore(itinerariesPayload, filtersForBackend);

        //FOR THE LOVE OF ALL THAT IS HOLY DO NOT REPLICATE THIS PATCHJOB
        //==============================================================
        const processedScores = {
          ...newScores,

        best: newScores.best.map((r) => {
            const mode = r.itinerary.mode.toLowerCase();
            const data = r.itinerary.data;

            const updatedLegs = data.legs.map((leg) => {
              if (leg.mode === "WALK" && "nearestCarpark" in data && mode.includes("drive")) {
                const driveData = data as DrivingItineraryData;
                return {
                  ...leg,
                  description: `Walk from${
                    driveData.nearestCarpark?.name ?? "nearest carpark"
                  } to ${endValue?.SEARCHVAL ?? "Destination"} (${(
                    leg.distance / 1000
                  ).toFixed(2)} km)`,
                };
              } else if (leg.mode === "WALK" && mode.includes("walk")) {
                return {
                  ...leg,
                  description: `Walk from ${startValue?.SEARCHVAL ?? "Origin"} to ${
                    endValue?.SEARCHVAL ?? "Destination"
                  } (${(leg.distance / 1000).toFixed(2)} km)`,
                };
              }
              return leg;
            });

            return {
              ...r,
              itinerary: {
                ...r.itinerary,
                data: {
                  ...data,
                  legs: updatedLegs,
                },
              },
            };
          }),

          driving: newScores.driving.map((r) => {
            const data = r.itinerary.data;
            return {
              ...r,
              itinerary: {
                ...r.itinerary,
                data: {
                  ...data,
                  legs: data.legs.map((leg) => ({
                    ...leg,
                    description:
                      leg.mode === "WALK"
                        ? `Walk from ${
                            "nearestCarpark" in data
                              ? (data as DrivingItineraryData).nearestCarpark?.name ?? "nearest carpark"
                              : "nearest carpark"
                          } to ${endValue?.SEARCHVAL ?? "Destination"} (${(
                            leg.distance / 1000
                          ).toFixed(2)} km)`
                        : leg.description,
                  })),
                },
              },
            };
          }),

          walking: newScores.walking.map((r) => {
            const data = r.itinerary.data;
            return {
              ...r,
              itinerary: {
                ...r.itinerary,
                data: {
                  ...data,
                  legs: data.legs.map((leg) => ({
                    ...leg,
                    description:
                      leg.mode === "WALK"
                        ? `Walk from ${startValue?.SEARCHVAL ?? "Origin"} to ${
                            endValue?.SEARCHVAL ?? "Destination"
                          } (${(leg.distance / 1000).toFixed(2)} km)`
                        : leg.description,
                  })),
                },
              },
            };
          }),
        };

        setRoutes(processedScores);
//==============================================================

      } catch (err) {
        console.error("Error updating scores:", err);
      } finally {
        setIsRecalculating(false);
      }
    }
  )();
      return () => controller.abort();

  }, [debouncedFilters, routeResults, startValue, endValue, getScore, setRoutes]);
  
  // Handle route card click to draw polyline on map
  const handleRouteClick = (itinerary: ItineraryData<BaseItineraryData>) => {
    if (!mapRef?.current?.map) return;
    const map = mapRef.current.map;
    mapRef.current.clearPolylines();
    drawItineraryLine(map, itinerary.mode, itinerary.data);
  };
const handleAutoSearch = async (start: OneMapSearchResult, end: OneMapSearchResult) => {
  try {
    setErrorMessage(null);

    const filters = {
      durationWeight: filterWeights["time-taken"],
      walkingDistanceWeight: filterWeights["amount-of-walking"],
      noTransferWeight: filterWeights["number-of-transfers"],
      carparkAvailabilityWeight: filterWeights["carpark-availability"],
      busWaitTimeWeight: filterWeights["bus-wait-time"],
      platformDensityWeight: filterWeights["crowd-level"],
      fareWeight: filterWeights["fare-cost"],
    };

    const result = await getItinerariesAndScore(
      [parseFloat(start.LATITUDE), parseFloat(start.LONGITUDE)],
      [parseFloat(end.LATITUDE), parseFloat(end.LONGITUDE)],
      start.SEARCHVAL,
      end.SEARCHVAL,
      filters
    );

    if (
      !result ||
      (!result.best?.length &&
        !result.driving?.length &&
        !result.public?.length &&
        !result.walking?.length)
    ) {
      setErrorMessage("No possible routes found. Please try another location.");
      setRoutes({ best: [], driving: [], public: [], walking: [] });
      mapRef?.current?.clearPolylines?.();
      return;
    }

    setRoutes(result);
  } catch (err) {
    console.error("Error fetching routes:", err);
    setErrorMessage("No possible routes found. Please try another location.");
    setRoutes({ best: [], driving: [], public: [], walking: [] });
    mapRef?.current?.clearPolylines?.();
  }
};

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
                  onChange={async (event, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      setStartValue(newValue);

                      // 🟦 Trigger auto search if endValue already chosen
                      if (endValue) {
                        await handleAutoSearch(newValue, endValue);
                      }
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
                  onChange={async (event, newValue) => {
                    if (newValue && typeof newValue !== "string") {
                      setEndValue(newValue);

                      if (startValue) {
                        await handleAutoSearch(startValue, newValue);
                      }
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


          </SidebarGroupContent>
        </SidebarGroup>
                    
        {!isCollapsed && (
          <Separator />
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Routes</SidebarGroupLabel>

          <SidebarGroupContent>
            {!isCollapsed && (
              <>
                {/* ——— Loader / No Routes ——— */}
                {(routeLoading || isRecalculating) ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mb-2 text-blue-500" />
                    <p className="text-sm">
                      {routeLoading ? "Fetching routes..." : "Recalculating scores..."}
                    </p>
                  </div>

                ) : routeResults ? (
                  (() => {
                    const currentRoutes =
                      selectedMode === "best"
                        ? routeResults.best
                        : selectedMode === "drive"
                          ? routeResults.driving
                          : selectedMode === "public"
                            ? routeResults.public
                            : routeResults.walking;

                    if (!currentRoutes?.length) {
                      return (
                        <p className="text-muted-foreground text-sm px-3 py-2">
                          No routes found for this mode.
                        </p>
                      );
                    }
                    {/* ——— Accordion with RouteCards ——— */}
                    return (
                      <Accordion type="single" collapsible className="w-full space-y-3">
                        {currentRoutes.map((r, idx) => (
                          <RouteCard
                            key={`${selectedMode}-route-${idx}`}
                            route={{
                              value: `${selectedMode}-route-${idx}`,
                              name: r.itinerary.data.name,
                              distance: (r.itinerary.data.totalDistance ?? 0) / 1000,
                              time: Math.round((r.itinerary.data.totalDuration ?? 0) / 60),
                              score: r.score ?? 0,
                              type: r.itinerary.mode as
                                | "DrivingItinerary"
                                | "PublicItinerary"
                                | "SimpleWalkingItinerary",
                              legs: r.itinerary.data.legs,
                            }}
                            onClick={() => handleRouteClick(r.itinerary)}
                          />
                        ))}
                      </Accordion>
                    );
                  })()
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