<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import { getInfaqBanks, confirmInfaqPayment } from '@/service/infaq_member';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

const props = defineProps<{
  isModalOpen: boolean;
  selectedInfaq: any;
}>();

const emit = defineEmits(['close', 'status']);

const isLoading = ref(false);
const isBankLoading = ref(false);

interface Bank {
  bankName: string;
  accountName: string;
  accountNumber: string;
}
const infaqBanks = ref<Bank[]>([]);

const bankColumns = ref<TableColumn[]>([
  { key: 'bankName', label: 'Bank', headerClass: 'text-left font-medium text-gray-600 p-2', cellClass: 'p-2 font-medium' },
  { key: 'accountName', label: 'Atas Nama', headerClass: 'text-left font-medium text-gray-600 p-2', cellClass: 'p-2' },
  { key: 'accountNumber', label: 'Nomor Rekening', headerClass: 'text-left font-medium text-gray-600 p-2', cellClass: 'p-2 font-mono' },
]);

const fetchInfaqBanks = async () => {
  isBankLoading.value = true;
  try {
    const response = await getInfaqBanks();
    if (response && response.data) {
      infaqBanks.value = response.data;
    }
  } catch (error: any) {
    emit('status', { error: true, error_msg: 'Gagal memuat daftar bank.' });
  } finally {
    isBankLoading.value = false;
  }
};

watch(
  () => props.isModalOpen,
  (newValue) => {
    if (newValue) {
      fetchInfaqBanks();
    }
  },
);

