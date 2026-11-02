const fs = require('fs');
const code = fs.readFileSync('frontend/src/utils/excelReportGenerator.js', 'utf8');
try {
    // Remove imports/exports to test syntax
    new Function(code.replace(/import\s+[\s\S]+?from\s+['"][^'"]+['"];?/g, '').replace(/export\s+default\s+/g, 'const def = ').replace(/export\s+/g, ''));
    console.log('Frontend syntax is 100% valid');
} catch (e) {
    console.error('Syntax Error:', e.message);
}

