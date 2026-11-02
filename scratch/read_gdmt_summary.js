const fs = require('fs');

const content = fs.readFileSync('frontend/src/utils/excelReportGenerator.js', 'utf8');
const match = content.match(/function buildGdmtSummarySheet[\s\S]+?function buildSheet1/);
if (match) {
    console.log(match[0].slice(0, 4000));
} else {
    console.log('buildGdmtSummarySheet not found');
}

