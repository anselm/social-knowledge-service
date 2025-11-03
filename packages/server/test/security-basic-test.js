/**
 * Basic Security Test for Integration Tests
 * Tests core security principles with simplified entity creation
 */

import { createServer } from '../dist/index.js';

let testResults = [];

function logTest(name, success, message = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  const details = message ? ` - ${message}` : '';
  console.log(`${status}: ${name}${details}`);
  testResults.push({ name, success, message });
}

async function runBasicSecurityTests() {
  console.log('🔒 Testing Core Security Principles...');
  console.log('=' .repeat(50));
  
  let server;
  try {
    // Create and start server
    server = await createServer();
    await server.listen({ port: 3004, host: '127.0.0.1' });
    console.log('✅ Test server started on port 3004\n');
    
    // Test 1: Anonymous users can read entities
    console.log('📖 Test 1: Anonymous read access');
    const readResponse = await server.inject({
      method: 'GET',
      url: '/api/entities'
    });
    
    const readSuccess = readResponse.statusCode === 200;
    logTest('Anonymous users can read entities', readSuccess, 
           `Status: ${readResponse.statusCode}`);
    
    // Test 2: Unauthenticated writes require authentication  
    console.log('\n🔐 Test 2: Unauthenticated write protection');
    const updateResponse = await server.inject({
      method: 'PUT',
      url: '/api/entities/dummy-id',
      payload: { meta: { label: 'Should fail' } }
    });
    
    const updateBlocked = updateResponse.statusCode === 401;
    logTest('Unauthenticated updates are blocked (401)', updateBlocked,
           `Status: ${updateResponse.statusCode}`);
    
    // Test 3: Unauthenticated deletes require authentication
    console.log('\n🗑️  Test 3: Unauthenticated delete protection');
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: '/api/entities/dummy-id'
    });
    
    const deleteBlocked = deleteResponse.statusCode === 401;
    logTest('Unauthenticated deletes are blocked (401)', deleteBlocked,
           `Status: ${deleteResponse.statusCode}`);
    
    // Test 4: Check that /my endpoint requires authentication
    console.log('\n👤 Test 4: Personal entity access protection');
    const myEntitiesResponse = await server.inject({
      method: 'GET',
      url: '/api/entities/my'
    });
    
    const myBlocked = myEntitiesResponse.statusCode === 401;
    logTest('Personal entities require authentication (401)', myBlocked,
           `Status: ${myEntitiesResponse.statusCode}`);
    
    // Test 5: GraphQL endpoint is accessible
    console.log('\n🎮 Test 5: GraphQL access');
    const graphqlResponse = await server.inject({
      method: 'POST',
      url: '/api/graphql',
      payload: { query: '{ __typename }' }
    });
    
    const graphqlWorking = graphqlResponse.statusCode === 200;
    logTest('GraphQL endpoint is accessible', graphqlWorking,
           `Status: ${graphqlResponse.statusCode}`);
    
    // Test 6: API structure validation - verify entity structure
    console.log('\n📋 Test 6: API entity structure validation');
    const entitiesResponse = await server.inject({
      method: 'GET',
      url: '/api/entities?limit=1'
    });
    
    let structureValid = false;
    if (entitiesResponse.statusCode === 200) {
      const data = JSON.parse(entitiesResponse.body);
      structureValid = data.success && Array.isArray(data.data);
    }
    logTest('Entity API returns proper structure', structureValid,
           `Has success field and data array: ${structureValid}`);
    
  } catch (error) {
    console.error('💥 Test suite error:', error);
    return false;
  } finally {
    if (server) {
      await server.close();
      console.log('\n🔌 Test server stopped');
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Basic Security Test Results');
  console.log('='.repeat(50));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  testResults.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}${result.message ? ` - ${result.message}` : ''}`);
  });
  
  console.log('='.repeat(50));
  console.log(`🎯 BASIC SECURITY SCORE: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 CORE SECURITY PRINCIPLES VERIFIED!');
    console.log('✓ Read access works for anonymous users');
    console.log('✓ Write operations require authentication');
    console.log('✓ Personal data requires authentication');
    console.log('✓ API structure is consistent');
    return true;
  } else {
    console.log(`⚠️  ${failedTests} test(s) failed.`);
    return false;
  }
}

// Run the basic security test suite
runBasicSecurityTests().then(success => {
  console.log('\n💡 Note: Full authentication testing requires proper auth keys.');
  console.log('   This test verifies core security structure is in place.');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Basic security test crashed:', error);
  process.exit(1);
});