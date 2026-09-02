const db = require('../config/db');

// Hardcoded fallback defaults (Used if database is unreachable or table is empty)
const DEFAULT_WEIGHTS = {
  abha: 25,
  uhid: 20,
  phone: 15,
  dob: 15,
  name: 15,
  address: 5,
  email: 3,
  gender: 2
};

const DEFAULT_PENALTIES = {
  abhaConflict: 100,
  uhidConflict: 80,
  dobConflict: 40,
  genderConflict: 20,
  phoneConflict: 15
};

const DEFAULT_THRESHOLDS = {
  high_confidence: 95.0,
  review_required: 80.0
};

// In-memory cache
let cachedConfig = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Fetches dynamic scoring configuration from dbo.mpi_scoring_config with caching & fallbacks
 * @returns {Promise<{ weights: Object, penalties: Object, thresholds: Object }>}
 */
async function getScoringConfig(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedConfig && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedConfig;
  }

  try {
    const pool = await db.getPool();
    const { recordset } = await pool.request().query(`
      SELECT [config_type], [config_key], [config_value]
      FROM [dbo].[mpi_scoring_config]
      WHERE [is_active] = 1;
    `);

    const weights = { ...DEFAULT_WEIGHTS };
    const penalties = { ...DEFAULT_PENALTIES };
    const thresholds = { ...DEFAULT_THRESHOLDS };

    for (const row of recordset) {
      const val = parseFloat(row.config_value);
      if (isNaN(val)) continue;

      if (row.config_type === 'WEIGHT') {
        weights[row.config_key] = val;
      } else if (row.config_type === 'PENALTY') {
        penalties[row.config_key] = val;
      } else if (row.config_type === 'THRESHOLD') {
        thresholds[row.config_key] = val;
      }
    }

    cachedConfig = { weights, penalties, thresholds };
    lastFetchTime = now;
    return cachedConfig;
  } catch (err) {
    console.warn('[MPI Config Service] Database lookup failed, falling back to cached/default config:', err.message);
    if (cachedConfig) return cachedConfig;
    return {
      weights: { ...DEFAULT_WEIGHTS },
      penalties: { ...DEFAULT_PENALTIES },
      thresholds: { ...DEFAULT_THRESHOLDS }
    };
  }
}

/**
 * Clears the in-memory cache to immediately apply admin modifications
 */
function invalidateCache() {
  cachedConfig = null;
  lastFetchTime = 0;
}

/**
 * Retrieves full configuration rows for admin management interface
 */
async function getAllConfigs() {
  const pool = await db.getPool();
  const { recordset } = await pool.request().query(`
    SELECT [config_id], [config_type], [config_key], [config_value], [description], [is_active], [updated_at]
    FROM [dbo].[mpi_scoring_config]
    ORDER BY [config_type], [config_key];
  `);
  return recordset;
}

/**
 * Updates a specific scoring rule parameter in the database and flushes cache
 */
async function updateConfig(configKey, configValue, isActive = 1) {
  const pool = await db.getPool();
  const req = pool.request();
  req.input('configKey', db.sql.VarChar(50), configKey);
  req.input('configValue', db.sql.Decimal(6, 2), configValue);
  req.input('isActive', db.sql.Bit, isActive ? 1 : 0);

  const result = await req.query(`
    UPDATE [dbo].[mpi_scoring_config]
    SET [config_value] = @configValue,
        [is_active] = @isActive,
        [updated_at] = GETDATE()
    WHERE [config_key] = @configKey;
  `);

  invalidateCache();
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getScoringConfig,
  invalidateCache,
  getAllConfigs,
  updateConfig,
  DEFAULT_WEIGHTS,
  DEFAULT_PENALTIES,
  DEFAULT_THRESHOLDS
};
