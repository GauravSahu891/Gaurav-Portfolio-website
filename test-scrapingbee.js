const axios = require('axios');

// Your ScrapingBee API key
const API_KEY = '5OFUL01L8B79CW56BPQRQOA3RVQWYIPSHAZ032QUS1AJIQKD3Q8MQWXW0590PU98B5EOEU9X9NNAO4Y';

async function testScrapingBee() {
    console.log('🧪 Testing ScrapingBee API directly...\n');
    
    try {
        console.log('1️⃣ Testing basic connection...');
        const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
            params: {
                'api_key': API_KEY,
                'url': 'https://httpbin.org/ip',
                'render_js': 'false'
            },
            timeout: 15000
        });
        
        console.log('✅ Basic connection successful!');
        console.log('📊 Response:', response.data);
        console.log('');
        
        // Test 2: Test with a simple website
        console.log('2️⃣ Testing with a simple website...');
        const response2 = await axios.get('https://app.scrapingbee.com/api/v1/', {
            params: {
                'api_key': API_KEY,
                'url': 'https://example.com',
                'render_js': 'false'
            },
            timeout: 15000
        });
        
        console.log('✅ Website scraping successful!');
        console.log('📊 Response length:', response2.data.length);
        console.log('');
        
        // Test 3: Test GFG profile (this is what we actually need)
        console.log('3️⃣ Testing GFG profile scraping...');
        const response3 = await axios.get('https://app.scrapingbee.com/api/v1/', {
            params: {
                'api_key': API_KEY,
                'url': 'https://www.geeksforgeeks.org/user/gauravs992l/',
                'render_js': 'true',
                'wait': '5000'
            },
            timeout: 30000
        });
        
        console.log('✅ GFG profile scraping successful!');
        console.log('📊 Response length:', response3.data.length);
        
        // Check if we got meaningful data
        if (response3.data.includes('Problem Solved') || response3.data.includes('Coding Score')) {
            console.log('🎯 Found GFG data in response!');
        } else {
            console.log('⚠️ GFG data not found in response');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.response) {
            console.log('📋 Status:', error.response.status);
            console.log('📋 Data:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('\n🚨 401 Unauthorized - API Key Issue');
                console.log('💡 Possible solutions:');
                console.log('   1. Check if API key is correct');
                console.log('   2. Verify API key hasn\'t expired');
                console.log('   3. Check ScrapingBee account status');
                console.log('   4. Try regenerating API key');
            } else if (error.response.status === 429) {
                console.log('\n⚠️ 429 Rate Limited');
                console.log('💡 You\'ve exceeded the free tier limit');
            }
        } else if (error.code === 'ECONNABORTED') {
            console.log('⏰ Request timeout - try again');
        } else {
            console.log('🌐 Network or other error');
        }
    }
}

// Run the test
testScrapingBee();


