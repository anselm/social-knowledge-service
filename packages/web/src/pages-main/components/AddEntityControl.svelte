<script lang="ts">

  import type { Entity } from '@/types'
  import { authStore } from '@/stores/auth'
  import { api } from '@/services/api'
  import EntityForm from './EntityForm.svelte'
  
  let { parentEntity }: { parentEntity: Entity } = $props()
  
  let showForm = $state(false)
  let creating = $state(false)
  
  let canCreate = $derived(parentEntity.type === 'group' && $authStore)
  
  async function handleSubmit(event: CustomEvent) {
    if (creating) return
    
    const entityData = event.detail
    
    if (!$authStore) {
      alert('You must be logged in to create entities')
      return
    }
    
    creating = true
    
    try {
      const userAddress = $authStore.address || $authStore.issuer || ''
      
      const data: any = {
        type: entityData.type,
        title: entityData.title,
        content: entityData.content,
        slug: entityData.slug,
        auth: userAddress,
        sponsorId: userAddress,
        address: userAddress,
        contract: null,
        parentId: parentEntity.id
      }
      
      if (entityData.view) data.view = entityData.view
      if (entityData.depiction) data.depiction = entityData.depiction
      if (entityData.latitude !== null && entityData.latitude !== undefined) data.latitude = entityData.latitude
      if (entityData.longitude !== null && entityData.longitude !== undefined) data.longitude = entityData.longitude
      
      let result
      if (entityData.type === 'group') {
        result = await api.createGroup(data)
      } else if (entityData.type === 'party') {
        result = await api.createUser(data)
      } else {
        result = await api.createPost(data)
      }
      
      showForm = false
      
      // Navigate to new entity
      if (result?.slug) {
        window.location.href = `?path=${encodeURIComponent(result.slug)}`
      } else {
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Failed to create entity:', error)
      alert('Failed to create entity: ' + (error.message || error))
    } finally {
      creating = false
    }
  }
</script>

{#if canCreate}
  <div class="mt-8 pt-8 border-t border-white/10">
    {#if !showForm}
      <button
        onclick={() => showForm = true}
        class="px-3 py-1 border border-white/20 hover:bg-white hover:text-black transition-colors text-xs uppercase tracking-wider"
      >
        + New Entity
      </button>
    {/if}
    
    {#if showForm}
      <EntityForm
        parentSlug={parentEntity.slug || '/'}
        mode="create"
        on:submit={handleSubmit}
        on:cancel={() => showForm = false}
      />
    {/if}
  </div>
{/if}
