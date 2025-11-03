<script lang="ts">
  import { router } from '@/lib/router'
  import type { Snippet } from 'svelte'
  
  let { to, className = '', children }: { to: string, className?: string, children?: Snippet } = $props()
  
  function handleClick(event: MouseEvent) {
    event.preventDefault()
    router.navigateTo(to)
  }
</script>

<a 
  href={router.createHref(to)}
  class={className}
  onclick={handleClick}
>
  {#if children}
    {@render children()}
  {/if}
</a>
