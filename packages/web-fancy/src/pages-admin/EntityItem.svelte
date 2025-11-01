<script lang="ts">
  import type { Entity } from '../types'
  
  let { entity, onEdit, onDelete, showParent = true }: { 
    entity: Entity, 
    onEdit: (entity: Entity) => void, 
    onDelete: (id: string) => void,
    showParent?: boolean
  } = $props()
</script>

<div class="flex justify-between items-start">
  <div class="flex-1">
    <div class="flex items-baseline gap-2 mb-1">
      <span class="text-white/60">[{entity.type}]</span>
      <span class="font-mono">{entity.slug || entity.id}</span>
    </div>
    {#if entity.title}
      <div class="text-white/80">Title: {entity.title}</div>
    {/if}
    {#if showParent && entity.parentId}
      <div class="text-white/60 text-xs">Parent: {entity.parentId}</div>
    {/if}
    <div class="text-white/60 text-xs mt-1">
      ID: {entity.id}
    </div>
    <div class="text-white/60 text-xs">
      Created: {new Date(entity.createdAt).toLocaleString()}
    </div>
  </div>
  <div class="flex gap-2">
    <button
      onclick={() => onEdit(entity)}
      class="text-blue-500 hover:text-blue-400"
    >
      Edit
    </button>
    <button
      onclick={() => onDelete(entity.id)}
      class="text-red-500 hover:text-red-400"
    >
      Delete
    </button>
  </div>
</div>
