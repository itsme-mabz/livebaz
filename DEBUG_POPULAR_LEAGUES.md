# Debug Guide: Popular League Images Not Showing

## Issue
When adding popular leagues from the admin dashboard, the images don't appear in the frontend navigation.

## What Was Fixed

### 1. **FootballService.jsx** - Enhanced logo extraction
The `fetchPopularLeagues` function now properly extracts the logo from the `item_data` object:

```javascript
league_logo: leagueData.logo || leagueData.league_logo || '',
```

This handles both possible field names (`logo` and `league_logo`).

### 2. **Navigation.jsx** - Added error handling
- Added conditional rendering to check if `league.league_logo` exists
- Added `onError` handler to hide broken images
- Added placeholder div when logo is missing

### 3. **Mobile Menu** - Same error handling
Applied the same fixes to the mobile menu league display.

## How to Test

1. **Check what's in the database:**
   Open your MySQL database and run:
   ```sql
   SELECT id, type, item_id, item_name, item_data FROM PopularItems WHERE type = 'league';
   ```

2. **Check the API response:**
   Open browser console and go to Network tab, then visit the frontend.
   Look for the request to `/api/v1/public/popular-items?type=league`
   
   The response should look like:
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "type": "league",
         "item_id": "152",
         "item_name": "Premier League",
         "item_data": {
           "league_id": "152",
           "league_name": "Premier League",
           "country": "England",
           "logo": "https://apiv3.apifootball.com/badges/logo_leagues/152_premier-league.png"
         }
       }
     ]
   }
   ```

3. **Check browser console:**
   Open browser console (F12) and look for any errors related to:
   - Image loading failures
   - CORS errors
   - Network errors

## Common Issues & Solutions

### Issue 1: Logo field is empty in database
**Symptom:** `item_data.logo` is null or empty string

**Solution:** The league data from the API might not include the logo. Check the admin controller's `searchLeagues` function to ensure it's properly extracting the logo:

```javascript
logo: league.league_logo  // Make sure this field exists in API response
```

### Issue 2: CORS blocking the image
**Symptom:** Image URL is correct but browser blocks it

**Solution:** The API Football images should work without CORS issues. If you see CORS errors, the image URL might be incorrect.

### Issue 3: Image URL is malformed
**Symptom:** Image URL looks wrong in the HTML

**Solution:** Check that the URL is complete and starts with `http://` or `https://`

## Manual Fix

If leagues were added before this fix, you may need to re-add them:

1. Go to Admin Dashboard → Popular Leagues tab
2. Remove the existing leagues (they won't have images)
3. Search for the leagues again
4. Add them back - they should now include the logo

## Verification Steps

After the fix:

1. ✅ Go to `http://localhost:5173/admin/dashboard`
2. ✅ Click "Popular Leagues" tab
3. ✅ Search for a league (e.g., "Premier League")
4. ✅ Click "Add" button
5. ✅ Go to frontend homepage
6. ✅ Hover over "Leagues" in navigation
7. ✅ Check if the league logo appears in "Popular Leagues" section

## Additional Debugging

Add this to your browser console to see what data is being fetched:

```javascript
fetch('/api/v1/public/popular-items?type=league')
  .then(r => r.json())
  .then(data => {
    console.log('Popular Leagues Data:', data);
    data.data.forEach(item => {
      console.log(`League: ${item.item_name}`);
      console.log(`Logo in item_data:`, item.item_data?.logo);
      console.log(`Full item_data:`, item.item_data);
    });
  });
```

This will show you exactly what data is being returned and whether the logo field is populated.
