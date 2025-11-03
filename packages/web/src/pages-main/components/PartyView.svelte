<script lang="ts">
  import type { Entity } from '@/types'
  import { api } from '@/services/api'
  import { renderMarkdown } from '@/utils/markdown'
  import RouterLink from './RouterLink.svelte'
  import EntityEditControl from './EntityEditControl.svelte'

  let { entity }: { entity: Entity } = $props()
  
  let recentPosts = $state<Entity[]>([])
  let loading = $state(true)
  
  $effect(() => {
    loadRecentPosts()
  })
  
  async function loadRecentPosts() {
    // Use new schema - auth is in party.auth
    const authAddress = entity.party?.auth
    if (!authAddress) {
      loading = false
      return
    }
    
    loading = true
    try {
      const posts = await api.getUserPosts(authAddress, 5)
      recentPosts = posts
    } catch (error) {
      console.error('Failed to load recent posts:', error)
    } finally {
      loading = false
    }
  }
</script>

<div class="max-w-3xl">
  <!-- Profile Header -->
  <div class="mb-8">
    <div class="flex items-start gap-6 mb-6">
      {#if entity.meta?.depiction}
        <img 
          src={entity.meta.depiction} 
          alt={entity.meta.label || 'Profile'} 
          class="w-24 h-24 rounded-full object-cover border-2 border-white/20"
        />
      {:else}
        <div class="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center">
          <span class="text-3xl text-white/40">👤</span>
        </div>
      {/if}
      
      <div class="flex-1">
        <h1 class="text-2xl font-bold mb-2">{entity.meta?.label || entity.meta?.slug || 'Untitled'}</h1>
        {#if entity.meta?.slug}
          <p class="text-xs text-white/40 font-mono mb-3">{entity.meta.slug}</p>
        {/if}
        {#if entity.meta?.content}
          <div class="text-sm text-white/70 prose-content">
            {@html renderMarkdown(entity.meta.content)}
          </div>
        {/if}
      </div>
    </div>
    
    <EntityEditControl {entity} />
  </div>

  <!-- Recent Posts -->
  <div class="border-t border-white/10 pt-6">
    <h2 class="text-lg font-semibold mb-4">Recent Posts</h2>
    
    {#if loading}
      <div class="text-xs text-white/60">Loading posts...</div>
    {:else if recentPosts.length > 0}
      <div class="space-y-4">
        {#each recentPosts as post}
          <RouterLink 
            to={post.slug || `/${post.id}`} 
            className="block border border-white/10 p-4 hover:border-white/30 transition-colors"
          >
            {#snippet children()}
              <div class="flex gap-4">
                {#if post.depiction}
                  <img 
                    src={post.depiction} 
                    alt={post.title || 'Post'} 
                    class="w-20 h-20 object-cover flex-shrink-0"
                  />
                {/if}
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-medium mb-1">{post.title || 'Untitled'}</h3>
                  {#if post.content}
                    <p class="text-xs text-white/60 line-clamp-2">{post.content}</p>
                  {/if}
                  <div class="text-xs text-white/40 mt-2">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            {/snippet}
          </RouterLink>
        {/each}
      </div>
    {:else}
      <div class="text-xs text-white/60">No posts yet</div>
    {/if}
  </div>

  <!-- Back Link -->
  <div class="mt-8 pt-6 border-t border-white/10">
    <RouterLink to="/" className="text-xs text-white/60 hover:text-white underline">
      {#snippet children()}
        ← Back to home
      {/snippet}
    </RouterLink>
  </div>
</div>
