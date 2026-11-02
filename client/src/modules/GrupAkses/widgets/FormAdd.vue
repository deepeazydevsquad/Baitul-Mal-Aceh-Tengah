<script setup lang="ts">
import { ref, onMounted } from 'vue'
import InputText from '@/components/Form/InputText.vue'
import { list_menu, add_grup } from '@/service/grup_akses'
import BaseButton from '@/components/Button/BaseButton.vue'
import { useNotification } from '@/composables/useNotification'
import Notification from '@/components/Modal/Notification.vue'

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification()

interface Props {
  isModalOpen: boolean
}
const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void
}>()

const selectedMenus = ref<number[]>([]) // id menu yang dipilih

const closeModal = () => {
  emit('close')
}

interface Submenu {
  id: number
  menu_id: number
  name: string
  path: string
}
interface Menu {
  id: number
  name: string
  path: string
  icon: string
  Submenus: Submenu[]
}
const menus = ref<Menu[]>([])

const fetch_menu = async () => {
  try {
    const response = await list_menu()
    menus.value = response // asumsi response.data = array menu
  } catch (error) {
    console.error(error)
  }
}

const selectedSubmenus = ref<number[]>([])

const toggleMenu = (id: number, type: 'menu' | 'submenu') => {
  if (type === 'menu') {
    if (selectedMenus.value.includes(id)) {
      selectedMenus.value = selectedMenus.value.filter((m) => m !== id)
    } else {
      selectedMenus.value.push(id)
    }
  } else {
    if (selectedSubmenus.value.includes(id)) {
      selectedSubmenus.value = selectedSubmenus.value.filter((s) => s !== id)
    } else {
      selectedSubmenus.value.push(id)
    }
  }
}

const formName = ref('')
const isSubmitting = ref(false)

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    // bentuk data sesuai kebutuhan backend, buang properti yang ga perlu
    const payload = menus.value
      .filter((menu) => selectedMenus.value.includes(menu.id))
      .map((menu) => ({
        id: menu.id,
        name: menu.name,
        path: menu.path,
        icon: menu.icon,
        Submenus: menu.Submenus
          ? menu.Submenus.filter((submenu: any) => selectedSubmenus.value.includes(submenu.id))
          : [],
      }))

    const body = {
      name: formName.value,
      group_access: JSON.stringify(payload), // stringify sebelum kirim
    }


    const response = await add_grup(body)
    emit('status', { error_msg: response.error_msg || response, error: response.error })
    closeModal()
  } catch (error: any) {
    console.error(error)
    displayNotification(
      error.response?.data?.error_msg || error.response?.data?.message || 'Terjadi kesalahan',
      'error',
    )
  } finally {
    isSubmitting.value = false
    closeModal()
  }
}

onMounted(() => {
  fetch_menu()
})
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
    enter-to-class="opacity-100 translate-y-0 sm:scale-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0 sm:scale-100"
    leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
  >
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div
        class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6 max-h-[80vh] overflow-y-auto"
      >
        <!-- Header -->
        <div class="flex items-center justify-between bg-white pb-2">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Tambah Grup Akses</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Nama Grup -->
        <div>
          <InputText
            v-model="formName"
            id="name"
            label="Nama Grup"
            type="text"
            placeholder="Masukkan nama grup"
          />
        </div>

        <!-- List Menu -->
        <div class="space-y-2">
          <label class="font-medium text-gray-700">Pilih Menu:</label>

          <div v-for="menu in menus" :key="menu.id" class="ml-0">
            <!-- Menu utama -->
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :id="`menu-${menu.id}`"
                :checked="selectedMenus.includes(menu.id)"
                @change="toggleMenu(menu.id, 'menu')"
                class="custom-checkbox"
              />

              <label :for="`menu-${menu.id}`" class="font-semibold">{{ menu.name }}</label>
            </div>

            <!-- Submenu -->
            <div v-if="menu.Submenus && menu.Submenus.length" class="ml-6 space-y-1">
              <div
                v-for="submenu in menu.Submenus"
                :key="submenu.id"
                class="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  :id="`submenu-${submenu.id}`"
                  :checked="selectedSubmenus.includes(submenu.id)"
                  @change="toggleMenu(submenu.id, 'submenu')"
                  class="custom-checkbox"
                />

                <label :for="`submenu-${submenu.id}`">{{ submenu.name }}</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug -->
        <div class="flex justify-end gap-3 mt-4">
          <BaseButton
            @click="closeModal"
            type="button"
            :disabled="isSubmitting"
            variant="secondary"
          >
            Batal
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="
              !(
                formName.trim() &&
                selectedMenus.length
              ) || isSubmitting
            "
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan Perubahan</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>

  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>

<style scoped>
.custom-checkbox {
  /* warna hijau */
  accent-color: #16a34a; /* Tailwind green-600 */
}
</style>
