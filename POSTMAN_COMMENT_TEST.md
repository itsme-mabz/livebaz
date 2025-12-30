# Postman Test Guide - Blog Comment Posting

## Issue
Unable to post comments on blog posts at: `http://localhost:5173/blog/the-evolution-of-modern-football-speed-tactics-and-skill`

## API Endpoint
```
POST http://localhost:3000/api/v1/blogs/:blogId/comments
```

## Steps to Test in Postman

### Step 1: Get a Valid Blog ID
First, fetch the blog to get its ID:

**Request:**
```
GET http://localhost:3000/api/v1/blogs/the-evolution-of-modern-football-speed-tactics-and-skill
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Blog fetched successfully",
  "data": {
    "id": 1,  // <-- This is the blogId you need
    "title": "The Evolution of Modern Football: Speed, Tactics, and Skill",
    "slug": "the-evolution-of-modern-football-speed-tactics-and-skill",
    ...
  }
}
```

### Step 2: Login to Get Auth Token
**Request:**
```
POST http://localhost:3000/api/v1/user/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "Email": "your-email@example.com",
  "Password": "your-password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // <-- Copy this token
  "user": {
    "id": 1,
    "Name": "Your Name",
    "Email": "your-email@example.com"
  }
}
```

### Step 3: Post a Comment
**Request:**
```
POST http://localhost:3000/api/v1/blogs/1/comments
```
(Replace `1` with the actual blog ID from Step 1)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```
(Replace `YOUR_TOKEN_HERE` with the token from Step 2)

**Body (raw JSON):**
```json
{
  "content": "This is a test comment from Postman!"
}
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Comment posted successfully",
  "data": {
    "id": 1,
    "blog_id": 1,
    "user_id": 1,
    "user_name": "Your Name",
    "content": "This is a test comment from Postman!",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Common Errors and Solutions

### Error 1: 401 Unauthorized
```json
{
  "success": false,
  "message": "Please login to access this resource"
}
```
**Solution:** Make sure you included the `Authorization: Bearer YOUR_TOKEN` header

### Error 2: 404 Blog not found
```json
{
  "success": false,
  "message": "Blog not found"
}
```
**Solution:** Check that the blogId in the URL is correct (use the ID from Step 1)

### Error 3: 400 Bad Request
```json
{
  "success": false,
  "message": "Comment content is required"
}
```
**Solution:** Make sure the request body includes `"content"` field with non-empty text

### Error 4: Invalid token
```json
{
  "success": false,
  "message": "Invalid token"
}
```
**Solution:** Login again to get a fresh token

## Debugging Checklist

- [ ] Server is running on port 3000
- [ ] Database is connected
- [ ] User is logged in and has valid token
- [ ] Blog ID exists in database
- [ ] Authorization header is correctly formatted: `Bearer TOKEN` (note the space)
- [ ] Content-Type header is set to `application/json`
- [ ] Request body has `content` field
- [ ] Token is not expired

## Quick Test Script for Postman

You can use this in Postman's "Tests" tab to automate:

```javascript
// After login request
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("authToken", response.token);
    console.log("Token saved:", response.token);
}

// After get blog request
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("blogId", response.data.id);
    console.log("Blog ID saved:", response.data.id);
}
```

Then use `{{authToken}}` and `{{blogId}}` in your requests.
