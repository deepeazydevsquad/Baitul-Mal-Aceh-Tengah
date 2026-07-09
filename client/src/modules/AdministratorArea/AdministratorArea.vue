<script setup lang="ts">
import Header from './widgets/Header/HeaderArea.vue';
import Sidebar from './widgets/Sidebar/SidebarArea.vue';
import Content from './widgets/Content/ContentViews.vue';
import LoadOverlay from '@/components/Loading/LoadOverlay.vue';
import api from '@/service/api_administrator'; // Impor file API
import { ref, onMounted } from 'vue';

// useGlobalTab
import { useGlobalTab, useSelectedTab, globalSelectMenu } from '../../stores/sidebar';
import { SettingStore } from '../../stores/settings';

// State error dan loading
const isError = ref(false);
const isLoading = ref(true);

const globalTab = useGlobalTab(); // menampung seluruh tab secara global
const SettingGlob = SettingStore();
const selectedTab = useSelectedTab();
const selectMenu = globalSelectMenu();

interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: string;
  tab: null | any;
}

interface MenuInfo {
  menu: Record<string, MenuItem>;
  submenu: Record<string, any>;
  tab: Record<string, any>;
  default_tab: Record<string, any>;
}

interface UserInfo {
  company_code: string;
  username: string;
  type: string;
}

interface ServerResponse {
  error: boolean;
  error_msg: string;
  menu_info: MenuInfo;
  user_info: UserInfo;
}

const menu_info = ref<MenuInfo | null>(null);
const user_info = ref<UserInfo | null>(null);

// Mengambil data dari API
const fetchData = async () => {
  try {
    const response = await api.get<ServerResponse>('/administrator'); // Panggil API dan gunakan tipe yang benar
    if (response.status === 404) {
      isError.value = true;
    } else {
      // Menyimpan data ke dalam state
      menu_info.value = response.data.menu_info;
      user_info.value = response.data.user_info;

      globalTab.clearObject();
      for (const x in response.data.menu_info.tab) {
        globalTab.addItem(x, response.data.menu_info.tab[x]);
      }

      SettingGlob.clearObject();
      for (const x in response.data.user_info) {
        SettingGlob.addItem(x, response.data.user_info[x]);
      }

      const menu = response.data.menu_info.menu;
      const menuPertama = Object.values(menu)[0];

      selectMenu.setString(menuPertama.name);

      selectedTab.clearArray();
      if (menuPertama.path == '#') {
      } else {
        if (menuPertama.tab !== null) {
          for (const x in menuPertama.tab) {
            selectedTab.addItem(menuPertama.tab[x]);
          }
        }
      }
      isError.value = false; // Reset error state jika berhasil
    }
    isLoading.value = false;
  } catch (error) {
    isLoading.value = false;
    isError.value = true;
    console.error('Gagal mengambil data:', error);
  }
};

onMounted(() => {
  const token = localStorage.getItem('administrator_access_token');
  if (!token) {
    window.location.href = '/login-admin'; // direct ke root
  } else {
    fetchData();
  }
});
</script>
<template>
  <LoadOverlay />
  <div>
    <div class="flex h-screen overflow-hidden">
      <Sidebar :menu_info="menu_info" />
      <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <Header class="z-30 bg-gray-300" />
        <main>
          <div class="mx-auto max-w-screen p-4 md:p-6 2xl:p-10">
            <Content class="z-10"></Content>
            <div
              class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5"
            ></div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
