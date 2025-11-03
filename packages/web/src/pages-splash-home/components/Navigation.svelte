<script lang="ts">
  import { navigateTo } from '../../utils/navigation';

  let mobileMenuOpen = false;

  function handleGetStarted() {
    navigateTo('/home');
  }
</script>

<nav class="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-12">
        <a href="/" class="text-xl font-display font-bold" data-testid="link-home">
          Connect
        </a>
        <div class="hidden md:flex items-center gap-8">
          <a href="#features" class="text-sm font-medium hover-elevate px-3 py-2" data-testid="link-features">
            Features
          </a>
          <a href="#community" class="text-sm font-medium hover-elevate px-3 py-2" data-testid="link-community">
            Community
          </a>
          <a href="#trust" class="text-sm font-medium hover-elevate px-3 py-2" data-testid="link-trust">
            Trust & Safety
          </a>
        </div>
      </div>
      
      <div class="hidden md:flex items-center gap-4">
        <button class="px-3 py-1.5 text-sm font-medium hover-elevate" data-testid="button-github">
          Open Source
        </button>
        <button class="px-4 py-1.5 text-sm font-medium bg-foreground text-background hover-elevate" on:click={handleGetStarted} data-testid="button-join">
          Get Started
        </button>
      </div>

      <button
        class="md:hidden p-2"
        on:click={() => mobileMenuOpen = !mobileMenuOpen}
        data-testid="button-menu-toggle"
      >
        {#if mobileMenuOpen}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        {:else}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        {/if}
      </button>
    </div>

    {#if mobileMenuOpen}
      <div class="md:hidden py-4 border-t border-border">
        <div class="flex flex-col gap-2">
          <a href="#features" class="px-3 py-2 text-sm font-medium hover-elevate" data-testid="link-features-mobile">
            Features
          </a>
          <a href="#community" class="px-3 py-2 text-sm font-medium hover-elevate" data-testid="link-community-mobile">
            Community
          </a>
          <a href="#trust" class="px-3 py-2 text-sm font-medium hover-elevate" data-testid="link-trust-mobile">
            Trust & Safety
          </a>
          <div class="flex flex-col gap-2 mt-4">
            <button class="w-full px-3 py-1.5 text-sm font-medium hover-elevate" data-testid="button-github-mobile">
              Open Source
            </button>
            <button class="w-full px-4 py-1.5 text-sm font-medium bg-foreground text-background hover-elevate" on:click={handleGetStarted} data-testid="button-join-mobile">
              Get Started
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</nav>
