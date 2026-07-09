const fs = require('fs');
let file = 'src/modules/AdministratorArea/widgets/Sidebar/SidebarArea.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Add onUnmounted
content = content.replace(
  /import { ref, defineProps, watch, onMounted } from 'vue';/,
  "import { ref, defineProps, watch, onMounted, onUnmounted } from 'vue';"
);

// 2. Add openFlyout state and closeFlyout function before subMenuClick
content = content.replace(
  /const subMenuClick =/,
  `const openFlyout = ref<string | null>(null);

const closeFlyout = (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.menu-entry')) {
    openFlyout.value = null;
  }
};

const subMenuClick =`
);

// 3. Add to onMounted and create onUnmounted & watch
content = content.replace(
  /onMounted\(\(\) => \{([\s\S]*?)\}\);/,
  `onMounted(() => {$1  document.addEventListener('click', closeFlyout);\n});\n\nonUnmounted(() => {\n  document.removeEventListener('click', closeFlyout);\n});\n\nwatch(() => sidebarStore.isSidebarOpen, (isOpen) => {\n  if (isOpen) openFlyout.value = null;\n});`
);

// 4. Update menuClick
content = content.replace(
  /const menuClick = \(name: string, path: string, tab: any\) => \{\n  console\.log\('\*\*\*\*\*\*\*Menu'\);\n  console\.log\(name\);\n  console\.log\('\*\*\*\*\*\*\*Menu'\);/,
  `const menuClick = (name: string, path: string, tab: any) => {
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
  }`
);

// 5. HTML: Add relative to menu-entry
content = content.replace(
  /class="space-y-0\.5 menu-entry"/,
  'class="space-y-0.5 menu-entry relative"'
);

// 6. Normal submenu condition
content = content.replace(
  /v-if="item\.path === '#' && sideBarPage\.sharedString === item\.name"/,
  'v-if="item.path === \'#\' && sideBarPage.sharedString === item.name && sidebarStore.isSidebarOpen"'
);
content = content.replace(
  /class="pt-2 space-y-1\.5 overflow-hidden pb-1" :class="sidebarStore\.isSidebarOpen \? 'pl-8' : 'pl-0 flex flex-col items-center'"/,
  'class="pt-2 space-y-1.5 overflow-hidden pb-1 pl-8"'
);

// 7. Add flyout HTML after Transition name="submenu"
const flyoutHTML = `        <!-- Flyout submenu (only when collapsed) -->
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
        </Transition>`;

content = content.replace(
  /<\/Transition>/,
  `</Transition>\n\n${flyoutHTML}`
);

// 8. Add fade transition styles (just in case they don't exist)
if (!content.includes('.fade-enter-active')) {
  content = content.replace(
    /<\/style>/,
    `.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }\n.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-10px); }\n</style>`
  );
}

fs.writeFileSync(file, content);
console.log('Flyout submenu implemented.');
