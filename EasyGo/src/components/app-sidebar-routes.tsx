"use client"

import * as React from "react"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPinIcon, EllipsisVertical, Edit, Trash2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  }
}

// Sample saved route data
const routes = [
  {name: "My Favourite Route 1", start: "Location A", end: "Location B"},
  {name: "My Favourite Route 2", start: "Location C", end: "Location D"},
  {name: "My Favourite Route 3", start: "Location E", end: "Location F"},
]

const SavedRouteCard = ({ route }: { route: {
    name: string;
    start: string;
    end: string;
  };}) => {
  const handleRename = () => {
    console.log(`Renaming route: ${route.name}`);
  };

  const handleDelete = () => {
    console.log(`Deleting route: ${route.name}`);
  };

  return (
    <div className="px-1 pt-4">
      <Card className="cursor-pointer">
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

              {/* Rename Option */}
              <DropdownMenuItem onClick={handleRename}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </DropdownMenuItem>

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

  return (
    <Sidebar collapsible="icon" {...props}>
      <Link href="/">
        <SidebarHeader className="flex flex-row items-center gap-2 pl-3 pt-5">
          <Image
            src="/favicon.svg"
            alt="EasyGo Logo"
            width={24}
            height={24}
          />
          {!isCollapsed && (
            <h1 className="text-base font-semibold">
              Easy<span className="text-blue-500">Go</span>
            </h1>
          )}
        </SidebarHeader>
      </Link>

      <SidebarContent>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel>Saved Routes</SidebarGroupLabel>

          <SidebarGroupContent>
            {!isCollapsed && (
              routes.map((route, index) => (
                <SavedRouteCard
                  key={index}
                  route={route}
                />
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
