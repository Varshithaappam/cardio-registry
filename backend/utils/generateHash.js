// backend/utils/generateHash.js
const bcrypt = require('bcryptjs');

// Read the plain text password passed from the command line argument
const plainPassword = process.argv[2];

if (!plainPassword) {
  console.log('\n❌ Error: Please provide a password as an argument.');
  console.log('👉 Usage: node generateHash.js <your_password>\n');
  process.exit(1);
}

async function createHash() {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    console.log('\n==================================================');
    console.log(`🔑 Original Password : ${plainPassword}`);
    console.log(`🔐 Hashed Password   : ${hashedPassword}`);
    console.log('==================================================');
    console.log('\n📋 SQL Query Template:\n');
    console.log(`INSERT INTO users (username, email, password_hash, role_id, is_active)`);
    console.log(`VALUES ('new_username', 'user@example.com', '${hashedPassword}', 2, 1);\n`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

createHash();