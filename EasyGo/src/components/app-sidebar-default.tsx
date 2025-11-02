"use client"

import * as React from "react"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Bookmark } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  }
}

export function AppSidebarDefault({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="?layout=routes">
                  <Bookmark className="mr-2 h-4 w-4" />
                  <span>Saved Routes</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
