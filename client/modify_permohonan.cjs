const fs = require('fs');
let file = 'src/modules/PermohonanBantuan/PermohonanBantuan.vue';
let content = fs.readFileSync(file, 'utf8');

const startInfo = content.indexOf('<template #cell-info_permohonan=\"{ row }\">');
const endInfo = content.indexOf('<template #cell-kriteria=\"{ row }\">');
const newInfo = `<template #cell-info_permohonan="{ row }">
          <div class="space-y-3">
            <!-- Info Pemohon Table -->
            <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table class="w-full">
                <tbody>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase w-[35%]">
                      Nama Pemohon
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-800 font-medium">
                      {{ row.Permohonan.member_name }}
                      <span class="ml-2 inline-flex px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-semibold">
                        {{ row.Permohonan.member_tipe === 'perorangan' ? 'PERORANGAN' : 'INSTANSI' }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Alamat / Lokasi
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ row.Permohonan.desa_name || '-' }},
                      {{ row.Permohonan.kecamatan_name || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Info Kegiatan Table -->
            <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table class="w-full">
                <tbody>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase w-[35%]">
                      Kegiatan
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-800 font-medium">
                      {{ row.Permohonan.Kegiatan.nama_kegiatan }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Sumber & Tahun
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ row.Permohonan.Kegiatan.sumber_dana === 'zakat' ? 'ZAKAT' : 'INFAQ' }} ({{ row.Permohonan.Kegiatan.tahun }})
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Dana Kegiatan
                    </th>
                    <td class="px-4 py-3 text-sm">
                       Total: <span class="font-semibold text-gray-800">{{ row.Permohonan.Kegiatan.jumlah_dana ? $formatToRupiah(row.Permohonan.Kegiatan.jumlah_dana) : '-' }}</span>
                       | Sisa: <span class="font-bold text-red-600">{{ row.Permohonan.Kegiatan.sisa_jumlah_dana ? $formatToRupiah(row.Permohonan.Kegiatan.sisa_jumlah_dana) : '-' }}</span>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Status Kegiatan
                    </th>
                    <td class="px-4 py-3 text-sm">
                       <span class="inline-flex px-2 py-0.5 rounded text-xs font-semibold" :class="row.Permohonan.Kegiatan.status_kegiatan === 'sedang_berlangsung' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'">
                          {{ row.Permohonan.Kegiatan.status_kegiatan === 'sedang_berlangsung' ? 'BERLANGSUNG' : 'SELESAI' }}
                       </span>
                       | Area: {{ formatAreaPenyaluran(row.Permohonan.Kegiatan.area_penyaluran) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Info Rekening & Realisasi -->
            <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table class="w-full">
                <tbody>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase w-[35%]">
                      Info Bank
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ row.Permohonan.bank_name }} - {{ row.Permohonan.nomor_akun_bank }} <br/> A/N: {{ row.Permohonan.nama_akun_bank }}
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Realisasi
                    </th>
                    <td class="px-4 py-3 text-sm">
                       Biaya Disetujui: <span v-if="row.biaya_disetujui" class="font-bold text-green-700">{{ $formatToRupiah(row.biaya_disetujui) }}</span><span v-else class="font-bold text-red-600">Belum disetujui</span>
                       <template v-if="row.nominal_realisasi">
                         <br/> Nominal Realisasi: <span class="font-bold text-green-700">{{ $formatToRupiah(row.nominal_realisasi) }}</span>
                       </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
        
        `;
content = content.substring(0, startInfo) + newInfo + content.substring(endInfo);

const startKriteria = content.indexOf('<template #cell-kriteria="{ row }">');
const endKriteria = content.indexOf('<template #row-actions="{ row }">');
const newKriteria = `<template #cell-kriteria="{ row }">
          <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm h-full">
             <div class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-xs text-gray-900 uppercase">
                Kriteria Persyaratan ({{ row.Permohonan.Kegiatan.kriteria.length }})
             </div>
             <div class="p-4">
                <ul class="space-y-2">
                  <li
                    v-for="kriteria in row.Permohonan.Kegiatan.kriteria"
                    :key="kriteria.id"
                    class="flex items-start gap-2 text-sm"
                  >
                    <span class="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span class="text-gray-700">{{ kriteria.name }}</span>
                  </li>
                </ul>
                <div
                  v-if="row.Permohonan.Kegiatan.kriteria.length === 0"
                  class="text-center text-gray-400 text-sm py-4"
                >
                  <p>Tidak ada kriteria</p>
                </div>
             </div>
          </div>
        </template>
        
        `;
content = content.substring(0, startKriteria) + newKriteria + content.substring(endKriteria);

// Fix wrapper
content = content.replace(/<div class="mx-auto p-4">/, '<div class="p-4">');
content = content.replace(/<BaseTable/, '<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">\n        <BaseTable');
content = content.replace(/<\/BaseTable>\n    <\/div>/, '</BaseTable>\n      </div>\n    </div>');

fs.writeFileSync(file, content);
console.log('Done!');
