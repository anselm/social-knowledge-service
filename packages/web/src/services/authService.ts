import { postJSON, getJSON } from '../lib/auth'
import type { Entity } from '../types'
import loggers from './logger'

const log = loggers.auth

export interface AuthUser {
  type: 'siwe' | 'magic'
  userId: string
  address?: string
  issuer?: string
  email?: string
  creatorAddress: string
  verified: boolean
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

export interface Party extends Entity {
  id: string
  meta: {
    slug: string
    label: string
    creatorAddress: string
    [key: string]: any
  }
}

/**
 * Authentication service that handles both SIWE and Magic.link authentication
 * Integrates with the new server authentication API
 */
export class AuthService {
  private currentUser: AuthUser | null = null
  private currentParty: Party | null = null

  /**
   * Get a nonce for SIWE authentication
   */
  async getNonce(): Promise<string> {
    try {
      const response = await getJSON<{ success: boolean, data: { nonce: string } }>('/api/auth/nonce')
      if (!response.success || !response.data?.nonce) {
        throw new Error('Failed to get nonce from server')
      }
      return response.data.nonce
    } catch (error) {
      log.error('Failed to get nonce:', error)
      throw error
    }
  }

  /**
   * Verify authentication with the server
   */
  async verifyAuth(authData: {
    type: 'siwe' | 'magic'
    message?: string
    signature?: string
    nonce?: string
    didToken?: string
  }): Promise<AuthResult> {
    try {
      log.info('Verifying authentication:', { type: authData.type })
      
      const response = await postJSON<{ 
        success: boolean
        data?: { user: AuthUser }
        error?: string 
      }>('/api/auth/verify', authData)

      if (!response.success || !response.data?.user) {
        throw new Error(response.error || 'Authentication verification failed')
      }

      this.currentUser = response.data.user
      log.info('Authentication successful:', { userId: this.currentUser.userId, type: this.currentUser.type })

      return {
        success: true,
        user: this.currentUser
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      log.error('Authentication verification failed:', errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Find the user's party entity
   */
  async findUserParty(creatorAddress: string): Promise<Party | null> {
    try {
      log.info('Looking for user party:', { creatorAddress })
      
      // Query for party entities created by this user
      const response = await getJSON<Entity[]>(`/api/entities?type=party&creatorAddress=${encodeURIComponent(creatorAddress)}&limit=1`)
      
      if (!Array.isArray(response) || response.length === 0) {
        log.info('No party found for user')
        return null
      }

      const party = response[0] as Party
      log.info('Found user party:', { id: party.id, slug: party.meta?.slug })
      
      this.currentParty = party
      return party
    } catch (error) {
      log.error('Failed to find user party:', error)
      return null
    }
  }

  /**
   * Create a party entity for the user
   */
  async createUserParty(username: string): Promise<Party> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to create party')
    }

    try {
      log.info('Creating party for user:', { username, creatorAddress: this.currentUser.creatorAddress })
      
      const partyData = {
        type: 'party',
        meta: {
          label: username,
          slug: `/${username}`,
          creatorAddress: this.currentUser.creatorAddress,
          permissions: 'public'
        },
        party: {
          username: username,
          authType: this.currentUser.type
        }
      }

      const party = await postJSON<Party>('/api/entities', partyData)
      
      log.info('Created party:', { id: party.id, slug: party.meta?.slug })
      this.currentParty = party
      return party
    } catch (error) {
      log.error('Failed to create party:', error)
      throw error
    }
  }

  /**
   * Complete authentication flow - authenticate and find/create party
   */
  async completeAuthFlow(authData: {
    type: 'siwe' | 'magic'
    message?: string
    signature?: string
    nonce?: string
    didToken?: string
  }): Promise<{
    success: boolean
    user?: AuthUser
    party?: Party
    needsParty?: boolean
    error?: string
  }> {
    try {
      // First verify authentication
      const authResult = await this.verifyAuth(authData)
      if (!authResult.success || !authResult.user) {
        return authResult
      }

      // Then find or require party creation
      const party = await this.findUserParty(authResult.user.creatorAddress)
      
      if (party) {
        return {
          success: true,
          user: authResult.user,
          party: party
        }
      } else {
        return {
          success: true,
          user: authResult.user,
          needsParty: true
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      log.error('Complete auth flow failed:', errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser
  }

  /**
   * Get current user's party
   */
  getCurrentParty(): Party | null {
    return this.currentParty
  }

  /**
   * Clear authentication state
   */
  logout(): void {
    this.currentUser = null
    this.currentParty = null
    log.info('User logged out')
  }
}

// Export singleton instance
export const authService = new AuthService()