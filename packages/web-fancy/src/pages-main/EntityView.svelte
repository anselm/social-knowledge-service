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
      
      const entityData = await api.getEntityBySlug(querySlug)
      
      if (!entityData) {
        throw new Error(`Entity not found: ${querySlug}`)
      }
      
      entity = entityData
      
      console.log('EntityView: Loaded entity:', entity)
      console.log('EntityView: Entity type:', entity.type)
      console.log('EntityView: Entity view:', entity.view)
      
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
    {#if entity.type === 'post'}
      <PostView {entity} />
    {:else if entity.type === 'party'}
      <PartyView {entity} />
    {:else if entity.type === 'group'}
      {#if entity.view === 'map'}
        <GroupViewMap {entity} />
      {:else}
        <GroupViewGeneral {entity} />
      {/if}
    {:else}
      <div class="text-xs text-red-400">Unknown entity type: {entity.type}</div>
    {/if}
  {/if}
</div>
