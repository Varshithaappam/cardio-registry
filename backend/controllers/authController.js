const db = require('../config/db'); // MySQL db connection pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    // Retrieve active user by username or email joining roles
    const [rows] = await db.execute(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.is_active, r.role_name 
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE (u.username = ? OR u.email = ?) AND u.is_active = 1`,
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid clinical credentials or inactive account.' });
    }

    const user = rows[0];

    // Verify password match
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid clinical credentials or inactive account.' });
    }

    // Sign the JWT token
    const secret = process.env.JWT_SECRET || 'cardio_registry_secret_key_2026';
    const token = jwt.sign(
      { id: user.user_id, userId: user.user_id, username: user.username, role: user.role_name },
      secret,
      { expiresIn: '8h' }
    );

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
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { login };