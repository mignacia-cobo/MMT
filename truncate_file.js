const fs = require('fs');
const path = 'D:/MMT/backend/src/controllers/proyectoController.js';
const lines = fs.readFileSync(path, 'utf8').split('\n');
const kept = lines.slice(0, 225);
// Remove trailing blank lines
while (kept.length > 0 && kept[kept.length-1].trim() === '') kept.pop();
fs.writeFileSync(path, kept.join('\n') + '\n');
console.log('Done. Lines kept:', kept.length);
