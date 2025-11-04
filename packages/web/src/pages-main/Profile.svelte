<script lang="ts">
  import { authStore } from '@/stores/auth'
  import { navigateTo } from '@/utils/navigation'
  import RouterLink from './components/RouterLink.svelte'

  import RecentPostsSection from './components/profile/RecentPostsSection.svelte'
  import AnalyticsSection from './components/profile/AnalyticsSection.svelte'
  import SettingsSection from './components/profile/SettingsSection.svelte'
  import FavoritesSection from './components/profile/FavoritesSection.svelte'
  
  import { getMagic } from '@/lib/magic'

  // Redirect to home if not authenticated, but only once and not during navigation
  let hasCheckedAuth = $state(false)
  
  $effect(() => {
    if (!hasCheckedAuth && !authStore.isFullyAuthenticated($authStore)) {
      console.log('Profile: User not authenticated, redirecting to home')
      hasCheckedAuth = true
      navigateTo('/')
    } else if (authStore.isFullyAuthenticated($authStore)) {
      hasCheckedAuth = true
    }
  })
  
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
  
  async function handleLogout() {
    if ($authStore?.type === 'magic') {
      try {
        const magic = getMagic()
        await magic.user.logout()
      } catch (e) {
        console.error('Magic logout error:', e)
      }
    }
    authStore.logout()
    navigateTo('/')
  }
</script>

{#if authStore.isFullyAuthenticated($authStore)}
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold mb-2">Your Profile</h1>
          <p class="text-sm text-white/60">
            Signed in as <span class="font-medium text-white/80">{getDisplayName($authStore)}</span>
          </p>
          {#if $authStore?.partySlug}
            <p class="text-xs text-white/40 mt-1">
              Your public page: <RouterLink to={$authStore.partySlug} className="text-blue-400 hover:text-blue-300 underline">
                {#snippet children()}
                  {$authStore.partySlug}
                {/snippet}
              </RouterLink>
            </p>
          {:else}
            <p class="text-xs text-red-400 mt-1">
              ⚠️ No profile entity found. Please contact support.
            </p>
          {/if}
        </div>
        
        <button
          onclick={handleLogout}
          class="px-4 py-2 border border-white/20 hover:bg-white hover:text-black transition-colors text-xs uppercase tracking-wider"
        >
          Logout
        </button>
      </div>
    </div>
    
    <!-- Main Content Grid -->
    <div class="space-y-6">
      <!-- Analytics -->
      <AnalyticsSection />
      
      <!-- Recent Posts -->
      <RecentPostsSection />
      
      <!-- Favorites (Stubbed) -->
      <FavoritesSection />
      
      <!-- Settings -->
      <SettingsSection />
    </div>
    
    <!-- Back Link -->
    <div class="mt-8 pt-6 border-t border-white/10">
      <RouterLink to="/" className="text-xs text-white/60 hover:text-white underline">
        {#snippet children()}
          ← Back to home
        {/snippet}
      </RouterLink>
    </div>
  </div>
{:else}
  <div class="text-center py-12">
    <p class="text-white/60 mb-4">Please sign in to view your profile</p>
    <RouterLink 
      to="/" 
      className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors text-sm font-medium inline-block"
    >
      {#snippet children()}
        Go Home
      {/snippet}
    </RouterLink>
  </div>
{/if}
