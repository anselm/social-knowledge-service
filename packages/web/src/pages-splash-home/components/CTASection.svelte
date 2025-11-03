<script lang="ts">
  import { navigateTo } from '../../utils/navigation';

  let email = "";

  function handleSubmit(e: Event) {
    e.preventDefault();
    console.log("Email submitted:", email);
    email = "";
    navigateTo('/home');
  }
</script>

<section class="py-24 lg:py-32 bg-black text-white">
  <div class="max-w-7xl mx-auto px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 tracking-tight" data-testid="text-cta-title">
        Ready to Connect?
      </h2>
      <p class="text-lg md:text-xl text-gray-300 mb-12" data-testid="text-cta-subtitle">
        Join our waitlist and be among the first to experience real-world social networking.
      </p>
      
      <form on:submit={handleSubmit} class="max-w-md mx-auto">
        <div class="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            bind:value={email}
            required
            class="flex-1 bg-white text-black border-white h-12 px-4"
            data-testid="input-email"
          />
          <button 
            type="submit" 
            class="w-full sm:w-auto min-h-12 px-8 bg-white text-black hover:bg-white font-medium"
            data-testid="button-submit"
          >
            Join Waitlist
          </button>
        </div>
      </form>

      <div class="mt-16 pt-16 border-t border-white/20">
        <p class="text-sm text-gray-400 mb-4" data-testid="text-opensource">
          This project is open source and community driven
        </p>
        <button 
          class="border-2 border-white text-white hover:bg-white/10 px-4 py-2"
          data-testid="button-github-footer"
        >
          View on GitHub
        </button>
      </div>
    </div>
  </div>
</section>
