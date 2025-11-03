<script lang="ts">

  import type { Entity } from '@/types'
  import { authStore } from '@/stores/auth'
  import { api } from '@/services/api'
  import EntityForm from './EntityForm.svelte'
  import { canUserEditEntity, getParentSlug } from '@/utils/entityHelpers'
  
  let { entity }: { entity: Entity } = $props()
  
  let editMode = $state(false)
  let deleting = $state(false)
  
  let canEdit = $derived(canUserEditEntity(entity, $authStore))
  
  async function handleEdit() {
    editMode = true
  }
  
  async function handleEditSubmit(event: CustomEvent) {
    const updates = event.detail
    
    try {
      await api.updateEntity(entity.id, {
        title: updates.title,
        content: updates.content,
        slug: updates.slug,
        view: updates.view,
        depiction: updates.depiction,
        latitude: updates.latitude,
        longitude: updates.longitude
      })
      
      editMode = false
      
      // If slug changed, navigate to new slug
      if (updates.slug !== entity.slug) {
        window.location.href = `?path=${encodeURIComponent(updates.slug)}`
      } else {
        // Reload current page
        window.location.reload()
      }
    } catch (error: any) {
      console.error('Failed to update entity:', error)
      alert('Failed to update entity: ' + (error.message || error))
    }
  }
  
  async function handleDelete() {
    if (deleting) return
    
    const confirmed = confirm(`Are you sure you want to delete "${entity.title || entity.slug}"?\n\nThis action cannot be undone.`)
    if (!confirmed) return
    
    deleting = true
    
    try {
      await api.deleteEntity(entity.id)
      
      // Navigate to parent
      const parentSlug = getParentSlug(entity.slug || '/')
      window.location.href = `?path=${encodeURIComponent(parentSlug)}`
    } catch (error: any) {
      console.error('Failed to delete entity:', error)
      alert('Failed to delete entity: ' + (error.message || error))
      deleting = false
    }
  }
</script>

{#if editMode}
  <div class="mb-8">
    <EntityForm
      {entity}
      parentSlug={getParentSlug(entity.slug || '/')}
      mode="edit"
      on:submit={handleEditSubmit}
      on:cancel={() => editMode = false}
    />
  </div>
{:else if canEdit}
  <div class="flex gap-2 mb-6">
    <button
      onclick={handleEdit}
      class="px-3 py-1 border border-white/20 hover:bg-white hover:text-black transition-colors text-xs uppercase tracking-wider"
    >
      Edit
    </button>
    <button
      onclick={handleDelete}
      disabled={deleting}
      class="px-3 py-1 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-xs uppercase tracking-wider disabled:opacity-50"
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  </div>
{/if}
