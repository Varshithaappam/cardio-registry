const bcrypt = require('bcryptjs'); // <-- Changed from 'bcrypt' to 'bcryptjs'

const plainPassword = 'Srinivas#2026';
const saltRounds = 10;

async function generateHash() {
  try {
    const hash = await bcrypt.hash(plainPassword, saltRounds);
    console.log('\n==================================================');
    console.log(`Plain Password: ${plainPassword}`);
    console.log(`Generated Hash: ${hash}`);
    console.log('==================================================\n');

    // Verification test
    const isMatch = await bcrypt.compare(plainPassword, hash);
    console.log(`Self-Verification Check: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();