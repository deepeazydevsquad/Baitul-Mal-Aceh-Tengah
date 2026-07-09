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
import FormAdd from '@/modules/GrupAkses/widgets/FormAdd.vue';
import FormEdit from '@/modules/GrupAkses/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

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

const tableColumns = ref<TableColumn[]>([
  { key: 'name', label: 'Nama Grup', headerClass: 'w-[40%] text-center align-top', cellClass: 'text-center font-medium text-gray-800 align-top' },
  { key: 'akses', label: 'Akses', headerClass: 'w-[30%] text-center align-top', cellClass: 'text-left font-medium text-gray-800' },
]);

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
  <div class="p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
        :columns="tableColumns"
        :data="datas"
        :loading="isTableLoading"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        :show-search="true"
        search-placeholder="Cari Grup..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambah Grup"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        @page-change="pageNow"
      >
        <template #cell-name="{ row }">
          <div :class="row.id === 1 ? 'pointer-events-none opacity-50' : ''">
            {{ row.name }}
          </div>
        </template>
        
        <template #cell-akses="{ row }">
          <div :class="row.id === 1 ? 'pointer-events-none opacity-50' : ''">
            <template v-if="row.id == 1">
              <div
                v-if="row.group_access.length > 0"
                v-for="menu in row.group_access"
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
              <div v-for="menu in row.group_access" :key="menu.id" class="mb-2">
                <div class="font-semibold">{{ menu.name }}</div>
                <ul v-if="menu.Submenus?.length" class="ml-6 list-disc text-sm text-gray-600">
                  <li v-for="sub in menu.Submenus" :key="sub.id">
                    {{ sub.name }}
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </template>
        
        <template #row-actions="{ row }">
          <div class="flex justify-center gap-2 align-top">
            <template v-if="row.id !== 1">
              <LightButton @click="openModalEdit(row.id)">
                <EditIcon />
              </LightButton>
              <DangerButton @click="deleteData(row.id)">
                <DeleteIcon />
              </DangerButton>
            </template>
            <template v-else>
              <span class="text-gray-400 italic mt-2">Default Grup</span>
            </template>
          </div>
        </template>
      </BaseTable>
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
