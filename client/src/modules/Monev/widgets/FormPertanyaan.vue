<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import InputCheckbox from '@/components/Form/InputCheckbox.vue';
import InputCurrency from '@/components/Form/InputCurrency.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import InputTextarea from '@/components/Form/TextArea.vue';
import Notification from '@/components/Modal/Notification.vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import { kirim_jawaban, pertanyaan } from '@/service/monev';
import LoadingSpinner from '../../../components/Loading/LoadingSpinner.vue';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

// Props & Emits
interface Props {
  isModalOpen: boolean;
  permohonan_id: number;
  tipe: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// ===== STATE =====
const isLoading = ref(false);
const isSubmitting = ref(false);
const form = ref({
  jenis_monev: null,
  nama_petugas_monev: '',
  tim_monev_1: '',
  tim_monev_2: '',
  tim_monev_3: '',
  rekomendasi_tim: '',
});
const errors = ref<Record<string, string>>({});
const jawaban = ref<Record<number, string | boolean | undefined>>({});
const dataPertanyaan = ref<PertanyaanMonitoring[]>([]);

interface PertanyaanMonitoring {
  id: number;
  pertanyaan: string;
  tipe: string;
  bagian: string;
  parent_id: number | null;
  bentuk_pertanyaan: string;
  sub_pertanyaan?: PertanyaanMonitoring[];
}

// ===== FUNCTIONS =====
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

const resetForm = () => {
  form.value = {
    jenis_monev: null,
    nama_petugas_monev: '',
    tim_monev_1: '',
    tim_monev_2: '',
    tim_monev_3: '',
    rekomendasi_tim: '',
  };
  jawaban.value = {};
  errors.value = {};
};

// ✅ Validasi yang lebih kontekstual
const validateForm = () => {
  errors.value = {};
  let valid = true;

  // Validasi nama petugas (wajib)
  if (!form.value.nama_petugas_monev.trim()) {
    errors.value.nama_petugas_monev = 'Nama petugas wajib diisi';
    valid = false;
  }

  // Validasi tim monev (minimal 1)
  if (
    !form.value.tim_monev_1.trim() &&
    !form.value.tim_monev_2.trim() &&
    !form.value.tim_monev_3.trim()
  ) {
    errors.value.tim_monev_1 = 'Minimal 1 anggota tim harus diisi';
    valid = false;
  }

  // Validasi jenis monev (wajib)
  if (!form.value.jenis_monev) {
    errors.value.jenis_monev = 'Jenis monev wajib diisi';
    valid = false;
  }

  // Validasi rekomendasi (opsional tapi jika diisi harus > 10 karakter)
  if (form.value.rekomendasi_tim && form.value.rekomendasi_tim.trim().length < 10) {
    errors.value.rekomendasi_tim = 'Rekomendasi minimal 10 karakter';
    valid = false;
  }

  // Validasi setiap pertanyaan
  dataPertanyaan.value.forEach((pertanyaan) => {
    const val = jawaban.value[pertanyaan.id];
    if (pertanyaan.bentuk_pertanyaan === 'text') {
      if (!val || (typeof val === 'string' && !val.trim())) {
        errors.value[pertanyaan.id] = 'Jawaban wajib diisi';
        valid = false;
      }
    } else if (pertanyaan.bentuk_pertanyaan === 'currency') {
      const num = Number(val);
      if (!val || isNaN(num) || num <= 0) {
        errors.value[pertanyaan.id] = 'Nominal tidak valid';
        valid = false;
      }
    }

    // Sub-pertanyaan
    pertanyaan.sub_pertanyaan?.forEach((sub) => {
      const subVal = jawaban.value[sub.id];
      if (sub.bentuk_pertanyaan === 'text') {
        if (!subVal || (typeof subVal === 'string' && !subVal.trim())) {
          errors.value[sub.id] = 'Jawaban wajib diisi';
          valid = false;
        }
      } else if (sub.bentuk_pertanyaan === 'currency') {
        const subNum = Number(subVal);
        if (!subVal || isNaN(subNum) || subNum <= 0) {
          errors.value[sub.id] = 'Nominal tidak valid';
          valid = false;
        }
      }
    });
  });

  return valid;
};

// Fetch data pertanyaan berdasarkan jenis_monev
const jenisMonevOption = ref<{ id: string | null; name: string }[]>([]);
const fetchPertanyaan = async () => {
  isLoading.value = true;
  try {
    const res = await pertanyaan({ tipe: props.tipe, jenis_monev: form.value.jenis_monev });
    dataPertanyaan.value = res.data || [];

    // Initialize jawaban
    res.data.forEach((p: PertanyaanMonitoring) => {
      jawaban.value[p.id] = p.bentuk_pertanyaan === 'checkbox' ? false : '';
      p.sub_pertanyaan?.forEach((sp) => {
        jawaban.value[sp.id] = sp.bentuk_pertanyaan === 'checkbox' ? false : '';
      });
    });

    console.log('Pertanyaan:', dataPertanyaan.value);
    console.log('Jawaban Init:', jawaban.value);
  } catch (err: any) {
    displayNotification(err.response?.data?.error_msg || 'Gagal memuat pertanyaan', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Group pertanyaan by bagian
const groupedPertanyaan = computed(() => {
  const grouped: Record<string, PertanyaanMonitoring[]> = {};
  dataPertanyaan.value.forEach((item) => {
    if (!grouped[item.bagian]) grouped[item.bagian] = [];
    grouped[item.bagian].push(item);
  });
  return grouped;
});

watch(
  () => form.value.jenis_monev,
  (newVal) => {
    if (newVal) {
      fetchPertanyaan();
    }
  },
);

watch(
  () => [props.isModalOpen, props.tipe],
  ([isModalOpen, type]) => {
    if (!isModalOpen) return;

    jenisMonevOption.value = [{ id: null, name: '-- Pilih Jenis Monev --' }];

    if (type === 'evaluasi') {
      jenisMonevOption.value.push(
        { id: 'evaluasi_konsumtif', name: 'Evaluasi Konsumtif' },
        { id: 'evaluasi_pemberdayaan_ekonomi', name: 'Evaluasi Pemberdayaan Ekonomi' },
        { id: 'evaluasi_pendidikan', name: 'Evaluasi Pendidikan' },
      );
    } else if (type === 'monitoring') {
      jenisMonevOption.value.push(
        { id: 'monitoring_konsumtif', name: 'Monitoring Konsumtif' },
        { id: 'monitoring_pemberdayaan_ekonomi', name: 'Monitoring Pemberdayaan Ekonomi' },
        { id: 'monitoring_pendidikan', name: 'Monitoring Pendidikan' },
      );
    }
  },
);

watch(
  () => form.value.jenis_monev,
  (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      fetchPertanyaan();
    }
  },
);

// ===== HANDLE SUBMIT =====
const handleSubmit = async () => {
  if (!validateForm()) {
    displayNotification('Mohon lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  isSubmitting.value = true;

  try {
    const payload = {
      permohonan_id: props.permohonan_id,
      tipe: props.tipe,
      jenis_monev: form.value.jenis_monev,
      nama_petugas_monev: form.value.nama_petugas_monev,
      tim_monev_1: form.value.tim_monev_1 || null,
      tim_monev_2: form.value.tim_monev_2 || null,
      tim_monev_3: form.value.tim_monev_3 || null,
      rekomendasi_tim: form.value.rekomendasi_tim || null,
      jawaban: Object.entries(jawaban.value).map(([id, val]) => ({
        pertanyaan_id: Number(id),
        jawaban: typeof val === 'boolean' ? (val ? 'Ya' : 'Tidak') : String(val),
      })),
    };

    console.log('Payload dikirim ke backend:', payload);

    const response = await kirim_jawaban(payload);

    emit('status', { error: false, error_msg: response.error_msg });
  } catch (error: any) {
    const errorMsg = error.response?.data?.error_msg || 'Gagal mengirim jawaban ke backend';
    displayNotification(errorMsg, 'error');
    emit('status', { error: true, error_msg: errorMsg });
  } finally {
    isSubmitting.value = false;
    closeModal();
  }
};

// Escape key handler
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
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
      <div
        v-else
        class="relative max-w-5xl w-full bg-white shadow-2xl rounded-2xl p-6 space-y-6 overflow-y-auto max-h-[86vh]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Form Pertanyaan</h2>
            <p class="text-sm text-gray-500 mt-1">
              Jenis Monev:
              <span class="font-semibold">{{ tipe.replace(/_/g, ' ').toUpperCase() }}</span>
            </p>
          </div>
          <button
            @click="closeModal"
            :disabled="isSubmitting"
            class="text-gray-400 hover:text-gray-600 text-lg disabled:opacity-50"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Form Tim Monev -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 class="font-semibold text-gray-800 mb-3">Informasi Tim Monitoring</h3>

          <InputText
            id="petugas"
            v-model="form.nama_petugas_monev"
            label="Nama Petugas Monev *"
            placeholder="Masukkan nama petugas"
            :error="errors.nama_petugas_monev"
            :required="true"
          />

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputText
              id="tm1"
              v-model="form.tim_monev_1"
              label="Anggota Tim 1"
              placeholder="Nama anggota"
              :error="errors.tim_monev_1"
              :required="true"
            />
            <InputText
              id="tm2"
              v-model="form.tim_monev_2"
              label="Anggota Tim 2"
              placeholder="Nama anggota"
            />
            <InputText
              id="tm3"
              v-model="form.tim_monev_3"
              label="Anggota Tim 3"
              placeholder="Nama anggota"
            />
          </div>

          <InputTextarea
            id="rekomendasi"
            v-model="form.rekomendasi_tim"
            label="Rekomendasi Tim (Opsional)"
            placeholder="Tulis rekomendasi dari tim monitoring..."
            :rows="3"
            :error="errors.rekomendasi_tim"
          />
        </div>

        <div>
          <SelectField
            v-model="form.jenis_monev"
            id="jenis_monev"
            label="Jenis Monev"
            :error="errors.jenis_monev"
            :options="jenisMonevOption"
            :required="true"
          />
        </div>

        <!-- Pertanyaan Monitoring -->
        <div v-if="Object.keys(groupedPertanyaan).length > 0" class="space-y-4">
          <h3 class="font-semibold text-gray-800 text-lg border-b pb-2">Daftar Pertanyaan</h3>

          <div
            v-for="(pertanyaanGroup, bagian) in groupedPertanyaan"
            :key="bagian"
            class="space-y-4"
          >
            <h4 class="font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg capitalize">
              {{ bagian.replace(/_/g, ' ') }}
            </h4>

            <div
              v-for="(item, index) in pertanyaanGroup"
              :key="item.id"
              class="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <!-- Pertanyaan Utama -->
              <div class="font-medium text-gray-800 mb-3 flex items-start gap-2">
                <span class="text-blue-600 font-bold">{{ index + 1 }}.</span>
                <span>{{ item.pertanyaan }}</span>
              </div>

              <!-- Input utama -->
              <div class="pl-6">
                <InputText
                  v-if="item.bentuk_pertanyaan === 'text'"
                  :id="`text-${item.id}`"
                  placeholder="Tulis jawaban..."
                  v-model="jawaban[item.id]"
                  :error="errors[item.id]"
                />
                <InputCurrency
                  v-else-if="item.bentuk_pertanyaan === 'currency'"
                  :id="`cur-${item.id}`"
                  placeholder="Masukkan nominal..."
                  v-model="jawaban[item.id]"
                  :error="errors[item.id]"
                />
                <InputCheckbox
                  v-else-if="item.bentuk_pertanyaan === 'checkbox'"
                  :id="`check-${item.id}`"
                  v-model="jawaban[item.id]"
                  text="Ya / Tidak"
                  :error="errors[item.id]"
                />
              </div>

              <!-- Sub-pertanyaan -->
              <div
                v-if="item.sub_pertanyaan?.length"
                class="mt-4 pl-8 border-l-4 border-blue-300 space-y-3"
              >
                <div
                  v-for="(sub, subIndex) in item.sub_pertanyaan"
                  :key="sub.id"
                  class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div class="text-gray-700 text-sm mb-2 font-medium flex items-start gap-2">
                    <span class="text-gray-500">{{ String.fromCharCode(97 + subIndex) }}.</span>
                    <span>{{ sub.pertanyaan }}</span>
                  </div>

                  <InputText
                    v-if="sub.bentuk_pertanyaan === 'text'"
                    :id="`subtext-${sub.id}`"
                    placeholder="Tulis jawaban..."
                    v-model="jawaban[sub.id]"
                    :error="errors[sub.id]"
                  />
                  <InputCurrency
                    v-else-if="sub.bentuk_pertanyaan === 'currency'"
                    :id="`subcur-${sub.id}`"
                    placeholder="Masukkan nominal..."
                    v-model="jawaban[sub.id]"
                    :error="errors[sub.id]"
                  />
                  <InputCheckbox
                    v-else-if="sub.bentuk_pertanyaan === 'checkbox'"
                    :id="`subcheck-${sub.id}`"
                    v-model="jawaban[sub.id]"
                    text="Ya / Tidak"
                    :error="errors[sub.id]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12 text-gray-400">
          <p>Tidak ada pertanyaan tersedia untuk jenis monev ini</p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-6 border-t bg-white">
          <BaseButton @click="closeModal" :disabled="isSubmitting" variant="secondary">
            Batal
          </BaseButton>
          <BaseButton
            @click="handleSubmit"
            :disabled="
              !(
                form.jenis_monev &&
                form.nama_petugas_monev &&
                form.tim_monev_1 &&
                Object.keys(jawaban).length
              ) || isSubmitting
            "
            variant="primary"
          >
            <span v-if="isSubmitting">Menyimpan...</span>
            <span v-else>Simpan {{ props.tipe }}</span>
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
