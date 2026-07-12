const fs = require('fs');
const path = require('path');

function patchFile(filename, emptyStateText, colspan) {
  const file = path.join(__dirname, 'modules', 'Cetak', filename);
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove imports
  content = content.replace(/import BaseTable from '@\/components\/Table\/BaseTable\.vue';\n?/g, '');
  content = content.replace(/import type \{ TableColumn \} from '@\/components\/Table\/BaseTable\.vue';\n?/g, '');

  // 2. Remove tableColumns ref
  const tableColumnsRegex = /const tableColumns = ref<TableColumn\[\]>\(\[[\s\S]*?\]\);\n?/g;
  content = content.replace(tableColumnsRegex, '');
  content = content.replace(/const tableColumns = ref<TableColumn\[\]>\(\[\]\);\n?/g, ''); // if empty array

  // 3. Replace wrapper and BaseTable opening with native table
  const tableRegex = /<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">\s*<BaseTable[\s\S]*?<template #thead>/m;
  content = content.replace(tableRegex, `<table class="w-full text-[8pt] mt-4 mb-4 border-collapse print-table" style="table-layout: fixed">\n        <thead class="bg-gray-100 border-b-2 border-gray-400">`);

  // 4. Replace template tbody tag
  const tbodyRegex = /<\/template>\s*<template #tbody>\s*<tbody>/m;
  content = content.replace(tbodyRegex, `</thead>\n        <tbody class="divide-y divide-gray-200">`);

  // 5. Replace main empty state
  const mainEmptyRegex = new RegExp(`<td colspan="${colspan}" class="empty-state-cell">[\\s\\S]*?<\\/td>`, 'm');
  content = content.replace(mainEmptyRegex, `<td colspan="${colspan}" class="border border-black px-2 py-3 text-center text-gray-700">\n                ${emptyStateText}\n              </td>`);

  // 6. Replace closing tags
  const closingRegex = /<\/tbody>\s*<\/template>\s*<\/BaseTable>\s*<\/div>/m;
  content = content.replace(closingRegex, `</tbody>\n      </table>`);

  fs.writeFileSync(file, content, 'utf8');
  console.log('Patched', filename);
}

patchFile('LaporanPerencanaan.vue', 'Data tidak ditemukan', 9);
