<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import Notification from "@/components/Modal/Notification.vue";
import BaseButton from "@/components/Button/BaseButton.vue";
import InputFile from "@/components/Form/InputFile.vue";
import SelectField from "@/components/Form/SelectField.vue";
import InputText from "@/components/Form/InputText.vue";
import LoadingSpinner from "@/components/Loading/LoadingSpinner.vue";

// Composable
import { useNotification } from "@/composables/useNotification";

// Service
import { edit_desa, get_kecamatan, get_info_edit_desa } from "@/service/desa";

// Composable: notification
const {
  showNotification,
  notificationType,
  notificationMessage,
  displayNotification,
} = useNotification();

interface Props {
  isModalOpen: boolean;
  selectedDesa: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "status", payload: { error_msg?: string; error?: boolean }): void;
}>();

// Function: Close modal
const closeModal = () => {
  resetForm();
  emit("close");
};

// Function: Reset form
const resetForm = () => {
  form.value.name = "";
  form.value.kecamatan_id = "";
};

// Function: Validate form
const errors = ref<Record<string, string>>({
  name: "",
  kecamatan_id: "",
});

const validateForm = () => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  if (form.value.name === "") {
    errors.value.name = "Nama desa tidak boleh kosong.";
    isValid = false;
  }

  if (!form.value.kecamatan_id) {
    errors.value.kecamatan_id = "Kecamatan dari desa wajib diisi.";
    isValid = false;
  }

  console.log(errors.value);

  return isValid;
};

// State: Loading
const isLoading = ref(true);

// Function: Fetch Data
async function fetchData() {
  if (!props.selectedDesa || !props.selectedDesa.id) return;
  try {
    const response = await get_info_edit_desa(props.selectedDesa.id);
    form.value.name = response.data.name;
    form.value.kecamatan_id = response.data.kecamatan_id;

    const responseKecamatan = await get_kecamatan();
    kecamatanOption.value =
      [{ id: "", name: "Pilih kecamatan" }, ...responseKecamatan.data] || [];

  } catch (error) {
    displayNotification("Gagal mengambil data desa", "error");
  } finally {
    isLoading.value = false;
  }
}

const search = ref("");

// Function: Fetch kecamatan list
const kecamatanOption = ref<Array<{ id: number; name: string }>>([]);

async function fetchKecamatan() {
  try {
    const response = await get_kecamatan();
    kecamatanOption.value = [{ id: "", name: "Pilih kecamatan" }, ...response.data] || [];
    console.log("Data kecamatan berhasil diambil:", kecamatanOption.value);
  } catch (error) {
    console.error("Gagal mengambil data kecamatan:", error);
    displayNotification("Gagal mengambil data kecamatan", "error");
  }
}

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{ name: string; kecamatan_id: string }>({
  name: "",
  kecamatan_id: "",
});

const handleSubmit = async () => {
  if (!validateForm()) return;

  const desa_id = props.selectedDesa.id;
  const formData = JSON.parse(JSON.stringify(form.value));
  console.log(formData);

  formData.id = desa_id;

  isSubmitting.value = true;
  try {
    console.log(formData);
    const response = await edit_desa(formData);
    emit("status", { error_msg: response.error_msg, error: response.error });
    closeModal();
  } catch (error: any) {
    console.error(error);
    displayNotification(
      error.response.data.error_msg || error.response.data.message,
      "error"
    );
  } finally {
    isSubmitting.value = false;
  }
};

// Function: Handle escape & Fetch Data
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.isModalOpen) closeModal();
};
onMounted(async () => {
  await fetchData();
  document.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(async () => {
  await fetchData();
  document.removeEventListener("keydown", handleEscape);
});

watch(
  () => props.selectedDesa,
  (val) => {
    if (props.isModalOpen && val?.id) fetchData();
  }
);
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
      <div
        v-else
        class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6"
      >
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-semibold text-gray-800">Edit desa</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Nama desa -->
        <div>
          <SelectField
            id="kecamatan_id"
            v-model="form.kecamatan_id"
            :options="kecamatanOption"
            label="Pilih Kecamatan"
            placeholder="Pilih kecamatan"
            :error="errors.kecamatan_id"
          />
        </div>

        <div>
          <InputText
            id="name"
            v-model="form.name"
            label="Nama desa"
            placeholder="Masukkan nama desa"
            :error="errors.name"
          />
        </div>

        <!-- Actions -->
        <div class="pt-4">
          <BaseButton
            type="submit"
            fullWidth
            variant="primary"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Notification -->
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>
