import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebarRoutes } from "@/components/app-sidebar-routes";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import InputAdornment from '@mui/material/InputAdornment';
import { Search } from "lucide-react"
import type { OneMapSearchResult } from "@/lib/onemap/onemapAutoFill";
import type { MapDisplayHandle } from "@/components/map-display";
import dynamic from "next/dynamic";
import { RefObject } from "react";

const MapDisplay = dynamic(() => import("@/components/map-display"), {
  ssr: false,
});

type LayoutRoutesProps = {
  options: OneMapSearchResult[];
  loading: boolean;
  debouncedFetch: (value: string) => void;
  setLayoutInURL: (layout: "default" | "search" | "routes" | "signup" | "login" | "profile") => void;
  setStartValue: (value: OneMapSearchResult) => void;
  setEndValue: (value: OneMapSearchResult) => void;
  setOptions: React.Dispatch<React.SetStateAction<OneMapSearchResult[]>>;
  mapRef: RefObject<MapDisplayHandle | null>;
};


export default function LayoutRoutes(
  {
    options,
    loading,
    debouncedFetch,
    setOptions,
    setLayoutInURL,
    setStartValue,
    setEndValue,
    mapRef
  }: LayoutRoutesProps
) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "400px",
        } as React.CSSProperties
      }
    >
      <AppSidebarRoutes />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-neutral-800 bg-[#121212]">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="flex-1 w-full">
            <Autocomplete
              disablePortal
              freeSolo
              options={options}
              getOptionLabel={(option: OneMapSearchResult | string) =>
                typeof option === "string" ? option : option.SEARCHVAL
              }
              filterOptions={(x) => x}
              loading={loading}
              onInputChange={(event, newInputValue) => {
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
                  // mapRef.current?.panTo(lat, lng, newValue.ADDRESS)

                  setEndValue(newValue)
                  setLayoutInURL("search")
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
                  placeholder="Search location..."
                  variant="outlined"
                  className="shadow-lg"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="h-5 w-5 text-muted-foreground pointer-events-none" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#121212",
                      "& fieldset": { border: "none" },
                      "&:hover fieldset": { border: "none" },
                      "&.Mui-focused fieldset": { border: "none" },
                    },
                    "& .MuiInputBase-input": {
                      color: "#fff",
                      "&::placeholder": { color: "#999", opacity: 1 }, // Placeholder styling
                      fontSize: "1rem"
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
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.5)",
                  },
                },
              }}
            />
          </div>
        </header>

        <div className="flex flex-1 flex-col pt-0">
          <MapDisplay ref={mapRef} setLayoutInURL={setLayoutInURL} setStartValue={setStartValue} setEndValue={setEndValue} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}