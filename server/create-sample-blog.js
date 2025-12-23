require('dotenv').config();
const { sequelize } = require('./src/config/db');
const Blog = require('./src/model/blog.model');
const User = require('./src/model/user.model');

async function createSampleBlog() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Sync models
    await Blog.sync();
    await User.sync();
    console.log('✓ Models synced');

    // Find an admin user or create one
    let admin = await User.findOne({ where: { is_admin: true } });

    if (!admin) {
      console.log('✗ No admin user found. Please create an admin user first.');
      console.log('You can login to /admin/login and register, or use the existing admin credentials.');
      process.exit(1);
    }

    console.log('✓ Admin user found:', admin.Name);

    // Check if sample blog already exists
    const existingBlog = await Blog.findOne({
      where: { slug: 'dr-congo-vs-benin-prediction-december-23-2025' }
    });

    if (existingBlog) {
      console.log('✓ Sample blog already exists');
      process.exit(0);
    }

    // Create sample blog
    const sampleBlog = await Blog.create({
      title: 'DR Congo vs Benin Prediction and Betting Tips on December 23, 2025',
      slug: 'dr-congo-vs-benin-prediction-december-23-2025',
      content: `
        <h2>Game Prediction</h2>
        <p><strong>Our Tip:</strong> DR Congo to Win - Odds: 1.73</p>
        <p>200% 1st deposit up to 30000 Ks$</p>

        <h2>Both the Leopards and the Cheetahs want to start the competition with a win.</h2>

        <h2>DR Congo vs Benin key stats and trends</h2>
        <ul>
          <li>DR Congo has won all of its last 5 matches</li>
          <li>DR Congo has scored 6 goals and conceded 1 during this period</li>
          <li>Benin has won 3 and lost 2 of its last 5 matches</li>
          <li>Benin has conceded 4 goals and scored 5 during this period</li>
          <li>It\'s the second confirmed match between the two teams</li>
        </ul>

        <h2>DR Congo vs Benin recent form</h2>
        <p>The Democratic Republic of Congo enters this Africa Cup of Nations with confidence boosted. The Leopards won all the last five encounters: They beat Congo (0-1), Tanzania (2-0), Guinea (1-0), Ethiopia (1-0), Cameroon (0-1) and Ivory Coast (0-1), with only big names in African football: Cameroon (0-1) and Ivory Coast. The Bensaese machine beat Zimbabwe 2-0 on the 12th.</p>

        <p>Opposite Benin, The Cheetahs are missing the previous two editions to Cameroon and Ivory Coast. The Bensaese squared turned into a humid tournament into Rwanda (0-0), Lesotho (4-0), and Rwanda (2-0). Prior to that, the Babayaros lost to Congo-Brazzaville (1-0) and Burkina Faso (1-0) in the match-ups round.</p>

        <h2>Form</h2>
        <ul>
          <li>Congo: W W W W W</li>
          <li>Benin: W W W L L</li>
        </ul>

        <h2>Predicted line-ups</h2>
        <p><strong>DR Congo probable line-up:</strong> Mossi – Wan Bissaka, Mbemba, Mbemba, Tuanzebe – Masuaku, Pickel, Moutoussamy, Sadiki – Elia, Mayulu</p>

        <p><strong>Benin probable line-up:</strong> Allagbe – Ousmane, Verdon, Kiki, Moumni – Dodo Dokou, Tosin, Anonssou</p>

        <h2>Previous matches: DR Congo vs Benin</h2>
        <p>This is the third time these two teams have faced each other.</p>
        <p>In the previous two matches, DR Congo won one and drew the other, winning. In the last match that faced these two teams in the WC match was won by the Democratic Republic of Congo from a solitary Bakambu from an Annonssou own goal.</p>

        <h2>Expert tip: Congo to win</h2>
        <p>Congo is on a very positive run and has a squad that is clearly superior to their opponents in this match. Their defense is incredible and has prevented them from conceding numerous goals through the World Cup qualifying phase well into February. With this time, we see them being competitive despite Annonssou having strong support. The odds are 1.73.</p>

        <p>Learn more about your teams in the <a href="/league/africa-cup-of-nations">Africa Cup of Nations table</a> and place your bet on the upcoming match.</p>
      `,
      excerpt: 'Expert prediction for DR Congo vs Benin match on December 23, 2025. Detailed analysis, stats, and betting tips for this exciting AFCON clash.',
      category: 'AFCON - Africa Cup of Nations',
      author_id: admin.id,
      author_name: admin.Name,
      featured_image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
      tags: ['AFCON', 'Africa Cup of Nations', 'DR Congo', 'Benin', 'Football Predictions'],
      metadata: {
        match_info: {
          home_team: 'DR Congo',
          away_team: 'Benin',
          competition: 'AFCON',
          date: '2025-12-23',
          time: '19:30'
        },
        author_stats: {
          win_rate: '55 (7)',
          avg_coef: '6',
          yield: '1',
          active_tips: '5',
          form: ['W', 'W', 'W', 'L', 'L']
        }
      },
      is_published: true,
      published_at: new Date(),
      priority: 10,
      view_count: 0
    });

    console.log('✓ Sample blog created successfully!');
    console.log('  Title:', sampleBlog.title);
    console.log('  Slug:', sampleBlog.slug);
    console.log('  URL: http://localhost:5173/blog/' + sampleBlog.slug);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

createSampleBlog();
