<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import ButtonGreen from '@/components/Button/ButtonGreen.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import YellowButton from '@/components/Button/YellowButton.vue';
import BaseSelect from '@/components/Form/BaseSelect.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import FormAdd from '@/modules/RiwayatZakat/widgets/FormAdd.vue';
import FormDisplayBukti from '@/modules/RiwayatZakat/widgets/FormDisplayBukti.vue';
import FormReject from '@/modules/RiwayatZakat/widgets/FormReject.vue';
import FormUploadBuktiSetoranZakat from '@/modules/RiwayatZakat/widgets/FormUploadBuktiSetoranZakat.vue';
import FormUploadBuktiTransfer from '@/modules/RiwayatZakat/widgets/FormUploadBuktiTransfer.vue';
import { getCurrentInstance, onMounted, ref } from 'vue';
import { API_URL } from '@/config/config';

// import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Composable
import { useConfirmation } from '@/composables/useConfirmation';
import { useDynamicLabel } from '@/composables/useDynamicLabel';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

// Service API
import {
  delete_riwayat_zakat,
  info_bukti_setoran,
  list,
  setujui_pembayaran_zakat,
} from '@/service/riwayat_zakat';

// Store
import { MessageTabZakat } from '@/stores/message';
// import Form from '@/components/Modal/Form.vue';
// import FormUploadBeritaAcara from '../BakalPenerimaBantuan/widgets/FormUploadBeritaAcara.vue';

// Global Properties
const { appContext } = getCurrentInstance()!;

const $formatToRupiah = appContext.config.globalProperties.$formatToRupiah;
const $terbilangUang = appContext.config.globalProperties.$terbilangUang;

const message = MessageTabZakat();

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(6);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

const tableColumns = ref<TableColumn[]>([
  { key: 'info_muzakki', label: 'Info Muzakki', headerClass: 'w-[30%] text-center', cellClass: 'text-start align-top' },
  { key: 'info_pemasukan', label: 'Info Pemasukan', headerClass: 'w-[30%] text-center', cellClass: 'text-start font-medium text-gray-800 align-top' },
  { key: 'status', label: 'Status', headerClass: 'w-[10%] text-center', cellClass: 'text-center font-bold text-gray-800' },
  { key: 'status_konfirmasi', label: 'Status Konfirmasi', headerClass: 'w-[10%] text-center', cellClass: 'text-center font-bold text-gray-800' },
  { key: 'datetimes', label: 'Datetimes', headerClass: 'w-[10%] text-center', cellClass: 'text-center font-medium text-gray-800' },
]);

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Composable: dynamic label
const { dynamicLabel } = useDynamicLabel();

interface RiwayatZakat {
  id: number;
  member_id: number;
  member_name: string;
  member_nik: string;
  invoice: string;
  type: string;
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
  wakalah_id: number | null;
  wakalah_nama: string | null;
  wakalah_nik: string | null;
}

const dataRiwayatZakat = ref<RiwayatZakat[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);

function openModalAdd() {
  isModalAddOpen.value = true;
}

