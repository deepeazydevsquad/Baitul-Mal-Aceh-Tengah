<script setup lang="ts">
import { useRoute } from 'vue-router';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import { API_URL } from '@/config/config';
import { info_bukti_setoran } from '@/service/riwayat_zakat';
import { nextTick, onMounted, ref } from 'vue';
import { getCurrentInstance } from 'vue';

const BASE_URL = API_URL;
const route = useRoute();

// Global Properties
const { appContext } = getCurrentInstance()!;
const $terbilangUang = appContext.config.globalProperties.$terbilangUang;

interface BuktiSetoranData {
  invoice: string;
  waktu: {
    tanggal: string;
    bulan_str: string;
    bulan_num: string;
    tahun_lng: string;
    tahun_shrt: string;
  };
  member_fullname: string;
  wakalah?: string;
  jabatan_wakalah?: string;
  alamat: string;
  whatsapp_number: string;
  kode: string;
  tipe: string;
  nominal: number;
  nama_petugas: string;
  jabatan_petugas: string;
  lokasi: {
    id: number;
    desa_name: string;
    kecamatan_id: number;
    kecamatan_name: string;
  };
  lokasi_kantor: {
    nama_kabupaten_kota: string;
    alamat: string;
  };
}

const laporanData = ref<any[]>([]);
const isLoading = ref<boolean>(false);
const grandTotal = ref<number>(0);
const buktiData = ref<BuktiSetoranData>({} as BuktiSetoranData);

