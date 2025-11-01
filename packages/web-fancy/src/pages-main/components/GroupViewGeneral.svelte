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
  
  // Determine view mode from entity.view property
  let viewMode = $derived(entity.view || 'default')
  
  $effect(() => {
    loadChildren()
  })
  
  async function loadChildren() {
    loading = true
    try {
      const childrenData = await api.queryEntities({ 
        parentId: entity.id,
        limit: 100 
      })
      
      children = (childrenData || []).sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
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
    if (child.type === 'group' && child.metadata?.recentPosts > 0) {
      return `${child.metadata.recentPosts} recent posts`
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
      <RouterLink to={child.slug || `/${child.id}`} className="block border border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40 transition-colors overflow-hidden">
        {#if child.depiction}
          <img 
            src={child.depiction} 
            alt={child.title || 'Image'} 
            class="w-full h-48 object-cover"
          />
        {/if}
        <div class="p-4">
          <div class="flex items-baseline gap-2 mb-2">
            <span class="text-xs text-black/40 dark:text-white/40">[{child.type}]</span>
            <h3 class="text-sm font-medium flex-1 text-black dark:text-white">{child.title || child.slug || 'Untitled'}</h3>
          </div>
          {#if child.content}
            <p class="text-xs text-black/70 dark:text-white/60 line-clamp-3">{child.content}</p>
          {/if}
        </div>
      </RouterLink>
    {/each}
  </div>
{/snippet}

{#snippet cardsView()}
  <div class="space-y-6">
    {#each children as child}
      <RouterLink to={child.slug || `/${child.id}`} className="block bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
        {#if child.depiction}
          <img 
            src={child.depiction} 
            alt={child.title || 'Image'} 
            class="w-full h-64 object-cover"
          />
        {/if}
        <div class="p-6">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="text-xs text-black/40 dark:text-white/40 uppercase tracking-wider">[{child.type}]</span>
              <h3 class="text-lg font-medium mt-1 text-black dark:text-white">{child.title || child.slug || 'Untitled'}</h3>
            </div>
            <span class="text-xs text-black/40 dark:text-white/40">{new Date(child.createdAt).toLocaleDateString()}</span>
          </div>
          {#if child.content}
            <p class="text-sm text-black/70 dark:text-white/70 leading-relaxed">{getPreview(child.content)}</p>
          {/if}
          <div class="mt-4 text-xs text-black/40 dark:text-white/40">
            Last updated: {new Date(child.updatedAt).toLocaleString()}
          </div>
        </div>
      </RouterLink>
    {/each}
  </div>
{/snippet}

{#snippet listView()}
  <div class="space-y-2">
    {#each children as child}
      <RouterLink to={child.slug || `/${child.id}`} className="block pb-2 hover:opacity-80 transition-opacity">
        <div class="flex items-baseline gap-3">
          <div class="flex-grow">
            <h3 class="text-sm font-medium inline text-black dark:text-white">{child.title || child.slug || 'Untitled'}</h3>
            {#if child.content}
              <span class="text-xs text-black/70 dark:text-white/60 ml-2">{getPreview(child.content, 100)}</span>
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
  {#if child.type === 'post'}
    <div class="pb-4">
      <RouterLink to={child.slug || `/${child.id}`} className="block hover:opacity-80 transition-opacity">
        <div class="flex gap-4">
          {#if child.depiction}
            <img 
              src={child.depiction} 
              alt={child.title || 'Post image'} 
              class="w-24 h-24 object-cover flex-shrink-0"
            />
          {/if}
          <div class="flex-1">
            <div class="flex items-baseline justify-between gap-4 mb-1">
              <h3 class="text-sm font-medium text-black dark:text-white">{child.title || 'Untitled'}</h3>
            </div>
            {#if child.content}
              <p class="text-xs text-black/70 dark:text-white/60 line-clamp-2">{child.content}</p>
            {/if}
          </div>
        </div>
      </RouterLink>
    </div>
  {:else}
    <div class="pb-4">
      <RouterLink to={child.slug || `/${child.id}`} className="hover:underline">
        <div class="flex items-baseline justify-between gap-4">
          <div class="flex-1">
            <span class="text-sm font-medium text-black dark:text-white">{child.title || child.slug || 'Untitled'}</span>
            {#if child.content}
              <p class="text-xs text-black/70 dark:text-white/60 mt-1 line-clamp-2">{child.content}</p>
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
