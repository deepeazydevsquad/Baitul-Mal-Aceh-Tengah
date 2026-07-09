<script setup lang="ts">
// Library
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import Notification from '@/components/Modal/Notification.vue';
import BaseButton from '@/components/Button/BaseButton.vue';
import InputText from '@/components/Form/InputText.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import BaseTable from '@/components/Table/BaseTable.vue';
import type { TableColumn } from '@/components/Table/BaseTable.vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { update_target, detail } from '@/service/target_distribusi';

// Notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Props
interface Props {
  isModalOpen: boolean;
  tahun: number;
  bulan: number;
}
const props = defineProps<Props>();

// Emit
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// State
const isSubmitting = ref(false);
const tahun = ref('');
const bulan = ref('');
const asnafList = ref<{ id: number; name: string; target_orang: string; target_rupiah: string }[]>(
  [],
);
const tableColumns = ref<TableColumn[]>([]);
const infaq = ref({ orang: '', rupiah: '' });
const donasi = ref({ orang: '', rupiah: '' });
const errors = ref<Record<string, string>>({});

// Daftar Bulan
const bulanOptions = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

// Reset form
const resetForm = () => {
  tahun.value = '';
  bulan.value = '';
  infaq.value = { orang: '', rupiah: '' };
  donasi.value = { orang: '', rupiah: '' };
  asnafList.value = [];
  errors.value = {};
};

// Validasi
const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!tahun.value) {
    errors.value.tahun = 'Tahun tidak boleh kosong.';
    isValid = false;
  }

  if (!bulan.value) {
    errors.value.bulan = 'Bulan tidak boleh kosong.';
    isValid = false;
  }

  return isValid;
};

// Format Rupiah
const formatRupiah = (value: string | number) => {
  let numberString = value.toString().replace(/[^,\d]/g, '');
  let split = numberString.split(',');
  let sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    let separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  return rupiah ? `Rp ${rupiah}` : '';
};

const handleRupiahInput = (a: any, e: Event) => {
  const rawValue = (e.target as HTMLInputElement).value;
  a.target_rupiah = rawValue.replace(/[^0-9]/g, '');
  (e.target as HTMLInputElement).value = formatRupiah(rawValue);
};
const handleRupiahInputInfaq = (e: Event) => {
  const rawValue = (e.target as HTMLInputElement).value;
  infaq.value.rupiah = rawValue.replace(/[^0-9]/g, '');
  (e.target as HTMLInputElement).value = formatRupiah(rawValue);
};
const handleRupiahInputDonasi = (e: Event) => {
  const rawValue = (e.target as HTMLInputElement).value;
  donasi.value.rupiah = rawValue.replace(/[^0-9]/g, '');
  (e.target as HTMLInputElement).value = formatRupiah(rawValue);
};