async function fetchData() {
  isLoading.value = true;
  try {
    const response = await info_bukti_setoran(route.params.id);
    buktiData.value = response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    laporanData.value = [];
    grandTotal.value = 0;
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  try {
    await fetchData();
    await nextTick();
    const oldTitle = document.title;
    document.title = `Bukti Setoran Zakat`;
    const styleId = 'print-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
            @page { size: A4 portrait;margin: 5mm 12mm;
     }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          `;
      document.head.appendChild(style);
    }
    setTimeout(() => {
      window.print();
      document.title = oldTitle;
      setTimeout(() => {
        window.close();
      }, 400);
    }, 1000);
  } catch (error) {
    console.error('Error saat mounting:', error);
  }
});
</script>

<template>
  <div v-if="isLoading" class="bg-white min-h-screen flex items-center justify-center">
    <LoadingSpinner label="Memuat halaman..." />
  </div>
  <div v-else class="min-h-screen p-4 print:p-0 print:m-0">
    <div class="print-area font-sans" style="color: black; font-size: 9pt; line-height: 1.3">
      <!-- ===== BAGIAN ATAS ===== -->
      <div class="flex flex-col min-h-[130mm]">
        <!-- Header -->
        <div class="grid grid-cols-[90px_1fr_auto] items-start mb-3">
          <div>
            <img
              :src="`${BASE_URL}/uploads/img/logos/site_logo.png`"
              class="h-[15mm] max-w-[60mm] object-contain"
            />
          </div>
          <div></div>
          <div class="text-right leading-tight">
            <div class="font-bold text-[11pt] uppercase">SEKRETARIAT</div>
            <div class="font-bold text-[9pt] uppercase">
              BAITUL MAL {{ buktiData.lokasi_kantor?.nama_kabupaten_kota ?? '-' }}
            </div>
            <div class="text-[8pt] w-[290px] break-words whitespace-normal">
              {{ buktiData.lokasi_kantor?.alamat ?? '-' }}
            </div>
          </div>
        </div>

        <!-- Isi / Tabel -->
        <div class="flex-1">
          <!-- isi laporan / tabel -->
          <table class="border-collapse text-[8pt] mb-2 w-full">
            <colgroup>
              <col style="width: 45mm" />
              <col style="width: 5mm" />
              <col style="width: auto" />
            </colgroup>
            <thead>
              <tr>
                <th colspan="4" class="border px-2 py-2 text-center">Tanda Penerimaan Zakat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-2 pt-4 pb-1">No. Invoice</td>
                <td class="px-2 pt-4 pb-1 text-center">:</td>
                <td class="px-2 pt-4 pb-1 font-bold">#{{ buktiData.invoice }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Sudah terima dari</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">{{ buktiData.member_fullname }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Alamat</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">
                  {{ buktiData.lokasi?.desa_name }}, {{ buktiData.lokasi?.kecamatan_name }}
                </td>
              </tr>
              <tr>
                <td class="px-2 py-1">No. Tlp/ Hp</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">{{ buktiData.whatsapp_number }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Jenis Pembayaran</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">{{ buktiData.tipe }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Jumlah uang</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">
                  Rp {{ buktiData.nominal?.toLocaleString('id-ID') || '0' }},-
                </td>
              </tr>
              <tr>
                <td class="px-2 py-1">Terbilang</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1 italic">
                  {{ $terbilangUang(buktiData.nominal, { case: 'title', currency: 'Rupiah' }) }}
                </td>
              </tr>
            </tbody>
          </table>

          <table class="border-collapse text-[8pt] mt-1 w-full">
            <colgroup>
              <col style="width: auto" />
              <col style="width: 45mm" />
              <col style="width: 45mm" />
              <col style="width: auto" />
            </colgroup>
            <tbody>
              <tr>
                <td class="px-2 pt-4 pb-1 text-center">
                  {{ buktiData.lokasi_kantor?.nama_kabupaten_kota ?? '-' }},
                  {{ buktiData.waktu?.tanggal || '—' }} {{ buktiData.waktu?.bulan_str || '—' }}
                  {{ buktiData.waktu?.tahun_lng || '—' }}
                </td>
                <td class="px-2 pt-4 pb-1 text-center"></td>
                <td class="px-2 pt-4 pb-1 text-center"></td>
                <td class="px-2 pt-4 pb-1 text-center"></td>
              </tr>
              <tr>
                <td class="px-2 pt-1 pb-1 text-center font-bold">Diterima Oleh</td>
                <td class="px-2 pt-1 pb-1 text-center"></td>
                <td class="px-2 pt-1 pb-1 text-center"></td>
                <td class="px-2 pt-1 pb-1 text-center font-bold">Penyetor</td>
              </tr>
              <tr>
                <td class="px-2 pt-0 pb-1 text-center">
                  {{ buktiData.jabatan_petugas || 'Staff Penerima' }}
                </td>
                <td class="px-2 pt-0 pb-1 text-center"></td>
                <td class="px-2 pt-0 pb-1 text-center"></td>
                <td class="px-2 pt-0 pb-1 text-center">
                  {{ buktiData.wakalah != null ? '(' + buktiData.jabatan_wakalah + ')' : '' }}
                </td>
              </tr>
              <tr>
                <td class="px-2 pt-8 pb-1 text-center">
                  {{ buktiData.nama_petugas || '________________' }}
                </td>
                <td class="px-2 pt-8 pb-1 text-center"></td>
                <td class="px-2 pt-8 pb-1 text-center"></td>
                <td class="px-2 pt-8 pb-1 text-center">
                  {{ buktiData.wakalah != null ? buktiData.wakalah : buktiData.member_fullname }}
                </td>
              </tr>

              <tr>
                <td class="px-2 pt-6 pb-1 text-center italic font-xs" colspan="4">
                  YA ALLAH BERIKANLAH PAHALA ATAS ZAKAT YANG DITUNAIKAN DAN BERKAHILAH HARTA YANG
                  LAINNYA. AMIN
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="mt-auto pt-2 border-t border-gray-300">
          <div class="grid grid-cols-3 items-center text-[8pt] text-gray-600">
            <!-- Kiri -->
            <div class="flex items-center gap-2">
              <img src="/images/ziwah.png" alt="Logo ZIWAH" class="h-8 object-contain" />
            </div>

            <!-- Tengah -->
            <div class="text-center">
              Dicetak pada:
              {{
                (() => {
                  const d = new Date();
                  const pad = (n: number) => n.toString().padStart(2, '0');

                  return (
                    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
                    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
                  );
                })()
              }}
            </div>
            <!-- Kanan -->
            <div class="text-right"></div>
          </div>
        </div>
      </div>

      <!-- ===== GARIS POTONG ===== -->
      <div class="relative my-7">
        <div class="border-t border-dashed border-black"></div>
        <div class="absolute left-1/2 -top-3 -translate-x-1/2 bg-white px-2 pt-1 text-[10pt]">
          ✂
        </div>
      </div>

      <!-- ===== BAGIAN BAWAH ===== -->
      <div class="flex flex-col min-h-[130mm]">
        <!-- Header -->
        <div class="grid grid-cols-[90px_1fr_auto] items-start mb-3">
          <div>
            <img
              :src="`${BASE_URL}/uploads/img/logos/site_logo.png`"
              class="h-[15mm] max-w-[60mm] object-contain"
            />
          </div>
          <div></div>
          <div class="text-right leading-tight">
            <div class="font-bold text-[11pt] uppercase">SEKRETARIAT</div>
            <div class="font-bold text-[9pt] uppercase">
              BAITUL MAL {{ buktiData.lokasi_kantor?.nama_kabupaten_kota ?? '-' }}
            </div>

            <div class="text-[8pt] w-[290px] break-words whitespace-normal">
              {{ buktiData.lokasi_kantor?.alamat ?? '-' }}
            </div>
          </div>
        </div>

        <!-- Isi / Tabel -->
        <div class="flex-1">
          <!-- isi laporan / tabel -->
          <table class="border-collapse text-[8pt] mb-2 w-full">
            <colgroup>
              <col style="width: 45mm" />
              <col style="width: 5mm" />
              <col style="width: auto" />
            </colgroup>
            <thead>
              <tr>
                <th colspan="4" class="border px-2 py-2 text-center">Tanda Penerimaan Zakat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-2 pt-4 pb-1">No. Invoice</td>
                <td class="px-2 pt-4 pb-1 text-center">:</td>
                <td class="px-2 pt-4 pb-1 font-bold">#{{ buktiData.invoice }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Sudah terima dari</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">{{ buktiData.member_fullname }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Alamat</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">
                  {{ buktiData.lokasi?.desa_name }}, {{ buktiData.lokasi?.kecamatan_name }}
                </td>
              </tr>
              <tr>
                <td class="px-2 py-1">No. Tlp/ Hp</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">{{ buktiData.whatsapp_number }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Jenis Pembayaran</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">{{ buktiData.tipe }}</td>
              </tr>
              <tr>
                <td class="px-2 py-1">Jumlah uang</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1">
                  Rp {{ buktiData.nominal?.toLocaleString('id-ID') || '0' }},-
                </td>
              </tr>
              <tr>
                <td class="px-2 py-1">Terbilang</td>
                <td class="px-2 py-1 text-center">:</td>
                <td class="px-2 py-1 italic">
                  {{ $terbilangUang(buktiData.nominal, { case: 'title', currency: 'Rupiah' }) }}
                </td>
              </tr>
            </tbody>
          </table>

          <table class="border-collapse text-[8pt] mt-1 w-full">
            <colgroup>
              <col style="width: auto" />
              <col style="width: 45mm" />
              <col style="width: 45mm" />
              <col style="width: auto" />
            </colgroup>
            <tbody>
              <tr>
                <td class="px-2 pt-4 pb-1 text-center">
                  {{ buktiData.lokasi_kantor?.nama_kabupaten_kota ?? '-' }},
                  {{ buktiData.waktu?.tanggal || '—' }} {{ buktiData.waktu?.bulan_str || '—' }}
                  {{ buktiData.waktu?.tahun_lng || '—' }}
                </td>
                <td class="px-2 pt-4 pb-1 text-center"></td>
                <td class="px-2 pt-4 pb-1 text-center"></td>
                <td class="px-2 pt-4 pb-1 text-center"></td>
              </tr>
              <tr>
                <td class="px-2 pt-1 pb-1 text-center font-bold">Diterima Oleh</td>
                <td class="px-2 pt-1 pb-1 text-center"></td>
                <td class="px-2 pt-1 pb-1 text-center"></td>
                <td class="px-2 pt-1 pb-1 text-center font-bold">Penyetor</td>
              </tr>
              <tr>
                <td class="px-2 pt-0 pb-1 text-center">
                  {{ buktiData.jabatan_petugas || 'Staff Penerima' }}
                </td>
                <td class="px-2 pt-0 pb-1 text-center"></td>
                <td class="px-2 pt-0 pb-1 text-center"></td>
                <td class="px-2 pt-0 pb-1 text-center">
                  {{ buktiData.wakalah != null ? '(' + buktiData.jabatan_wakalah + ')' : '' }}
                </td>
              </tr>
              <tr>
                <td class="px-2 pt-8 pb-1 text-center">
                  {{ buktiData.nama_petugas || '________________' }}
                </td>
                <td class="px-2 pt-8 pb-1 text-center"></td>
                <td class="px-2 pt-8 pb-1 text-center"></td>
                <td class="px-2 pt-8 pb-1 text-center">
                  {{ buktiData.wakalah != null ? buktiData.wakalah : buktiData.member_fullname }}
                </td>
              </tr>

              <tr>
                <td class="px-2 pt-6 pb-1 text-center italic font-xs" colspan="4">
                  YA ALLAH BERIKANLAH PAHALA ATAS ZAKAT YANG DITUNAIKAN DAN BERKAHILAH HARTA YANG
                  LAINNYA. AMIN
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="mt-auto pt-2 border-t border-gray-300">
          <div class="grid grid-cols-3 items-center text-[8pt] text-gray-600">
            <!-- Kiri -->
            <div class="flex items-center gap-2">
              <img src="/images/ziwah.png" alt="Logo ZIWAH" class="h-8 object-contain" />
            </div>

            <!-- Tengah -->
            <div class="text-center">
              Dicetak pada:
              {{
                (() => {
                  const d = new Date();
                  const pad = (n: number) => n.toString().padStart(2, '0');

                  return (
                    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
                    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
                  );
                })()
              }}
            </div>
            <div class="text-right"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-area {
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 10mm;
  background: white;
}

@media screen {
  body {
    background: #f3f4f6;
  }
  .print-area {
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
    margin-top: 0px;
  }
}

@media print {
  @page {
    size: A4 portrait;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body,
  html {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    border: 1px solid black !important;
    word-wrap: break-word;
  }

  td {
    border: none !important;
  }

  thead th {
    background: #f3f4f6 !important;
    font-weight: 700 !important;
  }

  tbody tr {
    page-break-inside: avoid !important;
  }

  .bg-gray-100 {
    background: #f3f4f6 !important;
  }
}
</style>
