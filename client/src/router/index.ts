import Beranda from '@/modules/Cetak/Beranda.vue';
import LaporanKesekretariatan from '@/modules/Cetak/LaporanKesekretariatan.vue';
import LaporanPengumpulan from '@/modules/Cetak/LaporanPengumpulan.vue';
import LaporanPerencanaan from '@/modules/Cetak/LaporanPerencanaan.vue';
import LaporanTahunan from '@/modules/Cetak/LaporanTahunan.vue';
import LaporanUmum from '@/modules/Cetak/LaporanUmum.vue';
import BuktiSetoranZakat from '@/modules/Cetak/BuktiSetoranZakat.vue';
import BuktiSetoranInfaq from '@/modules/Cetak/BuktiSetoranInfaq.vue';
import BuktiSetoranDonasi from '@/modules/Cetak/BuktiSetoranDonasi.vue';
import CetakLaporanAsnafFakir from '@/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafFakir.vue';
import CetakLaporanAsnafFilsabilillah from '@/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafFilsabilillah.vue';
import CetakLaporanAsnafGharim from '@/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafGharim.vue';
import CetakLaporanAsnafMiskin from '@/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafMiskin.vue';
import CetakLaporanAsnafIbnuSabil from '@/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafIbnuSabil.vue';
import CetakLaporanAsnafMualaf from '@/modules/LaporanAsnaf/CetakAsnaf/CetakLaporanAsnafMualaf.vue';
import Register from '@/modules/Register/Register.vue';
import CetakRekapDistribusiPerAsnaf from '@/modules/RekapDistribusiPerAsnaf/CetakRekapDistribusiPerAsnaf.vue';
import CetakRekapDistribusiPerkecamatan from '@/modules/RekapPerkecamatan/CetakRekapDistribusiPerkecamatan.vue';
import CetakRekapPengumpulanPerkecamatan from '@/modules/RekapPengumpulanPerKecamatan/CetakRekapPengumpulanPerkecamatan.vue';
import CetakRekapPengumpulan from '@/modules/RekapPengumpulan/CetakRekapPengumpulan.vue';
import CetakRekapDistribusiPerKodeAsnaf from '@/modules/RekapDistribusiPerKodeAsnaf/CetakRekapDistribusiPerKodeAsnaf.vue';
import AdministratorAreaView from '@/views/AdministratorView.vue';
import homeView from '@/views/HomeView.vue';
import LoginAdminView from '@/views/LoginAdminView.vue';
import MemberAreaView from '@/views/MemberAreaView.vue';
import SurveyLapanganView from '@/views/SurveyLapanganView.vue';
import { createRouter, createWebHistory } from 'vue-router';
import Kalkulator from '@/modules/Kalkulator/Kalkulator.vue';

