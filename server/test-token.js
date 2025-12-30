const jwt = require('jsonwebtoken');
require('dotenv').config();

// Simulate login - generate a token
const userId = 1;
const userEmail = 'admin@livebaz.com';

console.log('=== TOKEN GENERATION TEST ===\n');

const token = jwt.sign(
  { id: userId, Email: userEmail },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

console.log('Generated Token:', token.substring(0, 50) + '...\n');

// Decode to see expiry
const decoded = jwt.decode(token);
console.log('Token Details:');
console.log('- User ID:', decoded.id);
console.log('- Email:', decoded.Email);
console.log('- Issued At:', new Date(decoded.iat * 1000));
console.log('- Expires At:', new Date(decoded.exp * 1000));
console.log('- Current Time:', new Date());
console.log('- Time Until Expiry:', ((decoded.exp * 1000 - Date.now()) / 1000 / 60 / 60).toFixed(2), 'hours\n');

// Try to verify it
try {
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token is VALID');
  console.log('Verified User ID:', verified.id);
} catch (error) {
  console.log('❌ Token is INVALID');
  console.log('Error:', error.message);
}

console.log('\n=== COPY THIS TOKEN TO TEST ===');
console.log(token);
