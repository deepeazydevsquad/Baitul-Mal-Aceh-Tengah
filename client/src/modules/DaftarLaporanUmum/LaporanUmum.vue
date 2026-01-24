<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Logo from '@/components/Logo/Logo.vue';
import { useNotification } from '@/composables/useNotification';

import ziwahImg from '@/assets/images/brand/ziwah.png';

import { get_laporan_harian, list } from '@/service/laporan_umum';
// Global Properties
const { appContext } = getCurrentInstance()!;

import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

const $formatToRupiah = appContext.config.globalProperties.$formatToRupiah;
const $terbilangUang = appContext.config.globalProperties.$terbilangUang;

const isLoading = ref(false);
const isDownloading = ref(false);

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

const data = ref<any>(null);

const selectedYear = ref<number>(new Date().getFullYear());
const selectedMonth = ref<number>(new Date().getMonth() + 1);

// Generate tahun options (5 tahun ke belakang)
const yearOptions = ref<number[]>([]);
for (let i = 0; i < 5; i++) {
  yearOptions.value.push(new Date().getFullYear() - i);
}

// Generate bulan options
const monthOptions = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

// Function: Fetch Data
async function fetchData() {
  isLoading.value = true;
  try {
    const response = await list(selectedYear.value, selectedMonth.value);
    if (response && response.status) {
      data.value = response.data;
      console.log('Data laporan umum:', data.value);
    } else {
      displayNotification('Gagal mengambil data laporan umum', 'error');
    }
  } catch (error) {
    displayNotification('Terjadi kesalahan saat mengambil data laporan umum', 'error');
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

// Function: Handle filter change
// async function handleFilterChange() {
//   await fetchData();
// }

// Function: Fix oklch colors
// function fixOklchColors(element: HTMLElement) {
//   const all = element.querySelectorAll('*');
//   all.forEach((el) => {
//     const htmlEl = el as HTMLElement;
//     const style = window.getComputedStyle(htmlEl);

//     if (style.color.includes('oklch')) htmlEl.style.color = '#000000';
//     if (style.backgroundColor.includes('oklch')) htmlEl.style.backgroundColor = '#ffffff';
//     if (style.borderColor.includes('oklch')) htmlEl.style.borderColor = '#d1d5db';
//   });
// }

// Function: Download PDF
// async function handleDownloadPDF() {
//   if (isDownloading.value) return;
//   if (!data.value) {
//     displayNotification('Tidak ada data untuk diunduh', 'error');
//     return;
//   }

//   isDownloading.value = true;

//   try {
//     const contentWrapper = document.getElementById('laporan-content');
//     if (!contentWrapper) {
//       displayNotification('Konten tidak ditemukan', 'error');
//       isDownloading.value = false;
//       return;
//     }

//     // Clone content untuk PDF
//     const clonedContent = contentWrapper.cloneNode(true) as HTMLElement;

//     // Buat temporary container
//     const tempContainer = document.createElement('div');
//     tempContainer.style.position = 'absolute';
//     tempContainer.style.left = '-9999px';
//     tempContainer.style.top = '0';
//     tempContainer.style.width = '1200px';
//     tempContainer.style.background = '#ffffff';
//     tempContainer.style.padding = '20px';
//     tempContainer.appendChild(clonedContent);

//     document.body.appendChild(tempContainer);

//     // Show PDF header
//     const pdfHeader = tempContainer.querySelector('.pdf-header') as HTMLElement;
//     if (pdfHeader) {
//       pdfHeader.style.display = 'block';
//     }

//     // Fix oklch colors
//     fixOklchColors(tempContainer);

//     // Tunggu layout settle
//     await new Promise((resolve) => setTimeout(resolve, 300));

//     // Capture ke canvas
//     const canvas = await html2canvas(tempContainer, {
//       scale: 2,
//       useCORS: true,
//       logging: false,
//       backgroundColor: '#ffffff',
//       windowWidth: tempContainer.scrollWidth,
//       windowHeight: tempContainer.scrollHeight,
//     });

//     // Remove temporary container
//     document.body.removeChild(tempContainer);

//     const imgData = canvas.toDataURL('image/png');

//     // Buat PDF A4
//     const pdf = new jsPDF({
//       orientation: 'portrait',
//       unit: 'mm',
//       format: 'a4',
//       compress: true,
//     });

//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = pdf.internal.pageSize.getHeight();

//     // Convert px to mm
//     const imgWidthMM = (canvas.width * 25.4) / 96;
//     const imgHeightMM = (canvas.height * 25.4) / 96;

//     // Scale untuk fit ke lebar A4
//     const scale = pdfWidth / imgWidthMM;
//     const scaledHeight = imgHeightMM * scale;

//     // Split ke multiple pages jika perlu
//     let yPosition = 0;
//     while (yPosition < scaledHeight) {
//       if (yPosition > 0) pdf.addPage();

//       pdf.addImage(imgData, 'PNG', 0, -yPosition, pdfWidth, scaledHeight, '', 'FAST');

//       yPosition += pdfHeight;
//     }

//     // Download
//     pdf.save(`Laporan_Umum_${getMonthName(selectedMonth.value)}_${selectedYear.value}.pdf`);
//     displayNotification('PDF berhasil diunduh', 'success');
//   } catch (error: any) {
//     console.error('❌ Error generating PDF:', error);
//     displayNotification('Gagal mengunduh PDF: ' + error.message, 'error');
//   } finally {
//     isDownloading.value = false;
//   }
// }

async function loadImageAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

const debug_harian = async () => {
  try {
    const response = await get_laporan_harian();
    console.log('Laporan harian:', response);
  } catch (error) {
    console.error('Error fetching laporan harian:', error);
  }
};

// Lifecycle
async function cetakLaporanHarian() {
  isLoading.value = true;
  try {
    const response = await get_laporan_harian();
    const laporanData = response;

    // Load images

    const logo = BASE_URL + '/uploads/img/logos/site_logo.png';
    const logoBase64 = await loadImageAsBase64(logo);
    // const footer = '/images/ziwah.png';
    const footerBase64 = await loadImageAsBase64(ziwahImg);

    // Inisialisasi PDF
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    let y = 15;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 15;
    const rightMargin = pageWidth - 15;

    // Format tanggal
    const tanggalCetak = new Date(laporanData.date);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    const tanggalStr = tanggalCetak.toLocaleDateString('id-ID', options);
    const [year, month, day] = laporanData.date.split('-');

    // ==================== HEADER (SAMA SEPERTI CETAK SERAH TERIMA) ====================
    // Logo di kiri atas
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
    const namaKabupaten = `BAITUL MAL ${laporanData.lokasi_kantor.nama_kabupaten_kota.toUpperCase()}`;
    doc.text(namaKabupaten, pageWidth - 85, y, { align: 'left' });
    y += 4;

    // Alamat dari API
    const alamatKantorWrapped = doc.splitTextToSize(laporanData.lokasi_kantor.alamat, 70);
    doc.text(alamatKantorWrapped, pageWidth - 85, y, { align: 'left' });
    y += alamatKantorWrapped.length * 4;

    // ==================== JUDUL ====================
    y += 18;
    doc.setFillColor(220, 220, 220);
    doc.rect(leftMargin, y, rightMargin - leftMargin, 8, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(leftMargin, y, rightMargin - leftMargin, 8);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('ZAKAT / INFAQ / DONASI', pageWidth / 2, y + 5.5, { align: 'center' });

    y += 20;

    // ==================== JENIS PEMBAYARAN: ZAKAT ====================
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('• Jenis Pembayaran : Zakat', leftMargin + 5, y);
    y += 3; // Dikurangi dari 7 jadi 5

    // Tabel Zakat
    const colWidths = [15, 75, 55, 35]; // No, Nama Muzakki, Tipe Zakat, Jumlah
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // Set line width untuk border tipis
    doc.setLineWidth(0.2);

    // Header tabel
    doc.setFillColor(220, 220, 220);
    doc.rect(leftMargin, y, tableWidth, 8, 'FD');

    doc.setFont('times', 'bold');
    doc.setFontSize(9);
    let xPos = leftMargin;

    doc.text('No', xPos + 2, y + 5.5);
    xPos += colWidths[0];

    doc.text('Nama Muzakki', xPos + 2, y + 5.5);
    xPos += colWidths[1];

    doc.text('Tipe Zakat', xPos + 2, y + 5.5);
    xPos += colWidths[2];

    doc.text('Jumlah', xPos + 2, y + 5.5);

    y += 8;

    // Data rows Zakat
    doc.setFont('times', 'normal');
    if (laporanData.zakat.list && laporanData.zakat.list.length > 0) {
      laporanData.zakat.list.forEach((item: any, index: number) => {
        doc.rect(leftMargin, y, tableWidth, 7, 'D');

        xPos = leftMargin;
        doc.text(String(index + 1), xPos + 2, y + 5);
        xPos += colWidths[0];

        doc.text(item.Member.fullname, xPos + 2, y + 5);
        xPos += colWidths[1];

        // Format tipe zakat
        const tipeZakat = item.tipe
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        doc.text(tipeZakat, xPos + 2, y + 5);
        xPos += colWidths[2];

        doc.text(formatRupiah(item.nominal), xPos + 2, y + 5);

        y += 7;
      });
    } else {
      // Tampilkan pesan "Data tidak ditemukan"
      doc.rect(leftMargin, y, tableWidth, 7, 'D');
      doc.setFont('times', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Data tidak ditemukan', leftMargin + tableWidth / 2, y + 5, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
      y += 7;
    }

    // Row Jumlah Total Zakat dengan background gray
    doc.setFont('times', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, y, tableWidth, 7, 'FD');
    xPos = leftMargin + colWidths[0];
    doc.text('Jumlah Total', xPos + 2, y + 5);
    xPos = leftMargin + colWidths[0] + colWidths[1] + colWidths[2];
    doc.text(formatRupiah(laporanData.zakat.total), xPos + 2, y + 5);

    y += 20;

    // ==================== JENIS PEMBAYARAN: INFAQ ====================
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('• Jenis Pembayaran : Infaq', leftMargin + 5, y);
    y += 3; // Dikurangi dari 7 jadi 5

    // Tabel Infaq (3 kolom - tanpa tipe)
    const colWidthsInfaq = [15, 130, 35];
    const tableWidthInfaq = colWidthsInfaq.reduce((a, b) => a + b, 0);

    // Header
    doc.setFillColor(220, 220, 220);
    doc.rect(leftMargin, y, tableWidthInfaq, 8, 'FD');
    xPos = leftMargin;
    doc.text('No', xPos + 2, y + 5.5);
    xPos += colWidthsInfaq[0];
    doc.text('Nama Muzakki', xPos + 2, y + 5.5);
    xPos += colWidthsInfaq[1];
    doc.text('Jumlah', xPos + 2, y + 5.5);

    y += 8;

    // Data Infaq
    doc.setFont('times', 'normal');
    if (laporanData.infaq.list && laporanData.infaq.list.length > 0) {
      laporanData.infaq.list.forEach((item: any, index: number) => {
        doc.rect(leftMargin, y, tableWidthInfaq, 7, 'D');
        xPos = leftMargin;
        doc.text(String(index + 1), xPos + 2, y + 5);
        xPos += colWidthsInfaq[0];
        doc.text(item.Member.fullname, xPos + 2, y + 5);
        xPos += colWidthsInfaq[1];
        doc.text(formatRupiah(item.nominal), xPos + 2, y + 5);
        y += 7;
      });
    } else {
      doc.rect(leftMargin, y, tableWidthInfaq, 7, 'D');
      doc.setFont('times', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Data tidak ditemukan', leftMargin + tableWidthInfaq / 2, y + 5, {
        align: 'center',
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
      y += 7;
    }

    // Total Infaq dengan background gray
    doc.setFont('times', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, y, tableWidthInfaq, 7, 'FD');
    xPos = leftMargin + colWidthsInfaq[0];
    doc.text('Jumlah Total', xPos + 2, y + 5);
    xPos = leftMargin + colWidthsInfaq[0] + colWidthsInfaq[1];
    doc.text(formatRupiah(laporanData.infaq.total), xPos + 2, y + 5);

    y += 20;

    // ==================== JENIS PEMBAYARAN: DONASI ====================
    doc.setFont('times', 'bold');
    doc.text('• Jenis Pembayaran : Donasi', leftMargin + 5, y);
    y += 3; // Dikurangi dari 7 jadi 5

    // Tabel Donasi
    const colWidthsDonasi = [15, 130, 35];
    const tableWidthDonasi = colWidthsDonasi.reduce((a, b) => a + b, 0);

    doc.setFillColor(220, 220, 220);
    doc.rect(leftMargin, y, tableWidthDonasi, 8, 'FD');
    xPos = leftMargin;
    doc.text('No', xPos + 2, y + 5.5);
    xPos += colWidthsDonasi[0];
    doc.text('Nama Muzakki', xPos + 2, y + 5.5);
    xPos += colWidthsDonasi[1];
    doc.text('Jumlah', xPos + 2, y + 5.5);

    y += 8;

    // Data Donasi
    doc.setFont('times', 'normal');
    if (laporanData.donasi.list && laporanData.donasi.list.length > 0) {
      laporanData.donasi.list.forEach((item: any, index: number) => {
        doc.rect(leftMargin, y, tableWidthDonasi, 7, 'D');
        xPos = leftMargin;
        doc.text(String(index + 1), xPos + 2, y + 5);
        xPos += colWidthsDonasi[0];
        doc.text(item.Member.fullname, xPos + 2, y + 5);
        xPos += colWidthsDonasi[1];
        doc.text(formatRupiah(item.nominal), xPos + 2, y + 5);
        y += 7;
      });
    } else {
      doc.rect(leftMargin, y, tableWidthDonasi, 7, 'D');
      doc.setFont('times', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Data tidak ditemukan', leftMargin + tableWidthDonasi / 2, y + 5, {
        align: 'center',
      });
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
      y += 7;
    }

    // Total Donasi dengan background gray
    doc.setFont('times', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, y, tableWidthDonasi, 7, 'FD');
    xPos = leftMargin + colWidthsDonasi[0];
    doc.text('Jumlah Total', xPos + 2, y + 5);
    xPos = leftMargin + colWidthsDonasi[0] + colWidthsDonasi[1];
    doc.text(formatRupiah(laporanData.donasi.total), xPos + 2, y + 5);

    y += 25;

    // ==================== GRAND TOTAL ====================
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(`• Grand Total : ${formatRupiah(laporanData.grandTotal)}`, leftMargin + 5, y);
    y += 8;

    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    const terbilang = $terbilangUang(laporanData.grandTotal, {
      case: 'title',
      currency: 'Rupiah',
    });
    doc.text(`  Terbilang    : ${terbilang}`, leftMargin + 5, y);

    // ==================== FOOTER ====================
    const scaleFooter = 0.28;
    const footerWidth = 106 * scaleFooter;
    const footerHeight = 34 * scaleFooter;

    // Garis pemisah
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20);

    // Teks footer
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Dicetak Pada: ${tanggalStr} `, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });

    // Logo footer
    doc.addImage(footerBase64, 'PNG', 15, pageHeight - 15, footerWidth, footerHeight);

    // ==================== SAVE PDF ====================
    const fileName = `Laporan_Harian_${day}-${month}-${year}.pdf`;
    doc.save(fileName);

    displayNotification('Laporan harian berhasil dicetak', 'success');
  } catch (error: any) {
    console.error('Error cetak laporan harian:', error);
    displayNotification(error.response?.data?.message || 'Gagal mencetak laporan harian', 'error');
  } finally {
    isLoading.value = false;
  }
}
onMounted(async () => {
  await fetchData();
  debug_harian();
});

const cetak_laporan_umum = () => {
  const printUrl = `/laporan-umum/`;
  window.open(printUrl, '_blank');
};

// Utils
const formatRupiah = (value: number) => {
  if (!value) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const getMonthName = (month: number) => {
  return monthOptions.find((m) => m.value === month)?.label || '';
};
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2 mr-4">
        <BaseButton @click="cetak_laporan_umum()" class="flex items-center justify-center">
          <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
          <span>Cetak</span>
        </BaseButton>
        <BaseButton
          variant="warning"
          @click="cetakLaporanHarian()"
          class="flex items-center justify-center"
        >
          <font-awesome-icon icon="fa-solid fa-print" class="mr-2" />
          <span>Rekap Pengumpulan Harian Oleh Petugas</span>
        </BaseButton>
      </div>
      <Logo />
    </div>
    <!-- Grid Content -->
    <div v-if="data" class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      <!-- Kiri -->
      <div class="space-y-6">
        <!-- Info Umum -->

        <div>
          <div class="bg-gray-200 px-4 py-2 border-t border-l border-r border-gray-300 font-medium">
            INFO UMUM
          </div>
          <div class="border border-t-0 border-gray-300 divide-y divide-gray-300">
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Member</span>
              <span>:</span>
              <span>{{ data.info_umum.totalMember }} Orang</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Asnaf</span>
              <span>:</span>
              <span>{{ data.info_umum.totalAsnaf }} Asnaf</span>
            </div>
            <div class="border border-t-0 border-gray-300 divide-y divide-gray-300">
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Total Member</span>
                <span>:</span>
                <span>{{ data.info_umum.totalMember }} Orang</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Total Asnaf</span>
                <span>:</span>
                <span>{{ data.info_umum.totalAsnaf }} Asnaf</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Total Program</span>
                <span>:</span>
                <span>{{ data.info_umum.totalProgram }} Program</span>
              </div>
            </div>
          </div>

          <!-- Info Program Bantuan -->
          <div>
            <div
              class="bg-gray-200 px-4 py-2 border-t border-l border-r border-gray-300 font-medium"
            >
              INFO PROGRAM BANTUAN
            </div>
            <div class="border border-t-0 border-gray-300 divide-y divide-gray-300">
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Total Program Penyaluran</span>
                <span>:</span>
                <span>{{ data.info_program_bantuan.totalProgramPenyaluran }} Program Bantuan</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Total Penerima Bantuan</span>
                <span>:</span>
                <span>{{ data.info_program_bantuan.totalPenerimaBantuan }} Pemohon</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Total Penyaluran Bantuan</span>
                <span>:</span>
                <span>{{ formatRupiah(data.info_program_bantuan.totalPenyaluranBantuan) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Kanan -->
      <div class="space-y-6">
        <!-- Total Penerimaan Zakat -->
        <div>
          <div class="bg-gray-200 px-4 py-2 border-t border-l border-r border-gray-300 font-medium">
            TOTAL PENERIMAAN ZAKAT
          </div>
          <div class="border border-t-0 border-gray-300 divide-y divide-gray-300">
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Zakat Hari Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_zakat.totalPenerimaanZakatHariIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Zakat Bulan Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_zakat.totalPenerimaanZakatBulanIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Zakat Tahun Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_zakat.totalPenerimaanZakatTahunIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Zakat</span>
              <span>:</span>
              <span>{{ formatRupiah(data.total_penerimaan_zakat.totalPenerimaanZakat) }}</span>
            </div>
          </div>
        </div>

        <!-- Total Penerimaan Infaq -->
        <div>
          <div class="bg-gray-200 px-4 py-2 border-t border-l border-r border-gray-300 font-medium">
            TOTAL PENERIMAAN INFAQ
          </div>
          <div class="border border-t-0 border-gray-300 divide-y divide-gray-300">
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Infaq Hari Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_infaq.totalPenerimaanInfaqHariIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Infaq Bulan Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_infaq.totalPenerimaanInfaqBulanIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Infaq Tahun Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_infaq.totalPenerimaanInfaqTahunIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Infaq</span>
              <span>:</span>
              <span>{{ formatRupiah(data.total_penerimaan_infaq.totalPenerimaanInfaq) }}</span>
            </div>
          </div>
        </div>

        <!-- Total Penerimaan Donasi -->
        <div>
          <div class="bg-gray-200 px-4 py-2 border-t border-l border-r border-gray-300 font-medium">
            TOTAL PENERIMAAN DONASI
          </div>
          <div class="border border-t-0 border-gray-300 divide-y divide-gray-300">
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Donasi Hari Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_donasi.totalPenerimaanDonasiHariIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Donasi Bulan Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_donasi.totalPenerimaanDonasiBulanIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Donasi Tahun Ini</span>
              <span>:</span>
              <span>{{
                formatRupiah(data.total_penerimaan_donasi.totalPenerimaanDonasiTahunIni)
              }}</span>
            </div>
            <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
              <span>Total Penerimaan Donasi</span>
              <span>:</span>
              <span>{{ formatRupiah(data.total_penerimaan_donasi.totalPenerimaanDonasi) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-gray-500 py-10">Memuat data laporan umum...</div>

    <!-- Notification Modal -->
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
