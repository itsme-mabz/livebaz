# Token Expiration Debug Guide

## Issue
Getting "Token expired, please login again" even after fresh login.

## Quick Fix - Test in Postman

### Step 1: Fresh Login
```
POST http://localhost:3000/api/v1/user/login
Content-Type: application/json

{
  "Email": "admin@livebaz.com",
  "Password": "Admin@123456"
}
```

**Copy the token from response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // <-- COPY THIS
  "user": { ... }
}
```

### Step 2: Test Token Immediately
```
POST http://localhost:3000/api/v1/blogs/1/comments
Authorization: Bearer PASTE_TOKEN_HERE
Content-Type: application/json

{
  "content": "Test comment"
}
```

## Common Causes

### 1. Token Not Properly Copied
- Make sure there are NO extra spaces
- Format: `Bearer TOKEN` (one space after Bearer)
- Don't include quotes around the token

### 2. Wrong Token Being Used
- Frontend might be using old token from localStorage
- Clear localStorage and login again

### 3. Server Restarted
- JWT_SECRET changed? Check .env file
- Token was generated with different secret

## Debug Steps

### Check Server Logs
When you try to post a comment, check the server console for:
```
[AUTH] Token found: Yes
[AUTH] Token decoded successfully for user ID: 1
```

If you see:
```
Auth middleware error: TokenExpiredError: jwt expired
```
Then the token is actually expired.

### Verify Token Expiration
Tokens expire in **1 day** (24 hours).

To check when your token expires, decode it at: https://jwt.io

Paste your token and look for the `exp` field (expiration timestamp).

## Quick Test Script

Run this in Postman Console (Tests tab):

```javascript
// After login
const response = pm.response.json();
const token = response.token;

// Decode token (base64)
const payload = JSON.parse(atob(token.split('.')[1]));
const expDate = new Date(payload.exp * 1000);
const now = new Date();

console.log('Token expires at:', expDate);
console.log('Current time:', now);
console.log('Time until expiry:', (expDate - now) / 1000 / 60, 'minutes');

if (expDate < now) {
    console.log('❌ TOKEN IS EXPIRED!');
} else {
    console.log('✅ Token is valid');
}
```

## Solution

### Option 1: Use Fresh Token (Recommended for Testing)
1. Login in Postman
2. Immediately copy token
3. Use it right away to post comment

### Option 2: Increase Token Expiry (For Development)
Edit `server/src/model/user.model.js`:

```javascript
User.prototype.getJWTToken = function () {
  return jwt.sign({ id: this.id, Email: this.Email }, process.env.JWT_SECRET, {
    expiresIn: "7d",  // Changed from "1d" to "7d"
  });
};
```

### Option 3: Clear Frontend Storage
In browser console:
```javascript
localStorage.clear();
// Then login again
```

## Test Sequence

1. **Stop server** (Ctrl+C)
2. **Start server** (`npm start`)
3. **Login in Postman** → Copy token
4. **Get blog ID** → Note the ID
5. **Post comment** → Use fresh token
6. **Check server logs** → Should see [AUTH] messages

## Expected Working Flow

```
POST /api/v1/user/login
→ Response: { token: "abc123..." }

POST /api/v1/blogs/1/comments
Headers: Authorization: Bearer abc123...
→ Server logs: [AUTH] Token found: Yes
→ Server logs: [AUTH] Token decoded successfully for user ID: 1
→ Response: { success: true, data: { comment } }
```

## Still Not Working?

Check these:
- [ ] Server is running
- [ ] JWT_SECRET in .env matches
- [ ] Token is copied correctly (no spaces/quotes)
- [ ] Authorization header format: `Bearer TOKEN`
- [ ] Blog ID exists in database
- [ ] User exists in database
