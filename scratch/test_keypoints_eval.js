const fs = require('fs');

// Read excelReportGenerator and test buildKeyPointsSheet
const code = fs.readFileSync('frontend/src/utils/excelReportGenerator.js', 'utf8');

// Quick test to ensure formulas are valid Excel strings
const match = code.match(/const metricSpecs = \[([\s\S]+?)\];/);
if (match) {
    const total = 71;
    const males = 34, females = 37, meanAge = 52.3, hfref = 35, hfpef = 36, meanEf = 42.5;
    const nyha3 = 20, nyha4 = 10, dm = 21, htn = 17, ckd = 11, deaths = 0, meanDrugs = 1.8, meanAdh = 0.833;
    const metricSpecs = eval(`[${match[1]}]`);
    console.log('Evaluated Metric Specs:');
    metricSpecs.forEach(m => {
        console.log(`Row ${m.r}: ${m.label.padEnd(45)} => Formula: "${m.formula || 'N/A'}" | Source: "${m.src}"`);
    });
}
