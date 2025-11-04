<script lang="ts">

  import type { Entity } from '@/types'

  import { api } from '@/services/api'
  import { config } from '@/stores/appConfig'

  import RouterLink from './components/RouterLink.svelte'

  import PostView from './components/PostView.svelte'
  import PartyView from './components/PartyView.svelte'
  import GroupViewGeneral from './components/GroupViewGeneral.svelte'
  import GroupViewMap from './components/GroupViewMap.svelte'

  let { path = '/' }: { path?: string } = $props()

  let entity = $state<Entity | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)
  let entityType = $state('unknown')

  console.log('EntityView: Component script executing with path:', path)

  // Use $effect to watch path changes
  $effect(() => {
    const currentPath = path
    console.log('EntityView: $effect triggered with path:', currentPath)
    loadEntity(currentPath)
  })

  async function loadEntity(targetSlug: string) {
    console.log('EntityView: loadEntity START with:', targetSlug)
    
    loading = true
    error = null
    entity = null
    
    try {
      const querySlug = targetSlug.startsWith('/') ? targetSlug : `/${targetSlug}`
      console.log('EntityView: Fetching entity with slug:', querySlug)
      
      const response = await api.getEntityBySlug(querySlug)
      
      if (!response || !response.data) {
        throw new Error(`Entity not found: ${querySlug}`)
      }
      
      entity = response.data
      
      console.log('EntityView: Loaded entity:', entity)
      
      // Use kind field for type determination
      entityType = entity.kind || 'unknown'
      console.log('EntityView: Entity type:', entityType)
      console.log('EntityView: Entity meta.view:', entity.meta?.view)
      
    } catch (err: any) {
      console.error('EntityView: Failed to load entity:', err)
      
      if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('Entity not found')) {
        error = `Page not found: ${targetSlug}`
      } else if (err.status === 403) {
        error = 'You do not have permission to view this page'
      } else if (err.message === 'Failed to fetch' || err.code === 'ECONNREFUSED') {
        error = 'Server unavailable'
      } else {
        error = err.message || 'Failed to load page'
      }
      entity = null
    } finally {
      loading = false
      console.log('EntityView: loadEntity COMPLETE')
      console.log('EntityView: Final state - loading:', loading, 'entity:', entity?.id, 'error:', error)
    }
  }
</script>

<div>
  {#if loading}
    <div class="text-xs text-white/60">Loading...</div>
  {:else if error}
    <div class="space-y-4">
      <div class="text-sm text-red-400">{error}</div>
      <RouterLink to="/" className="text-xs text-white/60 hover:text-white underline">
        {#snippet children()}
          ← Back to home
        {/snippet}
      </RouterLink>
    </div>
  {:else if !entity}
    <div class="space-y-4">
      <div class="text-sm text-white/60">Page not found</div>
      <RouterLink to="/" className="text-xs text-white/60 hover:text-white underline">
        {#snippet children()}
          ← Back to home
        {/snippet}
      </RouterLink>
    </div>
  {:else}
    {#if entityType === 'post'}
      <PostView {entity} />
    {:else if entityType === 'party'}
      <PartyView {entity} />
    {:else if entityType === 'group'}
      {#if entity.meta?.view === 'map'}
        <GroupViewMap {entity} />
      {:else}
        <GroupViewGeneral {entity} />
      {/if}
    {:else if entityType === 'place'}
      <!-- TODO: Create PlaceView component -->
      <div class="text-sm text-blue-400">Place view not yet implemented</div>
    {:else if entityType === 'thing'}
      <!-- TODO: Create ThingView component -->
      <div class="text-sm text-blue-400">Thing view not yet implemented</div>
    {:else}
      <div class="space-y-4">
        <div class="text-xs text-red-400">Unknown entity type: {entityType}</div>
        <div class="text-xs text-white/60 bg-white/5 p-2 rounded">
          <div>Entity structure:</div>
          <pre class="text-xs mt-1">{JSON.stringify(entity, null, 2)}</pre>
        </div>
      </div>
    {/if}
  {/if}
</div>
