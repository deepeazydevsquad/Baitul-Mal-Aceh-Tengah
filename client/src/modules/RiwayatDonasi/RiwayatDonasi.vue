<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import ButtonGreen from '@/components/Button/ButtonGreen.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import YellowButton from '@/components/Button/YellowButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import FormDisplayBukti from '@/modules/RiwayatDonasi/widgets/FormDisplayBukti.vue';
import FormReject from '@/modules/RiwayatDonasi/widgets/FormReject.vue';
import FormUploadBuktiSetoranDonasi from '@/modules/RiwayatDonasi/widgets/FormUploadBuktiSetoranDonasi.vue';
import FormUploadBuktiTransfer from '@/modules/RiwayatDonasi/widgets/FormUploadBuktiTransfer.vue';
import { getCurrentInstance, onMounted, ref, watch } from 'vue';

import BaseSelect from '@/components/Form/BaseSelect.vue';

import ziwahImg from '@/assets/images/brand/ziwah.png';

// import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Composable
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

// Service API
import {
  delete_riwayat_donasi,
  get_riwayat_donasi,
  info_bukti_setoran,
  setujui_pembayaran_donasi,
} from '@/service/riwayat_donasi';

// Store
import { API_URL } from '@/config/config';
import { MessageTabDonasi, RefreshRiwayatDonasi } from '@/stores/message';
const BASE_URL = API_URL;

// Global Properties
const { appContext } = getCurrentInstance()!;

const $formatToRupiah = appContext.config.globalProperties.$formatToRupiah;
const $terbilangUang = appContext.config.globalProperties.$terbilangUang;

const message = MessageTabDonasi();
const refresh = RefreshRiwayatDonasi();

// State
const isLoading = ref(false);
const isTableLoading = ref(false);

// Pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(6);
const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Notification & Confirmation
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Interfaces
interface ProgramDonasi {
  id: number;
  name: string;
  tahun: number;
  status: string;
  deskripsi: string;
}

interface RiwayatDonasi {
  id: number;
  member_id: number;
  member_name: string;
  member_nik: string;
  wakalah?: string;
  jabatan_wakalah?: string;
  invoice: string;
  nominal: number;
  kode: string;
  status: string;
  alasan_penolakan: string;
  tipe_pembayaran: string;
  nominal_transfer: number;
  bukti_transfer: string;
  nominal_setoran: number;
  bukti_setoran: string;
  posisi_uang: string;
  nama_petugas: string;
  jabatan_petugas: string;
  konfirmasi_pembayaran: string;
  datetimes: string;
  Program_donasi?: ProgramDonasi;
}

const RiwayatDonasi = ref<RiwayatDonasi[]>([]);

// Search & Filters
const search = ref('');
const status = ref('');
const selectStatusKonfirmasi = ref('belum_dikirim');
const selectTipePembayaran = ref('');
const id = ref(0);
const nominal = ref(0);

