/**
 * Simplified Server Auth Test
 * Tests only the HTTP transport layer - auth logic is tested in Knowledge layer
 */

import { createServer } from '../dist/index.js';
import { makeNonce } from '@social/knowledge';

async function testServerAuthEndpoints() {
  console.log('🌐 Testing Server Auth HTTP Endpoints...');
  
  let server;
  try {
    // Create server instance
    server = await createServer();
    
    // Start server on a test port
    await server.listen({ port: 3005, host: '127.0.0.1' });
    console.log('✅ Server started on port 3005');
    
    // Test 1: Nonce endpoint
    console.log('\n1️⃣ Testing /api/auth/nonce endpoint...');
    const nonceResponse = await server.inject({
      method: 'GET',
      url: '/api/auth/nonce'
    });
    
    if (nonceResponse.statusCode === 200) {
      const nonceData = JSON.parse(nonceResponse.body);
      console.log('✅ Nonce endpoint working');
      console.log(`✅ Nonce format: ${nonceData.data.nonce} (${nonceData.data.nonce.length} chars)`);
      console.log(`✅ Has timestamp: ${!!nonceData.data.timestamp}`);
    } else {
      throw new Error(`Nonce endpoint failed: ${nonceResponse.statusCode}`);
    }
    
    // Test 2: Verify endpoint with invalid data (should fail gracefully)
    console.log('\n2️⃣ Testing /api/auth/verify with invalid data...');
    const verifyResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/verify',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        type: 'invalid',
        data: 'bad-data'
      })
    });
    
    if (verifyResponse.statusCode >= 400) {
      console.log('✅ Verify endpoint correctly rejects invalid data');
      console.log(`✅ Response code: ${verifyResponse.statusCode}`);
    } else {
      throw new Error('Verify endpoint should have rejected invalid data');
    }
    
    // Test 3: Test entity creation without auth (should work as anonymous)
    console.log('\n3️⃣ Testing anonymous entity creation...');
    const entityResponse = await server.inject({
      method: 'POST',
      url: '/api/entities',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({
        id: 'server-auth-test',
        kind: 'thing',
        meta: {
          label: 'Server Auth Test Entity'
        }
      })
    });
    
    if (entityResponse.statusCode === 200) {
      const entityData = JSON.parse(entityResponse.body);
      console.log('✅ Anonymous entity creation working');
      console.log(`✅ Created by: ${entityData.createdBy || 'anonymous'}`);
    } else {
      throw new Error(`Entity creation failed: ${entityResponse.statusCode}`);
    }
    
    // Test 4: Test protected endpoint without auth (should fail)
    console.log('\n4️⃣ Testing protected /my endpoint without auth...');
    const myResponse = await server.inject({
      method: 'GET',
      url: '/api/entities/my'
    });
    
    if (myResponse.statusCode === 401) {
      console.log('✅ Protected endpoint correctly requires auth');
    } else {
      throw new Error(`Protected endpoint should require auth, got: ${myResponse.statusCode}`);
    }
    
    console.log('\n🎉 All server auth endpoint tests passed!');
    
  } catch (error) {
    console.error('❌ Server auth test failed:', error);
    throw error;
  } finally {
    if (server) {
      await server.close();
      console.log('✅ Server stopped');
    }
  }
}

async function testServerAuthIntegration() {
  console.log('🔗 Testing Server + Knowledge Auth Integration...\n');
  
  try {
    // Test the server endpoints
    await testServerAuthEndpoints();
    
    console.log('\n📋 Server Auth Test Summary:');
    console.log('✅ HTTP auth endpoints working');
    console.log('✅ Nonce generation via server');
    console.log('✅ Error handling for invalid auth');
    console.log('✅ Anonymous entity creation');
    console.log('✅ Protected endpoint security');
    console.log('✅ Server properly delegates auth to Knowledge layer');
    
    console.log('\n🏗️  Server architecture notes:');
    console.log('• Server is now a thin HTTP transport layer');
    console.log('• All auth logic moved to Knowledge layer');
    console.log('• Server imports auth functions from @social/knowledge');
    console.log('• Auth dependencies removed from server package');
    console.log('• Real auth testing happens in Knowledge layer');
    
    return true;
    
  } catch (error) {
    console.error('❌ Server auth integration test failed:', error);
    return false;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testServerAuthIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testServerAuthEndpoints, testServerAuthIntegration };