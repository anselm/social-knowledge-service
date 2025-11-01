<script lang="ts">
  const testimonials = [
    {
      quote: "Finally, a social network that brings people together in real life. I've met more interesting neighbors in a month than in years of living here.",
      author: "Sarah Chen",
      role: "Community Organizer"
    },
    {
      quote: "The trust-based system means I actually feel safe meeting new people. It's like having the whole neighborhood vouch for each other.",
      author: "Marcus Johnson",
      role: "Local Business Owner"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Early Adopters" },
    { value: "150+", label: "Cities" },
    { value: "5,000+", label: "Local Events" },
    { value: "100%", label: "Open Source" }
  ];
</script>

<section id="community" class="py-24 lg:py-32 bg-black text-white">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 tracking-tight" data-testid="text-social-proof-title">
        Join a Growing Movement
      </h2>
      <p class="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto" data-testid="text-social-proof-subtitle">
        Thousands are already building stronger communities, one connection at a time.
      </p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
      {#each stats as stat, index}
        <div class="text-center" data-testid={`stat-${index}`}>
          <div class="text-5xl md:text-6xl font-display font-bold mb-2" data-testid={`text-stat-value-${index}`}>
            {stat.value}
          </div>
          <div class="text-sm md:text-base text-gray-400 uppercase tracking-wide" data-testid={`text-stat-label-${index}`}>
            {stat.label}
          </div>
        </div>
      {/each}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {#each testimonials as testimonial, index}
        <div class="border border-white/20 p-8" data-testid={`testimonial-${index}`}>
          <p class="text-xl md:text-2xl mb-8 leading-relaxed" data-testid={`text-testimonial-quote-${index}`}>
            "{testimonial.quote}"
          </p>
          <div>
            <div class="font-bold" data-testid={`text-testimonial-author-${index}`}>{testimonial.author}</div>
            <div class="text-gray-400 text-sm" data-testid={`text-testimonial-role-${index}`}>{testimonial.role}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
