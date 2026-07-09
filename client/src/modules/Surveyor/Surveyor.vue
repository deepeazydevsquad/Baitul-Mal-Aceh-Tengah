<script setup lang="ts">
import DangerButton from '@/components/Button/DangerButton.vue'
import EditIcon from '@/components/Icons/EditIcon.vue'
import LightButton from '@/components/Button/LightButton.vue'
import DeleteIcon from '@/components/Icons/DeleteIcon.vue'
import BaseButton from '@/components/Button/BaseButton.vue'
import { onMounted, ref } from 'vue'
import Notification from '@/components/Modal/Notification.vue'
import Confirmation from '@/components/Modal/Confirmation.vue'
import { daftar_surveyor, delete_surveyor } from '@/service/surveyor'
import FormAdd from './widget/FormAdd.vue'
import FormEdit from './widget/FormEdit.vue'
import BaseTable from '@/components/Table/BaseTable.vue'
import type { TableColumn } from '@/components/Table/BaseTable.vue'
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue'

import { useConfirmation } from '@/composables/useConfirmation'
import { useNotification } from '@/composables/useNotification'
import { usePagination } from '@/composables/usePaginations'

const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification()

// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation()

interface Data {
  id: number
  nik: string
  whatsapp_number: string
  name: string | null
  createdAt: string
  updatedAt: string
}

// Modal state
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedSurveyor = ref<any>(null)
const isLoading = ref(false)
const isTableLoading = ref(false)
const search = ref('')

function openAddModal() {
  isAddModalOpen.value = true
}

function openEditModal(item: any) {
  selectedSurveyor.value = item.id
  isEditModalOpen.value = true
}

// Table columns
const tableColumns: TableColumn[] = [
  { key: 'name', label: 'Nama' },
  { key: 'nik', label: 'NIK' },
  { key: 'whatsapp_number', label: 'No. WhatsApp' },
]

const itemsPerPage = ref<number>(10)

const { currentPage, perPage, totalRow, totalPages, nextPage, prevPage, pageNow, pages } =
  usePagination(fetchData, { perPage: itemsPerPage.value })

const data = ref<Data[]>([])

async function fetchData() {
  isTableLoading.value = true
  try {
    const response = await daftar_surveyor({
      search: search.value,
      perpage: itemsPerPage.value,
      pageNumber: currentPage.value,
    })
    data.value = response.data
    totalRow.value = response.total || response.data.length || 0
    totalPages.value = Math.ceil(totalRow.value / itemsPerPage.value)
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    isTableLoading.value = false
  }
}

onMounted(async () => {
  await fetchData()
})

async function deleteData(id: number) {
  displayConfirmation(
    'Hapus Data Surveyor',
    'Apakah Anda yakin ingin menghapus data surveyor ini?',
    async () => {
      try {
        isLoading.value = true
        await delete_surveyor({ id: id })
        displayNotification('Data surveyor berhasil dihapus', 'success')
        await fetchData()
      } catch (error) {
        displayNotification('Gagal menghapus data surveyor', 'error')
      } finally {
        isLoading.value = false
      }
    },
  )
}
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="space-y-4">
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
        <BaseTable
          empty-title="Data tidak ditemukan"
          empty-desc="Belum ada data surveyor."
          empty-icon="fa-solid fa-user-tie"
          :columns="tableColumns"
          :data="data"
          :loading="isTableLoading"
          :pagination="{ currentPage, perPage, totalRow, totalPages, pages }"
          :show-search="true"
          search-placeholder="Cari nama surveyor..."
          @search="search = $event; fetchData()"
          :show-add="true"
          add-label="Tambah Surveyor"
          @add="openAddModal"
          :show-edit="false"
          :show-delete="false"
          @page-change="pageNow"
        >
          <template #row-actions="{ row }">
            <div class="flex justify-center gap-2">
              <LightButton @click="openEditModal(row)">
                <EditIcon />
              </LightButton>
              <DangerButton @click="deleteData(row.id)">
                <DeleteIcon />
              </DangerButton>
            </div>
          </template>
        </BaseTable>
      </div>
    </div>

    <!-- Modal Tambah -->
    <FormAdd
      :is-modal-open="isAddModalOpen"
      @close="isAddModalOpen = false; fetchData()"
      @status="(payload) => displayNotification(payload.error_msg || 'Berhasil', payload.error ? 'error' : 'success')"
    />

    <!-- Modal Edit -->
    <FormEdit
      :is-modal-open="isEditModalOpen"
      :id="selectedSurveyor"
      @close="isEditModalOpen = false; fetchData()"
      @status="(payload) => displayNotification(payload.error_msg || 'Berhasil', payload.error ? 'error' : 'success')"
    />

    <Confirmation
      :showConfirmDialog="showConfirmDialog"
      :confirmTitle="confirmTitle"
      :confirmMessage="confirmMessage"
    >
      <BaseButton variant="secondary" @click="cancel">Tidak</BaseButton>
      <BaseButton variant="warning" @click="confirm">Ya</BaseButton>
    </Confirmation>

    <Notification
      :showNotification="showNotification"
      :notificationType="notificationType"
      :notificationMessage="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
