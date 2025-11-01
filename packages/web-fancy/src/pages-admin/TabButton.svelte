<script lang="ts">
  let { active = false, label, onclick }: { active?: boolean, label: string, onclick?: () => void } = $props()
</script>

<button
  {onclick}
  class="pb-2 text-xs uppercase tracking-wider {active ? 'border-b border-white' : 'text-white/60 hover:text-white'}"
>
  {label}
</button>
