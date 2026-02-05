<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import {
  list_desa,
  list_kecamatan,
  get_info_edit,
  add_wakalah,
  update_wakalah,
} from '@/service/wakalah';

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Props
interface Props {
  isModalOpen: boolean;
  id: number;
}
const props = defineProps<Props>();

const isLoading = ref(false);

// Emit
const emit = defineEmits<{
  (e: 'close'): void;
}>();

interface List {
  id: number;
  name: string;
}

const optionKecamatan = ref<List[]>([{ id: 0, name: '--- Pilih Kecamatan ---' }]);
const optionDesa = ref<List[]>([{ id: 0, name: '--- Pilih Desa ---' }]);
// const selectKecamatanId = ref(0);

// State
const isSubmitting = ref(false);

const form = ref<{
  kecamatan_id: number;
  desa_id: number;
  fullname: string;
  jabatan: string;
  whatsapp_number: string;
}>({
  kecamatan_id: 0,
  desa_id: 0,
  fullname: '',
  jabatan: '',
  whatsapp_number: '',
});

const errors = ref<Record<string, string>>({});

// Reset form
const resetForm = () => {
  form.value = { kecamatan_id: 0, desa_id: 0, fullname: '', jabatan: '', whatsapp_number: '' };
  errors.value = {};
  optionKecamatan.value = [{ id: 0, name: '--- Pilih Kecamatan ---' }];
  optionDesa.value = [{ id: 0, name: '--- Pilih Desa ---' }];
  // selectKecamatanId.value = 0;
};

async function fetchKecamatan() {
  isLoading.value = true;
  try {
    const response = await list_kecamatan();
    optionKecamatan.value = [{ id: 0, name: '--- Pilih Kecamatan ---' }, ...response.data];
  } catch (error) {
    displayNotification('Terjadi kesalahan saat memuat data.', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function fetchDesa() {
  isLoading.value = true;
  try {
    const response = await list_desa({ kecamatan_id: form.value.kecamatan_id });
    optionDesa.value = [{ id: 0, name: '--- Pilih Desa ---' }, ...response.data];
  } catch (error) {
    displayNotification('Terjadi kesalahan saat memuat data.', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function fetchData() {
  isLoading.value = true;
  try {
    if (props.id != 0) {
      const response = await get_info_edit({ id: props.id });
      optionKecamatan.value = [{ id: 0, name: '--- Pilih Kecamatan ---' }, ...response.kecamatan];
      optionDesa.value = [{ id: 0, name: '--- Pilih Desa ---' }, ...response.desa];
      form.value = response.data;
    } else {
      await fetchKecamatan();
    }
  } catch (error) {
    displayNotification('Terjadi kesalahan saat memuat data.', 'error');
  } finally {
    isLoading.value = false;
  }
}

const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!form.value.fullname) {
    errors.value.fullname = 'Nama wakalah wajib diisi.';
    isValid = false;
  }

  if (form.value.desa_id == 0) {
    errors.value.desa = 'Anda wajib memilih salah satu desa.';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  isSubmitting.value = true;
  if (!validateForm()) return;

  const payload = {
    desa_id: form.value.desa_id,
    fullname: form.value.fullname,
    jabatan: form.value.jabatan,
    whatsapp_number: form.value.whatsapp_number,
  };

  try {
    if (props.id != 0) {
      await update_wakalah({ ...payload, ...{ ['id']: props.id } });
    } else {
      await add_wakalah(payload);
    }
    displayNotification(
      props.id != 0
        ? 'Proses update data wakalah berhasil dilakukan'
        : 'Proses menambahkan wakalah baru berhasil dilakukan',
      'success',
    );
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

watch(
  () => props.isModalOpen,
  async (newVal) => {
    await fetchData();
  },
);

watch(
  () => form.value.kecamatan_id,
  async (val) => {
    if (val != 0) {
      await fetchDesa();
      if (!optionDesa.value.some((item) => item.id === form.value.desa_id)) {
        form.value.desa_id = 0;
      }
    } else {
      form.value.desa_id = 0;
      optionDesa.value = [{ id: 0, name: '--- Pilih Desa ---' }];
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
    >
      <LoadingSpinner v-if="isSubmitting" label="Menyimpan..." />
      <div v-else class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">
            {{ id != 0 ? 'UPDATE WAKALAH' : 'TAMBAH WAKALAH' }}
          </h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Daftar Kecamatan -->
        <div>
          <SelectField
            v-model="form.kecamatan_id"
            id="kecamatan_id"
            label="Daftar Kecamatan"
            placeholder="Pilih Kecamatan"
            :options="optionKecamatan"
            :required="true"
          />
        </div>

        <!-- Daftar Desa -->
        <div>
          <SelectField
            v-model="form.desa_id"
            id="desa_id"
            label="Daftar Desa"
            placeholder="Pilih Desa"
            :options="optionDesa"
            :error="errors.desa"
            :required="true"
          />
        </div>

        <!-- Nama Lengkap -->
        <InputText
          v-model="form.fullname"
          label="Nama Lengkap Wakalah"
          type="text"
          placeholder="Masukkan nama dari wakalah"
          :error="errors.fullname"
          :required="true"
        />

        <!-- Jabatan -->
        <InputText
          v-model="form.jabatan"
          label="Jabatan Wakalah"
          type="text"
          placeholder="Masukkan jabatan dari wakalah"
          :error="errors.jabatan"
        />

        <!-- Nomor Whatsapp Wakalah -->
        <InputText
          v-model="form.whatsapp_number"
          label="Nomor Whatsapp Wakalah"
          type="text"
          placeholder="Masukkan nomor whatsapp wakalah"
          :error="errors.whatsapp_number"
        />

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-4">
          <BaseButton
            @click="closeModal"
            type="button"
            :disabled="isSubmitting"
            variant="secondary"
          >
            Batal
          </BaseButton>
          <!-- desa_id: 0,
  fullname: '',
  jabatan: '',
  whatsapp_number: '', -->
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="
              !(
                form.kecamatan_id != 0 &&
                form.fullname &&
                form.jabatan &&
                form.whatsapp_number &&
                form.desa_id != 0
              ) || isSubmitting
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
