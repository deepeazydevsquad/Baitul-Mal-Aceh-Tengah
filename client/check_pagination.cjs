const fs = require('fs');
const path = require('path');

function findVueFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findVueFiles(filePath, fileList);
    } else if (filePath.endsWith('.vue')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allVueFiles = findVueFiles('D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src');
const issues = [];

for (const file of allVueFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.includes('<BaseTable')) {
    const hasManualTfoot = content.includes('<template #tfoot>');
    const hasWithPaginationFalse = content.includes(':with-pagination="false"');
    const hasNativePagination = content.includes(':pagination=');
    const isCetak = file.includes('Cetak') || file.includes('cetak');

    if (isCetak) {
       if (hasNativePagination || hasManualTfoot) {
         issues.push({ file, type: 'Cetak page with pagination' });
       }
    } else {
       if (hasManualTfoot) {
         issues.push({ file, type: 'Manual tfoot pagination' });
       }
    }
  }
}

console.log(JSON.stringify(issues, null, 2));
