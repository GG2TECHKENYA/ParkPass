import React, { useEffect, useRef, useState } from 'react'

const MapView = ({ spots = [], onSpotSelect, selectedSpot }) => {
  const mapRef = useRef(null)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google) {
        initMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDUpYAGNXK0cZpEo9Kwa4BmapLehCfiz6Y&libraries=places`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    }

    const initMap = () => {
      const mapOptions = {
        center: { lat: 40.7128, lng: -74.0060 }, // New York coordinates
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      }

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions)
      setMap(newMap)

      // Add markers for spots
      const newMarkers = spots.map((spot, index) => {
        const position = {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1
        }

        const marker = new window.google.maps.Marker({
          position,
          map: newMap,
          title: spot.name,
          icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="${selectedSpot?.id === spot.id ? '#EF4444' : '#3B82F6'}" stroke="white" stroke-width="2"/>
                ${selectedSpot?.id === spot.id ? '<circle cx="10" cy="10" r="4" fill="white"/>' : ''}
              </svg>
            `),
            scaledSize: new window.google.maps.Size(20, 20),
            anchor: new window.google.maps.Point(10, 10)
          }
        })

        marker.addListener('click', () => {
          onSpotSelect && onSpotSelect(spot)
        })

        return marker
      })

      setMarkers(newMarkers)
    }

    loadGoogleMaps()

    // Cleanup
    return () => {
      markers.forEach(marker => marker.setMap(null))
    }
  }, [spots, selectedSpot])

  // Fit map to show all markers when spots change
  useEffect(() => {
    if (map && markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      markers.forEach(marker => bounds.extend(marker.getPosition()))
      map.fitBounds(bounds)
    }
  }, [map, markers])

  return (
    <div className="w-full h-full rounded-lg relative">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Fallback if Google Maps fails to load */}
      {!window.google && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
          <div className="text-center text-gray-600">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">Loading Map...</h3>
            <p className="text-sm">Google Maps is initializing</p>
            <p className="text-xs mt-2">{spots.length} parking spots available</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView