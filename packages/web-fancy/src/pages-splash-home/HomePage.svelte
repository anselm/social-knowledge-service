<script lang="ts">
  import { onMount } from 'svelte';
  import HomeHeader from './components/HomeHeader.svelte';
  import QuickActions from './components/QuickActions.svelte';
  import ActivityCard from './components/ActivityCard.svelte';
  import OnboardingModal from './components/OnboardingModal.svelte';
  import eventImage from './assets/stock_images/local_event_live_mus_c05a9709.jpg';
  import groupImage from './assets/stock_images/community_group_gath_93e7e52c.jpg';
  import cafeImage from './assets/stock_images/friends_meeting_at_l_81e65481.jpg';
  import streetImage from './assets/stock_images/people_exploring_loc_48b1d4aa.jpg';

  const mockActivities = [
    {
      id: "1",
      title: "Underground Comedy Show",
      type: "event" as const,
      image: eventImage,
      location: "The Basement",
      distance: "0.4 mi",
      time: "Tonight, 9 PM",
      groupSize: 15,
      maxGroupSize: 30,
      tags: ["Comedy", "Nightlife", "BYOB"],
    },
    {
      id: "2",
      title: "Rooftop Yoga at Sunrise",
      type: "activity" as const,
      image: groupImage,
      location: "Central Building",
      distance: "0.6 mi",
      time: "Tomorrow, 6 AM",
      groupSize: 8,
      maxGroupSize: 12,
      tags: ["Fitness", "Wellness", "Outdoors"],
    },
    {
      id: "3",
      title: "Vinyl Record Shop & Cafe",
      type: "place" as const,
      image: cafeImage,
      location: "Arts District",
      distance: "0.9 mi",
      groupSize: 23,
      tags: ["Music", "Coffee", "Vintage"],
    },
    {
      id: "4",
      title: "Street Food Night Market",
      type: "event" as const,
      image: streetImage,
      location: "River Walk",
      distance: "1.1 mi",
      time: "Friday-Sunday, 6-11 PM",
      groupSize: 45,
      tags: ["Food", "Culture", "Family Friendly"],
    },
    {
      id: "5",
      title: "Indie Bookstore Poetry Reading",
      type: "event" as const,
      image: cafeImage,
      location: "Pages & Co",
      distance: "0.3 mi",
      time: "This Thursday, 7 PM",
      groupSize: 10,
      maxGroupSize: 25,
      tags: ["Books", "Poetry", "Arts"],
    },
    {
      id: "6",
      title: "Morning Trail Run Group",
      type: "activity" as const,
      image: groupImage,
      location: "Riverside Park",
      distance: "1.5 mi",
      time: "Every Wed & Sat, 7 AM",
      groupSize: 12,
      tags: ["Fitness", "Outdoors", "Social"],
    },
  ];

  let showOnboarding = true;
  let userType = "";
  let userInterests: string[] = [];

  function handleOnboardingComplete(event: CustomEvent<{ type: string; interests: string[] }>) {
    userType = event.detail.type;
    userInterests = event.detail.interests;
    showOnboarding = false;
    console.log("User onboarded:", { type: userType, interests: userInterests });
  }
</script>

<div class="min-h-screen bg-background">
  <HomeHeader />
  <QuickActions />
  
  <div class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h2 class="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="text-happening-title">
        Happening Right Now
      </h2>
      <p class="text-muted-foreground" data-testid="text-happening-subtitle">
        Activities and places your community is into
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each mockActivities as activity (activity.id)}
        <ActivityCard {...activity} />
      {/each}
    </div>

    <div class="mt-12 text-center">
      <p class="text-muted-foreground mb-4">Looking for something specific?</p>
      <div class="flex flex-wrap justify-center gap-3">
        <button class="px-4 py-2 border border-border hover-elevate text-sm" data-testid="button-filter-today">
          Happening Today
        </button>
        <button class="px-4 py-2 border border-border hover-elevate text-sm" data-testid="button-filter-weekend">
          This Weekend
        </button>
        <button class="px-4 py-2 border border-border hover-elevate text-sm" data-testid="button-filter-groups">
          Active Groups
        </button>
      </div>
    </div>
  </div>

  <OnboardingModal
    isOpen={showOnboarding}
    on:close={() => showOnboarding = false}
    on:complete={handleOnboardingComplete}
  />
</div>
