<script setup lang="ts">
// Library
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputText from '@/components/Form/InputText.vue';
import InputDate from '@/components/Form/InputDate.vue';
import SelectField from '@/components/Form/SelectField.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import {
  edit_keanggotaan,
  get_info_edit_keanggotaan,
  get_daftar_kecamatan,
  get_daftar_desa,
} from '@/service/daftar_keanggotaan';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  selectedKeanggotaan: any;
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
    tipeAkun: '',
    kecamatan_id: null,
    desa_id: null,
    fullname: '',
    username: '',
    nomor_ktp: '',
    nomor_kk: '',
    wa_number: '',
    alamat: '',
    birth_date: '',
    password: null,
    confirm_password: null,
  };
  errors.value = {};
};

// Function: Validate form
const errors = ref<Record<string, string>>({});

const validateForm = () => {
  const Error: Record<string, string> = {};

  if (!form.value.tipeAkun || form.value.tipeAkun === '') {
    Error.tipeAkun = 'Tipe Akun tidak boleh kosong.';
  }

  if (!form.value.fullname) {
    Error.fullname = 'Nama tidak boleh kosong.';
  }

  if (form.value.tipeAkun === 'instansi') {
    if (!form.value.kecamatan_id) {
      Error.kecamatan_id = 'Kecamatan tidak boleh kosong.';
    }
    if (!form.value.desa_id) {
      Error.desa_id = 'Desa tidak boleh kosong.';
    }
  } else if (form.value.tipeAkun === 'perorangan') {
    if (!form.value.nomor_ktp) {
      Error.nomor_ktp = 'Nomor KTP tidak boleh kosong.';
    }
    // if (!form.value.nomor_kk) {
    //   Error.nomor_kk = 'Nomor KK tidak boleh kosong.'
    // }
    if (!form.value.birth_date) {
      Error.birth_date = 'Tanggal Lahir tidak boleh kosong.';
    }
    if (!form.value.kecamatan_id) {
      Error.kecamatan_id = 'Kecamatan tidak boleh kosong.';
    }
    if (!form.value.desa_id) {
      Error.desa_id = 'Desa tidak boleh kosong.';
    }
  }

  if (!form.value.wa_number) {
    Error.wa_number = 'Nomor Whatsapp tidak boleh kosong.';
  }

  if (!form.value.alamat) {
    Error.alamat = 'Alamat tidak boleh kosong.';
  }

  if (!form.value.username) {
    Error.username = 'Username tidak boleh kosong.';
  }

  if (form.value.password !== form.value.confirm_password) {
    Error.confirm_password = 'Password tidak sama dengan Konfirmasi Password.';
  }

  errors.value = Error;

  console.log(errors.value);
  return Object.keys(Error).length === 0;
};

// State: Data Eksternal
const kecamatan = ref<{ id: string; name: string }[]>([]);
const desa = ref<{ id: string; name: string }[]>([]);

// State: Loading
const isLoading = ref(true);

