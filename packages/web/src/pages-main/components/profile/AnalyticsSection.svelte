<script lang="ts">
  import { authStore } from '@/stores/auth'
  import { api } from '@/services/api'
  
  let analytics = $state({
    totalPosts: 0,
    totalGroups: 0,
    totalParties: 0,
    totalEntities: 0,
    recentActivity: []
  })
  let loading = $state(true)
  
  $effect(() => {
    loadAnalytics()
  })
  
  async function loadAnalytics() {
    if (!$authStore) {
      loading = false
      return
    }
    
    loading = true
    try {
      const authIdentifier = $authStore.address || $authStore.issuer || ''
      analytics = await api.getUserAnalytics(authIdentifier)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      loading = false
    }
  }
</script>

<div class="bg-white/5 border border-white/20 rounded-lg p-6">
  <h2 class="text-lg font-semibold mb-4">Your Activity</h2>
  
  {#if loading}
    <div class="text-xs text-white/60">Loading...</div>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="text-center p-4 bg-white/5 rounded">
        <div class="text-2xl font-bold mb-1">{analytics.totalPosts}</div>
        <div class="text-xs text-white/60">Posts</div>
      </div>
      
      <div class="text-center p-4 bg-white/5 rounded">
        <div class="text-2xl font-bold mb-1">{analytics.totalGroups}</div>
        <div class="text-xs text-white/60">Groups</div>
      </div>
      
      <div class="text-center p-4 bg-white/5 rounded">
        <div class="text-2xl font-bold mb-1">{analytics.totalParties}</div>
        <div class="text-xs text-white/60">Identities</div>
      </div>
      
      <div class="text-center p-4 bg-white/5 rounded">
        <div class="text-2xl font-bold mb-1">{analytics.totalEntities}</div>
        <div class="text-xs text-white/60">Total Items</div>
      </div>
    </div>
    
    {#if analytics.recentActivity.length > 0}
      <div class="mt-6">
        <h3 class="text-sm font-semibold mb-3 text-white/80">Recent Activity</h3>
        <div class="space-y-2">
          {#each analytics.recentActivity.slice(0, 5) as item}
            <div class="flex items-center gap-3 text-xs">
              <span class="text-white/40">[{item.type}]</span>
              <span class="flex-1 truncate">{item.title || item.slug || 'Untitled'}</span>
              <span class="text-white/40">{new Date(item.updatedAt).toLocaleDateString()}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
