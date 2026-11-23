const { getPool } = require('../backend/config/db');

async function run() {
  const pool = await getPool();

  const stemiRows = await pool.request().query(`
    SELECT 
      COUNT(*) as total_rows,
      COUNT(CASE WHEN total_cost > 0 THEN 1 END) as rows_with_total_cost,
      COUNT(CASE WHEN bed_charges > 0 THEN 1 END) as rows_with_bed_charges,
      SUM(total_cost) as sum_total_cost,
      AVG(CASE WHEN total_cost > 0 THEN total_cost END) as avg_total_cost,
      SUM(bed_charges) as sum_bed,
      SUM(drugs_disposables_cost) as sum_drugs,
      SUM(package_cost) as sum_pkg,
      SUM(laboratory_cost) as sum_lab,
      SUM(non_invasive_lab_cost) as sum_non_inv,
      SUM(consultation_cost) as sum_consult,
      SUM(radiology_cost) as sum_rad,
      SUM(miscellaneous_cost) as sum_misc
    FROM dbo.stemi_hospitalization;
  `);
  console.log('STEMI Hospitalization:');
  console.table(stemiRows.recordset);

  const nstemiRows = await pool.request().query(`
    SELECT 
      COUNT(*) as total_rows,
      COUNT(CASE WHEN total_cost > 0 THEN 1 END) as rows_with_total_cost,
      COUNT(CASE WHEN bed_charges > 0 THEN 1 END) as rows_with_bed_charges,
      SUM(total_cost) as sum_total_cost,
      AVG(CASE WHEN total_cost > 0 THEN total_cost END) as avg_total_cost,
      SUM(bed_charges) as sum_bed,
      SUM(drugs_disposables_cost) as sum_drugs,
      SUM(package_cost) as sum_pkg,
      SUM(laboratory_cost) as sum_lab,
      SUM(non_invasive_lab_cost) as sum_non_inv,
      SUM(consultation_cost) as sum_consult,
      SUM(radiology_cost) as sum_rad,
      SUM(miscellaneous_cost) as sum_misc
    FROM dbo.nstemi_hospitalization;
  `);
  console.log('NSTEMI Hospitalization:');
  console.table(nstemiRows.recordset);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
