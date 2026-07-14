<script setup lang="ts">
import {
  useSidebarStore,
  useSelectedTab,
  useGlobalTab,
  useGlobalActiveTab,
  useTabTerpilih,
  globalSelectMenu,
} from '../../../../stores/sidebar';
import { SettingStore } from '../../../../stores/settings';

import { ref, defineProps, watch, onMounted, onUnmounted } from 'vue';

const target = ref(null);
const sidebarStore = useSidebarStore();
const selectedTab = useSelectedTab();
const activeTab = useGlobalActiveTab();
const globaltab = useGlobalTab();
const SettingGlob = SettingStore();
const tabTerpilih = useTabTerpilih();
const sideBarPage = globalSelectMenu();
const logo = ref('default.png');

const subMenuActive = ref('');

import { API_URL } from '@/config/config';
const BASE_URL = API_URL;

interface MenuInfo {
  menu: Record<string, any>;
  submenu: Record<string, any>;
  tab: Record<string, any>;
}

const openFlyout = ref<string | null>(null);

const closeFlyout = (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.menu-entry')) {
    openFlyout.value = null;
  }
};

const subMenuClick = (menuname: string, name: string, path: string, tab: any) => {
  subMenuActive.value = path;
  selectedTab.clearArray();
  activeTab.clearString();
  for (const x in tab) {
    selectedTab.addItem(tab[x]);
    if (activeTab.sharedString == '') {
      activeTab.setString(globaltab.sharedObject[tab[x].id].path);
    }
  }
};

const menuClick = (name: string, path: string, tab: any) => {
  console.log('*******Menu');
  console.log(name);
  console.log('*******Menu');

  if (!sidebarStore.isSidebarOpen) {
    if (path === '#') {
      openFlyout.value = openFlyout.value === name ? null : name;
      return;
    } else {
      openFlyout.value = null;
    }
  } else {
    openFlyout.value = null;
  }
  if (sideBarPage.sharedString === name) {
    console.log('+++++++1');
    sideBarPage.clearString();
  } else {
    console.log('+++++++2');
    sideBarPage.setString(name);
  }
  if (path !== '#') {
    subMenuActive.value = '';
    tabTerpilih.setNumber(0);
    selectedTab.clearArray();
    activeTab.clearString();
    for (const x in tab) {
      selectedTab.addItem(tab[x]);
      if (activeTab.sharedString == '') {
        activeTab.setString(globaltab.sharedObject[tab[x].id].path);
      }
    }
  }
};

const props = defineProps<{ menu_info: MenuInfo | null }>();
const dataRef = ref(props.menu_info);

