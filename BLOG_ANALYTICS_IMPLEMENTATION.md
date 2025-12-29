# Blog Analytics Implementation

## What Was Added

### Backend Changes

1. **New Model: BlogView** (`server/src/model/blog-view.model.js`)
   - Tracks individual blog views with country and IP information
   - Fields: id, blog_id, country, ip_address, timestamps

2. **Updated Controller** (`server/src/controller/blog-controller.js`)
   - Modified `getBlogBySlug` to track views with country using ip-api.com
   - Added `getBlogAnalytics` endpoint to fetch:
     - Total views across all blogs
     - Views grouped by country

3. **Updated Routes** (`server/src/routes/blog.admin.routes.js`)
   - Added GET `/api/v1/admin/blogs/analytics` endpoint

### Frontend Changes

1. **Updated Service** (`Frontend/src/Service/BlogService.jsx`)
   - Added `fetchBlogAnalytics` function

2. **Updated BlogAdmin Component** (`Frontend/src/pages/BlogAdmin.jsx`)
   - Added analytics display section showing:
     - Total views (large number)
     - Views by country (grid layout)
   - Loads analytics on component mount

## Database Setup

Run this SQL to create the blog_views table:

```sql
CREATE TABLE IF NOT EXISTS blog_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  country VARCHAR(100),
  ip_address VARCHAR(45),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blog_id (blog_id),
  INDEX idx_country (country),
  FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
);
```

The SQL file is saved at: `server/create-blog-views-table.sql`

## How It Works

1. When a user visits a blog post, the system:
   - Increments the blog's view_count
   - Gets the user's IP address
   - Looks up the country using ip-api.com (free geolocation API)
   - Saves a record in blog_views table

2. The admin panel displays:
   - Total views from all blog posts
   - Breakdown of views by country

## To View Analytics

1. Make sure the database table is created (run the SQL above)
2. Navigate to http://localhost:5173/admin/blogs
3. The analytics will appear at the top of the page showing:
   - Total Views (big yellow number)
   - Views by Country (grid of country cards)

## API Endpoint

GET `/api/v1/admin/blogs/analytics`
- Requires authentication (admin token)
- Returns:
  ```json
  {
    "success": true,
    "message": "Analytics fetched successfully",
    "data": {
      "totalViews": 150,
      "viewsByCountry": [
        { "country": "United States", "views": "45" },
        { "country": "United Kingdom", "views": "30" },
        ...
      ]
    }
  }
  ```
