<script lang="ts">
  import type { Entity } from '@/types'
  import { renderMarkdown } from '@/utils/markdown'
  import RouterLink from './RouterLink.svelte'
  import EntityEditControl from './EntityEditControl.svelte'

  let { entity }: { entity: Entity } = $props()
</script>

<div>
  <h1 class="text-2xl mb-4">{entity.meta?.label || entity.meta?.slug || 'Untitled'}</h1>
  {#if entity.meta?.slug}
    <p class="text-xs text-white/40 font-mono mb-4">{entity.meta.slug}</p>
  {/if}
  
  <EntityEditControl {entity} />
  
  {#if entity.meta?.depiction}
    <img 
      src={entity.meta.depiction} 
      alt={entity.meta?.label || 'Post image'} 
      class="w-full max-w-3xl mb-6 rounded"
    />
  {/if}
  {#if entity.meta?.content}
    <div class="prose prose-invert max-w-none mb-8">
      {@html renderMarkdown(entity.meta.content)}
    </div>
  {/if}
  <div class="mt-8 text-xs text-white/40 border-t border-white/10 pt-4">
    <div>Created: {entity.meta?.created ? new Date(entity.meta.created).toLocaleString() : 'Unknown'}</div>
    <div>Updated: {entity.meta?.updated ? new Date(entity.meta.updated).toLocaleString() : 'Unknown'}</div>
  </div>
  <div class="mt-4">
    <RouterLink to="/" className="text-xs text-white/60 hover:text-white underline">
      {#snippet children()}
        ← Back to home
      {/snippet}
    </RouterLink>
  </div>
</div>
