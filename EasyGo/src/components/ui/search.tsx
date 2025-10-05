import * as React from "react"

import { cn } from "@/lib/utils"

import { Search as SearchIcon } from "lucide-react"

function Search({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        type={type}
        data-slot="input"
        className={cn(
            // Remove borders, background, outlines
            "bg-transparent border-none outline-none ring-0 shadow-none",
            // Text styling
            "text-foreground placeholder:text-muted-foreground",
            // Proper input spacing with icon
            "h-9 w-full pl-10 pr-3 py-1 text-base rounded-md transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
        )}
        {...props}
      />
    </div>
  )
}

export { Search }
