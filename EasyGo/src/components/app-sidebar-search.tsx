"use client"

import * as React from "react"
import {RefObject, useState} from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"
import { NavUser } from "@/components/nav-user"
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Star, Car, Bus, Footprints, Circle, MapPinIcon, ListFilterIcon, Bookmark } from "lucide-react";
import { OneMapSearchResult } from "@/lib/onemapAutoFill";
import type { MapDisplayHandle } from "@/components/map-display";

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
    { name: "via Seletar Expressway", distance: 32.9, time: 54, score: 7.8, type: "drive" },
    { name: "via PIE & Clementi Rd", distance: 28.5, time: 45, score: 8.5, type: "drive" },
    { name: "MRT & Bus 190/961", distance: 35, time: 85, score: 6.2, type: "public" },
    { name: "MRT via North-South Line", distance: 40, time: 70, score: 7.5, type: "public" },
    { name: "Direct Walk through Park", distance: 3.5, time: 60, score: 9.1, type: "walk" },
    { name: "Walk via Main Street", distance: 4.2, time: 75, score: 8.0, type: "walk" }
  ],
  drive: [
    { name: "via Seletar Expressway", distance: 32.9, time: 54, score: 7.8, type: "drive" },
    { name: "via PIE & Clementi Rd", distance: 28.5, time: 45, score: 8.5, type: "drive" },
  ],
  public: [
    { name: "MRT & Bus 190/961", distance: 35, time: 85, score: 6.2, type: "public" },
    { name: "MRT via North-South Line", distance: 40, time: 70, score: 7.5, type: "public" },
  ],
  walk: [
    { name: "Direct Walk through Park", distance: 3.5, time: 60, score: 9.1, type: "walk" },
    { name: "Walk via Main Street", distance: 4.2, time: 75, score: 8.0, type: "walk" }
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
    { label: "Time Taken", id: "time-taken-best" },
    { label: "Amount of Walking", id: "amount-of-walking-best" },
    { label: "Number of Transfers", id: "number-of-transfers-best" },
    { label: "Crowd Level", id: "crowd-level-best" },
    { label: "Bus Wait Time", id: "bus-wait-time-best" },
    { label: "Fare Cost", id: "fare-cost-best" },
    { label: "Carpark Availability", id: "carpark-availability-best" },
  ],
  drive: [
    { label: "Time Taken", id: "time-taken-drive" },
    { label: "Amount of Walking", id: "amount-of-walking-drive" },
    { label: "Carpark Availability", id: "carpark-availability-drive" },
  ],
  public: [
    { label: "Time Taken", id: "time-taken-public" },
    { label: "Amount of Walking", id: "amount-of-walking-public" },
    { label: "Number of Transfers", id: "number-of-transfers-public" },
    { label: "Crowd Level", id: "crowd-level-public" },
    { label: "Bus Wait Time", id: "bus-wait-time-public" },
    { label: "Fare Cost", id: "fare-cost-public" },
  ],
  walk: [
    { label: "Time Taken", id: "time-taken-walk" },
    { label: "Amount of Walking", id: "amount-of-walking-walk" },
  ]
} as const;

// Reusable FilterItem component to reduce repetition
const FilterItem = ({ label }: { label: string }) => (
  <div className="py-3">
    <span className="text-white">{label}</span>
    <Slider className="py-3" defaultValue={[5]} max={10} step={1} />
    <div className="flex items-center justify-between text-muted-foreground text-xs">
      <span>Least Important</span>
      <span>Most Important</span>
    </div>
  </div>
);

// Reusable RouteCard component to reduce repetition
const RouteCard = ({ route }: { route: {
    name: string;
    distance: number;
    time: number;
    score: number;
    type: string
  };}) => (
  <div className="px-1 pt-4">
    <Card className="cursor-pointer">
      <CardHeader>
        <CardTitle>{route.name}</CardTitle>
        <CardDescription>Distance: {route.distance}</CardDescription>
        <CardAction><Bookmark className="h-5 w-5" /></CardAction>
      </CardHeader>
      <CardContent>
        <p>Time: {route.time}</p>
      </CardContent>
      <CardFooter>
        <p>Convenience Score: {route.score}</p>
      </CardFooter>
    </Card>
  </div>
);

// Add routing data prop @John
export function AppSidebarSearch({ options, loading, debouncedFetch, setOptions, setLayoutInURL, setStartValue, setEndValue, startValue, endValue, mapRef, ...props}: SidebarSearchProps & React.ComponentProps<typeof Sidebar>) {
  const [selectedMode, setSelectedMode] = useState<"best" | "drive" | "public" | "walk">("best");
  const [inputStartValue, setInputStartValue] = useState("");
  const [inputEndValue, setInputEndValue] = useState("");
  const {state} = useSidebar();
  const isCollapsed = state === "collapsed"

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
                          <FilterItem key={filter.id} label={filter.label} />
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
              routes[selectedMode].map((route) => (
                <RouteCard key={route.name} route={route} />
              ))
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
