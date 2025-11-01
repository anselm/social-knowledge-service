<script lang="ts">
  import { writable } from 'svelte/store'
  
  // Settings store (persisted to localStorage)
  const settingsKey = 'user-settings'
  
  function loadSettings() {
    if (typeof window === 'undefined') return {
      allowLocation: false,
      theme: 'dark',
      coordinateSystem: 'metric'
    }
    
    const stored = localStorage.getItem(settingsKey)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse settings:', e)
      }
    }
    
    return {
      allowLocation: false,
      theme: 'dark',
      coordinateSystem: 'metric'
    }
  }
  
  const settings = writable(loadSettings())
  
  // Save to localStorage whenever settings change
  $effect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(settingsKey, JSON.stringify($settings))
    }
  })
  
  function handleAllowLocationChange(e: Event) {
    const target = e.target as HTMLInputElement
    settings.update(s => ({ ...s, allowLocation: target.checked }))
  }
  
  function handleThemeChange(e: Event) {
    const target = e.target as HTMLSelectElement
    settings.update(s => ({ ...s, theme: target.value }))
  }
  
  function handleCoordinateSystemChange(e: Event) {
    const target = e.target as HTMLSelectElement
    settings.update(s => ({ ...s, coordinateSystem: target.value }))
  }
</script>

<div class="bg-white/5 border border-white/20 rounded-lg p-6">
  <h2 class="text-lg font-semibold mb-4">Settings</h2>
  
  <div class="space-y-4">
    <!-- Location Permission -->
    <div class="flex items-center justify-between py-2 border-b border-white/10">
      <div>
        <div class="text-sm font-medium">Allow Location on Map</div>
        <div class="text-xs text-white/60 mt-1">
          Show your location when viewing maps
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={$settings.allowLocation}
          onchange={handleAllowLocationChange}
          class="sr-only peer"
        />
        <div class="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
    
    <!-- Theme -->
    <div class="py-2 border-b border-white/10">
      <label for="theme" class="block text-sm font-medium mb-2">
        Theme
      </label>
      <select
        id="theme"
        value={$settings.theme}
        onchange={handleThemeChange}
        class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
      >
        <option value="dark">Dark</option>
        <option value="light">Light (Coming Soon)</option>
        <option value="auto">Auto (Coming Soon)</option>
      </select>
      <div class="text-xs text-white/60 mt-1">
        Choose your preferred color scheme
      </div>
    </div>
    
    <!-- Coordinate System -->
    <div class="py-2">
      <label for="coordinates" class="block text-sm font-medium mb-2">
        Coordinate System
      </label>
      <select
        id="coordinates"
        value={$settings.coordinateSystem}
        onchange={handleCoordinateSystemChange}
        class="w-full bg-black border border-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white"
      >
        <option value="metric">Metric (km, m)</option>
        <option value="imperial">Imperial (mi, ft)</option>
      </select>
      <div class="text-xs text-white/60 mt-1">
        Units for displaying distances and measurements
      </div>
    </div>
  </div>
  
  <div class="mt-6 pt-4 border-t border-white/10">
    <div class="text-xs text-white/40">
      Settings are saved locally in your browser
    </div>
  </div>
</div>
