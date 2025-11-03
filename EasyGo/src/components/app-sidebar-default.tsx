"use client"

import * as React from "react"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from "@/components/ui/sidebar"
import { Bookmark } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useUser } from "@/hooks/useUser"


export function AppSidebarDefault({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {state} = useSidebar();
  const isCollapsed = state === "collapsed"
  const [profile, setProfile] = useUser();
  const router = useRouter();

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
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => {
                router.push('?layout=routes');
              }}>
                <Bookmark className="mr-2 h-4 w-4" />
                <span>Saved Routes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {
          profile && 
          <NavUser user={{
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
