<script setup lang="ts">
import { ref, watch, reactive, computed } from 'vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import { getMemberProfile, getDonasiBanks, add, kode_pembayaran } from '@/service/donasi_member';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

const props = defineProps<{
  isModalOpen: boolean;
  selected_donasi: number;
}>();

const emit = defineEmits(['close', 'save', 'status']);
// State untuk mengontrol langkah-langkah form
const currentStep = ref(1); // 1: Nominal, 2: Biodata, 3: Pembayaran
const isLoading = ref(false);
const isProfileLoading = ref(false);
const isBankLoading = ref(false);

// Interface dan state untuk daftar bank
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

// State untuk menyimpan invoice yang di-generate
const generatedInvoice = ref('');

const formData = ref({
  program_donasi_id: props.selected_donasi,
  nominal: null as number | null,
  namaMember: '',
  nomorKTP: '',
  nomorWhatsapp: '',
});

const serverErrors = reactive({
  nominal: '',
  general: '',
});

const kodePembayaran = ref(0); // default value 3 digit juga biar konsisten

const generateKodePembayaran = async () => {
  try {
    const res = await kode_pembayaran(); // panggil helper yang tadi kita buat
    kodePembayaran.value = res;
  } catch (error) {
    console.error('Gagal generate kode pembayaran:', error);
  }
};

