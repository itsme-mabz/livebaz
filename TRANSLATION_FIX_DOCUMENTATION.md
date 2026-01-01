# Translation Persistence Fix

## Problem
Translations were randomly changing from Persian (or other languages) to English when:
- Navigating between routes
- Refreshing the page
- Random behavior during navigation

## Root Causes
1. **No State Persistence**: Translation state was stored in module-level variables that reset on page refresh
2. **No Context Management**: Language selection wasn't managed in React Context
3. **Race Conditions**: Multiple components trying to detect language simultaneously
4. **No localStorage Backup**: Selected language wasn't persisted across sessions

## Solution Implemented

### 1. Created LanguageContext (`src/context/LanguageContext.jsx`)
- Centralized language state management
- Persists language selection to localStorage
- Automatically loads translations on initialization
- Syncs with URL changes
- Prevents race conditions with single source of truth

### 2. Updated translationReplacer (`src/utils/translationReplacer.jsx`)
- Added loadPromise to prevent multiple simultaneous translation loads
- Falls back to localStorage when language parameter not provided
- Improved error handling

### 3. Created useTranslation Hook (`src/hooks/useTranslation.js`)
- Simple API for components: `const { t, tRaw, currentLanguage } = useTranslation()`
- Automatically uses current language from context
- No need to pass language parameter manually

### 4. Updated GoogleTranslate Component
- Integrated with LanguageContext
- Syncs language changes to context and localStorage
- Maintains consistency across all components

### 5. Updated App.jsx
- Wrapped application with LanguageProvider
- Ensures all components have access to language context

### 6. Updated MatchDetail.jsx (Example)
- Replaced manual language detection with useTranslation hook
- Removed redundant state management
- Simplified translation calls from `replaceTranslation(text, translationLang)` to `t(text)`

## How It Works

1. **On App Load**:
   - LanguageContext initializes
   - Loads translations from backend
   - Checks URL for language code
   - Falls back to localStorage
   - Defaults to 'en' if nothing found

2. **On Language Change**:
   - User selects language in GoogleTranslate component
   - Updates LanguageContext state
   - Saves to localStorage
   - Updates URL
   - All components re-render with new language

3. **On Navigation**:
   - LanguageContext persists across routes
   - localStorage maintains selection
   - URL sync keeps consistency

4. **On Page Refresh**:
   - LanguageContext reads from localStorage
   - Restores previous language selection
   - Reloads translations if needed

## Benefits

✅ Language persists across navigation
✅ Language persists across page refreshes
✅ No race conditions
✅ Single source of truth
✅ Simplified component code
✅ Better performance (fewer translation loads)
✅ Consistent behavior across all pages

## Migration Guide for Other Components

To update other components to use the new system:

```javascript
// OLD WAY
import { replaceTranslation } from '../utils/translationReplacer';
const [currentLang, setCurrentLang] = useState('en');
// ... manual language detection logic
{replaceTranslation('Some Text', translationLang)}

// NEW WAY
import { useTranslation } from '../hooks/useTranslation';
const { t, currentLanguage } = useTranslation();
{t('Some Text')}
```

## Files Modified

1. `src/context/LanguageContext.jsx` - NEW
2. `src/hooks/useTranslation.js` - NEW
3. `src/utils/translationReplacer.jsx` - UPDATED
4. `src/components/Navigation/GoogleTranslate.jsx` - UPDATED
5. `src/App.jsx` - UPDATED
6. `src/pages/MatchDetail.jsx` - UPDATED (example)

## Next Steps

Update remaining components to use the new useTranslation hook:
- LiveScore.jsx
- Predictions.jsx
- LeagueDetail.jsx
- PredictionDetail.jsx
- And all other pages using translations

This will ensure consistent translation behavior across the entire application.
