const fs = require('fs');

const filesToFix = [
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\TemplatePesanWhatsapp\\TemplatePesanWhatsapp.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\TargetPengumpulan\\TargetPengumpulan.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\TargetDistribusi\\TargetDistribusi.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\SystemLogSurveyor\\SystemLogSurveyor.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\SystemLog\\SystemLog.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RunningText\\RunningText.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RiwayatPesanWhatsapp\\RiwayatPesanWhatsapp.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\LaporanTahunan\\LaporanTahunan.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\LaporanPerencanaan\\LaporanPerencanaan.vue'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf-8');
  
  // 1. Remove the entire <template #tfoot> block if it contains <Pagination
  const tfootRegex = /<template #tfoot>[\s\S]*?<Pagination[\s\S]*?<\/template>/;
  content = content.replace(tfootRegex, '');
  
  // 2. Replace :with-pagination="false" with the correct props
  if (content.includes(':with-pagination="false"')) {
    content = content.replace(':with-pagination="false"', ':pagination="{ currentPage, perPage, totalRow, totalPages, pages }"\n        @page-change="pageNow"');
  }

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Fixed: ${file}`);
}

// Handle Surveyor.vue specifically
const surveyorPath = 'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\Surveyor\\Surveyor.vue';
let surveyorContent = fs.readFileSync(surveyorPath, 'utf-8');
const tfootRegex = /<template #tfoot>[\s\S]*?<Pagination[\s\S]*?<\/template>/;
surveyorContent = surveyorContent.replace(tfootRegex, '');
if (surveyorContent.includes(':with-pagination="false"')) {
  surveyorContent = surveyorContent.replace(':with-pagination="false"', ':pagination="{ currentPage, perPage: itemsPerPage, totalRow: totalItems, totalPages, pages }"\n        @page-change="handlePageNow"');
}
fs.writeFileSync(surveyorPath, surveyorContent, 'utf-8');
console.log(`Fixed: ${surveyorPath}`);
