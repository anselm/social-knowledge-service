<script lang="ts">
  import { config } from '@/stores/appConfig'
  import type { Snippet } from 'svelte'
  import Header from './Header.svelte'
  
  let { currentPath = '/', currentEntity = null, children }: { currentPath?: string, currentEntity?: any, children?: Snippet } = $props()
  
  // Prevent pull-to-refresh on mobile
  $effect(() => {
    if (typeof window !== 'undefined') {
      const preventPullToRefresh = (e: TouchEvent) => {
        const target = e.target as HTMLElement
        // Allow scrolling within scrollable containers
        if (target.closest('[data-scrollable]')) {
          return
        }
        // Prevent default if at top of page
        if (window.scrollY === 0) {
          e.preventDefault()
        }
      }
      
      document.addEventListener('touchmove', preventPullToRefresh, { passive: false })
      
      return () => {
        document.removeEventListener('touchmove', preventPullToRefresh)
      }
    }
  })
</script>

<div class="fixed inset-0 flex flex-col dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-black dark:text-white overflow-hidden touch-none px-0">
  <Header {currentPath} {currentEntity} />
  <div class="flex-1 min-h-0 w-full max-w-container mx-auto flex flex-col overflow-hidden">
    <main class="flex-1 flex flex-col min-h-0 w-full h-full overflow-auto touch-pan-y" data-scrollable>
      {#if children}
        {@render children()}
      {/if}
    </main>
  </div>
</div>
