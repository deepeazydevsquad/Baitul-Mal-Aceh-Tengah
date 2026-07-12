<script setup lang="ts">
import { initTooltips } from 'flowbite';
import { nextTick, onMounted, ref, watch } from 'vue';
import {
  useGlobalActiveTab,
  useGlobalTab,
  useSelectedTab,
  useTabTerpilih,
} from '../../../../stores/sidebar';

import { MessageTabZakat, MessageTabDonasi, MessageTabInfaq } from '@/stores/message';

const messageZakat = MessageTabZakat();
const messageDonasi = MessageTabDonasi();
const messageInfaq = MessageTabInfaq();

// components
import BakalPenerimaBantuan from '@/modules/BakalPenerimaBantuan/BakalPenerimaBantuan.vue';
import Bank from '@/modules/Bank/Bank.vue';
import BankPengumpulan from '@/modules/BankPengumpulan/BankPengumpulan.vue';
import Beranda from '@/modules/Beranda/Beranda.vue';
import DaftarAsnaf from '@/modules/DaftarAsnaf/DaftarAsnaf.vue';
import DaftarKeanggotaan from '@/modules/DaftarKeanggotaan/DaftarKeanggotaan.vue';
import LaporanUmum from '@/modules/DaftarLaporanUmum/LaporanUmum.vue';
import DaftarPengguna from '@/modules/DaftarPengguna/DaftarPengguna.vue';
import DaftarProgram from '@/modules/DaftarProgram/DaftarProgram.vue';
import DaftarTab from '@/modules/DaftarTab/DaftarTab.vue';
import desa from '@/modules/Desa/Desa.vue';
import GrupAkses from '@/modules/GrupAkses/GrupAkses.vue';
import kecamatan from '@/modules/Kecamatan/Kecamatan.vue';
import KegiatanKeseketariatan from '@/modules/KegiatanKeseketariatan/KegiatanKeseketariatan.vue';
import Kriteria from '@/modules/Kriteria/Kriteria.vue';
import LaporanAsnafFakir from '@/modules/LaporanAsnaf/LaporanAsnafFakir.vue';
import LaporanAsnafFisabilillah from '@/modules/LaporanAsnaf/LaporanAsnafFisabilillah.vue';
import LaporanAsnafGharim from '@/modules/LaporanAsnaf/LaporanAsnafGharim.vue';
import LaporanAsnafIbnuSabil from '@/modules/LaporanAsnaf/LaporanAsnafIbnuSabil.vue';
import LaporanAsnafMiskin from '@/modules/LaporanAsnaf/LaporanAsnafMIskin.vue';
import LaporanAsnafMuallaf from '@/modules/LaporanAsnaf/LaporanAsnafMuallaf.vue';
import LaporanKesekretariatan from '@/modules/LaporanKesekretariatan/LaporanKesekretariatan.vue';
import LaporanPengumpulan from '@/modules/LaporanPengumpulan/LaporanPengumpulan.vue';
import LaporanPerencanaan from '@/modules/LaporanPerencanaan/LaporanPerencanaan.vue';
import LaporanTahunan from '@/modules/LaporanTahunan/LaporanTahunan.vue';
import Monev from '@/modules/Monev/Monev.vue';
import Penetapan from '@/modules/Penetapan/Penetapan.vue';
import PengaturanUmum from '@/modules/PengaturanUmum/PengaturanUmum.vue';
import PengaturanWhatsapp from '@/modules/PengaturanWhatsapp/PengaturanWhatsapp.vue';
import PermohonanBantuan from '@/modules/PermohonanBantuan/PermohonanBantuan.vue';
import PertanyaanMonev from '@/modules/PertanyaanMonev/PertanyaanMonev.vue';
import ProgramDonasi from '@/modules/ProgramDonasi/ProgramDonasi.vue';
import ProgramKegiatanBantuan from '@/modules/ProgramKegiatanBantuan/ProgramKegiatanBantuan.vue';
import RekapDistribusiPerAsnaf from '@/modules/RekapDistribusiPerAsnaf/RekapDistribusiPerAsnaf.vue';
import RekapDistribusiPerKodeAsnaf from '@/modules/RekapDistribusiPerKodeAsnaf/RekapDistribusiPerKodeAsnaf.vue';
import RekapPengumpulan from '@/modules/RekapPengumpulan/RekapPengumpulan.vue';
import RekapPengumpulanPerKecamatan from '@/modules/RekapPengumpulanPerKecamatan/RekapPengumpulanPerKecamatan.vue';
import RekapPerkecamatan from '@/modules/RekapPerkecamatan/RekapPerkecamatan.vue';
import RequestKeanggotaan from '@/modules/RequestKeanggotaan/RequestKeanggotaan.vue';
import RiwayatDonasi from '@/modules/RiwayatDonasi/RiwayatDonasi.vue';
import RiwayatInfaq from '@/modules/RiwayatInfaq/RiwayatInfaq.vue';
import RiwayatPesanWhatsapp from '@/modules/RiwayatPesanWhatsapp/RiwayatPesanWhatsapp.vue';
import RiwayatZakat from '@/modules/RiwayatZakat/RiwayatZakat.vue';
import RunningText from '@/modules/RunningText/RunningText.vue';
import Surveyor from '@/modules/Surveyor/Surveyor.vue';
import syarat from '@/modules/Syarat/syarat.vue';
import SystemLog from '@/modules/SystemLog/SystemLog.vue';
import SystemLogSurveyor from '@/modules/SystemLogSurveyor/SystemLogSurveyor.vue';
import TargetDistribusi from '@/modules/TargetDistribusi/TargetDistribusi.vue';
import TargetPengumpulan from '@/modules/TargetPengumpulan/TargetPengumpulan.vue';
import TemplatePesanWhatsapp from '@/modules/TemplatePesanWhatsapp/TemplatePesanWhatsapp.vue';
import UrutanBagianMonev from '@/modules/UrutanBagianMonev/UrutanBagianMonev.vue';
import ValidasiPermohonanBantuan from '@/modules/ValidasiPermohonanBantuan/ValidasiPermohonanBantuan.vue';
import Wakalah from '@/modules/Wakalah/Wakalah.vue';

