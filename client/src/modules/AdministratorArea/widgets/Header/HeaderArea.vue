<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar';
import { SettingStore } from '@/stores/settings';
import DropdownUser from './DropdownUser.vue';
import Logout from './Logout.vue';
import { ref } from 'vue';

const sidebarStore = useSidebarStore();
const SettingGlob = SettingStore();
const logoutRef = ref<any>(null);

const handleLogoutClick = () => {
  if (logoutRef.value) {
    logoutRef.value.showLogoutConfirmation();
  }
};
</script>

<template>
  <header class="admin-header sticky top-0 z-998 flex items-center justify-between px-4 py-4 lg:px-8 w-full" style="height: 4.5rem">
    <div class="header-inner flex items-center gap-4 relative z-10 w-full justify-between">
      
      <!-- Left Section (Green background area from gradient) -->
      <div class="flex items-center gap-4">
        <!-- Sidebar Toggle Button -->
        <button
          @click="sidebarStore.toggleSidebar()"
          class="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-sm backdrop-blur-sm"
          aria-label="Toggle sidebar"
        >
          <svg v-if="!sidebarStore.isSidebarOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Welcome Title -->
        <div class="hidden sm:block">
          <h2 class="text-[10px] font-bold text-green-100 uppercase tracking-[0.25em] mb-0.5">
            Aplikasi Mustahik & Muzakki
          </h2>
          <div class="flex items-center gap-2">
            <p class="text-[13px] font-semibold text-white tracking-wide">
              Kabupaten Aceh Tengah
            </p>
          </div>
        </div>
      </div>

      <!-- Right Section (White background area) -->
      <div class="flex items-center gap-3 lg:gap-4">
        <DropdownUser />
        
        <!-- Logout Button -->
        <!-- <button
          @click="handleLogoutClick"
          class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-100 transition-all font-bold shadow-sm"
          title="Logout"
        >
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button> -->
      </div>

    </div>

    <!-- <Logout ref="logoutRef" /> -->
  </header>
</template>

<style scoped>
.admin-header {
  position: relative;
  background-color: #ffffff;
  border-bottom: 1px solid #f3f4f6;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

/* Texture Pattern Layer */
.admin-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/images/pattern1.png');
  background-repeat: repeat;
  opacity: 0.6;
  z-index: 0;
}

/* Green Gradient Layer (Left to Right) */
.admin-header::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right, 
    #0E561E 0%, 
    rgba(14, 86, 30, 0.95) 25%, 
    rgba(14, 86, 30, 0) 65%
  );
  z-index: 0;
}

.header-inner {
  position: relative;
  z-index: 1;
}
</style>
