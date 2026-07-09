<script setup lang="ts">
import BaseButton from '@/components/Button/BaseButton.vue';
import Pagination from '@/components/Pagination/Pagination.vue';
import SkeletonTable from '@/components/SkeletonTable/SkeletonTable.vue';
import { computed, ref } from 'vue';

export interface TableColumn {
  key: string;
  label: string;
  headerClass?: string;
  cellClass?: string;
}

const props = defineProps({
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
  },
  columns: {
    type: Array as () => TableColumn[],
    required: true,
  },
  data: {
    type: Array as () => any[],
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  showAdd: {
    type: Boolean,
    default: true,
  },
  addLabel: {
    type: String,
    default: 'Tambah Baru',
  },
  addDisabled: {
    type: Boolean,
    default: false,
  },
  showEdit: {
    type: Boolean,
    default: true,
  },
  showDelete: {
    type: Boolean,
    default: true,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  searchPlaceholder: {
    type: String,
    default: 'Cari data...',
  },
  showNumbering: {
    type: Boolean,
    default: true,
  },
  withPagination: {
    type: Boolean,
    default: true,
  },
  pagination: {
    type: Object,
    default: () => ({
      currentPage: 1,
      totalPages: 1,
      pages: [1],
      totalRow: 0,
      perPage: 10,
    }),
  },
});

const emit = defineEmits(['add', 'edit', 'delete', 'search', 'page-change']);

const totalColumns = computed(() => {
  let count = props.columns.length;
  if (props.showActions) count++;
  if (props.showNumbering) count++;
  return count;
});

// Hitung nomor baris dengan memperhitungkan pagination
const calculateRowNumber = (index: number) => {
  if (!props.withPagination || !props.pagination) return index + 1;
  const currentPage = props.pagination.currentPage?.value ?? props.pagination.currentPage ?? 1;
  const perPage = props.pagination.perPage?.value ?? props.pagination.perPage ?? 10;
  return (currentPage - 1) * perPage + index + 1;
};

// Debounce search
const searchQuery = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const onSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('search', searchQuery.value);
  }, 500); // 500ms untuk debounce search
};

// Handle page change
const handlePageChange = (page: number) => {
  const totalPages = props.pagination.totalPages?.value ?? props.pagination.totalPages ?? 1;
  if (page >= 1 && page <= totalPages) {
    emit('page-change', page);
  }
};

// Reset search dari luar
const resetSearch = () => {
  searchQuery.value = '';
};

defineExpose({ resetSearch });
</script>

<!---->

<template>
  <div class="base-table-wrapper">
    <!-- Toolbar -->
    <div class="base-table-toolbar">
      <div class="flex flex-1 items-center gap-3">
        <!-- Search -->
        <div v-if="showSearch" class="base-table-search group">
          <div class="base-table-search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4">
              <path
                d="M448 449L301.2 300.2c20-27.9 31.9-62.2 31.9-99.2 0-93.1-74.7-168.9-166.5-168.9-91.9-.1-166.6 75.7-166.6 168.8S74.7 369.8 166.5 369.8c39.8 0 76.3-14.2 105-37.9L417.5 480 448 449zM166.5 330.8c-70.6 0-128.1-58.3-128.1-129.9S95.9 71 166.5 71 294.6 129.3 294.6 200.9 237.2 330.8 166.5 330.8z"
              />
            </svg>
          </div>
          <input
            type="text"
            v-model="searchQuery"
            @input="onSearch"
            :placeholder="searchPlaceholder"
            class="base-table-search-input"
          />
        </div>
        <slot name="filters"></slot>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <slot name="custom-actions"></slot>
        <slot name="actions">
          <BaseButton
            v-if="showAdd"
            @click="$emit('add')"
            variant="primary"
            size="md"
            :disabled="addDisabled"
            class="base-table-add-btn"
          >
            <template #icon-left>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            {{ addLabel }}
          </BaseButton>
        </slot>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <SkeletonTable v-if="loading" :columns="totalColumns" :rows="5" />

      <table v-else class="base-table">
        <slot name="thead">
          <thead>
            <tr>
              <th v-if="showNumbering" class="w-16 text-center">No</th>
              <th v-for="(col, index) in columns" :key="index" :class="col.headerClass">
                <slot :name="`header-${col.key}`" :col="col">
                  {{ col.label }}
                </slot>
              </th>
              <th v-if="showActions" class="w-28 text-center">Aksi</th>
            </tr>
          </thead>
        </slot>
        <slot name="tbody">
          <tbody>
          <!-- Empty State -->
          <tr v-if="data.length === 0 && !loading">
            <td :colspan="totalColumns" class="empty-state-cell">
              <div class="empty-state animate-fade-in">
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
              </div>
            </td>
          </tr>

          <!-- Data Rows -->
          <template v-else>
            <tr
              v-for="(row, rowIndex) in data"
              :key="row[rowKey] || rowIndex"
              class="table-row group"
            >
              <td
                v-if="showNumbering"
                class="text-center text-gray-400 font-mono text-xs tabular-nums group-hover:text-seulanga-navy transition-colors"
              >
                {{ calculateRowNumber(rowIndex) }}
              </td>

              <td v-for="(col, colIndex) in columns" :key="colIndex" :class="col.cellClass">
                <slot
                  :name="`cell-${col.key}`"
                  :col="col"
                  :row="row"
                  :value="row[col.key]"
                  :index="rowIndex"
                >
                  {{ row[col.key] ?? '-' }}
                </slot>
              </td>

              <td v-if="showActions">
                <div class="action-buttons">
                  <slot name="row-actions" :row="row" :index="rowIndex">
                    <button
                      v-if="showEdit"
                      @click="$emit('edit', row)"
                      class="action-btn action-btn-edit"
                      title="Edit"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="showDelete"
                      @click="$emit('delete', row)"
                      class="action-btn action-btn-delete"
                      title="Hapus"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </slot>
                </div>
              </td>
            </tr>
            </template>
          </tbody>
        </slot>

        <tfoot v-if="(withPagination && data.length > 0) || $slots.tfoot">
          <slot name="tfoot"></slot>
          <Pagination
            v-if="withPagination && data.length > 0 && (pagination.totalRow?.value ?? pagination.totalRow) > 0"
            :current-page="pagination.currentPage?.value ?? pagination.currentPage"
            :total-pages="pagination.totalPages?.value ?? pagination.totalPages"
            :pages="pagination.pages?.value ?? pagination.pages"
            :total-columns="totalColumns"
            :total-row="pagination.totalRow?.value ?? pagination.totalRow"
            @prev-page="
              handlePageChange((pagination.currentPage?.value ?? pagination.currentPage) - 1)
            "
            @next-page="
              handlePageChange((pagination.currentPage?.value ?? pagination.currentPage) + 1)
            "
            @page-now="handlePageChange"
          />
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* ========== Wrapper ========== */
.base-table-wrapper {
  background: #ffffff;
  border-radius: 1rem;
  border: 1px solid #f1f5f9;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.04),
    0 4px 16px -2px rgb(0 0 0 / 0.03);
  overflow: hidden;
}

