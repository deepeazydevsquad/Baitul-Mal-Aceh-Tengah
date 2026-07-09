<script setup lang="ts">
import { ref, onUnmounted, onMounted, nextTick, watch } from 'vue';
import { defineAsyncComponent } from 'vue';
import ProgramBantuanMember from '@/modules/ProgramBantuanMember/ProgramBantuanMember.vue';
import ZakatMember from '@/modules/ZakatMember/ZakatMember.vue';
import InfaqMember from '@/modules/InfaqMember/InfaqMember.vue';
import DonasiMember from '@/modules/DonasiMember/DonasiMember.vue';
import Notification from '@/components/Modal/Notification.vue';
import ModalEditProfile from '@/modules/MemberArea/widgets/ModalEditProfile.vue';
import { initTooltips } from 'flowbite';

// === State Notification ===
const timeoutId = ref<number | null>(null);
const showNotification = ref<boolean>(false);
const notificationMessage = ref<string>('');
const notificationType = ref<'success' | 'error'>('success');
const isModalEditProfile = ref<boolean>(false);


// === Modal Edit Profile ===
const openModalEditProfile = () => {
  isModalEditProfile.value = true;
};

// === Display Notification ===
const displayNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  if (timeoutId.value) clearTimeout(timeoutId.value);
  timeoutId.value = window.setTimeout(() => {
    showNotification.value = false;
  }, 3000);
};

// === Window Resize untuk Label Dinamis ===
const windowWidth = ref(window.innerWidth);
const dynamicLabel = (val: string) => {
  if (windowWidth.value < 640) return '';
  else if (windowWidth.value < 1269) return val.slice(0, 8) + '...';
  else if (windowWidth.value < 1467) return val.slice(0, 8) + '...';
  else if (windowWidth.value < 1611) return val.slice(0, 13) + '...';
  else if (windowWidth.value < 1707) return val.slice(0, 16) + '...';
  return val;
};

// === Logout ===
const logout = async () => {
  displayNotification('Proses logout berhasil dilakukan.', 'success');
  localStorage.removeItem('member_access_token');
  localStorage.removeItem('member_refresh_token');
  setTimeout(() => (window.location.href = '/'), 1200);
};

// === Lifecycle ===
onMounted(() => {
  const resizeHandler = () => (windowWidth.value = window.innerWidth);
  window.addEventListener('resize', resizeHandler);
  nextTick(() => initTooltips());
  onUnmounted(() => window.removeEventListener('resize', resizeHandler));
});

// === Tab Config ===
const menuItems = [
  {
    id: 'program-bantuan',
    label: 'Program Bantuan',
    icon: 'fa-solid fa-hand-holding-heart',
    bg: 'bg-green-900',
    rounded: 'rounded-tl-lg rounded-bl-lg',
    lgWidth: 'lg:w-46',
    component: ProgramBantuanMember,
  },
  {
    id: 'zakat',
    label: 'Zakat',
    icon: 'fa-solid fa-mosque',
    bg: 'bg-green-800',
    rounded: '',
    lgWidth: 'lg:w-40',
    component: ZakatMember,
  },
  {
    id: 'infaq',
    label: 'Infaq',
    icon: 'fa-solid fa-coins',
    bg: 'bg-green-700',
    rounded: '',
    lgWidth: 'lg:w-40',
    component: InfaqMember,
  },
  {
    id: 'donasi',
    label: 'Donasi',
    icon: 'fa-solid fa-gift',
    bg: 'bg-green-600',
    rounded: 'rounded-tr-lg rounded-br-lg',
    lgWidth: 'lg:w-40',
    component: DonasiMember,
  },
];

const tooltips = [
  { id: 'program-bantuan', label: 'Program Bantuan' },
  { id: 'zakat', label: 'Zakat' },
  { id: 'infaq', label: 'Infaq' },
  { id: 'donasi', label: 'Donasi' },
  { id: 'edit-profil', label: 'Edit Profil' },
  { id: 'logout', label: 'Logout' },
];

// === Active Tab ===
const activeTab = ref(menuItems[0].id);

