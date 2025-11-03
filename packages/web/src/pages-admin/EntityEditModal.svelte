<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Entity } from '../types'
  
  let { entity }: { entity: Entity } = $props()
  
  const dispatch = createEventDispatcher()
  
  let slug = $state(entity.slug || '')
  let title = $state(entity.title || '')
  let content = $state(entity.content || '')
  
  function handleSave() {
    dispatch('save', {
      ...entity,
      slug,
      title,
      content
    })
  }
  
  function handleCancel() {
    dispatch('cancel')
  }
</script>

<div class="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
  <div class="bg-black border border-white/20 p-6 max-w-md w-full">
    <h3 class="text-xs uppercase tracking-wider mb-4">Edit Entity</h3>
    <div class="space-y-4">
      <div>
        <label for="edit-entity-slug" class="block text-xs text-white/60 mb-1">Slug</label>
        <input
          id="edit-entity-slug"
          type="text"
          bind:value={slug}
          class="w-full bg-black border border-white/20 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label for="edit-entity-title" class="block text-xs text-white/60 mb-1">Title</label>
        <input
          id="edit-entity-title"
          type="text"
          bind:value={title}
          class="w-full bg-black border border-white/20 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label for="edit-entity-content" class="block text-xs text-white/60 mb-1">Content</label>
        <textarea
          id="edit-entity-content"
          bind:value={content}
          class="w-full bg-black border border-white/20 px-2 py-1 text-sm"
          rows="4"
        ></textarea>
      </div>
      <div class="flex gap-2">
        <button
          onclick={handleSave}
          class="border border-white/20 px-3 py-1 text-xs uppercase tracking-wider hover:bg-white hover:text-black"
        >
          Save
        </button>
        <button
          onclick={handleCancel}
          class="text-xs uppercase tracking-wider text-white/60 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
