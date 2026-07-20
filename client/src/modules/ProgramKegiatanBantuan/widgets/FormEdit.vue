<script setup lang="ts">
// Library
import BaseButton from '@/components/Button/BaseButton.vue';
import DangerButton from '@/components/Button/DangerButton.vue';
import InputCKEditor from '@/components/Form/InputCKEditor.vue';
import InputCurrency from '@/components/Form/InputCurrency.vue';
import InputDateRange from '@/components/Form/InputDateRange.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import DeleteIcon from '@/components/Icons/DeleteIcon.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Notification from '@/components/Modal/Notification.vue';
import PrimaryButton from '@/components/Button/PrimaryButton.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CropperLib from 'cropperjs';
import 'cropperjs/dist/cropper.css';
// Handle module interop: cropperjs may export as default or as the class itself
const Cropper = (CropperLib as any).default ?? CropperLib;

// Composable
import { useNotification } from '@/composables/useNotification';

// Service
import {
  edit_program_bantuan,
  get_daftar_desa,
  get_daftar_kecamatan,
  get_filter_type,
  get_info_edit_program_bantuan,
} from '@/service/program_kegiatan_bantuan';

// State: loading
import { API_URL } from '@/config/config';
const BASE_URL = API_URL;
const isLoading = ref(false);

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();

interface Props {
  isModalOpen: boolean;
  selectedProgram: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'status', payload: { error_msg?: string; error?: boolean }): void;
}>();

// Function: Close modal
const closeModal = () => {
  if (isSubmitting.value) return;
  resetForm();
  emit('close');
};

// Function: Fetch data
const asnafOption = ref<{ id: number; name: string }[]>([]);
const programOption = ref<{ id: number; name: string }[]>([]);

interface Option {
  value: number;
  label: string;
}

function mapOptions(options?: Option[]) {
  return options?.map((o) => ({ id: o.value, name: o.label })) ?? [];
}

const dataDesa = ref<{ id: number; nama: string }[]>([]);
const dataKecamatan = ref<{ id: number; nama: string }[]>([]);

