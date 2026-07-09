const fs = require('fs');
const path = require('path');

const files = [
  'src/modules/BakalPenerimaBantuan/BakalPenerimaBantuan.vue',
  'src/modules/Syarat/syarat.vue',
  'src/modules/Kriteria/Kriteria.vue',
  'src/modules/Surveyor/Surveyor.vue',
  'src/modules/ProgramKegiatanBantuan/ProgramKegiatanBantuan.vue',
  'src/modules/DaftarKeanggotaan/DaftarKeanggotaan.vue',
  'src/modules/DaftarAsnaf/DaftarAsnaf.vue',
  'src/modules/DaftarProgram/DaftarProgram.vue',
  'src/modules/Kecamatan/Kecamatan.vue',
  'src/modules/Desa/Desa.vue',
  'src/modules/Bank/Bank.vue',
  'src/modules/BankPengumpulan/BankPengumpulan.vue',
  'src/modules/LaporanPerencanaan/LaporanPerencanaan.vue',
  'src/modules/LaporanAsnaf/LaporanAsnafFakir.vue',
  'src/modules/LaporanAsnaf/LaporanAsnafMIskin.vue',
  'src/modules/LaporanAsnaf/LaporanAsnafFisabilillah.vue',
  'src/modules/LaporanAsnaf/LaporanAsnafIbnuSabil.vue',
  'src/modules/LaporanAsnaf/LaporanAsnafGharim.vue',
  'src/modules/LaporanAsnaf/LaporanAsnafMuallaf.vue',
  'src/modules/LaporanKesekretariatan/LaporanKesekretariatan.vue',
  'src/modules/RekapPengumpulanPerKecamatan/RekapPengumpulanPerKecamatan.vue',
  'src/modules/SystemLog/SystemLog.vue',
  'src/modules/DaftarPengguna/DaftarPengguna.vue',
  'src/modules/GrupAkses/GrupAkses.vue',
  
  // Cetak Pages
  'src/modules/Cetak/LaporanKesekretariatan.vue',
  'src/modules/Cetak/LaporanPerencanaan.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafFakir.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafFilsabilillah.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafGharim.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafIbnuSabil.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafMiskin.vue',
  'src/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafMualaf.vue',
  'src/modules/RekapDistribusiPerAsnaf/CetakRekapDistribusiPerAsnaf.vue',
  'src/modules/RekapDistribusiPerKodeAsnaf/CetakRekapDistribusiPerKodeAsnaf.vue',
  'src/modules/RekapPengumpulanPerKecamatan/CetakRekapPengumpulanPerkecamatan.vue'
];

const WRAPPER_START = '<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">\n';
const WRAPPER_END = '\n      </div>';

for (let file of files) {
  if (!fs.existsSync(file)) {
    console.log('File not found: ' + file);
    // try to fix case insensitivity issues on linux/windows
    const parts = file.split('/');
    let curPath = '';
    for (let p of parts) {
      if (curPath === '') curPath = p;
      else {
        const dirFiles = fs.readdirSync(curPath);
        const match = dirFiles.find(f => f.toLowerCase() === p.toLowerCase());
        if (match) curPath = path.join(curPath, match);
        else curPath = path.join(curPath, p);
      }
    }
    if (fs.existsSync(curPath)) file = curPath;
    else continue;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Fix root wrapper class to just "p-4" or "p-6" (removing mx-auto, backgrounds)
  content = content.replace(/<template>\s*<div\s+class="([^"]*)">/, (match, classes) => {
    // preserve p-4 or p-6
    let padding = classes.match(/p-\d+/);
    padding = padding ? padding[0] : 'p-4';
    return `<template>\n  <div class="${padding}">`;
  });

  // 2. Add standard BaseTable wrapper if not already there
  // We need to safely wrap `<BaseTable ... > ... </BaseTable>`
  // First, check if it's already wrapped in our exact wrapper
  if (content.includes('bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4')) {
    // Skip if already wrapped
  } else {
    // Find the BaseTable tag.
    let baseTableIndex = content.indexOf('<BaseTable');
    if (baseTableIndex !== -1) {
      // Find where BaseTable tag closes
      let closeBaseTableIndex = content.indexOf('</BaseTable>', baseTableIndex);
      if (closeBaseTableIndex !== -1) {
        closeBaseTableIndex += '</BaseTable>'.length;
        
        // Check what's immediately preceding BaseTable to ensure we don't double wrap or break things
        const beforeTable = content.substring(baseTableIndex - 100, baseTableIndex);
        // Remove old wrappers if they exist
        if (beforeTable.includes('overflow-x-auto rounded-xl border border-gray-200 shadow')) {
          content = content.replace(/<div class="overflow-x-auto rounded-xl border border-gray-200 shadow">\s*<BaseTable/, '<BaseTable');
          // And we also need to remove the closing div. This is tricky.
        } else if (beforeTable.includes('overflow-hidden rounded-xl border border-gray-200 shadow mt-4')) {
          content = content.replace(/<div class="overflow-hidden rounded-xl border border-gray-200 shadow mt-4">\s*<BaseTable/, '<BaseTable');
        }

        // Now wrap it
        // Re-find indices because we might have changed the string
        baseTableIndex = content.indexOf('<BaseTable');
        closeBaseTableIndex = content.indexOf('</BaseTable>', baseTableIndex) + '</BaseTable>'.length;
        
        const indentMatch = content.substring(0, baseTableIndex).match(/(?:^|\n)([ \t]+)$/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        content = content.substring(0, baseTableIndex) +
                  WRAPPER_START + 
                  indent + '  ' + content.substring(baseTableIndex, closeBaseTableIndex) + 
                  WRAPPER_END +
                  content.substring(closeBaseTableIndex);
      }
    }
  }

  // 3. For Cetak pages, ensure with-pagination is false
  if (file.toLowerCase().includes('cetak') || file.toLowerCase().includes('laporan')) {
    // Wait, the user said "Untuk halaman cetak (print) atau print preview, jangan menampilkan pagination."
    // Let's only target Cetak files
    if (file.toLowerCase().includes('cetak')) {
      if (!content.includes(':with-pagination="false"')) {
        content = content.replace(/<BaseTable/, '<BaseTable\n        :with-pagination="false"');
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No changes needed for: ${file}`);
  }
}
