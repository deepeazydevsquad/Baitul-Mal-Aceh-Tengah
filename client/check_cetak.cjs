const fs = require('fs');
const files = [
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RekapPengumpulan\\CetakRekapPengumpulan.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RekapDistribusiPerAsnaf\\CetakRekapDistribusiPerAsnaf.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RekapDistribusiPerKodeAsnaf\\CetakRekapDistribusiPerKodeAsnaf.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RekapPengumpulanPerKecamatan\\CetakRekapPengumpulanPerkecamatan.vue',
  'D:\\PROJECT\\NODEJS\\Baitul-Mal-Aceh-Tengah\\client\\src\\modules\\RekapPerkecamatan\\CetakRekapDistribusiPerkecamatan.vue'
];

for(const f of files) {
  const content = fs.readFileSync(f, 'utf-8');
  console.log(f.split('\\').pop());
  console.log('  has BaseTable:', content.includes('<BaseTable'));
  console.log('  has with-pagination false:', content.includes(':with-pagination="false"'));
  console.log('  has pagination component:', content.includes('<Pagination'));
}
