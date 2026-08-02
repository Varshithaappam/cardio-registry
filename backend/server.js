require('dotenv').config();

const app = require('./app');
const db = require('./config/db');
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.healthCheck();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch {
    process.exitCode = 1;
  }
}

startServer();
