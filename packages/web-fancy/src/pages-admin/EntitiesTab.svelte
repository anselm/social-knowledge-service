<script lang="ts">
  import { api } from '../services/api'
  import { apiClient } from '../services/apiClient'
  import { buildTree } from './tree'
  import EntityFilters from './EntityFilters.svelte'
  import EntityItem from './EntityItem.svelte'
  import EntityTreeItem from './EntityTreeItem.svelte'
  import EntityEditModal from './EntityEditModal.svelte'
  import type { Entity, EntityWithChildren } from '../types'
  
  let entities = $state<Entity[]>([])
  let treeEntities = $state<EntityWithChildren[]>([])
  let loading = $state(false)
  let searchQuery = $state('')
  let typeFilter = $state('')
  let editingEntity = $state<Entity | null>(null)
  let expandedNodes = $state(new Set<string>())
  
  $effect(() => {
    // Wait for API client to be fully initialized before loading entities
    console.log('EntitiesTab: Waiting for API client initialization...')
    ;(async () => {
      await (apiClient as any).init()
      console.log('EntitiesTab: API client initialized, loading entities...')
      await loadEntities()
    })()
  })
  
  export async function loadEntities() {
    loading = true
    try {
      console.log('EntitiesTab: Loading entities with filters:', { typeFilter, searchQuery })
      
      const filters: any = { limit: 1000 }
      if (typeFilter) filters.type = typeFilter
      if (searchQuery) filters.slugPrefix = searchQuery
      
      const data = await api.queryEntities(filters)
      console.log('EntitiesTab: Received entities:', data)
      entities = data || []
      console.log('EntitiesTab: Total entities:', entities.length)
      
      // Remove duplicates by ID before building tree
      const uniqueEntities = Array.from(
        new Map(entities.map(e => [e.id, e])).values()
      )
      console.log('EntitiesTab: Unique entities after dedup:', uniqueEntities.length)
      
      treeEntities = buildTree(uniqueEntities)
      console.log('EntitiesTab: Tree built with', treeEntities.length, 'root nodes')
    } catch (error) {
      console.error('EntitiesTab: Failed to load entities:', error)
      entities = []
      treeEntities = []
    } finally {
      loading = false
    }
  }
  
  function toggleExpanded(entityId: string) {
    if (expandedNodes.has(entityId)) {
      expandedNodes.delete(entityId)
    } else {
      expandedNodes.add(entityId)
    }
    expandedNodes = new Set(expandedNodes) // Trigger reactivity
  }
  
  async function handleDeleteEntity(id: string) {
    if (!confirm('Are you sure you want to delete this entity?')) return
    
    try {
      await api.deleteEntity(id)
      await loadEntities()
    } catch (error) {
      console.error('Failed to delete entity:', error)
      alert('Failed to delete entity')
    }
  }
  
  async function handleSaveEdit(event: CustomEvent) {
    const entity = event.detail
    try {
      await api.updateEntity(entity.id, {
        title: entity.title,
        content: entity.content,
        slug: entity.slug
      })
      editingEntity = null
      await loadEntities()
    } catch (error) {
      console.error('Failed to update entity:', error)
      alert('Failed to update entity')
    }
  }
</script>

<div>
  <EntityFilters 
    bind:searchQuery
    bind:typeFilter
    on:search={loadEntities}
    on:typeChange={loadEntities}
  />

  {#if loading}
    <div class="text-xs text-white/60">Loading...</div>
  {:else}
    <div class="text-xs text-white/40 mb-4">
      Total entities: {entities.length}
    </div>
    <div class="space-y-1">
      {#if searchQuery || typeFilter}
        <!-- Flat list when filtering -->
        {#each entities as entity}
          <div class="border border-white/20 p-3 text-xs">
            <EntityItem 
              {entity}
              onEdit={(e) => editingEntity = e}
              onDelete={handleDeleteEntity}
            />
          </div>
        {/each}
      {:else}
        <!-- Tree view when not filtering -->
        {#each treeEntities as entity}
          <EntityTreeItem 
            {entity}
            expanded={expandedNodes.has(entity.id)}
            {expandedNodes}
            onToggle={toggleExpanded}
            onEdit={(e) => editingEntity = e}
            onDelete={handleDeleteEntity}
          />
        {/each}
      {/if}
    </div>
  {/if}

  {#if editingEntity}
    <EntityEditModal 
      entity={editingEntity}
      on:save={handleSaveEdit}
      on:cancel={() => editingEntity = null}
    />
  {/if}
</div>
