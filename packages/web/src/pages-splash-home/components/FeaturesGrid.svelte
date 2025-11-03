<script lang="ts">
  const features = [
    {
      icon: "map-pin",
      title: "Hyper-Local Discovery",
      description: "Find hidden gems, events, and activities happening right in your neighborhood. Connect with your community, not the whole world."
    },
    {
      icon: "users",
      title: "Group Connections",
      description: "Join groups around shared interests and passions. Meet people who love what you love, and do it together in real life."
    },
    {
      icon: "shield",
      title: "Trust-Based Safety",
      description: "Built on social trust graphs and decentralized identity. Your community vouches for you, filtering out bad actors naturally."
    }
  ];
</script>

<section i d="features" class="py-24 lg:py-32 bg-card">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 tracking-tight" data-testid="text-features-title">
        Built for Real Connection
      </h2>
      <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-features-subtitle">
        Everything you need to discover, connect, and thrive in your local community.
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each features as feature, index}
        <div class="bg-background p-8 border border-border" data-testid={`card-feature-${index}`}>
          {#if feature.icon === "map-pin"}
            <svg class="w-12 h-12 mb-6" data-testid={`icon-feature-${index}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          {:else if feature.icon === "users"}
            <svg class="w-12 h-12 mb-6" data-testid={`icon-feature-${index}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          {:else if feature.icon === "shield"}
            <svg class="w-12 h-12 mb-6" data-testid={`icon-feature-${index}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          {/if}
          <h3 class="text-2xl font-bold mb-4" data-testid={`text-feature-title-${index}`}>
            {feature.title}
          </h3>
          <p class="text-muted-foreground leading-relaxed" data-testid={`text-feature-description-${index}`}>
            {feature.description}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
