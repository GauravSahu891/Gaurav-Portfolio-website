import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SCRAPINGBEE_API_KEY;
const BASE_URL = process.env.SCRAPINGBEE_BASE_URL || 'https://app.scrapingbee.com/api/v1/';
const HTTPBIN_URL = process.env.HTTPBIN_URL || 'https://httpbin.org/ip';
const GFG_PROFILE_URL = process.env.GFG_PROFILE_URL || 'https://www.geeksforgeeks.org/user/gauravs992l/';

async function testScrapingBee() {
    console.log('🧪 Testing ScrapingBee API directly...\n');

    if (!API_KEY) {
        console.error('❌ SCRAPINGBEE_API_KEY is not set in .env');
        return;
    }
    
    try {
        console.log('1️⃣ Testing basic connection...');
        const response = await axios.get(BASE_URL, {
            params: {
                'api_key': API_KEY,
                'url': HTTPBIN_URL,
                'render_js': 'false'
            },
            timeout: 15000
        });
        
        console.log('✅ Basic connection successful!');
        console.log('📊 Response:', response.data);
        console.log('');
        
        // Test 2: Test with a simple website
        console.log('2️⃣ Testing with a simple website...');
        const response2 = await axios.get(BASE_URL, {
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
        const response3 = await axios.get(BASE_URL, {
            params: {
                'api_key': API_KEY,
                'url': GFG_PROFILE_URL,
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


