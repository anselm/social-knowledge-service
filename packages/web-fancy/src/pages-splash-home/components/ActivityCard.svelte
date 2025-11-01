<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string;
  export let title: string;
  export let type: "event" | "place" | "activity";
  export let image: string | undefined = undefined;
  export let location: string;
  export let distance: string;
  export let time: string | undefined = undefined;
  export let groupSize: number | undefined = undefined;
  export let maxGroupSize: number | undefined = undefined;
  export let tags: string[];
  export let isCheckedIn: boolean = false;

  const dispatch = createEventDispatcher();

  function handleCheckIn() {
    isCheckedIn = !isCheckedIn;
    console.log(`Check-in toggled for ${title}:`, isCheckedIn);
    dispatch('checkin', { id, isCheckedIn });
  }

  function handleDetails() {
    dispatch('details', { id });
  }
</script>

<div class="border border-border bg-card hover-elevate transition-transform" data-testid={`card-activity-${id}`}>
  {#if image}
    <div class="relative aspect-[16/9] overflow-hidden bg-muted">
      <img 
        src={image} 
        alt={title}
        class="w-full h-full object-cover grayscale contrast-110"
      />
      <div class="absolute top-4 left-4">
        <span class="px-2 py-1 text-xs uppercase bg-secondary text-secondary-foreground" data-testid={`badge-type-${id}`}>
          {type}
        </span>
      </div>
    </div>
  {/if}
  
  <div class="p-4 space-y-3">
    <h3 class="font-bold text-lg leading-tight" data-testid={`text-title-${id}`}>
      {title}
    </h3>
    
    <div class="space-y-2 text-sm text-muted-foreground">
      <div class="flex items-center gap-2" data-testid={`text-location-${id}`}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{location} · {distance}</span>
      </div>
      
      {#if time}
        <div class="flex items-center gap-2" data-testid={`text-time-${id}`}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{time}</span>
        </div>
      {/if}
      
      {#if groupSize !== undefined}
        <div class="flex items-center gap-2" data-testid={`text-group-${id}`}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>{groupSize}{maxGroupSize ? `/${maxGroupSize}` : '+'} people interested</span>
        </div>
      {/if}
    </div>

    <div class="flex flex-wrap gap-2">
      {#each tags as tag, index}
        <span 
          class="px-2 py-1 text-xs border border-border"
          data-testid={`badge-tag-${id}-${index}`}
        >
          {tag}
        </span>
      {/each}
    </div>

    <div class="flex gap-2 pt-2">
      <button 
        class={`flex-1 px-4 py-2 text-sm font-medium ${isCheckedIn ? 'bg-foreground text-background' : 'border border-border hover-elevate'}`}
        on:click={handleCheckIn}
        data-testid={`button-checkin-${id}`}
      >
        {#if isCheckedIn}
          <span class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Checked In
          </span>
        {:else}
          Check In
        {/if}
      </button>
      <button 
        class="px-4 py-2 text-sm font-medium hover-elevate"
        on:click={handleDetails}
        data-testid={`button-details-${id}`}
      >
        Details
      </button>
    </div>
  </div>
</div>