const handleConfirmPayment = async () => {
  isLoading.value = true;
  try {
    await confirmInfaqPayment(props.selectedInfaq.invoice);

    emit('status', { error: false, error_msg: 'Konfirmasi pembayaran berhasil dikirim.' });
    emit('close');
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || 'Terjadi kesalahan saat mengirim konfirmasi.';
    emit('status', { error: true, error_msg: errorMsg });
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  if (isLoading.value) return;
  emit('close');
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform scale-95 opacity-0"
    enter-to-class="transform scale-100 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform scale-100 opacity-100"
    leave-to-class="transform scale-95 opacity-0"
  >
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm"
      @click.self="closeModal"
    >
      <div class="w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800">
              {{
                selectedInfaq?.status === 'success'
                  ? 'Detail Pembayaran Infaq'
                  : 'Konfirmasi Pembayaran Infaq'
              }}
            </h2>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600"
              :disabled="isLoading"
            >
              <font-awesome-icon icon="fa-solid fa-times" />
            </button>
          </div>

          <!-- Detail Pembayaran -->
          <div class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-lg text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal Transaksi:</span>
                <span class="font-medium text-gray-800">{{
                  selectedInfaq?.tanggal_pembayaran
                }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-gray-600">Invoice INFAQ:</span>
                <span class="font-bold text-green-700">{{ selectedInfaq?.invoice }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-gray-600">Nominal:</span>
                <span class="font-bold text-gray-800">{{
                  formatRupiah(selectedInfaq?.nominal || 0)
                }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-gray-600">Status Pembayaran:</span>
                <span
                  class="font-medium px-2 py-0.5 rounded-full"
                  :class="{
                    'bg-yellow-100 text-yellow-600': selectedInfaq?.status === 'process',
                    'bg-green-100 text-green-600': selectedInfaq?.status === 'success',
                    'bg-red-100 text-red-600': selectedInfaq?.status === 'failed',
                  }"
                >
                  {{ selectedInfaq?.status }}
                </span>
              </div>
            </div>

            <!-- Tampilan untuk status SUCCESS -->
            <div v-if="selectedInfaq?.status === 'success'" class="text-center space-y-4">
              <div class="flex justify-center">
                <div class="rounded-full bg-green-100 p-4">
                  <font-awesome-icon
                    icon="fa-solid fa-check-circle"
                    class="text-green-600 text-5xl"
                  />
                </div>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h3>
                <p class="text-gray-600">
                  Alhamdulillah, pembayaran infaq Anda sebesar
                  <strong class="text-green-700">{{
                    formatRupiah(selectedInfaq?.nominal || 0)
                  }}</strong>
                  telah berhasil diverifikasi.
                </p>
              </div>
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-green-800 font-medium">
                  Jazakallahu khairan atas kontribusi Anda. Semoga menjadi amal jariyah dan mendapat
                  balasan yang berlipat ganda dari Allah SWT.
                </p>
              </div>
            </div>

            <!-- Tampilan untuk konfirmasi sudah dikirim (status PROCESS & konfirmasi sudah_dikirim) -->
            <div
              v-else-if="selectedInfaq?.konfirmasi_pembayaran === 'sudah_dikirim'"
              class="text-center space-y-4"
            >
              <div class="flex justify-center">
                <div class="rounded-full bg-blue-100 p-4">
                  <font-awesome-icon
                    icon="fa-solid fa-paper-plane"
                    class="text-blue-600 text-5xl"
                  />
                </div>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Konfirmasi Terkirim</h3>
                <p class="text-gray-600">
                  Anda sudah mengirimkan konfirmasi pembayaran untuk infaq sebesar
                  <strong class="text-blue-700">{{
                    formatRupiah(selectedInfaq?.nominal || 0)
                  }}</strong>
                </p>
              </div>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex">
                  <font-awesome-icon icon="fa-solid fa-spinner" class="text-blue-600 mt-0.5 mr-2" />
                  <div class="text-left">
                    <p class="text-blue-800 font-medium mb-1">Menunggu Verifikasi Admin</p>
                    <p class="text-blue-700 text-sm">
                      Konfirmasi pembayaran Anda sedang dalam proses verifikasi oleh admin. Mohon
                      tunggu beberapa saat, status pembayaran akan diperbarui setelah diverifikasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tampilan untuk status belum konfirmasi -->
            <template v-else>
              <div class="text-center">
                <p class="text-gray-700">
                  Silakan lakukan pembayaran Infaq anda sebesar
                  <strong class="text-lg">{{ formatRupiah(selectedInfaq?.nominal || 0) }}</strong>
                  ke nomor rekening di bawah ini.
                </p>
              </div>

              <!-- Tabel Bank -->
              <div class="border rounded-lg overflow-hidden">
                <BaseTable
          empty-title="Data tidak ditemukan"
          empty-desc="Tidak ada data bank yang tersedia."
                  class="w-full text-sm"
                  :columns="bankColumns"
                  :data="infaqBanks"
                  :loading="isBankLoading"
                  :with-pagination="false"
                  :show-search="false"
                  :show-add="false"
                  :show-edit="false"
                  :show-delete="false"
                  :show-numbering="false"
                  :show-actions="false"
                >
                  <template #cell-bankName="{ row }">
                    {{ row.bankName }}
                  </template>
                  <template #cell-accountName="{ row }">
                    {{ row.accountName }}
                  </template>
                  <template #cell-accountNumber="{ row }">
                    {{ row.accountNumber }}
                  </template>
                  
                </BaseTable>
              </div>

              <!-- Informasi -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="flex">
                  <font-awesome-icon
                    icon="fa-solid fa-info-circle"
                    class="text-blue-500 mt-0.5 mr-2"
                  />
                  <div class="text-xs text-blue-800">
                    <p class="font-semibold mb-1">Informasi Penting:</p>
                    <ul class="list-disc list-inside space-y-1">
                      <li>Pastikan nominal yang ditransfer sesuai dengan yang tertera</li>
                      <li>Setelah melakukan transfer, klik tombol konfirmasi di bawah</li>
                      <li>Konfirmasi akan dikirim ke admin untuk diverifikasi</li>
                    </ul>
                  </div>
                </div>
              </div>
            </template>

            <!-- Tombol Aksi -->
            <div class="pt-2">
              <div
                v-if="
                  selectedInfaq?.status === 'success' ||
                  selectedInfaq?.konfirmasi_pembayaran === 'sudah_dikirim'
                "
                class="flex justify-end"
              >
                <BaseButton
                  @click="closeModal"
                  variant="secondary"
                  :disabled="isLoading"
                  class="w-full sm:w-auto"
                >
                  Tutup
                </BaseButton>
              </div>
              <div v-else class="flex justify-between gap-3">
                <BaseButton @click="closeModal" variant="secondary" :disabled="isLoading">
                  Batal
                </BaseButton>
                <BaseButton @click="handleConfirmPayment" variant="primary" :loading="isLoading">
                  {{ isLoading ? 'Mengirim...' : 'Konfirmasi Pembayaran' }}
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
