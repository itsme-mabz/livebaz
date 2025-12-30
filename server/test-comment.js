const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testCommentPosting() {
  try {
    console.log('🔄 Step 1: Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/user/login`, {
      Email: 'admin@livebaz.com',
      Password: 'Admin@123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log('   Token:', token.substring(0, 30) + '...');
    console.log('   User:', loginResponse.data.user.Name);
    
    console.log('\n🔄 Step 2: Getting blog...');
    const blogResponse = await axios.get(`${BASE_URL}/blogs/the-evolution-of-modern-football-speed-tactics-and-skill`);
    
    const blogId = blogResponse.data.data.id;
    console.log('✅ Blog found!');
    console.log('   ID:', blogId);
    console.log('   Title:', blogResponse.data.data.title);
    
    console.log('\n🔄 Step 3: Posting comment...');
    const commentResponse = await axios.post(
      `${BASE_URL}/blogs/${blogId}/comments`,
      {
        content: `Test comment posted at ${new Date().toLocaleString()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Comment posted successfully!');
    console.log('   Comment ID:', commentResponse.data.data.id);
    console.log('   Content:', commentResponse.data.data.content);
    console.log('   User:', commentResponse.data.data.user_name);
    
    console.log('\n🔄 Step 4: Fetching all comments...');
    const commentsResponse = await axios.get(`${BASE_URL}/blogs/${blogId}/comments`);
    
    console.log('✅ Comments fetched!');
    console.log('   Total comments:', commentsResponse.data.count);
    console.log('\n📝 All comments:');
    commentsResponse.data.data.forEach((comment, index) => {
      console.log(`   ${index + 1}. ${comment.user_name}: ${comment.content.substring(0, 50)}...`);
    });
    
    console.log('\n✅ ALL TESTS PASSED! 🎉');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Starting Comment Posting Test...\n');
testCommentPosting();
