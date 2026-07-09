const fs = require('fs');
const path = require('path');

const directoryPath = 'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\LaporanAsnaf';

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  files.forEach((file) => {
    if (file.endsWith('.vue')) {
      const filePath = path.join(directoryPath, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      const newContent = content.replace(/\s*<label[^>]*>Filter Tahun<\/label>/g, '');
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  });
});
