const mpiConfigService = require('../services/mpiConfigService');

/**
 * Get all active and configured scoring rules
 */
async function getConfigs(req, res) {
  try {
    const configs = await mpiConfigService.getAllConfigs();
    const activeConfig = await mpiConfigService.getScoringConfig();

    return res.status(200).json({
      success: true,
      active_parameters: activeConfig,
      configuration_rows: configs
    });
  } catch (error) {
    console.error('Error fetching MPI config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve MPI scoring configuration.'
    });
  }
}

/**
 * Update a specific weight, penalty, or threshold
 */
async function updateConfig(req, res) {
  try {
    const { key } = req.params;
    const { value, is_active } = req.body;

    if (value === undefined && is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Must provide either value or is_active.'
      });
    }

    const numVal = parseFloat(value);
    if (isNaN(numVal)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration value. Must be a valid numeric value.'
      });
    }

    const updated = await mpiConfigService.updateConfig(key, numVal, is_active !== undefined ? is_active : 1);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Configuration parameter "${key}" not found.`
      });
    }

    const newActiveConfig = await mpiConfigService.getScoringConfig(true);

    return res.status(200).json({
      success: true,
      message: `Scoring configuration parameter "${key}" updated successfully.`,
      active_parameters: newActiveConfig
    });
  } catch (error) {
    console.error('Error updating MPI config:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update MPI scoring configuration.'
    });
  }
}

/**
 * Invalidate cache and force reload from database
 */
async function refreshCache(req, res) {
  try {
    mpiConfigService.invalidateCache();
    const refreshed = await mpiConfigService.getScoringConfig(true);

    return res.status(200).json({
      success: true,
      message: 'MPI scoring configuration cache refreshed from database.',
      active_parameters: refreshed
    });
  } catch (error) {
    console.error('Error refreshing MPI config cache:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh MPI configuration cache.'
    });
  }
}

module.exports = {
  getConfigs,
  updateConfig,
  refreshCache
};