// console.log('=====BASE_URL');
// console.log(import.meta.env.BASE_URL);
// console.log('=====BASE_URL');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: homeView,
      meta: {
        title: 'Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Platform digital untuk mengelola data mustahik dan muzaki, memfasilitasi pendataan, penyaluran, dan pelaporan zakat secara transparan, aman, dan efisien.',
      },
    },
    {
      path: '/login-admin',
      name: 'login-admin',
      component: LoginAdminView,
      meta: {
        title: 'Login Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Masuk ke panel admin untuk mengelola data, verifikasi, dan laporan zakat secara terpusat dan aman.',
      },
    },
    {
      path: '/registrasi',
      name: 'registrasi',
      component: Register,
      meta: {
        title: 'Registrasi Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Formulir registrasi untuk mustahik dan muzaki — pendaftaran cepat, aman, dan tercatat.',
      },
    },
    {
      path: '/member-area',
      name: 'member-area',
      component: MemberAreaView,
      meta: {
        title: 'Member Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Akses pribadi untuk melihat data, status permohonan, dan riwayat transaksi zakat secara aman dan tercatat.',
      },
    },
    {
      path: '/administrator-area',
      name: 'administrator-area',
      component: AdministratorAreaView,
      meta: {
        title: 'Administrator Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Panel admin untuk manajemen data, distribusi bantuan, dan pembuatan laporan operasional zakat.',
      },
    },
    {
      path: '/survey',
      name: 'survey-lapangan',
      component: SurveyLapanganView,
      meta: {
        title: 'Survey Lapangan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Form survei lapangan untuk verifikasi kondisi mustahik dan kelengkapan data prioritas penyaluran.',
      },
    },
    {
      path: '/bukti-setoran-zakat/:id',
      name: 'bukti-setoran-zakat',
      component: BuktiSetoranZakat,
      meta: {
        title: 'Bukti Setoran Zakat || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Menampilkan bukti setoran zakat yang tercatat dalam sistem untuk keperluan administrasi dan pelaporan.',
      },
    },
    {
      path: '/bukti-setoran-infaq/:id',
      name: 'bukti-setoran-infaq',
      component: BuktiSetoranInfaq,
      meta: {
        title: 'Bukti Setoran Infaq || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Menampilkan bukti setoran infaq yang tercatat dalam sistem untuk keperluan administrasi dan pelaporan.',
      },
    },
    {
      path: '/bukti-setoran-donasi/:id',
      name: 'bukti-setoran-donasi',
      component: BuktiSetoranDonasi,
      meta: {
        title: 'Bukti Setoran Donasi || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Menampilkan bukti setoran donasi yang tercatat dalam sistem untuk keperluan administrasi dan pelaporan.',
      },
    },
    {
      path: '/laporan-tahunan/:tahun',
      name: 'laporan-tahunan',
      component: LaporanTahunan,
      meta: {
        title: 'Laporan Tahunan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Laporan tahunan pengumpulan dan penyaluran zakat untuk evaluasi kinerja dan akuntabilitas.',
      },
    },
    {
      path: '/laporan-pengumpulan/:tahun',
      name: 'laporan-pengumpulan',
      component: LaporanPengumpulan,
      meta: {
        title: 'Laporan Pengumpulan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: 'Laporan pengumpulan zakat, infaq, dan donasi untuk periode tertentu.',
      },
    },
    {
      path: '/laporan-umum',
      name: 'laporan-umum',
      component: LaporanUmum,
      meta: {
        title: 'Laporan Umum || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Laporan umum yang merangkum data pengumpulan dan penyaluran untuk kepentingan publik dan stakeholder.',
      },
    },
    {
      path: '/laporan-perencanaan/:tahun/:program/:perpage/:currentpage',
      name: 'laporan-perencanaan',
      component: LaporanPerencanaan,
      meta: {
        title: 'Laporan Perencanaan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Laporan perencanaan program dan anggaran untuk penyaluran manfaat berdasarkan prioritas.',
      },
    },
    {
      path: '/beranda/:tahun',
      name: 'beranda',
      component: Beranda,
      meta: {
        title: 'Beranda || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Ringkasan informasi, statistik, dan akses cepat ke fitur utama aplikasi pengelolaan zakat.',
      },
    },
    {
      path: '/cetak-laporan-asnaf-fakir/:tahun',
      name: 'cetak-laporan-asnaf-fakir',
      component: CetakLaporanAsnafFakir,
      meta: {
        title: 'Cetak Laporan Asnaf Fakir || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak laporan data asnaf kategori fakir untuk keperluan administrasi dan distribusi.',
      },
    },
    {
      path: '/cetak-laporan-asnaf-filsabilillah/:tahun',
      name: 'cetak-laporan-asnaf-filsabilillah',
      component: CetakLaporanAsnafFilsabilillah,
      meta: {
        title:
          'Cetak Laporan Asnaf Filsabilillah || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak laporan data asnaf kategori filsabilillah untuk keperluan administrasi dan distribusi.',
      },
    },
    {
      path: '/cetak-laporan-asnaf-gharim/:tahun',
      name: 'cetak-laporan-asnaf-gharim',
      component: CetakLaporanAsnafGharim,
      meta: {
        title: 'Cetak Laporan Asnaf Gharim || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak laporan data asnaf kategori gharim untuk keperluan administrasi dan distribusi.',
      },
    },
    {
      path: '/cetak-laporan-asnaf-miskin/:tahun',
      name: 'cetak-laporan-asnaf-miskin',
      component: CetakLaporanAsnafMiskin,
      meta: {
        title: 'Cetak Laporan Asnaf Miskin || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak laporan data asnaf kategori miskin untuk keperluan administrasi dan distribusi.',
      },
    },
    {
      path: '/cetak-laporan-asnaf-ibnu-sabil/:tahun',
      name: 'cetak-laporan-asnaf-ibnu-sabil',
      component: CetakLaporanAsnafIbnuSabil,
      meta: {
        title:
          'Cetak Laporan Asnaf Ibnu Sabil || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak laporan data asnaf kategori ibnu sabil untuk keperluan administrasi dan distribusi.',
      },
    },
    {
      path: '/cetak-laporan-asnaf-mualaf/:tahun',
      name: 'cetak-laporan-asnaf-mualaf',
      component: CetakLaporanAsnafMualaf,
      meta: {
        title: 'Cetak Laporan Asnaf Mualaf || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak laporan data asnaf kategori mualaf untuk keperluan administrasi dan distribusi.',
      },
    },
    {
      path: '/rekap-distribusi-per-asnaf/:tahun',
      name: 'rekap-per-asnaf',
      component: CetakRekapDistribusiPerAsnaf,
      meta: {
        title: 'Cetak Rekap Per Asnaf || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: 'Rekap distribusi bantuan per kategori asnaf untuk periode yang dipilih.',
      },
    },
    {
      path: '/rekap-distribusi-perkecamatan/:tahun',
      name: 'rekap-distribusi-perkecamatan',
      component: CetakRekapDistribusiPerkecamatan,
      meta: {
        title:
          'Rekap Distribusi Perkecamatan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: 'Rekap distribusi bantuan per kecamatan untuk analisis jangkauan program.',
      },
    },
    {
      path: '/cetak-laporan-kesekretariatan/:tahun',
      name: 'cetak-laporan-kesekretariatan',
      component: LaporanKesekretariatan,
      meta: {
        title:
          'Cetak Laporan Kesekretariatan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak laporan administrasi kesekretariatan untuk keperluan internal dan arsip.',
      },
    },
    {
      path: '/rekap-pengumpulan-perkecamatan/:tahun',
      name: 'rekap-pengumpulan-perkecamatan',
      component: CetakRekapPengumpulanPerkecamatan,
      meta: {
        title:
          'Rekap Pengumpulan Perkecamatan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: 'Rekap pengumpulan zakat dan donasi per kecamatan untuk periode tertentu.',
      },
    },
    {
      path: '/rekap-pengumpulan/:tahun',
      name: 'cetak-rekap-pengumpulan',
      component: CetakRekapPengumpulan,
      meta: {
        title: 'Cetak Rekap Pengumpulan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak rekap pengumpulan zakat dan donasi untuk keperluan pelaporan dan akuntabilitas.',
      },
    },
    {
      path: '/rekap-distribusi-per-kode-asnaf/:tahun',
      name: 'cetak-rekap-distribusi-per-kode-asnaf',
      component: CetakRekapDistribusiPerKodeAsnaf,
      meta: {
        title:
          'Cetak Rekap Distribusi Per Kode Asnaf || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Cetak rekap distribusi berdasarkan kode asnaf untuk audit dan analisis distribusi.',
      },
    },
    {
      path: '/kalkulator',
      name: 'kalkulator',
      component: Kalkulator,
      meta: {
        title: 'Kalkulator Zakat || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Alat bantu menghitung kewajiban zakat sesuai jenis harta dan nisab yang berlaku.',
      },
    },
  ],
});

export default router;
