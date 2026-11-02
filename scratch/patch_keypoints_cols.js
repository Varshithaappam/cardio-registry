const fs = require('fs');

// 1. Patch backend/services/hfExportService.js to ensure echo_ef is numeric
let hfExport = fs.readFileSync('backend/services/hfExportService.js', 'utf8');
hfExport = hfExport.replace("row.echo_ef != null ? row.echo_ef : '',        // 62. EF%", "toNumericOrEmpty(row.echo_ef),                 // 62. EF%");
fs.writeFileSync('backend/services/hfExportService.js', hfExport, 'utf8');
console.log('Patched hfExportService.js');

// 2. Patch frontend/src/utils/excelReportGenerator.js
let excelGen = fs.readFileSync('frontend/src/utils/excelReportGenerator.js', 'utf8');

const oldMetricSpecs = `  const metricSpecs = [
    { r: 5, label: 'Patients (UHIDs) in dataset', formula: \`COUNTA('Sheet1'!B2:B\${total + 1})\`, result: total, src: 'Sheet1 col B', numFmt: undefined },
    { r: 6, label: 'Male', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Male")\`, result: males, src: 'Sheet1 col I', numFmt: undefined },
    { r: 7, label: 'Female', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Female")\`, result: females, src: 'Sheet1 col I', numFmt: undefined },
    { r: 8, label: 'Mean age (years)', formula: \`AVERAGE('Sheet1'!H2:H\${total + 1})\`, result: meanAge, src: 'Sheet1 col H', numFmt: '0.0' },
    { r: 9, label: 'HFrEF', formula: \`COUNTIF('Sheet1'!AN2:AN\${total + 1},"HFrEF")\`, result: hfref, src: 'Sheet1 col AN', numFmt: undefined },
    { r: 10, label: 'HFpEF', formula: \`COUNTIF('Sheet1'!AN2:AN\${total + 1},"HFpEF")\`, result: hfpef, src: 'Sheet1 col AN', numFmt: undefined },
    { r: 11, label: 'Mean EF %', formula: \`AVERAGE('Sheet1'!BI2:BI\${total + 1})\`, result: meanEf, src: 'Sheet1 col BI', numFmt: '0.0' },
    { r: 12, label: 'NYHA class III', formula: \`COUNTIF('Sheet1'!AU2:AU\${total + 1},"NYHA class III")\`, result: nyha3, src: 'Sheet1 col AU', numFmt: undefined },
    { r: 13, label: 'NYHA class IV', formula: \`COUNTIF('Sheet1'!AU2:AU\${total + 1},"NYHA class IV")\`, result: nyha4, src: 'Sheet1 col AU', numFmt: undefined },
    { r: 14, label: 'Diabetes mellitus (any comorbidity column)', result: dm, src: 'Sheet1 AO:AR', numFmt: undefined },
    { r: 15, label: 'Hypertension', result: htn, src: 'Sheet1 AO:AR', numFmt: undefined },
    { r: 16, label: 'Renal failure / CKD flagged (renal contraindication)', result: ckd, src: 'CI Flags col O', numFmt: undefined },
    { r: 17, label: 'Deaths recorded', formula: \`COUNTIF('Sheet1'!AZ2:AZ\${total + 1},"Y*")+COUNTIF('Sheet1'!AZ2:AZ\${total + 1},"Yes")\`, result: deaths, src: 'Sheet1 col AZ', numFmt: undefined },
    { r: 18, label: 'Mean number of GDMT drugs per patient', formula: \`AVERAGE('Sheet1'!CC2:CC\${total + 1})\`, result: meanDrugs, src: 'Sheet1 col CC', numFmt: '0.0' },
    { r: 19, label: 'Mean % GDMT adherence (no deviation)', formula: \`AVERAGE('Sheet1'!CR2:CR\${total + 1})\`, result: meanAdh, src: 'Sheet1 col CR', numFmt: '0.0%'\` }
  ];`;

