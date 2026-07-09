<script setup lang="ts">
import { ref, defineEmits, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import InputText from '@/components/Form/InputText.vue';
import { edit_profile_member, get_info_edit_profile_member } from '@/service/auth';

import { Fullname } from '@/stores/memberInfo';
const fullname = Fullname();

// Props dan Emit
const props = defineProps<{ formStatus: boolean }>();
const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submitted'): void;
  (e: 'notify', payload: { type: 'success' | 'error'; message: string }): void;
}>();

const isLoading = ref(false);

const timeoutId = ref<number | null>(null);
const showNotification = ref<boolean>(false);
const notificationMessage = ref<string>('');
const notificationType = ref<'success' | 'error'>('success');
const displayNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  if (timeoutId.value) clearTimeout(timeoutId.value);
  timeoutId.value = window.setTimeout(() => {
    showNotification.value = false;
  }, 3000);
};

// Data form
const form = ref({
  kode: '',
  tipe: '',
  fullname: '',
  nomor_ktp: '',
  nomor_kk: '',
  whatsapp_number: '',
  username: '',
  password: '',
  confirm_password: '',
});

const errors = ref<Record<string, string>>({
  fullname: '',
  username: '',
  password: '',
  confirm_password: '',
});

// Reset form
const resetForm = () => {
  form.value = {
    kode: '',
    tipe: '',
    fullname: '',
    nomor_ktp: '',
    nomor_kk: '',
    whatsapp_number: '',
    username: '',
    password: '',
    confirm_password: '',
  };
  errors.value = {};
};

// Tutup modal
const HideModal = () => {
  if (!isLoading.value) {
    resetForm();
    emit('cancel');
  }
};

// Ambil data profil member
async function fetchData() {
  isLoading.value = true;
  try {
    const res = await get_info_edit_profile_member();
    console.log(res);
    form.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

// Validasi form
const validateForm = () => {
  let valid = true;
  errors.value = {};

  if (!form.value.fullname) {
    errors.value.fullname = 'Nama lengkap wajib diisi';
    valid = false;
  }

  if (!form.value.username) {
    errors.value.username = 'Username wajib diisi';
    valid = false;
  }

  if (form.value.password && form.value.password !== form.value.confirm_password) {
    errors.value.confirm_password = 'Konfirmasi password tidak sesuai';
    valid = false;
  }

  return valid;
};

const logout = async () => {
  displayNotification('Proses logout berhasil dilakukan.', 'success');
  localStorage.removeItem('member_access_token');
  localStorage.removeItem('member_refresh_token');
  setTimeout(() => (window.location.href = '/'), 1200);
};

// Submit
const handleSubmit = async () => {
  if (!validateForm()) return;
  isLoading.value = true;
  const dataToSend = {
    kode: form.value.kode,
    tipe: form.value.tipe,
    fullname: form.value.fullname,
    nomor_ktp: form.value.nomor_ktp,
    nomor_kk: form.value.nomor_kk,
    whatsapp_number: form.value.whatsapp_number,
    username: form.value.username,
    password: form.value.password || '',
  };
  console.log(dataToSend);
  try {
    const res = await edit_profile_member(dataToSend);
    fullname.setString(form.value.fullname);
    console.log(res);
    emit('notify', { type: res.error ? 'error' : 'success', message: res.error_msg });
  } catch (error: any) {
    console.error(error);
    emit('notify', {
      type: 'error',
      message: error.response?.data?.message || 'Gagal mengubah profile',
    });
  } finally {
    emit('submitted');
    logout();
    isLoading.value = false;
  }
};

// Auto-fetch saat modal dibuka
watch(
  () => props.formStatus,
  (val) => {
    if (val) fetchData();
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
    <Teleport to="body">
      <div
        v-if="props.formStatus"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="HideModal"
      >
        <LoadingSpinner v-if="isLoading" label="Memuat data profil..." />
        <div v-else class="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Edit Profil Member</h3>
            <button @click="HideModal" class="text-gray-400 hover:text-gray-600 transition-colors">
              <font-awesome-icon icon="fa-solid fa-xmark" class="w-6 h-6" />
            </button>
          </div>

          <div class="p-6">
            <div>
              <!-- Hanya tampilan (readonly) -->
              <div class="grid grid-cols-2 gap-4 mb-4">
                <InputText id="kode" v-model="form.kode" label="Kode" :disabled="true" />
                <InputText id="tipe" v-model="form.tipe" label="Tipe Akun" :disabled="true" />
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <InputText
                  id="nomor_ktp"
                  v-model="form.nomor_ktp"
                  label="Nomor KTP"
                  :disabled="true"
                />
                <InputText
                  id="nomor_kk"
                  v-model="form.nomor_kk"
                  label="Nomor KK"
                  :disabled="true"
                />
              </div>

              <InputText
                id="whatsapp_number"
                v-model="form.whatsapp_number"
                label="Nomor WhatsApp"
                :disabled="true"
                class="mb-4"
              />

              <!-- Yang bisa diedit -->
              <InputText
                id="fullname"
                v-model="form.fullname"
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                :error="errors.fullname"
                class="mb-4"
              />

              <InputText
                id="username"
                v-model="form.username"
                label="Username"
                placeholder="Masukkan username"
                :error="errors.username"
                class="mb-4"
              />

              <div class="grid grid-cols-2 gap-4 mb-4">
                <InputText
                  id="password"
                  v-model="form.password"
                  type="password"
                  label="Password"
                  placeholder="Masukkan password baru"
                />
                <InputText
                  id="confirm_password"
                  v-model="form.confirm_password"
                  type="password"
                  label="Konfirmasi Password"
                  placeholder="Ulangi password"
                  :error="errors.confirm_password"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              @click="HideModal"
              :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Batal
            </button>
            <button
              @click="handleSubmit"
              :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-md hover:bg-green-800 flex items-center gap-2 transition-colors"
            >
              <svg
                v-if="isLoading"
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isLoading ? 'Menyimpan...' : 'Perbaharui Profil' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </Transition>
</template>
