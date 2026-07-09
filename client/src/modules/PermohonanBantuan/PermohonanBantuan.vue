<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import BaseSelect from '@/components/Form/BaseSelect.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import Notification from '@/components/Modal/Notification.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import FormAdd from '@/modules/PermohonanBantuan/widgets/FormAdd.vue';
import FormEdit from '@/modules/PermohonanBantuan/widgets/FormEdit.vue';
import FormEditStatus from '@/modules/PermohonanBantuan/widgets/FormEditStatus.vue';
import { onMounted, ref } from 'vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
import { usePagination } from '@/composables/usePaginations';

// Service API
import {
  delete_permohonan_bantuan,
  get_filter_type,
  get_permohonan_bantuan,
} from '@/service/permohonan_bantuan';

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

interface permohonanBantuan {
  id: number;
  status: string;
  biaya_disetujui: number;
  nominal_realisasi: number;
  Permohonan: {
    id: number;
    bank_name: string;
    nomor_akun_bank: string;
    nama_akun_bank: string;
    status: string;
    member_id: number;
    member_name: string;
    member_tipe: string;
    desa_name: string | null;
    kecamatan_name: string | null;
    Kegiatan: {
      id: number;
      nama_kegiatan: string;
      sisa_jumlah_dana: number;
      jumlah_dana: number;
      sumber_dana: string;
      area_penyaluran: string;
      status_kegiatan: string;
      tahun: number;
      kriteria: { id: number; name: string }[];
    };
  };
}

