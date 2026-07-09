<script setup lang="ts">
//Import Components
import { ref, onMounted, computed } from 'vue';
import draggable from 'vuedraggable';
import {
  getRunningText,
  addRunningText,
  editRunningText,
  deleteRunningText,
  toggleRunningTextStatus,
  updateRunningTextOrder,
  getSpeedSetting,
  updateSpeedSetting,
} from '@/service/running_text';

import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import EditIcon from '@/components/Icons/EditIcon.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import Notification from '@/components/Modal/Notification.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import PrimaryButton from '@/components/Button/PrimaryButton.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import ToggleSwitch from '@/components/Button/ToggleSwitch.vue';
import LightButton from '@/components/Button/LightButton.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import FormAdd from './Widgets/FormAdd.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';
import FormEdit from './Widgets/FormEdit.vue';
import FormSpeedSettings from './Widgets/FormSpeedSettings.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(3);
const tableColumns = ref<TableColumn[]>([]);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// Data variables
interface RunningText {
  id: number;
  content: string;
  is_active: boolean;
  order: number;
}

const dataRunningText = ref<RunningText[]>([]);
const editData = ref<RunningText | null>(null);

// Speed settings
const currentSpeed = ref(80);
const isModalSpeedOpen = ref(false);

// Computed properties
const activeTexts = computed({
  get: () => dataRunningText.value.filter((t) => t.is_active).sort((a, b) => a.order - b.order),
  set: (newValue) => {
    console.log(
      '[RunningText.vue] Draggable triggered with new order:',
      newValue.map((item) => ({ id: item.id, content: item.content.substring(0, 30) + '...' })),
    );

    const newOrder = newValue.map((item) => item.id);
    console.log('[RunningText.vue] New order IDs:', newOrder);

    updateOrder(newOrder);
  },
});

