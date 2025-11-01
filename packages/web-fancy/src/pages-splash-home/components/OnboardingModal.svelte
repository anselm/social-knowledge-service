<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isOpen: boolean;

  const dispatch = createEventDispatcher();

  let step = 1;
  let selectedType = "";
  let selectedInterests: string[] = [];

  const userTypes = [
    { id: "explorer", label: "I want inspiration", description: "Show me what's happening" },
    { id: "seeker", label: "I know what I want", description: "Help me find it" },
    { id: "organizer", label: "I want to host", description: "Create events & activities" },
  ];

  const interests = [
    "Food & Drinks", "Live Music", "Sports & Fitness", "Arts & Culture", 
    "Outdoor Adventures", "Tech & Gaming", "Books & Learning", "Nightlife"
  ];

  function handleClose() {
    dispatch('close');
  }

  function handleComplete() {
    dispatch('complete', { type: selectedType, interests: selectedInterests });
    console.log("Onboarding complete:", { selectedType, selectedInterests });
  }

  function toggleInterest(interest: string) {
    if (selectedInterests.includes(interest)) {
      selectedInterests = selectedInterests.filter(i => i !== interest);
    } else {
      selectedInterests = [...selectedInterests, interest];
    }
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" data-testid="modal-onboarding">
    <div class="bg-background max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="sticky top-0 bg-background border-b border-border p-6 flex justify-between items-center">
        <h2 class="text-2xl font-bold" data-testid="text-modal-title">
          {step === 1 ? "What brings you here?" : "What are you into?"}
        </h2>
        <button title="b" on:click={handleClose} data-testid="button-close-modal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6">
        {#if step === 1}
          <div class="space-y-4">
            {#each userTypes as type}
              <button
                on:click={() => selectedType = type.id}
                class={`w-full text-left p-6 border-2 transition-all hover-elevate ${
                  selectedType === type.id 
                    ? 'border-foreground bg-muted' 
                    : 'border-border'
                }`}
                data-testid={`button-usertype-${type.id}`}
              >
                <div class="font-bold text-lg mb-1">{type.label}</div>
                <div class="text-muted-foreground text-sm">{type.description}</div>
              </button>
            {/each}
            <button 
              class="w-full mt-6 px-8 py-3 text-base bg-foreground text-background hover-elevate font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={!selectedType}
              on:click={() => step = 2}
              data-testid="button-next-step"
            >
              Continue
            </button>
          </div>
        {:else}
          <div class="space-y-6">
            <p class="text-muted-foreground">Select at least 3 to personalize your feed</p>
            <div class="grid grid-cols-2 gap-3">
              {#each interests as interest}
                <button
                  on:click={() => toggleInterest(interest)}
                  class={`p-4 border-2 text-sm font-medium transition-all hover-elevate ${
                    selectedInterests.includes(interest)
                      ? 'border-foreground bg-muted'
                      : 'border-border'
                  }`}
                  data-testid={`button-interest-${interest.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {interest}
                </button>
              {/each}
            </div>
            <div class="flex gap-4">
              <button 
                class="px-4 py-2 border border-border hover-elevate"
                on:click={() => step = 1}
                data-testid="button-back"
              >
                Back
              </button>
              <button 
                class="flex-1 px-8 py-3 text-base bg-foreground text-background hover-elevate font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedInterests.length < 3}
                on:click={handleComplete}
                data-testid="button-complete"
              >
                Get Started ({selectedInterests.length}/3)
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