watch(
  () => props.menu_info,
  (newVal) => {
    if (newVal) {
      dataRef.value = newVal;
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (SettingGlob.sharedObject.logo) {
    logo.value = SettingGlob.sharedObject.logo;
  }
  document.addEventListener('click', closeFlyout);
});

onUnmounted(() => {
  document.removeEventListener('click', closeFlyout);
});

watch(() => sidebarStore.isSidebarOpen, (isOpen) => {
  if (isOpen) openFlyout.value = null;
});
</script>

<template>
  <aside
    class="sidebar-container h-screen flex flex-col fixed left-0 top-0 z-40 border-r border-gray-100 transition-all duration-300 ease-in-out lg:relative"
    :class="[sidebarStore.isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-[260px] lg:w-[85px] -translate-x-full lg:translate-x-0']"
  >
    <!-- ===== Header (Logo) ===== -->
    <div class="px-5 pt-3 pb-4 border-b border-gray-100">
      <div class="flex items-center justify-between">
        <!-- Logo + title -->
        <router-link to="/" class="relative block min-w-0 h-10 w-full">
          <!-- Full Logo -->
          <img
            src="/images/logo.png"
            alt="Logo Site"
            class="absolute top-0 left-0 h-10 w-auto object-contain transition-all duration-300 ease-in-out"
            :class="sidebarStore.isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'"
          />
          <!-- Single Logo -->
          <img
            src="/images/logo-single.png"
            alt="Logo Site"
            class="absolute top-0 left-1/2 h-10 w-auto object-contain transition-all duration-300 ease-in-out"
            style="transform: translateX(-50%)"
            :class="!sidebarStore.isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'"
          />
        </router-link>

        <!-- Close button (mobile only) -->
        <button
          class="block lg:hidden close-btn ml-2 flex-shrink-0 p-1.5 rounded-lg"
          @click="sidebarStore.toggleSidebar()"
          aria-label="Tutup sidebar"
        >
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- ===== Navigation ===== -->
    <nav class="flex-1 py-4 px-2 no-scrollbar space-y-1" :class="sidebarStore.isSidebarOpen ? 'overflow-y-auto' : 'overflow-visible'">

      <!-- Section label: opacity+translateY only -->
      <div class="px-3 mb-3 transition-all duration-300 origin-left"
        :style="sidebarStore.isSidebarOpen
          ? 'opacity:1; transform:translateY(0); pointer-events:auto'
          : 'opacity:0; transform:translateY(-4px); pointer-events:none; height:0; margin:0; overflow:hidden'"
      >
        <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Menu Utama
        </h3>
      </div>

      <!-- Menu items -->
      <div
        v-for="(item, key) in menu_info?.menu"
        :key="key"
        class="space-y-0.5 menu-entry relative"
        :style="{ animationDelay: `${Number(key) * 45}ms` }"
      >
        <!-- Main menu button -->
        <button
          @click="menuClick(item.name, item.path, item.tab)"
          class="sidebar-link w-full text-left flex items-center h-11 rounded-xl transition-colors duration-200 relative menu-btn"
          :class="sideBarPage.sharedString === item.name ? 'link--active' : 'link--inactive'"
          :title="item.name"
        >
          <!-- Icon: fixed position, centered when sidebar collapsed -->
          <span
            class="icon-wrap w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200"
            :class="sideBarPage.sharedString === item.name ? 'icon-wrap--active' : 'icon-wrap--inactive'"
          >
            <font-awesome-icon :icon="item.icon" class="text-sm" />
          </span>

          <!-- Label: normal flex child, shrinks naturally with sidebar width.
               Only opacity animates (GPU). overflow-hidden clips the text. -->
          <span
            class="menu-label flex-1 min-w-0 overflow-hidden text-[13px] font-medium whitespace-nowrap"
            :style="sidebarStore.isSidebarOpen
              ? 'opacity:1; margin-left:10px'
              : 'opacity:0; margin-left:10px; pointer-events:none'"
          >
            {{ item.name }}
          </span>

          <!-- Chevron: fades when collapsed -->
          <svg
            v-if="item.path === '#'"
            class="chevron-icon w-3.5 h-3.5 flex-shrink-0 mr-1"
            :style="[
               sidebarStore.isSidebarOpen ? 'opacity:1' : 'opacity:0',
               sideBarPage.sharedString === item.name ? 'transform:rotate(90deg)' : 'transform:rotate(0deg)'
            ]"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- Animated submenu -->
        <Transition name="submenu">
          <div
            v-if="item.path === '#' && sideBarPage.sharedString === item.name && sidebarStore.isSidebarOpen"
            class="pt-2 space-y-1.5 overflow-hidden pb-1 pl-8"
          >
            <button
              v-for="(item1, keys) in menu_info?.submenu[item.id]"
              :title="item1.name"
              :key="keys"
              @click="subMenuClick(item.name, item1.name, item1.path, item1.tab)"
              class="w-full text-left px-3 py-2.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-2"
              :class="
                subMenuActive === item1.path
                  ? 'submenu--active'
                  : 'submenu--inactive'
              "
            >
              <!-- Dot -->
              <svg class="flex-shrink-0" width="7" height="7" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3"
                  :fill="subMenuActive === item1.path ? '#0E561E' : '#9ca3af'"
                  :stroke="subMenuActive === item1.path ? '#0E561E' : 'transparent'"
                  stroke-width="1.5"
                />
              </svg>
              <span class="whitespace-nowrap" :class="sidebarStore.isSidebarOpen ? 'block' : 'hidden'">{{ item1.name }}</span>
            </button>
          </div>
        </Transition>

        <!-- Flyout submenu (only when collapsed) -->
        <Transition name="fade">
          <div
            v-if="!sidebarStore.isSidebarOpen && item.path === '#' && openFlyout === item.name"
            class="absolute left-[80px] top-0 w-[240px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-2 z-[10000]"
          >
            <div class="px-3 pb-2 pt-1.5 border-b border-gray-100 mb-1.5">
               <h4 class="text-[11px] font-bold text-gray-800 uppercase tracking-wider">{{ item.name }}</h4>
            </div>
            <button
              v-for="(item1, keys) in menu_info?.submenu[item.id]"
              :title="item1.name"
              :key="'flyout-'+keys"
              @click="subMenuClick(item.name, item1.name, item1.path, item1.tab); openFlyout = null;"
              class="w-full text-left px-3 py-2.5 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2 hover:bg-green-50/50"
              :class="subMenuActive === item1.path ? 'text-green-700 bg-green-50/50 font-semibold' : 'text-gray-600'"
            >
              <!-- Dot -->
              <svg class="flex-shrink-0" width="6" height="6" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3"
                  :fill="subMenuActive === item1.path ? '#0E561E' : '#9ca3af'"
                  :stroke="subMenuActive === item1.path ? '#0E561E' : 'transparent'"
                  stroke-width="1.5"
                />
              </svg>
              <span class="whitespace-nowrap truncate">{{ item1.name }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- ===== Footer (User info) ===== -->
    <div class="border-t border-gray-100 p-2">
      <div class="sidebar-user-card rounded-xl p-2 flex items-center gap-2">
        <!-- Avatar: always visible -->
        <span class="menu-icon-slot flex-shrink-0 flex items-center justify-center">
          <div class="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md shadow-green-500/20">
            {{ (SettingGlob.sharedObject.name ?? 'A').charAt(0).toUpperCase() }}
          </div>
        </span>
        <!-- Info: GPU fade+slide -->
        <div class="min-w-0 flex-1 menu-label"
          :style="sidebarStore.isSidebarOpen
            ? 'opacity:1; transform:translateX(0); pointer-events:auto'
            : 'opacity:0; transform:translateX(-8px); pointer-events:none'"
        >
          <p class="text-[12px] font-semibold text-gray-700 truncate">
            {{ SettingGlob.sharedObject.name ?? 'Administrator' }}
          </p>
          <p class="text-[10px] text-gray-400 truncate uppercase tracking-widest font-medium">
            {{ SettingGlob.sharedObject.grup ?? 'Admin' }}
          </p>
        </div>
      </div>
    </div>

  </aside>
</template>

<style scoped>
/* ===== CONTAINER ===== */
.sidebar-container {
  background: #ffffff;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.06);
}

/* ===== CLOSE BUTTON ===== */
.close-btn {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}
.close-btn:hover {
  background: #e5e7eb;
}

/* ===== MENU LINK ===== */
.link--inactive {
  color: #6b7280;
}
.link--inactive:hover {
  background: #f0faf2;
  color: #0E561E;
}
.link--inactive:hover .icon-wrap--inactive {
  background: #d1e7d5;
  color: #0E561E;
}

.link--active {
  background: #0E561E;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(14, 86, 30, 0.25);
}

/* ===== ICON WRAP ===== */
.icon-wrap--inactive {
  background: #f3f4f6;
  color: #9ca3af;
}
.icon-wrap--active {
  background: rgba(255, 255, 255, 0.18);
  color: #fbbf24;
}

/* ===== SUBMENU ===== */
.submenu--inactive {
  color: #9ca3af;
}
.submenu--inactive:hover {
  background: #f0faf2;
  color: #0E561E;
}
.submenu--active {
  color: #0E561E;
  background: #e6f4ea;
  font-weight: 600;
}

/* ===== USER CARD ===== */
.sidebar-user-card {
  background: #f8fdf9;
  border: 1px solid #e6f4ea;
}

/* ===== SCROLLBAR ===== */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ===== ANIMATIONS ===== */

/* Stagger fade-in for menu entries on load */
.menu-entry {
  animation: menuFadeIn 0.3s ease both;
}
@keyframes menuFadeIn {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* Submenu expand/collapse */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.25s ease;
}
.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}
.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 500px;
}

/* Chevron */
.rotate-90 { transform: rotate(90deg); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-10px); }

/* ===== GPU-ACCELERATED MENU BUTTON LAYOUT ===== */
.menu-btn {
  /* padding-left: centers 32px icon in the 69px collapsed button: (69-32)/2 = ~18px */
  padding-left: 18px;
  padding-right: 6px;
}
.menu-label {
  /* Only opacity is transitioned — no layout properties change */
  text-align: left;
  transition: opacity 0.25s ease;
  will-change: opacity;
}
.chevron-icon {
  flex-shrink: 0;
  transition: opacity 0.25s ease, transform 0.3s ease;
  will-change: opacity, transform;
}
</style>