const tabComponents: Record<string, any> = {
  pengaturan_whatsapp: PengaturanWhatsapp,
  daftar_kecamatan: kecamatan,
  syarat: syarat,
  daftar_bank: Bank,
  running_text: RunningText,
  request_keanggotaan: RequestKeanggotaan,
  daftar_grup_akses: GrupAkses,
  system_log_surveyor: SystemLogSurveyor,
  daftar_pengguna: DaftarPengguna,
  system_log: SystemLog,
  program_kegiatan_kesekretariatan: KegiatanKeseketariatan,
  daftar_bank_pengumpulan: BankPengumpulan,
  template_pesan_whatsapp: TemplatePesanWhatsapp,
  daftar_desa: desa,
  daftar_keanggotaan: DaftarKeanggotaan,
  daftar_surveyor: Surveyor,
  pengaturan_umum: PengaturanUmum,
  laporan_umum: LaporanUmum,
  program_kegiatan_bantuan: ProgramKegiatanBantuan,
  daftar_program: DaftarProgram,
  laporan_asnaf_fakir: LaporanAsnafFakir,
  program_donasi: ProgramDonasi,
  daftar_tab: DaftarTab,
  riwayat_donasi: RiwayatDonasi,
  laporan_asnaf_miskin: LaporanAsnafMiskin,
  laporan_asnaf_fisabilillah: LaporanAsnafFisabilillah,
  laporan_asnaf_gharim: LaporanAsnafGharim,
  laporan_asnaf_muallaf: LaporanAsnafMuallaf,
  laporan_asnaf_ibnu_sabil: LaporanAsnafIbnuSabil,
  daftar_asnaf: DaftarAsnaf,
  riwayat_zakat: RiwayatZakat,
  urutan_bagian_monev: UrutanBagianMonev,
  riwayat_infaq: RiwayatInfaq,
  riwayat_pesan_whatsapp: RiwayatPesanWhatsapp,
  beranda_utama: Beranda,
  permohonan_bantuan: PermohonanBantuan,
  validasi_permohonan_bantuan: ValidasiPermohonanBantuan,
  penetapan: Penetapan,
  laporan_tahunan: LaporanTahunan,
  pertanyaan_monev: PertanyaanMonev,
  rekap_pengumpulan: RekapPengumpulan,
  laporan_perencanaan: LaporanPerencanaan,
  target_pengumpulan: TargetPengumpulan,
  target_distribusi: TargetDistribusi,
  laporan_sekretariatan: LaporanKesekretariatan,
  monev: Monev,
  rekap_distribusi_asnaf: RekapDistribusiPerAsnaf,
  laporan_kesekretariatan: LaporanKesekretariatan,
  rekap_pengumpulan_per_kecamatan: RekapPengumpulanPerKecamatan,
  rekap_distribusi_kecamatan: RekapPerkecamatan,
  rekap_distribusi_kode_asnaf: RekapDistribusiPerKodeAsnaf,
  laporan_pengumpulan: LaporanPengumpulan,
  kriteria: Kriteria,
  bakal_penerima_bantuan: BakalPenerimaBantuan,
  wakalah: Wakalah,
};

const selectedTab = useSelectedTab();
const tab = useGlobalTab();
const activeTab = useGlobalActiveTab();
const tabTerpilih = useTabTerpilih();
const windowWidth = ref(window.innerWidth);

