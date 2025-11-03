<script lang="ts">
  const trustFeatures = [
    {
      number: "01",
      title: "Decentralized Identity",
      description: "Own your identity across platforms. We don't lock you in—authenticate with your own credentials and take your connections with you."
    },
    {
      number: "02",
      title: "Social Trust Graphs",
      description: "Your network vouches for you. Trust flows through real relationships, not algorithmic black boxes, naturally filtering out bad actors."
    },
    {
      number: "03",
      title: "Open Source & Community Driven",
      description: "Transparent code, community governance, and no corporate surveillance. Built by the people, for the people."
    },
    {
      number: "04",
      title: "Privacy First",
      description: "Your data stays yours. We're not in the business of selling your information—we're in the business of building community."
    }
  ];
</script>

<section id="trust" class="py-24 lg:py-32 bg-background">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center mb-16">
      <h2 class="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 tracking-tight" data-testid="text-trust-title">
        Built on Trust, Not Surveillance
      </h2>
      <p class="text-lg md:text-xl text-muted-foreground" data-testid="text-trust-subtitle">
        Your safety and privacy aren't afterthoughts—they're the foundation.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {#each trustFeatures as feature, index}
        <div class="border border-border p-8" data-testid={`card-trust-${index}`}>
          <div class="text-5xl font-display font-bold text-muted-foreground/20 mb-4" data-testid={`text-trust-number-${index}`}>
            {feature.number}
          </div>
          <h3 class="text-2xl font-bold mb-4" data-testid={`text-trust-feature-title-${index}`}>
            {feature.title}
          </h3>
          <p class="text-muted-foreground leading-relaxed" data-testid={`text-trust-feature-description-${index}`}>
            {feature.description}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
