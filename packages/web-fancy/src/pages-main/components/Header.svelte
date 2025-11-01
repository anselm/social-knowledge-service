<script lang="ts">
  import { config } from '@/stores/appConfig'
  import { authStore } from '@/stores/auth'
  import RouterLink from './RouterLink.svelte'
  import LoginModal from './modals/LoginModal.svelte'
  
  let { currentPath = '/', currentEntity = null }: { currentPath?: string, currentEntity?: any } = $props()
  
  let showLoginModal = $state(false)
  let searchQuery = $state('')
  
  let showHeader = $derived($config.header?.show !== false)
  let title = $derived($config.header?.title || 'Social Appliance')
  let isLoggedIn = $derived(authStore.isFullyAuthenticated($authStore))
  let showCreateButton = $derived(
    isLoggedIn && 
    !$config.api?.serverless && 
    $config.features?.authentication !== false && 
    $config.features?.allowCreate !== false
  )
  let showLoginButton = $derived(
    !isLoggedIn &&
    !$config.api?.serverless &&
    $config.features?.authentication !== false
  )
  let showNotificationsButton = $derived(isLoggedIn)
  
  function getDisplayName(auth: any): string {
    if (!auth) return ''
    if (auth.type === 'siwe') {
      if (auth.ensName) {
        return auth.ensName
      }
      if (auth.address) {
        return `${auth.address.substring(0, 6)}...${auth.address.substring(auth.address.length - 4)}`
      }
    }
    if (auth.type === 'magic' && auth.email) {
      return auth.email
    }
    return 'User'
  }
  
  function handleSearch(e: Event) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    
    const url = new URL(window.location.href)
    url.searchParams.set('q', searchQuery.trim())
    window.location.href = url.toString()
  }
  
  function handleCreate() {
    console.log('Create button clicked')
    // TODO: Implement create functionality
  }
  
  function handleNotifications() {
    console.log('Notifications clicked')
    // TODO: Implement notifications functionality
  }
  
  function handleLoginClick() {
    showLoginModal = true
  }
</script>

{#snippet logo()}
  <RouterLink to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
    {#snippet children()}
      <span class="font-medium text-sm">{title}</span>
    {/snippet}
  </RouterLink>
{/snippet}

{#snippet searchBar()}
  <form onsubmit={handleSearch} class="flex-1 max-w-md">
    <div class="relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search..."
        class="w-full bg-white dark:bg-black border border-black/10 dark:border-white/10 px-3 py-1.5 pl-9 text-xs focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
      />
      <svg 
        class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40 dark:text-white/40"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  </form>
{/snippet}

{#snippet createButton()}
  {#if showCreateButton}
    <button
      onclick={handleCreate}
      class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 text-xs transition-colors"
      title="Create new content"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <span>Create</span>
    </button>
  {/if}
{/snippet}

{#snippet notificationsButton()}
  {#if showNotificationsButton}
    <button
      onclick={handleNotifications}
      class="relative p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      title="Notifications"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span class="absolute top-1 right-1 w-1.5 h-1.5 bg-white dark:bg-white rounded-full"></span>
    </button>
  {/if}
{/snippet}

{#snippet userActions()}
  {#if isLoggedIn}
    <RouterLink 
      to="/profile" 
      className="px-3 py-1.5 border border-black/20 dark:border-white/20 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-xs uppercase tracking-wider"
    >
      {#snippet children()}
        {getDisplayName($authStore)}
      {/snippet}
    </RouterLink>
  {:else if showLoginButton}
    <button
      onclick={handleLoginClick}
      class="px-3 py-1.5 border border-black/20 dark:border-white/20 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-xs uppercase tracking-wider"
    >
      Login
    </button>
  {/if}
{/snippet}

{#snippet actionButtons()}
  <div class="flex items-center gap-1">
    {@render createButton()}
    {@render notificationsButton()}
    {@render userActions()}
  </div>
{/snippet}

{#if showHeader}
  <header class="shrink-0 min-h-0 z-50 h-14 bg-white dark:bg-black border-b border-black/10 dark:border-white/10">
    <div class="w-full max-w-container mx-auto h-full flex items-center justify-between gap-4">
      {@render logo()}
      {@render searchBar()}
      {@render actionButtons()}
    </div>
  </header>
{/if}

{#if showLoginModal}
  <LoginModal
    on:close={() => showLoginModal = false}
  />
{/if}
