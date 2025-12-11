# Admin Panel Setup Guide

This guide will help you set up and use the admin panel to manage popular matches and leagues on your platform.

## Features

✅ **Admin Authentication** - Secure login system for admins
✅ **Popular Matches Management** - Add, remove, and prioritize featured matches
✅ **Popular Leagues Management** - Add, remove, and prioritize featured leagues
✅ **Search Functionality** - Search matches by date/team and leagues by name
✅ **Priority System** - Control display order with priority levels
✅ **Active/Inactive Toggle** - Show/hide items without deleting them

## Setup Instructions

### 1. Run Database Migration

First, update your database schema to support admin features:

```bash
cd server
node src/migrations/add-admin-features.js --create-admin
```

This will:
- Add `is_admin` field to the Users table
- Create the `PopularItems` table
- Create a default admin user (optional with `--create-admin` flag)

### 2. Configure Environment Variables

Add these to your `server/.env` file (optional, for custom admin creation):

```env
ADMIN_EMAIL=admin@livebaz.com
ADMIN_PASSWORD=YourSecurePassword123
ADMIN_NAME=Admin
```

### 3. Start Your Servers

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd Frontend
npm run dev
```

### 4. Access the Admin Panel

Navigate to: `http://localhost:5173/admin/login`

**Default credentials** (if you used --create-admin):
- Email: `admin@livebaz.com`
- Password: `Admin@123456`

⚠️ **IMPORTANT:** Change the default password immediately after first login!

## Using the Admin Panel

### Dashboard Overview

The admin dashboard has two main tabs:
1. **Popular Matches** - Manage featured matches
2. **Popular Leagues** - Manage featured leagues

### Adding Popular Items

#### Adding a Match:
1. Go to "Popular Matches" tab
2. Use the search form:
   - Enter team names or league name
   - Select a date (defaults to today)
   - Click "Search"
3. Browse search results
4. Click "Add" on the match you want to feature

#### Adding a League:
1. Go to "Popular Leagues" tab
2. Use the search form:
   - Enter league name or country
   - Click "Search"
3. Browse search results
4. Click "Add" on the league you want to feature

### Managing Popular Items

Each popular item has these controls:

- **Priority** - Higher numbers appear first (0 = lowest priority)
- **Active/Inactive Toggle** - Show or hide without removing
- **Remove Button** - Permanently delete from popular list

### API Endpoints

#### Public Endpoints (No Auth Required)

```
GET /api/v1/public/popular-items?type=match
GET /api/v1/public/popular-items?type=league
```

#### Admin Endpoints (Requires Auth)

```
GET    /api/v1/admin/popular-items?type=match|league
POST   /api/v1/admin/popular-items
PUT    /api/v1/admin/popular-items/:id
DELETE /api/v1/admin/popular-items/:id
GET    /api/v1/admin/search/matches?query=...&date=...
GET    /api/v1/admin/search/leagues?query=...
```

## Displaying Popular Items on Frontend

### Example: Fetching Popular Matches

```javascript
import axios from 'axios';

const fetchPopularMatches = async () => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/v1/public/popular-items?type=match'
    );

    if (response.data.success) {
      const popularMatches = response.data.data;
      // Use the popularMatches data to display on your homepage
      console.log(popularMatches);
    }
  } catch (error) {
    console.error('Error fetching popular matches:', error);
  }
};
```

### Example: Fetching Popular Leagues

```javascript
const fetchPopularLeagues = async () => {
  try {
    const response = await axios.get(
      'http://localhost:3000/api/v1/public/popular-items?type=league'
    );

    if (response.data.success) {
      const popularLeagues = response.data.data;
      // Use the popularLeagues data to display on your homepage
      console.log(popularLeagues);
    }
  } catch (error) {
    console.error('Error fetching popular leagues:', error);
  }
};
```

### Data Structure

#### Popular Match Object:
```json
{
  "id": 1,
  "type": "match",
  "item_id": "710014",
  "item_name": "Barcelona vs Real Madrid",
  "item_data": {
    "match_id": "710014",
    "home_team": "Barcelona",
    "away_team": "Real Madrid",
    "league": "La Liga",
    "date": "2025-12-15",
    "time": "20:00",
    "home_logo": "https://...",
    "away_logo": "https://..."
  },
  "priority": 10,
  "is_active": true,
  "added_by": 1,
  "createdAt": "2025-12-11T12:00:00.000Z",
  "updatedAt": "2025-12-11T12:00:00.000Z"
}
```

#### Popular League Object:
```json
{
  "id": 2,
  "type": "league",
  "item_id": "302",
  "item_name": "La Liga",
  "item_data": {
    "league_id": "302",
    "league_name": "La Liga",
    "country": "Spain",
    "logo": "https://..."
  },
  "priority": 5,
  "is_active": true,
  "added_by": 1,
  "createdAt": "2025-12-11T12:00:00.000Z",
  "updatedAt": "2025-12-11T12:00:00.000Z"
}
```

## Making a User an Admin

### Option 1: Via Database (SQL)

```sql
UPDATE Users SET is_admin = 1 WHERE Email = 'user@example.com';
```

### Option 2: Via Migration Script

Run the migration with `--create-admin` flag to create a new admin user.

### Option 3: Programmatically

```javascript
const user = await User.findOne({ where: { Email: 'user@example.com' } });
await user.update({ is_admin: true });
```

## Security Best Practices

1. **Change Default Password** - Always change the default admin password
2. **Use Strong Passwords** - Minimum 8 characters with numbers and special characters
3. **HTTPS in Production** - Always use HTTPS for the admin panel in production
4. **Limited Admin Access** - Only give admin privileges to trusted users
5. **Monitor Admin Actions** - Review admin activities regularly

## Troubleshooting

### "Access denied. Admin privileges required"
- Ensure your user account has `is_admin = true` in the database
- Check if you're logged in with the correct account

### "Error fetching popular items"
- Verify your backend server is running
- Check the API URL in the frontend code
- Verify the database connection

### Admin routes not working
- Clear browser cache and localStorage
- Restart both frontend and backend servers
- Check browser console for errors

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs for backend errors
3. Verify database migrations ran successfully
4. Ensure all environment variables are set correctly

---

**Next Steps:**
1. Run the migration script
2. Login to the admin panel
3. Add your first popular match or league
4. Integrate the public API endpoints in your homepage to display popular items
