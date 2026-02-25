import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

async function testNetworkConnectivity() {
    console.log('🌐 Testing Network Connectivity...\n');
    
    // Test 1: Basic DNS resolution
    console.log('1️⃣ Testing DNS Resolution...');
    try {
        const addresses = await resolve4('app.scrapingbee.com');
        console.log('✅ DNS Resolution successful');
        console.log('📊 IP Addresses:', addresses);
    } catch (error) {
        console.log('❌ DNS Resolution failed:', error.message);
    }
    console.log('');
    
    // Test 2: Test basic internet connectivity
    console.log('2️⃣ Testing Basic Internet...');
    try {
        const response = await axios.get(process.env.HTTPBIN_URL || 'https://httpbin.org/ip', { timeout: 10000 });
        console.log('✅ Basic internet working');
        console.log('📊 Your IP:', response.data.origin);
    } catch (error) {
        console.log('❌ Basic internet failed:', error.message);
    }
    console.log('');
    
    // Test 3: Test if we can reach ScrapingBee domain
    console.log('3️⃣ Testing ScrapingBee Domain...');
    try {
        const response = await axios.get('https://app.scrapingbee.com', { 
            timeout: 10000,
            validateStatus: () => true // Accept any status code
        });
        console.log('✅ Can reach ScrapingBee domain');
        console.log('📊 Status Code:', response.status);
        console.log('📊 Response Length:', response.data?.length || 'N/A');
    } catch (error) {
        console.log('❌ Cannot reach ScrapingBee domain:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('🚨 DNS Resolution Failed - Domain not found');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('🚨 Connection Refused - Firewall/Blocking');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('🚨 Connection Timeout - Network issue');
        }
    }
    console.log('');
    
    // Test 4: Test with different timeout
    console.log('4️⃣ Testing with Longer Timeout...');
    try {
        const response = await axios.get('https://app.scrapingbee.com', { 
            timeout: 30000, // 30 seconds
            validateStatus: () => true
        });
        console.log('✅ ScrapingBee domain reachable with longer timeout');
        console.log('📊 Status:', response.status);
    } catch (error) {
        console.log('❌ Still cannot reach with longer timeout:', error.message);
    }
    console.log('');
    
    // Test 5: Test alternative domains
    console.log('5️⃣ Testing Alternative Domains...');
    const testDomains = [
        'https://api.scrapingbee.com',
        'https://scrapingbee.com',
        'https://www.scrapingbee.com'
    ];
    
    for (const domain of testDomains) {
        try {
            const response = await axios.get(domain, { 
                timeout: 10000,
                validateStatus: () => true
            });
            console.log(`✅ ${domain} - Status: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${domain} - ${error.message}`);
        }
    }
    console.log('');
    
    // Test 6: Test if it's a specific API endpoint issue
    console.log('6️⃣ Testing API Endpoint...');
    try {
        const response = await axios.get(process.env.SCRAPINGBEE_BASE_URL || 'https://app.scrapingbee.com/api/v1/', { 
            timeout: 15000,
            validateStatus: () => true
        });
        console.log('✅ API endpoint reachable');
        console.log('📊 Status:', response.status);
    } catch (error) {
        console.log('❌ API endpoint not reachable:', error.message);
    }
}

// Test with your API key
async function testWithAPIKey() {
    console.log('\n🔑 Testing with Your API Key...\n');

    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    const baseUrl = process.env.SCRAPINGBEE_BASE_URL || 'https://app.scrapingbee.com/api/v1/';

    if (!apiKey) {
        console.log('❌ SCRAPINGBEE_API_KEY is not set in .env');
        return;
    }
    try {
        const response = await axios.get(baseUrl, {
            params: {
                'api_key': apiKey,
                'url': 'https://httpbin.org/ip',
                'render_js': 'false'
            },
            timeout: 20000
        });
        
        console.log('✅ API call successful!');
        console.log('📊 Response:', response.data);
        
    } catch (error) {
        console.log('❌ API call failed:', error.message);
        
        if (error.response) {
            console.log('📋 Status:', error.response.status);
            console.log('📋 Data:', error.response.data);
        }
    }
}

// Run all tests
async function runAllTests() {
    await testNetworkConnectivity();
    await testWithAPIKey();
    
    console.log('\n📋 Summary:');
    console.log('If DNS resolution failed, try:');
    console.log('1. Use mobile hotspot (different network)');
    console.log('2. Try VPN connection');
    console.log('3. Check corporate firewall settings');
    console.log('4. Try different DNS servers (8.8.8.8, 1.1.1.1)');
}

runAllTests();


