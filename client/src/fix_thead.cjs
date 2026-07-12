const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'modules', 'LaporanAsnaf', 'CetakAsnaf');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.vue'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix duplicate thead
  content = content.replace(/<\/thead>\s*<\/thead>/g, '</thead>');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
});
