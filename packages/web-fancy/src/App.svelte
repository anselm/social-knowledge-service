<script lang="ts">

  import { config } from '@/stores/appConfig'

  import { router } from '@/lib/router'
  import { authStore } from '@/stores/auth'

  import Layout from '@/pages-main/components/Layout.svelte'
  import InstallPrompt from '@/pages-main/components/InstallPrompt.svelte'

  import Admin from '@/pages-admin/Admin.svelte'
  import Login from '@/pages-main/Login.svelte'
  import Profile from '@/pages-main/Profile.svelte'
  import EntityView from '@/pages-main/EntityView.svelte'
  import SiweMagicLogin from '@/pages-main/siwe-magic-login.svelte'
  import Landing from '@/pages-splash-home/LandingPage.svelte'
  import HomePage from '@/pages-splash-home/HomePage.svelte'
  
  let { url = "" }: { url?: string } = $props()
  
  // Get routing config
  let routingMode = $derived($config.routing?.mode || 'query')
  let basePath = $derived($config.routing?.basePath || '')
  
  // Initialize router
  let routerInitialized = $state(false)
  
  $effect(() => {
    if (!routerInitialized) {
      router.init({
        mode: routingMode,
        basePath: basePath
      })
      routerInitialized = true
    }
  })
  
  // Subscribe to current path
  let currentPath = $state('/')
  
  $effect(() => {
    const unsubscribe = router.path.subscribe(path => {
      currentPath = path
      console.log('Router path changed:', path)
    })
    
    return unsubscribe
  })
  
  // Determine which page to show based on path
  let currentPage = $derived.by(() => {
    const path = currentPath
    
    console.log('App: Determining page for path:', path)
    
    if (path === '/landing') return 'landing'
    if (path === '/home') return 'home'
    if (path === '/admin') return 'admin'
    if (path === '/login') return 'login'
    if (path === '/profile') return 'profile'
    if (path === '/testmap') return 'entity'
    
    return 'entity'
  })
  
  let currentEntity = $state(null)
</script>

<Layout {currentPath} {currentEntity}>
  {#snippet children()}
    {#key currentPath}
      {#if currentPage === 'landing'}
        <Landing />
      {:else if currentPage === 'home'}
        <HomePage />
      {:else if currentPage === 'admin'}
        <Admin />
      {:else if currentPage === 'login'}
        <SiweMagicLogin />
      {:else if currentPage === 'profile'}
        <Profile />
      {:else}
        <EntityView path={currentPath} />
      {/if}
    {/key}
  {/snippet}
</Layout>

<InstallPrompt />
