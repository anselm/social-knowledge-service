<script lang="ts">
  import { onMount } from 'svelte'
  
  let deferredPrompt: any = null
  let showPrompt = $state(false)
  let installing = $state(false)
  
  onMount(() => {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      deferredPrompt = e
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      // Show prompt if never dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        // Wait a bit before showing (let user explore first)
        setTimeout(() => {
          showPrompt = true
        }, 10000) // Show after 10 seconds
      }
    })
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      showPrompt = false
      deferredPrompt = null
    })
  })
  
  async function handleInstall() {
    if (!deferredPrompt) return
    
    installing = true
    
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`User response to install prompt: ${outcome}`)
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    // Clear the deferredPrompt
    deferredPrompt = null
    showPrompt = false
    installing = false
  }
  
  function handleDismiss() {
    showPrompt = false
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }
</script>

{#if showPrompt}
  <div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
    <div class="bg-white dark:bg-gray-900 border border-black/20 dark:border-white/20 rounded-lg shadow-2xl p-4">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold mb-1">Install App</h3>
          <p class="text-xs text-black/60 dark:text-white/60 mb-3">
            Add to your home screen for a better experience
          </p>
          
          <div class="flex gap-2">
            <button
              onclick={handleInstall}
              disabled={installing}
              class="flex-1 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-medium rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {installing ? 'Installing...' : 'Install'}
            </button>
            <button
              onclick={handleDismiss}
              class="px-3 py-1.5 border border-black/20 dark:border-white/20 text-xs rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        
        <button
          onclick={handleDismiss}
          class="flex-shrink-0 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>
