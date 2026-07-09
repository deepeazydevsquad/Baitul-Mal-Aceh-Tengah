<script setup lang="ts">
// Library
import { ref, onMounted, watch, computed } from 'vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import ButtonGreen from '@/components/Button/ButtonGreen.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import BaseSelect from '@/components/Form/BaseSelect.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import FormRealisasiPermohonan from '@/modules/BakalPenerimaBantuan/widgets/FormRealisasiPermohonan.vue';
import FormUploadBeritaAcara from '@/modules/BakalPenerimaBantuan/widgets/FormUploadBeritaAcara.vue';
import FormUploadMassalBeritaAcara from '@/modules/BakalPenerimaBantuan/widgets/FormUploadMassalBeritaAcara.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

import { RefreshBakal } from '@/stores/refresh';
const refreshBakal = RefreshBakal();

// Service API
import {
  batal_bakal_penerima_bantuan,
  get_bakal_penerima_bantuan,
  get_filter_type,
} from '@/service/bakal_penerima_bantuan';

// API
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(3);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface BakalPenerimaBantuan {
  id: number;
  bulan: string | null;
  status: string;
  status_realisasi: string | null;
  tipe: string;
  bukti_transfer: string | null;
  berita_acara: string | null;
  mou: string | null;
  tanggal_realisasi: string | null;
  nominal_realisasi: number | null;
  biaya_disetujui: number;
  Permohonan: {
    id: number;
    bank_name: string;
    nomor_akun_bank: string;
    nama_akun_bank: string;
    status: string;
    member_name: string;
    member_tipe: string;
    desa_name: string | null;
    kecamatan_name: string | null;
    Kegiatan: {
      id: number;
      nama_kegiatan: string;
      jumlah_dana: number;
      sumber_dana: string;
      sisa_dana: number;
      area_penyaluran: string;
      status_kegiatan: string;
      tahun: number;
    };
  };
}

const dataBakalPenerimaBantuan = ref<BakalPenerimaBantuan[]>([]);

const tableColumns = ref<TableColumn[]>([
  { key: 'info_permohonan', label: 'Info Permohonan & Kegiatan', headerClass: 'w-[60%] text-center', cellClass: 'text-left align-top' },
  { key: 'info_realisasi', label: 'Info Realisasi', headerClass: 'w-[40%] text-center', cellClass: 'text-left align-top' },
]);

// Function: Modal
const selectedData = ref<any>(null);
const isModalUploadMassalOpen = ref(false);
const isModalUploadBeritaAcaraOpen = ref(false);
const isModalRealisasiOpen = ref(false);

function openModalUploadMassal() {
  if (!selectedKegiatan.value || selectedKegiatan.value === 0) {
    displayNotification('Pilih kegiatan pada filter terlebih dahulu', 'warning', 3000);
    return;
  }

  if (totalRow.value === 0) {
    displayNotification(
      `Pemohon bantuan untuk program ${kegiatanOption.value.find((item) => item.value === parseInt(selectedKegiatan.value))?.label} yang sudah direalisasi dan belum upload berita acara tidak ditemukan.`,
      'warning',
      4000,
    );
    return;
  }

  isModalUploadMassalOpen.value = true;
}

function openModalUploadBeritaAcara(data: any) {
  selectedData.value = data;
  isModalUploadBeritaAcaraOpen.value = true;
}

function openModalUploadBuktiTransfer(data: any) {
  selectedData.value = data;
  isModalRealisasiOpen.value = true;
}

// Function: View Files
function viewBeritaAcara(data: any) {
  if (data.berita_acara) {
    window.open(
      BASE_URL + `/uploads/dokumen/bakal_penerima_bantuan/berita_acara/${data.berita_acara}`,
      '_blank',
    );
  } else {
    displayNotification('Berita acara belum diupload', 'warning');
  }
}

function viewFile(data: any) {
  if (data.bukti_transfer) {
    window.open(
      BASE_URL + `/uploads/dokumen/bakal_penerima_bantuan/bukti_realisasi/${data.bukti_transfer}`,
      '_blank',
    );
  } else if (data.mou) {
    window.open(
      BASE_URL + `/uploads/dokumen/bakal_penerima_bantuan/bukti_realisasi/${data.mou}`,
      '_blank',
    );
  } else {
    displayNotification('Bukti transfer atau mou belum diupload', 'warning');
  }
}

