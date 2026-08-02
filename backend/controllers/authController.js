const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
  const { recordset: rows } = await db.query(
    `SELECT
        u.user_id,
        u.username,
        u.email,
        u.password_hash,
        u.is_active,
        r.role_name
     FROM [users] u
     JOIN [roles] r ON u.role_id = r.role_id
     WHERE (u.username = @username OR u.email = @username)
       AND u.is_active = 1;`,
    { username }
  );

  console.log('LOGIN USERNAME:', username);
  console.log('ROWS FOUND:', rows.length);

  if (rows.length === 0) {
    console.log('LOGIN FAILED: user not found or inactive');

    return res.status(401).json({
      message: 'Invalid clinical credentials or inactive account.'
    });
  }

  const user = rows[0];

  console.log('DB USERNAME:', user.username);
  console.log('IS ACTIVE:', user.is_active);
  console.log('ROLE:', user.role_name);
  console.log('HASH EXISTS:', Boolean(user.password_hash));
  console.log('HASH LENGTH:', user.password_hash?.length);

  const isMatch = await bcrypt.compare(
    password,
    String(user.password_hash).trim()
  );

  console.log('PASSWORD MATCH:', isMatch);

  if (!isMatch) {
    console.log('LOGIN FAILED: password mismatch');

    return res.status(401).json({
      message: 'Invalid clinical credentials or inactive account.'
    });
  }

  const secret =
    process.env.JWT_SECRET ||
    'cardio_registry_secret_key_2026';

  const token = jwt.sign(
    {
      id: user.user_id,
      userId: user.user_id,
      username: user.username,
      role: user.role_name
    },
    secret,
    { expiresIn: '8h' }
  );

  console.log('LOGIN SUCCESS:', user.username);

  return res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role_name
    }
  });
} catch (error) {
  console.error('Login error:', error);

  return res.status(500).json({
    message: 'Internal server error.'
  });
}
};

module.exports = { login };