/* ========== Toolbar ========== */
.base-table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

/* ========== Search ========== */
.base-table-search {
  position: relative;
  width: 100%;
  max-width: 320px;
}

.base-table-search-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
  color: #9ca3af;
  transition: color 0.2s;
}

.group:focus-within .base-table-search-icon {
  color: #0f2155; /* seulanga-navy */
}

.base-table-search-input {
  width: 100%;
  padding: 0.6rem 0.875rem 0.6rem 2.5rem;
  font-size: 0.875rem;
  color: #1f2937;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.2s;
}

.base-table-search-input::placeholder {
  color: #9ca3af;
}

.base-table-search-input:hover {
  border-color: #d1d5db;
}

.base-table-search-input:focus {
  border-color: #0f2155; /* seulanga-navy */
  box-shadow: 0 0 0 3px rgba(15, 33, 85, 0.08); /* rgba of seulanga.navy */
}

/* ========== Add Button ========== */
.base-table-add-btn {
  box-shadow: 0 1px 3px 0 rgba(15, 33, 85, 0.2);
}

.base-table-add-btn:hover {
  box-shadow: 0 4px 12px -2px rgba(15, 33, 85, 0.3);
}

/* ========== Table ========== */
.base-table {
  width: 100%;
  font-size: 0.875rem;
  text-align: left;
  border-collapse: collapse;
}

.base-table thead {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.base-table thead th {
  padding: 0.75rem 1.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  white-space: nowrap;
  user-select: none;
}

/* ========== Rows ========== */
.table-row {
  border-bottom: 1px solid #f8fafc;
  transition: all 0.15s ease;
  position: relative;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f8faff; /* bg-light dari selanga */
  box-shadow: inset 3px 0 0 0 #0f2155; /* border kiri selanga-navy */
}

.table-row td {
  padding: 0.875rem 1.5rem;
  color: #374151;
  vertical-align: middle;
}



/* ========== Action Buttons ========== */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  background: transparent;
  transition: all 0.15s ease;
  color: #94a3b8;
}

.action-btn:active {
  transform: scale(0.92);
}

.action-btn-edit:hover {
  color: #d97706;
  background: #fffbeb;
}

.action-btn-delete:hover {
  color: #dc2626;
  background: #fef2f2;
}

/* ========== Animation ========== */
.animate-fade-in {
  animation: fadeIn 0.35s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== Responsive ========== */
@media (max-width: 640px) {
  .base-table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .base-table-search {
    max-width: 100%;
  }
}
</style>


<style>
/* ========== Empty State ========== */
.empty-state-cell {
  padding: 4rem 1.5rem !important;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-state-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  background: #f1f5f9;
  border-radius: 50%;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.empty-state-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.empty-state-desc {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  max-width: 20rem;
}
</style>
