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
  <header class="sticky top-0 z-10">
    <div
      class="w-full px-6 py-2.5 bg-white shadow-[0px_8px_32px_0px_rgba(0,0,0,0.08)] border-b border-black/10 inline-flex justify-between items-center overflow-hidden"
    >
      <div class="w-full max-w-[1340px] mx-auto flex justify-between items-center">
        <div class="w-48 relative">
          <img class="w-48 h-auto object-contain" src="/images/ziwah.png" />
        </div>
        <div class="text-center justify-center text-sm italic">Hai, {{ fullname.getString }}</div>
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
