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

// Composable
import { usePagination } from '@/composables/usePaginations';
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';

// Service API
import { list, start } from '@/service/pengaturan_whatsapp';
import IconSupport from '@/components/Icons/IconSupport.vue';
import GearIcon from '@/components/Icons/GearIcon.vue';
import FormKonfigurasi from './widget/FormKonfigurasi.vue';

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

// State Data Bank
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

interface Data {
  api_key: string;
  device_key: string;
  status: string;
  expired_at: string;
  created_at: string;
  whatsapp_number: string;
}

const datas = ref<Data[]>([]);

// Function: Modal
const isModalKonfigurasi = ref(false);
const isModalEditOpen = ref(false);
const selectedBank = ref<any>(null);

function openModalAdd() {
  isModalKonfigurasi.value = true;
}

async function fetchData() {
  isTableLoading.value = true;
  try {
    const response = await list();

    datas.value = response.data;

    console.log(datas.value);
  } catch (error) {
    displayNotification('Gagal mengambil data bank', 'error');
  } finally {
    isTableLoading.value = false;
  }
}

onMounted(async () => {
  await fetchData();
});

const qrUrl = ref('');

const restart = async () => {
  isLoading.value = true;
  qrUrl.value = null; // reset QR dulu setiap kali restart
  try {
    const response = await start();

    if (response.todo === 'scan') {
      // kalau butuh scan → notif merah + tampilkan QR
      displayNotification('Perlu scan QR dulu', 'error');
      if (response.qr_image) {
        qrUrl.value = response.qr_image;
      }
    } else if (response.todo === 'connected') {
      // kalau udah konek → notif hijau
      displayNotification('Perangkat terhubung', 'success');
    } else {
      // fallback
      displayNotification(response.message || 'Status tidak diketahui', 'warning');
    }
  } catch (error) {
    displayNotification('Gagal restart koneksi', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="mx-auto p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex gap-4">
          <!-- Button Konfigurasi -->
          <BaseButton
            @click="openModalAdd()"
            variant="primary"
            :loading="isModalKonfigurasi"
            type="button"
          >
            <font-awesome-icon icon="fa-solid fa-gear" class="mr-2" />
            Konfigurasi
          </BaseButton>

          <BaseButton @click="restart()" variant="primary" type="button">
            <font-awesome-icon icon="fa-solid fa-circle-notch" class="mr-2" />
            Restart
          </BaseButton>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 shadow bg-white p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <!-- Kiri: Informasi -->
          <div class="border border-t border-gray-300 overflow-hidden shadow h-full flex flex-col">
            <div class="bg-gray-200 px-4 py-2 font-medium text-gray-800 text-center">
              INFORMASI PERANGKAT
            </div>
            <div class="divide-y divide-gray-300 flex-1">
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Nomor WA</span>
                <span>:</span>
                <span>{{ datas.whatsapp_number }}</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Device Key</span>
                <span>:</span>
                <span>{{ datas.device_key }}</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Status</span>
                <span>:</span>
                <span>{{ datas.status }}</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Expired</span>
                <span>:</span>
                <span>{{ datas.expired_at }}</span>
              </div>
              <div class="grid grid-cols-[1fr_20px_1fr] px-4 py-2">
                <span>Dibuat</span>
                <span>:</span>
                <span>{{ datas.created_at }}</span>
              </div>
            </div>
          </div>

          <!-- Kanan: QR Code -->
          <div class="h-full flex flex-col items-center justify-center">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">QR Code</h3>

            <img
              v-if="qrUrl"
              :src="qrUrl"
              width="400"
              height="400"
              class="shadow"
              alt="QR koneksi WhatsApp"
            />

            <div v-else class="text-gray-400 text-sm text-center">
              Perangkat Masih Terkoneksi / Belum Tersedia
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal FormEdit -->
    <FormKonfigurasi
      :is-modal-open="isModalKonfigurasi"
      @close="((isModalKonfigurasi = false), fetchData())"
      @status="
        (payload: any) =>
          displayNotification(
            payload.error_msg || 'Tambah/Update Bank gagal',
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
