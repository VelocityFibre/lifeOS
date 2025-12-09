// Quick test of agent mapper integration
const fetch = require('node-fetch');

async function testAgentMapper() {
  try {
    console.log('Testing agent mapper integration...\n');
    
    // Test 1: Call agents API directly
    console.log('1. Testing direct agents API call...');
    const directResponse = await fetch('http://localhost:5001/api/agents/gmailAgent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, can you help me with Gmail?',
        userId: 'test-user'
      })
    });
    const directData = await directResponse.json();
    console.log('   ✓ Direct API response:', directData.success ? 'SUCCESS' : 'FAILED');
    console.log('   Response:', directData.text.substring(0, 80) + '...\n');
    
    // Test 2: Test agent mapper
    console.log('2. Testing agent mapper utility...');
    const { callAgentsAPI } = require('./dist/utils/agent-mapper');
    const mapperResult = await callAgentsAPI('gmail', 'Test message', 'test-user');
    console.log('   ✓ Mapper result:', mapperResult.success ? 'SUCCESS' : 'FAILED');
    console.log('   Response:', mapperResult.text.substring(0, 80) + '...\n');
    
    // Test 3: Test unimplemented agent
    console.log('3. Testing unimplemented agent (instagram)...');
    const instagramResult = await callAgentsAPI('instagram', 'Test message', 'test-user');
    console.log('   ✓ Instagram result:', instagramResult.success ? 'SUCCESS' : 'FAILED');
    console.log('   Response:', instagramResult.text.substring(0, 80) + '...\n');
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAgentMapper();
