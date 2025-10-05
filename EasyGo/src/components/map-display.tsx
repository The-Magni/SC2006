"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export default function MapDisplay() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    console.log("Effect")
    if (mapContainerRef.current) {
      const sw = L.latLng(1.144, 103.535)
      const ne = L.latLng(1.494, 104.502)
      const bounds = L.latLngBounds(sw, ne)

      const map = L.map(mapContainerRef.current, {
        center: L.latLng(1.2868108, 103.8545349),
        zoom: 16,
        attributionControl: false
      })

      map.setMaxBounds(bounds)

      const basemap = L.tileLayer("https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png", {
        detectRetina: true,
        maxZoom: 19,
        minZoom: 11
      })

      basemap.addTo(map)

      map.on("click", (e: L.LeafletMouseEvent) => {
        if (markerRef.current) {
          markerRef.current.remove()
        }
        const marker = L.marker(e.latlng).addTo(map)
        marker.bindPopup(
            `Clicked at ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`
        ).openPopup()
        markerRef.current = marker
      })

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })

      resizeObserver.observe(mapContainerRef.current)

      // Clean up on unmount
      return () => {
        console.log("Cleanup")
        map.remove()
        resizeObserver.disconnect()
        mapContainerRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  return (
      <div
          ref={mapContainerRef}
          className="h-full w-full"
      >
      </div>
  )
}
