<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { generateEntityId, buildEntitySlug } from '@/utils/entityHelpers'
  import type { Entity } from '@/types'
  
  let { entity = null, parentSlug = '/', mode = 'create' }: { 
    entity?: Entity | null, 
    parentSlug?: string, 
    mode?: 'create' | 'edit' 
  } = $props()
  
  const dispatch = createEventDispatcher()
  
  let formData = $state({
    type: entity?.type || 'post',
    title: entity?.title || '',
    content: entity?.content || '',
    slug: entity?.slug || buildEntitySlug(parentSlug),
    view: entity?.view || '',
    depiction: entity?.depiction || '',
    parentId: entity?.parentId || null,
    latitude: entity?.latitude || null,
    longitude: entity?.longitude || null
  })
  
  let submitting = $state(false)
  let errorMessage = $state<string | null>(null)
  let validationErrors = $state<string[]>([])
  
  const entityTypes = ['post', 'group', 'party', 'agent', 'place', 'thing']
  const viewTypes = ['', 'default', 'grid', 'list', 'cards', 'map']
  
  function handleSubmit() {
    // Clear previous errors
    errorMessage = null
    validationErrors = []
    
    // Client-side validation
    if (!formData.title.trim()) {
      errorMessage = 'Title is required'
      return
    }
    
    if (!formData.slug.trim()) {
      errorMessage = 'Slug is required'
      return
    }
    
    if (!formData.slug.startsWith('/')) {
      errorMessage = 'Slug must start with /'
      return
    }
    
    submitting = true
    
    dispatch('submit', {
      ...formData,
      id: entity?.id
    })
  }
  
  function handleCancel() {
    dispatch('cancel')
  }
  
  function regenerateSlug() {
    formData.slug = buildEntitySlug(parentSlug)
  }
  
  // Expose method to set errors from parent component
  export function setError(message: string, errors: string[] = []) {
    submitting = false
    errorMessage = message
    validationErrors = errors
  }
  
  // Expose method to clear submitting state on success
  export function clearSubmitting() {
    submitting = false
  }
</script>

<div class="bg-white/5 border border-white/20 rounded-lg p-6 space-y-4">
  <h2 class="text-lg font-semibold mb-4">
    {mode === 'create' ? 'New Entity' : 'Edit Entity'}
  </h2>
  
  {#if errorMessage || validationErrors.length > 0}
    <div class="bg-red-500/10 border border-red-500/30 rounded p-4">
      {#if errorMessage}
        <p class="text-sm text-red-400 font-medium mb-2">{errorMessage}</p>
      {/if}
      {#if validationErrors.length > 0}
        <ul class="text-xs text-red-400 space-y-1 list-disc list-inside">
          {#each validationErrors as error}
            <li>{error}</li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
  
  <div>
    <label for="type" class="block text-xs text-white/60 mb-1">
      Type *
    </label>
    <select
      id="type"
      bind:value={formData.type}
      class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
      disabled={mode === 'edit' || submitting}
    >
      {#each entityTypes as type}
        <option value={type}>{type}</option>
      {/each}
    </select>
    {#if mode === 'edit'}
      <p class="text-xs text-white/40 mt-1">Type cannot be changed after creation</p>
    {/if}
  </div>
  
  <div>
    <label for="title" class="block text-xs text-white/60 mb-1">
      Title *
    </label>
    <input
      id="title"
      type="text"
      bind:value={formData.title}
      class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
      placeholder="Enter title"
      disabled={submitting}
    />
  </div>
  
  <div>
    <label for="slug" class="block text-xs text-white/60 mb-1">
      Slug * {#if mode === 'create'}
        <button
          type="button"
          onclick={regenerateSlug}
          class="text-blue-400 hover:text-blue-300 ml-2"
          disabled={submitting}
        >
          (regenerate)
        </button>
      {/if}
    </label>
    <input
      id="slug"
      type="text"
      bind:value={formData.slug}
      class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white font-mono"
      placeholder="/path/to/entity"
      disabled={submitting}
    />
    <p class="text-xs text-white/40 mt-1">
      Must be unique. Format: /path/to/entity
    </p>
  </div>
  
  <div>
    <label for="content" class="block text-xs text-white/60 mb-1">
      Content
    </label>
    <textarea
      id="content"
      bind:value={formData.content}
      rows="6"
      class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
      placeholder="Enter content (supports Markdown)"
      disabled={submitting}
    ></textarea>
  </div>
  
  {#if formData.type === 'group'}
    <div>
      <label for="view" class="block text-xs text-white/60 mb-1">
        View Type
      </label>
      <select
        id="view"
        bind:value={formData.view}
        class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
        disabled={submitting}
      >
        {#each viewTypes as view}
          <option value={view}>{view || '(default)'}</option>
        {/each}
      </select>
      <p class="text-xs text-white/40 mt-1">
        How child entities are displayed
      </p>
    </div>
  {/if}
  
  <div>
    <label for="depiction" class="block text-xs text-white/60 mb-1">
      Depiction (Image URL)
    </label>
    <input
      id="depiction"
      type="text"
      bind:value={formData.depiction}
      class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
      placeholder="https://example.com/image.jpg"
      disabled={submitting}
    />
  </div>
  
  {#if formData.type === 'post' || formData.type === 'place'}
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="latitude" class="block text-xs text-white/60 mb-1">
          Latitude
        </label>
        <input
          id="latitude"
          type="number"
          step="any"
          bind:value={formData.latitude}
          class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
          placeholder="45.5152"
          disabled={submitting}
        />
      </div>
      <div>
        <label for="longitude" class="block text-xs text-white/60 mb-1">
          Longitude
        </label>
        <input
          id="longitude"
          type="number"
          step="any"
          bind:value={formData.longitude}
          class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
          placeholder="-122.6784"
          disabled={submitting}
        />
      </div>
    </div>
    <p class="text-xs text-white/40">
      Optional: Add coordinates to show this on maps
    </p>
  {/if}
  
  <div class="flex gap-3 pt-4">
    <button
      type="button"
      onclick={handleSubmit}
      class="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={submitting}
    >
      {#if submitting}
        {mode === 'create' ? 'Creating...' : 'Saving...'}
      {:else}
        {mode === 'create' ? 'Create Entity' : 'Save Changes'}
      {/if}
    </button>
    <button
      type="button"
      onclick={handleCancel}
      class="px-4 py-2 border border-white/20 hover:bg-white/10 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={submitting}
    >
      Cancel
    </button>
  </div>
</div>
