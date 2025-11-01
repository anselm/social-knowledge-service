<script lang="ts">
  import type { Entity } from '@/types'
  import { renderMarkdown } from '@/utils/markdown'
  import RouterLink from './RouterLink.svelte'
  import EntityEditControl from './EntityEditControl.svelte'

  let { entity }: { entity: Entity } = $props()
</script>

<div>
  <h1 class="text-2xl mb-4">{entity.title || entity.slug || 'Untitled'}</h1>
  {#if entity.slug}
    <p class="text-xs text-white/40 font-mono mb-4">{entity.slug}</p>
  {/if}
  
  <EntityEditControl {entity} />
  
  {#if entity.depiction}
    <img 
      src={entity.depiction} 
      alt={entity.title || 'Post image'} 
      class="w-full max-w-3xl mb-6 rounded"
    />
  {/if}
  {#if entity.content}
    <div class="prose prose-invert max-w-none mb-8">
      {@html renderMarkdown(entity.content)}
    </div>
  {/if}
  <div class="mt-8 text-xs text-white/40 border-t border-white/10 pt-4">
    <div>Created: {new Date(entity.createdAt).toLocaleString()}</div>
    <div>Updated: {new Date(entity.updatedAt).toLocaleString()}</div>
  </div>
  <div class="mt-4">
    <RouterLink to="/" className="text-xs text-white/60 hover:text-white underline">
      {#snippet children()}
        ← Back to home
      {/snippet}
    </RouterLink>
  </div>
</div>
