"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { OneMapSearchResult } from "@/lib/onemap/onemapAutoFill"

export interface MapDisplayHandle {
  map: L.Map
  panTo: (lat: number, lng: number, popupText?: string) => void
  clearPolylines: () => void
}

// 1. Define the props interface to accept the functions
interface MapDisplayProps {
  setLayoutInURL: (layout: "default" | "search" | "routes" | "signup" | "login" | "profile") => void;
  setStartValue: (value: OneMapSearchResult) => void;
  setEndValue: (value: OneMapSearchResult) => void;
}

const MapDisplay = forwardRef<MapDisplayHandle, MapDisplayProps>(
  ({ setLayoutInURL, setStartValue, setEndValue }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const polylineLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const sw = L.latLng(1.144, 103.535)
      const ne = L.latLng(1.494, 104.502)
      const bounds = L.latLngBounds(sw, ne)

      const map = L.map(mapContainerRef.current, {
        center: L.latLng(1.2868108, 103.8545349),
        zoom: 16,
        attributionControl: true,
      })

      mapRef.current = map
      map.attributionControl.setPrefix(false)
      map.setMaxBounds(bounds)
      map.setMinZoom(11);
      map.setMaxZoom(18);
      map.on("drag", function () {
      map.panInsideBounds(bounds, { animate: false });
      });
      const basemap = L.tileLayer(
        "https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png",
        {
          detectRetina: true,
          maxZoom: 19,
          minZoom: 11,
             /** DO NOT REMOVE the OneMap attribution below **/
          attribution:
            '<span style="display:flex;align-items:center;gap:4px;line-height:1;">' +
              '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" ' +
                'style="height:14px;width:14px;vertical-align:middle;" />' +
              '<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer" style="color:#fff;text-decoration:none;">OneMap</a>' +
              '&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;' +
              '<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer" style="color:#fff;text-decoration:none;">Singapore Land Authority</a>' +
            '</span>',
        }
      )

      basemap.addTo(map)

      // Click marker behavior
      map.on("click", (e: L.LeafletMouseEvent) => {
        if (markerRef.current) markerRef.current.remove()

        const lat = e.latlng.lat
        const lng = e.latlng.lng
        const latLngStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`

        // Create a partial OneMapSearchResult object for the setters
        const partialResult: OneMapSearchResult = {
          SEARCHVAL: `Selected Location (${latLngStr})`,
          BLK_NO: "",
          ROAD_NAME: "",
          BUILDING: "",
          ADDRESS: latLngStr, // Use lat/lng string as address
          POSTAL: "",
          X: "0",
          Y: "0",
          LATITUDE: lat.toString(),
          LONGITUDE: lng.toString(),
        }

        // Create dynamic popup content
        const popupContent = document.createElement("div")
        popupContent.innerHTML = `<b>Selected Location</b><br>${latLngStr}<br><br>`

        // Add CSS for options
        const style = document.createElement("style")
        if (!document.getElementById("map-popup-div-style")) {
          style.id = "map-popup-div-style"
          style.innerHTML = `
              .map-popup-div {
                margin-bottom: 6px;
                cursor: pointer;
                font-size: 14px;
                text-align: center;
              }
              .map-popup-div:hover { text-decoration: underline; }
            `
          document.head.appendChild(style)
        }

        // Add "Travel from Here" option (conditionally)
        if (setStartValue) {
          const startButton = document.createElement("div")
          startButton.innerHTML = "Travel from Here"
          startButton.className = "map-popup-div"
          startButton.onclick = () => {
            setStartValue(partialResult)
            map.closePopup()
            setLayoutInURL("search")
          }
          popupContent.appendChild(startButton)
        }

        // Add "Travel to Here" option (conditionally)
        if (setEndValue) {
          const endButton = document.createElement("div")
          endButton.innerHTML = "Travel to Here"
          endButton.className = "map-popup-div"
          endButton.onclick = () => {
            setEndValue(partialResult)
            map.closePopup()
            setLayoutInURL("search")
          }
          popupContent.appendChild(endButton)
        }

        // Create and open marker/popup
        const marker = L.marker(e.latlng).addTo(map)
        marker.bindPopup(popupContent).openPopup()

        // Clean up marker on popup close
        marker.on("popupclose", () => {
          if (markerRef.current === marker) {
            markerRef.current.remove()
            markerRef.current = null
          }
        })

        markerRef.current = marker
      })

      // Handle resize
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
    map: mapRef.current as L.Map,

    panTo(lat, lng, popupText) {
      if (!mapRef.current) return;

      if (markerRef.current) markerRef.current.remove();

      const marker = L.marker([lat, lng]).addTo(mapRef.current);
      if (popupText) marker.bindPopup(popupText).openPopup();
      mapRef.current.setView([lat, lng], 18);
      markerRef.current = marker;
    },
    clearPolylines() {
      if (!mapRef.current) return;

      mapRef.current.eachLayer((layer) => {
        if (!(layer instanceof L.TileLayer)) {
          mapRef.current!.removeLayer(layer);
        }
      });
    },
  }));

  return <div ref={mapContainerRef} className="h-full w-full" />
})

MapDisplay.displayName = "MapDisplay"
export default MapDisplay
