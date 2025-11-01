<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { getMagic } from '@/lib/magic'
  import { verifyMessage } from '@/lib/siweVerify'
  import { lookupENSName } from '@/lib/ens'
  import { authStore } from '@/stores/auth'
  import { api } from '@/services/api'
  import { navigateTo } from '@/utils/navigation'
  import PartySlugForm from '../PartySlugForm.svelte'
  
  const dispatch = createEventDispatcher()
  
  let error = $state('')
  let loading = $state(false)
  let lookingUpENS = $state(false)
  let needsPartyCreation = $state(false)
  let tempAuthData = $state<any>(null)
  let creatingParty = $state(false)
  
  function handleClose() {
    // If authenticated but not completed party creation, logout
    if (needsPartyCreation && tempAuthData) {
      if (tempAuthData.type === 'magic') {
        getMagic().user.logout().catch(console.error)
      }
    }
    dispatch('close')
  }
  
  async function connectMetamask() {
    error = ''
    loading = true
    
    try {
      console.log('LoginModal: Starting MetaMask connection')
      
      // @ts-ignore
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
      }

      // Check if MetaMask is locked
      // @ts-ignore
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      }).catch(() => [])
      
      if (accounts.length === 0) {
        console.log('LoginModal: MetaMask is locked or no accounts connected')
        // MetaMask is locked or no accounts are connected
        // This will prompt the user to unlock MetaMask
      }

      // Request account access (will prompt if locked)
      console.log('LoginModal: Requesting account access')
      // @ts-ignore
      const requestedAccounts = await Promise.race([
        window.ethereum.request({ method: 'eth_requestAccounts' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MetaMask request timed out. Please unlock MetaMask and try again.')), 30000)
        )
      ])
      
      const account = requestedAccounts?.[0]
      if (!account) throw new Error('No account found')

      console.log('LoginModal: Got account:', account)

      const nonce = Math.random().toString(36).substring(2, 15)
      const domain = window.location.host
      const uri = window.location.origin
      const statement = 'Sign in with Ethereum to the app.'
      const version = '1'
      const chainId = 1

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        account,
        '',
        statement,
        '',
        `URI: ${uri}`,
        `Version: ${version}`,
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join('\n')

      // @ts-ignore
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      })

      console.log('LoginModal: Got signature')

      const isValid = await verifyMessage(message, signature, account)
      
      if (!isValid) {
        throw new Error('Signature verification failed')
      }

      console.log('LoginModal: Signature verified')

      let ensName: string | null = null
      try {
        lookingUpENS = true
        ensName = await lookupENSName(account)
        console.log('LoginModal: ENS name:', ensName)
      } catch (ensError: any) {
        console.warn('ENS lookup failed:', ensError.message || ensError)
      } finally {
        lookingUpENS = false
      }

      // Store temp auth data first
      tempAuthData = {
        type: 'siwe',
        address: account,
        ensName: ensName || undefined
      }

      console.log('LoginModal: Checking for existing party')

      // Check if user already has a party
      const authIdentifier = account
      const existingParties = await api.queryEntities({
        type: 'party',
        auth: authIdentifier,
        limit: 1
      })
      
      console.log('LoginModal: Found parties:', existingParties)
      
      if (existingParties && existingParties.length > 0) {
        // User has a party, complete login
        const party = existingParties[0]
        console.log('LoginModal: Completing signup with party:', party)
        
        // First set the auth data with party info
        await authStore.login(tempAuthData)
        authStore.completeSignup(party.id, party.slug || '')
        
        console.log('LoginModal: Login complete, navigating to profile')
        handleClose()
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigateTo('/profile')
        }, 100)
      } else {
        // User needs to create a party
        console.log('LoginModal: No party found, showing creation form')
        needsPartyCreation = true
      }
      
    } catch (e: any) {
      console.error('MetaMask error:', e)
      
      // Provide more helpful error messages
      if (e.message?.includes('User rejected')) {
        error = 'You rejected the connection request. Please try again and approve the connection.'
      } else if (e.message?.includes('timed out')) {
        error = e.message
      } else if (e.code === -32002) {
        error = 'A MetaMask request is already pending. Please check your MetaMask extension.'
      } else {
        error = e?.message || String(e)
      }
      
      lookingUpENS = false
    } finally {
      loading = false
    }
  }
  
  async function loginWithMagic() {
    error = ''
    loading = true
    
    try {
      console.log('LoginModal: Starting Magic login')
      
      const magic = getMagic()

      if (!import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY) {
        throw new Error('Magic.link is not configured. Please set VITE_MAGIC_PUBLISHABLE_KEY.')
      }

      const userEmail = window.prompt('Enter your email for a login link / OTP:')
      if (!userEmail) {
        loading = false
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(userEmail)) {
        throw new Error('Please enter a valid email address')
      }

      const res = await magic.auth.loginWithEmailOTP({ email: userEmail })
      if (!res) throw new Error('Magic login canceled')

      const didToken = await magic.user.getIdToken()
      const metadata = await magic.user.getInfo()

      console.log('LoginModal: Magic authenticated')

      // Store temp auth data first
      tempAuthData = {
        type: 'magic',
        email: metadata.email || userEmail,
        issuer: metadata.issuer,
        didToken: didToken
      }

      console.log('LoginModal: Checking for existing party')

      // Check if user already has a party
      const authIdentifier = metadata.issuer
      const existingParties = await api.queryEntities({
        type: 'party',
        auth: authIdentifier,
        limit: 1
      })
      
      console.log('LoginModal: Found parties:', existingParties)
      
      if (existingParties && existingParties.length > 0) {
        // User has a party, complete login
        const party = existingParties[0]
        console.log('LoginModal: Completing signup with party:', party)
        
        // First set the auth data with party info
        await authStore.login(tempAuthData)
        authStore.completeSignup(party.id, party.slug || '')
        
        console.log('LoginModal: Login complete, navigating to profile')
        handleClose()
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigateTo('/profile')
        }, 100)
      } else {
        // User needs to create a party
        console.log('LoginModal: No party found, showing creation form')
        needsPartyCreation = true
      }
      
    } catch (e: any) {
      console.error('Magic error:', e)
      error = e?.message || String(e)
    } finally {
      loading = false
    }
  }
  
  async function handleSlugSubmit(event: CustomEvent) {
    const { slug } = event.detail
    
    if (!tempAuthData) {
      error = 'Authentication data missing'
      return
    }
    
    creatingParty = true
    error = ''
    
    try {
      const authIdentifier = tempAuthData.address || tempAuthData.issuer
      
      console.log('LoginModal: Creating party with slug:', slug)
      
      // Create the party entity
      const party = await api.createUser({
        type: 'party',
        title: slug.replace(/^\//, '').replace(/\//g, ' '),
        slug: slug,
        auth: authIdentifier,
        sponsorId: authIdentifier,
        address: authIdentifier,
        contract: null
      })
      
      console.log('Party created:', party)
      
      // Wait a moment for the database to be consistent
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verify the party was created by fetching it
      try {
        const verifyParty = await api.getEntityBySlug(slug)
        console.log('Party verified:', verifyParty)
        
        // First set the auth data with party info
        await authStore.login(tempAuthData)
        authStore.completeSignup(verifyParty.id, verifyParty.slug || slug)
        
        console.log('LoginModal: Signup complete, navigating to profile')
        handleClose()
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigateTo('/profile')
        }, 100)
      } catch (verifyError) {
        console.error('Failed to verify party creation:', verifyError)
        // Still try to complete with the original party data
        await authStore.login(tempAuthData)
        authStore.completeSignup(party.id, party.slug || slug)
        
        handleClose()
        setTimeout(() => {
          navigateTo('/profile')
        }, 100)
      }
      
    } catch (e: any) {
      console.error('Failed to create party:', e)
      
      if (e.validationErrors && Array.isArray(e.validationErrors)) {
        error = e.validationErrors.join(', ')
      } else {
        error = e?.message || 'Failed to create account'
      }
    } finally {
      creatingParty = false
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <!-- Backdrop -->
  <button
    class="absolute inset-0 bg-black/80"
    onclick={handleClose}
    aria-label="Close modal"
  ></button>
  
  <!-- Modal -->
  <div class="relative bg-black border border-white/20 rounded-lg p-6 w-full max-w-md">
    <button
      onclick={handleClose}
      class="absolute top-4 right-4 text-white/60 hover:text-white"
      aria-label="Close"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    
    <h2 class="text-2xl font-bold mb-2">
      {needsPartyCreation ? 'Create Your Profile' : 'Login'}
    </h2>
    <p class="text-sm text-white/60 mb-6">
      {needsPartyCreation ? 'Choose a username to complete your account' : 'Sign in to your account'}
    </p>
    
    {#if !needsPartyCreation}
      <div class="space-y-3">
        <button 
          onclick={connectMetamask}
          disabled={loading}
          class="w-full px-4 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {#if loading || lookingUpENS}
            <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {lookingUpENS ? 'Looking up ENS...' : 'Connecting...'}
          {:else}
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.05 11.52l-3.88-6.7c-.34-.59-.98-.95-1.67-.95H7.5c-.69 0-1.33.36-1.67.95l-3.88 6.7c-.34.59-.34 1.31 0 1.9l3.88 6.7c.34.59.98.95 1.67.95h9c.69 0 1.33-.36 1.67-.95l3.88-6.7c.34-.59.34-1.31 0-1.9zM12 16.5c-2.48 0-4.5-2.02-4.5-4.5S9.52 7.5 12 7.5s4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"/>
            </svg>
            Login with MetaMask
          {/if}
        </button>
        
        <button 
          onclick={loginWithMagic}
          disabled={loading}
          class="w-full px-4 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
        >
          {#if loading}
            <span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Connecting...
          {:else}
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Login with Email
          {/if}
        </button>

        {#if error}
          <div class="p-3 bg-red-500/10 border border-red-500/20 rounded">
            <p class="text-red-400 text-xs">{error}</p>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Slug selection form -->
      <div class="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
        <p class="text-xs text-blue-400">
          ✓ Authentication successful! Now create your profile to complete the process.
        </p>
      </div>
      
      <PartySlugForm
        {creatingParty}
        {error}
        on:submit={handleSlugSubmit}
        on:cancel={handleClose}
      />
    {/if}
  </div>
</div>