// Fungsi untuk generate invoice
const generateInvoice = () => {
  const prefix = 'DONASI';
  const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomSuffix}`;
};

// Fungsi untuk mengambil data profil member
const fetchMemberProfile = async () => {
  isProfileLoading.value = true;
  try {
    const response = await getMemberProfile();
    if (response && response.data) {
      formData.value.namaMember = response.data.fullname;
      formData.value.nomorKTP = response.data.nomor_ktp;
      formData.value.nomorWhatsapp = response.data.whatsapp_number;
    }
  } catch (error: any) {
    emit('status', {
      error: true,
      error_msg: error.response?.data?.message || 'Gagal memuat data profil member.',
    });
  } finally {
    isProfileLoading.value = false;
  }
};

// Fungsi untuk mengambil data bank
const fetchBanks = async () => {
  isBankLoading.value = true;
  try {
    const response = await getDonasiBanks();
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
      generateKodePembayaran();
      resetForm();
      fetchMemberProfile();
      fetchBanks();
    }
  },
);

// Fungsi untuk pindah ke langkah berikutnya
const nextStep = () => {
  if (currentStep.value === 1) {
    if (!formData.value.nominal || formData.value.nominal <= 0) {
      serverErrors.nominal = 'Jumlah infaq harus diisi dan lebih dari 0.';
      return;
    }
    serverErrors.nominal = '';
  }

  if (currentStep.value === 2) {
    generatedInvoice.value = generateInvoice();
  }

  currentStep.value++;
};

// Fungsi untuk kembali ke langkah sebelumnya
const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleConfirmPayment = async () => {
  isLoading.value = true;
  try {
    await add({
      nominal: formData.value.nominal,
      invoice: generatedInvoice.value,
      program_donasi_id: props.selected_donasi,
      kode: kodePembayaran.value,
    });

    emit('status', {
      error: false,
      error_msg:
        'Pembayaran Donasi berhasil dicatat, Silahkan konfirmasi pembayaran dengan menekan tombol kuning.',
    });
    emit('close');
  } catch (error: any) {
    serverErrors.general =
      error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.';
    emit('status', { error: true, error_msg: serverErrors.general });
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  if (isLoading.value) return;
  emit('close');
};

const resetForm = () => {
  currentStep.value = 1;
  formData.value = {
    program_donasi_id: props.selected_donasi,
    nominal: null,
    namaMember: '',
    nomorKTP: '',
    nomorWhatsapp: '',
  };
  infaqBanks.value = [];
  generatedInvoice.value = '';
  serverErrors.nominal = '';
  serverErrors.general = '';
  isLoading.value = false;
};

const totalPembayaran = computed(() => {
  if (!formData.value.nominal) return 0;
  const nominal = formData.value.nominal;
  const kode = Number(kodePembayaran.value) || 0;
  return nominal - (nominal % 1000) + kode; // gabung kode ke 3 digit terakhir
});

// Format input nominal menjadi format angka
const formatNominal = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value.replace(/\D/g, '');
  formData.value.nominal = value ? parseInt(value, 10) : null;
  if (value) {
    input.value = parseInt(value, 10).toLocaleString('id-ID');
  } else {
    input.value = '';
  }
};
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
              <span v-if="currentStep === 1">Pembayaran Donasi</span>
              <span v-if="currentStep === 2">Detail Pembayaran</span>
              <span v-if="currentStep === 3">Status Pembayaran</span>
            </h2>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600"
              :disabled="isLoading"
            >
              <font-awesome-icon icon="fa-solid fa-times" />
            </button>
          </div>

          <!-- Input Nominal -->
          <div v-if="currentStep === 1" class="space-y-6">
            <div class="text-center bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600 italic">
                “Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti sebutir biji
                yang menumbuhkan tujuh tangkai; pada setiap tangkai ada seratus biji. Allah
                melipatgandakan bagi siapa yang Dia kehendaki. Dan Allah Maha Luas (karunia-Nya)
                lagi Maha Mengetahui.”
              </p>
              <p class="text-xs font-semibold text-gray-700 mt-2">📖 (QS. Al-Baqarah: 261)</p>
            </div>
            <div>
              <label for="jumlahInfaq" class="block text-sm font-medium text-gray-700 mb-1"
                >Jumlah Donasi Anda</label
              >
              <div class="relative mt-1 rounded-md shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span class="text-gray-500 sm:text-sm">Rp</span>
                </div>
                <input
                  id="jumlahInfaq"
                  type="text"
                  @input="formatNominal"
                  placeholder="0"
                  class="block w-full rounded-md py-2 pl-8 pr-3 sm:text-sm focus:border-green-500 focus:ring-green-500"
                  :class="serverErrors.nominal ? 'border-red-500' : 'border-gray-300'"
                />
              </div>
              <p v-if="serverErrors.nominal" class="mt-1 text-xs text-red-600">
                {{ serverErrors.nominal }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                Silahkan masukkan jumlah donasi yang ingin anda bayar disini.
              </p>
            </div>
            <BaseButton @click="nextStep" variant="primary" class="w-full"
              >Bayar donasi Sekarang</BaseButton
            >
          </div>

          <!-- Biodata -->
          <div v-if="currentStep === 2" class="space-y-4">
            <div v-if="isProfileLoading" class="text-center p-8">
              <LoadingSpinner label="Memuat data member..." />
            </div>
            <div v-else class="space-y-4">
              <div class="bg-gray-50 p-3 rounded-lg">
                <label class="block text-xs font-medium text-gray-500">Nominal Donasi</label>
                <p class="text-lg font-bold text-gray-800">
                  Rp {{ formData.nominal?.toLocaleString('id-ID') ?? '0' }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Nama Member</label>
                <input
                  type="text"
                  :value="formData.namaMember"
                  class="w-full bg-gray-100 border-gray-300 rounded-md p-2 mt-1"
                  readonly
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Nomor KTP</label>
                <input
                  type="text"
                  :value="formData.nomorKTP"
                  class="w-full bg-gray-100 border-gray-300 rounded-md p-2 mt-1"
                  readonly
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Nomor Whatsapp</label>
                <input
                  type="text"
                  :value="formData.nomorWhatsapp"
                  class="w-full bg-gray-100 border-gray-300 rounded-md p-2 mt-1"
                  readonly
                />
              </div>
              <div class="flex justify-between gap-3 pt-4">
                <BaseButton @click="prevStep" variant="secondary">Kembali</BaseButton>
                <BaseButton @click="nextStep" variant="primary">Lanjut Pembayaran</BaseButton>
              </div>
            </div>
          </div>

          <!-- Status Pembayaran -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="bg-gray-50 p-4 rounded-lg text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Tanggal Transaksi:</span>
                <span class="font-medium text-gray-800">{{
                  new Date().toLocaleString('id-ID')
                }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-gray-600">Invoice Donasi:</span>
                <span class="font-bold text-green-700">{{ generatedInvoice }}</span>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-gray-600">Status Pembayaran:</span>
                <span class="font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full"
                  >Proses</span
                >
              </div>
            </div>
            <div class="text-center">
              <p class="text-gray-700">
                Silakan lakukan pembayaran Donasi anda sebesar
                <strong class="text-lg">Rp {{ totalPembayaran.toLocaleString('id-ID') }}</strong>
                ke nomor rekening di bawah ini.
              </p>
            </div>
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
            <div class="flex justify-between gap-3 pt-2">
              <BaseButton @click="prevStep" variant="secondary">Kembali</BaseButton>
              <BaseButton @click="handleConfirmPayment" variant="primary" :loading="isLoading">
                {{ isLoading ? 'Memproses...' : 'Simpan & Lanjutkan' }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
