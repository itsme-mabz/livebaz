/**
 * Popular Leagues Debug Script
 * 
 * Copy and paste this entire script into your browser console (F12 → Console tab)
 * while on the frontend (http://localhost:5173)
 * 
 * This will help diagnose why league images aren't showing
 */

(async function debugPopularLeagues() {
    console.log('🔍 Starting Popular Leagues Debug...\n');
    
    try {
        // Fetch popular leagues from API
        console.log('📡 Fetching popular leagues from API...');
        const response = await fetch('/api/v1/public/popular-items?type=league');
        const data = await response.json();
        
        console.log('✅ API Response:', data);
        console.log(`📊 Total leagues found: ${data.count || 0}\n`);
        
        if (!data.success) {
            console.error('❌ API returned error:', data.message);
            return;
        }
        
        if (!data.data || data.data.length === 0) {
            console.warn('⚠️ No popular leagues found in database');
            console.log('💡 Solution: Add leagues from admin dashboard at http://localhost:5173/admin/dashboard');
            return;
        }
        
        // Analyze each league
        console.log('🔎 Analyzing each league:\n');
        data.data.forEach((item, index) => {
            console.log(`\n--- League ${index + 1}: ${item.item_name} ---`);
            console.log('ID:', item.item_id);
            console.log('Type:', item.type);
            console.log('Active:', item.is_active);
            console.log('Priority:', item.priority);
            
            // Check item_data
            if (!item.item_data) {
                console.error('❌ item_data is missing!');
            } else {
                console.log('✅ item_data exists');
                console.log('item_data:', item.item_data);
                
                // Check logo field
                const logo = item.item_data.logo || item.item_data.league_logo;
                if (!logo) {
                    console.error('❌ Logo field is missing or empty!');
                    console.log('💡 Solution: Remove and re-add this league from admin dashboard');
                } else {
                    console.log('✅ Logo URL found:', logo);
                    
                    // Test if logo URL is accessible
                    console.log('🔗 Testing logo URL...');
                    const img = new Image();
                    img.onload = () => {
                        console.log('✅ Logo image loaded successfully!');
                    };
                    img.onerror = () => {
                        console.error('❌ Logo image failed to load!');
                        console.log('💡 The URL might be invalid or blocked by CORS');
                    };
                    img.src = logo;
                }
            }
        });
        
        // Summary
        console.log('\n\n📋 SUMMARY:');
        console.log('═══════════════════════════════════════');
        
        const totalLeagues = data.data.length;
        const activeLeagues = data.data.filter(item => item.is_active).length;
        const leaguesWithLogo = data.data.filter(item => 
            item.item_data && (item.item_data.logo || item.item_data.league_logo)
        ).length;
        const leaguesWithoutLogo = totalLeagues - leaguesWithLogo;
        
        console.log(`Total leagues: ${totalLeagues}`);
        console.log(`Active leagues: ${activeLeagues}`);
        console.log(`Leagues with logo: ${leaguesWithLogo} ✅`);
        console.log(`Leagues without logo: ${leaguesWithoutLogo} ${leaguesWithoutLogo > 0 ? '❌' : '✅'}`);
        
        if (leaguesWithoutLogo > 0) {
            console.log('\n⚠️ ACTION REQUIRED:');
            console.log('Some leagues are missing logos. To fix:');
            console.log('1. Go to http://localhost:5173/admin/dashboard');
            console.log('2. Click "Popular Leagues" tab');
            console.log('3. Remove leagues without logos');
            console.log('4. Search and add them again');
        } else {
            console.log('\n✅ All leagues have logos!');
            console.log('If images still don\'t appear in navigation:');
            console.log('1. Check browser console for image loading errors');
            console.log('2. Try hard refresh (Ctrl+Shift+R)');
            console.log('3. Check if images are blocked by ad blocker');
        }
        
        console.log('═══════════════════════════════════════\n');
        
    } catch (error) {
        console.error('❌ Error during debug:', error);
        console.log('\n💡 Possible issues:');
        console.log('- Backend server not running (check http://localhost:3000)');
        console.log('- Database connection issue');
        console.log('- CORS configuration problem');
    }
})();

// Also provide a helper function to test individual image URLs
window.testLeagueImage = function(url) {
    console.log('🔗 Testing image URL:', url);
    const img = new Image();
    img.onload = () => {
        console.log('✅ Image loaded successfully!');
        console.log('Dimensions:', img.width, 'x', img.height);
    };
    img.onerror = () => {
        console.error('❌ Image failed to load!');
        console.log('Possible reasons:');
        console.log('- Invalid URL');
        console.log('- CORS blocked');
        console.log('- Image doesn\'t exist');
        console.log('- Network error');
    };
    img.src = url;
};

console.log('\n💡 TIP: You can test individual image URLs by running:');
console.log('testLeagueImage("https://example.com/logo.png")');
