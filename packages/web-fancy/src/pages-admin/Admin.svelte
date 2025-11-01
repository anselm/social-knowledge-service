<script lang="ts">
  import TabButton from './TabButton.svelte'
  import EntitiesTab from './EntitiesTab.svelte'
  import CreateTab from './CreateTab.svelte'
  import StatsTab from './StatsTab.svelte'
  
  let activeTab = $state<'entities' | 'create' | 'stats'>('entities')
  let entitiesTab = $state<EntitiesTab>()
  let statsTab = $state<StatsTab>()
  
  // Build info - will be replaced at build time
  const buildDate = __BUILD_DATE__
  const buildRevision = __BUILD_REVISION__
  
  $effect(() => {
    if (activeTab === 'entities' && entitiesTab) {
      entitiesTab.loadEntities()
    } else if (activeTab === 'stats' && statsTab) {
      statsTab.loadStats()
    }
  })
  
  function handleEntityCreated() {
    activeTab = 'entities'
  }
</script>

<div>
  <div class="flex items-baseline justify-between mb-6">
    <h1 class="text-xs uppercase tracking-wider">Admin Panel</h1>
    <div class="text-xs text-white/40">
      Build: {buildRevision} ({buildDate})
    </div>
  </div>
  
  <!-- Tabs -->
  <div class="flex gap-4 mb-6 border-b border-white/20">
    <TabButton 
      active={activeTab === 'entities'}
      label="Entities"
      onclick={() => activeTab = 'entities'}
    />
    <TabButton 
      active={activeTab === 'create'}
      label="Create"
      onclick={() => activeTab = 'create'}
    />
    <TabButton 
      active={activeTab === 'stats'}
      label="Stats"
      onclick={() => activeTab = 'stats'}
    />
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'entities'}
    <EntitiesTab bind:this={entitiesTab} />
  {:else if activeTab === 'create'}
    <CreateTab on:created={handleEntityCreated} />
  {:else if activeTab === 'stats'}
    <StatsTab bind:this={statsTab} />
  {/if}
</div>
