<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import { useNotification } from '@/composables/useNotification';
import { add_wakalah } from '@/service/wakalah';
import { get_desa, get_kecamatan } from '@/service/desa';

const { showNotification, notificationType, notificationMessage, displayNotification } = useNotification();

interface Props {
  isModalOpen: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

const resetForm = () => {
  form.value.nama = '';
  form.value.nik = '';
  form.value.desa_id = null;
  errors.value = {};
};

const errors = ref<Record<string, string>>({});
const validateForm = () => {
  let isValid = true;
  errors.value = {};
  if (!form.value.nama) { errors.value.nama = 'Nama wajib diisi.'; isValid = false; }
  if (!form.value.nik) { errors.value.nik = 'NIK wajib diisi.'; isValid = false; }
  if (!form.value.desa_id) { errors.value.desa_id = 'Desa wajib dipilih.'; isValid = false; }
  return isValid;
};

const isSubmitting = ref(false);
const form = ref<{ nama: string; nik: string; desa_id: number | null }>({
  nama: '',
  nik: '',
  kecamatan_id: null,
  desa_id: null,
});

const handleSubmit = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;
  try {
    const response = await add_wakalah(form.value);
    emit('status', { error_msg: response.error_msg, error: response.error });
    isSubmitting.value = false;
    closeModal();
  } catch (error: any) {
    displayNotification(error.response?.data?.error_msg || error.message, 'error');
    isSubmitting.value = false;
  }
};

const optionsKecamatan = ref([]);
const fetchKecamatan = async () => {
  try {
    const response = await get_kecamatan();
    optionsKecamatan.value = response.data.map((item: any) => ({
      id: item.id,
      name: item.name
    }));
  } catch (error) {
    displayNotification('Gagal memuat kecamatan', 'error');
  }
};

const optionsDesa = ref([]);
const fetchDesa = async (kecamatan_id: number | null) => {
  if (!kecamatan_id) {
    optionsDesa.value = [];
    return;
  }
  try {
    const response = await get_desa({ perpage: 9999, pageNumber: 1, search: "", kecamatan_id: kecamatan_id });
    optionsDesa.value = response.data.map((item: any) => ({
      id: item.id,
      name: item.name
    }));
  } catch (error) {
    displayNotification('Gagal memuat desa', 'error');
  }
};

watch(() => form.value.kecamatan_id, (newVal) => {
  form.value.desa_id = null;
  fetchDesa(newVal);
});

const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && props.isModalOpen) closeModal(); };
onMounted(() => { document.addEventListener('keydown', handleEscape); });
onBeforeUnmount(() => { document.removeEventListener('keydown', handleEscape); });

watch(() => props.isModalOpen, (val) => {
  if (val) {
    fetchKecamatan();
    if (form.value.kecamatan_id) fetchDesa(form.value.kecamatan_id);
  }
});
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
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog">
      <div class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-800">Tambah Wakalah</h2>
          <button class="text-gray-400 text-lg hover:text-gray-600" @click="closeModal">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <InputText id="nama" v-model="form.nama" label="Nama" placeholder="Masukkan nama wakalah" :error="errors.nama" />
        <InputText id="nik" v-model="form.nik" label="NIK" placeholder="Masukkan NIK" :error="errors.nik" />
        <SelectField
          v-model="form.kecamatan_id"
          id="kecamatan_id"
          label="Kecamatan"
          :error="errors.kecamatan_id"
          :options="[{ id: null, name: '-- Pilih Kecamatan --' }, ...optionsKecamatan]"
        />
        <SelectField
          v-model="form.desa_id"
          id="desa_id"
          label="Desa"
          :error="errors.desa_id"
          :options="[{ id: null, name: '-- Pilih Desa --' }, ...optionsDesa]"
          :disabled="!form.kecamatan_id"
        />
        <div class="flex justify-end gap-3">
          <BaseButton @click="closeModal" type="button" :disabled="isSubmitting" variant="secondary">Batal</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="!(form.nama && form.nik && form.desa_id) || isSubmitting" @click="handleSubmit">
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
  <Notification :showNotification="showNotification" :notificationType="notificationType" :notificationMessage="notificationMessage" @close="showNotification = false" />
</template>
