<script lang="ts">
  import { api } from '../services/api'
  import { authStore } from '../stores/auth'
  import EntityForm from '../pages-main/components/EntityForm.svelte'
  import { createEventDispatcher } from 'svelte'
  
  const dispatch = createEventDispatcher()
  
  async function handleCreateEntity(event: CustomEvent) {
    const newEntity = event.detail
    
    try {
      const data: any = {
        title: newEntity.title,
        content: newEntity.content,
        auth: $authStore?.address || $authStore?.issuer
      }
      
      if (newEntity.slug) data.slug = newEntity.slug
      if (newEntity.parentId) data.parentId = newEntity.parentId
      if (newEntity.sponsorId) data.sponsorId = newEntity.sponsorId
      
      if (newEntity.type === 'group') {
        await api.createGroup(data)
      } else if (newEntity.type === 'party') {
        await api.createUser(data)
      } else {
        await api.createPost(data)
      }
      
      // Switch to entities tab
      dispatch('created')
    } catch (error) {
      console.error('Failed to create entity:', error)
      alert('Failed to create entity: ' + (error as Error).message)
    }
  }
</script>

<EntityForm on:submit={handleCreateEntity} />