// Function: Fetch Data
const search = ref('');
const selectStatus = ref('process');
const selectStatusKonfirmasi = ref('belum_dikirim');
const selectTipePembayaran = ref('');
const id = ref(0);
const nominal = ref(0);

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
      status: selectStatus.value,
      tipe_pembayaran: selectTipePembayaran.value,
      konfirmasi_pembayaran: selectStatusKonfirmasi.value,
    });

    dataRiwayatZakat.value = response.data.list;

    // gunakan variabel berbeda untuk HTML
    let htmlMessage = `

    `;
    if (response.data.pembayaran_online_dikirim > 0) {
      htmlMessage += `<span class="text-green-500">
        Terdapat ${response.data.pembayaran_online_dikirim} transaksi pembayaran <b>ZAKAT SECARA ONLINE</b> yang telah dikirim.
      </span>`;
    }

    if (response.data.total_saldo_dikantor > 0) {
      if (htmlMessage != '') {
        htmlMessage += `<br />`;
      }
      htmlMessage += `
       <span class="text-red-500">
          Saldo kas <b>ZAKAT</b> di kantor saat ini berjumlah ${$formatToRupiah(response.data.total_saldo_dikantor)}.
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
    console.log(dataRiwayatZakat.value);
  } catch (error) {
    displayNotification('Gagal mengambil data riwayat_zakat', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

// Function: Delete Data
async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Riwayat Zakat',
    'Apakah Anda yakin ingin menghapus data riwayat zakat ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_riwayat_zakat(id);
        displayNotification('Data riwayat zakat berhasil dihapus', 'success');
        await fetchData();
      } catch (error: any) {
        displayNotification(error.response.data.error_msg, 'error');
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
      await setujui_pembayaran_zakat(id);
      displayNotification('Pembayaran zakat berhasil disetujui', 'success');
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
      'Setujui Permohonan Pembayaran Zakat Online',
      'Biaya untuk permohonan pembayaran zakat ini belum dikirim. Apakah Anda yakin ingin menyetujui permohonan ini?',
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

async function cetakSuratSerahTerimaZakat(id: number) {
  isLoading.value = true;
  try {
    console.log(id);
    const response = await info_bukti_setoran(id);
    const buktiData: BuktiSetoranData = response.data;

    console.log('--------response');
    console.log(response);
    console.log('--------response');

    const invalidFields: string[] = [];

    for (const key in buktiData) {
      if (buktiData[key] == null || buktiData[key] === undefined) {
        invalidFields.push(key);
      }
    }

    if (invalidFields.length > 0) {
      const message = [
        'Data berikut belum lengkap:',
        invalidFields
          .map((f) => `- ${f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`)
          .join('\n'),
      ].join('\n');
      console.log(message);

      displayNotification(message, 'error');
      return;
    }

    // Load images

    const BASE_URL = API_URL;
    const logo = BASE_URL + '/uploads/img/logos/site_logo.png';
    const logoBase64 = await loadImageAsBase64(logo);
    const footer = '/images/ziwah.png';
    const footerBase64 = await loadImageAsBase64(footer);

    // Inisialisasi PDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const lineHeight = 6;
    const spacing = 1.2;

    // ==================== HEADER ====================
    // Logo di kanan
    const marginRight = 150;
    const scale = 1.15;
    const logoWidth = 53 * scale;
    const logoHeight = 15 * scale;
    const x = pageWidth - marginRight - 45;
    doc.addImage(logoBase64, 'PNG', x, 12, logoWidth, logoHeight);

    // Info Sekretariat (Kanan)
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('SEKRETARIAT', pageWidth - 85, y, { align: 'left' });
    y += 5;

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('BAITUL MAL KABUPATEN ACEH TENGAH', pageWidth - 85, y, { align: 'left' });
    y += 4;

    const alamat = buktiData.lokasi_kantor.alamat || '';
    const alamatKantorWrapped = doc.splitTextToSize(alamat, 70);
    doc.text(alamatKantorWrapped, pageWidth - 85, y, { align: 'left' });
    y += alamatKantorWrapped.length * 2;

    // // Box Nomor Bukti (Kanan)
    // y += 8;
    // const boxX = pageWidth - 85;
    // const boxWidth = 70;
    // const boxHeight = 10;
    // doc.setDrawColor(255, 0, 0); // Border merah
    // doc.setLineWidth(0.5);
    // doc.rect(boxX, y, boxWidth, boxHeight);

    // doc.setFont('times', 'bold');
    // doc.setFontSize(11);
    // doc.text(
    //   `${buktiData.waktu.tanggal} / ${buktiData.waktu.bulan_num} / ${buktiData.waktu.tahun_shrt}`,
    //   boxX + 3,
    //   y + 6,
    // );

    // // Background merah untuk periodekan
    // doc.setFont('times', 'normal');
    // doc.setFontSize(11);
    // // doc.text(buktiData.kode, boxX + 45, y + 6, { align: 'center' }); // Ini direvisi sebelumnya
    // doc.text('/ ...... / ...... /', boxX + 45, y + 6, { align: 'center' });
    // doc.setTextColor(0, 0, 0); // Reset warna text

    // ==================== JUDUL BAGIAN UTAMA ====================
    y += 18;
    doc.setFillColor(220, 220, 220);
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(15, y, pageWidth - 30, 8);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('TELAH TERIMA DARI', pageWidth / 2, y + 5.5, { align: 'center' });

    // ==================== DATA PENERIMA ====================
    y += 15;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);

    const leftCol = 15;
    const dataCol = 80;

    const maxWidth = 120; // batas lebar teks
    const lineGap = lineHeight * spacing;

    // Atas Nama
    doc.setFont('times', 'bold');
    doc.text('Atas Nama', leftCol, y);
    doc.setFont('times', 'normal');
    doc.text(': ' + buktiData.member_fullname, dataCol, y);
    y += lineGap;

    // Alamat (bisa panjang → perlu wrap)
    doc.setFont('times', 'bold');
    doc.text('Alamat', leftCol, y);
    doc.setFont('times', 'normal');

    const alamatWrapped = doc.splitTextToSize(`: ${buktiData.alamat || '-'}`, maxWidth);
    doc.text(alamatWrapped, dataCol, y);
    y += alamatWrapped.length * lineGap;

    // No. Tlp/HP
    doc.setFont('times', 'bold');
    doc.text('No. Tlp/ HP', leftCol, y);
    doc.setFont('times', 'normal');
    doc.text(': ' + (buktiData.whatsapp_number || '-'), dataCol, y);
    y += lineGap;

    // Jenis Pembayaran
    doc.setFont('times', 'bold');
    doc.text('Jenis Pembayaran', leftCol, y);
    doc.setFont('times', 'normal');
    const capitalizedText = buktiData.tipe
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    doc.text(`: ${capitalizedText}`, dataCol, y);
    y += lineGap;

    // Telah Diterima Uang Sejumlah
    doc.setFont('times', 'bold');
    doc.text('Telah Diterima Uang Sejumlah', leftCol, y);
    doc.setFont('times', 'normal');
    doc.text(': ' + $formatToRupiah(buktiData.nominal), dataCol, y);
    y += lineGap;

    // Terbilang (bisa sangat panjang → perlu wrap)
    doc.setFont('times', 'bolditalic');
    doc.text('Terbilang', leftCol, y);
    doc.setFont('times', 'normal');
    doc.text(':', dataCol, y);
    doc.setFont('times', 'italic');

    const terbilangText =
      `  ` + $terbilangUang(buktiData.nominal, { case: 'title', currency: 'Rupiah' });
    const terbilangWrapped = doc.splitTextToSize(terbilangText, maxWidth);
    doc.text(terbilangWrapped, dataCol, y);
    y += terbilangWrapped.length * lineGap;

    y += lineHeight * spacing;

    // ==================== TANDA TANGAN ====================
    y += 30;
    doc.setFont('times', 'normal');
    doc.setFontSize(11);

    // Kolom Kiri - Diterima Oleh
    const leftSignX = 50;
    doc.text(
      `${buktiData.lokasi_kantor.nama_kabupaten_kota}, ${buktiData.waktu.tanggal} / ${buktiData.waktu.bulan_num} / ${buktiData.waktu.tahun_shrt}`,
      leftSignX,
      y,
      { align: 'center' },
    );
    y += lineHeight * spacing;
    doc.setFont('times', 'bold');
    doc.text('Diterima Oleh', leftSignX, y, { align: 'center' });
    y += lineHeight * spacing;
    doc.setFont('times', 'normal');

    console.log('xxx');
    console.log(buktiData.jabatan_petugas);
    console.log('xxx');
    doc.text(buktiData.jabatan_petugas == null ? '-' : buktiData.jabatan_petugas, leftSignX, y, {
      align: 'center',
    });

    // Kolom Kanan - Penyetor
    const rightSignX = 160;
    doc.setFont('times', 'bold');
    doc.text('Penyetor', rightSignX, y - lineHeight * spacing, { align: 'center' });

    y += 25;
    doc.setFont('times', 'bold');
    doc.text(
      buktiData.nama_petugas == null ? '-' : buktiData.nama_petugas.toUpperCase(),
      leftSignX,
      y,
      { align: 'center' },
    );
    doc.line(leftSignX - 25, y + 3, leftSignX + 25, y + 3); // Garis bawah nama

    doc.text(buktiData.member_fullname.toUpperCase(), rightSignX, y, { align: 'center' });
    doc.line(rightSignX - 25, y + 3, rightSignX + 25, y + 3); // Garis bawah nama

    // ==================== QUOTE ====================
    y += 30;
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(12);
    const quote =
      '" YA ALLAH BERIKANLAH PAHALA ATAS ZAKAT YANG DITUNAIKAN DAN BERKAHILAH HARTA YANG LAINNYA. AMIN "';
    doc.text(quote, pageWidth / 2, y, { align: 'center', maxWidth: 160 });

    // ==================== FOOTER ====================
    const scaleFooter = 0.28;
    const footerWidth = 106 * scaleFooter;
    const footerHeight = 34 * scaleFooter;

    // Garis pemisah
    doc.setDrawColor(200, 200, 200);
    doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

    // Teks footer
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Dicetak Pada: ${buktiData.waktu.tanggal} ${buktiData.waktu.bulan_str} ${buktiData.waktu.tahun_lng} `,
      pageWidth / 2,
      pageHeight - 10,
      {
        align: 'center',
      },
    );

    // Logo footer
    doc.addImage(footerBase64, 'PNG', 15, pageHeight - 15, footerWidth, footerHeight);

    // ==================== SAVE PDF ====================
    doc.save(
      `Bukti Setoran Zakat ${buktiData.waktu.tanggal}-${buktiData.waktu.bulan_num}-${buktiData.waktu.tahun_lng}.pdf`,
    );
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

const isModalUploadBuktiSetoranZakatOpen = ref(false);
async function uploadBuktiSetoranZakat(idl: number, nominalZakat: number) {
  isModalUploadBuktiSetoranZakatOpen.value = true;
  id.value = idl;
  nominal.value = nominalZakat;
}

interface Displaybuktiparam {
  tipe_pembayaran: string;
  nominal_zakat: number;
  bukti: string;
  nominal_bukti: number;
}

const isModalDisplayBuktiOpen = ref(false);
const tipe_pembayaran = ref('');
const nominal_zakat = ref(0);
const bukti = ref('');
const nominal_bukti = ref(0);
async function displayBukti(param: Displaybuktiparam) {
  console.log('----');
  console.log(param);
  console.log('----');
  isModalDisplayBuktiOpen.value = true;
  tipe_pembayaran.value = param.tipe_pembayaran;
  nominal_zakat.value = param.nominal_zakat;
  bukti.value = param.bukti;
  nominal_bukti.value = param.nominal_bukti;
}
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow-md">
        <BaseTable
          empty-title="Tidak ada data"
          empty-desc="Belum ada data riwayat zakat."
          empty-icon="fa-solid fa-hand-holding-dollar"
          :columns="tableColumns"
          :data="dataRiwayatZakat"
          :loading="isTableLoading"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          @page-change="pageNow"
        >
          <!-- Custom Filters -->
          <template #filters>
            <div class="flex items-center w-full sm:w-auto gap-2">
              <!-- Status -->
              <BaseSelect
                v-model="selectStatus"
                :options="[
                  { value: 'process', label: 'Proses' },
                  { value: 'success', label: 'Sukses' },
                  { value: 'failed', label: 'Gagal' },
                ]"
                placeholder="Semua Status"
                @change="fetchData"
              />

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

              <!-- Search -->
              <input
                id="search"
                type="text"
                v-model="search"
                @change="fetchData"
                placeholder="Cari Nama / Nomor Nik / Nomor Akun..."
                class="w-full sm:w-86 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
              />
            </div>
          </template>

          <!-- Custom Actions (Add Button) -->
          <template #actions>
            <BaseButton
              @click="openModalAdd()"
              variant="primary"
              :loading="isModalAddOpen"
              type="button"
            >
              <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
              {{ dynamicLabel('Tambah Riwayat Zakat') }}
            </BaseButton>
          </template>

          

          <template #cell-info_muzakki="{ row: riwayat_zakat }">
            <table class="w-full border border-gray-300 rounded-lg">
              <tbody>
                <tr class="border-b border-gray-300">
                  <td class="w-[40%] bg-gray-100 px-4 py-2 font-medium">Nama Muzakki</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    {{ riwayat_zakat.member_name }}
                  </td>
                </tr>
                <tr class="border-b border-gray-300">
                  <td class="bg-gray-100 px-4 py-2 font-medium">NIK Muzakki</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    {{ riwayat_zakat.member_nik }}
                  </td>
                </tr>
                <tr v-if="riwayat_zakat.wakalah_id" class="border border-gray-300">
                  <td class="bg-gray-100 px-4 py-2 font-medium">Wakalah</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    {{ riwayat_zakat.wakalah_nama }} <br />
                    <span class="text-xs text-gray-500 font-normal">{{ riwayat_zakat.wakalah_nik }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <template #cell-info_pemasukan="{ row: riwayat_zakat }">
            <table class="w-full border border-gray-300 rounded-lg">
              <tbody>
                <tr class="border border-gray-300">
                  <td class="w-[40%] bg-gray-100 px-4 py-2 font-medium">Invoice</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    #{{ riwayat_zakat.invoice }}
                  </td>
                </tr>
                <tr class="border border-gray-300">
                  <td class="bg-gray-100 px-4 py-2 font-medium">Nominal Zakat</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    {{ $formatToRupiah(riwayat_zakat.nominal) }}
                  </td>
                </tr>
                <tr
                  class="border border-gray-300"
                  v-if="riwayat_zakat.tipe_pembayaran == 'online'"
                >
                  <td class="bg-gray-100 px-4 py-2 font-medium">Kode</td>
                  <td class="px-4 py-2 font-medium w-full text-right text-red-500">
                    {{ $formatToRupiah(riwayat_zakat.kode) }}
                  </td>
                </tr>
                <tr
                  class="border border-gray-300"
                  v-if="riwayat_zakat.tipe_pembayaran == 'online'"
                >
                  <td class="bg-gray-100 px-4 py-2 font-medium">Total Dikirim</td>
                  <td class="px-4 py-2 font-medium w-full text-right text-red-500">
                    {{ $formatToRupiah(riwayat_zakat.nominal + riwayat_zakat.kode) }}
                  </td>
                </tr>
                <tr class="border border-gray-300">
                  <td class="bg-gray-100 px-4 py-2 font-medium">Tipe Pembayaran</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    {{ riwayat_zakat.tipe_pembayaran }}
                  </td>
                </tr>
                <tr class="border border-gray-300" v-if="riwayat_zakat.status == 'failed'">
                  <td class="bg-gray-100 px-4 py-2 font-medium text-red">Alasan Penolakan</td>
                  <td class="px-4 py-2 font-medium w-full text-right text-red">
                    {{ riwayat_zakat.alasan_penolakan }}
                  </td>
                </tr>
                <tr class="border border-gray-300" v-if="riwayat_zakat.status != 'process'">
                  <td class="bg-gray-100 px-4 py-2 font-medium">Nama Petugas</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    {{ riwayat_zakat.nama_petugas ?? '-' }}
                  </td>
                </tr>
                <tr class="border border-gray-300" v-if="riwayat_zakat.status != 'process'">
                  <td class="bg-gray-100 px-4 py-2 font-medium">Jabatan Petugas</td>
                  <td class="px-4 py-2 font-medium w-full text-right">
                    {{ riwayat_zakat.jabatan_petugas ?? '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <template #cell-status="{ row: riwayat_zakat }">
            <span
              :class="{
                'text-green-500': riwayat_zakat.status === 'success',
                'text-yellow-500': riwayat_zakat.status === 'process',
                'text-red-500': riwayat_zakat.status === 'failed',
              }"
            >
              {{
                {
                  success: 'SUKSES',
                  process: 'PROSES',
                  failed: 'GAGAL',
                }[riwayat_zakat.status]
              }}
            </span>
          </template>

          <template #cell-status_konfirmasi="{ row: riwayat_zakat }">
            <span
              :class="
                riwayat_zakat.konfirmasi_pembayaran === 'sudah_dikirim'
                  ? 'text-green-500'
                  : 'text-red-500'
              "
            >
              {{
                riwayat_zakat.konfirmasi_pembayaran === 'sudah_dikirim'
                  ? 'SUDAH DIKIRIM'
                  : 'BELUM DIKIRIM'
              }}
            </span>
          </template>

          <template #cell-datetimes="{ row: riwayat_zakat }">
            {{ riwayat_zakat.datetimes }}
          </template>

          <template #row-actions="{ row: riwayat_zakat }">
            <div class="flex justify-center gap-2">
              <ButtonGreen
                v-if="
                  riwayat_zakat.tipe_pembayaran == 'online' &&
                  riwayat_zakat.status == 'process'
                "
                title="Setujui Permohonan"
                @click="approveOnline(riwayat_zakat.id, riwayat_zakat.konfirmasi_pembayaran)"
              >
                <font-awesome-icon icon="fa-solid fa-check" />
              </ButtonGreen>
              <DangerButton
                v-if="
                  riwayat_zakat.tipe_pembayaran == 'online' &&
                  riwayat_zakat.status == 'process'
                "
                title="Reject Permohonan"
                @click="rejectOnline(riwayat_zakat.id)"
              >
                <font-awesome-icon icon="fa-solid fa-ban" />
              </DangerButton>
              <LightButton
                v-if="
                  riwayat_zakat.tipe_pembayaran == 'transfer' &&
                  riwayat_zakat.status == 'process'
                "
                title="Upload Bukti Transfer"
                @click="uploadBuktiTransfer(riwayat_zakat.id, riwayat_zakat.nominal)"
              >
                <font-awesome-icon icon="fa-solid fa-upload" />
              </LightButton>
              <LightButton
                v-if="
                  riwayat_zakat.tipe_pembayaran == 'cash' ||
                  (riwayat_zakat.tipe_pembayaran == 'transfer' &&
                    riwayat_zakat.status == 'success')
                "
                title="Cetak Bukti Setoran"
                @click="cetakSuratSerahTerimaZakat(riwayat_zakat.id)"
              >
                <font-awesome-icon icon="fa-solid fa-print" />
              </LightButton>
              <LightButton
                v-if="
                  riwayat_zakat.tipe_pembayaran == 'cash' &&
                  riwayat_zakat.posisi_uang == 'kantor_baitulmal'
                "
                @click="uploadBuktiSetoranZakat(riwayat_zakat.id, riwayat_zakat.nominal)"
                title="Upload Bukti Setoran"
              >
                <font-awesome-icon icon="fa-solid fa-upload" />
              </LightButton>

              <YellowButton
                v-if="
                  riwayat_zakat.status == 'success' &&
                  (riwayat_zakat.tipe_pembayaran == 'transfer' ||
                    riwayat_zakat.tipe_pembayaran == 'cash')
                "
                :title="
                  `Tampilkan Bukti ` +
                  (riwayat_zakat.tipe_pembayaran == 'transfer' ? 'Transfer' : 'Setoran')
                "
                @click="
                  displayBukti({
                    tipe_pembayaran: riwayat_zakat.tipe_pembayaran,
                    nominal_zakat: riwayat_zakat.nominal,
                    bukti:
                      riwayat_zakat.tipe_pembayaran == 'transfer'
                        ? riwayat_zakat.bukti_transfer
                        : riwayat_zakat.bukti_setoran,
                    nominal_bukti:
                      riwayat_zakat.tipe_pembayaran == 'transfer'
                        ? riwayat_zakat.nominal_transfer
                        : riwayat_zakat.nominal_setoran,
                  })
                "
              >
                <font-awesome-icon icon="fa-solid fa-print" />
              </YellowButton>
              <DangerButton @click="deleteData(riwayat_zakat.id)"
                ><DeleteIcon
              /></DangerButton>
            </div>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- Modal FormAdd -->
    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="((isModalAddOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update RiwayatZakat gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

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
      :nominal_zakat="nominal"
      @close="((isModalUploadBuktiTransferOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Upload Bukti Transfer Gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal Upload Bukti Setoran Zakat -->
    <FormUploadBuktiSetoranZakat
      :is-modal-open="isModalUploadBuktiSetoranZakatOpen"
      :id="id"
      :nominal_zakat="nominal"
      @close="((isModalUploadBuktiSetoranZakatOpen = false), fetchData())"
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
      :nominal_zakat="nominal_zakat"
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
