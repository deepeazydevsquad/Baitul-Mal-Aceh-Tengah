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
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from '@/modules/GrupAkses/widgets/FormAdd.vue';
import FormEdit from '@/modules/GrupAkses/widgets/FormEdit.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { list_grup, delete_grup } from '@/service/grup_akses';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(3);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface Submenu {
  id: number;
  menu_id?: number;
  name: string;
  path: string;
}

interface Menu {
  id: number;
  name: string;
  path: string;
  icon: string;
  tab?: string;
  Submenus: Submenu[];
}

interface Data {
  id: number;
  name: string;
  group_access: Menu[];
}

const datas = ref<Data[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const selectedGrup = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(id: any) {
  selectedGrup.value = id;
  console.log('grup Parent', selectedGrup.value);
  isModalEditOpen.value = true;
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list_grup({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    datas.value = response.data.map((item: any) => ({
      ...item,
      group_access:
        typeof item.group_access === 'string' ? JSON.parse(item.group_access) : item.group_access,
    }));
    totalRow.value = response.total;
    console.log(datas.value);
  } catch (error) {
    displayNotification('Gagal mengambil data Grup', 'error');
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
    'Hapus Data Grup',
    'Apakah Anda yakin ingin menghapus data Grup ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_grup({ id: id });
        displayNotification('Data Grup berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data Grup', 'error');
      } finally {
        isLoading.value = false;
      }
    },
  );
}

const handleModalEdit = () => {
  isModalEditOpen.value = false;
  fetchData();
};

const handleClose = () => {
  isModalAddOpen.value = false;
  fetchData();
};

const handleStatus = (payload: any) => {
  displayNotification(
    payload.error_msg || 'Tambah/Update Grup gagal',
    payload.error ? 'error' : 'success',
  );
};
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <BaseButton
          @click="openModalAdd()"
          variant="primary"
          :loading="isModalAddOpen || isModalEditOpen"
          type="button"
        >
          <font-awesome-icon icon="fa-solid fa-plus" class="mr-2" />
          Tambah Grup
        </BaseButton>

        <!-- Search -->
        <div class="flex items-center w-full sm:w-auto">
          <label for="search" class="mr-2 text-sm font-medium text-gray-600">Cari</label>
          <input
            id="search"
            type="text"
            v-model="search"
            @change="fetchData"
            placeholder="Cari Grup..."
            class="w-full sm:w-64 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
          />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <table v-else class="w-full border-collapse bg-white text-sm">
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr>
              <th class="w-[40%] px-6 py-3 font-medium align-top">Nama Grup</th>
              <th class="w-[30%] px-6 py-3 font-medium align-top">Akses</th>
              <th class="w-[30%] px-6 py-3 font-medium align-top">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <template v-if="datas && datas.length > 0">
              <tr
                v-for="data in datas"
                :key="data.id"
                class="hover:bg-gray-50 transition-colors"
                :class="data.id === 1 ? ' pointer-events-none opacity-50 ' : ''"
              >
                <td class="px-6 py-4 text-center font-medium text-gray-800 align-top">
                  {{ data.name }}
                </td>
                <td class="px-6 py-4 text-left font-medium text-gray-800">
                  <template v-if="data.id == 1">
                    <div
                      v-if="data.group_access.length > 0"
                      v-for="menu in data.group_access"
                      :key="menu.id"
                      class="mb-2"
                    >
                      <div class="font-semibold">{{ menu.name }}</div>
                      <ul v-if="menu.Submenus?.length" class="ml-6 list-disc text-sm text-gray-600">
                        <li v-for="sub in menu.Submenus" :key="sub.id">
                          {{ sub.name }}
                        </li>
                      </ul>
                    </div>
                    <div v-else class="font-normal">
                      <span class="text-gray-400 italic">Full Access</span>
                    </div>
                  </template>
                  <template v-else>
                    <div v-for="menu in data.group_access" :key="menu.id" class="mb-2">
                      <div class="font-semibold">{{ menu.name }}</div>
                      <ul v-if="menu.Submenus?.length" class="ml-6 list-disc text-sm text-gray-600">
                        <li v-for="sub in menu.Submenus" :key="sub.id">
                          {{ sub.name }}
                        </li>
                      </ul>
                    </div>
                  </template>
                </td>

                <td class="px-6 py-4 align-top">
                  <div class="flex justify-center gap-2">
                    <template v-if="data.id !== 1">
                      <LightButton @click="openModalEdit(data.id)">
                        <EditIcon />
                      </LightButton>
                      <DangerButton @click="deleteData(data.id)">
                        <DeleteIcon />
                      </DangerButton>
                    </template>
                    <template v-else>
                      <span class="text-gray-400 italic">Default Grup</span>
                    </template>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else>
              <td :colspan="totalColumns" class="px-6 py-8 text-center text-gray-500">
                <font-awesome-icon
                  icon="fa-solid fa-database"
                  class="text-2xl mb-2 text-gray-400"
                />
                <p class="text-sm">Belum ada data grup akses.</p>
              </td>
            </tr>
          </tbody>

          <!-- Pagination -->
          <tfoot>
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

    <!-- Modal FormAdd -->
    <FormAdd :is-modal-open="isModalAddOpen" @close="handleClose" @status="handleStatus" />

    <!-- Modal FormEdit -->
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :id="selectedGrup"
      @close="handleModalEdit"
      @status="handleStatus"
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
