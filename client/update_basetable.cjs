const fs = require('fs');

let file = 'src/components/Table/BaseTable.vue';
let content = fs.readFileSync(file, 'utf8');

// Adding props
let propsCode = `
    emptyTitle: {
      type: String,
      default: 'Data tidak ditemukan',
    },
    emptyDesc: {
      type: String,
      default: 'Belum ada data tersedia atau coba gunakan kata kunci lain.',
    },
    emptyIcon: {
      type: String,
      default: null,
    },`;

if (!content.includes('emptyTitle: {')) {
    content = content.replace('props: {', 'props: {' + propsCode);
}

// Replacing empty state template
let emptyStateRegex = /<div class="empty-state animate-fade-in">.*?<\/div>\s*<\/slot>/s;
let newEmptyStateHTML = `<div class="empty-state animate-fade-in">
                <slot name="empty">
                  <div class="empty-state-icon">
                    <font-awesome-icon v-if="emptyIcon" :icon="emptyIcon" class="text-4xl" />
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="1.5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p class="empty-state-title">{{ emptyTitle }}</p>
                  <p class="empty-state-desc">{{ emptyDesc }}</p>
                </slot>
              </div>`;

if (!content.includes('{{ emptyTitle }}')) {
    // My previous replacement put `<slot name="empty">` OUTSIDE `<div class="empty-state">`. Let me check current content!
}
fs.writeFileSync('temp_basetable_test.txt', content);
