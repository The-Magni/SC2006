"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export interface MapDisplayHandle {
  panTo: (lat: number, lng: number, popupText?: string) => void
}

const MapDisplay = forwardRef<MapDisplayHandle>((_, ref) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (mapContainerRef.current) {
      const sw = L.latLng(1.144, 103.535)
      const ne = L.latLng(1.494, 104.502)
      const bounds = L.latLngBounds(sw, ne)

      const map = L.map(mapContainerRef.current, {
        center: L.latLng(1.2868108, 103.8545349),
        zoom: 16,
        attributionControl: false,
      })

      mapRef.current = map

      map.setMaxBounds(bounds)

      const basemap = L.tileLayer(
        "https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png",
        {
          detectRetina: true,
          maxZoom: 19,
          minZoom: 11,
        }
      )

      basemap.addTo(map)

      // Add click marker
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (markerRef.current) markerRef.current.remove()

        const marker = L.marker(e.latlng).addTo(map)
        marker
          .bindPopup(
            `Clicked at ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`
          )
          .openPopup()

        markerRef.current = marker
      })

      // Handle container resize
      const resizeObserver = new ResizeObserver(() => map.invalidateSize())
      resizeObserver.observe(mapContainerRef.current)

      // Cleanup
      return () => {
        map.remove()
        resizeObserver.disconnect()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  useImperativeHandle(ref, () => ({
    panTo(lat: number, lng: number, popupText?: string) {
      if (!mapRef.current) return

      if (markerRef.current) markerRef.current.remove()

      const marker = L.marker([lat, lng]).addTo(mapRef.current)
      if (popupText) marker.bindPopup(popupText).openPopup()
      mapRef.current.setView([lat, lng], 18)
      markerRef.current = marker
    },
  }))

  return <div ref={mapContainerRef} className="h-full w-full" />
})

MapDisplay.displayName = "MapDisplay"
export default MapDisplay
