# Quick Test Commands

## 1. Login (Run this first)
```bash
curl -X POST http://localhost:3000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d "{\"Email\":\"admin@livebaz.com\",\"Password\":\"Admin@123456\"}"
```

**Copy the token from the response!**

## 2. Get Blog ID
```bash
curl http://localhost:3000/api/v1/blogs/the-evolution-of-modern-football-speed-tactics-and-skill
```

**Note the "id" field from response!**

## 3. Post Comment (Replace YOUR_TOKEN and BLOG_ID)
```bash
curl -X POST http://localhost:3000/api/v1/blogs/BLOG_ID/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"content\":\"Test comment from curl\"}"
```

## Windows PowerShell Version

### 1. Login
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/user/login" -Method POST -ContentType "application/json" -Body '{"Email":"admin@livebaz.com","Password":"Admin@123456"}'
$token = $response.token
Write-Host "Token: $token"
```

### 2. Get Blog
```powershell
$blog = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/blogs/the-evolution-of-modern-football-speed-tactics-and-skill"
$blogId = $blog.data.id
Write-Host "Blog ID: $blogId"
```

### 3. Post Comment
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = '{"content":"Test comment from PowerShell"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/blogs/$blogId/comments" -Method POST -Headers $headers -Body $body
```

## All-in-One PowerShell Script
```powershell
# Login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/user/login" -Method POST -ContentType "application/json" -Body '{"Email":"admin@livebaz.com","Password":"Admin@123456"}'
$token = $loginResponse.token
Write-Host "✅ Logged in. Token: $($token.Substring(0,20))..."

# Get Blog
$blogResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/blogs/the-evolution-of-modern-football-speed-tactics-and-skill"
$blogId = $blogResponse.data.id
Write-Host "✅ Blog ID: $blogId"

# Post Comment
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$commentBody = '{"content":"Test comment - ' + (Get-Date).ToString() + '"}'
$commentResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/blogs/$blogId/comments" -Method POST -Headers $headers -Body $commentBody
Write-Host "✅ Comment posted successfully!"
Write-Host $commentResponse | ConvertTo-Json
```