const dataPermohonanBantuan = ref<permohonanBantuan[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const isModalEditStatusOpen = ref(false);
const selectedPermohonanBantuan = ref<any>(null);

const tableColumns = ref<TableColumn[]>([
  { key: 'info_permohonan', label: 'Info Permohonan & Kegiatan', headerClass: 'w-[60%] text-center', cellClass: 'px-4 py-4 align-top' },
  { key: 'kriteria', label: 'Kriteria Persyaratan', headerClass: 'w-[40%] text-center', cellClass: 'px-4 py-4 align-top' },
]);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(datas: any) {
  selectedPermohonanBantuan.value = datas;
  isModalEditOpen.value = true;
}

function openModalEditStatus(datas: any) {
  selectedPermohonanBantuan.value = datas;
  isModalEditStatusOpen.value = true;
}

// Function: Fetch Data
const kegiatanOption = ref<{ value: string; label: string }[]>([]);
const statusKegiataniOption = ref<{ value: string; label: string }[]>([
  { value: 'selesai', label: 'Selesai' },
  { value: 'sedang_berlangsung', label: 'Sedang Berlangsung' },
]);
const selectedKegiatan = ref(null);
const selectedStatusKegiatan = ref('sedang_berlangsung');
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const [response, filterTypeResponse] = await Promise.all([
      get_permohonan_bantuan({
        search: search.value,
        perpage: perPage.value,
        pageNumber: currentPage.value,
        type_kegiatan: selectedKegiatan.value,
        type_status_kegiatan: selectedStatusKegiatan.value,
      }),
      get_filter_type(),
    ]);

    dataPermohonanBantuan.value = response.data;
    totalRow.value = response.total;

    kegiatanOption.value = filterTypeResponse.data;
  } catch (error) {
    displayNotification('Gagal mengambil data permohonan bantuan', 'error');
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
    'Hapus Data Permohonan Bantuan',
    'Apakah Anda yakin ingin menghapus data permohonan bantuan ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_permohonan_bantuan(id);
        displayNotification('Data permohonan bantuan berhasil dihapus', 'success');
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
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <!-- Table with BaseTable -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
        :columns="tableColumns"
        :data="dataPermohonanBantuan"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Nama / NIK Pemohon . . ."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Permohonan Bantuan"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #filters>
          <label class="mr-2 text-sm font-medium text-gray-600 hidden sm:block">Filter</label>
          <BaseSelect
            v-model="selectedKegiatan"
            :options="kegiatanOption"
            placeholder="Semua Kegiatan"
            @change="fetchData"
            class="w-40"
          />
          <BaseSelect
            v-model="selectedStatusKegiatan"
            :options="statusKegiataniOption"
            placeholder="Semua Status"
            @change="fetchData"
            class="w-40"
          />
        </template>

        <template #cell-info_permohonan="{ row }">
          <div class="space-y-3">
            <!-- Info Pemohon Table -->
            <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table class="w-full">
                <tbody>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase w-[35%]">
                      Nama Pemohon
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-800 font-medium">
                      {{ row.Permohonan.member_name }}
                      <span class="ml-2 inline-flex px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-semibold">
                        {{ row.Permohonan.member_tipe === 'perorangan' ? 'PERORANGAN' : 'INSTANSI' }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Alamat / Lokasi
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ row.Permohonan.desa_name || '-' }},
                      {{ row.Permohonan.kecamatan_name || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Info Kegiatan Table -->
            <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table class="w-full">
                <tbody>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase w-[35%]">
                      Kegiatan
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-800 font-medium">
                      {{ row.Permohonan.Kegiatan.nama_kegiatan }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Sumber & Tahun
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ row.Permohonan.Kegiatan.sumber_dana === 'zakat' ? 'ZAKAT' : 'INFAQ' }} ({{ row.Permohonan.Kegiatan.tahun }})
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Dana Kegiatan
                    </th>
                    <td class="px-4 py-3 text-sm">
                       Total: <span class="font-semibold text-gray-800">{{ row.Permohonan.Kegiatan.jumlah_dana ? $formatToRupiah(row.Permohonan.Kegiatan.jumlah_dana) : '-' }}</span>
                       | Sisa: <span class="font-bold text-red-600">{{ row.Permohonan.Kegiatan.sisa_jumlah_dana ? $formatToRupiah(row.Permohonan.Kegiatan.sisa_jumlah_dana) : '-' }}</span>
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Status Kegiatan
                    </th>
                    <td class="px-4 py-3 text-sm">
                       <span class="inline-flex px-2 py-0.5 rounded text-xs font-semibold" :class="row.Permohonan.Kegiatan.status_kegiatan === 'sedang_berlangsung' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'">
                          {{ row.Permohonan.Kegiatan.status_kegiatan === 'sedang_berlangsung' ? 'BERLANGSUNG' : 'SELESAI' }}
                       </span>
                       | Area: {{ formatAreaPenyaluran(row.Permohonan.Kegiatan.area_penyaluran) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Info Rekening & Realisasi -->
            <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table class="w-full">
                <tbody>
                  <tr class="border-b border-gray-200">
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase w-[35%]">
                      Info Bank
                    </th>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ row.Permohonan.bank_name }} - {{ row.Permohonan.nomor_akun_bank }} <br/> A/N: {{ row.Permohonan.nama_akun_bank }}
                    </td>
                  </tr>
                  <tr>
                    <th class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 text-left font-semibold text-xs text-gray-900 uppercase">
                      Realisasi
                    </th>
                    <td class="px-4 py-3 text-sm">
                       Biaya Disetujui: <span v-if="row.biaya_disetujui" class="font-bold text-green-700">{{ $formatToRupiah(row.biaya_disetujui) }}</span><span v-else class="font-bold text-red-600">Belum disetujui</span>
                       <template v-if="row.nominal_realisasi">
                         <br/> Nominal Realisasi: <span class="font-bold text-green-700">{{ $formatToRupiah(row.nominal_realisasi) }}</span>
                       </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
        
        <template #cell-kriteria="{ row }">
          <div class="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden shadow-sm h-full">
             <div class="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-xs text-gray-900 uppercase">
                Kriteria Persyaratan ({{ row.Permohonan.Kegiatan.kriteria.length }})
             </div>
             <div class="p-4">
                <ul class="space-y-2">
                  <li
                    v-for="kriteria in row.Permohonan.Kegiatan.kriteria"
                    :key="kriteria.id"
                    class="flex items-start gap-2 text-sm"
                  >
                    <span class="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></span>
                    <span class="text-gray-700">{{ kriteria.name }}</span>
                  </li>
                </ul>
                <div
                  v-if="row.Permohonan.Kegiatan.kriteria.length === 0"
                  class="text-center text-gray-400 text-sm py-4"
                >
                  <p>Tidak ada kriteria</p>
                </div>
             </div>
          </div>
        </template>
        
        <template #row-actions="{ row }">
          <div class="flex flex-col gap-2 items-center">
            <LightButton @click="openModalEdit(row)" title="Lihat Detail">
              <font-awesome-icon icon="fa-solid fa-info" />
            </LightButton>
            <LightButton @click="openModalEditStatus(row)" title="Edit Status">
              <font-awesome-icon icon="fa-solid fa-pen" />
            </LightButton>
            <DangerButton @click="deleteData(row.id)" title="Hapus">
              <DeleteIcon />
            </DangerButton>
          </div>
        </template>
      </BaseTable>
      </div>
    </div>

    <!-- Modal FormAdd -->
    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="
        isModalAddOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update PermohonanBantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal FormEdit -->
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :selected-permohonan-bantuan="selectedPermohonanBantuan"
      @close="
        isModalEditOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update PermohonanBantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal FormEditStatus -->
    <FormEditStatus
      :is-modal-open="isModalEditStatusOpen"
      :selected-permohonan-bantuan="selectedPermohonanBantuan"
      @close="
        isModalEditStatusOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Permohonan Bantuan gagal',
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
