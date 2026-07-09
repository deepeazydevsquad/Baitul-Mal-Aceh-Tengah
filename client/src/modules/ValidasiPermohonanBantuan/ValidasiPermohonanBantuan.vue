<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import ButtonGreen from '@/components/Button/ButtonGreen.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import BaseSelect from '@/components/Form/BaseSelect.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import { onMounted, ref, watch } from 'vue';

// Form
import FormEditFile from '@/modules/ValidasiPermohonanBantuan/widgets/FormEditFile.vue';
import FormPemberitahuan from '@/modules/ValidasiPermohonanBantuan/widgets/FormPemberitahuan.vue';
import FormRejectBerkas from '@/modules/ValidasiPermohonanBantuan/widgets/FormRejectBerkas.vue';
import FormSetujuiPermohonan from '@/modules/ValidasiPermohonanBantuan/widgets/FormSetujuiPermohonan.vue';
import FormTolakPermohonan from '@/modules/ValidasiPermohonanBantuan/widgets/FormTolakPermohonan.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Config API
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

import { RefreshValidasi } from '@/stores/refresh';
const refreshValidasi = RefreshValidasi();

// Composable
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

// Service API
import {
  approve_berkas,
  get_filter_type,
  get_validasi_permohonan_bantuan,
} from '@/service/validasi_permohonan_bantuan';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(10);
const totalColumns = ref<number>(3);
const tableColumns = ref<TableColumn[]>([]);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface ValidasiPermohonanBantuan {
  realisasi_id: number;
  periode_bulan: number | null;
  status_realisasi: string;
  status: string;
  permohonan_id: number;
  status_permohonan: string;
  member_name: string;
  member_tipe: string;
  desa_name: string | null;
  kecamatan_name: string | null;
  bank_name: string;
  nomor_akun_bank: string;
  nama_akun_bank: string;
  kegiatan_id: number;
  nama_kegiatan: string;
  periode_bantuan: string;
  tahun_kegiatan: number;
  total_dana_kegiatan: number;
  sisa_dana_kegiatan: number;
  sumber_dana: string;
  area_penyaluran: string;
  syarat_persyaratan: {
    syarat_id: number;
    syarat_name: string;
    syarat_path: string;
    validasi_id: number | null;
    file_name: string | null;
    file_path: string | null;
    status_validasi: string | null;
    alasan_penolakan: string | null;
    has_file: boolean;
  }[];
  total_syarat: number;
  syarat_approved: number;
  syarat_rejected: number;
  syarat_process: number;
  syarat_pending: number;
  can_approve_permohonan: boolean;
}

const dataValidasiPermohonanBantuan = ref<ValidasiPermohonanBantuan[]>([]);

// Function: Modal
const selectedData = ref<any>(null);
const isModalPemberitahuanOpen = ref(false);
const isModalTolakOpen = ref(false);
const isModalSetujuiOpen = ref(false);
const isModalEditFileOpen = ref(false);
const isModalRejectBerkasOpen = ref(false);

function openModalPemberitahuan(data: any) {
  selectedData.value = data;
  isModalPemberitahuanOpen.value = true;
}

function openModalTolak(data: any) {
  selectedData.value = data;
  isModalTolakOpen.value = true;
}

function openModalSetujui(data: any) {
  selectedData.value = data;
  isModalSetujuiOpen.value = true;
}

// Function: Aksi Syarat
function viewFile(syarat: any) {
  window.open(BASEURL + `/uploads/dokumen/permohonan_bantuan/${syarat.file_path}`, '_blank');
}

function editFile(realisasi_id: number, syarat: any) {
  if (syarat.status_validasi === 'approve') {
    displayNotification(
      `Syarat ${syarat.syarat_name} telah selesai diproses dan tidak dapat diubah`,
      'warning',
      4000, // 4   detik
    );
  } else {
    selectedData.value = { realisasi_id, validasi_id: syarat.validasi_id };
    isModalEditFileOpen.value = true;
  }
  console.log('Edit file:', selectedData.value);
}

function openModalRejectBerkas(realisasi_id: number, data: any) {
  selectedData.value = { realisasi_id, validasi_id: data.validasi_id };
  isModalRejectBerkasOpen.value = true;
}

