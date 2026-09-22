require('dotenv').config();

const app = require('./app');
const db = require('./config/db');
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.healthCheck();
    // Explicitly bind to 0.0.0.0 to accept external public IP connections
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch {
    process.exitCode = 1;
  }
}

startServer();