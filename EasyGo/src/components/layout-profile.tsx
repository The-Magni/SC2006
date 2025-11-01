import ProfileHeader from "@/components/profile-header";
import ProfileContent from "@/components/profile-content";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebarDefault } from "@/components/app-sidebar-default";

export default function LayoutProfile() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "400px",
        } as React.CSSProperties
      }
    >
      <AppSidebarDefault />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
          <SidebarTrigger className="-ml-1" />
        </header>

        {/* Centered content wrapper */}
        <div className="flex min-h-screen justify-center">
          <div className="w-full max-w-4xl space-y-6 px-4 py-10">
            <ProfileHeader />
            <ProfileContent />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}