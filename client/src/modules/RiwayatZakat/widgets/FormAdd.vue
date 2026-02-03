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
import {
  list_member,
  list_desa,
  list_kecamatan,
  add_riwayat_zakat,
  list_wakalah,
} from '@/service/riwayat_zakat';
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

interface List {
  id: string;
  name: string;
}

const optionKecamatan = ref<List[]>([{ id: '0', name: '--- Pilih Kecamatan ---' }]);
const optionDesa = ref<List[]>([{ id: '0', name: '--- Pilih Desa ---' }]);
const optionMember = ref<List[]>([{ id: '0', name: '--- Pilih Muzakki ---' }]);
const optionWakalah = ref<List[]>([{ id: '0', name: '--- Pilih Wakalah ---' }]);

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Function: Reset form
const resetForm = () => {
  form.value = {
    member_id: 0,
    wakalah_id: 0,
    nominal: 0,
    tipe_zakat: '',
    tipe_pembayaran: '',
  };

  // Reset errors
  errors.value = {};

  optionKecamatan.value = [{ id: '0', name: '--- Pilih Kecamatan ---' }];
  optionDesa.value = [{ id: '0', name: '--- Pilih Desa ---' }];
  optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }];
  optionWakalah.value = [{ id: '0', name: '--- Pilih Wakalah ---' }];

  selectKecamatanId.value = 0;
  selectDesaId.value = 0;
};

// Function: Fetch data
const isLoading = ref(false);

const selectKecamatanId = ref(0);
const selectDesaId = ref(0);

async function fetchData() {
  isLoading.value = true;
  try {
    const response = await list_kecamatan();
    optionKecamatan.value = [{ id: '0', name: '--- Pilih Kecamatan ---' }, ...response.data];
  } catch (error) {
    displayNotification('Terjadi kesalahan saat memuat data.', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function fetchDesa() {
  try {
    const response = await list_desa({ kecamatan_id: selectKecamatanId.value });
    optionDesa.value = [{ id: '0', name: '--- Pilih Desa ---' }, ...response.data];
  } catch (error) {
    console.error(error);
  }
}

async function fetchMember() {
  try {
    const response = await list_member({ desa_id: selectDesaId.value });
    optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }, ...response.data];
    const response2 = await list_wakalah({ desa_id: selectDesaId.value });
    optionWakalah.value = [{ id: '0', name: '--- Pilih Wakalah ---' }, ...response2.data];
  } catch (error) {
    console.error(error);
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

  if (!form.value.tipe_zakat) {
    errors.value.tipe_zakat = 'Tipe Zakat wajib diisi.';
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
  member_id: number;
  wakalah_id: number;
  nominal: number;
  tipe_zakat: string;
  tipe_pembayaran: string;
}>({
  member_id: 0,
  wakalah_id: 0,
  nominal: 0,
  tipe_zakat: '',
  tipe_pembayaran: '',
});

const handleSubmit = async () => {
  isSubmitting.value = true;
  if (!validateForm()) return;

  const formData = {
    member_id: form.value.member_id,
    wakalah_id: form.value.wakalah_id,
    nominal: form.value.nominal,
    tipe_zakat: form.value.tipe_zakat,
    tipe_pembayaran: form.value.tipe_pembayaran,
  };

  // console.log(formData);

  try {
    const response = await add_riwayat_zakat(formData);
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

watch(
  () => selectKecamatanId.value,
  (val) => {
    if (val != 0) {
      fetchDesa();
    } else {
      selectDesaId.value = 0;
      form.value.member_id = 0;
      optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }];
      optionDesa.value = [{ id: '0', name: '--- Pilih Desa ---' }];
    }
  },
);

watch(
  () => selectDesaId.value,
  (val) => {
    if (val != 0) {
      fetchMember();
    } else {
      form.value.member_id = 0;
      optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }];
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
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Tambah Riwayat Zakat</h2>
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
            v-model="selectKecamatanId"
            id="kecamatan_id"
            label="Daftar Kecamatan"
            placeholder="Pilih Kecamatan"
            :options="optionKecamatan"
            :required="true"
          />
        </div>
        <div>
          <SelectField
            v-model="selectDesaId"
            id="desa_id"
            label="Daftar Desa"
            placeholder="Pilih Desa"
            :options="optionDesa"
            :required="true"
          />
        </div>
        <div>
          <SelectField
            v-model="form.member_id"
            id="member_id"
            label="Daftar Muzakki"
            placeholder="Pilih Muzakki"
            :options="optionMember"
            :required="true"
          />
        </div>
        <div>
          <SelectField
            v-model="form.wakalah_id"
            id="wakalah_id"
            label="Daftar Wakalah"
            placeholder="Pilih Wakalah"
            :options="optionWakalah"
          />
        </div>

        <div>
          <SelectField
            v-model="form.tipe_zakat"
            id="tipe_zakat"
            label="Tipe Zakat"
            :error="errors.tipe_zakat"
            :options="[
              { id: '', name: '-- Pilih Tipe Zakat --' },
              { id: 'zakat_harta', name: 'Zakat Harta' },
              { id: 'zakat_simpanan', name: 'Zakat Simpanan' },
              { id: 'zakat_profesi', name: 'Zakat Profesi' },
              { id: 'zakat_perdagangan', name: 'Zakat Perdagangan' },
              { id: 'zakat_pertanian', name: 'Zakat Pertanian' },
            ]"
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
            :disabled="
              !(form.member_id && form.nominal && form.tipe_zakat && form.tipe_pembayaran) ||
              isSubmitting
            "
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
