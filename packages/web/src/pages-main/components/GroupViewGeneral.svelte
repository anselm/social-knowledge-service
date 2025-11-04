<script lang="ts">
  import type { Entity } from '@/types'
  import { renderMarkdown } from '@/utils/markdown'
  import { api } from '@/services/api'
  import RouterLink from './RouterLink.svelte'
  import EntityHeader from './EntityHeader.svelte'
  import EntityEditControl from './EntityEditControl.svelte'
  import AddEntityControl from './AddEntityControl.svelte'

  let { entity }: { entity: Entity } = $props()
  
  let children = $state<Entity[]>([])
  let loading = $state(true)
  
  // Determine view mode from entity meta component
  let viewMode = $derived(entity.meta?.view || 'default')
  
  $effect(() => {
    loadChildren()
  })
  
  async function loadChildren() {
    loading = true
    try {
      // Use the new queryChildren method that works with relationships
      const childrenData = await api.queryChildren(entity.id)
      
      children = (childrenData || []).sort((a, b) => {
        const dateA = new Date(a.time?.updated || a.time?.created || '').getTime() || 0
        const dateB = new Date(b.time?.updated || b.time?.created || '').getTime() || 0
        return dateB - dateA
      })
    } catch (error) {
      console.error('Failed to load children:', error)
      children = []
    } finally {
      loading = false
    }
  }
  
  function stripHtml(html: string): string {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
  
  function getPreview(content: string, maxLength: number = 200): string {
    const rendered = renderMarkdown(content)
    const text = stripHtml(rendered)
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '')
  }

  function fixDate(raw: string) {
    const date = new Date(raw)
    const str = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
    const [a, b] = str.split(',')
    return b + ' ' + a
  }

  function getMetadataText(child: Entity): string {
    if (child.kind === 'group' && child.stats?.recentPosts > 0) {
      return `${child.stats.recentPosts} recent posts`
    }
    return ''
  }
</script>

{#snippet emptyState()}
  <div class="text-xs text-black/60 dark:text-white/60">No content in this group yet</div>
{/snippet}

{#snippet gridView()}
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each children as child}
      <RouterLink to={child.meta?.slug || `/${child.id}`} className="block border border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 transition-colors overflow-hidden">
        {#if child.meta?.depiction}
          <img 
            src={child.meta.depiction} 
            alt={child.meta?.label || 'Image'} 
            class="w-full h-48 object-cover"
          />
        {/if}
        <div class="p-4">
          <div class="flex items-baseline gap-2 mb-2">
            <span class="text-xs text-black/40 dark:text-white/40">[{child.kind}]</span>
            <h3 class="text-sm font-medium flex-1 text-black dark:text-white">{child.meta?.label || child.meta?.slug || 'Untitled'}</h3>
          </div>
          {#if child.meta?.content}
            <p class="text-xs text-black/70 dark:text-white/60 line-clamp-3">{child.meta.content}</p>
          {/if}
        </div>
      </RouterLink>
    {/each}
  </div>
{/snippet}

{#snippet cardsView()}
  <div class="space-y-6">
    {#each children as child}
      <RouterLink to={child.meta?.slug || `/${child.id}`} className="block bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
        {#if child.meta?.depiction}
          <img 
            src={child.meta.depiction} 
            alt={child.meta?.label || 'Image'} 
            class="w-full h-64 object-cover"
          />
        {/if}
        <div class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="text-xs text-black/40 dark:text-white/40 uppercase tracking-wider">[{child.kind}]</span>
              <h3 class="text-lg font-medium mt-1 text-black dark:text-white">{child.meta?.label || child.meta?.slug || 'Untitled'}</h3>
            </div>
            <span class="text-xs text-black/40 dark:text-white/40">{new Date(child.time?.created || '').toLocaleDateString()}</span>
          </div>
          {#if child.meta?.content}
            <p class="text-sm text-black/70 dark:text-white/70 leading-relaxed">{getPreview(child.meta.content)}</p>
          {/if}
          <div class="mt-4 text-xs text-black/40 dark:text-white/40">
            Last updated: {new Date(child.time?.updated || child.time?.created || '').toLocaleString()}
          </div>
        </div>
      </RouterLink>
    {/each}
  </div>
{/snippet}

{#snippet listView()}
  <div class="space-y-2">
    {#each children as child}
      <RouterLink to={child.meta?.slug || `/${child.id}`} className="block pb-2 hover:opacity-80 transition-opacity">
        <div class="flex items-baseline gap-3">
          <div class="flex-grow">
            <h3 class="text-sm font-medium inline text-black dark:text-white">{child.meta?.label || child.meta?.slug || 'Untitled'}</h3>
            {#if child.meta?.content}
              <span class="text-xs text-black/70 dark:text-white/60 ml-2">{getPreview(child.meta.content, 100)}</span>
            {/if}
          </div>
          {#if getMetadataText(child)}
            <span class="text-xs text-black/40 dark:text-white/40 whitespace-nowrap">{getMetadataText(child)}</span>
          {/if}
        </div>
      </RouterLink>
    {/each}
  </div>
{/snippet}

{#snippet renderChild(child: Entity)}
  {#if child.kind === 'post'}
    <div class="pb-4">
      <RouterLink to={child.meta?.slug || `/${child.id}`} className="block hover:opacity-80 transition-opacity">
        <div class="flex gap-4">
          {#if child.meta?.depiction}
            <img 
              src={child.meta.depiction} 
              alt={child.meta?.label || 'Post image'} 
              class="w-24 h-24 object-cover flex-shrink-0"
            />
          {/if}
          <div class="flex-1">
            <div class="flex items-baseline justify-between gap-4 mb-1">
              <h3 class="text-sm font-medium text-black dark:text-white">{child.meta?.label || 'Untitled'}</h3>
            </div>
            {#if child.meta?.content}
              <p class="text-xs text-black/70 dark:text-white/60 line-clamp-2">{child.meta.content}</p>
            {/if}
          </div>
        </div>
      </RouterLink>
    </div>
  {:else}
    <div class="pb-4">
      <RouterLink to={child.meta?.slug || `/${child.id}`} className="hover:underline">
        <div class="flex items-baseline justify-between gap-4">
          <div class="flex-1">
            <span class="text-sm font-medium text-black dark:text-white">{child.meta?.label || child.meta?.slug || 'Untitled'}</span>
            {#if child.meta?.content}
              <p class="text-xs text-black/70 dark:text-white/60 mt-1 line-clamp-2">{child.meta.content}</p>
            {/if}
          </div>
          {#if getMetadataText(child)}
            <span class="text-xs text-black/40 dark:text-white/40 whitespace-nowrap">{getMetadataText(child)}</span>
          {/if}
        </div>
      </RouterLink>
    </div>
  {/if}
{/snippet}

{#snippet defaultView()}
  <div class="space-y-4">
    {#each children as child}
      {@render renderChild(child)}
    {/each}
  </div>
{/snippet}

<div>
  <EntityHeader {entity} showStats={true} />
  
  <EntityEditControl {entity} />

  {#if loading}
    <div class="text-xs text-black/60 dark:text-white/60">Loading...</div>
  {:else if children.length === 0}
    {@render emptyState()}
  {:else if viewMode === 'grid'}
    {@render gridView()}
  {:else if viewMode === 'cards'}
    {@render cardsView()}
  {:else if viewMode === 'list'}
    {@render listView()}
  {:else}
    {@render defaultView()}
  {/if}
  
  <AddEntityControl parentEntity={entity} />
</div>
