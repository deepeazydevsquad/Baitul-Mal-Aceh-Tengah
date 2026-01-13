<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';

import { useHead } from '@vueuse/head';

useHead({
  title: 'Aplikasi Ziwah Kabupaten Bener Meriah',
  link: [{ rel: 'icon', type: 'image/png', href: 'public/favicon.png' }],
  meta: [
    {
      name: 'Aplikasi Ziwah',
      content: 'Aplikasi Ziwah Kabupaten Bener Meriah',
    },
  ],
});
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
