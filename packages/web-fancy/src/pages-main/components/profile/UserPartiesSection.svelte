<script lang="ts">
  import type { Entity } from '@/types'
  import { authStore } from '@/stores/auth'
  import { userApi } from '@/services/userApi'
  import { api } from '@/services/api'
  import RouterLink from '../RouterLink.svelte'
  import EntityForm from '../EntityForm.svelte'
  
  let parties = $state<Entity[]>([])
  let loading = $state(true)
  let showCreateForm = $state(false)
  let editingParty = $state<Entity | null>(null)
  let creating = $state(false)
  let entityFormRef: any = $state(null)
  
  $effect(() => {
    loadParties()
  })
  
  async function loadParties() {
    if (!$authStore) {
      loading = false
      return
    }
    
    loading = true
    try {
      const authIdentifier = $authStore.address || $authStore.issuer || ''
      parties = await userApi.getUserParties(authIdentifier)
    } catch (error) {
      console.error('Failed to load parties:', error)
    } finally {
      loading = false
    }
  }
  
  function handleCreateNew() {
    editingParty = null
    showCreateForm = true
  }
  
  function handleEdit(party: Entity) {
    editingParty = party
    showCreateForm = true
  }
  
  function handleCancel() {
    showCreateForm = false
    editingParty = null
  }
  
  async function handleSubmit(event: CustomEvent) {
    if (creating) return
    
    const data = event.detail
    creating = true
    
    try {
      const userAddress = $authStore?.address || $authStore?.issuer || ''
      
      if (editingParty) {
        // Update existing party
        await api.updateEntity(editingParty.id, {
          title: data.title,
          content: data.content,
          slug: data.slug,
          depiction: data.depiction,
          latitude: data.latitude,
          longitude: data.longitude
        })
      } else {
        // Create new party
        await api.createUser({
          type: 'party',
          title: data.title,
          content: data.content,
          slug: data.slug,
          depiction: data.depiction,
          latitude: data.latitude,
          longitude: data.longitude,
          auth: userAddress,
          sponsorId: userAddress,
          address: userAddress,
          contract: null
        })
      }
      
      // Clear form and reload
      if (entityFormRef) {
        entityFormRef.clearSubmitting()
      }
      showCreateForm = false
      editingParty = null
      await loadParties()
    } catch (error: any) {
      console.error('Failed to save party:', error)
      
      // Extract error details
      let errorMessage = 'Failed to save'
      let validationErrors: string[] = []
      
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        validationErrors = error.validationErrors
        errorMessage = 'Validation failed'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Pass error to form
      if (entityFormRef) {
        entityFormRef.setError(errorMessage, validationErrors)
      } else {
        alert(`${errorMessage}${validationErrors.length > 0 ? ':\n' + validationErrors.join('\n') : ''}`)
      }
    } finally {
      creating = false
    }
  }
</script>

<div class="bg-white/5 border border-white/20 rounded-lg p-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold">Your Identity</h2>
    {#if parties.length > 0 && !showCreateForm}
      <button
        onclick={handleCreateNew}
        class="px-3 py-1 border border-white/20 hover:bg-white hover:text-black transition-colors text-xs uppercase tracking-wider"
      >
        + New Identity
      </button>
    {/if}
  </div>
  
  {#if loading}
    <div class="text-xs text-white/60">Loading...</div>
  {:else if showCreateForm}
    <EntityForm
      bind:this={entityFormRef}
      entity={editingParty}
      parentSlug="/"
      mode={editingParty ? 'edit' : 'create'}
      on:submit={handleSubmit}
      on:cancel={handleCancel}
    />
  {:else if parties.length === 0}
    <div class="space-y-4">
      <div class="text-sm text-white/70">
        <p class="mb-3">Welcome! You haven't created your identity yet.</p>
        <p class="mb-3">In this system, your identity is represented by a "party" entity - think of it as your home page or profile that others can visit.</p>
        <p>Let's create your first identity to get started!</p>
      </div>
      <button
        onclick={handleCreateNew}
        class="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium"
      >
        Create My Identity
      </button>
    </div>
  {:else}
    <div class="space-y-3">
      {#each parties as party}
        <div class="border border-white/10 p-4 rounded">
          <div class="flex items-start gap-4">
            {#if party.depiction}
              <img 
                src={party.depiction} 
                alt={party.title || 'Profile'} 
                class="w-16 h-16 rounded-full object-cover"
              />
            {:else}
              <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <span class="text-2xl">👤</span>
              </div>
            {/if}
            
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-medium mb-1">{party.title || 'Untitled'}</h3>
              {#if party.slug}
                <p class="text-xs text-white/40 font-mono mb-2">{party.slug}</p>
              {/if}
              {#if party.content}
                <p class="text-xs text-white/60 line-clamp-2">{party.content}</p>
              {/if}
              
              <div class="flex gap-2 mt-3">
                <RouterLink 
                  to={party.slug || `/${party.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {#snippet children()}
                    View Public Profile →
                  {/snippet}
                </RouterLink>
                <button
                  onclick={() => handleEdit(party)}
                  class="text-xs text-white/60 hover:text-white"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
