<script lang="ts">
  import { api } from '../services/api'
  import type { Entity, Stats } from '../types'
  
  let loading = $state(false)
  let stats = $state<Stats | null>(null)
  
  export async function loadStats() {
    loading = true
    try {
      const allEntities = await api.queryEntities({ limit: 1000 })
      
      const byType: Record<string, number> = {}
      allEntities.forEach((entity: Entity) => {
        byType[entity.type] = (byType[entity.type] || 0) + 1
      })
      
      stats = {
        totalEntities: allEntities.length,
        byType
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      loading = false
    }
  }
</script>

<div>
  {#if loading}
    <div class="text-xs text-white/60">Loading...</div>
  {:else if stats}
    <div class="space-y-4">
      <div class="border border-white/20 p-4">
        <h3 class="text-xs uppercase tracking-wider mb-2">Total Entities</h3>
        <div class="text-2xl">{stats.totalEntities}</div>
      </div>
      
      <div class="border border-white/20 p-4">
        <h3 class="text-xs uppercase tracking-wider mb-2">By Type</h3>
        <div class="space-y-1">
          {#each Object.entries(stats.byType) as [type, count]}
            <div class="flex justify-between text-sm">
              <span class="text-white/60">{type}</span>
              <span>{count}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
