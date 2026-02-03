<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputText from '@/components/Form/InputText.vue';
import InputCurrency from '@/components/Form/InputCurrency.vue';
// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { add_donasi, daftar_member } from '@/service/program_donasi';
import { list_member, list_desa, list_kecamatan } from '@/service/riwayat_zakat';
import SelectField from '@/components/Form/SelectField.vue';
import { formatRupiah } from '@/libs/formatRupiah';

import { RefreshRiwayatDonasi } from '@/stores/message';
const refresh = RefreshRiwayatDonasi();
refresh.setBool(false);

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Props
interface Props {
  isModalOpen: boolean;
  id_donasi: number;
}
const props = defineProps<Props>();

// Emit
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// Form state
// const form = ref({
//   donasi_id: '',
//   member_id: 0,
//   nominal: '',
//   tipe_pembayaran: '',
// });

const form = ref<{
  donasi_id: number;
  member_id: number;
  nominal: number;
  tipe_pembayaran: string;
}>({
  donasi_id: 0,
  member_id: 0,
  nominal: 0,
  tipe_pembayaran: '',
});

interface List {
  id: string;
  name: string;
}

const optionKecamatan = ref<List[]>([{ id: '0', name: '--- Pilih Kecamatan ---' }]);
const optionDesa = ref<List[]>([{ id: '0', name: '--- Pilih Desa ---' }]);
const optionMember = ref<List[]>([{ id: '0', name: '--- Pilih Muzakki ---' }]);

const selectKecamatanId = ref(0);
const selectDesaId = ref(0);

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);
const isLoading = ref(false);

// Reset form
const resetForm = () => {
  form.value = { donasi_id: 0, member_id: 0, nominal: 0, tipe_pembayaran: '' };
  errors.value = {};

  optionKecamatan.value = [{ id: '0', name: '--- Pilih Kecamatan ---' }];
  optionDesa.value = [{ id: '0', name: '--- Pilih Desa ---' }];
  optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }];

  selectKecamatanId.value = 0;
  selectDesaId.value = 0;
};

// Validasi
const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!form.value.member_id) {
    errors.value.member_id = 'Donatur tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.nominal) {
    errors.value.nominal = 'Nominal tidak boleh kosong.';
    isValid = false;
  }

  if (!form.value.tipe_pembayaran) {
    errors.value.tipe_pembayaran = 'Tipe Pembayaran wajib diisi.';
    isValid = false;
  }

  return isValid;
};

interface Member {
  id: number;
  name: string;
}

const member = ref<Member[]>([]);

// Ambil data syarat untuk edit
async function fetchData() {
  isLoading.value = true;
  try {
    const response = await list_kecamatan();
    optionKecamatan.value = [{ id: '0', name: '--- Pilih Kecamatan ---' }, ...response.data];
  } catch (error) {
    displayNotification('Terjadi kesalahan saat memuat data.', 'error');
  } finally {
    isLoading.value = false;
  }
}

async function fetchDesa() {
  try {
    const response = await list_desa({ kecamatan_id: selectKecamatanId.value });
    optionDesa.value = [{ id: '0', name: '--- Pilih Desa ---' }, ...response.data];
  } catch (error) {
    console.error(error);
  }
}

async function fetchMember() {
  try {
    const response = await list_member({ desa_id: selectDesaId.value });
    optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }, ...response.data];
  } catch (error) {
    console.error(error);
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return;

  // Pastikan data sudah di-fetch
  if (!props.id_donasi) {
    displayNotification('ID donasi tidak valid', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    const payload = {
      program_donasi_id: Number(props.id_donasi),
      member_id: String(form.value.member_id),
      nominal: String(form.value.nominal),
      tipe_pembayaran: String(form.value.tipe_pembayaran),
    };

    console.log('Payload dikirim ke backend:', payload);

    const response = await add_donasi(payload);

    const msg = response.message || response.error_msg || 'Berhasil';
    const isError = response.error || false;

    // supaya reload
    refresh.setBool(true);

    emit('status', { error_msg: msg, error: isError });
    closeModal();
  } catch (error: any) {
    const msg =
      error.response?.data?.error_msg || error.response?.data?.message || 'Terjadi kesalahan';
    displayNotification(msg, 'error');
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Tutup modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
});

// const nominalDisplay = computed({
//   get: () => (form.value.nominal ? formatRupiah(form.value.nominal) : ''),
//   set: (val: string) => {
//     // ambil angka murni doang, buang selain digit
//     form.value.nominal = val.replace(/[^0-9]/g, '');
//   },
// });

watch(
  () => props.isModalOpen,
  (val) => {
    if (val) {
      fetchData();
    }
  },
);

watch(
  () => selectKecamatanId.value,
  (val) => {
    if (val != 0) {
      fetchDesa();
    } else {
      selectDesaId.value = 0;
      form.value.member_id = 0;
      optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }];
      optionDesa.value = [{ id: '0', name: '--- Pilih Desa ---' }];
    }
  },
);

watch(
  () => selectDesaId.value,
  (val) => {
    if (val != 0) {
      fetchMember();
    } else {
      form.value.member_id = 0;
      optionMember.value = [{ id: '0', name: '--- Pilih Muzakki ---' }];
    }
  },
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
      <div class="relative max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Tambah Donasi</h2>
          <button
            class="text-gray-400 text-lg hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>
        <div>
          <SelectField
            v-model="selectKecamatanId"
            id="kecamatan_id"
            label="Daftar Kecamatan"
            placeholder="Pilih Kecamatan"
            :options="optionKecamatan"
            :required="true"
          />
        </div>
        <div>
          <SelectField
            v-model="selectDesaId"
            id="desa_id"
            label="Daftar Desa"
            placeholder="Pilih Desa"
            :options="optionDesa"
            :required="true"
          />
        </div>
        <div>
          <SelectField
            v-model="form.member_id"
            id="member_id"
            label="Daftar Donatur"
            placeholder="Pilih Donatur"
            :options="optionMember"
            :required="true"
          />
        </div>
        <!-- nominal -->
        <div>
          <InputCurrency
            id="nominal"
            v-model="form.nominal"
            label="Nominal"
            placeholder="Masukkan nominal"
            :error="errors.nominal"
          />
        </div>

        <!-- Tipe Pembayaran -->
        <div>
          <SelectField
            v-model="form.tipe_pembayaran"
            id="tipe_pembayaran"
            label="Tipe Pembayaran"
            :error="errors.tipe_pembayaran"
            :options="[
              { id: '', name: '-- Pilih Tipe Pembayaran --' },
              { id: 'transfer', name: 'Transfer' },
              { id: 'cash', name: 'Cash' },
            ]"
            :required="true"
          />
        </div>

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
            :disabled="!(form.member_id && form.nominal && form.tipe_pembayaran) || isSubmitting"
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
