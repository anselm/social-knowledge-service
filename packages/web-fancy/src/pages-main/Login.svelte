<script lang="ts">
  import { authStore } from '@/stores/auth'
  import { navigateTo } from '@/utils/navigation'
  
  let username = ''

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (username.trim()) {
      await authStore.login(username.trim())
      navigateTo('/')
    }
  }
</script>

<div class="max-w-sm">
  <h1 class="text-xs uppercase tracking-wider mb-8">Login</h1>
  <form on:submit={handleSubmit} class="space-y-4">
    <div>
      <label for="username" class="block text-xs text-white/60 mb-1">
        Username
      </label>
      <input
        id="username"
        type="text"
        bind:value={username}
        class="w-full bg-black border border-white/20 px-2 py-1 text-sm focus:outline-none focus:border-white"
        placeholder="enter username"
      />
    </div>
    <button
      type="submit"
      class="border border-white/20 px-4 py-1 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
    >
      Enter
    </button>
  </form>
</div>
