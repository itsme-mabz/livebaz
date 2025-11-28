# Math Predictions Page - Implementation Guide

## Overview
This guide explains the newly implemented Mathematical Football Predictions page, which displays AI-powered betting predictions with probabilities and odds.

## Features Implemented

### Frontend (React)
- **Full-featured predictions page** at `/math-predictions`
- **Filters sidebar** with:
  - Match type filters (All, Live only, Planned only, Finished only)
  - Probability filters (All outcomes, ≥60%, ≥75%, ≥90%)
  - League filters
- **Date navigation** (Yesterday, Today, Tomorrow, specific dates)
- **Prediction type tabs** (Math, 1x2, Goals, BTTS, HT/FT, Asian Handicap, Double chance, Corners, Cards)
- **Interactive predictions table** showing:
  - Match time and date
  - League and teams
  - 1x2 predictions with odds and probabilities
  - Goals predictions (Over/Under 2.5)
  - BTTS (Both Teams To Score) predictions
  - Best betting tip with win rate
  - "Bet Now" buttons
- **Responsive design** that works on mobile, tablet, and desktop

### Backend (Node.js/Express)
- **Predictions API service** at `/api/v1/predictions`
- **Integration with API Football** (apifootball.com)
- **Data transformation** to convert API probabilities to user-friendly format
- **Flexible filtering** by date, league, country, and match
- **Error handling** with fallback to sample data

## File Structure

```
Frontend/
├── src/
│   └── pages/
│       ├── MathPredictions.jsx    # Main component
│       └── MathPredictions.css    # Styling

server/
├── src/
│   ├── controller/
│   │   └── predictionsController.js    # API endpoints
│   ├── service/
│   │   └── predictionsService.js       # Business logic
│   └── routes/
│       └── predictions.routes.js       # Route definitions
```

## API Endpoints

### GET /api/v1/predictions
Fetches predictions with optional filters.

**Query Parameters:**
- `date` - today, yesterday, tomorrow, or yyyy-mm-dd format
- `from` - Start date (yyyy-mm-dd)
- `to` - End date (yyyy-mm-dd)
- `country_id` - Filter by country ID
- `league_id` - Filter by league ID
- `match_id` - Get specific match prediction

**Example:**
```bash
GET http://localhost:5000/api/v1/predictions?date=today
GET http://localhost:5000/api/v1/predictions?from=2025-11-27&to=2025-11-28
GET http://localhost:5000/api/v1/predictions?date=today&league_id=152
```

**Response:**
```json
{
  "success": true,
  "message": "Predictions fetched successfully",
  "data": [
    {
      "id": "12345",
      "time": "27.11.25\n15:00",
      "league": "PREMIER LEAGUE",
      "country": "England",
      "homeTeam": "Arsenal",
      "awayTeam": "Chelsea",
      "homeScore": "-",
      "awayScore": "-",
      "status": "Not Started",
      "predictions": {
        "1x2": {
          "w1": { "odds": "1.75", "prob": 57 },
          "draw": { "odds": "3.50", "prob": 29 },
          "w2": { "odds": "5.00", "prob": 20 }
        },
        "goals": {
          "type": "O 2.5",
          "odds": "1.85",
          "prob": 54
        },
        "btts": {
          "result": "Yes",
          "odds": "1.70",
          "prob": 59
        },
        "bestTip": {
          "type": "1X2 : W1",
          "odds": "1.75",
          "winRate": 57
        }
      }
    }
  ],
  "count": 1
}
```

### GET /api/v1/predictions/leagues
Gets available leagues for a specific date.

**Query Parameters:**
- `date` - Filter date (default: today)

## How to Use

### 1. Start the Backend Server
```bash
cd server
npm install
npm start
# Server runs on http://localhost:5000
```

### 2. Start the Frontend
```bash
cd Frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

### 3. Access the Page
Navigate to: http://localhost:5173/math-predictions

## API Configuration

The app uses the API Football service from apifootball.com. Your API key is already configured in `/server/.env`:

```env
APIFOOTBALL_KEY=8b638d34018a20c11ed623f266d7a7a6a5db7a451fb17038f8f47962c66db43b
```

### API Football Documentation
- Documentation: https://apifootball.com/documentation/#Predictions
- Endpoint: https://apiv3.apifootball.com
- Action: `get_predictions`
- Parameters: from, to, country_id, league_id, match_id
- Example: `https://apiv3.apifootball.com/?action=get_predictions&from=2025-11-27&to=2025-11-27&APIkey=YOUR_API_KEY`

## Customization

### Adding More Filters
Edit `/home/pc/Code/cpcl/Frontend/src/pages/MathPredictions.jsx`:

```javascript
// Add filter state
const [selectedLeague, setSelectedLeague] = useState(null);

// Update API call
const response = await axios.get(`${API_BASE_URL}/predictions`, {
    params: {
        date: selectedDate,
        league_id: selectedLeague
    }
});
```

### Styling Changes
Edit `/home/pc/Code/cpcl/Frontend/src/pages/MathPredictions.css` to modify colors, spacing, or layout.

### Adding More Prediction Types
The prediction type tabs are already set up. To implement different prediction displays:

1. Add logic in the component to filter/display predictions based on `selectedPredictionType`
2. Modify the API to return additional prediction data types
3. Update the table columns accordingly

## Data Flow

```
User selects date
    ↓
Frontend makes API call
    ↓
Backend fetches from API Football
    ↓
Data transformed to frontend format
    ↓
Frontend displays in table
    ↓
User can filter and interact
```

## Sample vs Live Data

The component includes fallback sample data that displays when:
- API is unreachable
- API key is invalid
- Network error occurs

This ensures the page always shows something, even during development or API issues.

## Next Steps

To enhance the page further:

1. **Implement filter logic** - Make filters actually filter the displayed predictions
2. **Add pagination** - Handle large datasets efficiently
3. **Live updates** - Use WebSocket or polling for live match updates
4. **Save favorites** - Allow users to save their favorite leagues/teams
5. **Historical data** - Show past prediction accuracy
6. **Charts and stats** - Add visualization of prediction trends
7. **Mobile optimization** - Further optimize for mobile devices

## Troubleshooting

### API Returns Empty Data
- Check your API key in `/server/.env`
- Verify the date range has available matches
- Check API Football rate limits

### CORS Errors
- Ensure backend CORS is configured for `http://localhost:5173`
- Check `/server/src/app.js` CORS settings

### Styling Issues
- Clear browser cache
- Check CSS file is being imported in the component
- Verify no conflicting global styles

## Support

For API Football issues:
- Email: support@apifootball.com
- Documentation: https://apifootball.com/documentation/

For implementation questions:
- Check the code comments in the files
- Review the API response format
- Test endpoints using Postman or curl
