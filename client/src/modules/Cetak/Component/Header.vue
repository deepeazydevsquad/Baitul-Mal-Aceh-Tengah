<script setup lang="ts">
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;
</script>
<template>
  <!-- HeaderCetak.vue -->
  <div class="grid grid-cols-[90px_1fr_auto] mb-3">
    <img
      :src="`${BASE_URL}/uploads/img/logos/site_logo.png`"
      class="h-[15mm] max-w-[60mm] object-contain"
    />

    <div></div>

    <div class="text-right leading-tight">
      <div class="font-bold text-[11pt] uppercase">SEKRETARIAT</div>
      <div class="font-bold text-[10pt] uppercase">BAITUL MAL KABUPATEN BENER MERIAH</div>
      <div class="text-[9pt]">
        Jl. Lebe Kader No.2, Asir Asir Asia, Kec. Lut Tawar,<br />
        Kabupaten Bener Meriah, Provinsi Aceh 24519
      </div>
    </div>
  </div>
</template>
