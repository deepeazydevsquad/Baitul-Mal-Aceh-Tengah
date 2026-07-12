const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'modules', 'Cetak', 'LaporanTahunan.vue');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove imports
content = content.replace(/import BaseTable from '@\/components\/Table\/BaseTable\.vue';\n?/m, '');
content = content.replace(/import type \{ TableColumn \} from '@\/components\/Table\/BaseTable\.vue';\n?/m, '');

// 2. Remove tableColumns ref
const tableColumnsRegex = /const tableColumns = ref<TableColumn\[\]>\(\[\]\);\n?/m;
content = content.replace(tableColumnsRegex, '');

// 3. Replace BaseTable
const tableRegex = /<BaseTable[\s\S]*?<template #thead>/m;
const replacement = `<table class="w-full text-xs border-collapse print-table">
        <thead class="bg-gray-100 text-gray-900 text-center border-b-2 border-gray-400">`;
content = content.replace(tableRegex, replacement);

const tbodyRegex = /<\/template>\s*<template #tbody>/m;
content = content.replace(tbodyRegex, `</thead>`);

const endRegex = /<\/template>\s*<\/BaseTable>/m;
content = content.replace(endRegex, `</table>`);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched LaporanTahunan.vue');