// Function: Fetch Data
const fetchData = async () => {
  if (!props.selectedKeanggotaan || !props.selectedKeanggotaan.id) return;
  try {
    const response = await get_info_edit_keanggotaan(props.selectedKeanggotaan.id);
    form.value.tipeAkun = response.data.tipe;
    form.value.kecamatan_id = response.data.kecamatan_id;
    form.value.desa_id = response.data.desa_id;
    form.value.fullname = response.data.fullname;
    form.value.username = response.data.username;
    form.value.nomor_ktp = response.data.nomor_ktp;
    form.value.nomor_kk = response.data.nomor_kk;
    form.value.wa_number = response.data.whatsapp_number;
    form.value.alamat = response.data.alamat;
    form.value.birth_date = response.data.birth_date;

    const responseKecamatan = await get_daftar_kecamatan();
    kecamatan.value = responseKecamatan.data;
    console.log(response);
    console.log(responseKecamatan);
  } catch (error) {
    displayNotification('Gagal mengambil data keanggotaan', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{
  tipeAkun: string;
  kecamatan_id?: number | null;
  desa_id?: number | null;
  fullname: string;
  username: string;
  nomor_ktp: string;
  nomor_kk: string;
  wa_number: string;
  alamat: string;
  birth_date?: string;
  password?: string | null;
  confirm_password?: string | null;
}>({
  tipeAkun: '',
  kecamatan_id: null,
  desa_id: null,
  fullname: '',
  username: '',
  nomor_ktp: '',
  nomor_kk: '',
  wa_number: '',
  alamat: '',
  birth_date: '',
  password: null,
  confirm_password: null,
});

const handleSubmit = async () => {
  if (!validateForm()) return;

  console.log(form.value);

  const formData = JSON.parse(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(form.value).map(([key, value]) =>
          value === null ? [key, ''] : [key, value],
        ),
      ),
    ),
  );
  formData.id = props.selectedKeanggotaan.id;
  console.log(formData);

  isSubmitting.value = true;

  try {
    const response = await edit_keanggotaan(formData);
    console.log(response);
    emit('status', { error_msg: response.error_msg, error: response.error });
  } catch (error: any) {
    console.error(error);
    displayNotification(
      error.response.data.error_msg || error.response.data.message,
      'error',
      5000,
    );
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Function: Handle escape & Fetch Data
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(async () => {
  await fetchData();
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(async () => {
  await fetchData();
  document.removeEventListener('keydown', handleEscape);
});

// Watch: Data State
watch(
  () => props.selectedKeanggotaan,
  (val) => {
    console.log(val);
    if (props.isModalOpen && val?.id) fetchData();
  },
);

watch(
  () => form.value.kecamatan_id,
  async (val) => {
    if (!val) {
      form.value.desa_id = null;
      return;
    }
    isLoading.value = true;
    try {
      console.log(val);
      const response = await get_daftar_desa(val);
      console.log(response);
      desa.value = response.data;
    } catch (error) {
      console.error('Gagal fetch desa:', error);
    } finally {
      isLoading.value = false;
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
      <div v-else class="relative max-w-2xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-semibold text-gray-800">Edit Keanggotaan</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <div
          class="px-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto no-scrollbar"
        >
          <!-- Select tipeAkun akun -->
          <SelectField
            v-model="form.tipeAkun"
            id="tipeAkun"
            label="Tipe Akun"
            placeholder="Pilih Tipe Akun"
            :error="errors.tipeAkun"
            :options="[
              { id: '', name: '-- Pilih Tipe Akun --' }, // opsi default
              { id: 'instansi', name: 'Instansi' },
              { id: 'perorangan', name: 'Perorangan' },
            ]"
            class="md:col-span-2"
          />
          <!-- INSTANSI -->
          <template v-if="form.tipeAkun === 'instansi'">
            <InputText
              v-model="form.fullname"
              id="fullname"
              label="Nama Instansi / Organisasi"
              placeholder="Nama Instansi / Organisasi"
              :error="errors.fullname"
              :required="true"
              class="md:col-span-2"
            />
            <SelectField
              v-model="form.kecamatan_id"
              id="kecamatan_instansi"
              label="Kecamatan"
              placeholder="Pilih Kecamatan"
              :error="errors.kecamatan_id"
              :options="[{ id: null, name: '-- Pilih Kecamatan --' }, ...kecamatan]"
              :required="true"
            />
            <SelectField
              v-model="form.desa_id"
              id="desa_instansi"
              label="Desa"
              placeholder="Pilih Desa"
              :error="errors.desa_id"
              :options="[{ id: null, name: '-- Pilih Desa --' }, ...desa]"
              :required="true"
            />
          </template>
          <!-- PERORANGAN -->
          <template v-else-if="form.tipeAkun === 'perorangan'">
            <InputText
              v-model="form.fullname"
              id="fullname"
              label="Nama Lengkap"
              placeholder="Nama Lengkap"
              :error="errors.fullname"
              :required="true"
              class="md:col-span-2"
            />
            <InputText
              v-model="form.nomor_ktp"
              id="nomor_ktp"
              label="Nomor KTP"
              placeholder="Nomor KTP"
              :error="errors.nomor_ktp"
              :required="true"
            />
            <InputText
              v-model="form.nomor_kk"
              id="nomor_kk"
              label="Nomor KK"
              placeholder="Nomor KK"
              :error="errors.nomor_kk"
            />
            <InputDate
              v-model="form.birth_date"
              id="birth_date"
              label="Tanggal Lahir"
              placeholder="mm/dd/yyyy"
              :error="errors.birth_date"
              :required="true"
              class="md:col-span-2"
            />
            <SelectField
              v-model="form.kecamatan_id"
              id="kecamatan_instansi"
              label="Kecamatan"
              placeholder="Pilih Kecamatan"
              :error="errors.kecamatan_id"
              :options="[{ id: null, name: '-- Pilih Kecamatan --' }, ...kecamatan]"
              :required="true"
            />
            <SelectField
              v-model="form.desa_id"
              id="desa_instansi"
              label="Desa"
              placeholder="Pilih Desa"
              :error="errors.desa_id"
              :options="[{ id: null, name: '-- Pilih Desa --' }, ...desa]"
              :required="true"
            />
          </template>
          <!-- COMMON -->
          <InputText
            v-model="form.wa_number"
            id="wa_number"
            label="Nomor Whatsapp"
            placeholder="Nomor Whatsapp"
            :error="errors.wa_number"
            :required="true"
            class="md:col-span-2"
          />
          <InputText
            v-model="form.alamat"
            id="alamat"
            label="Alamat"
            placeholder="alamat"
            :error="errors.alamat"
            :required="true"
            class="md:col-span-2"
          />
          <InputText
            v-model="form.username"
            id="username"
            label="Username"
            placeholder="Username"
            :error="errors.username"
            :required="true"
            class="md:col-span-2"
          />
          <InputText
            v-model.trim="form.password"
            id="password"
            type="password"
            label="Password"
            placeholder="Password"
            :error="errors.password"
          />
          <InputText
            v-model.trim="form.confirm_password"
            id="confirm_password"
            type="password"
            label="Konfirmasi Password"
            placeholder="Konfirmasi Password"
            :error="errors.confirm_password"
          />
        </div>

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
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="
              !(
                form.tipeAkun &&
                form.wa_number &&
                form.kecamatan_id &&
                form.desa_id &&
                form.alamat &&
                form.username.trim() &&
                form.fullname.trim()
              ) || isSubmitting
            "
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan Perubahan </span>
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