// Function: Fetch data
async function fetchData() {
  if (!props.selectedProgram || !props.selectedProgram.id) return;
  isLoading.value = true;
  try {
    const responseEditInfo = await get_info_edit_program_bantuan(
      props.selectedProgram.id as number,
    );
    const response = await get_filter_type();
    const responseKecamatan = await get_daftar_kecamatan();
    const responseDesa = await get_daftar_desa();

    console.log(responseEditInfo);
    form.value = responseEditInfo.data;

    asnafOption.value = mapOptions(response.data.type_asnaf_id);
    programOption.value = mapOptions(response.data.type_program_id);

    dataKecamatan.value = responseKecamatan.data;
    dataDesa.value = responseDesa.data;

    if (form.value.banner && form.value.banner !== '-') {
      previewUrl.value = `${BASE_URL}/uploads/img/program_kegiatan_bantuan/${form.value.banner}`;
    } else {
      previewUrl.value = null;
    }

    console.log(form.value);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

// Function: Reset form
const resetForm = () => {
  form.value = {
    id: 0,
    asnaf_id: '',
    program_id: '',
    nama_kegiatan: '',
    status_tampil: false,
    jumlah_dana: 0,
    jumlah_maksimal_nominal_bantuan: 0,
    jumlah_target_penerima: 0,
    sumber_dana: '',
    area_penyaluran: '',
    desa_penyaluran: [{ desa_id: '', kuota: 0 }],
    kecamatan_penyaluran: [{ kecamatan_id: '', kuota: 0 }],
    jenis_penyaluran: '',
    tahun: 0,
    date_range: { start: null, end: null },
    banner: null,
    desc: '',
  };


  previewUrl.value = null;
  cancelCrop();

  // Reset errors
  errors.value = {};
};

// Function:
const errors = ref<Record<string, string>>({
  asnaf_id: '',
  program_id: '',
  nama_kegiatan: '',
  status_tampil: '',
  jumlah_dana: '',
  jumlah_maksimal_nominal_bantuan: '',
  jumlah_target_penerima: '',
  sumber_dana: '',
  area_penyaluran: '',
  jenis_penyaluran: '',
  tahun: '',
  banner: '',
  desc: '',
});

const validateForm = () => {
  let isValid = true;

  // Reset errors
  errors.value = {};

  if (!props.selectedProgram?.id) {
    displayNotification('Form Invalid, Silahkan keluar dan isi form kembali.', 'error');
    isValid = false;
  }

  if (isCropping.value) {
    errors.value.banner = 'Harap klik "Pangkas & Simpan" terlebih dahulu untuk menyimpan gambar.';
    isValid = false;
  }

  if (!form.value.nama_kegiatan) {
    errors.value.nama_kegiatan = 'Nama kegiatan wajib diisi.';
    isValid = false;
  }

  if (!form.value.tahun) {
    errors.value.tahun = 'Tahun wajib diisi.';
    isValid = false;
  }

  if (!form.value.sumber_dana) {
    errors.value.sumber_dana = 'Sumber dana wajib diisi.';
    isValid = false;
  }

  if (form.value.sumber_dana == 'zakat' && !form.value.asnaf_id) {
    errors.value.asnaf_id = 'Asnaf wajib diisi.';
    isValid = false;
  }

  if (!form.value.program_id) {
    errors.value.program_id = 'Program wajib diisi.';
    isValid = false;
  }

  if (!form.value.jumlah_dana) {
    errors.value.jumlah_dana = 'Jumlah dana wajib diisi.';
    isValid = false;
  }

  if (form.value.jumlah_dana < form.value.jumlah_maksimal_nominal_bantuan) {
    errors.value.jumlah_maksimal_nominal_bantuan =
      'Jumlah dana tidak boleh kurang dari jumlah maksimal nominal bantuan.';
    isValid = false;
  }

  if (!form.value.jenis_penyaluran) {
    errors.value.jenis_penyaluran = 'Jenis penyaluran wajib diisi.';
    isValid = false;
  }

  if (!form.value.jumlah_maksimal_nominal_bantuan) {
    errors.value.jumlah_maksimal_nominal_bantuan = 'Jumlah maksimal nominal bantuan wajib diisi.';
    isValid = false;
  }

  if (!form.value.area_penyaluran) {
    errors.value.area_penyaluran = 'Area penyaluran wajib diisi.';
    isValid = false;
  }

  if (form.value.area_penyaluran === 'kecamatan' && form.value.jenis_penyaluran === 'volume') {
    if (!form.value.kecamatan_penyaluran || form.value.kecamatan_penyaluran.length === 0) {
      errors.value.kecamatan_penyaluran = 'Kecamatan penyaluran wajib diisi.';
      isValid = false;
    } else {
      // Hitung total kuota
      const totalKuota = form.value.kecamatan_penyaluran.reduce(
        (total, current) => total + (Number(current.kuota) || 0),
        0,
      );

      if (form.value.jumlah_target_penerima && totalKuota > form.value.jumlah_target_penerima) {
        errors.value.area_penyaluran = 'Jumlah kuota kecamatan melebihi jumlah target penerima.';
        isValid = false;
      }
    }
  }

  if (form.value.area_penyaluran === 'desa' && form.value.jenis_penyaluran === 'volume') {
    if (!form.value.desa_penyaluran || form.value.desa_penyaluran.length === 0) {
      errors.value.desa_penyaluran = 'Desa penyaluran wajib diisi.';
      isValid = false;
    } else {
      // Hitung total kuota
      const totalKuota = form.value.desa_penyaluran.reduce(
        (total, current) => total + (Number(current.kuota) || 0),
        0,
      );

      if (form.value.jumlah_target_penerima && totalKuota > form.value.jumlah_target_penerima) {
        errors.value.area_penyaluran = 'Jumlah kuota desa melebihi jumlah target penerima.';
        isValid = false;
      }
    }
  }

  if (form.value.jenis_penyaluran === 'volume' && !form.value.jumlah_target_penerima) {
    errors.value.jumlah_target_penerima = 'Jumlah target penerima wajib diisi.';
    isValid = false;
  }

  if (form.value.status_tampil) {
    const hasStartDate = form.value.date_range?.start;
    const hasEndDate = form.value.date_range?.end;

    // Jika salah satu terisi, wajib isi keduanya
    if (hasStartDate || hasEndDate) {
      if (!hasStartDate || !hasEndDate) {
        errors.value.date_range = 'Tanggal mulai dan akhir harus diisi keduanya.';
        isValid = false;
      } else {
        // Validasi tahun harus sesuai dengan input tahun penyaluran
        const startYear = new Date(form.value.date_range.start).getFullYear();
        const endYear = new Date(form.value.date_range.end).getFullYear();
        const inputYear = Number(form.value.tahun);

        if (startYear !== inputYear || endYear !== inputYear) {
          errors.value.date_range = `Periode harus di tahun ${inputYear}.`;
          isValid = false;
        }
      }
    }
  }

  console.log(errors.value);

  return isValid;
};

// Function: Handle file
const previewUrl = ref<string | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const isCropping = ref(false);
// Gunakan plain let (bukan ref/shallowRef) agar Vue tidak pernah mem-proxy Cropper
let cropperInst: Cropper | null = null;
let pendingCropInit = false;

// Watch imageRef: inisialisasi Cropper begitu elemen muncul di DOM
watch(imageRef, (el) => {
  if (el && pendingCropInit) {
    if (cropperInst) {
      cropperInst.destroy();
      cropperInst = null;
    }
    cropperInst = new Cropper(el, {
      aspectRatio: 602 / 330,
      viewMode: 3,
      autoCropArea: 1,
      cropBoxResizable: false,
      cropBoxMovable: false,
      dragMode: 'move',
      toggleDragModeOnDblclick: false,
    });
    pendingCropInit = false;
  }
});

const handleFile = (file: File | null) => {
  if (!file) {
    if (props.selectedProgram?.banner) {
      previewUrl.value = `${BASE_URL}/uploads/img/program_kegiatan_bantuan/${props.selectedProgram.banner}`;
    } else {
      previewUrl.value = null;
    }
    form.value.banner = null;
    return;
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > 2) {
    errors.value.banner = 'Ukuran file maksimal 2 MB';
    return;
  }

  errors.value.banner = '';

  // Hancurkan cropper lama jika ada
  if (cropperInst) {
    cropperInst.destroy();
    cropperInst = null;
  }

  pendingCropInit = true;
  previewUrl.value = URL.createObjectURL(file);
  form.value.banner = null;
  isCropping.value = true;
};

const handleCrop = () => {
  if (!cropperInst) {
    console.warn('Cropper belum siap');
    return;
  }
  cropperInst.getCroppedCanvas({
    width: 602,
    height: 330,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  }).toBlob((blob) => {
    if (blob) {
      const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
      form.value.banner = file;
      const newUrl = URL.createObjectURL(blob);
      cropperInst?.destroy();
      cropperInst = null;
      isCropping.value = false;
      previewUrl.value = newUrl;
    }
  }, 'image/jpeg', 0.9);
};

const cancelCrop = () => {
  if (cropperInst) {
    cropperInst.destroy();
    cropperInst = null;
  }
  isCropping.value = false;
  pendingCropInit = false;
  
  if (props.selectedProgram?.banner) {
    previewUrl.value = `${BASE_URL}/uploads/img/program_kegiatan_bantuan/${props.selectedProgram.banner}`;
  } else {
    previewUrl.value = null;
  }
  form.value.banner = null;
  
  // Reset input file via id
  const el = document.getElementById('banner-upload') as HTMLInputElement;
  if (el) el.value = '';
};

// Function: Handle submit
const isSubmitting = ref(false);
const form = ref<{
  id: number;
  asnaf_id: string;
  program_id: string;
  nama_kegiatan: string;
  status_tampil: boolean;
  jumlah_dana: number;
  jumlah_maksimal_nominal_bantuan: number;
  jumlah_target_penerima: number;
  sumber_dana: string;
  area_penyaluran: string;
  desa_penyaluran: { desa_id: string | number; kuota: number }[];
  kecamatan_penyaluran: { kecamatan_id: string | number; kuota: number }[];
  jenis_penyaluran: string;
  tahun: number;
  date_range: { start: string | null; end: string | null } | null;
  banner: File | null;
  desc: string;
}>({
  id: 0,
  asnaf_id: '',
  program_id: '',
  nama_kegiatan: '',
  status_tampil: false,
  jumlah_dana: 0,
  jumlah_maksimal_nominal_bantuan: 0,
  jumlah_target_penerima: 0,
  sumber_dana: '',
  area_penyaluran: '',
  desa_penyaluran: [{ desa_id: '', kuota: 0 }],
  kecamatan_penyaluran: [{ kecamatan_id: '', kuota: 0 }],
  jenis_penyaluran: '',
  tahun: 0,
  date_range: null,
  banner: null,
  desc: '',
});

const handleSubmit = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;

  const formData = new FormData();
  formData.append('id', form.value.id || Number(props.selectedProgram.id));
  Object.entries(form.value).forEach(([key, value]) => {
    if (key === 'banner' && !value) return;

    if (key === 'desa_penyaluran') {
      if (form.value.area_penyaluran === 'desa') {
        formData.append('desa_penyaluran', JSON.stringify(value));
      } else {
        formData.append('desa_penyaluran', JSON.stringify([]));
      }
    } else if (key === 'kecamatan_penyaluran') {
      if (form.value.area_penyaluran === 'kecamatan') {
        formData.append('kecamatan_penyaluran', JSON.stringify(value));
      } else {
        formData.append('kecamatan_penyaluran', JSON.stringify([]));
      }
    } else if (key === 'jumlah_target_penerima') {
      if (form.value.jenis_penyaluran === 'volume') {
        formData.append('jumlah_target_penerima', value);
      } else {
        formData.append('jumlah_target_penerima', 0);
      }
    } else if (key === 'date_range') {
      if (value && typeof value === 'object') {
        formData.append('start_date', value.start || null);
        formData.append('end_date', value.end || null);
      }
    } else if (key === 'asnaf_id') {
      if (form.value.sumber_dana === 'zakat') {
        formData.append('asnaf_id', value);
      } else {
        formData.append('asnaf_id', '');
      }
    } else {
      formData.append(key, value);
    }
  });

  console.log(Object.fromEntries(formData.entries()));
  let isSuccess = false;
  try {
    const response = await edit_program_bantuan(formData);
    console.log(response);
    emit('status', { error_msg: response.error_msg || response, error: response.error });
    
    if (!response.error) {
      isSuccess = true;
    }
  } catch (error: any) {
    console.error(error);
    displayNotification(error.response.data.error_msg || error.response.data.message, 'error');
  } finally {
    isSubmitting.value = false;
    if (isSuccess) closeModal();
  }
};

// Function: Handle escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isModalOpen) closeModal();
};
onMounted(async () => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(async () => {
  document.removeEventListener('keydown', handleEscape);
});

watch(
  () => [props.isModalOpen, props.selectedProgram],
  ([isModalOpen, selectedProgram]) => {
    if (isModalOpen && selectedProgram) {
      fetchData();
      if (selectedProgram?.banner) {
        previewUrl.value = `${BASE_URL}/uploads/img/program_kegiatan_bantuan/${selectedProgram.banner}`;
      }
    }
  },
);

watch(
  () => form.value.area_penyaluran,
  (val) => {
    if (val === 'desa') {
      // hanya inisialisasi kalau belum ada data
      if (!form.value.desa_penyaluran?.length) {
        form.value.desa_penyaluran = [{ desa_id: '', kuota: 0 }];
      }
    } else if (val === 'kecamatan') {
      if (!form.value.kecamatan_penyaluran?.length) {
        form.value.kecamatan_penyaluran = [{ kecamatan_id: '', kuota: 0 }];
      }
    } else {
      form.value.desa_penyaluran = [];
      form.value.kecamatan_penyaluran = [];
    }
  },
);

const filteredAsnafOptions = computed(() => {
  if (form.value.sumber_dana === 'zakat') {
    return [{ id: '', name: '-- Pilih Asnaf --' }, ...asnafOption.value];
  } else {
    return [{ id: '', name: '-- Pilih Asnaf --' }];
  }
});

// Nama file yang ditampilkan di InputFile — jika sudah dicrop tampilkan 'banner.jpg',
// jika belum ada file baru tampilkan nama file lama dari server
const bannerFileName = computed(() => {
  if (form.value.banner instanceof File) {
    return form.value.banner.name;
  }
  if (typeof form.value.banner === 'string' && form.value.banner) {
    return form.value.banner;
  }
  return '';
});

function openImageInNewTab() {
  const url = new URL(previewUrl.value);
  const win = window.open(url.toString(), '_blank');
  win?.focus();
}
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
    <!-- Overlay -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- Loading -->
      <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />

      <!-- Modal Content -->
      <div v-else class="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 id="modal-title" class="text-xl font-bold text-gray-800">Edit Program Bantuan</h2>
          <button
            class="text-lg text-gray-400 hover:text-gray-600"
            @click="closeModal"
            aria-label="Tutup modal"
          >
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Body -->
        <div class="max-h-[60vh] space-y-6 overflow-y-auto px-1 py-2">
          <div class="grid grid-cols-6 gap-6">
            <!-- Upload Banner -->
            <div class="col-span-3">
              <InputFile
                id="banner-upload"
                label="Upload Banner"
                buttonText="Pilih File"
                accept=".jpg,.jpeg,.png"
                :error="errors.banner"
                :maxSize="2000"
                :show-preview="false"
                :initialFileName="bannerFileName"
                dimensionsInfo="wajib 602x330 px"
                @file-selected="handleFile"
              />
            </div>

            <!-- Preview -->
            <div v-if="previewUrl" class="col-span-3 mt-3">
              <p class="text-sm text-gray-500 mb-2 font-bold">Preview:</p>
              
              <div v-if="isCropping" class="w-full">
                <div class="mb-4">
                  <img :src="previewUrl" ref="imageRef" class="max-w-full max-h-[300px] block" />
                </div>
                <div class="flex gap-2">
                  <BaseButton type="button" variant="primary" size="sm" @click="handleCrop">Pangkas & Simpan</BaseButton>
                  <BaseButton type="button" variant="secondary" size="sm" @click="cancelCrop">Batal</BaseButton>
                </div>
              </div>

              <div v-else class="space-y-2">
                <img
                  :src="previewUrl"
                  alt="Preview"
                  class="w-full rounded-md border object-cover mb-3"
                  style="max-height: 165px;"
                  @click="openImageInNewTab"
                />

                <BaseButton type="button" variant="danger" size="sm" class="w-full justify-center" @click="cancelCrop">
                  <font-awesome-icon icon="fa-solid fa-trash" />
                  Hapus / Batalkan Perubahan Gambar
                </BaseButton>
              </div>
            </div>
          </div>

          <!-- Form Grid -->
          <div class="grid grid-cols-6 gap-6">
            <!-- Nama & Tahun -->
            <div class="col-span-4">
              <InputText
                id="nama_kegiatan"
                v-model="form.nama_kegiatan"
                label="Nama Kegiatan Penyaluran"
                placeholder="Masukkan nama kegiatan penyaluran"
                required
                :error="errors.nama_kegiatan"
              />
            </div>
            <div class="col-span-2">
              <InputText
                id="tahun"
                v-model="form.tahun"
                label="Tahun Penyaluran"
                placeholder="Masukkan tahun"
                required
                :error="errors.tahun"
              />
            </div>

            <!-- Sumber Dana & Kategori & Program -->
            <div class="col-span-2">
              <SelectField
                id="sumber_dana"
                v-model="form.sumber_dana"
                label="Sumber Dana"
                :options="[
                  { id: '', name: '-- Pilih Sumber Dana --' },
                  { id: 'infaq', name: 'Infaq' },
                  { id: 'zakat', name: 'Zakat' },
                ]"
                required
                :error="errors.sumber_dana"
              />
            </div>
            <div class="col-span-2">
              <SelectField
                id="asnaf_id"
                v-model="form.asnaf_id"
                label="Kategori Asnaf"
                :disabled="form.sumber_dana !== 'zakat'"
                :options="filteredAsnafOptions"
                required
                :error="errors.asnaf_id"
              />
            </div>
            <div class="col-span-2">
              <SelectField
                id="program_id"
                v-model="form.program_id"
                label="Program Kegiatan"
                :options="[{ id: '', name: '-- Pilih Program Kegiatan --' }, ...programOption]"
                required
                :error="errors.program_id"
              />
            </div>

            <!-- Status Tampil -->
            <div class="col-span-2 flex flex-col">
              <label class="mb-1 text-sm font-semibold text-gray-600">
                Tampilkan di Halaman Depan (Optional)
              </label>
              <div class="flex items-center">
                <input
                  id="status_tampil"
                  v-model="form.status_tampil"
                  type="checkbox"
                  class="mr-2 rounded text-green-900 focus:ring-green-900"
                />
                <label for="status_tampil" class="text-sm text-gray-600">Tampilkan</label>
              </div>
            </div>

            <!-- Date Range - Muncul kalau checkbox checked -->
            <div v-if="form.status_tampil" class="col-span-2">
              <InputDateRange
                id="date_range"
                v-model="form.date_range"
                :year="form.tahun"
                label="Periode Penyaluran (Optional)"
                :columns="1"
                :start-span="1"
                :end-span="1"
                :error="errors.date_range"
                note="Kosongkan jika tampil tanpa batasan waktu"
              />
            </div>

            <!-- Dana -->
            <div class="col-span-2">
              <InputCurrency
                id="jumlah_dana"
                v-model="form.jumlah_dana"
                label="Jumlah Dana"
                placeholder="Masukkan jumlah dana"
                :max="1_000_000_000"
                :note="`Maksimal ${$formatToRupiah(1000000000)}`"
                required
                :error="errors.jumlah_dana"
              />
            </div>

            <!-- Jenis Penyaluran -->
            <div class="col-span-2">
              <SelectField
                id="jenis_penyaluran"
                v-model="form.jenis_penyaluran"
                label="Jenis Penyaluran"
                :options="[
                  { id: '', name: '-- Pilih Jenis Penyaluran --' },
                  { id: 'langsung', name: 'Langsung' },
                  { id: 'volume', name: 'Volume' },
                ]"
                required
                :error="errors.jenis_penyaluran"
              />
            </div>

            <!-- Jumlah Penerima & Maksimal Bantuan -->
            <div :class="form.status_tampil ? 'col-span-2' : 'col-span-3'">
              <InputText
                id="jumlah_target_penerima"
                v-model="form.jumlah_target_penerima"
                label="Jumlah Penerima Bantuan"
                placeholder="Masukkan jumlah penerima bantuan"
                :disabled="form.jenis_penyaluran == 'langsung' || form.jenis_penyaluran == ''"
                :error="errors.jumlah_target_penerima"
              />
            </div>
            <div :class="form.status_tampil ? 'col-span-2' : 'col-span-3'">
              <InputCurrency
                id="jumlah_maksimal_nominal_bantuan"
                v-model="form.jumlah_maksimal_nominal_bantuan"
                label="Jumlah Maksimal Nominal Bantuan"
                placeholder="Masukkan jumlah maksimal nominal bantuan"
                :max="1_000_000_000"
                :note="`Maksimal ${$formatToRupiah(1000000000)}`"
                required
                :error="errors.jumlah_maksimal_nominal_bantuan"
              />
            </div>

            <!-- Deskripsi -->
            <div class="col-span-6">
              <InputCKEditor
                id="desc"
                v-model="form.desc"
                label="Deskripsi Program Bantuan (Optional)"
                placeholder="Masukkan deskripsi program bantuan"
                :rows="5"
                :error="errors.desc"
              />
            </div>
            <!-- Area Penyaluran -->
            <div class="col-span-2">
              <SelectField
                id="area"
                v-model="form.area_penyaluran"
                label="Area Penyaluran"
                :options="[
                  { id: '', name: '-- Pilih Area Penyaluran --' },
                  { id: 'semua_pemohon', name: 'Semua Pemohon' },
                  { id: 'kabupaten', name: 'Kabupaten' },
                  { id: 'instansi', name: 'Instansi' },
                  { id: 'kecamatan', name: 'Kecamatan' },
                  { id: 'desa', name: 'Desa' },
                ]"
                required
                :error="errors.area_penyaluran"
              />
            </div>

            <!-- Jika pilih Kecamatan -->
            <div v-if="form.area_penyaluran === 'kecamatan'" class="col-span-4">
              <div
                v-for="(item, index) in form.kecamatan_penyaluran"
                :key="'kec-' + index"
                class="flex gap-2 mb-2"
              >
                <!-- Select Kecamatan -->
                <div class="w-full">
                  <SelectField
                    :id="'kecamatan-' + index"
                    v-model="item.kecamatan_id"
                    label="Pilih Kecamatan"
                    :options="[{ id: '', name: '-- Pilih Kecamatan --' }, ...dataKecamatan]"
                    required
                  />
                </div>

                <div class="max-w-[100px]">
                  <!-- Input Kuota -->
                  <InputText
                    :id="'kuota-kecamatan-' + index"
                    v-model="item.kuota"
                    label="Kuota"
                    placeholder=""
                    type="number"
                    required
                  />
                </div>

                <!-- Hapus -->
                <div class="flex justify-center gap-2 items-center">
                  <DangerButton
                    class="mt-7"
                    :disabled="
                      isSubmitting ||
                      !form.kecamatan_penyaluran.some(
                        (item, idx) => idx === index && !item.kecamatan_id,
                      )
                    "
                    @click="form.kecamatan_penyaluran.splice(index, 1)"
                  >
                    <DeleteIcon />
                  </DangerButton>
                </div>
              </div>

              <!-- Tambah Row -->
              <BaseButton
                type="button"
                variant="warning"
                size="sm"
                @click="form.kecamatan_penyaluran.push({ kecamatan_id: '', kuota: 0 })"
              >
                + Tambah Kecamatan
              </BaseButton>
            </div>

            <!-- Jika pilih Desa -->
            <div v-if="form.area_penyaluran === 'desa'" class="col-span-4">
              <div
                v-for="(item, index) in form.desa_penyaluran"
                :key="'desa-' + index"
                class="flex gap-2 mb-2"
              >
                <!-- Select Desa -->
                <div class="w-full">
                  <SelectField
                    :id="'desa-' + index"
                    v-model="item.desa_id"
                    label="Pilih Desa"
                    :options="[{ id: '', name: '-- Pilih Desa --' }, ...dataDesa]"
                    required
                  />
                </div>

                <div class="max-w-[100px]">
                  <!-- Input Kuota -->
                  <InputText
                    :id="'kuota-desa-' + index"
                    v-model="item.kuota"
                    label="Kuota"
                    placeholder=""
                    type="number"
                    required
                  />
                </div>

                <!-- Hapus -->
                <div class="flex justify-center gap-2 items-center">
                  <DangerButton
                    class="mt-7"
                    :disabled="
                      isSubmitting ||
                      !form.desa_penyaluran.some((item, idx) => idx === index && !item.desa_id)
                    "
                    @click="form.desa_penyaluran.splice(index, 1)"
                  >
                    <DeleteIcon />
                  </DangerButton>
                </div>
              </div>

              <!-- Tambah Row -->
              <BaseButton
                type="button"
                variant="warning"
                size="sm"
                @click="form.desa_penyaluran.push({ desa_id: '', kuota: 0 })"
              >
                + Tambah Desa
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-4 flex justify-end gap-3">
          <BaseButton
            type="button"
            variant="secondary"
            :disabled="isSubmitting"
            @click="closeModal"
          >
            Batal
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            :disabled="
              !(
                form.program_id &&
                form.nama_kegiatan.trim() &&
                form.jumlah_dana &&
                form.jumlah_maksimal_nominal_bantuan &&
                form.sumber_dana.trim() &&
                form.area_penyaluran.trim() &&
                form.jenis_penyaluran.trim() &&
                form.tahun &&
                (form.status_tampil ? form.date_range?.start && form.date_range?.end : true) &&
                (form.banner || form.desc.trim())
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

  <!-- Notification -->
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>
