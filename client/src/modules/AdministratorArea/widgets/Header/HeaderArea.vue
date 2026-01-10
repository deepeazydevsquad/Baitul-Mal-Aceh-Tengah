<script setup lang="ts">
// import { useHead } from '@vueuse/head';
import { useSidebarStore } from '@/stores/sidebar';
import { SettingStore } from '@/stores/settings';
import DropdownUser from './DropdownUser.vue';
import { ref, watchEffect } from 'vue';

const { toggleSidebar } = useSidebarStore();
const sidebarStore = useSidebarStore();
const SettingGlob = SettingStore();

import { useHead } from '@vueuse/head';

// useHead({
//   title: 'AMRA :: Aplikasi Manajemen Travel Haji dan Umrah',
//   link: [ { rel: 'icon', type: 'image/png', href: 'public/favicon.png' } ],
//   meta: [ { name: 'AMRA', content: 'Aplikasi manajemen travel Haji dan Umrah' } ]
// });
</script>

<template>
  <header
    class="sticky top-0 z-998 bg-left flex w-full drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none"
  >
    <div
      class="flex bg-gradient-to-r from-green-900 from-5% to-white/0 to-100% flex-grow items-center justify-between py-4 px-4 shadow-2 md:px-6 2xl:px-11"
    >
      <div class="flex items-center gap-2 sm:gap-4 lg:hidden">
        <button
          class="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          @click="
            () => {
              toggleSidebar();
            }
          "
        >
          <span class="relative block h-5.5 w-5.5 cursor-pointer">
            <span class="block absolute right-0 h-full w-full">
              <span
                class="relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-[0] duration-200 ease-in-out dark:bg-white"
                :class="{ '!w-full delay-300': !sidebarStore.isSidebarOpen }"
              ></span>
              <span
                class="relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-150 duration-200 ease-in-out dark:bg-white"
                :class="{ '!w-full delay-400': !sidebarStore.isSidebarOpen }"
              ></span>
              <span
                class="relative top-0 left-0 my-1 block h-0.5 w-0 rounded-sm bg-black delay-200 duration-200 ease-in-out dark:bg-white"
                :class="{ '!w-full delay-500': !sidebarStore.isSidebarOpen }"
              ></span>
            </span>
            <span class="block absolute right-0 h-full w-full rotate-45">
              <span
                class="absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-black delay-300 duration-200 ease-in-out dark:bg-white"
                :class="{ '!h-0 delay-[0]': !sidebarStore.isSidebarOpen }"
              ></span>
              <span
                class="delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-black duration-200 ease-in-out dark:bg-white"
                :class="{ '!h-0 delay-200': !sidebarStore.isSidebarOpen }"
              ></span>
            </span>
          </span>
        </button>
      </div>
      <div class="hidden sm:block">
        <span class="hidden text-left lg:block">
          <span class="block text-sm font-semibold text-white dark:text-white"
            >APLIKASI MUSTAHIK & MUZAKKI</span
          >
          <span class="block text-sm font-normal text-white dark:text-white"
            >Kabupaten Bener Meriah</span
          >
        </span>
      </div>
      <div class="flex items-center gap-3 2xsm:gap-7">
        <DropdownUser />
      </div>
    </div>
  </header>
</template>
