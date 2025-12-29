-- Create blog_views table
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
