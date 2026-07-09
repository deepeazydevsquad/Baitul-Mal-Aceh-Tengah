const fs = require('fs');
let file = 'src/modules/AdministratorArea/widgets/Sidebar/SidebarArea.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Update aside classes:
content = content.replace(
  /class="sidebar-container w-\[260px\] h-screen flex flex-col fixed left-0 top-0 z-9998 border-r border-gray-100 transition-all duration-300 ease-in-out lg:static"/,
  'class="sidebar-container h-screen flex flex-col fixed left-0 top-0 z-9998 border-r border-gray-100 transition-all duration-300 ease-in-out lg:static"'
);
content = content.replace(
  /:class="\[sidebarStore\.isSidebarOpen \? 'translate-x-0 lg:ml-0' : '-translate-x-full lg:-ml-\[260px\]'\]"/,
  ':class="[sidebarStore.isSidebarOpen ? \'w-[260px] translate-x-0\' : \'w-[260px] lg:w-[85px] -translate-x-full lg:translate-x-0\']"'
);

// 2. Hide logo text
content = content.replace(
  /<div class="flex flex-col min-w-0">/,
  '<div class="flex flex-col min-w-0 transition-opacity duration-300" :class="sidebarStore.isSidebarOpen ? \'opacity-100 w-auto\' : \'opacity-0 w-0 overflow-hidden lg:hidden\'">'
);

// 3. Main Menu label
content = content.replace(
  /<div class="px-3 mb-3">\s*<h3 class="text-\[10px\] font-black text-gray-400 uppercase tracking-\[0\.2em\]">/,
  '<div class="px-3 mb-3" :class="sidebarStore.isSidebarOpen ? \'block\' : \'hidden\'">\n        <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">'
);

// 4. Justify between for menu button (need to adjust if collapsed so icon is centered)
content = content.replace(
  /class="sidebar-link w-full text-left flex items-center justify-between px-3 py-2\.5 rounded-xl transition-all duration-200"/,
  'class="sidebar-link w-full text-left flex items-center px-3 py-2.5 rounded-xl transition-all duration-200" :class="sidebarStore.isSidebarOpen ? \'justify-between\' : \'justify-center\'" :title="item.name"'
);

// 5. Hide menu text
content = content.replace(
  /<span class="text-\[13px\] font-medium">\{\{\s*item\.name\s*\}\}<\/span>/,
  '<span class="text-[13px] font-medium whitespace-nowrap" :class="sidebarStore.isSidebarOpen ? \'block\' : \'hidden\'">{{ item.name }}</span>'
);

// 6. Hide chevron
content = content.replace(
  /v-if="item\.path === '#'"/g,
  'v-if="item.path === \'#\' && sidebarStore.isSidebarOpen"'
);

// 7. Adjust submenu padding if collapsed
content = content.replace(
  /class="pl-8 pt-2 space-y-1\.5 overflow-hidden pb-1"/,
  'class="pt-2 space-y-1.5 overflow-hidden pb-1" :class="sidebarStore.isSidebarOpen ? \'pl-8\' : \'pl-0 flex flex-col items-center\'"'
);

// 8. Adjust submenu text & add title
content = content.replace(
  /<button\s+v-for="\(item1, keys\) in menu_info\?\.submenu\[item\.id\]"/,
  '<button\n              v-for="(item1, keys) in menu_info?.submenu[item.id]"\n              :title="item1.name"'
);
content = content.replace(
  /<span>\{\{\s*item1\.name\s*\}\}<\/span>/,
  '<span class="whitespace-nowrap" :class="sidebarStore.isSidebarOpen ? \'block\' : \'hidden\'">{{ item1.name }}</span>'
);

// 9. Hide Footer text
content = content.replace(
  /<div class="flex-1 min-w-0">/,
  '<div class="flex-1 min-w-0" :class="sidebarStore.isSidebarOpen ? \'block\' : \'hidden\'">'
);

fs.writeFileSync(file, content);
console.log('Sidebar modifications applied.');