async function fetchData() {
  refresh.setBool(false);
  isTableLoading.value = true;
  try {
    const response = await get_riwayat_donasi({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
      status: status.value,
      konfirmasi_pembayaran: selectStatusKonfirmasi.value,
      tipe_pembayaran: selectTipePembayaran.value,
    });
    RiwayatDonasi.value = response.data.list;

    // gunakan variabel berbeda untuk HTML
    let htmlMessage = ``;
    if (response.data.pembayaran_online_dikirim > 0) {
      htmlMessage += `<span class="text-green-500">
        Terdapat ${response.data.pembayaran_online_dikirim} transaksi pembayaran <b>DONASI SECARA ONLINE</b> yang telah dikirim.
      </span>`;
    }

    if (response.data.total_saldo_dikantor > 0) {
      if (htmlMessage != '') {
        htmlMessage += `<br />`;
      }
      htmlMessage += `
       <span class="text-red-500">
          Saldo kas <b>DONASI</b> di kantor saat ini berjumlah ${$formatToRupiah(response.data.total_saldo_dikantor)}.
        </span>
      `;
    }

    // panggil setString pada store, bukan pada string
    message.setString(`
      <div class="text-sm text-gray-600 text-right">
        ${htmlMessage}
      </div>
    `);

    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil data riwayat donasi', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(fetchData);

watch(
  () => refresh.getBool,
  async () => {
    if (refresh.getBool == true) {
      await fetchData();
    }
  },
  { deep: true },
);

async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Riwayat Donasi',
    'Apakah Anda yakin ingin menghapus data riwayat donasi ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_riwayat_donasi(id);
        displayNotification('Data riwayat donasi berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data riwayat donasi', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}

async function approveOnline(id: number, status_kirim: string) {
  async function setujui(id: number) {
    try {
      isLoading.value = true;
      await setujui_pembayaran_donasi(id);
      displayNotification('Pembayaran donasi berhasil disetujui', 'success');
      await fetchData();
    } catch (error: any) {
      displayNotification(error.response.data.error_msg, 'error');
    } finally {
      isLoading.value = false;
    }
  }
  // Implementation for approving online payment
  if (status_kirim === 'belum_dikirim') {
    displayConfirmation(
      'Setujui Permohonan Pembayaran Donasi Online',
      'Biaya untuk permohonan pembayaran donasi ini belum dikirim. Apakah Anda yakin ingin menyetujui permohonan ini?',
      async () => {
        await setujui(id);
      },
    );
  } else {
    await setujui(id);
  }
}

const isModalRejectOpen = ref(false);
async function rejectOnline(idl: number) {
  isModalRejectOpen.value = true;
  id.value = idl;
}

const isModalUploadBuktiTransferOpen = ref(false);
async function uploadBuktiTransfer(idl: number, nominalZakat: number) {
  isModalUploadBuktiTransferOpen.value = true;
  id.value = idl;
  nominal.value = nominalZakat;
}

async function loadImageAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

interface BuktiSetoranData {
  waktu: {
    tanggal: string;
    bulan_str: string;
    bulan_num: string;
    tahun_lng: string;
    tahun_shrt: string;
  };
  member_fullname: string;
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

async function cetakSuratSerahTerima(id: number) {
  isLoading.value = true;
  try {
    const printUrl = `/bukti-setoran-donasi/${id}`;
    window.open(printUrl, '_blank');
  } catch (error: any) {
    console.error('Error cetak bukti setoran:', error);
    displayNotification(
      error.response.data.message ||
        error.response.data.error_msg ||
        'Gagal mencetak bukti setoran',
      'error',
    );
  } finally {
    isLoading.value = false;
  }
}

const isModalUploadBuktiSetoranDonasiOpen = ref(false);
async function uploadBuktiSetoranDonasi(idl: number, nominalDonasi: number) {
  isModalUploadBuktiSetoranDonasiOpen.value = true;
  id.value = idl;
  nominal.value = nominalDonasi;
}

interface Displaybuktiparam {
  tipe_pembayaran: string;
  nominal_donasi: number;
  bukti: string;
  nominal_bukti: number;
}

const isModalDisplayBuktiOpen = ref(false);
const tipe_pembayaran = ref('');
const nominal_donasi = ref(0);
const bukti = ref('');
const nominal_bukti = ref(0);
async function displayBukti(param: Displaybuktiparam) {
  isModalDisplayBuktiOpen.value = true;
  tipe_pembayaran.value = param.tipe_pembayaran;
  nominal_donasi.value = param.nominal_donasi;
  bukti.value = param.bukti;
  nominal_bukti.value = param.nominal_bukti;
}
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Loading -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />

    <div v-else class="space-y-4">
      <!-- Search & Filter -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div class="flex items-center w-full sm:w-auto gap-2">
          <label for="search" class="mr-2 text-sm font-medium text-gray-600">Filter</label>

          <select
            v-model="status"
            @change="fetchData"
            class="block w-full sm:w-48 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:ring-2 focus:ring-green-900 focus:border-green-900 transition"
          >
            <option value="">Semua Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PROCESS">Process</option>
            <option value="FAILED">Failed</option>
          </select>
          <!-- Status Konfirmasi -->
          <BaseSelect
            v-model="selectStatusKonfirmasi"
            :options="[
              { value: 'belum_dikirim', label: 'Belum Dikirim' },
              { value: 'sudah_dikirim', label: 'Sudah Dikirim' },
            ]"
            placeholder="Semua Status Konfirmasi"
            @change="fetchData"
          />
          <BaseSelect
            v-model="selectTipePembayaran"
            :options="[
              { value: 'online', label: 'Online' },
              { value: 'transfer', label: 'Transfer' },
              { value: 'cash', label: 'Cash' },
            ]"
            placeholder="Semua Tipe Pembayaran"
            @change="fetchData"
          />
          <input
            id="search"
            type="text"
            v-model="search"
            @input="fetchData"
            placeholder="Cari Nama / Nomor Nik / Nomor Akun..."
            class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr>
              <th
                class="w-[30%] text-center px-6 py-4 font-medium font-bold text-gray-900 text-center"
              >
                Info Donatur
              </th>
              <th
                class="w-[30%] text-center px-6 py-4 font-medium font-bold text-gray-900 text-center"
              >
                Info Pemasukan
              </th>
              <th
                class="w-[10%] text-center px-6 py-4 font-medium font-bold text-gray-900 text-center"
              >
                Status
              </th>
              <th
                class="w-[10%] text-center px-6 py-4 font-medium font-bold text-gray-900 text-center"
              >
                Status Konfirmasi
              </th>
              <th
                class="w-[10%] text-center px-6 py-4 font-medium font-bold text-gray-900 text-center"
              >
                Datetimes
              </th>
              <th
                class="w-[10%] text-center px-6 py-4 font-medium font-bold text-gray-900 text-center"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-if="RiwayatDonasi.length > 0">
              <tr
                v-for="data in RiwayatDonasi"
                :key="data.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <!-- Info Member -->
                <td class="px-6 py-4 text-start align-top">
                  <table class="w-full border border-gray-300 rounded-lg">
                    <tbody>
                      <tr class="border-b border-gray-300">
                        <th class="w-[40%] px-4 py-2 text-left font-medium bg-gray-100">Nama</th>
                        <td class="px-4 py-2 text-right">{{ data.member_name }}</td>
                      </tr>
                      <tr class="border-b border-gray-300">
                        <th class="px-4 py-2 text-left font-medium bg-gray-100">NIK</th>
                        <td class="px-4 py-2 text-right">
                          {{ data.member_nik }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                <!-- Info Program & Nominal -->
                <td class="px-6 py-4 text-start font-medium text-gray-800 w-[30%] align-top">
                  <table class="w-full border border-gray-300 rounded-lg">
                    <tbody>
                      <tr class="border-b border-gray-300">
                        <th class="w-[40%] px-4 py-2 text-left font-medium bg-gray-100">
                          Nama Program
                        </th>
                        <td class="px-4 py-2 text-right">{{ data.Program_donasi?.name }}</td>
                      </tr>
                      <tr class="border-b border-gray-300">
                        <th class="px-4 py-2 text-left font-medium bg-gray-100">Tahun</th>
                        <td class="px-4 py-2 text-right">{{ data.Program_donasi?.tahun }}</td>
                      </tr>
                      <tr class="border-b border-gray-300">
                        <th class="px-4 py-2 text-left font-medium bg-gray-100">Status Program</th>
                        <td class="px-4 py-2 text-right">
                          {{ data.Program_donasi?.status.replace(/_/g, ' ').toUpperCase() }}
                        </td>
                      </tr>
                      <tr class="border border-gray-300">
                        <td class="bg-gray-100 px-4 py-2 font-medium">Invoice</td>
                        <td class="px-4 py-2 font-medium text-right">
                          {{ data.invoice }}
                        </td>
                      </tr>
                      <tr class="border-b border-gray-300">
                        <th class="px-4 py-2 text-left font-medium bg-gray-100">Nominal Donasi</th>
                        <td class="px-4 py-2 text-right">
                          Rp {{ Number(data.nominal).toLocaleString('id-ID') }}
                        </td>
                      </tr>
                      <tr class="border border-gray-300" v-if="data.tipe_pembayaran == 'online'">
                        <td class="bg-gray-100 px-4 py-2 font-medium">Kode</td>
                        <td class="px-4 py-2 font-medium w-full text-right text-red-500">
                          {{ $formatToRupiah(data.kode) }}
                        </td>
                      </tr>
                      <tr class="border border-gray-300" v-if="data.tipe_pembayaran == 'online'">
                        <td class="bg-gray-100 px-4 py-2 font-medium">Total Dikirim</td>
                        <td class="px-4 py-2 font-medium w-full text-right text-red-500">
                          {{ $formatToRupiah(data.nominal + data.kode) }}
                        </td>
                      </tr>
                      <tr class="border border-gray-300">
                        <td class="bg-gray-100 px-4 py-2 font-medium">Tipe Pembayaran</td>
                        <td class="px-4 py-2 font-medium w-full text-right">
                          {{ data.tipe_pembayaran }}
                        </td>
                      </tr>
                      <tr
                        class="border border-gray-300 bg-green-300"
                        v-if="data.wakalah != undefined"
                      >
                        <td class="bg-green-400 px-4 py-2 font-medium">Wakalah</td>
                        <td class="px-4 py-2 font-medium w-full text-right">
                          {{ data.wakalah }} ({{ data.jabatan_wakalah }})
                        </td>
                      </tr>
                      <tr class="border border-gray-300" v-if="data.status == 'failed'">
                        <td class="bg-gray-100 px-4 py-2 font-medium text-red">Alasan Penolakan</td>
                        <td class="px-4 py-2 font-medium w-full text-right text-red">
                          {{ data.alasan_penolakan }}
                        </td>
                      </tr>
                      <tr class="border border-gray-300" v-if="data.status != 'process'">
                        <td class="bg-gray-100 px-4 py-2 font-medium">Nama Petugas</td>
                        <td class="px-4 py-2 font-medium w-full text-right">
                          {{ data.nama_petugas ?? '-' }}
                        </td>
                      </tr>
                      <tr class="border border-gray-300" v-if="data.status != 'process'">
                        <td class="bg-gray-100 px-4 py-2 font-medium">Jabatan Petugas</td>
                        <td class="px-4 py-2 font-medium w-full text-right">
                          {{ data.jabatan_petugas ?? '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 text-center font-bold text-gray-800">
                  <span
                    :class="{
                      'text-green-500': data.status === 'success',
                      'text-yellow-500': data.status === 'process',
                      'text-red-500': data.status === 'failed',
                    }"
                  >
                    {{
                      {
                        success: 'SUKSES',
                        process: 'PROSES',
                        failed: 'GAGAL',
                      }[data.status]
                    }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center font-bold text-gray-800">
                  <span
                    :class="
                      data.konfirmasi_pembayaran === 'sudah_dikirim'
                        ? 'text-green-500'
                        : 'text-red-500'
                    "
                  >
                    {{
                      data.konfirmasi_pembayaran === 'sudah_dikirim'
                        ? 'SUDAH DIKIRIM'
                        : 'BELUM DIKIRIM'
                    }}
                  </span>
                </td>
                <!-- Datetimes -->
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  {{ data.datetimes }}
                </td>
                <!-- Aksi -->
                <td class="px-6 py-4">
                  <div class="flex justify-center gap-2">
                    <ButtonGreen
                      v-if="data.tipe_pembayaran == 'online' && data.status == 'process'"
                      title="Setujui Permohonan"
                      @click="approveOnline(data.id, data.konfirmasi_pembayaran)"
                    >
                      <font-awesome-icon icon="fa-solid fa-check" />
                    </ButtonGreen>
                    <DangerButton
                      v-if="data.tipe_pembayaran == 'online' && data.status == 'process'"
                      title="Reject Permohonan"
                      @click="rejectOnline(data.id)"
                    >
                      <font-awesome-icon icon="fa-solid fa-ban" />
                    </DangerButton>
                    <LightButton
                      v-if="data.tipe_pembayaran == 'transfer' && data.status == 'process'"
                      title="Upload Bukti Transfer"
                      @click="uploadBuktiTransfer(data.id, data.nominal)"
                    >
                      <font-awesome-icon icon="fa-solid fa-upload" />
                    </LightButton>
                    <LightButton
                      v-if="
                        data.tipe_pembayaran == 'cash' ||
                        (data.tipe_pembayaran == 'transfer' && data.status == 'success')
                      "
                      title="Cetak Surat Serah Terima Donasi"
                      @click="cetakSuratSerahTerima(data.id)"
                    >
                      <font-awesome-icon icon="fa-solid fa-print" />
                    </LightButton>
                    <LightButton
                      v-if="
                        data.tipe_pembayaran == 'cash' && data.posisi_uang == 'kantor_baitulmal'
                      "
                      @click="uploadBuktiSetoranDonasi(data.id, data.nominal)"
                      title="Upload Bukti Setoran"
                    >
                      <font-awesome-icon icon="fa-solid fa-upload" />
                    </LightButton>

                    <YellowButton
                      v-if="
                        data.status == 'success' &&
                        (data.tipe_pembayaran == 'transfer' || data.tipe_pembayaran == 'cash')
                      "
                      :title="
                        `Tampilkan Bukti ` +
                        (data.tipe_pembayaran == 'transfer' ? 'Transfer' : 'Setoran')
                      "
                      @click="
                        displayBukti({
                          tipe_pembayaran: data.tipe_pembayaran,
                          nominal_donasi: data.nominal,
                          bukti:
                            data.tipe_pembayaran == 'transfer'
                              ? data.bukti_transfer
                              : data.bukti_setoran,
                          nominal_bukti:
                            data.tipe_pembayaran == 'transfer'
                              ? data.nominal_transfer
                              : data.nominal_setoran,
                        })
                      "
                    >
                      <font-awesome-icon icon="fa-solid fa-print" />
                    </YellowButton>
                    <DangerButton @click="deleteData(data.id)">
                      <DeleteIcon />
                    </DangerButton>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else>
              <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
                <font-awesome-icon
                  icon="fa-solid fa-hand-holding-dollar"
                  class="text-4xl mb-2 text-gray-400"
                />
                <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
                <p class="text-sm">Belum ada data riwayat donasi.</p>
              </td>
            </tr>
          </tbody>

          <!-- Pagination -->
          <tfoot class="bg-gray-100 font-bold">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              :pages="pages"
              :total-columns="totalColumns"
              :total-row="totalRow"
              @prev-page="prevPage"
              @next-page="nextPage"
              @page-now="pageNow"
            />
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Modal FormReject -->
    <FormReject
      :is-modal-open="isModalRejectOpen"
      :id="id"
      @close="((isModalRejectOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update RiwayatZakat gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Form Upload Bukti Transfer -->
    <FormUploadBuktiTransfer
      :is-modal-open="isModalUploadBuktiTransferOpen"
      :id="id"
      :nominal_donasi="nominal"
      @close="((isModalUploadBuktiTransferOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Upload Bukti Transfer Gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Upload Bukti Setoran Donasi -->
    <FormUploadBuktiSetoranDonasi
      :is-modal-open="isModalUploadBuktiSetoranDonasiOpen"
      :id="id"
      :nominal_donasi="nominal"
      @close="((isModalUploadBuktiSetoranDonasiOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Upload Bukti Transfer Gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Form Display Bukti Transfer / Bukti Setoran -->
    <FormDisplayBukti
      :is-modal-open="isModalDisplayBuktiOpen"
      :tipe_pembayaran="tipe_pembayaran"
      :nominal_donasi="nominal_donasi"
      :bukti="bukti"
      :nominal_bukti="nominal_bukti"
      @close="((isModalDisplayBuktiOpen = false), fetchData())"
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

<style>
.text-xs {
  font-size: 0.75rem; /* kecilin font */
}
.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
</style>
