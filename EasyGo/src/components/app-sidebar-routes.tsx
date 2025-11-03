"use client"

import * as React from "react"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPinIcon, EllipsisVertical, Edit, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/hooks/useUser"
import { useSelectedItinerary } from "@/app/provider"
import { useRouter } from "next/navigation"

export interface ItineraryFilter {
  end: string;
  end_lat: number;
  end_lon: number;
  id: string;
  start: string;
  start_lat: number;
  start_lon: number;
  user_id: string;
  name: string | null;
  filters: {
    bus_wait_time: number;
      carpark_availability: number;
      duration: number;
      fare: number;
      id: string;
      itinerary_id: string;
      no_transfers: number;
      platform_density: number;
      walking_distance: number;
  };
}

interface SavedRouteCardProps {
  route: {
    id: string;
    name: string;
    start: string;
    end: string;
  };
  onClick?: () => void;
  onDelete: () => void;
}

const SavedRouteCard: React.FC<SavedRouteCardProps> = ({ route, onClick, onDelete}) => {
  const handleDelete = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const response = await fetch(`/api/itineraries/${route.id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    console.log(data);
    onDelete();
  };

  return (
    <div className="px-1 pt-4">
      <Card className="cursor-pointer" onClick={onClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center">
            <MapPinIcon className="h-5 w-5 mr-3" />

            <CardTitle>{route.name}</CardTitle>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-full text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Route options"
              >
                <EllipsisVertical className="h-5 w-5 transition duration-150" />
              </button>
            </DropdownMenuTrigger>

            {/* The content that appears when the trigger is clicked */}
            <DropdownMenuContent align="end">
              {/* Delete Option */}
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="pt-0 pb-3 pl-14 text-sm text-muted-foreground flex items-center">
          <span className="font-medium text-foreground truncate">
            {route.start}
          </span>
          <span className="mx-2 text-muted-foreground">
            <ArrowRight className="h-4 w-4" /> {/* Use an arrow icon */}
          </span>
          <span className="font-medium text-foreground truncate">
            {route.end}
          </span>
        </CardContent>
      </Card>
    </div>
  )
};


export function AppSidebarRoutes({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {state} = useSidebar();
  const isCollapsed = state === "collapsed"
  const [profile, setProfile] = useUser();
  const [savedRoutes, setSavedRoutes] = React.useState<ItineraryFilter[]>([]);
  const { setItinerary } = useSelectedItinerary();
  const router = useRouter();
  const handleClick = (i: ItineraryFilter) => {
    setItinerary(i);
    router.push('/?layout=search');
  }

  const getSavedRoutes = async () => {
    const response = await fetch('/api/itineraries', {
      method: 'GET'
    });
    if (!response.ok) {
      console.log('Error return saved routes');
      return null;
    }
    const data: { itinerariesWithFilter: ItineraryFilter[] } = await response.json();
    return data.itinerariesWithFilter;
  };

  React.useEffect(() => {
    const fetchData = async () => {
      const data = await getSavedRoutes();
      if (data) setSavedRoutes(data);
    };
    fetchData();
  }, []);

  // Determine the label text based on the number of saved routes
  const groupLabel = savedRoutes.length === 0 ? "No Saved Routes" : "Saved Routes";
  

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center gap-2 pl-3 pt-5">
        <Image
          className="cursor-pointer"
          src="/favicon.svg"
          alt="EasyGo Logo"
          width={24}
          height={24}
          onClick={() => {
            router.push('/');
          }}
        />
        {!isCollapsed && (
          <h1 className="text-base font-semibold cursor-pointer" onClick={() => {
            router.push('/');
          }}>
            Easy<span className="text-blue-500">Go</span>
          </h1>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>

          <SidebarGroupContent>
            {!isCollapsed && (
              savedRoutes.map((route, index) => (
                <SavedRouteCard
                  key={route.id}
                  route={{
                    id: route.id,
                    name: route.name || `My Favourite Route ${index+1}`,
                    start: route.start,
                    end: route.end 
                  }}
                  onClick={() => handleClick(route)}
                  onDelete={() => {
                    setSavedRoutes(prev => prev.filter(r => r.id !== route.id));
                  }}
                />
              ))
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {
          profile && <NavUser user={{
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar 
          }} />
        }
        </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
