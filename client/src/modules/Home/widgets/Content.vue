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
          <img class="w-96 h-auto object-contain" src="/images/ziwah.png" />
          <div
            class="self-stretch justify-start text-yellow-500 text-[52px] leading-[120%] font-bold tracking-wide"
          >
            Kabupaten Aceh Tengah
          </div>
        </div>
        <div class="w-96 flex flex-col justify-start items-start gap-4">
          <div
            class="self-stretch justify-start text-neutral-800 text-base font-normal tracking-tight"
          >
            Ayo, kita cari tahu bersama program-program bantuan apa saja yang sedang tersedia di
            Baitul Mal Kabupaten Aceh Tengah.
          </div>
        </div>
      </div>
    </div>
    <!-- Right Column -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      <div class="w-full max-w-md z-10 flex flex-col gap-6">
        
        <!-- Header Section -->
        <div class="text-center space-y-3 mt-8 lg:mt-0">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0E561E]/10 text-[#0E561E] mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 class="text-3xl font-bold text-gray-900 tracking-tight">Login Member</h2>
          <p class="text-sm text-gray-500 px-4 leading-relaxed">
            Masuk ke portal member untuk mengakses, mengajukan, dan memantau layanan bantuan dari Baitul Mal.
          </p>
        </div>

        <!-- Information Callout -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div class="mt-0.5 bg-blue-100 p-1 rounded-full text-blue-600 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <p class="text-xs text-blue-800 leading-relaxed">
            <span class="font-semibold block mb-0.5 text-blue-900">Informasi Pengguna</span>
            Pastikan Anda menjaga kerahasiaan password. Jika Anda belum memiliki akun, silakan mendaftar terlebih dahulu.
          </p>
        </div>

        <!-- Login Form -->
        <form
          class="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8"
          @submit.prevent="LoginProcess"
        >
          <div class="space-y-5">
            <div>
              <label class="block text-gray-700 text-sm font-medium mb-2" for="usernameMember">Username</label>
              <input
                v-model="form.username"
                class="border border-gray-200 rounded-lg w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:border-[#0E561E] focus:ring-1 focus:ring-[#0E561E] transition-colors"
                id="usernameMember"
                type="text"
                placeholder="Masukkan username anda"
              />
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <label class="block text-gray-700 text-sm font-medium" for="password">Password</label>
                <a class="text-[#0E561E] text-sm font-semibold leading-tight hover:underline cursor-pointer" @click="lupaPassword"
                  >Lupa Password?</a
                >
              </div>
              <input
                v-model="form.password"
                class="border border-gray-200 rounded-lg w-full py-2.5 px-4 text-gray-700 leading-tight focus:outline-none focus:border-[#0E561E] focus:ring-1 focus:ring-[#0E561E] transition-colors"
                id="password"
                type="password"
                placeholder="Masukkan password anda"
              />
            </div>
            <div class="pt-2">
              <button
                class="w-full bg-[#0E561E] hover:bg-[#0b4217] transition-colors text-white font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline shadow-md shadow-[#0E561E]/20"
                type="submit"
              >
                Masuk
              </button>
              <div class="w-full text-center mt-6">
                <span class="text-gray-600 text-sm font-normal">Belum punya akun?</span>
                <a
                  href="/registrasi"
                  class="text-[#0E561E] text-sm font-semibold hover:underline ml-1 cursor-pointer"
                >
                  Daftar disini
                </a>
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
