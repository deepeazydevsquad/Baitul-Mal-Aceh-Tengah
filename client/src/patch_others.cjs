const fs = require('fs');
const path = require('path');

// --- 1. CetakRekapDistribusiPerkecamatan.vue ---
let file1 = path.join(__dirname, 'modules', 'RekapPerkecamatan', 'CetakRekapDistribusiPerkecamatan.vue');
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(/import BaseTable from '@\/components\/Table\/BaseTable\.vue';\n?/, '');
content1 = content1.replace(/import type \{ TableColumn \} from '@\/components\/Table\/BaseTable\.vue';\n?/, '');
content1 = content1.replace(/const tableColumns = ref<TableColumn\[\]>\(\[\]\);\n?/, '');

let tableRegex1 = /<div class="border border-gray-300">\s*<BaseTable[\s\S]*?<template #thead>/m;
content1 = content1.replace(tableRegex1, `<div class="border border-gray-300">\n          <table class="w-full text-[7pt] table-fixed print-table border-collapse">`);

let tbodyRegex1 = /<\/template>\s*<template #tbody>/m;
content1 = content1.replace(tbodyRegex1, '');

let endRegex1 = /<\/template>\s*<\/BaseTable>/m;
content1 = content1.replace(endRegex1, `</table>`);

fs.writeFileSync(file1, content1, 'utf8');
console.log('Patched CetakRekapDistribusiPerkecamatan.vue');


// --- 2. CetakRekapPengumpulan.vue ---
let file2 = path.join(__dirname, 'modules', 'RekapPengumpulan', 'CetakRekapPengumpulan.vue');
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(/import BaseTable from '@\/components\/Table\/BaseTable\.vue';\n?/, '');
content2 = content2.replace(/import type \{ TableColumn \} from '@\/components\/Table\/BaseTable\.vue';\n?/, '');
content2 = content2.replace(/const tableColumns = ref<TableColumn\[\]>\(\[\]\);\n?/, '');

let tableRegex2 = /<BaseTable[\s\S]*?<template #thead>/m;
content2 = content2.replace(tableRegex2, `<table class="w-full border-collapse text-[6.5pt] mt-5 print-table" style="table-layout: auto">`);

let tbodyRegex2 = /<\/template>\s*<template #tbody>/m;
content2 = content2.replace(tbodyRegex2, '');

let endRegex2 = /<\/template>\s*<\/BaseTable>/m;
content2 = content2.replace(endRegex2, `</table>`);

let mainEmptyRegex2 = /<td colspan="14" class="empty-state-cell">[\s\S]*?<\/td>/m;
content2 = content2.replace(mainEmptyRegex2, `<td colspan="14" class="border border-black px-2 py-3 text-center text-gray-700">\n                Rekap Pengumpulan Tidak Ditemukan\n              </td>`);

fs.writeFileSync(file2, content2, 'utf8');
console.log('Patched CetakRekapPengumpulan.vue');
