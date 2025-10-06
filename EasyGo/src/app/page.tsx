"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Search } from "@/components/ui/search" //original search, now use autocomplete from mui
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import dynamic from "next/dynamic"
import {type OneMapSearchResult, fetchResults} from "@/lib/onemapAutoFill"
import {  useState, useMemo, useRef } from "react"
import Autocomplete from "@mui/material/Autocomplete"
import debounce from "lodash/debounce"
import TextField from "@mui/material/TextField"

import type { MapDisplayHandle } from "@/components/map-display"
const MapDisplay = dynamic(() => import("@/components/map-display"), {
  ssr: false,
})





export default function Page() {
  //one map auto-complete function
  const [options, setOptions] = useState<OneMapSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const mapRef = useRef<MapDisplayHandle | null>(null)

  //debounce to prevent api spamming
  const debouncedFetch = useMemo(
    () =>
      debounce(async (val: string) => {
        if (!val || val.length < 2) return
        setLoading(true)
        try {
          const results = await fetchResults(val)
          setOptions(results)
        } catch (err) {
          console.error("Search error:", err)
        } finally {
          setLoading(false)
        }
      }, 400),
    []
  )



  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-neutral-800 bg-[#121212]">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div className="flex-1 max-w-lg">
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

              // uses mapref from map display to get long lat to pan to
              onChange={(event, newValue) => {
                if (newValue && typeof newValue !== "string") {
                  const lat = parseFloat(newValue.LATITUDE)
                  const lng = parseFloat(newValue.LONGITUDE)
                  mapRef.current?.panTo(lat, lng, newValue.ADDRESS)
                }
              }}

              //formats the output of the dropdown list from the Onemapsearchresult type
              renderOption={(props, option) => {
                  const opt = typeof option === "string" ? { SEARCHVAL: option, POSTAL: "", ROAD_NAME: ""} : option
                return (
                  <li
                    {...props}
                    key={`${opt.SEARCHVAL}-${opt.POSTAL || Math.random()}`}
                    className="flex flex-col px-3 py-2 border-b border-[#2596be]/20 last:border-0 hover:bg-[#2596be]/20 transition-colors"
                  >
                    <span className="text-white font-medium">{opt.SEARCHVAL}</span>
                    {opt.POSTAL && (
                        <span className="text-sm text-neutral-400">{opt.ROAD_NAME} {opt.POSTAL}</span>
                    )}
                  </li>
                )
              }}

              //only use is to make mui search bar dark and fit the dark theme
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search location..."
                  variant="outlined"
                  className="w-full rounded-xl shadow-lg"
                  InputProps={{
                    ...params.InputProps,
                    className:
                      "bg-[#1e1e1e] text-white placeholder:text-neutral-400 border border-[#2596be]/60 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2596be] transition-all",
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#2596be99" },
                      "&:hover fieldset": { borderColor: "#2596be" },
                      "&.Mui-focused fieldset": { borderColor: "#2596be" },
                    },
                    "& .MuiInputBase-input": { color: "#fff" },
                    "& .MuiInputLabel-root": { color: "#999" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#2596be" },
                  }}
                />
              )}
              slotProps={{
                paper: {
                  sx: {
                    backgroundColor: "#1e1e1e",
                    border: "1px solid #2596be66",
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
          <MapDisplay ref={mapRef}/>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
