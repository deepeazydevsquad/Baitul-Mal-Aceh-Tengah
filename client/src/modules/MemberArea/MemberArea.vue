<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Header from './widgets/Header.vue';
import ActionButtons from './widgets/ActionButtons.vue';

import Stats from './widgets/Stats.vue';
import LoadOverlay from '@/components/Loading/LoadOverlay.vue';

const currentTab = ref('program-bantuan');

onMounted(() => {
  const token = localStorage.getItem('member_access_token');
  if (!token) {
    window.location.href = '/'; // direct ke root
  }
});
</script>
<template>
  <LoadOverlay />
  <div class="min-h-screen bg-gray-50/50 text-gray-800 font-sans selection:bg-green-200 selection:text-green-900">
    <Header />
    <main class="py-6 md:py-10">
      <div class="w-full max-w-[1340px] mx-auto flex flex-col gap-8 md:gap-10 px-4 md:px-6">
        <ActionButtons @tab-change="currentTab = $event" />
        <transition name="fade" mode="out-in">
          <Stats v-show="currentTab === 'program-bantuan'" />
        </transition>
      </div>
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
