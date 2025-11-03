<script lang="ts">
  import type { Entity } from '@/types'
  import { renderMarkdown } from '@/utils/markdown'
  import { authStore } from '@/stores/auth'
  import { api } from '@/services/api'

  let { 
    entity, 
    showContent = true,
    showStats = false,
    showDepiction = true
  }: { 
    entity: Entity, 
    showContent?: boolean,
    showStats?: boolean,
    showDepiction?: boolean
  } = $props()
  
  // Favorite state
  let isFavorited = $state(false)
  let checkingFavorite = $state(false)
  let togglingFavorite = $state(false)
  
  // Get stats from entity metadata or use defaults
  let stats = $derived({
    memberCount: entity.metadata?.memberCount ?? 0,
    recentPosts: entity.metadata?.recentPosts ?? 0,
    isPublic: entity.metadata?.isPublic ?? true,
    createdAt: entity.createdAt,
    createdBy: entity.auth ? `${entity.auth.substring(0, 6)}...${entity.auth.substring(entity.auth.length - 4)}` : null
  })
  
  // Check if entity is favorited when component mounts or auth changes
  $effect(() => {
    checkFavoriteStatus()
  })
  
  async function checkFavoriteStatus() {
    if (!$authStore || !$authStore.partyId) {
      isFavorited = false
      return
    }
    
    checkingFavorite = true
    try {
      isFavorited = await api.isFavorited($authStore.partyId, entity.id)
    } catch (error) {
      console.error('Failed to check favorite status:', error)
    } finally {
      checkingFavorite = false
    }
  }
  
  async function toggleFavorite() {
    if (!$authStore || !$authStore.partyId) {
      alert('Please log in to add favorites')
      return
    }
    
    if (togglingFavorite) return
    
    togglingFavorite = true
    try {
      if (isFavorited) {
        await api.removeFavorite($authStore.partyId, entity.id)
        isFavorited = false
      } else {
        await api.addFavorite($authStore.partyId, entity.id)
        isFavorited = true
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      alert('Failed to update favorite. Please try again.')
    } finally {
      togglingFavorite = false
    }
  }
</script>

<div>
  {#if showDepiction && entity.depiction}
    <div class="mb-2 -mx-4 md:mx-0">
      <img 
        src={entity.depiction} 
        alt={entity.title || 'Banner'} 
        class="w-full h-32 md:h-40 object-cover rounded-none md:rounded"
      />
    </div>
  {/if}
  
  <div class="flex items-start justify-between gap-4">
    <h1 class="text-lg mb-2 flex-1">{entity.title || entity.slug || 'Untitled'}</h1>
    
    {#if $authStore && $authStore.partyId}
      <button
        onclick={toggleFavorite}
        disabled={togglingFavorite || checkingFavorite}
        class="flex-shrink-0 p-2 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {#if togglingFavorite || checkingFavorite}
          <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        {:else if isFavorited}
          <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        {:else}
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        {/if}
      </button>
    {/if}
  </div>
  
  {#if showStats && entity.type === 'group'}
    <div class="flex flex-wrap gap-3 mb-4 text-xs text-black/60 dark:text-white/60">
      {#if stats.memberCount > 0}
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {stats.memberCount} members
        </span>
      {/if}
      {#if stats.recentPosts > 0}
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          {stats.recentPosts} posts
        </span>
      {/if}
      <span class="flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {stats.isPublic ? 'Public' : 'Private'}
      </span>
      <span class="flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Created {new Date(stats.createdAt).toLocaleDateString()}
      </span>
      {#if stats.createdBy}
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
            By {stats.createdBy}
        </span>
      {/if}
    </div>
  {/if}
  
  {#if showContent && entity.content}
    <div class="text-sm text-black/60 dark:text-white/60 prose-content">
      {@html renderMarkdown(entity.content)}
    </div>
  {/if}
</div>
