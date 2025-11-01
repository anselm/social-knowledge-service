<script lang="ts">
  import type { Snippet } from 'svelte';
  
  interface Props {
    children: Snippet;
  }
  
  let { children }: Props = $props();
</script>

<main>
  {@render children()}
</main>

<style>
  main {
    width: 100%;
    min-height: 100vh;
  }
</style>