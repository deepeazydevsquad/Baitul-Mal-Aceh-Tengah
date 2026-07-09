<script setup lang="ts">
import { ref, defineEmits, watch } from 'vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import InputText from '@/components/Form/InputText.vue';

import { SettingStore } from '@/stores/settings';
import { edit_profile, get_info_edit_profile } from '@/service/auth';

// State: Loading
const isLoading = ref(false);

const props = defineProps<{
  formStatus: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'submitted'): void;
  (e: 'notify', payload: { type: string; message: string }): void;
}>();

const SettingGlob = SettingStore();

// Function: Reset form
const resetForm = () => {
  form.value = {
    name: '',
    jabatan: '',
    username: '',
    password: '',
    password_confirmation: '',
  };

  errors.value = {};
};

// Function: Hide confirmation
const HideModal = () => {
  if (!isLoading.value) {
    resetForm();
    emit('cancel');
  }
};

// Function: Fetch data
async function fetchData() {
  isLoading.value = true;

  try {
    const response = await get_info_edit_profile();
    form.value = response.data;
    console.log(response);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

// Function: Validate form
const errors = ref<Record<string, string>>({
  name: '',
  username: '',
  password: '',
  password_confirmation: '',
});

const validateForm = () => {
  let isValid = true;

  if (!form.value.name) {
    errors.value.name = 'Nama tidak boleh kosong';
    isValid = false;
  }

  if (!form.value.jabatan) {
    errors.value.jabatan = 'Jabatan tidak boleh kosong';
    isValid = false;
  }

  if (!form.value.username) {
    errors.value.username = 'Username tidak boleh kosong';
    isValid = false;
  }

  if (form.value.password_) {
    errors.value.password_confirmation = 'Konfirmasi password tidak boleh kosong';
    isValid = false;
  }

  if (form.value.password && form.value.password_confirmation) {
    if (form.value.password !== form.value.password_confirmation) {
      errors.value.password_confirmation = 'Password tidak sama';
      isValid = false;
    }
  }

  console.log(errors.value);
  return isValid;
};

// Function: Handle submit
const form = ref<Record<string, string>>({
  name: '',
  jabatan: '',
  username: '',
  password: '',
  password_confirmation: '',
});

const handleSubmit = async () => {
  console.log('Siknetut');
  console.log(form.value);
  if (!validateForm()) return;

  isLoading.value = true;
  try {
    console.log(form.value);
    await edit_profile(form.value);

    SettingGlob.addItem('name', form.value.name);
    emit('notify', { type: 'success', message: 'Berhasil mengubah profile' });
  } catch (error: any) {
    emit('notify', {
      type: 'error',
      message: error.response?.data?.message || 'Gagal mengubah profile',
    });
    console.error(error);
  } finally {
    emit('submitted');
    isLoading.value = false;
    // HideModal()
  }
};

watch(
  () => props.formStatus,
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
    <Teleport to="body">
      <div
        v-if="props.formStatus"
        class="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-[99999]"
        @click.self="HideModal"
      >
        <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
        <div v-else class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Update Profile</h3>
            <button @click="HideModal" class="text-gray-400 hover:text-gray-600 transition-colors">
              <font-awesome-icon icon="fa-solid fa-xmark" class="w-6 h-6" />
            </button>
          </div>

          <div class="p-6">
            <form @submit.prevent="handleSubmit">
              <div class="mb-4">
                <InputText
                  id="name"
                  v-model="form.name"
                  label="Name"
                  placeholder="Masukkan nama"
                  :error="errors.name"
                />
              </div>
              <div class="mb-4">
                <InputText
                  id="jabatan"
                  v-model="form.jabatan"
                  label="Jabatan"
                  placeholder="Masukkan jabatan"
                  :error="errors.jabatan"
                />
              </div>
              <div class="mb-4">
                <InputText
                  id="username"
                  v-model="form.username"
                  label="Username"
                  placeholder="Masukkan username"
                  :error="errors.username"
                />
              </div>
              <div class="mb-4">
                <InputText
                  id="password"
                  v-model="form.password"
                  type="password"
                  label="Password"
                  placeholder="Masukkan password"
                  :error="errors.password"
                />
              </div>
              <div class="mb-4">
                <InputText
                  id="password_confirmation"
                  v-model="form.password_confirmation"
                  type="password"
                  label="Password Confirmation"
                  placeholder="Ulangi password"
                  :error="errors.password_confirmation"
                />
              </div>
            </form>
          </div>

          <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              @click="HideModal"
              :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Batal
            </button>
            <button
              @click="handleSubmit"
              :disabled="isLoading"
              class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
              {{ isLoading ? 'Loading...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </Transition>
</template>