import { computed } from 'vue';
const activeComponent = computed(() => {
  return menuItems.find((i) => i.id === activeTab.value)?.component;
});

const emit = defineEmits(['tab-change']);

watch(activeTab, (newVal) => {
  emit('tab-change', newVal);
}, { immediate: true });
</script>

<template>
  <!-- Tooltip -->
  <div
    v-for="tooltip in tooltips"
    :key="tooltip.id"
    :id="`tooltip-default-${tooltip.id}`"
    role="tooltip"
    class="absolute invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-graydark rounded-lg shadow-xs opacity-0 tooltip dark:bg-gray-700 z-999999"
  >
    {{ tooltip.label }}
    <div class="tooltip-arrow" data-popper-arrow></div>
  </div>

  <!-- Navbar Tabs -->
  <div class="w-full flex flex-col xl:flex-row items-center justify-between gap-4 xl:gap-8">
    
    <!-- Spacer for balanced flex on large screens -->
    <div class="hidden xl:flex flex-1 justify-start"></div>

    <!-- Center Navigation Tabs -->
    <div class="flex flex-wrap sm:flex-nowrap justify-center items-center p-1.5 bg-white rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
      <button
        v-for="item in menuItems"
        :key="item.id"
        @click="activeTab = item.id"
        class="relative px-3 py-2.5 sm:px-5 lg:px-6 min-w-[3rem] sm:min-w-[6rem] lg:min-w-[8rem] flex justify-center items-center gap-2 font-semibold text-sm transition-all duration-300 rounded-lg group focus:outline-none"
        :class="[
          activeTab === item.id 
            ? 'text-white shadow-md transform scale-[1.02]' 
            : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
        ]"
        :data-tooltip-target="`tooltip-default-${item.id}`"
      >
        <!-- Dynamic Background for Active Tab -->
        <div v-if="activeTab === item.id" class="absolute inset-0 -z-10 rounded-lg transition-colors duration-300" :class="item.bg"></div>
        
        <font-awesome-icon :icon="item.icon" :class="{'scale-110': activeTab === item.id}" class="transition-transform duration-300" />
        <span class="hidden md:inline relative z-10">{{ dynamicLabel(item.label) }}</span>
      </button>
    </div>

    <!-- Edit Profil + Logout -->
    <div class="flex xl:flex-1 justify-center xl:justify-end items-center gap-3 w-full sm:w-auto">
      <button
        @click="openModalEditProfile"
        class="px-5 py-2.5 bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 text-gray-600 rounded-xl flex justify-center items-center gap-2 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow"
        :data-tooltip-target="`tooltip-default-edit-profil`"
      >
        <font-awesome-icon icon="fa-solid fa-user-pen" />
        <span class="hidden md:inline">{{ dynamicLabel('Edit Profile') }}</span>
      </button>
      <button
        @click="logout"
        :data-tooltip-target="`tooltip-default-logout`"
        class="px-5 py-2.5 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-xl flex justify-center items-center gap-2 font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow"
      >
        <font-awesome-icon icon="fa-solid fa-right-from-bracket" />
        <span class="hidden md:inline">{{ dynamicLabel('Logout') }}</span>
      </button>
    </div>
  </div>

  <ModalEditProfile
    :formStatus="isModalEditProfile"
    @cancel="isModalEditProfile = false"
    @submitted="isModalEditProfile = false"
    @notify="(payload) => displayNotification(payload.message, payload.type)"
  />


  <!-- Konten Dinamis -->
  <div class="mt-6 md:mt-8 min-h-[400px]">
    <transition name="fade-slide" mode="out-in">
      <component
        v-if="activeComponent"
        :is="activeComponent"
        :key="activeTab"
      />
      <div v-else class="text-gray-400 italic bg-white p-10 rounded-2xl text-center shadow-sm border border-gray-100 flex items-center justify-center">
        <div class="flex flex-col items-center gap-3">
          <font-awesome-icon icon="fa-solid fa-hammer" class="text-4xl text-gray-300" />
          <span>Halaman "{{ activeTab }}" belum tersedia atau sedang dibangun.</span>
        </div>
      </div>
    </transition>
  </div>

  <!-- Notifikasi -->
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
