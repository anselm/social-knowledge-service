<script lang="ts">
  import mapboxgl from 'mapbox-gl'
  import 'mapbox-gl/dist/mapbox-gl.css'
  import type { Entity } from '@/types'

  interface MapViewProps {
    entity: Entity
    children: Entity[]
    mapboxToken: string
    onMarkerSelect?: (child: Entity) => void
  }

  let { 
    entity, 
    children, 
    mapboxToken, 
    onMarkerSelect 
  }: MapViewProps = $props()

  let mapContainer = $state<HTMLDivElement | undefined>()
  let mapParentContainer = $state<HTMLDivElement | undefined>()
  let map: mapboxgl.Map | null = null
  let mapReady = $state(false)
  let initError = $state<string | null>(null)
  let hasInitialized = $state(false)
  let mapHeight = $state(400)

  // Track markers and circles for cleanup
  let markers: mapboxgl.Marker[] = []
  let circles: string[] = []

  // Filter children that have location data
  let locatedChildren = $derived(children.filter(child => 
    child.location?.lat != null && child.location?.lon != null
  ))

  // Calculate map height based on parent container
  $effect(() => {
    if (mapParentContainer) {
      const updateHeight = () => {
        const rect = mapParentContainer!.getBoundingClientRect()
        const newHeight = Math.max(400, rect.height) // Minimum 400px
        if (newHeight !== mapHeight) {
          mapHeight = newHeight
          
          // Force map resize if it exists
          if (map && mapReady) {
            setTimeout(() => {
              map?.resize()
            }, 50)
          }
        }
      }
      
      updateHeight()
      
      const resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(mapParentContainer)
      
      return () => {
        resizeObserver.disconnect()
      }
    }
  })

  // Initialize map when container is ready
  $effect(() => {
    if (!mapContainer || hasInitialized || mapHeight === 0) {
      return
    }

    hasInitialized = true
    initMap()
  })

  // Update markers when children change
  $effect(() => {
    if (mapReady && map) {
      updateMarkers()
    }
  })

  // Cleanup on unmount
  $effect(() => {
    return () => {
      if (map) {
        map.remove()
      }
    }
  })

  function updateMarkers() {
    clearMarkers()
    addMarkers()
  }

  function clearMarkers() {
    // Remove existing markers
    markers.forEach(marker => marker.remove())
    markers = []
    
    // Remove existing circles
    circles.forEach(circleId => {
      if (map?.getLayer(circleId)) {
        map.removeLayer(circleId)
      }
      if (map?.getSource(circleId)) {
        map.removeSource(circleId)
      }
    })
    circles = []
  }

  function addMarkers() {
    if (!map) return

    locatedChildren.forEach((child) => {
      if (child.location?.lat == null || child.location?.lon == null) return

      // Add radius circle for groups
      if (child.kind === 'group' && child.location?.rad) {
        addCircle(child)
      }

      // Add marker
      addMarker(child)
    })

    // Fit bounds if we have markers
    if (locatedChildren.length > 0) {
      fitBounds()
    }
  }

  function addCircle(child: Entity) {
    if (!map || !child.location?.lat || !child.location?.lon || !child.location?.rad) return

    const circleId = `circle-${child.id}`
    
    // Create GeoJSON circle
    const center = [child.location.lon, child.location.lat]
    const radiusInKm = child.location.rad / 1000 // Convert meters to km
    const points = 64
    const coords: number[][] = []
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI
      const dx = radiusInKm * Math.cos(angle)
      const dy = radiusInKm * Math.sin(angle)
      const lat = child.location.lat + (dy / 111.32)
      const lng = child.location.lon + (dx / (111.32 * Math.cos(child.location.lat * Math.PI / 180)))
      coords.push([lng, lat])
    }
    coords.push(coords[0]) // Close the circle

    map.addSource(circleId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      }
    })

    map.addLayer({
      id: circleId,
      type: 'fill',
      source: circleId,
      paint: {
        'fill-color': '#667eea',
        'fill-opacity': 0.2
      }
    })

    map.addLayer({
      id: `${circleId}-outline`,
      type: 'line',
      source: circleId,
      paint: {
        'line-color': '#667eea',
        'line-width': 2,
        'line-opacity': 0.6
      }
    })

    circles.push(circleId, `${circleId}-outline`)
  }

  function addMarker(child: Entity) {
    if (!map || !child.location?.lat || !child.location?.lon) return

    // Create custom marker element
    const el = document.createElement('div')
    el.style.cursor = 'pointer'
    
    if (child.meta?.depiction) {
      el.innerHTML = `
        <div style="
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #fff;
          box-shadow: 0 0 20px rgba(255,255,255,0.6), 0 4px 12px rgba(0,0,0,0.5);
          background: white;
          transition: transform 0.2s ease;
        " class="marker-hover">
          <img 
            src="${child.meta.depiction}" 
            style="width: 100%; height: 100%; object-fit: cover;"
            alt="${child.meta?.label || 'Marker'}"
          />
        </div>
      `
    } else {
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 4px 12px rgba(0,0,0,0.5);
          transition: transform 0.2s ease;
        " class="marker-hover"></div>
      `
    }

    // Add hover effects
    el.addEventListener('mouseenter', () => {
      const markerEl = el.querySelector('.marker-hover') as HTMLElement
      if (markerEl) {
        markerEl.style.transform = 'scale(1.15)'
      }
    })
    
    el.addEventListener('mouseleave', () => {
      const markerEl = el.querySelector('.marker-hover') as HTMLElement
      if (markerEl) {
        markerEl.style.transform = 'scale(1)'
      }
    })

    // Add click handler
    el.addEventListener('click', () => {
      onMarkerSelect?.(child)
    })

    const marker = new mapboxgl.Marker(el)
      .setLngLat([child.location.lon, child.location.lat])
      .addTo(map)

    markers.push(marker)
  }

  function fitBounds() {
    if (!map || locatedChildren.length === 0) return

    const bounds = new mapboxgl.LngLatBounds()
    locatedChildren.forEach(child => {
      if (child.location?.lat && child.location?.lon) {
        bounds.extend([child.location.lon, child.location.lat])
      }
    })
    
    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 80 },
      maxZoom: 15,
      animate: true,
      duration: 1000
    })
  }

  async function initMap() {
    try {
      if (!mapboxToken) {
        initError = 'Mapbox access token not configured. Please set VITE_MAPBOX_ACCESS_TOKEN.'
        return
      }

      mapboxgl.accessToken = mapboxToken

      // Determine center point
      const centerLat = entity.location?.lat || locatedChildren[0]?.location?.lat || 45.5152
      const centerLng = entity.location?.lon || locatedChildren[0]?.location?.lon || -122.6784

      map = new mapboxgl.Map({
        container: mapContainer!,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [centerLng, centerLat],
        zoom: 10
      })

      map.on('load', () => {
        mapReady = true
        addMarkers()
        
        setTimeout(() => {
          if (map) {
            map.resize()
          }
        }, 100)
      })

      map.on('error', (e) => {
        console.error('Mapbox error:', e)
      })
      
    } catch (error) {
      console.error('MapView error:', error)
      initError = error instanceof Error ? error.message : String(error)
    }
  }

  // Export map resize function for external use
  export function resizeMap() {
    if (map) {
      map.resize()
    }
  }

  // Export update height function
  export function updateHeight(newHeight: number) {
    mapHeight = newHeight
    if (map) {
      setTimeout(() => {
        map?.resize()
      }, 50)
    }
  }

  // Export function to force height recalculation
  export function recalculateHeight() {
    if (mapParentContainer) {
      const rect = mapParentContainer.getBoundingClientRect()
      const newHeight = Math.max(400, rect.height)
      updateHeight(newHeight)
    }
  }
</script>

<div 
  bind:this={mapParentContainer}
  class="w-full h-full min-h-[400px]"
>
  <div 
    bind:this={mapContainer}
    class="w-full h-full rounded-lg border border-white/20 overflow-hidden"
    style="background: #0a0a0a; height: {mapHeight}px;"
  >
    {#if initError}
      <div class="flex items-center justify-center h-full">
        <div class="text-xs text-red-400 text-center p-4">
          Map initialization error: {initError}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.marker-hover:hover) {
    transform: scale(1.15) !important;
  }
</style>