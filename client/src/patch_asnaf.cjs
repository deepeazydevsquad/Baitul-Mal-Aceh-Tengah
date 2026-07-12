const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'modules', 'LaporanAsnaf', 'CetakAsnaf');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.vue'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Remove imports
  content = content.replace(/import BaseTable from '@\/components\/Table\/BaseTable\.vue';\n?/, '');
  content = content.replace(/import type \{ TableColumn \} from '@\/components\/Table\/BaseTable\.vue';\n?/, '');
  
  // 2. Remove tableColumns ref
  content = content.replace(/const tableColumns = ref<TableColumn\[\]>\(\[\]\);\n?/, '');
  
  // 3. Replace wrapper and BaseTable opening with native table
  const tableRegex = /<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">\s*<BaseTable[\s\S]*?<template #thead>\s*<thead class="border border-black text-center">/m;
  content = content.replace(tableRegex, `<!-- Tabel -->\n      <table class="w-full text-[7pt] mt-5 border-collapse print-table" style="table-layout: fixed">\n        <thead class="border border-black text-center">`);
  
  // 4. Replace template tbody tag
  const tbodyRegex = /<\/template>\s*<template #tbody>\s*<tbody>/m;
  content = content.replace(tbodyRegex, `</thead>\n        <tbody>`);
  
  // 5. Replace Grand Total empty state
  const grandTotalRegex = /<td colspan="6" class="empty-state-cell">[\s\S]*?<\/td>/m;
  content = content.replace(grandTotalRegex, `<td colspan="6" class="border border-black px-2 py-1 text-right">\n                  Total\n                </td>`);
  
  // 6. Replace main empty state
  const mainEmptyRegex = /<td colspan="7" class="empty-state-cell">[\s\S]*?<\/td>/m;
  // Get the string for the empty state
  const matchEmptyString = content.match(/<p class="empty-state-desc">(.*?)<\/p>/);
  const emptyStr = matchEmptyString ? matchEmptyString[1] : 'Data tidak ditemukan';
  content = content.replace(mainEmptyRegex, `<td colspan="7" class="border border-black px-2 py-3 text-center text-gray-700">\n                ${emptyStr}\n              </td>`);
  
  // 7. Replace closing tags
  const closingRegex = /<\/tbody>\s*<\/template>\s*<\/BaseTable>\s*<\/div>/m;
  content = content.replace(closingRegex, `</tbody>\n      </table>`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched', file);
});