// Function: Fetch Data
const kegiatanOption = ref<{ value: string; label: string }[]>([]);
const statusKegiatanOption = ref<{ value: string; label: string }[]>([
  { value: 'selesai', label: 'Selesai' },
  { value: 'sedang_berlangsung', label: 'Sedang Berlangsung' },
]);
const statusRealisasiOption = ref<{ value: string; label: string }[]>([
  { value: 'belum_direalisasi', label: 'Belum Direalisasi' },
  { value: 'sudah_direalisasi', label: 'Sudah Direalisasi' },
]);

const selectedKegiatan = ref<number | null>(null);
const selectedStatusKegiatan = ref('sedang_berlangsung');
const selectedStatusRealisasi = ref('belum_direalisasi');
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const [response, filterTypeResponse] = await Promise.all([
      get_bakal_penerima_bantuan({
        search: search.value,
        perpage: perPage.value,
        pageNumber: currentPage.value,
        type_kegiatan: selectedKegiatan.value,
        type_status_kegiatan: selectedStatusKegiatan.value,
        type_status_realisasi: selectedStatusRealisasi.value,
      }),
      get_filter_type(),
    ]);

    dataBakalPenerimaBantuan.value = response.data;
    totalRow.value = response.total;

    kegiatanOption.value = filterTypeResponse.data;
  } catch (error) {
    displayNotification('Gagal mengambil data bakal penerima bantuan', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

// Function: Batal Data
async function batalData(id: number) {
  displayConfirmation(
    'Batal Data Bakal Penerima Bantuan',
    'Apakah Anda yakin ingin membatalkan data bakal penerima bantuan ini?',
    async () => {
      try {
        isLoading.value = true;
        await batal_bakal_penerima_bantuan(id);
        displayNotification('Data bakal penerima bantuan berhasil dibatal', 'success');
        await fetchData();
      } catch (error: any) {
        displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}

// Function: Format Area Penyaluran
function formatAreaPenyaluran(area: string): string {
  const areaMap: Record<string, string> = {
    semua_pemohon: 'SEMUA PEMOHON',
    kabupaten: 'KABUPATEN',
    instansi: 'INSTANSI',
    kecamatan: 'KECAMATAN',
    desa: 'DESA',
  };
  return areaMap[area] || '-';
}

// Function: Format Tanggal
function formatTanggal(tanggal: string | null): string {
  if (!tanggal) return '-';
  const date = new Date(tanggal);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

watch(
  () => refreshBakal.getBool,
  async () => {
    if (refreshBakal.getBool == true) {
      await fetchData();
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
          empty-title="Tidak ada data"
          empty-desc="Belum ada data bakal penerima bantuan."
          empty-icon="fa-solid fa-people-carry-box"
        :columns="tableColumns"
        :data="dataBakalPenerimaBantuan"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Nama / NIK Pemohon . . ."
        @search="search = $event; fetchData()"
        :show-add="false"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #custom-actions>
          <BaseButton
            @click="openModalUploadMassal()"
            :loading="isModalUploadBeritaAcaraOpen || isModalRealisasiOpen || isModalUploadMassalOpen"
            variant="primary"
            type="button"
          >
            <font-awesome-icon icon="fa-solid fa-cloud-arrow-up" class="mr-2" />
            Upload Massal Berita Acara
          </BaseButton>
        </template>
        <template #filters>
          <div class="flex items-center gap-2">
            <BaseSelect
              v-model="selectedKegiatan"
              :options="kegiatanOption"
              placeholder="Semua Kegiatan"
              @change="fetchData"
            />
            <BaseSelect
              v-model="selectedStatusKegiatan"
              :options="statusKegiatanOption"
              placeholder="Semua Status"
              @change="fetchData"
            />
            <BaseSelect
              v-model="selectedStatusRealisasi"
              :options="statusRealisasiOption"
              placeholder="Semua Status"
              @change="fetchData"
            />
          </div>
        </template>
        
        

        <!-- Kolom Info Permohonan & Kegiatan -->
        <template #cell-info_permohonan="{ row: data }">
          <!-- Header Card -->
          <div
            class="bg-gradient-to-r from-green-800 to-green-700 rounded-lg px-4 py-3 mb-3"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="text-white font-bold text-base">
                  {{ data.Permohonan.member_name }}
                </h3>
                <p class="text-blue-100 text-sm mt-1">
                  {{ data.Permohonan.desa_name }}, {{ data.Permohonan.kecamatan_name }}
                </p>
              </div>
              <div class="text-right">
                <span
                  class="inline-block px-2 py-1 bg-white/20 text-white rounded text-sm font-semibold"
                >
                  {{
                    data.Permohonan.member_tipe === 'perorangan' ? 'PERORANGAN' : 'INSTANSI'
                  }}
                </span>
                <p v-if="data.bulan" class="text-blue-100 text-sm mt-1">
                  Periode: Bulan {{ data.bulan }}
                </p>
              </div>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Info Kegiatan -->
            <div class="bg-gray-50 rounded-lg p-3 space-y-2">
              <h4 class="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                <font-awesome-icon
                  icon="fa-solid fa-calendar-days"
                  class="text-green-600"
                />
                Info Kegiatan
              </h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">Kegiatan:</span>
                  <span class="font-semibold text-gray-800 text-right">{{
                    data.Permohonan.Kegiatan.nama_kegiatan
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Total Dana:</span>
                  <span class="font-semibold text-gray-800">{{
                    $formatToRupiah(data.Permohonan.Kegiatan.jumlah_dana)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Sisa Dana:</span>
                  <span class="font-bold text-red-600">
                    {{
                      data.Permohonan.Kegiatan.sisa_dana
                        ? $formatToRupiah(data.Permohonan.Kegiatan.sisa_dana)
                        : '-'
                    }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Sumber:</span>
                  <span class="font-semibold text-gray-800">{{
                    data.Permohonan.Kegiatan.sumber_dana.toUpperCase()
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tahun:</span>
                  <span class="font-semibold text-gray-800">{{
                    data.Permohonan.Kegiatan.tahun
                  }}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">Area:</span>
                  <span class="font-semibold text-gray-800 text-right">{{
                    formatAreaPenyaluran(data.Permohonan.Kegiatan.area_penyaluran)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Info Bank -->
            <div class="bg-gray-50 rounded-lg p-3 space-y-2">
              <h4 class="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                <font-awesome-icon
                  icon="fa-solid fa-building-columns"
                  class="text-green-600"
                />
                Info Bank
              </h4>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Bank:</span>
                  <span class="font-semibold text-gray-800">{{
                    data.Permohonan.bank_name
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">No. Rek:</span>
                  <span class="font-semibold text-gray-800">{{
                    data.Permohonan.nomor_akun_bank
                  }}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <span class="text-gray-600">A/N:</span>
                  <span class="font-semibold text-gray-800 text-right">{{
                    data.Permohonan.nama_akun_bank
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Nominal Bantuan -->
          <div class="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <font-awesome-icon
                  icon="fa-solid fa-money-bill-wave"
                  class="text-green-600"
                />
                <span class="font-semibold text-gray-700 text-sm">Biaya Disetujui:</span>
              </div>
              <span class="font-bold text-green-700 text-lg">
                {{ $formatToRupiah(data.biaya_disetujui) }}
              </span>
            </div>
          </div>
        </template>

        <!-- Kolom Info Realisasi -->
        <template #cell-info_realisasi="{ row: data }">
          <div class="space-y-3">
            <!-- Status Realisasi -->
            <div class="bg-gray-50 rounded-lg p-3">
              <h4 class="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <font-awesome-icon
                  icon="fa-solid fa-clipboard-check"
                  class="text-green-600"
                />
                Status Realisasi
              </h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Status:</span>
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs font-semibold',
                      data.status_realisasi === 'sudah_direalisasi'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700',
                    ]"
                  >
                    {{
                      data.status_realisasi === 'sudah_direalisasi'
                        ? 'SUDAH DIREALISASI'
                        : 'BELUM DIREALISASI'
                    }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Tipe:</span>
                  <span class="font-semibold text-gray-800">{{
                    data.tipe === 'transfer' ? 'TRANSFER' : 'BANTUAN LANSUNG'
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600">Tanggal:</span>
                  <span class="font-semibold text-gray-800">{{
                    formatTanggal(data.tanggal_realisasi)
                  }}</span>
                </div>
                <div
                  v-if="data.nominal_realisasi"
                  class="flex justify-between items-center pt-2 border-t border-gray-200"
                >
                  <span class="text-gray-600">Nominal:</span>
                  <span class="font-bold text-green-700">
                    {{ $formatToRupiah(data.nominal_realisasi) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Dokumen -->
            <div class="bg-gray-50 rounded-lg p-3">
              <h4 class="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <font-awesome-icon icon="fa-solid fa-file-lines" class="text-green-600" />
                Dokumen
              </h4>
              <div class="space-y-2">
                <!-- Berita Acara -->
                <div
                  v-if="data.berita_acara"
                  class="flex justify-between items-center text-sm"
                >
                  <span class="text-gray-600">Berita Acara:</span>
                  <button
                    v-if="data.berita_acara"
                    @click="viewBeritaAcara(data)"
                    class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                  >
                    <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />
                    Lihat
                  </button>
                  <span v-else class="text-gray-400 text-xs">Belum upload</span>
                </div>

                <!-- Bukti Transfer -->
                <div
                  v-if="data.bukti_transfer"
                  class="flex justify-between items-center text-sm"
                >
                  <span class="text-gray-600">Bukti Transfer:</span>
                  <button
                    v-if="data.bukti_transfer"
                    @click="viewFile(data)"
                    class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                  >
                    <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />
                    Lihat
                  </button>
                  <span v-else class="text-gray-400 text-xs">Belum upload</span>
                </div>

                <!-- Bukti Mou -->
                <div v-if="data.mou" class="flex justify-between items-center text-sm">
                  <span class="text-gray-600">Bukti MOU:</span>
                  <button
                    v-if="data.mou"
                    @click="viewFile(data)"
                    class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                  >
                    <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />
                    Lihat
                  </button>
                  <span v-else class="text-gray-400 text-xs">Belum upload</span>
                </div>

                <!-- Dokumen kosong -->
                <div
                  v-if="!data.berita_acara && !data.bukti_transfer && !data.mou"
                  class="flex flex-col justify-center items-center text-center text-gray-400 p-6 gap-2"
                >
                  <font-awesome-icon icon="fa-solid fa-file-lines" class="text-2xl" />
                  <span class="text-md"> Belum ada satupun dokumen terupload </span>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template #row-actions="{ row: data }">
          <div class="flex flex-col gap-2 items-center">
            <!-- Realisasi Permohonan -->
            <LightButton
              v-if="data.status_realisasi === 'belum_direalisasi'"
              @click="openModalUploadBuktiTransfer(data)"
              title="Realisasi Permohonan"
            >
              <font-awesome-icon icon="fa-solid fa-money-bill-wave" />
            </LightButton>

            <!-- Upload Berita Acara -->
            <ButtonGreen
              v-if="data.status_realisasi === 'sudah_direalisasi' && !data.berita_acara"
              @click="openModalUploadBeritaAcara(data)"
              title="Upload Berita Acara"
            >
              <font-awesome-icon icon="fa-solid fa-cloud-arrow-up" />
            </ButtonGreen>

            <!-- Delete -->
            <DangerButton
              v-if="data.bukti_transfer || data.mou"
              @click="batalData(data.id)"
              title="Batalkan realisasi bantuan"
            >
              <font-awesome-icon icon="fa-solid fa-ban" />
            </DangerButton>
          </div>
        </template>
      </BaseTable>
      </div>
    </div>

    <!-- Modal Upload Massal Berita Acara -->
    <FormUploadMassalBeritaAcara
      :is-modal-open="isModalUploadMassalOpen"
      :kegiatan_id="selectedKegiatan"
      @close="
        isModalUploadMassalOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Upload massal berita acara gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Upload Berita Acara -->
    <FormUploadBeritaAcara
      :is-modal-open="isModalUploadBeritaAcaraOpen"
      :selected-data="selectedData"
      @close="
        isModalUploadBeritaAcaraOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Upload berita acara gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Upload Bukti Transfer -->
    <FormRealisasiPermohonan
      :is-modal-open="isModalRealisasiOpen"
      :selected-data="selectedData"
      @close="
        isModalRealisasiOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Upload bukti transfer gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Confirmation -->
    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <BaseButton variant="secondary" @click="cancel">Tidak</BaseButton>
      <BaseButton variant="warning" @click="confirm">Ya</BaseButton>
    </Confirmation>

    <!-- Notification -->
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