const newMetricSpecs = `  const metricSpecs = [
    { r: 5, label: 'Patients (UHIDs) in dataset', formula: \`COUNTA('Sheet1'!B2:B\${total + 1})\`, result: total, src: 'Sheet1 col B', numFmt: undefined },
    { r: 6, label: 'Male', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Male")\`, result: males, src: 'Sheet1 col I', numFmt: undefined },
    { r: 7, label: 'Female', formula: \`COUNTIF('Sheet1'!I2:I\${total + 1},"Female")\`, result: females, src: 'Sheet1 col I', numFmt: undefined },
    { r: 8, label: 'Mean age (years)', formula: \`AVERAGE('Sheet1'!H2:H\${total + 1})\`, result: meanAge, src: 'Sheet1 col H', numFmt: '0.0' },
    { r: 9, label: 'HFrEF', formula: \`COUNTIF('Sheet1'!AO2:AO\${total + 1},"*HFrEF*")\`, result: hfref, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 10, label: 'HFpEF', formula: \`COUNTIF('Sheet1'!AO2:AO\${total + 1},"*HFpEF*")\`, result: hfpef, src: 'Sheet1 col AO', numFmt: undefined },
    { r: 11, label: 'Mean EF %', formula: \`AVERAGE('Sheet1'!BJ2:BJ\${total + 1})\`, result: meanEf, src: 'Sheet1 col BJ', numFmt: '0.0' },
    { r: 12, label: 'NYHA class III', formula: \`COUNTIF('Sheet1'!AV2:AV\${total + 1},"*III*")\`, result: nyha3, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 13, label: 'NYHA class IV', formula: \`COUNTIF('Sheet1'!AV2:AV\${total + 1},"*IV*")\`, result: nyha4, src: 'Sheet1 col AV', numFmt: undefined },
    { r: 14, label: 'Diabetes mellitus (any comorbidity column)', formula: \`COUNTIF('Sheet1'!AP2:AS\${total + 1},"*Diabet*")\`, result: dm, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 15, label: 'Hypertension', formula: \`COUNTIF('Sheet1'!AP2:AS\${total + 1},"*Hyperten*")\`, result: htn, src: 'Sheet1 col AP:AS', numFmt: undefined },
    { r: 16, label: 'Renal failure / CKD flagged (renal contraindication)', formula: \`COUNTIF('CI Flags'!O2:O\${total + 1},1)\`, result: ckd, src: 'CI Flags col O', numFmt: undefined },
    { r: 17, label: 'Deaths recorded', formula: \`COUNTIF('Sheet1'!BA2:BA\${total + 1},"Yes")\`, result: deaths, src: 'Sheet1 col BA', numFmt: undefined },
    { r: 18, label: 'Mean number of GDMT drugs per patient', formula: \`AVERAGE('Sheet1'!CD2:CD\${total + 1})\`, result: meanDrugs, src: 'Sheet1 col CD', numFmt: '0.0' },
    { r: 19, label: 'Mean % GDMT adherence (no deviation)', formula: \`AVERAGE('Sheet1'!CS2:CS\${total + 1})\`, result: meanAdh, src: 'Sheet1 col CS', numFmt: '0.0%'\` }
  ];`;

if (excelGen.includes(oldMetricSpecs.replace(/\n/g, '\r\n'))) {
    excelGen = excelGen.replace(oldMetricSpecs.replace(/\n/g, '\r\n'), newMetricSpecs.replace(/\n/g, '\r\n'));
    console.log('Replaced CRLF metricSpecs');
} else if (excelGen.includes(oldMetricSpecs)) {
    excelGen = excelGen.replace(oldMetricSpecs, newMetricSpecs);
    console.log('Replaced LF metricSpecs');
} else {
    console.error('metricSpecs block not found');
}

fs.writeFileSync('frontend/src/utils/excelReportGenerator.js', excelGen, 'utf8');
console.log('Patched excelReportGenerator.js');

