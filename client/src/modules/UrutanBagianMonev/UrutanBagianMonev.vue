<script setup lang="ts">
// Library
import { ref, onMounted, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import Notification from '@/components/Modal/Notification.vue'
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue'
import BaseTable from '@/components/Table/BaseTable.vue'
import type { TableColumn } from '@/components/Table/BaseTable.vue'

// Composable
import { useNotification } from '@/composables/useNotification'

// Service API
import {
  getJenisMonevList,
  getUrutanByJenis,
  updateUrutanMonev
} from '@/service/urutan_bagian_monev'

// State
const isLoading = ref(false)
const isListLoading = ref(false)
const jenisMonevList = ref<string[]>([])
const selectedJenisMonev = ref('')
const urutanBagian = ref<string[]>([])
const lastUpdated = ref<string | null>(null)
const tableColumns = ref<TableColumn[]>([])

// Composable
const { showNotification, notificationType, notificationMessage, displayNotification } = useNotification()

async function fetchData() {
  isLoading.value = true
  try {
    const response = await getJenisMonevList()
    jenisMonevList.value = response.data
    if (jenisMonevList.value.length > 0) {
      selectedJenisMonev.value = jenisMonevList.value[0]
    }
  } catch (error) {
    displayNotification('Gagal memuat daftar jenis monev', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// Watcher untuk mengambil data urutan ketika pilihan berubah
watch(selectedJenisMonev, async (newValue) => {
  if (!newValue) {
    urutanBagian.value = []
    return
  }
  isListLoading.value = true
  try {
    const response = await getUrutanByJenis(newValue)
    urutanBagian.value = response.data.urutan || []
    lastUpdated.value = response.data.updatedAt || null
  } catch (error) {
    displayNotification('Gagal memuat urutan bagian', 'error')
    urutanBagian.value = []
    lastUpdated.value = null
  } finally {
    isListLoading.value = false
  }
})

// Computed property untuk v-model di draggable
const draggableList = computed({
  get: () => urutanBagian.value,
  set: (newValue) => {
    urutanBagian.value = newValue
    handleSaveOrder()
  }
})

// Fungsi untuk menyimpan urutan baru
const handleSaveOrder = async () => {
  if (!selectedJenisMonev.value) return

  isLoading.value = true
  try {
    await updateUrutanMonev(selectedJenisMonev.value, urutanBagian.value)
    displayNotification('Urutan berhasil disimpan', 'success')
    
    const response = await getUrutanByJenis(selectedJenisMonev.value)
    urutanBagian.value = response.data.urutan || []
    lastUpdated.value = response.data.updatedAt || null
  } catch (error) {
    displayNotification('Gagal menyimpan urutan. Memuat ulang...', 'error')
    const response = await getUrutanByJenis(selectedJenisMonev.value)
    urutanBagian.value = response.data.urutan || []
    lastUpdated.value = response.data.updatedAt || null
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto p-4">
    <LoadingSpinner v-if="isLoading" label="Memproses..." />
    <div v-else class="space-y-6">
      <!-- Dropdown Pemilihan Jenis Monev -->
      <div class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <label for="jenis-monev-select" class="block text-sm font-medium text-gray-700 mb-2">
          Pilih Jenis Monev
        </label>
        <select
          id="jenis-monev-select"
          v-model="selectedJenisMonev"
          class="block w-full sm:w-1/2 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition"
        >
          <option disabled value="">-- Silakan Pilih --</option>
          <option v-for="jenis in jenisMonevList" :key="jenis" :value="jenis">
            {{ jenis.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }}
          </option>
        </select>
      </div>

      <!-- Draggable Section for Ordering -->
      <div class="p-6 bg-white rounded-lg border border-gray-200 shadow-md">
        <h3 class="text-lg font-bold text-gray-900">Urutan Bagian Monev</h3>
        <p class="mt-1 text-sm text-gray-500">
          Seret dan lepas baris tabel untuk mengubah urutan bagian. Perubahan akan tersimpan otomatis.
        </p>

        <div v-if="isListLoading" class="mt-4 text-center py-8">
          <LoadingSpinner label="Memuat urutan..." />
        </div>
        
        <div v-else-if="draggableList.length > 0 && selectedJenisMonev" class="mt-4 overflow-hidden rounded-xl border border-gray-200 shadow">
          <BaseTable
            class="w-full border-collapse bg-white text-sm"
            :columns="tableColumns"
            :data="draggableList"
            :with-pagination="false"
            :show-search="false"
            :show-add="false"
            :show-edit="false"
            :show-delete="false"
            :show-numbering="false"
            :show-actions="false"
          >
            <template #thead>
              <thead class="bg-gray-50 text-gray-700 border-b border-gray-300">
                <tr>
                  <th class="w-[5%] px-4 py-3 font-medium text-center">Urutan</th>
                  <th class="px-6 py-3 font-medium text-left">Bagian Monev</th>
                  <th class="w-[25%] px-6 py-3 font-medium text-center">Datetimes</th>
                  <th class="w-[5%] px-4 py-3 font-medium"></th>
                </tr>
              </thead>
            </template>
            <!-- Draggable tbody -->
            <template #tbody>
              <draggable
                v-model="draggableList"
                item-key="index"
                tag="tbody"
                class="divide-y divide-gray-100"
                handle=".handle"
              >
                <template #item="{ element, index }">
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-2 text-center text-gray-600 font-mono">{{ index + 1 }}</td>
                    <td class="px-6 py-2 text-gray-800 uppercase">
                      {{ element.replace(/_/g, ' ').toUpperCase() }}
                    </td>
                    <td class="px-6 py-2 text-center text-gray-600">
                      {{ lastUpdated }}
                    </td>
                    <td class="px-4 py-2 text-center">
                      <div class="handle cursor-grab active:cursor-grabbing text-gray-400">
                         <font-awesome-icon icon="fa-solid fa-grip-vertical" />
                      </div>
                    </td>
                  </tr>
                </template>
              </draggable>
            </template>
          </BaseTable>
        </div>

        <div v-else class="mt-4 text-center py-8 px-4 border-2 border-dashed border-gray-300 rounded-lg">
          <font-awesome-icon icon="fa-solid fa-list-ol" class="text-4xl mb-2 text-gray-400" />
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            {{ selectedJenisMonev ? 'Tidak Ada Data Urutan' : 'Pilih Jenis Monev' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            {{ selectedJenisMonev ? 'Belum ada urutan yang didefinisikan.' : 'Silakan pilih jenis monev di atas untuk melihat dan mengatur urutannya.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>

