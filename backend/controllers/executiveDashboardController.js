const executiveDashboardService = require('../services/executiveDashboardService');

/**
 * Controller to fetch aggregated Executive Dashboard metrics directly from database
 */
async function getExecutiveMetrics(req, res) {
  try {
    const data = await executiveDashboardService.getExecutiveMetrics();
    return res.status(200).json({
      success: true,
      source: 'database',
      ...data
    });
  } catch (err) {
    console.error('Error fetching executive dashboard metrics:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch executive dashboard metrics from database',
      error: err.message
    });
  }
}

module.exports = {
  getExecutiveMetrics
};
