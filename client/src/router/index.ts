import Beranda from '@/modules/Cetak/Beranda.vue';
import LaporanKesekretariatan from '@/modules/Cetak/LaporanKesekretariatan.vue';
import LaporanPengumpulan from '@/modules/Cetak/LaporanPengumpulan.vue';
import LaporanPerencanaan from '@/modules/Cetak/LaporanPerencanaan.vue';
import LaporanTahunan from '@/modules/Cetak/LaporanTahunan.vue';
import LaporanUmum from '@/modules/Cetak/LaporanUmum.vue';
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
          'Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah merupakan platform digital yang dirancang untuk mempermudah pengelolaan data penerima manfaat (mustahik) dan pemberi zakat (muzaki). Melalui aplikasi ini, proses pendataan, penyaluran, dan pelaporan zakat, infak, serta sedekah dapat dilakukan dengan lebih transparan, cepat, dan akurat. Aplikasi ini juga mendukung visi Baitul Mal Kabupaten Bener Meriah dalam mewujudkan tata kelola zakat yang religius, mandiri, dan sejahtera bagi masyarakat.',
      },
    },
    {
      path: '/login-admin',
      name: 'login-admin',
      component: LoginAdminView,
      meta: {
        title: 'Login Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah untuk registrasi, pendataan, dan layanan zakat secara mudah, cepat, dan transparan.',
      },
    },
    {
      path: '/registrasi',
      name: 'registrasi',
      component: Register,
      meta: {
        title: 'Registrasi Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Daftar sekarang di Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah. Nikmati kemudahan layanan zakat online, mulai dari registrasi hingga pendataan, dengan sistem yang aman, transparan, dan terpercaya.',
      },
    },
    {
      path: '/member-area',
      name: 'member-area',
      component: MemberAreaView,
      meta: {
        title: 'Member Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/administrator-area',
      name: 'administrator-area',
      component: AdministratorAreaView,
      meta: {
        title: 'Administrator Area || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/survey',
      name: 'survey-lapangan',
      component: SurveyLapanganView,
      meta: {
        title: 'Apakah Anda Suka dengan Survey Lapangan ini?',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/laporan-tahunan/:tahun',
      name: 'laporan-tahunan',
      component: LaporanTahunan,
      meta: {
        title: 'Laporan Tahunan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/laporan-pengumpulan/:tahun',
      name: 'laporan-pengumpulan',
      component: LaporanPengumpulan,
      meta: {
        title: 'Laporan Pengumpulan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/laporan-umum',
      name: 'laporan-umum',
      component: LaporanUmum,
      meta: {
        title: 'Laporan Umum || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },

    // laporan-umum
    {
      path: '/laporan-perencanaan/:tahun/:program/:perpage/:currentpage',
      name: 'laporan-perencanaan',
      component: LaporanPerencanaan,
      meta: {
        title: 'Laporan Perencanaan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/beranda/:tahun',
      name: 'beranda',
      component: Beranda,
      meta: {
        title: 'Beranda || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/cetak-laporan-asnaf-fakir/:tahun',
      name: 'cetak-laporan-asnaf-fakir',
      component: CetakLaporanAsnafFakir,
      meta: {
        title: 'Cetak Laporan Asnaf Fakir || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriahh',
        description: '',
      },
    },
    {
      path: '/cetak-laporan-asnaf-filsabilillah/:tahun',
      name: 'cetak-laporan-asnaf-filsabilillah',
      component: CetakLaporanAsnafFilsabilillah,
      meta: {
        title:
          'Cetak Laporan Asnaf Filsabilillah || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: '',
      },
    },
    {
      path: '/cetak-laporan-asnaf-gharim/:tahun',
      name: 'cetak-laporan-asnaf-gharim',
      component: CetakLaporanAsnafGharim,
      meta: {
        title: 'Cetak Laporan Asnaf Gharim || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: '',
      },
    },
    {
      path: '/cetak-laporan-asnaf-miskin/:tahun',
      name: 'cetak-laporan-asnaf-miskin',
      component: CetakLaporanAsnafMiskin,
      meta: {
        title:
          'Cetak Laporan Asnaf MiskinCetakLaporanAsnafMiskin || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: '',
      },
    },
    {
      path: '/cetak-laporan-asnaf-ibnu-sabil/:tahun',
      name: 'cetak-laporan-asnaf-ibnu-sabil',
      component: CetakLaporanAsnafIbnuSabil,
      meta: {
        title:
          'Cetak Laporan Asnaf Ibnu Sabil || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriahh',
        description: '',
      },
    },
    {
      path: '/cetak-laporan-asnaf-mualaf/:tahun',
      name: 'cetak-laporan-asnaf-mualaf',
      component: CetakLaporanAsnafMualaf,
      meta: {
        title: 'Cetak Laporan Asnaf Mualaf || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: '',
      },
    },
    {
      path: '/rekap-distribusi-per-asnaf/:tahun',
      name: 'rekap-per-asnaf',
      component: CetakRekapDistribusiPerAsnaf,
      meta: {
        title: 'Cetak Rekap Per Asnaf || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/rekap-distribusi-perkecamatan/:tahun',
      name: 'rekap-distribusi-perkecamatan',
      component: CetakRekapDistribusiPerkecamatan,
      meta: {
        title:
          'Rekap Distribusi Perkecamatan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description: '',
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
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/rekap-pengumpulan-perkecamatan/:tahun',
      name: 'rekap-pengumpulan-perkecamatan',
      component: CetakRekapPengumpulanPerkecamatan,
      meta: {
        title:
          'Rekap Pengumpulan Perkecamatan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
      },
    },
    {
      path: '/rekap-pengumpulan/:tahun',
      name: 'cetak-rekap-pengumpulan',
      component: CetakRekapPengumpulan,
      meta: {
        title: 'Cetak Rekap Pengumpulan || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
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
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
    {
      path: '/kalkulator',
      name: 'kalkulator',
      component: Kalkulator,
      meta: {
        title: 'Kalkulator Zakat || Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah',
        description:
          'Member Area Aplikasi Mustahik dan Muzaki Kabupaten Bener Meriah memberikan akses mudah untuk melihat data zakat, status permohonan, serta laporan transaksi secara aman dan transparan',
      },
    },
  ],
});

export default router;