const dynamicLabel = (val: string) => {
  if (windowWidth.value < 640) {
    // < sm → mobile
    return '';
  } else if (windowWidth.value < 1269) {
    // sm
    return val.slice(0, 8) + '...';
  } else if (windowWidth.value < 1467) {
    // md
    return val.slice(0, 8) + '...';
  } else if (windowWidth.value < 1611) {
    // lg
    return val.slice(0, 13) + '...';
  } else if (windowWidth.value < 1707) {
    // xl
    return val.slice(0, 16) + '...';
  } else {
    // 2xl atau lebih
    return val;
  }
};

const mulaiPilihTab = ref(false);
const selectTab = (tabPath: string, key: number) => {
  tabTerpilih.setNumber(key);
  activeTab.setString(tabPath);
  mulaiPilihTab.value = true;
};

onMounted(async () => {
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth;
  });
});

watch(
  () => selectedTab.sharedArray,
  async () => {
    await nextTick();
    initTooltips();
  },
  { deep: true },
);
</script>

<template>
  <div class="mb-0 dark:border-gray-700">
    <ul
      class="flex flex-wrap -mb-px text-sm font-medium text-center text-graydark"
      id="default-tab"
      data-tabs-toggle="#default-tab-content"
      role="tablist"
    >
      <li
        class="me-2"
        role="presentation"
        v-for="(item, key) in selectedTab.sharedArray"
        :key="key"
      >
        <div
          :id="`tooltip-default-${tab.sharedObject[item.id].path}`"
          role="tooltip"
          class="absolute invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-graydark rounded-lg shadow-xs opacity-0 tooltip dark:bg-gray-700 z-999999"
        >
          {{ tab.sharedObject[item.id].title }}
          <div class="tooltip-arrow" data-popper-arrow></div>
        </div>
        <button
          :data-tooltip-target="`tooltip-default-${tab.sharedObject[item.id].path}`"
          class="inline-block p-4 rounded-t-lg rrr"
          :id="`${tab.sharedObject[item.id].path}-tab`"
          :data-tabs-target="`#${tab.sharedObject[item.id].path}`"
          type="button"
          role="tab"
          :aria-controls="`${tab.sharedObject[item.id].path}`"
          :aria-selected="
            activeTab.sharedString === tab.sharedObject[item.id].path ||
            (tabTerpilih.sharedNumber === 0 && key === 0)
              ? 'true'
              : 'false'
          "
          @click="selectTab(tab.sharedObject[item.id].path, key)"
          :class="
            activeTab.sharedString === tab.sharedObject[item.id].path ||
            (tabTerpilih.sharedNumber === 0 && key === 0)
              ? 'active-tab bg-white !text-green-900 font-semibold hover:text-green-700 dark:text-green-900 dark:hover:text-green-900 border-[#3a477d] dark:border-[#3a477d]'
              : 'inactive-tab text-gray-500 hover:text-gray-600 dark:text-gray-400 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300'
          "
        >
          <font-awesome-icon :icon="tab.sharedObject[item.id].icon" />
          <span class="ml-2 flex-1 truncate">
            {{ dynamicLabel(tab.sharedObject[item.id].name) }}
          </span>
        </button>
      </li>
    </ul>
  </div>
  <div id="default-tab-content ">
    <div
      v-for="(item, key) in selectedTab.sharedArray"
      :key="key"
      class="p-4 bg-white dark:bg-gray-800 min-h-[500px] rounded-lg"
      :class="
        (activeTab.sharedString === tab.sharedObject[item.id].path ||
        (tabTerpilih.sharedNumber === 0 && key === 0)
          ? ''
          : 'hidden') + (key === 0 ? ' [border-top-left-radius:0px]' : '')
      "
      :id="tab.sharedObject[item.id].path"
      role="tabpanel"
      :aria-labelledby="`${tab.sharedObject[item.id].path}-tab`"
    >
      <div class="grid grid-cols-2 gap-6 items-start">
        <div
          class="px-5 text-sm text-gray-900 dark:text-white leading-relaxed"
          v-html="tab.sharedObject[item.id].desc"
        ></div>

        <div
          class="px-5 text-sm text-gray-900 dark:text-white font-medium leading-relaxed text-right min-h-[40px]"
          v-if="tab.sharedObject[item.id].path == 'riwayat_zakat'"
          v-html="messageZakat.getString"
        ></div>
        <div
          class="px-5 text-sm text-gray-900 dark:text-white font-medium leading-relaxed text-right min-h-[40px]"
          v-if="tab.sharedObject[item.id].path == 'riwayat_donasi'"
          v-html="messageDonasi.getString"
        ></div>
        <div
          class="px-5 text-sm text-gray-900 dark:text-white font-medium leading-relaxed text-right min-h-[40px]"
          v-if="tab.sharedObject[item.id].path == 'riwayat_infaq'"
          v-html="messageInfaq.getString"
        ></div>
        <!-- AAA {{ tab.sharedObject[item.id].path }} BB

        CCC {{  tabComponents }} -->
      </div>
      <component :is="tabComponents[tab.sharedObject[item.id].path]" class="tab"></component>
    </div>
  </div>
</template>
<style scoped></style>
