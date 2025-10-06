"use client"

import { Car, Bus, Footprints, Star, Map } from "lucide-react"
import { useState } from "react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function NavMain() {
  const [selectedMode, setSelectedMode] = useState("best")
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const transportModes = [
    { id: "best", icon: Star, label: "Best" },
    { id: "drive", icon: Car, label: "Driving" },
    { id: "public", icon: Bus, label: "Public" },
    { id: "walk", icon: Footprints, label: "Walk" },
  ] as const

  const modeRouteList: Record<string, string> = {
    best: "Enter best route information cards here",
    drive: "Enter driving route information cards here",
    public: "Enter public transport route information cards here",
    walk: "Enter walking route information cards here",
  }

  return (
    <>
    {/* shove all hidable stuff here in the iscollapsed div when click the collapsible icon*/}
      <div 
        className={`transition-all duration-300 overflow-hidden ${
          isCollapsed ? "opacity-0 h-0 pointer-events-none" : "opacity-100 h-auto"
        }`}
      >
        <SidebarGroup>
          <SidebarGroupLabel>Select Mode of Transport</SidebarGroupLabel>
          <div className="grid grid-cols-4 gap-2 w-full">
            {transportModes.map((mode) => {
              const active = selectedMode === mode.id
              return (
                <Button
                  key={mode.id}
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedMode(mode.id)}
                  className={[
                    "h-10 w-full px-0 rounded-lg transition-all border flex items-center justify-center",
                    active
                      ? "bg-[#2596be] border-[#2596be] text-white"
                      : "bg-transparent border-[#2596be]/40 text-white hover:bg-[#2596be]/10",
                  ].join(" ")}
                >
                  <mode.icon
                    className={`size-5 transition-colors ${
                      active
                        ? "text-blue"
                        : "text-blue hover:text-[#2596be]"
                    }`}
                  />
                  <span className="sr-only">{mode.label}</span>
                </Button>
              )
            })}
          </div>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          <SidebarGroupLabel>Route Information</SidebarGroupLabel>
          <div className="p-3 text-sm text-muted-foreground leading-relaxed">
            {modeRouteList[selectedMode]}
          </div>
          <Button className="mt-2 w-full bg-[#2596be] hover:bg-[#2596be]/90 text-white">
            TEST I AM A BUTTON
          </Button>
        </SidebarGroup>
      </div>



        <SidebarGroup className="mt-4">
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="#">
                        <Map className="mr-2 h-4 w-4" />
                        <span>Saved Routes</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
    </>
    
  )
}
