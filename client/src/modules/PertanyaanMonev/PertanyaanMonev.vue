<script setup lang="ts">
// Library
import { ref, onMounted, computed, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LightButton from '@/components/Button/LightButton.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAddPertanyaan from '@/modules/PertanyaanMonev/widgets/FormAdd.vue';
import FormEditPertanyaan from '@/modules/PertanyaanMonev/widgets/FormEdit.vue';
import FormAddSubPertanyaan from '@/modules/PertanyaanMonev/widgets/FormAddSubPertanyaan.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import {
  pertanyaan_monev_list,
  getJenisMonevList,
  getUrutanBagian,
  delete_pertanyaan,
} from '@/service/pertanyaan_monev';

// Interface
interface Pertanyaan {
  id: number;
  jenis_monev: string;
  tipe: string;
  bagian: string;
  pertanyaan: string;
  parent_id: number | null;
  bentuk_pertanyaan: string;
  children?: Pertanyaan[];
}

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(8);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// --- State Data Pertanyaan Monev ---
const datas = ref<Pertanyaan[]>([]);
const jenisMonevList = ref<string[]>([]);
const selectedJenisMonev = ref<string>('');
const urutanBagian = ref<string[]>([]);

const groupedPertanyaan = computed(() => {
  const grouped = new Map<string, Pertanyaan[]>();
  urutanBagian.value.forEach((bagian) => grouped.set(bagian, []));
  datas.value.forEach((p) => {
    if (grouped.has(p.bagian) && !p.parent_id) {
      const children = datas.value.filter((child) => child.parent_id === p.id);
      grouped.get(p.bagian)!.push({ ...p, children });
    }
  });
  return grouped;
});

// --- Modal Functions ---
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const isModalAddSubOpen = ref(false);
const selectedPertanyaanId = ref<number | null>(null);
const selectedParentPertanyaan = ref<Pertanyaan | null>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(pertanyaan: Pertanyaan) {
  selectedPertanyaanId.value = pertanyaan.id;
  isModalEditOpen.value = true;
}

function openModalAddSub(pertanyaan: Pertanyaan) {
  selectedParentPertanyaan.value = pertanyaan;
  isModalAddSubOpen.value = true;
}

// --- Data Fetching Functions ---
async function fetchJenisMonev() {
  try {
    const response = await getJenisMonevList();
    const rawList: string[] = response.data;
    const desiredOrder = [
      'evaluasi_konsumtif',
      'evaluasi_pemberdayaan_ekonomi',
      'evaluasi_pendidikan',
      'monitoring_konsumtif',
      'monitoring_pemberdayaan_ekonomi',
      'monitoring_pendidikan',
    ];
    const sortedList = rawList.sort((a, b) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b));
    jenisMonevList.value = sortedList;
    if (jenisMonevList.value.length > 0 && !selectedJenisMonev.value) {
      selectedJenisMonev.value = jenisMonevList.value[0];
    }
  } catch (error) {
    displayNotification('Gagal mengambil daftar jenis monev', 'error');
  }
}

async function fetchUrutanBagian() {
  if (!selectedJenisMonev.value) return;
  try {
    const response = await getUrutanBagian(selectedJenisMonev.value);
    urutanBagian.value = response.data;
  } catch (error) {
    displayNotification('Gagal mengambil urutan bagian monev', 'error');
    urutanBagian.value = [];
  }
}

