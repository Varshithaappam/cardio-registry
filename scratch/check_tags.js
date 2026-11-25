const fs = require('fs');
const babel = require('./frontend/node_modules/@babel/parser');

const code = fs.readFileSync('frontend/src/components/dashboard/AdminExecutiveDashboard.jsx', 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('Babel parsed successfully! No syntax errors.');
} catch (err) {
  console.error('Babel parse error:');
  console.error(err.message);
  console.error('Line:', err.loc?.line, 'Column:', err.loc?.column);
}
