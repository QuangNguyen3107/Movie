// scripts/testPerformance.js - Test Backend Performance
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const NUM_REQUESTS = parseInt(process.env.NUM_REQUESTS) || 100;
const CONCURRENT = parseInt(process.env.CONCURRENT) || 10;

// Test endpoints
const endpoints = [
    { method: 'GET', url: '/api/health-check', name: 'Health Check' },
    { method: 'GET', url: '/api/movies?page=1&limit=20', name: 'Movies List' },
    { method: 'GET', url: '/api/search?q=test&limit=10', name: 'Search' },
];

// Performance metrics
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalTime = 0;
let minTime = Infinity;
let maxTime = 0;

async function makeRequest(endpoint) {
    const start = Date.now();
    
    try {
        const response = await axios({
            method: endpoint.method,
            url: BASE_URL + endpoint.url,
            timeout: 30000
        });
        
        const duration = Date.now() - start;
        
        totalRequests++;
        successfulRequests++;
        totalTime += duration;
        minTime = Math.min(minTime, duration);
        maxTime = Math.max(maxTime, duration);
        
        return { success: true, duration, status: response.status };
        
    } catch (error) {
        const duration = Date.now() - start;
        totalRequests++;
        failedRequests++;
        
        return { 
            success: false, 
            duration, 
            error: error.message,
            status: error.response?.status || 'timeout'
        };
    }
}

async function runBatch(endpoint, batchSize) {
    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
        promises.push(makeRequest(endpoint));
    }
    
    return Promise.all(promises);
}

async function testEndpoint(endpoint) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`📍 ${endpoint.method} ${endpoint.url}`);
    console.log(`📊 ${NUM_REQUESTS} requests in batches of ${CONCURRENT}...\n`);
    
    // Reset metrics
    totalRequests = 0;
    successfulRequests = 0;
    failedRequests = 0;
    totalTime = 0;
    minTime = Infinity;
    maxTime = 0;
    
    const startTime = Date.now();
    const batches = Math.ceil(NUM_REQUESTS / CONCURRENT);
    
    for (let i = 0; i < batches; i++) {
        const batchSize = Math.min(CONCURRENT, NUM_REQUESTS - (i * CONCURRENT));
        await runBatch(endpoint, batchSize);
        
        // Progress
        const progress = Math.min(((i + 1) * CONCURRENT / NUM_REQUESTS) * 100, 100);
        process.stdout.write(`\r⏳ Progress: ${progress.toFixed(0)}%`);
    }
    
    const totalDuration = Date.now() - startTime;
    
    console.log('\n');
    console.log('📈 Results:');
    console.log('─'.repeat(50));
    console.log(`✅ Successful: ${successfulRequests}/${totalRequests}`);
    console.log(`❌ Failed: ${failedRequests}/${totalRequests}`);
    console.log(`⏱️  Total Time: ${totalDuration}ms`);
    console.log(`⚡ Avg Response: ${(totalTime / totalRequests).toFixed(2)}ms`);
    console.log(`🚀 Min Response: ${minTime}ms`);
    console.log(`🐌 Max Response: ${maxTime}ms`);
    console.log(`📊 Requests/sec: ${(totalRequests / (totalDuration / 1000)).toFixed(2)}`);
    console.log(`🎯 Success Rate: ${((successfulRequests / totalRequests) * 100).toFixed(2)}%`);
    console.log('─'.repeat(50));
}

async function checkServerHealth() {
    try {
        console.log('🔍 Checking server health...');
        const response = await axios.get(BASE_URL + '/api/health-check');
        console.log('✅ Server is running:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Server is not responding:', error.message);
        console.log('\n💡 Make sure the server is running:');
        console.log('   cd backend && npm run dev\n');
        return false;
    }
}

async function main() {
    console.log('\n🚀 Backend Performance Test Tool');
    console.log('═'.repeat(50));
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`🔢 Total Requests: ${NUM_REQUESTS}`);
    console.log(`🔄 Concurrent: ${CONCURRENT}`);
    console.log('═'.repeat(50));
    
    // Check if server is running
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
        process.exit(1);
    }
    
    // Test each endpoint
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ All tests completed!\n');
}

// Run tests
main().catch(error => {
    console.error('❌ Error running tests:', error);
    process.exit(1);
});
