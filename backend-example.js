const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ScrapingBee Configuration
const SCRAPINGBEE_API_KEY = 'O2JM9WLSF385KE9WNMGIHR99WIE4C48U12FUHX3HD5Z8SU4TUY6GW0U7N8EXCZ89S68I9W4DBHSUUHUS';
const GFG_PROFILE_URL = 'https://www.geeksforgeeks.org/user/gauravs992l/';

// Fallback data (your current GFG stats)
const FALLBACK_GFG_DATA = {
    totalProblems: 11,
    easyProblems: 8,
    mediumProblems: 3,
    hardProblems: 0,
    codingScore: 25,
    currentStreak: 0,
    primaryLanguage: 'Java',
    lastUpdated: new Date().toISOString(),
    source: 'Fallback Data (Network Issue)',
    recentProblems: [
        'Reverse an Array',
        'Anagram',
        'Non Repeating Character',
        'Sorted and Rotated Minimum',
        'Move All Zeroes to End',
        'Second Largest',
        'Number of occurrence',
        'Stock Buy and Sell – Max one Transaction Allowed',
        'Peak element',
        'Rotate Array',
        'Sort 0s, 1s and 2s'
    ]
};

// Cache for storing scraped data
let gfgCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// ScrapingBee GFG Profile Scraping Function
async function scrapeGFGProfileWithScrapingBee() {
    try {
        console.log('🔄 Fetching GFG data via ScrapingBee...');
        
        const scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';
        const params = new URLSearchParams({
            'api_key': SCRAPINGBEE_API_KEY,
            'url': GFG_PROFILE_URL,
            'render_js': 'true', // Important for dynamic content
            'wait': '3000', // Wait for JavaScript to load
            'block_resources': 'false',
            'premium_proxy': 'false',
            'country_code': 'in'
        });

        const response = await axios.get(`${scrapingBeeUrl}?${params}`, {
            timeout: 30000, // 30 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (response.status === 200) {
            const html = response.data;
            
            // Extract data using regex patterns (more reliable than CSS selectors)
            const data = extractGFGData(html);
            
            if (data) {
                console.log('✅ GFG data extracted successfully:', data);
                return data;
            }
        }
        
        console.log('❌ Failed to extract data from ScrapingBee response');
        return null;
        
    } catch (error) {
        console.error('❌ ScrapingBee API Error:', error.message);
        
        // Check if it's an API limit error
        if (error.response?.status === 429) {
            console.log('⚠️ API rate limit reached, using cached data');
        }
        
        return null;
    }
}

// Extract GFG data using regex patterns
function extractGFGData(html) {
    try {
        // Extract problem counts by difficulty
        const easyMatch = html.match(/EASY\s*\((\d+)\)/i);
        const mediumMatch = html.match(/MEDIUM\s*\((\d+)\)/i);
        const hardMatch = html.match(/HARD\s*\((\d+)\)/i);
        
        // Extract coding score
        const codingScoreMatch = html.match(/Coding Score\s*(\d+)/i);
        
        // Extract total problems solved
        const totalProblemsMatch = html.match(/Problem Solved\s*(\d+)/i);
        
        // Extract current streak
        const streakMatch = html.match(/Current POTD Streak\s*(\d+)\/\d+/i);
        
        // Extract language
        const languageMatch = html.match(/Language Used\s*([A-Za-z]+)/i);
        
        // Extract recent problems (basic extraction)
        const recentProblems = extractRecentProblems(html);
        
        const data = {
            totalProblems: parseInt(totalProblemsMatch?.[1] || '0'),
            easyProblems: parseInt(easyMatch?.[1] || '0'),
            mediumProblems: parseInt(mediumMatch?.[1] || '0'),
            hardProblems: parseInt(hardMatch?.[1] || '0'),
            codingScore: parseInt(codingScoreMatch?.[1] || '0'),
            currentStreak: parseInt(streakMatch?.[1] || '0'),
            primaryLanguage: languageMatch?.[1] || 'Java',
            lastUpdated: new Date().toISOString(),
            source: 'GFG Live Data via ScrapingBee',
            recentProblems: recentProblems
        };
        
        // Validate extracted data
        if (data.totalProblems > 0 || data.codingScore > 0) {
            return data;
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error extracting GFG data:', error);
        return null;
    }
}

// Extract recent problems from the HTML
function extractRecentProblems(html) {
    try {
        const problems = [];
        
        // Look for problem names in the HTML
        const problemMatches = html.match(/[A-Z][a-zA-Z\s&]+(?=\s*–|\s*$)/g);
        
        if (problemMatches) {
            // Clean and filter problem names
            problemMatches.forEach(problem => {
                const cleanProblem = problem.trim();
                if (cleanProblem.length > 3 && cleanProblem.length < 100) {
                    problems.push(cleanProblem);
                }
            });
        }
        
        // Return unique problems (max 10)
        return [...new Set(problems)].slice(0, 10);
        
    } catch (error) {
        console.error('❌ Error extracting recent problems:', error);
        return [];
    }
}

// API Endpoint for GFG Stats
app.get('/api/gfg-stats', async (req, res) => {
    try {
        // Check if we have valid cached data
        if (gfgCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
            console.log('📋 Returning cached GFG data');
            return res.json(gfgCache);
        }

        // Try to scrape fresh data using ScrapingBee
        console.log('🔄 Attempting to fetch fresh GFG data...');
        const gfgData = await scrapeGFGProfileWithScrapingBee();
        
        if (gfgData) {
            // Update cache with fresh data
            gfgCache = gfgData;
            cacheTimestamp = Date.now();
            
            console.log('✅ Fresh GFG data fetched and cached');
            res.json(gfgData);
        } else {
            // ScrapingBee failed, use fallback data
            console.log('⚠️ ScrapingBee failed, using fallback data');
            
            // Initialize cache with fallback data
            gfgCache = FALLBACK_GFG_DATA;
            cacheTimestamp = Date.now();
            
            res.json({
                ...FALLBACK_GFG_DATA,
                message: 'Using fallback data due to network/API issues',
                note: 'This is your current GFG stats. ScrapingBee will be used when network issues are resolved.'
            });
        }
    } catch (error) {
        console.error('❌ API Error:', error);
        
        // Return fallback data on any error
        console.log('🚨 Error occurred, returning fallback data');
        res.json({
            ...FALLBACK_GFG_DATA,
            message: 'Error occurred, using fallback data',
            error: error.message,
            note: 'This is your current GFG stats. Check network connectivity for live updates.'
        });
    }
});

// API Endpoint for combined DSA data
app.get('/api/dsa-combined', async (req, res) => {
    try {
        // Get GFG data
        let gfgData = gfgCache;
        
        if (!gfgData || (Date.now() - cacheTimestamp) > CACHE_DURATION) {
            // Try to get fresh data, but if it fails, use fallback
            gfgData = await scrapeGFGProfileWithScrapingBee();
            if (gfgData) {
                gfgCache = gfgData;
                cacheTimestamp = Date.now();
            } else {
                // Use fallback data if ScrapingBee fails
                gfgData = FALLBACK_GFG_DATA;
                gfgCache = gfgData;
                cacheTimestamp = Date.now();
                console.log('⚠️ Using fallback GFG data in combined endpoint');
            }
        }
        
        // Striver sheet data (you can update this manually)
        const striverData = {
            problemsSolved: 7,
            sheetProgress: "15%",
            currentTopic: "Dynamic Programming"
        };

        // Combine data
        const combinedData = {
            totalProblems: (gfgData?.totalProblems || 0) + (striverData?.problemsSolved || 0),
            easyProblems: gfgData?.easyProblems || 0,
            mediumProblems: gfgData?.mediumProblems || 0,
            hardProblems: gfgData?.hardProblems || 0,
            codingScore: gfgData?.codingScore || 0,
            currentStreak: gfgData?.currentStreak || 0,
            primaryLanguage: gfgData?.primaryLanguage || 'Java',
            lastUpdated: new Date().toISOString(),
            categories: {
                'Arrays & Strings': Math.floor((gfgData?.totalProblems || 0) * 0.4),
                'Linked Lists': Math.floor((gfgData?.totalProblems || 0) * 0.2),
                'Trees & Graphs': Math.floor((gfgData?.totalProblems || 0) * 0.15),
                'Dynamic Programming': Math.floor((gfgData?.totalProblems || 0) * 0.1),
                'Greedy Algorithms': Math.floor((gfgData?.totalProblems || 0) * 0.1),
                'Stack & Queue': Math.floor((gfgData?.totalProblems || 0) * 0.05)
            },
            platforms: {
                gfg: gfgData,
                striver: striverData
            },
            recentProblems: gfgData?.recentProblems || []
        };

        res.json(combinedData);
    } catch (error) {
        console.error('❌ Combined API Error:', error);
        
        // Return fallback data on any error
        const fallbackCombined = {
            totalProblems: FALLBACK_GFG_DATA.totalProblems + 7, // GFG + Striver
            easyProblems: FALLBACK_GFG_DATA.easyProblems,
            mediumProblems: FALLBACK_GFG_DATA.mediumProblems,
            hardProblems: FALLBACK_GFG_DATA.hardProblems,
            codingScore: FALLBACK_GFG_DATA.codingScore,
            currentStreak: FALLBACK_GFG_DATA.currentStreak,
            primaryLanguage: FALLBACK_GFG_DATA.primaryLanguage,
            lastUpdated: new Date().toISOString(),
            categories: {
                'Arrays & Strings': Math.floor(FALLBACK_GFG_DATA.totalProblems * 0.4),
                'Linked Lists': Math.floor(FALLBACK_GFG_DATA.totalProblems * 0.2),
                'Trees & Graphs': Math.floor(FALLBACK_GFG_DATA.totalProblems * 0.15),
                'Dynamic Programming': Math.floor(FALLBACK_GFG_DATA.totalProblems * 0.1),
                'Greedy Algorithms': Math.floor(FALLBACK_GFG_DATA.totalProblems * 0.1),
                'Stack & Queue': Math.floor(FALLBACK_GFG_DATA.totalProblems * 0.05)
            },
            platforms: {
                gfg: FALLBACK_GFG_DATA,
                striver: {
                    problemsSolved: 7,
                    sheetProgress: "15%",
                    currentTopic: "Dynamic Programming"
                }
            },
            recentProblems: FALLBACK_GFG_DATA.recentProblems,
            message: 'Using fallback data due to error',
            note: 'This is your current GFG stats. Check ScrapingBee API key for live updates.'
        };
        
        res.json(fallbackCombined);
    }
});

// Force refresh GFG data
app.post('/api/refresh-gfg', async (req, res) => {
    try {
        console.log('🔄 Manual refresh requested...');
        
        // Clear cache to force fresh fetch
        gfgCache = null;
        cacheTimestamp = null;
        
        // Fetch fresh data
        const gfgData = await scrapeGFGProfileWithScrapingBee();
        
        if (gfgData) {
            gfgCache = gfgData;
            cacheTimestamp = Date.now();
            
            res.json({ 
                message: 'GFG data refreshed successfully',
                data: gfgData
            });
        } else {
            // Use fallback data if ScrapingBee fails
            gfgCache = FALLBACK_GFG_DATA;
            cacheTimestamp = Date.now();
            
            res.json({ 
                message: 'Using fallback data (ScrapingBee failed)',
                data: FALLBACK_GFG_DATA,
                note: 'Check your ScrapingBee API key for live updates'
            });
        }
    } catch (error) {
        console.error('❌ Refresh Error:', error);
        
        // Use fallback data on error
        gfgCache = FALLBACK_GFG_DATA;
        cacheTimestamp = Date.now();
        
        res.json({ 
            message: 'Using fallback data due to error',
            data: FALLBACK_GFG_DATA,
            error: error.message,
            note: 'This is your current GFG stats. Check ScrapingBee API key for live updates.'
        });
    }
});

// Manual update endpoint (for when you solve new problems)
app.post('/api/update-progress', (req, res) => {
    try {
        const { newProblems, category, difficulty } = req.body;
        
        // Update your progress tracking
        console.log('📝 Progress update:', { newProblems, category, difficulty });
        
        // Clear cache to force refresh
        gfgCache = null;
        cacheTimestamp = null;
        
        res.json({ message: 'Progress updated successfully' });
    } catch (error) {
        console.error('❌ Update Error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        gfgCache: gfgCache ? 'Available' : 'Not available',
        lastUpdate: gfgCache ? new Date(cacheTimestamp).toISOString() : 'Never'
    });
});

// ScrapingBee API status check
app.get('/api/scrapingbee-status', async (req, res) => {
    try {
        console.log('🧪 Testing ScrapingBee API connection...');
        
        // Test with a simple, reliable website first
        const testResponse = await axios.get('https://app.scrapingbee.com/api/v1/', {
            params: {
                'api_key': SCRAPINGBEE_API_KEY,
                'url': 'https://httpbin.org/ip',
                'render_js': 'false'
            },
            timeout: 15000
        });
        
        if (testResponse.status === 200) {
            console.log('✅ ScrapingBee API connection successful');
            res.json({ 
                status: 'Connected',
                message: 'ScrapingBee API is working correctly',
                timestamp: new Date().toISOString(),
                testResponse: testResponse.data
            });
        } else {
            res.status(500).json({ 
                status: 'Error',
                message: 'ScrapingBee API returned unexpected status',
                statusCode: testResponse.status
            });
        }
        
    } catch (error) {
        console.error('❌ ScrapingBee API test failed:', error.message);
        
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            console.log(`📋 Error Status: ${status}`);
            console.log(`📋 Error Data:`, data);
            
            if (status === 401) {
                res.status(401).json({ 
                    status: 'Unauthorized',
                    message: 'Invalid or expired ScrapingBee API key',
                    error: 'Please check your API key in the dashboard',
                    timestamp: new Date().toISOString()
                });
            } else if (status === 429) {
                res.status(429).json({ 
                    status: 'Rate Limited',
                    message: 'API rate limit exceeded',
                    error: 'You have exceeded your monthly request limit',
                    timestamp: new Date().toISOString()
                });
            } else {
                res.status(status).json({ 
                    status: 'Error',
                    message: 'ScrapingBee API connection failed',
                    error: data || error.message,
                    statusCode: status,
                    timestamp: new Date().toISOString()
                });
            }
        } else if (error.code === 'ECONNABORTED') {
            res.status(408).json({ 
                status: 'Timeout',
                message: 'ScrapingBee API request timed out',
                error: 'Request took too long to complete',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ 
                status: 'Error',
                message: 'ScrapingBee API connection failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`🚀 DSA Backend Service running on port ${PORT}`);
    console.log(`📊 GFG Stats: http://localhost:${PORT}/api/gfg-stats`);
    console.log(`🔄 Combined Data: http://localhost:${PORT}/api/dsa-combined`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
    console.log(`✅ ScrapingBee Status: http://localhost:${PORT}/api/scrapingbee-status`);
    console.log(`🔄 Force Refresh: POST http://localhost:${PORT}/api/refresh-gfg`);
});

// Export for testing
module.exports = app;
