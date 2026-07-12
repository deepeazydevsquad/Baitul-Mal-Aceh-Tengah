const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'modules', 'Cetak', 'LaporanKesekretariatan.vue');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove imports
content = content.replace(/import BaseTable from '@\/components\/Table\/BaseTable\.vue';\n?/m, '');
content = content.replace(/import type \{ TableColumn \} from '@\/components\/Table\/BaseTable\.vue';\n?/m, '');

// 2. Remove tableColumns definition
const tableColumnsRegex = /const tableColumns = ref<TableColumn\[\]>\(\[[\s\S]*?\]\);\n?/m;
content = content.replace(tableColumnsRegex, '');

// 3. Replace template
const templateRegex = /<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">\s*<BaseTable[\s\S]*?<\/BaseTable>\s*<\/div>/m;
const replacement = `<table class="w-full text-[8pt] mt-4 mb-4 border-collapse print-table" style="table-layout: fixed">
        <thead class="bg-gray-100 border-b-2 border-gray-400">
          <tr>
            <th class="border border-black w-[10%] px-2 py-1 text-center">Tanggal</th>
            <th class="border border-black w-[25%] px-2 py-1 text-center">Uraian</th>
            <th class="border border-black w-[12%] px-2 py-1 text-center">NIK</th>
            <th class="border border-black w-[20%] px-2 py-1 text-center">Alamat</th>
            <th class="border border-black w-[8%] px-2 py-1 text-center">Kec</th>
            <th class="border border-black w-[10%] px-2 py-1 text-center">Kode Akun</th>
            <th class="border border-black w-[15%] px-2 py-1 text-center">Kredit</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <template v-if="formattedData.length > 0">
            <tr v-for="(row, index) in formattedData" :key="index" class="text-black text-[7pt]" style="page-break-inside: avoid">
              <td class="border border-black px-2 py-1 text-center whitespace-nowrap">{{ row.tanggal }}</td>
              <td class="border border-black px-2 py-1 text-left">{{ row.uraian }}</td>
              <td class="border border-black px-2 py-1 text-center">{{ row.nik }}</td>
              <td class="border border-black px-2 py-1 text-left">{{ row.alamat }}</td>
              <td class="border border-black px-2 py-1 text-center">{{ row.kec }}</td>
              <td class="border border-black px-2 py-1 text-center">{{ row.kode_akun }}</td>
              <td class="border border-black px-2 py-1 text-right whitespace-nowrap">{{ row.kredit }}</td>
            </tr>
            <tr class="font-bold text-black bg-gray-100">
              <td colspan="6" class="border border-black px-2 py-1 text-right">Total</td>
              <td class="border border-black px-2 py-1 text-right">
                {{ $formatToRupiah(grandTotal) }}
              </td>
            </tr>
          </template>
          <tr v-else>
            <td colspan="7" class="border border-black px-2 py-3 text-center text-gray-700">
              Data tidak ditemukan
            </td>
          </tr>
        </tbody>
      </table>`;
content = content.replace(templateRegex, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched LaporanKesekretariatan.vue');
