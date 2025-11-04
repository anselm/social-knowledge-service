<script lang="ts">
  import type { Entity } from '@/types'
  import { navigateTo } from '@/utils/navigation'

  interface MapDrawerProps {
    children: Entity[]
    selectedMarker: Entity | null
    drawerMode: 'minimized' | 'places' | 'preview'
    onDrawerModeChange: (mode: 'minimized' | 'places' | 'preview') => void
    onPlaceSelect: (child: Entity) => void
  }

  let { 
    children, 
    selectedMarker, 
    drawerMode,
    onDrawerModeChange,
    onPlaceSelect
  }: MapDrawerProps = $props()

  function handleBarClick() {
    if (drawerMode === 'minimized') {
      onDrawerModeChange('places')
    } else if (drawerMode === 'places') {
      onDrawerModeChange('minimized')
    } else if (drawerMode === 'preview') {
      onDrawerModeChange('places')
    }
  }

  function handlePlaceClick(child: Entity) {
    onPlaceSelect(child)
    onDrawerModeChange('preview')
  }

  function handleDetailsClick() {
    if (selectedMarker) {
      navigateTo(selectedMarker.meta?.slug || `/${selectedMarker.id}`)
    }
  }
</script>

<div 
  class="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/20 transition-all duration-300 ease-out"
  style="height: {drawerMode === 'minimized' ? '40px' : drawerMode === 'places' ? '200px' : '350px'};"
>
  <!-- Handle Bar -->
  <div class="relative h-1 flex items-center justify-center px-4">
    <button 
      onclick={handleBarClick}
      class="w-12 h-1 bg-white/40 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
      aria-label="Toggle drawer"
    ></button>
  </div>

  <!-- Drawer Content -->
  <div class="overflow-hidden" style="height: calc(100% - 4px);">
    {#if drawerMode === 'places'}
      <!-- Places list -->
      <div class="p-4">
        <div class="flex gap-3 overflow-x-auto -mx-4">
          {#each children.slice(0, 20) as child}
            <button
              onclick={() => handlePlaceClick(child)}
              class="flex-shrink-0 w-40 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg overflow-hidden transition-colors"
              aria-label="View {child.meta?.label || 'Untitled'}"
            >
              {#if child.meta?.depiction}
                <img 
                  src={child.meta.depiction} 
                  alt={child.meta?.label || 'Place'} 
                  class="w-full h-24 object-cover"
                />
              {:else}
                <div class="w-full h-24 bg-white/5 flex items-center justify-center">
                  <span class="text-2xl">📍</span>
                </div>
              {/if}
              <div class="p-2">
                <div class="text-xs font-medium truncate">{child.meta?.label || 'Untitled'}</div>
                <div class="text-xs text-white/40 uppercase">{child.kind}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {:else if drawerMode === 'preview' && selectedMarker}
      <!-- Preview of selected marker -->
      <div class="p-4 overflow-y-auto h-full">
        <div class="max-w-2xl mx-auto">
          <!-- Action buttons at top -->
          <div class="flex justify-end gap-2 mb-4">
            <button
              onclick={handleDetailsClick}
              class="px-3 py-2 border border-white/20 hover:bg-white/10 transition-colors text-sm rounded"
              aria-label="View details"
            >→ Details</button>
          </div>

          <!-- Depiction image -->
          {#if selectedMarker.meta?.depiction}
            <img 
              src={selectedMarker.meta.depiction} 
              alt={selectedMarker.meta?.label || 'Image'} 
              class="w-full h-48 object-cover rounded-lg mb-4"
            />
          {/if}

          <!-- Title and type -->
          <div class="mb-3">
            <h3 class="text-lg font-semibold mb-1">{selectedMarker.meta?.label || 'Untitled'}</h3>
            <div class="text-xs text-white/40 uppercase">
              {selectedMarker.kind}
              {#if selectedMarker.kind === 'group' && selectedMarker.location?.rad}
                • {selectedMarker.location.rad}m radius
              {/if}
            </div>
          </div>

          <!-- Content -->
          {#if selectedMarker.meta?.content}
            <p class="text-sm text-white/70 line-clamp-4">{selectedMarker.meta.content}</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>