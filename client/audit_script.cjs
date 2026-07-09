const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/modules/**/*.vue');
const report = [];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('v-else') && content.includes('<td') && (content.includes('Tidak ada data') || content.includes('Belum ada') || content.includes('Data tidak') || content.includes('kosong') || content.includes('Tidak ditemukan'))) {
     
     // Extract the v-else block that contains <td
     const regex = /<tr\s+v-else[^>]*>[\s\S]*?<\/tr>|<template\s+v-else>[\s\S]*?<tr[^>]*>[\s\S]*?<\/tr>[\s\S]*?<\/template>/gi;
     const matches = [...content.matchAll(regex)];
     
     if (matches.length > 0) {
        report.push(`\n=== ${file} ===\n`);
        matches.forEach(m => report.push(m[0]));
     }
  }
}

fs.writeFileSync('empty_state_audit.txt', report.join('\n'));
console.log('Audit saved to empty_state_audit.txt');
