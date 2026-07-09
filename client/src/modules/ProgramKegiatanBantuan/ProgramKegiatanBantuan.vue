<script setup lang="ts">
// Library
import { ref, onMounted, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import BaseSelect from '@/components/Form/BaseSelect.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from '@/modules/ProgramKegiatanBantuan/widgets/FormAdd.vue';
import FormEdit from '@/modules/ProgramKegiatanBantuan/widgets/FormEdit.vue';
import FormStatusKegiatan from '@/modules/ProgramKegiatanBantuan/widgets/FormStatusKegiatan.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import {
  get_filter_type,
  get_program_bantuan,
  delete_program_bantuan,
} from '@/service/program_kegiatan_bantuan';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(5);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// State Data program bantuan
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

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
}

const dataProgramBantuan = ref<ProgramKegiatanBantuan[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const isModalStatusOpen = ref(false);
const selectedProgramKegiatanBantuan = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalStatus(programKegiatanBantuan: any) {
  selectedProgramKegiatanBantuan.value = programKegiatanBantuan;
  isModalStatusOpen.value = true;
}

function openModalEdit(programKegiatanBantuan: any) {
  selectedProgramKegiatanBantuan.value = programKegiatanBantuan;
  isModalEditOpen.value = true;
}

// Function: Fetch Data & filter
const search = ref('');
const statusOption = ref<{ value: string; label: string }[]>([]);
const asnafOption = ref<{ value: number; label: string }[]>([]);
const programOption = ref<{ value: number; label: string }[]>([]);
const yearOption = ref<{ value: number; label: string }[]>([]);

const selectedStatus = ref('');
const selectedAsnaf = ref('');
const selectedProgram = ref('');
const selectedYear = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const responseFilterType = await get_filter_type();

    statusOption.value = [
      { value: 'sedang_berlangsung', label: 'Sedang Berlangsung' },
      { value: 'selesai', label: 'Selesai' },
    ];
    ((asnafOption.value = responseFilterType.data.type_asnaf_id),
      (programOption.value = responseFilterType.data.type_program_id),
      (yearOption.value = responseFilterType.data.type_year));

    console.log(responseFilterType);

    const response = await get_program_bantuan({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
      type_status_kegiatan: selectedStatus.value,
      type_asnaf_id: selectedAsnaf.value,
      type_program_id: selectedProgram.value,
      type_year: selectedYear.value,
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
async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data',
    'Apakah Anda yakin ingin menghapus data program kegiatan bantuan ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_program_bantuan(id);
        displayNotification('Data program kegiatan bantuan berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data program kegiatan bantuan', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        <BaseButton
          @click="openModalAdd()"
          variant="primary"
          :loading="isModalAddOpen || isModalEditOpen"
          type="button"
        >
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Program Kegiatan
        </BaseButton>

        <div class="flex items-center w-full sm:w-auto gap-2">
          <label for="search" class="mr-2 text-sm font-medium text-gray-600">Filter</label>

          <!-- Status -->
          <BaseSelect
            v-model="selectedStatus"
            :options="statusOption"
            placeholder="Semua Status"
            @change="fetchData"
          />

          <!-- Asnaf -->
          <BaseSelect
            v-model="selectedAsnaf"
            :options="asnafOption"
            placeholder="Semua Asnaf"
            @change="fetchData"
          />

          <!-- Program -->
          <BaseSelect
            v-model="selectedProgram"
            :options="programOption"
            placeholder="Semua Program"
            @change="fetchData"
          />

          <!-- Tahun -->
          <BaseSelect
            v-model="selectedYear"
            :options="yearOption"
            placeholder="Semua Tahun"
            @change="fetchData"
          />

          <!-- Search -->
          <input
            id="search"
            type="text"
            v-model="search"
            @change="fetchData"
            placeholder="Cari Nama Kegiatan . . ."
            class="w-full sm:w-64 rounded-md border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr class="border-b border-gray-300">
              <th class="w-[20%] px-6 py-3 font-medium">Banner</th>
              <th class="w-[25%] px-6 py-3 font-medium">Info Penyaluran</th>
              <th class="w-[30%] px-6 py-3 font-medium">Info Detail Penyaluran</th>
              <th class="w-[15%] px-6 py-3 font-medium">Datetimes</th>
              <th class="w-[10%] px-6 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-if="dataProgramBantuan.length > 0">
              <tr
                v-for="data in dataProgramBantuan"
                :key="data.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-center align-top">
                  <center>
                    <div
                      v-if="data.banner && data.banner !== '-'"
                      class="relative rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
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
                      class="bg-gray-200 text-gray-500 text-center px-4 relative aspect-video max-w-sm rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden"
                    >
                      <font-awesome-icon icon="fa-solid fa-image" class="text-2xl text-gray-400" />
                    </div>
                  </center>
                </td>
                <td class="px-6 py-4 align-top font-normal text-gray-800">
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
                    </tbody>
                  </table>
                </td>
                <td class="px-6 py-4 text-center font-normal text-gray-800">
                  <table class="border border-gray-300 w-full text-xs text-left">
                    <tbody>
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
                    </tbody>
                  </table>
                </td>
                <td class="px-6 py-4 align-top text-center font-medium text-gray-800">
                  {{ data.datetimes }}
                </td>
                <td class="flex px-6 py-4 gap-2 align-top justify-center">
                  <LightButton @click="openModalStatus(data)">
                    <font-awesome-icon
                      :icon="
                        data.status_kegiatan ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'
                      "
                    />
                  </LightButton>
                  <LightButton @click="openModalEdit(data)">
                    <EditIcon />
                  </LightButton>
                  <DangerButton @click="deleteData(data.id)">
                    <DeleteIcon />
                  </DangerButton>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else>
              <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
                <font-awesome-icon
                  icon="fa-solid fa-people-carry-box"
                  class="text-4xl mb-2 text-gray-400"
                />
                <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada data</h3>
                <p class="text-sm">Belum ada data program kegiatan bantuan.</p>
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
    </div>

    <!-- Modal FormAdd -->
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
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :selected-program="selectedProgramKegiatanBantuan"
      @close="((isModalEditOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update program kegiatan bantuan gagal',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal FormStatus -->
    <FormStatusKegiatan
      :is-modal-open="isModalStatusOpen"
      :selected-program="selectedProgramKegiatanBantuan"
      @close="((isModalStatusOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update program kegiatan bantuan gagal',
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
