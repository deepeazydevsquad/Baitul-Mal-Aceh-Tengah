const fs = require('fs');
const path = require('path');

const files = [
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\TemplatePesanWhatsapp\\TemplatePesanWhatsapp.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\TargetPengumpulan\\TargetPengumpulan.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\TargetDistribusi\\TargetDistribusi.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\SystemLogSurveyor\\SystemLogSurveyor.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\SystemLog\\SystemLog.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RunningText\\RunningText.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RiwayatPesanWhatsapp\\RiwayatPesanWhatsapp.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\LaporanTahunan\\LaporanTahunan.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\LaporanPerencanaan\\LaporanPerencanaan.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\Surveyor\\Surveyor.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\Syarat\\syarat.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\ValidasiPermohonanBantuan\\ValidasiPermohonanBantuan.vue'
];

for(const f of files) {
  const content = fs.readFileSync(f, 'utf-8');
  const match = content.match(/:columns="([^"]+)"/);
  console.log(path.basename(f), '->', match ? match[1] : 'not found');
}
