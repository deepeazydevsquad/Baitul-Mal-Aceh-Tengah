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
import FormAdd from '@/modules/RiwayatPesanWhatsapp/widgets/FormAdd.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { get_info_Whatsapp_message, delete_pesan_whatsapp } from '@/service/riwayat_pesan_whatsapp';

// State: Loading
const isLoading = ref(false);
const isTableLoading = ref(false);

// Composable: pagination
const itemsPerPage = ref<number>(100);
const totalColumns = ref<number>(7);
const tableColumns = ref<TableColumn[]>([]);

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value });

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

interface Data {
  id: number;
  sender_number: string;
  destination_number: string;
  message: string;
  status: string;
  type: string;
  updatedAt: string;
}

const datas = ref<Data[]>([]);

// Function: Modal
const isModalAddOpen = ref(false);

function openModalAdd() {
  isModalAddOpen.value = true;
}

// Function: Fetch Data
const search = ref('');

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await get_info_Whatsapp_message({
      search: search.value,
      perpage: perPage.value,
      pageNumber: currentPage.value,
    });

    datas.value = response.data;
    totalRow.value = response.total;
    console.log(datas.value);
  } catch (error) {
    displayNotification('Gagal mengambil data Pesan Whatsapp', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

const handleClose = () => {
  isModalAddOpen.value = false;
  fetchData();
};

const handleStatus = (payload: any) => {
  displayNotification(
    payload.error_msg || 'Tambah Program Berhasil',
    payload.error ? 'error' : 'success',
  );
};

// Function: Delete Data
async function deleteData(id: number) {
  console.log('-------');
  console.log(id);
  console.log('-------');
  displayConfirmation(
    'Hapus Pesan Whatsapp',
    'Apakah Anda yakin ingin menghapus data pesan ini?',
    async () => {
      try {
        isLoading.value = true;
        await delete_pesan_whatsapp(id);
        displayNotification('Pesan whatsapp berhasil dihapus', 'success');
        await fetchData();
      } catch (error) {
        displayNotification('Gagal', 'error');
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
          :data="datas"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          @page-change="pageNow"
          :show-search="true"
          search-placeholder="Cari Program . . . "
          @search="search = $event; fetchData()"
          :show-add="true"
          add-label="Kirim Pesan"
          @add="openModalAdd"
          :show-edit="false"
          :show-delete="false"
          :show-numbering="false"
          :show-actions="false"
        >
          <template #thead>
            <thead class="bg-gray-50 text-gray-700 text-center border-b border-gray-300">
              <tr>
                <th class="w-[15%] px-6 py-3 font-medium">Nomor Asal</th>
                <th class="w-[15%] px-6 py-3 font-medium">Nomor Tujuan</th>
                <th class="w-[10%] px-6 py-3 font-medium">Jenis Pesan</th>
                <th class="w-[25%] px-6 py-3 font-medium">Pesan</th>
                <th class="w-[10%] px-6 py-3 font-medium">status</th>
                <th class="w-[15%] px-6 py-3 font-medium">Tanggal Pengiriman</th>
                <th class="w-[10%] px-6 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
          </template>
          <template #tbody>
            <tbody class="divide-y divide-gray-100">
              <!-- Data Rows -->
              <template v-if="datas && datas.length > 0">
                <tr v-for="data in datas" :key="data.id" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.sender_number }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.destination_number }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.type }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.message }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.status }}
                  </td>
                  <td class="px-6 py-4 text-center font-medium text-gray-800">
                    {{ data.updatedAt }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex justify-center gap-2">
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
                      <font-awesome-icon icon="fa-solid fa-message" class="text-4xl" />
                    </div>
                    <p class="empty-state-title">Tidak ada data</p>
                    <p class="empty-state-desc">Pesan whatsapp tidak ditemukan.</p>
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
    <FormAdd :is-modal-open="isModalAddOpen" @close="handleClose" @status="handleStatus" />
    <!-- Notification -->
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
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
  </div>
</template>
