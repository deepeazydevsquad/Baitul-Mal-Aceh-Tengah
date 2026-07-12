<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import { useHead } from '@vueuse/head'

useHead({
  title: 'SiZiwah Kabupaten Aceh Tengah',
  link: [{ rel: 'icon', type: 'image/png', href: 'public/favicon.png' }],
  meta: [
    {
      name: 'SiZiwah Kabupaten Aceh Tengah',
      content: 'SiZiwah Kabupaten Aceh Tengah',
    },
  ],
})
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
