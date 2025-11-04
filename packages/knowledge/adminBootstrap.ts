/**
 * Admin Bootstrap Service
 * 
 * Automatically creates essential system entities on startup:
 * - Admin user account (if none exists)
 * - Root entities from seed data
 * 
 * This ensures the system has the necessary foundation entities
 * to function properly in production.
 */

import { privateKeyToAccount } from 'viem/accounts'
import { uuidv7 } from 'uuidv7'
import { postJSON } from '../web/src/lib/auth'
import loggers from '../web/src/services/logger'

const log = loggers.app // Use app logger since admin logger doesn't exist

interface AdminCredentials {
  privateKey: string
  publicAddress: string
}

/**
 * Get admin credentials from config.js
 */
async function getAdminCredentials(): Promise<AdminCredentials | null> {
  try {
    // Access the global config object
    const config = (window as any).APP_CONFIG
    
    if (!config?.admin?.ADMIN_ETHEREUM_PRIVATE || !config?.admin?.ADMIN_ETHEREUM_PUBLIC) {
      log.warn('Admin credentials not found in config')
      return null
    }
    
    return {
      privateKey: config.admin.ADMIN_ETHEREUM_PRIVATE,
      publicAddress: config.admin.ADMIN_ETHEREUM_PUBLIC
    }
  } catch (error) {
    log.warn('Failed to load admin credentials:', error)
    return null
  }
}

/**
 * Generate SIWE signature for admin authentication
 */
async function generateAdminSIWE(credentials: AdminCredentials): Promise<{
  message: string
  signature: string
  nonce: string
  address: string
}> {
  // Create account from private key
  const account = privateKeyToAccount(`0x${credentials.privateKey}` as `0x${string}`)
  
  // Get nonce from server
  const nonceResponse = await fetch('/api/auth/nonce')
  const nonceData = await nonceResponse.json()
  const nonce = nonceData.data.nonce
  
  // Create SIWE message
  const domain = window.location.host
  const uri = window.location.origin
  const statement = 'Admin user bootstrap for system initialization'
  const version = '1'
  const chainId = 1
  const issuedAt = new Date().toISOString()

  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    credentials.publicAddress,
    '',
    statement,
    '',
    `URI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')

  // Sign the message
  const signature = await account.signMessage({ message })

  return {
    message,
    signature,
    nonce,
    address: credentials.publicAddress
  }
}

/**
 * Load seed data entities from root.info.js
 */
async function loadSeedData() {
  try {
    // Use dynamic import to bypass Vite's preloading and optimization
    const seedDataModule = await import('/seed-data/root.info.js?' + Date.now())
    return seedDataModule.default
  } catch (error) {
    log.warn('No seed data found or failed to load root.info.js:', error)
    return null
  }
}

/**
 * Check if root entity exists
 */
async function hasRootEntity(): Promise<boolean> {
  try {
    const response = await fetch('/api/entities/slug/')
    return response.ok
  } catch (error) {
    log.error('Failed to check for root entity:', error)
    return false
  }
}

/**
 * Create seed entities from root.info.js
 */
async function createSeedEntities(credentials: AdminCredentials): Promise<void> {
  const seedData = await loadSeedData()
  if (!seedData) {
    log.info('📄 No seed data to create')
    return
  }

  log.info('🌱 Creating seed entities...')

  // Generate SIWE authentication for seed entity creation
  const authData = await generateAdminSIWE(credentials)
  
  // Store auth state temporarily
  const authState = {
    type: 'siwe',
    address: authData.address,
    message: authData.message,
    signature: authData.signature,
    nonce: authData.nonce
  }
  
  localStorage.setItem('auth_state', JSON.stringify(authState))

  try {
    // Ensure seedData has required structure
    const seedEntity = {
      id: seedData.id || uuidv7(),
      meta: {
        ...seedData.meta,
        creatorAddress: authData.address.toLowerCase()
      },
      ...seedData
    }

    const result = await postJSON('/api/entities', {
      entity: seedEntity,
      validate: false,
      slugConflict: 'replace'
    })

    log.info('✅ Seed entity created successfully:', result)
  } catch (error) {
    log.error('❌ Failed to create seed entity:', error)
  } finally {
    // Clean up auth state
    localStorage.removeItem('auth_state')
  }
}

/**
 * Bootstrap admin user and system entities
 * Creates essential foundation entities for system operation
 */
export async function bootstrapAdmin(): Promise<void> {
  try {
    log.info('� Starting system bootstrap...')
    
    // Get admin credentials
    const credentials = await getAdminCredentials()
    if (!credentials) {
      log.info('⚠️ Admin credentials not available, skipping bootstrap')
      return
    }
    
    log.info('📋 Admin credentials loaded')
    
    // Check if admin already exists
    const adminExists = await fetch('/api/entities/slug/admin').then(r => r.ok).catch(() => false)
    
    if (!adminExists) {
      log.info('� Creating admin user...')
      
      // Generate SIWE authentication
      const authData = await generateAdminSIWE(credentials)
      
      // Store auth state temporarily
      const authState = {
        type: 'siwe',
        address: authData.address,
        message: authData.message,
        signature: authData.signature,
        nonce: authData.nonce
      }
      
      localStorage.setItem('auth_state', JSON.stringify(authState))
      
      try {
        // Create admin party
        const adminParty = {
          type: 'party',
          id: uuidv7(),
          meta: {
            label: 'Administrator',
            slug: '/admin',
            content: 'System administrator account',
            creatorAddress: authData.address.toLowerCase(),
            permissions: 'protected'
          },
          party: {
            auth: authData.address.toLowerCase(),
            sponsorId: authData.address.toLowerCase(),
            address: authData.address.toLowerCase(),
            contract: null,
            isAdmin: true,
            createdBy: 'system'
          }
        }
        
        const result = await postJSON('/api/entities', {
          entity: adminParty,
          validate: false,
          slugConflict: 'replace'
        })
        
        log.info('✅ Admin user created successfully:', result)
      } finally {
        localStorage.removeItem('auth_state')
      }
    } else {
      log.info('✅ Admin user already exists')
    }
    
    // Check if root entity exists and create from seed data if needed
    const rootExists = await hasRootEntity()
    if (!rootExists) {
      log.info('🌱 Root entity missing, creating from seed data...')
      await createSeedEntities(credentials)
    } else {
      log.info('✅ Root entity already exists')
    }
    
    log.info('🎉 System bootstrap completed')
    
  } catch (error) {
    log.error('❌ System bootstrap failed:', error)
    // Clear any auth state if bootstrap failed
    localStorage.removeItem('auth_state')
  }
}