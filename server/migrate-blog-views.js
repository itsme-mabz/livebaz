const { sequelize } = require('./src/config/db');
const BlogView = require('./src/model/blog-view.model');

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    
    await BlogView.sync({ force: false });
    console.log('blog_views table created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
