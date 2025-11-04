<script lang="ts">
  import type { Entity } from '@/types'
  import { config } from '@/stores/appConfig'
  import { api } from '@/services/api'

  import EntityHeader from './EntityHeader.svelte'
  import MapView from './map/MapView.svelte'
  import MapDrawer from './map/MapDrawer.svelte'
  import FilterBar from './map/FilterBar.svelte'

  let { entity }: { entity: Entity } = $props()

  let mapParentContainer = $state<HTMLDivElement | undefined>()
  let mapView: any = $state()
  let children = $state<Entity[]>([])
  let loading = $state(true)

  // Filter state
  let activeFilters = $state<Set<string>>(new Set(['post', 'party', 'group', 'place', 'event']))
  
  // Pull-up drawer state
  type DrawerMode = 'minimized' | 'places' | 'preview'
  let drawerMode = $state<DrawerMode>('minimized')
  let selectedMarker = $state<Entity | null>(null)
  
  // Filter children that have location data and match active filters
  let filteredChildren = $derived(children.filter(child => 
    child.location?.lat != null && 
    child.location?.lon != null && 
    activeFilters.has(child.kind || 'unknown')
  ))

  // Get Mapbox token from config
  let mapboxToken = $derived($config.map?.mapboxAccessToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '')

  // Load children when component mounts
  $effect(() => {
    loadChildren()
  })

  async function loadChildren() {
    loading = true
    try {
      const childrenData = await api.queryChildren(entity.id)
      
      children = (childrenData || []).sort((a: Entity, b: Entity) => {
        const dateA = new Date(a.time?.updated || a.time?.created || '').getTime() || 0
        const dateB = new Date(b.time?.updated || b.time?.created || '').getTime() || 0
        return dateB - dateA
      })
    } catch (error) {
      console.error('Failed to load children:', error)
      children = []
    } finally {
      loading = false
    }
  }

  function handleMarkerSelect(child: Entity) {
    selectedMarker = child
    drawerMode = 'preview'
  }

  function handleDrawerModeChange(mode: DrawerMode) {
    drawerMode = mode
  }

  function handlePlaceSelect(child: Entity) {
    selectedMarker = child
  }

  function toggleFilter(type: string) {
    if (activeFilters.has(type)) {
      activeFilters.delete(type)
    } else {
      activeFilters.add(type)
    }
    activeFilters = new Set(activeFilters) // Trigger reactivity
  }
</script>

<div class="absolute inset-0 flex flex-col px-0 w-full max-w-container mx-auto">
  <div class="flex-shrink-0">
    <EntityHeader {entity} showContent={false} showStats={true} />
  </div>

  <div class="flex-1 min-h-0 relative" bind:this={mapParentContainer}>
    <!-- Filter Bar -->
    <FilterBar {activeFilters} onFilterToggle={toggleFilter} />
    
    <!-- Map View -->
    <MapView 
      bind:this={mapView}
      {entity}
      children={filteredChildren}
      {mapboxToken}
      onMarkerSelect={handleMarkerSelect}
    />

    <!-- Pull-up Drawer -->
    <MapDrawer 
      children={filteredChildren}
      {selectedMarker}
      {drawerMode}
      onDrawerModeChange={handleDrawerModeChange}
      onPlaceSelect={handlePlaceSelect}
    />
  </div>
</div>
