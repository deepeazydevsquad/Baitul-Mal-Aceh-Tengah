<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import axios from 'axios';
import { API_URL } from '@/config/config';

interface FormData {
  username: string;
  password: string;
}

const form = ref<FormData>({
  username: '',
  password: '',
});

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

const errors = ref<Record<string, string>>({});

const validateForm = (): boolean => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  if (form.value.username === '') {
    errors.value.username = 'Username tidak boleh kosong.';
    isValid = false;
  }

  if (form.value.password === '') {
    errors.value.password = 'Password tidak boleh kosong.';
    isValid = false;
  }

  return isValid;
};

const LoginProcess = async () => {
  if (!validateForm()) {
    const message = Object.values(errors.value).join('\n');
    displayNotification(message, 'error');
    return;
  }

  try {
    const baseUrl = API_URL;
    const response = await axios.post(baseUrl + '/auth/login_member', {
      username: form.value.username,
      password: form.value.password,
    });
    // filter
    if (response.status === 200) {
      localStorage.setItem('member_access_token', response.data.access_token);
      localStorage.setItem('member_refresh_token', response.data.refresh_token);
      displayNotification(response.data.message, 'success');
      setTimeout(() => {
        window.location.href = '/member-area';
      }, 1200);
    } else {
      displayNotification(error.response.data.message, 'error');
    }
  } catch (error) {
    displayNotification(error.response.data.message, 'error');
  }
};

const lupaPassword = async () => {
  displayNotification(
    'Lupa password? Silakan hubungi administrator untuk reset akun Anda..',
    'error',
  );
};

onMounted(() => {
  localStorage.removeItem('member_access_token');
  localStorage.removeItem('member_refresh_token');

  console.log('Tokens cleared on mount------------------');
});
</script>
<template>
  <div class="h-screen h-screen-not-full flex">
    <!-- Left Column -->
    <div class="bg-left hidden lg:flex w-full lg:w-1/2 px-[75px] items-center justify-center">
      <div class="pt-8 inline-flex flex-col justify-start items-start gap-8">
        <div class="self-stretch flex flex-col justify-start items-start gap-3">
          <div class="justify-start text-neutral-800 text-xl font-medium tracking-tight">
            Selamat Datang di
          </div>
          <img class="w-96 h-32" src="/images/ziwah.png" />
          <div
            class="self-stretch justify-start text-yellow-500 text-[52px] leading-[120%] font-bold tracking-wide"
          >
            Kabupaten Bener Meriah
          </div>
        </div>
        <div class="w-96 flex flex-col justify-start items-start gap-4">
          <div
            class="self-stretch justify-start text-neutral-800 text-base font-normal tracking-tight"
          >
            Ayo, kita cari tahu bersama program-program bantuan apa saja yang sedang tersedia di
            Baitul Mal Kabupaten Bener Meriah.
          </div>
        </div>
      </div>
    </div>
    <!-- Right Column -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6">
      <div class="w-full max-w-md">
        <form
          class="bg-white rounded-lg shadow-md px-8 pt-6 pb-8 mb-4 mt-8 lg:mt-0"
          @submit.prevent="LoginProcess"
        >
          <div
            class="text-center justify-center text-green-900 text-xl font-bold capitalize leading-loose tracking-tight mb-[32px]"
          >
            login area member
          </div>
          <div>
            <div class="mb-4">
              <label class="block text-gray-700 text-sm mb-2" for="usernameMember">Username</label>
              <input
                v-model="form.username"
                class="border border-gray-200 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:border-green-900 focus:ring-green-900"
                id="usernameMember"
                type="text"
                placeholder="Masukkan username anda"
              />
            </div>
            <div class="mb-8">
              <div class="flex justify-between mb-2">
                <label class="block text-gray-700 text-sm" for="password"> Password </label>
                <a class="text-green-900 text-sm font-semibold leading-tight" @click="lupaPassword"
                  >Lupa Password?</a
                >
              </div>
              <input
                v-model="form.password"
                class="border border-gray-200 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:border-green-900 focus:ring-green-900"
                id="password"
                type="password"
                placeholder="Masukkan password anda"
              />
            </div>
            <!-- <div class="flex mb-4">
              <input type="checkbox" class="shrink-0 mt-0.5 border-gray-200 rounded-sm text-blue-600 focus:ring-green-900 checked:border-green-900 disabled:opacity-50 disabled:pointer-events-none"
                id="hs-default-checkbox"/>
              <label for="hs-default-checkbox" class="text-sm text-gray-500 ms-3">Ingat Saya</label>
            </div> -->
            <div class="flex flex-col items-center justify-between gap-3">
              <button
                class="w-full bg-[#0E561E] text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Masuk
              </button>
              <div class="w-64 h-5 text-center justify-center">
                <span class="text-gray-600 text-sm font-normal leading-tight"
                  >Belum punya akun?</span
                >
                <a
                  href="/registrasi"
                  class="text-green-900 text-sm font-semibold leading-tight hover:underline"
                >
                  Daftar disini</a
                >
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  ></Notification>
</template>
