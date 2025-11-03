<script lang="ts">
  import groupImage from '../assets/stock_images/community_group_gath_93e7e52c.jpg';
  import exploreImage from '../assets/stock_images/people_exploring_loc_48b1d4aa.jpg';
  import eventImage from '../assets/stock_images/local_event_live_mus_c05a9709.jpg';

  const useCases = [
    {
      title: "Discover Local Favorites",
      description: "Share and find the best coffee shops, restaurants, parks, and hidden spots in your neighborhood. Build a collective knowledge of your community's treasures.",
      image: exploreImage,
      imageAlt: "People exploring local neighborhood"
    },
    {
      title: "Join Real Events",
      description: "From book clubs to hiking groups, art walks to live music—find events happening nearby and connect with people who share your interests.",
      image: eventImage,
      imageAlt: "Local event with live music"
    },
    {
      title: "Build Your Community",
      description: "Create or join groups around what you love. Organize activities, share recommendations, and build lasting friendships with neighbors who get it.",
      image: groupImage,
      imageAlt: "Community group gathering"
    }
  ];
</script>

<section class="py-24 lg:py-32 bg-background">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="space-y-24">
      {#each useCases as useCase, index}
        <div 
          class={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-16 items-center`}
          data-testid={`section-usecase-${index}`}
        >
          <div class="flex-1">
            <h3 class="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 tracking-tight" data-testid={`text-usecase-title-${index}`}>
              {useCase.title}
            </h3>
            <p class="text-lg md:text-xl text-muted-foreground leading-relaxed" data-testid={`text-usecase-description-${index}`}>
              {useCase.description}
            </p>
          </div>
          <div class="flex-1 w-full">
            <div class="relative aspect-[4/3] overflow-hidden bg-muted" data-testid={`img-usecase-${index}`}>
              <img 
                src={useCase.image} 
                alt={useCase.imageAlt}
                class="w-full h-full object-cover grayscale contrast-110"
              />
              <div class="absolute inset-0 bg-black/20" ></div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
