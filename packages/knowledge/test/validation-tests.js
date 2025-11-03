#!/usr/bin/env node

import { schemaManager } from '../src/schema-manager.js'

console.log('🧪 Testing JSON Schema Validation...')

async function testValidation() {
  try {
    // Initialize schema manager
    await schemaManager.initialize()
    
    // Test valid thing entity
    console.log('\n📦 Testing valid thing entity...')
    const validThing = {
      id: 'test-gadget',
      meta: {
        label: 'Test Gadget',
        content: 'A cool test device'
      },
      thing: {
        category: 'electronics'
      }
    }
    
    const result1 = schemaManager.validate('ka://schemas/core/thing/1.0.0', validThing)
    if (result1.valid) {
      console.log('✅ Valid thing entity passed validation')
    } else {
      throw new Error(`❌ Valid thing failed: ${result1.errors?.map(e => e.message).join(', ')}`)
    }
    
    // Test invalid thing entity (missing required label)
    console.log('\n📦 Testing invalid thing entity...')
    const invalidThing = {
      id: 'test-gadget-2',
      meta: {
        // Missing required 'label' field
        content: 'A device without label'
      },
      thing: {
        category: 'electronics'
      }
    }
    
    const result2 = schemaManager.validate('ka://schemas/core/thing/1.0.0', invalidThing)
    if (!result2.valid) {
      console.log('✅ Invalid thing entity correctly failed validation')
      console.log('   Error:', result2.errors?.[0]?.message)
    } else {
      throw new Error('❌ Invalid thing should have failed validation')
    }
    
    // Test valid party entity
    console.log('\n👤 Testing valid party entity...')
    const validParty = {
      id: 'john-doe',
      meta: {
        label: 'John Doe'
      },
      party: {
        firstName: 'John',
        lastName: 'Doe'
      }
    }
    
    const result3 = schemaManager.validate('ka://schemas/core/party/1.0.0', validParty)
    if (result3.valid) {
      console.log('✅ Valid party entity passed validation')
    } else {
      throw new Error(`❌ Valid party failed: ${result3.errors?.map(e => e.message).join(', ')}`)
    }
    
    // Test valid group entity
    console.log('\n👥 Testing valid group entity...')
    const validGroup = {
      id: 'my-community',
      meta: {
        label: 'My Community',
        content: 'A great community for developers'
      },
      group: {
        type: 'community',
        memberCount: 42
      }
    }
    
    const result4 = schemaManager.validate('ka://schemas/core/group/1.0.0', validGroup)
    if (result4.valid) {
      console.log('✅ Valid group entity passed validation')
    } else {
      throw new Error(`❌ Valid group failed: ${result4.errors?.map(e => e.message).join(', ')}`)
    }
    
    // Test edge entity
    console.log('\n🔗 Testing valid edge entity...')
    const validEdge = {
      id: 'relationship-1',
      subject: 'john-doe',
      predicate: 'memberOf',
      object: 'my-community'
    }
    
    const result5 = schemaManager.validate('ka://schemas/core/edge/1.0.0', validEdge)
    if (result5.valid) {
      console.log('✅ Valid edge entity passed validation')
    } else {
      throw new Error(`❌ Valid edge failed: ${result5.errors?.map(e => e.message).join(', ')}`)
    }
    
    console.log('\n🎉 All validation tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Validation test failed:', error.message)
    return false
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testValidation().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { testValidation }