<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import ModalEditProfile from '@/modules/AdministratorArea/widgets/Header/ModalEditProfile.vue';
import Logout from './Logout.vue';
import { SettingStore } from '@/stores/settings';

const SettingGlob = SettingStore();
const isOpen = ref(false);
const dropdownRef = useTemplateRef<HTMLElement>('dropdownRef');
const logoutRef = ref<any>(null);

onClickOutside(dropdownRef, () => {
  isOpen.value = false;
});

const handleLogoutClick = () => {
  if (logoutRef.value) {
    logoutRef.value.showLogoutConfirmation();
  }
  isOpen.value = false;
};

const ModalEdit = ref(false);
const openModalEdit = () => {
  ModalEdit.value = true;
  isOpen.value = false;
};

const showNotification = ref(false);
const notificationType = ref<'success' | 'error'>('success');
const notificationMessage = ref('');

function showNotif(payload: { type: 'success' | 'error'; message: string }) {
  notificationType.value = payload.type;
  notificationMessage.value = payload.message;
  showNotification.value = true;

  setTimeout(() => {
    showNotification.value = false;
  }, 4000);
}

// Generate initials from user name
const userInitials = computed(() => {
  const name = SettingGlob.sharedObject.name;
  if (!name) return 'A';
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  }
  return nameParts[0].substring(0, 2).toUpperCase();
});
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <!-- Trigger Button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-3 p-1.5 pr-3 bg-white  hover:border-gray-200 hover:bg-gray-50 transition-all"
    >
      <!-- Avatar Box -->
      <div
        class="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-xs font-black text-white shadow-md shadow-amber-500/20"
      >
        {{ userInitials }}
      </div>
      
      <!-- User Info -->
      <div class="hidden lg:block text-left">
        <p class="text-[11.5px] font-bold text-gray-800 leading-none">
          {{ SettingGlob.sharedObject.name || 'Administrator' }}
        </p>
        <p class="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
          {{ SettingGlob.sharedObject.grup || 'Admin' }}
        </p>
      </div>

      <!-- Chevron -->
      <svg
        :class="isOpen ? 'rotate-180' : ''"
        class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ml-1"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
      >
        <div class="p-4 border-b border-gray-100 bg-gray-50/50">
          <p class="text-[13px] font-bold text-gray-800">
            {{ SettingGlob.sharedObject.name || 'Administrator' }}
          </p>
          <p class="text-[11px] font-medium text-gray-500 mt-0.5">{{ SettingGlob.sharedObject.grup || 'Admin' }}</p>
        </div>
        <div class="p-2">
          <button
            @click="openModalEdit"
            class="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-green-50 hover:text-green-700 transition-all"
          >
            <!-- User Cog Icon -->
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Edit Profile
          </button>

          <button
            @click="handleLogoutClick"
            class="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all mt-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Modals -->
  <ModalEditProfile
    :formStatus="ModalEdit"
    @cancel="ModalEdit = false"
    @submitted="ModalEdit = false"
    @notify="showNotif"
  />

  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />

  <Logout ref="logoutRef" @close-dropdown="isOpen = false" />
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
