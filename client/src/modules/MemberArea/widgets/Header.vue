<script setup lang="ts">
import { onMounted } from 'vue';

// Service API
import { get_member_info } from '@/service/member_area';
import Notification from '@/components/Modal/Notification.vue';
import { useNotification } from '@/composables/useNotification';

import { Fullname } from '@/stores/memberInfo';
const fullname = Fullname();

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

async function fetchData() {
  try {
    const response = await get_member_info();
    fullname.setString(response.data.fullname);
  } catch (error) {
    displayNotification('Gagal mengambil data member', 'error');
  }
}

onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm transition-all duration-300">
    <div class="w-full max-w-[1340px] mx-auto px-4 md:px-6 py-3 lg:py-4 flex justify-between items-center">
      <div class="flex flex-col items-center transition-transform hover:scale-105 duration-300 cursor-pointer group/logo">
        <div class="w-32 md:w-40 lg:w-44 relative">
          <img class="w-full h-auto object-contain" src="/images/ziwah.png" alt="Ziwah Logo" />
        </div>
        <p class="text-[#e2a806] font-extrabold text-[10px] md:text-xs mt-0.5 uppercase tracking-widest group-hover/logo:text-yellow-500 transition-colors">
          Kabupaten Aceh Tengah
        </p>
      </div>
      <div class="flex items-center gap-3 md:gap-4 cursor-pointer group">
        <div class="hidden sm:flex flex-col text-right transition-colors group-hover:text-green-700">
          <span class="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Selamat Datang</span>
          <span class="text-sm sm:text-base font-bold text-gray-800 leading-tight">{{ fullname.getString || 'Member' }}</span>
        </div>
        <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-105">
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
      </div>
    </div>
  </header>

  <!-- Notification -->
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>
