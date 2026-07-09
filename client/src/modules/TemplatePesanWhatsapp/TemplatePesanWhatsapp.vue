<script setup lang="ts">
// Library
import { ref, onMounted } from 'vue';
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
import FormAdd from '@/modules/TemplatePesanWhatsapp/widgets/FormAdd.vue';
import FormEdit from '@/modules/TemplatePesanWhatsapp/widgets/FormEdit.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import {
  get_template_pesan_whatsapp,
  delete_template_pesan_whatsapp,
} from '@/service/template_pesan_whatsapp';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(5);
const tableColumns = ref<TableColumn[]>([]);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// State Data
interface Data {
  id: number;
  name: string;
  type: string;
  message: string;
  variable: string | any[];
}

const dataTemplates_pesan_whatsapp = ref<Data[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);
const isModalEditOpen = ref(false);
const selectedTemplatePesanWhatsapp = ref<any>(null);

function openModalAdd() {
  isModalAddOpen.value = true;
}

function openModalEdit(template: any) {
  selectedTemplatePesanWhatsapp.value = template;
  isModalEditOpen.value = true;
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_template_pesan_whatsapp({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    dataTemplates_pesan_whatsapp.value = response.data;
    totalRow.value = response.total;
  } catch (error) {
    displayNotification('Gagal mengambil template pesan whatsapp', 'error');
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
    'Hapus Data template pesan whatsapp',
    'Apakah Anda yakin ingin menghapus data template pesan whatsapp ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_template_pesan_whatsapp(id);
        displayNotification('Data template pesan whatsapp berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal menghapus data template pesan whatsapp', 'error');
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
      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
        <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
        <BaseTable
          v-else
          class="w-full border-collapse bg-white text-sm"
          :columns="tableColumns"
          :data="dataTemplates_pesan_whatsapp"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          @page-change="pageNow"
          :show-search="true"
          search-placeholder="Cari template pesan..."
          @search="search = $event; fetchData()"
          :show-add="true"
          add-label="Tambah Template Pesan"
          @add="openModalAdd"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #thead>
            <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
              <tr>
                <th class="w-[15%] px-6 py-3 font-medium">Name</th>
                <th class="w-[15%] px-6 py-3 font-medium">Tipe Pesan</th>
                <th class="w-[30%] px-6 py-3 font-medium">Pesan</th>
                <th class="w-[30%] px-6 py-3 font-medium">Variabel</th>
                <th class="w-[10%] px-6 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100">
              <template v-if="dataTemplates_pesan_whatsapp.length > 0">
                <tr
                  v-for="data in dataTemplates_pesan_whatsapp"
                  :key="data.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.name }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.type }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.message }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.variable }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex justify-center gap-2">
                      <LightButton @click="openModalEdit(data)">
                        <EditIcon />
                      </LightButton>
                      <DangerButton @click="deleteData(data.id)">
                        <DeleteIcon />
                      </DangerButton>
                    </div>
                  </td>
                </tr>
              </template>

              <!-- Empty State -->
              <tr v-else>
                <td :colspan="totalColumns" class="empty-state-cell">
                  <div class="empty-state animate-fade-in">
                    <div class="empty-state-icon">
                      <font-awesome-icon icon="fa-solid fa-database" class="text-4xl" />
                    </div>
                    <p class="empty-state-title">Tidak ada data</p>
                    <p class="empty-state-desc">Belum ada template pesan.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </template>

          <!-- Pagination -->
          
        </BaseTable>
      </div>
    </div>

    <!-- Modal FormAdd -->
    <FormAdd
      :is-modal-open="isModalAddOpen"
      @close="((isModalAddOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah Template Pesan Whatsapp berhasil',
            payload.error ? 'error' : 'success',
          )
      "
    />

    <!-- Modal FormEdit -->
    <FormEdit
      :is-modal-open="isModalEditOpen"
      :selected-template-pesan-whatsapp="selectedTemplatePesanWhatsapp"
      @close="((isModalEditOpen = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Update Template Pesan Whatsapp berhasil',
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
