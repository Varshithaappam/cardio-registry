const fs = require('fs');

const content = fs.readFileSync('frontend/src/utils/excelReportGenerator.js', 'utf8');
const match = content.match(/function buildKeyPointsSheet[\s\S]+?function buildGdmtSummarySheet/);
if (match) {
    console.log(match[0].slice(0, 3000));
} else {
    console.log('Not found');
}

