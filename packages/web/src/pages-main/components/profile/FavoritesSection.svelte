<script lang="ts">
  import type { Entity } from '@/types'
  import { authStore } from '@/stores/auth'
  import { api } from '@/services/api'
  import RouterLink from '../RouterLink.svelte'
  import loggers from '@/services/logger'
  
  const log = loggers.profile
  
  let favorites = $state<Entity[]>([])
  let loading = $state(true)
  let removingId = $state<string | null>(null)
  
  $effect(() => {
    loadFavorites()
  })
  
  async function loadFavorites() {
    if (!$authStore || !$authStore.partyId) {
      loading = false
      return
    }
    
    loading = true
    try {
      // TODO: Implement favorites with new relationship system
      // For now, return empty array since relationships API may not be fully implemented
      favorites = []
      log.info('Favorites feature temporarily disabled - needs relationship system implementation')
    } catch (error) {
      console.error('Failed to load favorites:', error)
      favorites = []
    } finally {
      loading = false
    }
  }
  
  async function handleRemoveFavorite(entityId: string) {
    if (!$authStore || !$authStore.partyId) return
    if (removingId) return
    
    const confirmed = confirm('Remove this item from your favorites?')
    if (!confirmed) return
    
    removingId = entityId
    try {
      await api.removeFavorite($authStore.partyId, entityId)
      // Reload favorites
      await loadFavorites()
    } catch (error) {
      console.error('Failed to remove favorite:', error)
      alert('Failed to remove favorite. Please try again.')
    } finally {
      removingId = null
    }
  }
</script>

<div class="bg-white/5 border border-white/20 rounded-lg p-6">
  <h2 class="text-lg font-semibold mb-4">Favorites</h2>
  
  {#if loading}
    <div class="text-xs text-white/60">Loading...</div>
  {:else if favorites.length === 0}
    <div class="text-sm text-white/60">
      <p class="mb-2">You haven't favorited anything yet.</p>
      <p class="text-xs text-white/40">
        Click the star icon on any entity to add it to your favorites.
      </p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each favorites as favorite}
        <div class="border border-white/10 p-4 rounded hover:border-white/20 transition-colors">
          <div class="flex items-start gap-4">
            {#if favorite.depiction}
              <img 
                src={favorite.depiction} 
                alt={favorite.title || 'Image'} 
                class="w-16 h-16 object-cover flex-shrink-0 rounded"
              />
            {/if}
            
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-1">
                <RouterLink 
                  to={favorite.slug || `/${favorite.id}`}
                  className="text-sm font-medium hover:underline flex-1"
                >
                  {#snippet children()}
                    {favorite.title || 'Untitled'}
                  {/snippet}
                </RouterLink>
                
                <button
                  onclick={() => handleRemoveFavorite(favorite.id)}
                  disabled={removingId === favorite.id}
                  class="text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Remove from favorites"
                >
                  {#if removingId === favorite.id}
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  {/if}
                </button>
              </div>
              
              <div class="text-xs text-white/40 mb-2">
                [{favorite.type}] {favorite.slug || `/${favorite.id}`}
              </div>
              
              {#if favorite.content}
                <p class="text-xs text-white/60 line-clamp-2">{favorite.content}</p>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
