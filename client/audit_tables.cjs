const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'modules');
const results = [];

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const p = path.join(directory, file);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.vue')) {
      const content = fs.readFileSync(p, 'utf-8');
      if (content.includes('<table')) {
        const matches = [...content.matchAll(/<template v-if="([^"]+)">[\s\S]{0,100}?<tr v-for="/g)];
        if (matches.length) {
          matches.forEach(m => results.push({ file: p.replace(dir, ''), condition: m[1] }));
        } else {
            // Check for v-if on tbody or tr
            const tbodyMatches = [...content.matchAll(/<tbody[^>]*v-if="([^"]+)"/g)];
            if(tbodyMatches.length) {
                tbodyMatches.forEach(m => results.push({ file: p.replace(dir, ''), condition: m[1], type: 'tbody' }));
            }
        }
      }
    }
  }
}
walk(dir);
console.log(JSON.stringify(results, null, 2));
