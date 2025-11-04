<script lang="ts">
  interface FilterBarProps {
    activeFilters: Set<string>
    onFilterToggle: (type: string) => void
  }

  let { activeFilters, onFilterToggle }: FilterBarProps = $props()

  const filterTypes = [
    { key: 'post', label: 'Posts', icon: '📝' },
    { key: 'group', label: 'Groups', icon: '👥' },
    { key: 'place', label: 'Places', icon: '📍' },
    { key: 'party', label: 'People', icon: '👤' },
    { key: 'event', label: 'Events', icon: '📅' }
  ]

  function getFilterButtonClass(filterType: string): string {
    const isActive = activeFilters.has(filterType)
    return `px-3 py-1 text-xs rounded transition-colors ${
      isActive 
        ? 'bg-white/20 text-white' 
        : 'bg-white/5 text-white/60 hover:bg-white/10'
    }`
  }
</script>

<div class="flex gap-2 p-2 bg-black/50 backdrop-blur-sm border-b border-white/10">
  {#each filterTypes as filter}
    <button
      onclick={() => onFilterToggle(filter.key)}
      class={getFilterButtonClass(filter.key)}
      aria-label="Toggle {filter.label}"
    >
      <span class="mr-1">{filter.icon}</span>
      {filter.label}
    </button>
  {/each}
</div>