// Function: fetch data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await getRunningText({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    ((dataRunningText.value = response.data), (totalRow.value = response.total));
  } catch (error: any) {
    console.error('Error fetching data:', error);
    displayNotification(error.response?.data?.message || 'Gagal mengambil data teks.', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

// Function: fetch speed setting
async function fetchSpeedSetting() {
  try {
    const response = await getSpeedSetting();
    currentSpeed.value = response.data.speed;
  } catch (error: any) {
    console.error('Error fetching speed setting:', error);
  }
}

onMounted(async () => {
  await fetchData();
  await fetchSpeedSetting();
});

// Function: handler untuk menambahkan teks
const isModalAddOpen = ref(false);

const handleSubmit = async (formData: { content: string }) => {
  try {
    console.log('[RunningText.vue] Menerima data dari FormAdd:', formData);

    const response = await addRunningText({
      content: formData.content.trim(),
    });

    console.log('[RunningText.vue] Response dari API:', response);

    isModalAddOpen.value = false;
    displayNotification('Teks baru berhasil ditambahkan.', 'success');

    await fetchData();
  } catch (error: any) {
    console.error('[RunningText.vue] Error saat menyimpan teks baru:', error);
    const errorMessage =
      error.response?.data?.message || 'Gagal menambahkan teks baru. Silakan coba lagi.';
    displayNotification(errorMessage, 'error');
  }
};

// Function: handler untuk menyimpan perubahan
const isModalEditOpen = ref(false);

const handleSubmitEdit = async (formData: { id: number; content: string }) => {
  try {
    console.log('[RunningText.vue] Menerima data dari FormEdit:', formData);

    const response = await editRunningText(formData.id, {
      content: formData.content.trim(),
    });

    console.log('[RunningText.vue] Response dari API edit:', response);

    isModalEditOpen.value = false;
    editData.value = null;
    displayNotification('Teks berhasil diperbarui.', 'success');

    await fetchData();
  } catch (error: any) {
    console.error('[RunningText.vue] Error saat mengedit teks:', error);
    const errorMessage = error.response?.data?.message || 'Gagal mengedit teks. Silakan coba lagi.';
    displayNotification(errorMessage, 'error');
  }
};

// Function: handler untuk mengubah status
const handleToggle = async (runningText: RunningText) => {
  try {
    const originalStatus = runningText.is_active;
    runningText.is_active = !runningText.is_active;

    console.log(
      `[RunningText.vue] Toggling status for ID ${runningText.id} from ${originalStatus} to ${runningText.is_active}`,
    );

    await toggleRunningTextStatus(runningText.id);
    displayNotification('Status berhasil diperbarui', 'success');

    setTimeout(async () => {
      await fetchData();
      console.log('[RunningText.vue] Data refreshed after toggle');
    }, 300);
  } catch (error) {
    console.error('[RunningText.vue] Error toggling status:', error);
    runningText.is_active = !runningText.is_active;
    displayNotification('Gagal memperbarui status', 'error');
  }
};

// Function: handler untuk mengubah urutan
const updateOrder = async (orderIds: number[]) => {
  try {
    console.log('[RunningText.vue] Sending order update request:', orderIds);

    const response = await updateRunningTextOrder(orderIds);
    console.log('[RunningText.vue] Order update response:', response);

    displayNotification('Urutan teks berhasil disimpan', 'success');

    setTimeout(async () => {
      await fetchData();
      console.log('[RunningText.vue] Data refreshed after order update');
    }, 500);
  } catch (error) {
    console.error('[RunningText.vue] Error updating order:', error);
    displayNotification('Gagal menyimpan urutan', 'error');
    await fetchData();
  }
};

// Function: handler untuk update speed
const handleSpeedUpdate = async (speed: number) => {
  try {
    console.log('[RunningText.vue] Updating speed to:', speed);

    await updateSpeedSetting(speed);
    currentSpeed.value = speed;

    isModalSpeedOpen.value = false;

    displayNotification('Kecepatan running text berhasil diperbarui', 'success');
  } catch (error: any) {
    console.error('[RunningText.vue] Error updating speed:', error);

    isModalSpeedOpen.value = false;

    const errorMessage =
      error.response?.data?.message || 'Gagal memperbarui kecepatan. Silakan coba lagi.';
    displayNotification(errorMessage, 'error');
  }
};

// Modal functions
const openModalAdd = () => {
  console.log('[RunningText.vue] Opening modal for adding new text');
  isModalAddOpen.value = true;
};

const openModalEdit = (runningText: RunningText) => {
  console.log('[RunningText.vue] Opening modal for editing text:', runningText);
  editData.value = { ...runningText };
  isModalEditOpen.value = true;
};

const openModalSpeed = () => {
  console.log('[RunningText.vue] Opening modal for speed settings');
  isModalSpeedOpen.value = true;
};

// Function: handler untuk menghapus
const handleDelete = (id: number) => {
  const textToDelete = dataRunningText.value.find((t) => t.id === id);
  const truncatedContent = textToDelete
    ? textToDelete.content.length > 50
      ? textToDelete.content.substring(0, 50) + '...'
      : textToDelete.content
    : 'data ini';

  displayConfirmation(
    'Konfirmasi Hapus',
    `Apakah Anda yakin ingin menghapus "${truncatedContent}"?`,
    async () => {
      try {
        console.log('[RunningText.vue] Deleting text with ID:', id);

        await deleteRunningText(id);

        showConfirmDialog.value = false;
        displayNotification('Data berhasil dihapus.', 'success');

        await fetchData();
      } catch (error: any) {
        console.error('[RunningText.vue] Error deleting text:', error);
        showConfirmDialog.value = false;
        const errorMessage =
          error.response?.data?.message || 'Gagal menghapus data. Silakan coba lagi.';
        displayNotification(errorMessage, 'error');
      }
    },
  );
};

// Function: handler untuk mengedit
const handleEdit = (runningText: RunningText) => {
  openModalEdit(runningText);
};
</script>

<template>
  <div class="mx-auto p-4">
    <div class="overflow-hidden rounded-xl border border-gray-200 shadow">
      <SkeletonTable v-if="isTableLoading" :columns="totalColumns" :rows="itemsPerPage" />
      <BaseTable
        v-else
        class="w-full border-collapse bg-white text-sm"
        :columns="tableColumns"
        :data="dataRunningText"
        :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
        @page-change="pageNow"
        :show-search="true"
        search-placeholder="Cari teks..."
        @search="search = $event; fetchData()"
        :show-add="true"
        add-label="Tambahkan Teks"
        @add="openModalAdd"
        :show-edit="false"
        :show-delete="false"
        :show-numbering="false"
        :show-actions="false"
      >
        <template #custom-actions>
          <BaseButton
            @click="openModalSpeed()"
            variant="warning"
            type="button"
            title="Pengaturan Kecepatan"
          >
            <font-awesome-icon icon="fa-solid fa-gear" class="text-lg" />
          </BaseButton>
        </template>
        <template #thead>
          <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
            <tr>
              <th class="w-[65%] px-6 py-3 font-medium">Isi Text</th>
              <th class="w-[15%] px-6 py-3 font-medium">Status</th>
              <th class="w-[20%] px-6 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
        </template>
        <template #tbody>
          <tbody class="divide-y divide-gray-100">
            <template v-if="dataRunningText.length > 0">
              <tr
                v-for="data in dataRunningText"
                :key="data.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-6 py-4 text-left font-medium text-gray-800 whitespace-nowrap">
                  <p
                    class="text-gray-900 break-words whitespace-normal leading-relaxed max-w-[600px] line-clamp-4"
                  >
                    {{ data.content }}
                  </p>
                </td>
                <td class="px-6 py-4 text-center font-medium text-gray-800">
                  <span
                    :class="[
                      'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                      data.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
                    ]"
                  >
                    {{ data.is_active ? 'Aktif' : 'Tidak Aktif' }}
                  </span>
                </td>
                <td class="py-4 flex justify-center items-center">
                  <div class="flex justify-center items-center gap-2">
                    <ToggleSwitch
                      :id="data.id"
                      :checked="data.is_active"
                      @change="handleToggle(data)"
                    />
                    <LightButton @click="handleEdit(data)">
                      <EditIcon />
                    </LightButton>
                    <DangerButton @click="handleDelete(data.id)">
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
                      <font-awesome-icon icon="fa-solid fa-file-lines" class="text-4xl" />
                    </div>
                    <p class="empty-state-title">Tidak ada data</p>
                    <p class="empty-state-desc">Belum ada data running text.</p>
                  </div>
                </td>
            </tr>
          </tbody>
        </template>
        
      </BaseTable>
    </div>

    <!-- Urutan Teks Aktif Section -->
    <div class="mt-10 p-6 bg-white rounded-lg border border-gray-200 shadow-md">
      <h3 class="text-lg font-bold text-gray-900">Urutan Teks Aktif</h3>
      <p class="mt-1 text-sm text-gray-500">
        Seret dan lepas untuk mengubah urutan teks yang akan ditampilkan di footer.
      </p>
      <div v-if="activeTexts.length > 0" class="mt-4">
        <draggable
          v-model="activeTexts"
          item-key="id"
          tag="ul"
          class="divide-y divide-gray-200 border border-gray-300 rounded-lg"
        >
          <template #item="{ element }">
            <li
              class="p-4 flex items-center bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-3 text-gray-400 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span class="text-gray-800 break-words whitespace-normal leading-relaxed">{{
                element.content
              }}</span>
            </li>
          </template>
        </draggable>
      </div>
      <div
        v-else
        class="mt-4 text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg"
      >
        <font-awesome-icon
          icon="fa-solid fa-clipboard-question"
          class="text-4xl mb-2 text-gray-400"
        />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Tidak ada teks aktif</h3>
        <p class="mt-1 text-sm text-gray-500">
          Aktifkan teks pada tabel di atas untuk mengatur urutannya.
        </p>
      </div>
    </div>

    <!-- Modal Form Add -->
    <FormAdd :showModal="isModalAddOpen" @close="isModalAddOpen = false" @save="handleSubmit" />

    <!-- Modal Form Edit -->
    <FormEdit
      :showModal="isModalEditOpen"
      :editData="editData"
      @close="isModalEditOpen = false"
      @save="handleSubmitEdit"
    />

    <!-- Modal Speed Settings -->
    <FormSpeedSettings
      :showModal="isModalSpeedOpen"
      :currentSpeed="currentSpeed"
      @close="isModalSpeedOpen = false"
      @save="handleSpeedUpdate"
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
