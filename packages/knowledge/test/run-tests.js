#!/usr/bin/env node

import { testSchemaLoading } from './schema-tests.js'
import { testValidation } from './validation-tests.js'
import { runSpatialTemporalTests } from './spatial-temporal-tests.js'

console.log('🚀 Running Knowledge Package Tests\n')

async function runAllTests() {
  let allPassed = true
  
  // Run schema loading tests
  console.log('=' .repeat(50))
  const schemasPassed = await testSchemaLoading()
  allPassed = allPassed && schemasPassed
  
  // Run validation tests
  console.log('\n' + '='.repeat(50))
  const validationPassed = await testValidation()
  allPassed = allPassed && validationPassed
  
  // Run spatial and temporal tests
  console.log('\n' + '='.repeat(50))
  const spatialTemporalPassed = await runSpatialTemporalTests()
  allPassed = allPassed && spatialTemporalPassed
  
  // Summary
  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('❌ Some tests failed!')
  }
  
  return allPassed
}

runAllTests().then(success => {
  process.exit(success ? 0 : 1)
})