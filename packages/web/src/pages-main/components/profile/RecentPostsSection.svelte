<script lang="ts">
  import type { Entity } from '@/types'
  import { authStore } from '@/stores/auth'
  import { api } from '@/services/api'
  import RouterLink from '../RouterLink.svelte'
  
  let posts = $state<Entity[]>([])
  let loading = $state(true)
  let engagementData = $state<Map<string, { views: number, likes: number, comments: number }>>(new Map())
  
  $effect(() => {
    loadPosts()
  })
  
  async function loadPosts() {
    if (!$authStore) {
      loading = false
      return
    }
    
    loading = true
    try {
      const authIdentifier = $authStore.address || $authStore.issuer || ''
      posts = await api.getUserPosts(authIdentifier, 10)
      
      // Load engagement data for each post
      for (const post of posts) {
        const engagement = await api.getEntityEngagement(post.id)
        engagementData.set(post.id, engagement)
      }
      engagementData = new Map(engagementData) // Trigger reactivity
    } catch (error) {
      console.error('Failed to load posts:', error)
    } finally {
      loading = false
    }
  }
  
  function getEngagement(postId: string) {
    return engagementData.get(postId) || { views: 0, likes: 0, comments: 0 }
  }
</script>

<div class="bg-white/5 border border-white/20 rounded-lg p-6">
  <h2 class="text-lg font-semibold mb-4">Recent Posts</h2>
  
  {#if loading}
    <div class="text-xs text-white/60">Loading...</div>
  {:else if posts.length === 0}
    <div class="text-sm text-white/60">
      <p>You haven't created any posts yet.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each posts as post}
        {@const engagement = getEngagement(post.id)}
        <div class="border border-white/10 p-4 rounded hover:border-white/20 transition-colors">
          <RouterLink 
            to={post.slug || `/${post.id}`}
            className="block"
          >
            {#snippet children()}
              <div class="flex gap-4">
                {#if post.depiction}
                  <img 
                    src={post.depiction} 
                    alt={post.title || 'Post'} 
                    class="w-20 h-20 object-cover flex-shrink-0 rounded"
                  />
                {/if}
                
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-medium mb-1">{post.title || 'Untitled'}</h3>
                  {#if post.content}
                    <p class="text-xs text-white/60 line-clamp-2 mb-2">{post.content}</p>
                  {/if}
                  
                  <div class="flex items-center gap-4 text-xs text-white/40">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span>👁 {engagement.views} views</span>
                    <span>❤️ {engagement.likes} likes</span>
                    <span>💬 {engagement.comments} comments</span>
                  </div>
                </div>
              </div>
            {/snippet}
          </RouterLink>
        </div>
      {/each}
    </div>
  {/if}
</div>
