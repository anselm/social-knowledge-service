<script lang="ts">

  import { api } from '@/services/api'
  import { createEventDispatcher } from 'svelte'
  
  let { creatingParty = false, error = '' }: { creatingParty?: boolean, error?: string } = $props()
  
  const dispatch = createEventDispatcher()
  
  let slug = $state('')
  let checking = $state(false)
  let available = $state<boolean | null>(null)
  let checkTimeout: any = null
  
  function normalizeSlug(input: string): string {
    // Remove leading/trailing spaces
    let normalized = input.trim()
    
    // Ensure it starts with /
    if (!normalized.startsWith('/')) {
      normalized = '/' + normalized
    }
    
    // Convert to lowercase and replace spaces/invalid chars with hyphens
    normalized = normalized.toLowerCase()
      .replace(/[^a-z0-9\-_\/]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    return normalized
  }
  
  function handleSlugInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = target.value
    slug = normalizeSlug(raw)
    
    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout)
    }
    
    // Reset availability
    available = null
    
    // Check availability after 500ms of no typing
    if (slug && slug !== '/') {
      checkTimeout = setTimeout(async () => {
        checking = true
        try {
          const entity = await api.getEntityBySlug(slug)
          available = !entity
        } catch (e: any) {
          // 404 means available
          if (e.status === 404 || e.message?.includes('not found')) {
            available = true
          } else {
            available = false
          }
        } finally {
          checking = false
        }
      }, 500)
    }
  }
  
  function handleSubmit() {
    if (!slug || slug === '/' || available !== true) {
      return
    }
    
    dispatch('submit', { slug })
  }
  
  function handleCancel() {
    dispatch('cancel')
  }
</script>

<div class="space-y-4">
  <div>
    <p class="text-sm text-white/70 mb-4">
      Choose a unique username for your profile. This will be your identity on the platform.
    </p>
    
    <label for="slug" class="block text-xs text-white/60 mb-2">
      Username
    </label>
    <input
      id="slug"
      type="text"
      value={slug}
      oninput={handleSlugInput}
      placeholder="/username"
      disabled={creatingParty}
      class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white font-mono disabled:opacity-50"
    />
    
    <div class="mt-2 min-h-[20px]">
      {#if checking}
        <p class="text-xs text-white/40">Checking availability...</p>
      {:else if slug && slug !== '/'}
        {#if available === true}
          <p class="text-xs text-green-400">✓ Available</p>
        {:else if available === false}
          <p class="text-xs text-red-400">✗ Already taken</p>
        {/if}
      {/if}
    </div>
    
    <p class="text-xs text-white/40 mt-2">
      Your profile will be accessible at: <span class="font-mono">{slug || '/username'}</span>
    </p>
  </div>
  
  {#if error}
    <div class="p-3 bg-red-500/10 border border-red-500/20 rounded">
      <p class="text-red-400 text-xs">{error}</p>
    </div>
  {/if}
  
  <div class="flex gap-3">
    <button
      onclick={handleSubmit}
      disabled={creatingParty || !slug || slug === '/' || available !== true}
      class="flex-1 px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {creatingParty ? 'Creating Account...' : 'Create Account'}
    </button>
    <button
      onclick={handleCancel}
      disabled={creatingParty}
      class="px-4 py-2 border border-white/20 hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
    >
      Cancel
    </button>
  </div>
</div>