async function approveSyarat(realisasi_id: number, syarat: any) {
  displayConfirmation(
    'Konfirmasi Syarat',
    `Apakah anda yakin ingin menyetujui syarat ${syarat.syarat_name}?`,
    async () => {
      try {
        const response = await approve_berkas({
          id: realisasi_id,
          validasi_id: syarat.validasi_id,
        });
        console.log('Approve syarat:', syarat);
        displayNotification(response.error_msg || 'Syarat berhasil disetujui', 'success');
      } catch (error: any) {
        console.error('Error updating file:', error);
        displayNotification(
          error.response?.data?.message || error.response?.data?.error_msg || 'Terjadi kesalahan',
          'error',
        );
      } finally {
        fetchData();
      }
    },
  );
}

// Function: Fetch Data
const kegiatanOption = ref<{ value: string; label: string }[]>([]);
const selectedKegiatan = ref(null);
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const [response, filterTypeResponse] = await Promise.all([
      get_validasi_permohonan_bantuan({
        search: search.value,
        perpage: perPage.value,
        pageNumber: currentPage.value,
        type_kegiatan_id: selectedKegiatan.value,
      }),
      get_filter_type(),
    ]);

    dataValidasiPermohonanBantuan.value = response.data;
    totalRow.value = response.total;

    refreshValidasi.setBool(false);

    kegiatanOption.value = filterTypeResponse.data;
  } catch (error) {
    displayNotification('Gagal mengambil data validasi permohonan bantuan', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

watch(
  () => refreshValidasi.getBool,
  async () => {
    if (refreshValidasi.getBool == true) {
      await fetchData();
    }
  },
  { deep: true },
);
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow mt-4">
        <BaseTable
          class="w-full border-collapse bg-white text-sm"
          :columns="tableColumns"
          :data="dataValidasiPermohonanBantuan"
          :loading="isTableLoading"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          @page-change="pageNow"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #filters>
            <div class="flex items-center w-full sm:w-auto gap-2">
              <BaseSelect
                v-model="selectedKegiatan"
                :options="kegiatanOption"
                placeholder="Semua Kegiatan"
                @change="fetchData"
              />

              <input
                id="search"
                type="text"
                v-model="search"
                @change="fetchData"
                placeholder="Cari Nama / NIK Pemohon . . ."
                class="w-full sm:w-86 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
              />
            </div>
          </template>

          <template #actions>
            <BaseButton @click="fetchData" variant="primary" :loading="isTableLoading">
              <font-awesome-icon icon="fa-solid fa-clock-rotate-left" class="mr-2" />
              Refresh
            </BaseButton>
          </template>
          <template #thead>
            <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
              <tr>
                <th class="w-[50%] px-4 py-3 font-medium">Info Permohonan & Kegiatan</th>
                <th class="w-[45%] px-4 py-3 font-medium">Syarat Persyaratan</th>
                <th class="w-[5%] px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100 text-sm align-top">
              <template v-if="dataValidasiPermohonanBantuan.length > 0">
                <tr
                  v-for="data in dataValidasiPermohonanBantuan"
                  :key="data.realisasi_id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <!-- Kolom Info Permohonan & Kegiatan -->
                  <td class="px-4 py-4">
                    <!-- Header Card -->
                    <div
                      class="bg-gradient-to-r from-green-800 to-green-700 rounded-lg px-4 py-3 mb-3"
                    >
                      <div class="flex justify-between items-start">
                        <div>
                          <h3 class="text-white font-bold text-base">{{ data.member_name }}</h3>
                          <p class="text-blue-100 text-sm mt-1">
                            {{ data.desa_name }}, {{ data.kecamatan_name }}
                          </p>
                        </div>
                        <div class="text-right">
                          <span
                            class="inline-block px-2 py-1 bg-white/20 text-white rounded text-sm font-semibold"
                          >
                            {{ data.member_tipe === 'perorangan' ? 'PERORANGAN' : 'INSTANSI' }}
                          </span>
                          <p class="text-blue-100 text-sm mt-1">
                            Periode:
                            {{
                              data.periode_bantuan === 'bulanan'
                                ? `Bulan ${data.periode_bulan}`
                                : 'Tahunan'
                            }}
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
                          <div class="flex justify-between">
                            <span class="text-gray-600">Kegiatan:</span>
                            <span class="font-semibold text-gray-800 text-right">{{
                              data.nama_kegiatan
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-600">Total Dana:</span>
                            <span class="font-semibold text-gray-800">{{
                              $formatToRupiah(data.total_dana_kegiatan)
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-600">Sisa Dana:</span>
                            <span class="font-bold text-red-600">{{
                              $formatToRupiah(data.sisa_dana_kegiatan)
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-600">Sumber:</span>
                            <span class="font-semibold text-gray-800">{{
                              data.sumber_dana.toUpperCase()
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
                            <span class="font-semibold text-gray-800">{{ data.bank_name }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-600">No. Rek:</span>
                            <span class="font-semibold text-gray-800">{{
                              data.nomor_akun_bank
                            }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-600">A/N:</span>
                            <span class="font-semibold text-gray-800">{{ data.nama_akun_bank }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Status Badge -->
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span
                        class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold"
                      >
                        <font-awesome-icon icon="fa-solid fa-circle-check" class="text-sm" />
                        Disetujui: {{ data.syarat_approved }}
                      </span>
                      <span
                        class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold"
                      >
                        <font-awesome-icon icon="fa-solid fa-circle-xmark" class="text-sm" />
                        Ditolak: {{ data.syarat_rejected }}
                      </span>
                      <span
                        class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-semibold"
                      >
                        <font-awesome-icon icon="fa-solid fa-clock" class="text-sm" />
                        Proses: {{ data.syarat_process }}
                      </span>
                      <span
                        class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold"
                      >
                        <font-awesome-icon icon="fa-solid fa-file" class="text-sm" />
                        Pending: {{ data.syarat_pending }}
                      </span>
                    </div>
                  </td>

                  <!-- Kolom Syarat Persyaratan -->
                  <td class="px-4 py-4">
                    <div class="border border-gray-200 rounded-lg overflow-hidden">
                      <BaseTable
                        class="w-full text-sm"
                        :columns="tableColumns"
                        :data="data.syarat_persyaratan"
                        :with-pagination="false"
                        :show-search="false"
                        :show-add="false"
                        :show-edit="false"
                        :show-delete="false"
                        :show-numbering="false"
                        :show-actions="false"
                      >
                        <template #thead>
                          <thead class="bg-gray-100">
                            <tr>
                              <th class="w-[50%] px-3 py-2 text-left font-semibold text-gray-700">
                                Nama Syarat
                              </th>
                              <th class="w-[25%] px-3 py-2 text-center font-semibold text-gray-700">
                                Status
                              </th>
                              <th class="w-[25%] px-3 py-2 text-center font-semibold text-gray-700">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                        </template>
                        <template #tbody>
                          <tbody class="divide-y divide-gray-100">
                            <tr
                              v-for="syarat in data.syarat_persyaratan"
                              :key="syarat.syarat_id"
                              class="hover:bg-gray-50"
                            >
                              <!-- Nama Syarat -->
                              <td class="px-3 py-2 text-left">{{ syarat.syarat_name }}</td>

                              <!-- Status -->
                              <td class="px-3 py-2 text-center">
                                <span
                                  v-if="syarat.status_validasi === 'approve'"
                                  class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold"
                                >
                                  <font-awesome-icon icon="fa-solid fa-check" />
                                  Disetujui
                                </span>
                                <span
                                  v-else-if="syarat.status_validasi === 'reject'"
                                  class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold"
                                >
                                  <font-awesome-icon icon="fa-solid fa-xmark" />
                                  Ditolak
                                </span>
                                <span
                                  v-else-if="syarat.status_validasi === 'process'"
                                  class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm font-semibold"
                                >
                                  <font-awesome-icon icon="fa-solid fa-clock" />
                                  Proses
                                </span>
                                <span
                                  v-else
                                  class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold"
                                >
                                  <font-awesome-icon icon="fa-solid fa-file" />
                                  Belum Upload
                                </span>
                              </td>

                              <!-- Aksi -->
                              <td class="px-3 py-2 text-center">
                                <div class="flex items-center justify-end gap-1" v-if="syarat.has_file">
                                  <button
                                    @click="viewFile(syarat)"
                                    class="w-6 p-1 bg-blue-500 hover:bg-blue-100 rounded transition-colors text-white hover:text-blue-500"
                                    title="Lihat File"
                                  >
                                    <font-awesome-icon
                                      icon="fa-solid fa-clipboard-list"
                                      class="text-sm"
                                    />
                                  </button>
                                  <button
                                    @click="editFile(data.realisasi_id, syarat)"
                                    class="w-6 p-1 bg-yellow-500 hover:bg-yellow-100 rounded transition-colors"
                                    title="Edit File"
                                  >
                                    <font-awesome-icon
                                      icon="fa-solid fa-pen"
                                      class="text-white text-sm"
                                    />
                                  </button>
                                  <button
                                    v-if="syarat.status_validasi !== 'approve'"
                                    @click="approveSyarat(data.realisasi_id, syarat)"
                                    class="w-6 p-1 bg-green-500 text-white hover:bg-green-100 rounded transition-colors"
                                    title="Approve"
                                  >
                                    <font-awesome-icon
                                      icon="fa-solid fa-check"
                                      class="text-white text-sm"
                                    />
                                  </button>
                                  <button
                                    v-if="syarat.status_validasi !== 'reject'"
                                    @click="openModalRejectBerkas(data.realisasi_id, syarat)"
                                    class="w-6 p-1 bg-red-500 hover:bg-red-100 rounded transition-colors"
                                    title="Reject"
                                  >
                                    <font-awesome-icon
                                      icon="fa-solid fa-xmark"
                                      class="text-white text-sm"
                                    />
                                  </button>
                                </div>
                                <span v-else class="text-gray-400 text-sm">-</span>
                              </td>
                            </tr>
                          </tbody>
                        </template>
                      </BaseTable>
                    </div>

                    <!-- Alasan Penolakan (jika ada) -->
                    <div
                      v-if="data.syarat_persyaratan.some((s) => s.alasan_penolakan)"
                      class="mt-3 bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      <h5 class="font-semibold text-red-800 text-sm mb-2 flex items-center gap-2">
                        <font-awesome-icon icon="fa-solid fa-triangle-exclamation" />
                        Alasan Penolakan:
                      </h5>
                      <ul class="space-y-1 text-sm text-red-700">
                        <li
                          v-for="syarat in data.syarat_persyaratan.filter((s) => s.alasan_penolakan)"
                          :key="syarat.syarat_id"
                        >
                          <strong>{{ syarat.syarat_name }}:</strong> {{ syarat.alasan_penolakan }}
                        </li>
                      </ul>
                    </div>
                  </td>

                  <!-- Kolom Aksi -->
                  <td class="px-2 py-4">
                    <div class="flex flex-col gap-2 items-center">
                      <LightButton
                        @click="openModalPemberitahuan(data)"
                        title="Kirim Pemberitahuan WA"
                      >
                        <font-awesome-icon icon="fa-brands fa-whatsapp" />
                      </LightButton>
                      <ButtonGreen
                        v-if="data.can_approve_permohonan"
                        @click="openModalSetujui(data)"
                        title="Approve Permohonan"
                      >
                        <font-awesome-icon icon="fa-solid fa-check" />
                      </ButtonGreen>
                      <button
                        v-else
                        disabled
                        class="px-3 py-2 bg-gray-200 text-gray-500 rounded cursor-not-allowed text-sm"
                        title="Lengkapi semua berkas untuk approve"
                      >
                        <font-awesome-icon icon="fa-solid fa-lock" />
                      </button>
                      <DangerButton @click="openModalTolak(data)" title="Tolak Permohonan">
                        <font-awesome-icon icon="fa-solid fa-ban" />
                      </DangerButton>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Empty State -->
              <tr v-else>
                <td :colspan="totalColumns" class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      <font-awesome-icon icon="fa-solid fa-file-signature" class="text-4xl" />
                    </div>
                    <p class="empty-state-title">Tidak ada data</p>
                    <p class="empty-state-desc">Belum ada permohonan bantuan yang perlu divalidasi.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- Modal Reject -->
    <FormRejectBerkas
      :is-modal-open="isModalRejectBerkasOpen"
      :selected-validasi-permohonan-bantuan="selectedData"
      @close="
        isModalRejectBerkasOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Validasi berkas Permohonan Bantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Setujui -->
    <FormSetujuiPermohonan
      :is-modal-open="isModalSetujuiOpen"
      :selected-validasi-permohonan-bantuan="selectedData"
      @close="
        isModalSetujuiOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Validasi Permohonan Bantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Tolak -->
    <FormTolakPermohonan
      :is-modal-open="isModalTolakOpen"
      :selected-validasi-permohonan-bantuan="selectedData"
      @close="
        isModalTolakOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Validasi Permohonan Bantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Pemberitahuan -->
    <FormPemberitahuan
      :is-modal-open="isModalPemberitahuanOpen"
      :selected-validasi-permohonan-bantuan="selectedData"
      @close="
        isModalPemberitahuanOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Validasi Permohonan Bantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Edit File -->
    <FormEditFile
      :is-modal-open="isModalEditFileOpen"
      :selected-validasi-permohonan-bantuan="selectedData"
      @close="
        isModalEditFileOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Validasi Permohonan Bantuan gagal',
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