// Submit
const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;
  try {
    const payload = {
      tahun: tahun.value,
      bulan: parseInt(bulan.value),
      infaq: {
        target_orang: parseInt(infaq.value.orang) || 0,
        target_rupiah: parseInt(infaq.value.rupiah) || 0,
      },
      donasi: {
        target_orang: parseInt(donasi.value.orang) || 0,
        target_rupiah: parseInt(donasi.value.rupiah) || 0,
      },
      targets: asnafList.value.map((a) => ({
        asnaf_id: a.id,
        target_orang: parseInt(a.target_orang) || 0,
        target_rupiah: parseInt(a.target_rupiah) || 0,
      })),
    };

    const response = await update_target(payload);
    emit('status', { error_msg: response.error_msg, error: response.error });

    closeModal();
    emit('close');
  } catch (error: any) {
    const msg =
      error.response?.data?.error_msg || error.response?.data?.message || 'Terjadi kesalahan';
    displayNotification(msg, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

// Fetch detail data buat edit
const fetchDetail = async () => {
  try {
    if (!props.tahun || !props.bulan) return;
    const response = await detail({ tahun: props.tahun, bulan: props.bulan });

    if (!response.data) {
      displayNotification('Data target distribusi tidak ditemukan', 'error');
      return;
    }

    tahun.value = props.tahun.toString();
    bulan.value = props.bulan.toString();

    // Infaq
    if (response.data.infaq) {
      infaq.value = {
        orang: response.data.infaq.target_orang?.toString() || '',
        rupiah: response.data.infaq.target_rupiah?.toString() || '',
      };
    }

    // Donasi
    if (response.data.donasi) {
      donasi.value = {
        orang: response.data.donasi.target_orang?.toString() || '',
        rupiah: response.data.donasi.target_rupiah?.toString() || '',
      };
    }

    // Zakat (array of asnaf)
    asnafList.value = (response.data.zakat || []).map((item: any) => ({
      id: item.asnaf_id,
      name: item.asnaf_name,
      target_orang: item.target_orang?.toString() || '',
      target_rupiah: item.target_rupiah?.toString() || '',
    }));
  } catch (error) {
    console.error(error);
    displayNotification('Gagal mengambil data detail target distribusi', 'error');
  }
};

// Reset/fetch ketika modal buka/tutup
watch(
  () => props.isModalOpen,
  (val) => {
    if (val) fetchDetail();
    else resetForm();
  },
);

// Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Escape key
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(() => document.addEventListener('keydown', handleEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', handleEscape));
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
    >
      <LoadingSpinner v-if="isSubmitting" label="Menyimpan..." />
      <div
        v-else
        class="relative max-w-2xl w-full bg-white shadow-2xl rounded-2xl p-6 flex flex-col"
        style="max-height: 90vh"
      >
        <!-- Konten scrollable -->
        <div class="overflow-y-auto pr-2 space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-800">EDIT TARGET DISTRIBUSI</h2>
            <button
              class="text-gray-400 text-lg hover:text-gray-600"
              @click="closeModal"
              aria-label="Tutup modal"
            >
              <font-awesome-icon icon="fa-solid fa-xmark" />
            </button>
          </div>

          <!-- Tahun & Bulan -->
          <div class="flex gap-4">
            <InputText
              v-model="tahun"
              label="Tahun"
              type="number"
              placeholder="Masukkan tahun"
              :error="errors.tahun"
              class="w-32"
              disabled
            />
            <div class="flex flex-col">
              <label class="text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <select
                v-model="bulan"
                class="w-40 rounded-lg border-gray-300 shadow-sm px-3 py-2 text-gray-700 focus:border-green-900 focus:ring-2 focus:ring-green-900 transition bg-gray-100"
                :class="{ 'border-red-500': errors.bulan }"
                disabled
              >
                <option value="">Pilih Bulan</option>
                <option v-for="b in bulanOptions" :key="b.value" :value="b.value">
                  {{ b.label }}
                </option>
              </select>
              <span v-if="errors.bulan" class="text-xs text-red-500 mt-1">{{ errors.bulan }}</span>
            </div>
          </div>

          <!-- Infaq -->
          <div class="flex gap-4">
            <InputText
              v-model="infaq.orang"
              label="Jumlah Orang (Infaq)"
              type="number"
              placeholder="0"
              class="w-32"
            />
            <InputText
              :modelValue="formatRupiah(infaq.rupiah)"
              label="Target Rupiah (Infaq)"
              type="text"
              placeholder="Rp 0"
              @input="handleRupiahInputInfaq"
              class="w-56"
            />
          </div>

          <!-- Donasi -->
          <div class="flex gap-4">
            <InputText
              v-model="donasi.orang"
              label="Jumlah Orang (Donasi)"
              type="number"
              placeholder="0"
              class="w-32"
            />
            <InputText
              :modelValue="formatRupiah(donasi.rupiah)"
              label="Target Rupiah (Donasi)"
              type="text"
              placeholder="Rp 0"
              @input="handleRupiahInputDonasi"
              class="w-56"
            />
          </div>

          <!-- Daftar Asnaf (Zakat) -->
          <div class="space-y-4">
            <BaseTable
              class="w-full rounded-lg"
              :columns="tableColumns"
              :data="asnafList"
              :with-pagination="false"
              :show-search="false"
              :show-add="false"
              :show-edit="false"
              :show-delete="false"
              :show-numbering="false"
              :show-actions="false"
            >
              <template #thead>
                <thead class="divide-y divide-gray-300">
                  <tr>
                    <th class="px-4 py-2 text-center font-medium border border-gray-300">Asnaf</th>
                    <th class="w-[25%] px-4 py-2 text-center font-medium border border-gray-300">
                      Target Orang
                    </th>
                    <th class="w-[40%] px-4 py-2 text-center font-medium border border-gray-300">
                      Target Rupiah
                    </th>
                  </tr>
                </thead>
              </template>
              <template #tbody>
                <tbody class="divide-y divide-gray-300">
                  <tr v-for="(a, idx) in asnafList" :key="a.id">
                    <td class="px-4 py-2 text-left font-normal border border-gray-300">
                      {{ a.name }}
                    </td>
                    <td class="px-4 py-2 text-center font-normal border border-gray-300">
                      <InputText
                        v-model="a.target_orang"
                        label="Target Orang"
                        type="number"
                        placeholder="0"
                        :label_status="false"
                      />
                    </td>
                    <td class="px-4 py-2 text-center font-normal border border-gray-300">
                      <InputText
                        :modelValue="formatRupiah(a.target_rupiah)"
                        label="Target Rupiah"
                        type="text"
                        placeholder="Rp 0"
                        @input="handleRupiahInput(a, $event)"
                        :label_status="false"
                      />
                    </td>
                  </tr>
                </tbody>
              </template>
            </BaseTable>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-4 pt-4 border-t">
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
            :disabled="!tahun || !bulan || isSubmitting"
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
