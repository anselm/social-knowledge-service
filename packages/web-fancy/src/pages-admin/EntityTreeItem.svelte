<script lang="ts">
  import type { EntityWithChildren } from '../types'
  import EntityItem from './EntityItem.svelte'
  import EntityTreeItem from './EntityTreeItem.svelte'
  
  let { 
    entity, 
    level = 0, 
    expanded = false, 
    expandedNodes, 
    onToggle, 
    onEdit, 
    onDelete 
  }: { 
    entity: EntityWithChildren, 
    level?: number, 
    expanded?: boolean, 
    expandedNodes: Set<string>, 
    onToggle: (id: string) => void, 
    onEdit: (entity: EntityWithChildren) => void, 
    onDelete: (id: string) => void 
  } = $props()
  
  let hasChildren = $derived(entity.children && entity.children.length > 0)
</script>

<div>
  <div 
    class="border border-white/20 p-3 text-xs hover:bg-white/5"
    style="margin-left: {level * 20}px"
  >
    <div class="flex items-start gap-2">
      {#if hasChildren}
        <button
          onclick={() => onToggle(entity.id)}
          class="text-white/60 hover:text-white mt-1"
        >
          {expanded ? '▼' : '▶'}
        </button>
      {/if}
      <div class="flex-1">
        <EntityItem 
          {entity} 
          {onEdit} 
          {onDelete}
          showParent={false}
        />
      </div>
    </div>
  </div>
  
  {#if hasChildren && expanded}
    {#each entity.children as child}
      <EntityTreeItem 
        entity={child} 
        level={level + 1}
        expanded={expandedNodes.has(child.id)}
        {expandedNodes}
        {onToggle}
        {onEdit}
        {onDelete}
      />
    {/each}
  {/if}
</div>
