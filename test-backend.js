const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCRAPINGBEE_API_KEY = '5OFUL01L8B79CW56BPQRQOA3RVQWYIPSHAZ032QUS1AJIQKD3Q8MQWXW0590PU98B5EOEU9X9NNAO4Y';

async function testBackend() {
    console.log('🧪 Testing DSA Backend Service...\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', healthResponse.data);
        console.log('');

        // Test 2: ScrapingBee Status
        console.log('2️⃣ Testing ScrapingBee Connection...');
        const scrapingBeeResponse = await axios.get(`${BASE_URL}/api/scrapingbee-status`);
        console.log('✅ ScrapingBee Status:', scrapingBeeResponse.data);
        console.log('');

        // Test 3: GFG Stats
        console.log('3️⃣ Testing GFG Stats API...');
        const gfgResponse = await axios.get(`${BASE_URL}/api/gfg-stats`);
        console.log('✅ GFG Stats:', JSON.stringify(gfgResponse.data, null, 2));
        console.log('');

        // Test 4: Combined DSA Data
        console.log('4️⃣ Testing Combined DSA API...');
        const combinedResponse = await axios.get(`${BASE_URL}/api/dsa-combined`);
        console.log('✅ Combined Data:', JSON.stringify(combinedResponse.data, null, 2));
        console.log('');

        // Test 5: Force Refresh
        console.log('5️⃣ Testing Force Refresh...');
        const refreshResponse = await axios.post(`${BASE_URL}/api/refresh-gfg`);
        console.log('✅ Force Refresh:', refreshResponse.data);
        console.log('');

        console.log('🎉 All tests passed! Your backend is working perfectly!');
        console.log('');
        console.log('📊 Your DSA section will now update automatically with real GFG data!');
        console.log('🔄 Data updates every 6 hours automatically');
        console.log('🚀 You can also manually refresh using the button on your portfolio');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('💡 Make sure your backend is running:');
            console.log('   npm install');
            console.log('   npm start');
        }
        
        if (error.response) {
            console.log('');
            console.log('📋 Response status:', error.response.status);
            console.log('📋 Response data:', error.response.data);
        }
    }
}

// Test ScrapingBee API directly
async function testScrapingBeeDirectly() {
    console.log('🧪 Testing ScrapingBee API directly...\n');

    try {
        const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
            params: {
                'api_key': SCRAPINGBEE_API_KEY,
                'url': 'https://httpbin.org/ip',
                'render_js': 'false'
            },
            timeout: 10000
        });

        console.log('✅ ScrapingBee API is working!');
        console.log('📊 Response:', response.data);
        
    } catch (error) {
        console.error('❌ ScrapingBee API test failed:', error.message);
        
        if (error.response?.status === 429) {
            console.log('⚠️ API rate limit reached');
        } else if (error.response?.status === 401) {
            console.log('⚠️ Invalid API key');
        }
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting DSA Backend Tests...\n');
    
    await testScrapingBeeDirectly();
    console.log('');
    await testBackend();
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = { testBackend, testScrapingBeeDirectly };
