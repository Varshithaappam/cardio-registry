const fs = require('fs');

const content = fs.readFileSync('backend/services/hfExportService.js', 'utf8');
const match = content.match(/SELECT\s+([\s\S]+?)\s+FROM\s+dbo\.hf_registry/i);
if (match) {
    const rawCols = match[1].split(',').map(c => c.trim()).filter(Boolean);
    const colNames = rawCols.map(c => {
        const parts = c.split(/\s+as\s+/i);
        const namePart = parts[parts.length - 1].trim();
        return namePart.split('.').pop().replace(/[\[\]]/g, '');
    });
    
    const counts = {};
    colNames.forEach(c => {
        counts[c] = (counts[c] || 0) + 1;
    });
    
    const duplicates = Object.entries(counts).filter(([c, count]) => count > 1);
    console.log('Duplicate columns in SELECT:', duplicates);
} else {
    console.log('No SELECT match');
}

