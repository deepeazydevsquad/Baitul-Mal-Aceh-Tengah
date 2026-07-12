const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'modules', 'Cetak', 'LaporanPengumpulan.vue');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove BaseTable imports
content = content.replace(/import BaseTable from '@\/components\/Table\/BaseTable\.vue';\n?/g, '');
content = content.replace(/import type \{ TableColumn \} from '@\/components\/Table\/BaseTable\.vue';\n?/g, '');

// 2. Remove columns definition
content = content.replace(/const targetCapaianColumns = ref<TableColumn\[\]>\(\[[\s\S]*?\]\);\n?/g, '');
content = content.replace(/const komposisiColumns = ref<TableColumn\[\]>\(\[[\s\S]*?\]\);\n?/g, '');

// 3. Replace Target dan Capaian BaseTable
const table1Regex = /<BaseTable[\s\S]*?<template #cell-jenis="{ row }">[\s\S]*?<\/template>\s*<template #cell-target="{ row }">[\s\S]*?<\/template>\s*<template #cell-realisasi="{ row }">[\s\S]*?<\/template>\s*<template #cell-persentase="{ row }">[\s\S]*?<\/template>\s*<template #tfoot>([\s\S]*?)<\/template>\s*<\/BaseTable>/m;

const table1Replacement = `<table class="w-full text-[8pt] border-collapse border border-gray-300 print-table text-black">
          <thead class="bg-gray-100 border-b-2 border-gray-400">
            <tr>
              <th class="text-left py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Kategori</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Target</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Realisasi</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900">(%)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-if="data.dataPerJenis && data.dataPerJenis.length > 0">
              <tr v-for="(row, i) in data.dataPerJenis" :key="i">
                <td class="py-1 px-2 border-r border-gray-300">{{ row.jenis }}</td>
                <td class="py-1 px-2 text-right border-r border-gray-300">{{ $formatToRupiah(row.target) }}</td>
                <td class="py-1 px-2 text-right border-r border-gray-300">{{ $formatToRupiah(row.realisasi) }}</td>
                <td class="py-1 px-2 text-right">{{ (row.persentase ?? 0).toFixed(2) }}%</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="4" class="text-center py-2">Data tidak ditemukan</td>
            </tr>$1</tbody>
        </table>`;

content = content.replace(table1Regex, table1Replacement);

// 4. Replace Komposisi Sumber Dana BaseTable
const table2Regex = /<BaseTable[\s\S]*?<template #cell-jenis="{ row }">[\s\S]*?<\/template>\s*<template #cell-rek_penampung="{ row }">[\s\S]*?<\/template>\s*<template #cell-rek_kasda="{ row }">[\s\S]*?<\/template>\s*<template #tfoot>([\s\S]*?)<\/template>\s*<\/BaseTable>/m;

const table2Replacement = `<table class="w-full text-[8pt] border-collapse border border-gray-300 print-table text-black">
          <thead class="bg-gray-100 border-b-2 border-gray-400">
            <tr>
              <th class="text-left py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Kategori</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900 border-r border-gray-300">Rek Penampung</th>
              <th class="text-right py-1 px-2 font-semibold text-gray-900">Rek Kasda</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-if="data.dataPerJenis && data.dataPerJenis.length > 0">
              <tr v-for="(row, i) in data.dataPerJenis" :key="i">
                <td class="py-1 px-2 border-r border-gray-300">{{ row.jenis }}</td>
                <td class="py-1 px-2 text-right border-r border-gray-300">{{ $formatToRupiah(row.realisasi * 0.6) }}</td>
                <td class="py-1 px-2 text-right">{{ $formatToRupiah(row.realisasi * 0.4) }}</td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="3" class="text-center py-2">Data tidak ditemukan</td>
            </tr>$1</tbody>
        </table>`;

content = content.replace(table2Regex, table2Replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched LaporanPengumpulan.vue');
