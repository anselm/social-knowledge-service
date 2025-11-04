import { writable } from 'svelte/store'
import { authService, type AuthUser, type Party } from '../services/authService'

export interface AuthState {
  type: 'siwe' | 'magic'
  address?: string
  ensName?: string
  email?: string
  issuer?: string
  didToken?: string
  // SIWE authentication proof (needed for authenticated requests)
  message?: string
  signature?: string
  nonce?: string
  partyId?: string // The user's primary party entity ID
  partySlug?: string // The user's primary party entity slug
  user?: AuthUser // Full user data from server
  party?: Party // Full party entity data
}

const AUTH_STORAGE_KEY = 'auth_state'

function createAuthStore() {
  // Load initial state from localStorage
  let initialState: AuthState | null = null
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (stored) {
      try {
        initialState = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse stored auth state:', e)
      }
    }
  }

  const { subscribe, set, update } = writable<AuthState | null>(initialState)

  return {
    subscribe,
    
    /**
     * Complete authentication flow with SIWE
     */
    async loginWithSiwe(authData: {
      message: string
      signature: string
      nonce: string
      address: string
    }) {
      console.log('authStore.loginWithSiwe called')
      
      try {
        const result = await authService.completeAuthFlow({
          type: 'siwe',
          message: authData.message,
          signature: authData.signature,
          nonce: authData.nonce
        })

        if (!result.success) {
          return { success: false, error: result.error }
        }

        const authState: AuthState = {
          type: 'siwe',
          address: authData.address,
          message: authData.message,
          signature: authData.signature,
          nonce: authData.nonce,
          user: result.user,
          party: result.party,
          partyId: result.party?.id,
          partySlug: result.party?.meta?.slug
        }

        console.log('SIWE authentication successful:', authState)
        set(authState)
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
        }

        return {
          success: true,
          hasParty: !result.needsParty,
          party: result.party,
          needsParty: result.needsParty
        }
      } catch (error) {
        console.error('SIWE authentication failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },

    /**
     * Complete authentication flow with Magic.link
     */
    async loginWithMagic(didToken: string) {
      console.log('authStore.loginWithMagic called')
      
      try {
        const result = await authService.completeAuthFlow({
          type: 'magic',
          didToken: didToken
        })

        if (!result.success) {
          return { success: false, error: result.error }
        }

        const authState: AuthState = {
          type: 'magic',
          didToken: didToken,
          issuer: result.user?.issuer,
          email: result.user?.email,
          address: result.user?.address,
          user: result.user,
          party: result.party,
          partyId: result.party?.id,
          partySlug: result.party?.meta?.slug
        }

        console.log('Magic authentication successful:', authState)
        set(authState)
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
        }

        return {
          success: true,
          hasParty: !result.needsParty,
          party: result.party,
          needsParty: result.needsParty
        }
      } catch (error) {
        console.error('Magic authentication failed:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },

    /**
     * Create a party for the authenticated user
     */
    async createParty(username: string) {
      console.log('authStore.createParty called with:', username)
      
      try {
        const party = await authService.createUserParty(username)
        
        update(state => {
          if (!state) {
            console.error('Cannot create party - no auth state exists')
            return state
          }
          
          const newState = { 
            ...state, 
            party: party,
            partyId: party.id, 
            partySlug: party.meta?.slug 
          }
          
          console.log('Party created, updating auth state:', newState)
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState))
          }
          return newState
        })

        return { success: true, party }
      } catch (error) {
        console.error('Failed to create party:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },

    /**
     * Legacy method for backward compatibility
     */
    async login(authData: Omit<AuthState, 'partyId' | 'partySlug'>) {
      console.log('authStore.login (legacy) called with:', authData)
      
      if (authData.type === 'magic' && authData.didToken) {
        const store = createAuthStore()
        return store.loginWithMagic(authData.didToken)
      } else if (authData.type === 'siwe' && authData.address) {
        // Handle SIWE authentication - set the auth state
        update(state => {
          const newState: AuthState = {
            ...authData,
            type: 'siwe'
          }
          console.log('Setting SIWE auth state:', newState)
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState))
          }
          return newState
        })
        return { success: true }
      } else {
        console.error('Legacy login called with unsupported auth type or missing data')
        return { success: false, error: 'Unsupported authentication method' }
      }
    },

    completeSignup: (partyId: string, partySlug: string) => {
      console.log('authStore.completeSignup called with:', { partyId, partySlug })
      update(state => {
        if (!state) {
          console.error('Cannot complete signup - no auth state exists')
          return state
        }
        const newState = { ...state, partyId, partySlug }
        console.log('Updating auth state to:', newState)
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState))
        }
        return newState
      })
    },
    
    logout: () => {
      console.log('authStore.logout called')
      authService.logout()
      set(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    },
    
    // Check if user is fully logged in (authenticated + has party)
    isFullyAuthenticated: (state: AuthState | null): boolean => {
      if (!state || !state.partyId) {
        const result = false
        console.log('isFullyAuthenticated check:', { state, result, reason: 'missing state or partyId' })
        return result
      }
      
      // For SIWE, we just need address and partyId
      // For Magic, we need issuer/email and partyId
      const hasAuthData = (state.type === 'siwe' && state.address) || 
                         (state.type === 'magic' && (state.issuer || state.email))
      
      const result = !!hasAuthData
      console.log('isFullyAuthenticated check:', { state, result, hasAuthData, type: state.type })
      return result
    }
  }
}

export const authStore = createAuthStore()