async function fetchData() {
  if (!selectedJenisMonev.value) return;
  isTableLoading.value = true;
  try {
    await fetchUrutanBagian();
    const response = await pertanyaan_monev_list({
      perpage: perPage.value,
      pageNumber: currentPage.value,
      jenis_monev: selectedJenisMonev.value,
    });
    datas.value = response.data.data;
    totalRow.value = response.data.total;
  } catch (error) {
    displayNotification('Gagal mengambil data pertanyaan monev', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

watch(selectedJenisMonev, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    fetchData();
  }
});

onMounted(async () => {
  isLoading.value = true;
  await fetchJenisMonev();
  await fetchData();
  isLoading.value = false;
});

// --- Delete Data Function ---
async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Pertanyaan',
    'Apakah Anda yakin ingin menghapus pertanyaan ini? Semua sub-pertanyaan yang terhubung juga akan terhapus.',
    async () => {
      try {
        isLoading.value = true;
        await delete_pertanyaan(id);
        displayNotification('Data pertanyaan berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data pertanyaan', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}

const formatText = (text: string) => {
  if (!text) return '';
  return text.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <BaseButton @click="openModalAdd()" variant="primary">
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Pertanyaan Baru
        </BaseButton>

        <div class="flex items-center w-full sm:w-auto">
          <select
            id="jenis_monev"
            v-model="selectedJenisMonev"
            class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          >
            <option v-for="jenis in jenisMonevList" :key="jenis" :value="jenis">
              {{ formatText(jenis) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-lg">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="10" />
        <table v-else class="min-w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-100 text-gray-800 text-left border-b border-gray-300 text-center">
            <tr>
              <th class="w-[5%] px-4 py-3 font-semibold">No</th>
              <th class="w-[25%] px-4 py-3 font-semibold">Pertanyaan</th>
              <th class="w-[10%] px-4 py-3 font-semibold">Tipe</th>
              <th class="w-[10%] px-4 py-3 font-semibold">Jenis Monev</th>
              <th class="w-[10%] px-4 py-3 font-semibold">Bagian</th>
              <th class="w-[10%] px-4 py-3 font-semibold">Bentuk Jawaban</th>
              <th class="w-[15%] px-4 py-3 font-semibold">Detail Jawaban</th>
              <th class="w-[15%] px-4 py-3 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <template v-if="urutanBagian.length > 0">
              <template v-for="bagian in urutanBagian" :key="bagian">
                <tr class="bg-gray-50 sticky top-0 z-10">
                  <td :colspan="totalColumns" class="px-4 py-2 font-bold text-gray-700">
                    {{ formatText(bagian) }}
                  </td>
                </tr>
                <template
                  v-if="groupedPertanyaan.get(bagian) && groupedPertanyaan.get(bagian)!.length > 0"
                >
                  <template
                    v-for="(pertanyaan, index) in groupedPertanyaan.get(bagian)"
                    :key="pertanyaan.id"
                  >
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-4 py-3 text-gray-700 text-center">{{ index + 1 }}</td>
                      <td class="px-4 py-3 text-gray-800">{{ pertanyaan.pertanyaan }}</td>
                      <td class="px-4 py-3 text-gray-700 capitalize text-center">
                        {{ pertanyaan.tipe }}
                      </td>
                      <td class="px-4 py-3 text-gray-700 text-center">
                        {{ formatText(pertanyaan.jenis_monev) }}
                      </td>
                      <td class="px-4 py-3 text-gray-700 text-center">
                        {{ formatText(pertanyaan.bagian) }}
                      </td>
                      <td class="px-4 py-3 text-gray-700 capitalize text-center">
                        {{ pertanyaan.bentuk_pertanyaan }}
                      </td>
                      <td class="px-4 py-3 text-gray-700"></td>
                      <td class="px-4 py-3">
                        <div class="flex justify-center items-center gap-2">
                          <LightButton
                            @click="openModalAddSub(pertanyaan)"
                            title="Tambah Sub-Pertanyaan"
                          >
                            <font-awesome-icon icon="fa-solid fa-plus" />
                          </LightButton>
                          <LightButton @click="openModalEdit(pertanyaan)" title="Edit Pertanyaan">
                            <EditIcon />
                          </LightButton>
                          <DangerButton @click="deleteData(pertanyaan.id)" title="Hapus Pertanyaan">
                            <DeleteIcon />
                          </DangerButton>
                        </div>
                      </td>
                    </tr>
                    <tr
                      v-for="child in pertanyaan.children"
                      :key="child.id"
                      class="hover:bg-gray-50 transition-colors bg-gray-50/50"
                    >
                      <td class="px-4 py-3 text-gray-700 text-center"></td>
                      <td class="pl-10 pr-4 py-3 text-gray-800">
                        <span class="mr-2 text-gray-400">└─</span>
                        {{ child.pertanyaan }}
                      </td>
                      <td class="px-4 py-3 text-gray-700 capitalize text-center">
                        {{ child.tipe }}
                      </td>
                      <td class="px-4 py-3 text-gray-700 text-center">
                        {{ formatText(child.jenis_monev) }}
                      </td>
                      <td class="px-4 py-3 text-gray-700 text-center">
                        {{ formatText(child.bagian) }}
                      </td>
                      <td class="px-4 py-3 text-gray-700 capitalize text-center">
                        {{ child.bentuk_pertanyaan }}
                      </td>
                      <td class="px-4 py-3 text-gray-700"></td>
                      <td class="px-4 py-3">
                        <div class="flex justify-center items-center gap-2">
                          <div class="w-8 h-8"></div>
                          <LightButton @click="openModalEdit(child)" title="Edit Pertanyaan">
                            <EditIcon />
                          </LightButton>
                          <DangerButton @click="deleteData(child.id)" title="Hapus Pertanyaan">
                            <DeleteIcon />
                          </DangerButton>
                        </div>
                      </td>
                    </tr>
                  </template>
                </template>
                <tr v-else>
                  <td :colspan="totalColumns" class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                    </div>
                    <p class="empty-state-title">Tidak ada data</p>
                    <p class="empty-state-desc">Tidak ada pertanyaan untuk bagian ini.</p>
                  </div>
                </td>
                </tr>
              </template>
            </template>
            <tr v-else>
              <td :colspan="totalColumns" class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      <font-awesome-icon icon="fa-solid fa-folder-open" class="text-4xl" />
                    </div>
                    <p class="empty-state-title">Tidak ada data</p>
                    <p class="empty-state-desc">Belum ada data pertanyaan untuk jenis monev ini.</p>
                  </div>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <FormAddPertanyaan
      :is-modal-open="isModalAddOpen"
      @close="
        isModalAddOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(payload.error_msg, payload.error ? 'error' : 'success')
      "
    />

    <FormEditPertanyaan
      :is-modal-open="isModalEditOpen"
      :pertanyaan-id="selectedPertanyaanId"
      @close="
        isModalEditOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(payload.error_msg, payload.error ? 'error' : 'success')
      "
    />

    <FormAddSubPertanyaan
      :is-modal-open="isModalAddSubOpen"
      :parent-pertanyaan="selectedParentPertanyaan"
      @close="
        isModalAddSubOpen = false;
        fetchData();
      "
      @status="
        (payload: any) =>
          displayNotification(payload.error_msg, payload.error ? 'error' : 'success')
      "
    />

    <!-- Confirmation & Notification -->
    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <BaseButton variant="secondary" @click="cancel">Batal</BaseButton>
      <BaseButton variant="danger" @click="confirm">Ya, Hapus</BaseButton>
    </Confirmation>

    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
