<script setup lang="ts">
// Library
import { ref, onMounted, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import IconCommunity from '@/components/Icons/IconCommunity.vue';
import IconPlus from '@/components/Icons/IconPlus.vue';
import FormSyarat from './Widgets/FormSyarat.vue';
import FormKriteria from './Widgets/FormKriteria.vue';
import FormSurveyor from './Widgets/FormSurveyor.vue';
import FormAdd from '@/modules/ProgramKegiatanBantuan/widgets/FormAdd.vue';

// Service API
import { get_filter_type, get_program_bantuan, send_pesan } from '@/service/penetapan';
import BaseSelect from '@/components/Form/BaseSelect.vue';
import SuratIcon from '@/components/Icons/SuratIcon.vue';
import ButtonGreen from '@/components/Button/ButtonGreen.vue';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(5);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

const tableColumns = ref<TableColumn[]>([
  { key: 'banner', label: 'Banner', headerClass: 'w-[15%] text-center', cellClass: 'text-center align-top' },
  { key: 'info_penyaluran', label: 'Info Penyaluran', headerClass: 'w-[30%] text-center', cellClass: 'align-top font-normal text-gray-800' },
  { key: 'info_detail', label: 'Info Detail Penyaluran', headerClass: 'w-[30%] text-center', cellClass: 'align-top text-center font-normal text-gray-800' },
  { key: 'datetimes', label: 'Datetimes', headerClass: 'w-[15%] text-center', cellClass: 'align-top text-center font-medium text-gray-800' },
]);

// Modal State bug fix (FormAdd references isModalAddOpen)
const isModalAddOpen = ref(false);

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// State Data Bank
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

interface Surveyor {
  id: number;
  name: string;
  access_code: string;
}

interface SK {
  sk: string;
}

interface Syarat {
  id: number;
  name: string;
}

interface Kriteria {
  id: number;
  name: string;
}

interface ProgramKegiatanBantuan {
  id: number;
  asnaf_id: number;
  program_id: number;
  kategori_asnaf: string;
  kategori_program: string;
  kode: string;
  nama_kegiatan: string;
  slug: string;
  status_tampil: string;
  jumlah_dana: number;
  jumlah_maksimal_nominal_bantuan: number;
  jumlah_target_penerima: number;
  sumber_dana: string;
  area_penyaluran: string;
  jenis_penyaluran: string;
  status_kegiatan: boolean;
  tahun: string;
  banner: string;
  desc: string;
  datetimes: string;
  kegiatans: SK[];
  surveyors: Surveyor[];
  syarat: Syarat[];
  kriteria: Kriteria[];
}

const dataProgramBantuan = ref<ProgramKegiatanBantuan[]>([]);

const isModalEditSyarat = ref(false);
const isModalEditKriteria = ref(false);
const isModalEditSurveyor = ref(false);
const selectedKegiatan = ref<any>(null);

function openModalSyarat(id: any) {
  selectedKegiatan.value = id;
  console.log('selectedBank Parent', selectedKegiatan.value);
  isModalEditSyarat.value = true;
}

function openModalKriteria(id: any) {
  selectedKegiatan.value = id;
  console.log('selectedBank Parent', selectedKegiatan.value);
  isModalEditKriteria.value = true;
}

function openModalSurveyor(id: any) {
  selectedKegiatan.value = id;
  console.log('selectedBank Parent', selectedKegiatan.value);
  isModalEditSurveyor.value = true;
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_program_bantuan({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    console.log(response);

    dataProgramBantuan.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil data program bantuan', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

// Function: Delete Data

function openSkSurveyor(skFileName: string) {
  const url = `${BASE_URL}/uploads/img/sk_penetapan/${skFileName}`;
  window.open(url, '_blank'); // buka di tab baru browser
}

const copyLink = async (accessCode: string) => {
  try {
    const url = `localhost:5173/survey?code=${accessCode}`;
    await navigator.clipboard.writeText(url);
    displayNotification('Link berhasil disalin', 'success');
  } catch (err) {
    console.error('Gagal salin link:', err);
  }
};

async function kirim_pesan(kegiatan_id: number) {
  displayConfirmation(
    'Kirim Pesan',
    'Apakah Anda yakin ingin mengirim pesan ke semua surveyor?',
    async () => {
      try {
        isLoading.value = true;
        await send_pesan({ kegiatan_id: kegiatan_id });
        displayNotification('Pesan Berhasil Dikirim', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal mengirim pesan', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow mt-4">
        <BaseTable
          empty-title="Tidak ada data"
          empty-desc="Belum ada data program kegiatan bantuan."
          empty-icon="fa-solid fa-people-carry-box"
          :columns="tableColumns"
          :data="dataProgramBantuan"
          :loading="isTableLoading"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          :show-search="false"
          :show-add="false"
          :show-edit="false"
          :show-delete="false"
          @page-change="pageNow"
        >
          <template #filters>
            <div class="flex items-center w-full sm:w-auto gap-2">
              <input
                id="search"
                type="text"
                v-model="search"
                @change="fetchData"
                placeholder="Cari Nama Kegiatan . . ."
                class="w-full sm:w-64 rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
              />
            </div>
          </template>
        

        <template #cell-banner="{ row: data }">
          <div
            v-if="data.banner && data.banner !== '-'"
            class="relative rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mx-auto"
            style="width: 301px; height: 165px"
            :class="{ 'bg-gray-200': !data.banner || data.banner === '-' }"
          >
            <img
              :src="BASE_URL + '/uploads/img/program_kegiatan_bantuan/' + data.banner"
              :alt="`Banner ${data.nama_kegiatan}`"
              class="object-contain max-w-full max-h-full mx-auto"
              @error="data.banner = '-'"
            />
          </div>
          <div
            v-else
            class="bg-gray-200 text-gray-500 text-center px-4 relative aspect-video max-w-sm rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mx-auto"
          >
            <font-awesome-icon icon="fa-solid fa-image" class="text-2xl text-gray-400" />
          </div>
        </template>

        <template #cell-info_penyaluran="{ row: data }">
          <table class="border border-gray-300 w-full text-xs text-left">
            <tbody>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">
                  NAMA KEGIATAN PENYALURAN
                </td>
                <td class="px-4 py-1">{{ data.nama_kegiatan || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">JENIS KEGIATAN</td>
                <td class="px-4 py-1">{{ data.nama_kegiatan || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">TAHUN</td>
                <td class="px-4 py-1">{{ data.tahun || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">KATEGORI</td>
                <td class="px-4 py-1">{{ data.kategori_asnaf || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">PROGRAM</td>
                <td class="px-4 py-1">{{ data.kategori_program || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">DANA</td>
                <td class="px-4 py-1">{{ $formatToRupiah(data.jumlah_dana) || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">
                  JENIS PENYALURAN
                </td>
                <td class="px-4 py-1">{{ data.jenis_penyaluran.toUpperCase() || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">KUOTA PENERIMA</td>
                <td class="px-4 py-1">{{ data.jumlah_target_penerima || '-' }} Penerima</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">
                  MAKSIMAL BANTUAN PER ORANG
                </td>
                <td class="px-4 py-1">
                  {{ $formatToRupiah(data.jumlah_maksimal_nominal_bantuan) || '-' }}
                </td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">SUMBER DANA</td>
                <td class="px-4 py-1">{{ data.sumber_dana.toUpperCase() || '-' }}</td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">TAMPIL</td>
                <td class="px-4 py-1 font-semibold">
                  <span
                    :class="
                      data.status_tampil === 'tampil' ? 'text-green-500' : 'text-red-500'
                    "
                    >{{ data.status_tampil === 'tampil' ? 'TAMPIL' : 'TIDAK TAMPIL' }}</span
                  >
                </td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">STATUS</td>
                <td class="px-4 py-1 font-bold">
                  <span
                    :class="
                      data.status_kegiatan === false ? 'text-yellow-500' : 'text-green-500'
                    "
                    >{{
                      data.status_kegiatan === false ? 'SEDANG BERLANGSUNG' : 'SELESAI'
                    }}</span
                  >
                </td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">AREA PENYALURAN</td>
                <td class="px-4 py-1 text-red-500 font-bold">
                  {{
                    data.area_penyaluran === 'semua_pemohon'
                      ? 'SEMUA PEMOHON'
                      : data.area_penyaluran === 'kabupaten'
                        ? 'KABUPATEN'
                        : data.area_penyaluran === 'instansi'
                          ? 'INSTANSI'
                          : data.area_penyaluran === 'kecamatan'
                            ? 'KECAMATAN'
                            : data.area_penyaluran === 'desa'
                              ? 'DESA'
                              : '-'
                  }}
                </td>
              </tr>
              <tr class="border-b border-gray-300">
                <td class="w-[45%] bg-gray-200 px-4 py-1 font-semibold">SK SURVEYOR</td>
                <td class="px-4 py-1">
                  <div
                    v-if="data.kegiatans && data.kegiatans.length > 0"
                    @click="openSkSurveyor(data.kegiatans[0].sk)"
                    class="w-24 h-10 bg-gray-200 flex items-center justify-center cursor-pointer border rounded hover:bg-gray-300"
                  >
                    Klik untuk lihat
                  </div>
                  <div v-else>-</div>
                </td>
              </tr>

              <tr class="border-b border-gray-300">
                <td class="w-[40%] bg-gray-200 px-4 py-1 font-semibold">SURVEYOR</td>
                <td class="px-4 py-1">
                  <div v-if="data.surveyors && data.surveyors.length > 0">
                    <div
                      v-for="(s, i) in data.surveyors"
                      :key="i"
                      class="flex justify-between items-center mb-3"
                    >
                      <span>{{ s.name }}</span>
                      <button
                        @click="copyLink(s.access_code)"
                        class="bg-white text-gray-500 text-sm px-2 py-1 rounded hover:bg-gray-200 py-4"
                      >
                        <SuratIcon />
                      </button>
                    </div>

                    <div class="mt-2 flex justify-end">
                      <ButtonGreen
                        @click="kirim_pesan(data.id)"
                        class="w-full flex items-center gap-2"
                      >
                        <font-awesome-icon icon="fa-brands fa-whatsapp" />Kirim Pesan WA
                      </ButtonGreen>
                    </div>
                  </div>
                  <div v-else>-</div>
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <template #cell-info_detail="{ row: data }">
          <table class="border border-gray-300 w-full text-xs text-left">
            <thead>
              <tr class="border-b border-gray-300">
                <th class="px-6 py-4 text-center bg-gray-200 font-medium text-gray-800">
                  Syarat & Prasyarat
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="data.syarat.length == 0">
                <td class="px-6 py-4 text-center font-normal text-gray-400">
                  Syarat & Prasyarat Tidak Ditemukan
                </td>
              </tr>
              <tr v-else v-for="s in data.syarat" :key="s.id">
                <td
                  class="px-6 py-4 text-center border border-b border-gray-300 font-normal text-gray-800"
                >
                  {{ s.name }}
                </td>
              </tr>
            </tbody>
          </table>

          <table class="border border-gray-300 w-full text-xs text-left mt-5">
            <thead>
              <tr class="border-b border-gray-300">
                <th class="px-6 py-4 text-center bg-gray-200 font-medium text-gray-800">
                  Kriteria
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="data.kriteria.length == 0">
                <td class="px-6 py-4 text-center font-normal text-gray-400">
                  Kriteria Tidak Ditemukan
                </td>
              </tr>
              <tr v-else v-for="k in data.kriteria" :key="k.id">
                <td
                  class="px-6 py-4 text-center border border-b border-gray-300 font-normal text-gray-800"
                >
                  {{ k.name }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <template #cell-datetimes="{ row: data }">
          {{ data.datetimes }}
        </template>

        <template #row-actions="{ row: data }">
          <div class="flex flex-col gap-2">
            <LightButton @click="openModalSyarat(data.id)">
              <font-awesome-icon icon="fa-solid fa-file-contract"></font-awesome-icon>
            </LightButton>
            <LightButton @click="openModalKriteria(data.id)">
              <font-awesome-icon icon="fa-solid fa-list-check"></font-awesome-icon>
            </LightButton>
            <LightButton @click="openModalSurveyor(data.id)">
              <font-awesome-icon icon="fa-solid fa-users"></font-awesome-icon>
            </LightButton>
          </div>
        </template>
      </BaseTable>
      </div>
    </div>

    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="((isModalAddOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update program kegiatan bantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal FormEdit -->
    <FormSyarat
      :is-modal-open="isModalEditSyarat"
      :selected-kegiatan="selectedKegiatan"
      @close="((isModalEditSyarat = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Syarat gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <FormKriteria
      :is-modal-open="isModalEditKriteria"
      :selected-kegiatan="selectedKegiatan"
      @close="((isModalEditKriteria = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Kriteria gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <FormSurveyor
      :is-modal-open="isModalEditSurveyor"
      :selected-kegiatan="selectedKegiatan"
      @close="((isModalEditSurveyor = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Surveyor gagal',
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
