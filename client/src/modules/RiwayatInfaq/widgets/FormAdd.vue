<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputCurrency from '@/components/Form/InputCurrency.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { get_member, add_riwayat_infaq } from '@/service/riwayat_infaq';
import { list_wakalah } from '@/service/wakalah';
import SelectField from '@/components/Form/SelectField.vue';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Function: Reset form
const resetForm = () => {
  form.value = {
    member_id: null,
    nominal: 0,
    tipe_pembayaran: '',
    wakalah_id: null,
  };

  // Reset errors
  errors.value = {};
};

// Function: Fetch data
const isLoading = ref(false);
const optionsMember = ref([]);
const optionsWakalah = ref<any[]>([]);

async function fetchData() {
  isLoading.value = true;
  try {
    const responseMember = await get_member();
    const responseWakalah = await list_wakalah();

    optionsMember.value = responseMember.data;
    optionsWakalah.value = responseWakalah.data.map((w: any) => ({
      id: w.id,
      name: `${w.nama} - ${w.nik}`
    }));
  } catch (error) {
    displayNotification('Terjadi kesalahan saat memuat data.', 'error');
  } finally {
    isLoading.value = false;
  }
}

// Function:
const errors = ref<Record<string, string>>({
  name: '',
});

const validateForm = () => {
  let isValid = true;
  // Reset errors
  errors.value = {};

  if (!form.value.member_id) {
    errors.value.member_id = 'Member wajib diisi.';
    isValid = false;
  }

  if (!form.value.nominal) {
    errors.value.nominal = 'Nominal wajib diisi.';
    isValid = false;
  }

  if (!form.value.tipe_pembayaran) {
    errors.value.tipe_pembayaran = 'Tipe Pembayaran wajib diisi.';
    isValid = false;
  }

  console.log(errors.value);
  return isValid;
};

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{
  member_id: number | null;
  nominal: number;
  tipe_pembayaran: string;
  wakalah_id: number | null;
}>({
  member_id: null,
  nominal: 0,
  tipe_pembayaran: '',
  wakalah_id: null,
});

const handleSubmit = async () => {
  isSubmitting.value = true;
  if (!validateForm()) return;

  const formData = {
    member_id: form.value.member_id,
    nominal: form.value.nominal,
    tipe_pembayaran: form.value.tipe_pembayaran,
    wakalah_id: form.value.wakalah_id,
  };

  console.log(formData);

  try {
    const response = await add_riwayat_infaq(formData);
    emit('status', { error_msg: response.error_msg || response, error: response.error });
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Function: Handle escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(async () => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(async () => {
  document.removeEventListener('keydown', handleEscape);
});

watch(
  () => props.isModalOpen,
  (val) => {
    if (val) {
      fetchData();
    }
  },
);
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
      <div v-else class="relative max-w-xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Tambah Riwayat Infaq</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <div>
          <SelectField
            v-model="form.member_id"
            id="member_id"
            label="Daftar Munfiq"
            placeholder="Pilih Member"
            :error="errors.member_id"
            :options="[{ id: null, name: '-- Pilih Daftar Munfiq --' }, ...optionsMember]"
            :required="true"
          />
        </div>

        <div>
          <InputCurrency
            id="nominal"
            v-model="form.nominal"
            label="Nominal"
            placeholder="Masukkan nominal"
            :max="1_000_000_000"
            :note="`Maksimal ${$formatToRupiah(1000000000)}`"
            required
            :error="errors.jumlah_maksimal_nominal_bantuan"
          />
        </div>

        <!-- <div>
          <SelectField
            v-model="form.status_pemasukan"
            id="status_pemasukan"
            label="Status Pemasukan"
            placeholder="Pilih Bank"
            :error="errors.status_pemasukan"
            :options="[
              { id: '', name: '-- Pilih Status --' },
              { id: 'belum_dikirim', name: 'Belum Dikirim' },
              { id: 'sudah_dikirim', name: 'Sudah Dikirim' },
            ]"
            :required="true"
          />
        </div> -->
        <div>
          <SelectField
            v-model="form.tipe_pembayaran"
            id="tipe_pembayaran"
            label="Tipe Pembayaran"
            :error="errors.tipe_pembayaran"
            :options="[
              { id: '', name: '-- Pilih Tipe Pembayaran --' },
              { id: 'transfer', name: 'Transfer' },
              { id: 'cash', name: 'Cash' },
            ]"
            :required="true"
          />
        </div>

        <div>
          <SelectField
            v-model="form.wakalah_id"
            id="wakalah_id"
            label="Wakalah (Opsional)"
            placeholder="Pilih Wakalah"
            :error="errors.wakalah_id"
            :options="[{ id: null, name: '-- Tidak Menggunakan Wakalah --' }, ...optionsWakalah]"
            :required="false"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <BaseButton
            @click="closeModal"
            type="button"
            :disabled="isSubmitting"
            variant="secondary"
          >
            Batal
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="!(form.member_id && form.nominal && form.tipe_pembayaran) || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Notification -->
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>
