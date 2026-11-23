const { getExecutiveMetrics } = require('../backend/services/executiveDashboardService');

async function test() {
  const data = await getExecutiveMetrics();
  console.log('RESULT KEYS:', Object.keys(data));
  console.log('KPIS:', data.kpis);
  console.log('COST BREAKDOWN:', data.costBreakdown);
  console.log('TOTAL COST PER ADMISSION:', data.totalCostPerAdmission);
  console.log('AVERAGE COST BY STRATEGY:', data.averageCostByStrategy);
  console.log('COST BY PAYER:', data.costByPayer);
  process.exit(0);
}

test().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
