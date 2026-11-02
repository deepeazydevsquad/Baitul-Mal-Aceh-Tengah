<script setup lang="ts">
import BaseButton from '@/components/Button/BaseButton.vue';
import InputFile from '@/components/Form/InputFile.vue';
import InputFileList from '@/components/Form/InputFileList.vue';
import InputRadio from '@/components/Form/InputRadio.vue';
import InputText from '@/components/Form/InputText.vue';
import SelectField from '@/components/Form/SelectField.vue';
import TextArea from '@/components/Form/TextArea.vue';
import LoadingSpinner from '@/components/Loading/LoadingSpinner.vue';
import Confirmation from '@/components/Modal/Confirmation.vue';
import Notification from '@/components/Modal/Notification.vue';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Composable
import { useConfirmation } from '@/composables/useConfirmation';
import { useNotification } from '@/composables/useNotification';
// Service
import {
  createSurveySession,
  downloadSurveySk,
  getInfo,
  getInfoMember,
  submitSurvey,
} from '@/service/survey_lapangan';

// Composable: notification
const { showNotification, notificationType, notificationMessage, displayNotification } =
  useNotification();
// Composable: confirmation
const { showConfirmDialog, confirmTitle, confirmMessage, displayConfirmation, confirm, cancel } =
  useConfirmation();

// State Data
const route = useRoute();
const router = useRouter();

function readAccessCodeFromRoute() {
  const queryCode = Array.isArray(route.query.code)
    ? route.query.code[0]
    : route.query.code;
  if (typeof queryCode === 'string' && queryCode) return queryCode;
  const hashCode = new URLSearchParams(route.hash.replace(/^#/, '')).get('code');
  return hashCode || '';
}

let initialAccessCode = readAccessCodeFromRoute();

// State: Loading
const isLoading = ref(false);

// Navigation
function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

// Interface
interface DataInfo {
  surveyor_kegiatan_id: number;
  status: string;
  surveyor_name: string;
  kegiatan_name: string;
  program_name: string;
  asnaf_name: string;
  sk: string;
  member: {
    id: number;
    name: string;
  }[];
}

const dataInfo = ref<DataInfo>({
  surveyor_kegiatan_id: 0,
  status: '',
  surveyor_name: '',
  kegiatan_name: '',
  program_name: '',
  asnaf_name: '',
  sk: '',
  member: [],
});

// Form State
const currentStep = ref(1);
const totalSteps = 5;

// Form Data
const formData = ref({
  // Step 1: SK Surveyor & Pemohon
  member_id: 0,

  // Step 2: Data Responden
  tanggal_penilaian: '',
  nomor_ktp: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  nama_suami_istri: '',
  pekerjaan_suami_istri: '',
  jumlah_tanggungan: '',
  alamat: '',

  // Step 3: Pertanyaan Saringan
  jenis_kelamin: '',
  status_pernikahan: '',
  usia_25_60: '',
  penduduk_tetap: '',
  penghasilan_kepala_keluarga: '',

  // Step 4: Kondisi Peserta & Rumah
  kondisi_fisik: '',
  atap: '',
  rangka_rumah: '',
  dinding_rumah: '',
  lantai: '',
  mck: '',
  luas_rumah: '',

  // Step 5: Kondisi Peserta & Rumah
  aset: '',
  kendaraan: '',
  keterangan_kondisi_calon: '',
  keterangan_pilih_mustahik: '',
  kesimpulan: '',
  status: '',
});

// Upload banyak (maks 10 file)
const dokumentasiFiles = ref<File[]>([]);
// Form Upload 1 file
const formUpload = ref<Record<string, File | null>>({
  form_survey: null,
  berita_acara: null,
});

const handleFileChange = (fieldName: string, file: File | null) => {
  formUpload.value[fieldName] = file;
};

// Function: fetch data
async function fetchData() {
  isLoading.value = true;
  try {
    const response = await getInfo();
    dataInfo.value = response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error_msg ||
      'Terjadi kesalahan';
    displayNotification(
      `${message}, Mengarahkan ke halaman utama`,
      'error',
    );
    setTimeout(() => router.push({ path: '/' }), 2000);
    console.error('Error fetching data:', error);
  } finally {
    isLoading.value = false;
  }
}

interface InfoSurvey {
  name: string;
  lokasi: {
    desa: string;
    kecamatan: string;
  };
}

const dataInfoSurvey = ref<InfoSurvey>({
  name: '',
  lokasi: {
    desa: '',
    kecamatan: '',
  },
});

async function fetchInfoMember() {
  if (!formData.value.member_id || formData.value.member_id === 0) {
    displayNotification('Pemohon bantuan harus diisi', 'error');
    return;
  }

  isLoading.value = true;
  try {
    const response = await getInfoMember({
      member_id: formData.value.member_id,
    });
    dataInfoSurvey.value = response.data;
    if (response.error === false) {
      nextStep();
    } else {
      prevStep();
    }
  } catch (error: any) {
    displayNotification(error.response?.data?.message || 'Terjadi kesalahan', 'error');
    console.error('Error fetching data:', error);
  } finally {
    isLoading.value = false;
  }
}

// Form Validation
const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

// Function: validate form
const validateForm = () => {
  errors.value = {};
  let isValid = true;

  // Step 1: SK Surveyor & Pemohon
  if (!formData.value.member_id || formData.value.member_id === 0) {
    errors.value.member_id = 'Pemohon bantuan harus diisi';
    isValid = false;
  }

  // Step 2: Data Responden
  if (!formData.value.tanggal_penilaian) {
    errors.value.tanggal_penilaian = 'Tanggal penilaian harus diisi';
    isValid = false;
  }
  if (!formData.value.nomor_ktp) {
    errors.value.nomor_ktp = 'Nomor KTP harus diisi';
    isValid = false;
  } else if (formData.value.nomor_ktp.length !== 16) {
    errors.value.nomor_ktp = 'Nomor KTP harus 16 digit';
    isValid = false;
  }
  if (!formData.value.tempat_lahir) {
    errors.value.tempat_lahir = 'Tempat lahir harus diisi';
    isValid = false;
  }
  if (!formData.value.tanggal_lahir) {
    errors.value.tanggal_lahir = 'Tanggal lahir harus diisi';
    isValid = false;
  }
  if (!formData.value.nama_suami_istri) {
    errors.value.nama_suami_istri = 'Nama suami/istri harus diisi';
    isValid = false;
  }
  if (!formData.value.pekerjaan_suami_istri) {
    errors.value.pekerjaan_suami_istri = 'Pekerjaan suami/istri harus diisi';
    isValid = false;
  }
  if (!formData.value.jumlah_tanggungan) {
    errors.value.jumlah_tanggungan = 'Jumlah tanggungan harus diisi';
    isValid = false;
  }
  if (!formData.value.alamat) {
    errors.value.alamat = 'Alamat harus diisi';
    isValid = false;
  }

  // Step 3: Pertanyaan Saringan
  if (!formData.value.jenis_kelamin) {
    errors.value.jenis_kelamin = 'Jenis kelamin harus diisi';
    isValid = false;
  }
  if (!formData.value.status_pernikahan) {
    errors.value.status_pernikahan = 'Status pernikahan harus diisi';
    isValid = false;
  }
  if (!formData.value.usia_25_60) {
    errors.value.usia_25_60 = 'Usia 25-60 tahun harus diisi';
    isValid = false;
  }
  if (!formData.value.penduduk_tetap) {
    errors.value.penduduk_tetap = 'Status penduduk tetap harus diisi';
    isValid = false;
  }
  if (!formData.value.penghasilan_kepala_keluarga) {
    errors.value.penghasilan_kepala_keluarga = 'Penghasilan kepala keluarga harus diisi';
    isValid = false;
  }

  // Step 4: Kondisi Peserta & Rumah
  if (!formData.value.kondisi_fisik) {
    errors.value.kondisi_fisik = 'Kondisi fisik harus diisi';
    isValid = false;
  }
  if (!formData.value.atap) {
    errors.value.atap = 'Kondisi atap harus diisi';
    isValid = false;
  }
  if (!formData.value.rangka_rumah) {
    errors.value.rangka_rumah = 'Rangka rumah harus diisi';
    isValid = false;
  }
  if (!formData.value.dinding_rumah) {
    errors.value.dinding_rumah = 'Dinding rumah harus diisi';
    isValid = false;
  }
  if (!formData.value.lantai) {
    errors.value.lantai = 'Kondisi lantai harus diisi';
    isValid = false;
  }
  if (!formData.value.mck) {
    errors.value.mck = 'Kondisi MCK harus diisi';
    isValid = false;
  }
  if (!formData.value.luas_rumah) {
    errors.value.luas_rumah = 'Luas rumah harus diisi';
    isValid = false;
  }

  // Step 5: Kondisi Peserta & Rumah (Lanjutan)
  if (!formData.value.aset) {
    errors.value.aset = 'Aset harus diisi';
    isValid = false;
  }
  if (!formData.value.kendaraan) {
    errors.value.kendaraan = 'Kendaraan harus diisi';
    isValid = false;
  }
  if (!formData.value.keterangan_kondisi_calon) {
    errors.value.keterangan_kondisi_calon = 'Keterangan kondisi calon harus diisi';
    isValid = false;
  }
  if (!formData.value.keterangan_pilih_mustahik) {
    errors.value.keterangan_pilih_mustahik = 'Keterangan pilih mustahik harus diisi';
    isValid = false;
  }
  if (!formData.value.kesimpulan) {
    errors.value.kesimpulan = 'Kesimpulan harus diisi';
    isValid = false;
  }
  if (!formData.value.status) {
    errors.value.status = 'Status harus diisi';
    isValid = false;
  }

  // Validasi Upload Files (Dokumentasi - Multiple)
  if (dokumentasiFiles.value.length === 0) {
    errors.value.dokumentasi = 'Minimal 1 file dokumentasi harus diupload';
    isValid = false;
  }

  // Validasi Upload Files (Single Files)
  if (!formUpload.value.form_survey) {
    errors.value.form_survey = 'Form survey harus diupload';
    isValid = false;
  }
  if (!formUpload.value.berita_acara) {
    errors.value.berita_acara = 'Berita acara harus diupload';
    isValid = false;
  }

  // Ke halaman kedua
  if (!isValid) {
    currentStep.value = 2;
    displayNotification('Mohon lengkapi semua field yang wajib diisi', 'error');
  }

  return isValid;
};

// Function: submit form
const handleSubmit = async () => {
  // Validasi form
  if (!validateForm()) {
    displayNotification('Mohon lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  // Validasi files
  if (dokumentasiFiles.value.length === 0) {
    displayNotification('Minimal 1 file dokumentasi harus diupload', 'error');
    return;
  }
  if (!formUpload.value.form_survey) {
    displayNotification('Form survey harus diupload', 'error');
    return;
  }
  if (!formUpload.value.berita_acara) {
    displayNotification('Berita acara harus diupload', 'error');
    return;
  }

  // Konfirmasi sebelum submit
  displayConfirmation(
    'Konfirmasi Pengiriman',
    'Apakah Anda yakin ingin mengirim data survey ini?',
    async () => {
      try {
        isSubmitting.value = true;

        // Helper function untuk normalize value
        const normalize = (value: string | number) => {
          if (typeof value === 'string') {
            return value.toLowerCase().trim();
          }
          return value.toString();
        };

        // Prepare FormData
        const formDataSubmit = new FormData();

        // Append all data
        const dataToSubmit = {
          // Step 1
          member_id: formData.value.member_id,

          // Step 2
          tanggal_penilaian: formData.value.tanggal_penilaian,
          nomor_ktp: formData.value.nomor_ktp,
          tempat_lahir: formData.value.tempat_lahir,
          tanggal_lahir: formData.value.tanggal_lahir,
          nama_suami_istri: formData.value.nama_suami_istri,
          pekerjaan_suami_istri: formData.value.pekerjaan_suami_istri,
          jumlah_tanggungan: formData.value.jumlah_tanggungan,
          alamat: formData.value.alamat,

          // Step 3
          jenis_kelamin: normalize(formData.value.jenis_kelamin),
          status_pernikahan: normalize(formData.value.status_pernikahan),
          usia_25_60: normalize(formData.value.usia_25_60),
          penduduk_tetap: normalize(formData.value.penduduk_tetap),
          penghasilan_kepala_keluarga: normalize(formData.value.penghasilan_kepala_keluarga),

          // Step 4
          kondisi_fisik: normalize(formData.value.kondisi_fisik),
          atap: normalize(formData.value.atap),
          rangka_rumah: normalize(formData.value.rangka_rumah),
          dinding_rumah: normalize(formData.value.dinding_rumah),
          lantai: normalize(formData.value.lantai),
          mck: normalize(formData.value.mck),
          luas_rumah: normalize(formData.value.luas_rumah),

          // Step 5
          aset: normalize(formData.value.aset),
          kendaraan: normalize(formData.value.kendaraan),
          keterangan_kondisi_calon: formData.value.keterangan_kondisi_calon,
          keterangan_pilih_mustahik: formData.value.keterangan_pilih_mustahik,
          kesimpulan: formData.value.kesimpulan,
          status: normalize(formData.value.status),
        };

        // Append non-file data
        Object.entries(dataToSubmit).forEach(([key, value]) => {
          formDataSubmit.append(key, value.toString());
        });

        // Append files
        dokumentasiFiles.value.forEach((file) => {
          formDataSubmit.append('dokumentasi', file);
        });

        if (formUpload.value.form_survey) {
          formDataSubmit.append('form_survey', formUpload.value.form_survey);
        }

        if (formUpload.value.berita_acara) {
          formDataSubmit.append('berita_acara', formUpload.value.berita_acara);
        }
        // Submit ke API
        const response = await submitSurvey(formDataSubmit);

        // Success
        const successMessage =
          response.data?.error_msg || response.error_msg || 'Data survey berhasil dikirim';

        displayNotification(successMessage, 'success');

        // Redirect
        setTimeout(() => {
          router.push({ path: '/' });
        }, 2000);
      } catch (error: any) {
        console.error('Error submit survey:', error);

        // Parse error message
        let errorMessage = 'Terjadi kesalahan saat mengirim data';

        if (error.response?.data?.message || error.response?.data?.error_msg) {
          errorMessage = error.response.data.message || error.response.data.error_msg;
        } else if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          errorMessage = errors.map((e: any) => e.msg || e.message).join(', ');
        } else if (error.message) {
          errorMessage = error.message;
        }

        displayNotification(errorMessage, 'error');
      } finally {
        isSubmitting.value = false;
      }
    },
  );
};

// Handle Download
const isDownloading = ref(false);
const handleDownload = async () => {
  if (!dataInfo.value.sk) {
    displayNotification('Tidak ada file SK untuk diunduh', 'warning');
    return;
  }

  try {
    isDownloading.value = true;
    const dataFile = await downloadSurveySk(
      dataInfo.value.surveyor_kegiatan_id,
    );
    const urlFile = URL.createObjectURL(dataFile);
    const linkFile = document.createElement('a');
    linkFile.href = urlFile;
    linkFile.download = dataInfo.value.sk;
    linkFile.click();
    URL.revokeObjectURL(urlFile);
  } catch (error) {
    displayNotification('Gagal mendownload file, silahkan coba lagi', 'error');
    console.error('Error downloading file:', error);
  } finally {
    isDownloading.value = false;
  }
};

onMounted(async () => {
  try {
    if (initialAccessCode) {
      await createSurveySession(initialAccessCode);
      initialAccessCode = '';
      await router.replace({ path: route.path, query: {}, hash: '' });
    }
    await fetchData();
  } catch (error: any) {
    displayNotification(
      error.response?.data?.error_msg ||
        error.response?.data?.message ||
        'Sesi survei tidak valid.',
      'error',
    );
    setTimeout(() => router.push({ path: '/' }), 2000);
  }
});

// Watcher
watch(
  () => formData.value.member_id,
  () => {
    fetchInfoMember();
  },
);
</script>

<template>
  <div class="mx-auto p-6 max-w-full min-h-screen flex flex-col bg-white justify-center">
    <!-- Header -->
    <LoadingSpinner v-if="isLoading" label="Memuat halaman..." />
    <div v-else class="flex-1 flex flex-col bg-white rounded-lg shadow-sm p-6">
      <div class="space-y-6">
        <!-- Logo & Title -->
        <div class="text-center space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img :src="'/images/logo.png'" alt="Logo" class="h-14" />
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600 font-bold">
                AREA SURVEYOR
                {{ dataInfo.surveyor_name.toUpperCase() }}
              </p>
            </div>
          </div>

          <div class="pt-4">
            <h1 class="text-xl font-bold">FORM SURVEY KEGIATAN PENYALURAN</h1>
            <p class="text-sm text-gray-600">
              {{ dataInfo.kegiatan_name.toUpperCase() }}
            </p>
            <p class="text-sm text-gray-600 text-uppercase">
              {{ dataInfo.asnaf_name }} | {{ dataInfo.program_name }}
            </p>
          </div>
        </div>

        <!-- Progress Indicator -->
        <div class="flex items-center justify-center gap-2 py-4">
          <div v-for="step in totalSteps" :key="step" class="flex items-center">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                currentStep >= step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500',
              ]"
            >
              {{ step }}
            </div>
            <div
              v-if="step < totalSteps"
              :class="['w-16 h-1', currentStep > step ? 'bg-green-600' : 'bg-gray-200']"
            ></div>
          </div>
        </div>

        <!-- Form Content -->
        <div class="p-6 space-y-6 md:w-1/2 mx-auto">
          <h3 class="text-lg font-semibold border-b pb-2">SK Surveyor</h3>
          <BaseButton
            variant="warning"
            size="lg"
            :full-width="true"
            :disabled="isDownloading || isLoading"
            @click="handleDownload()"
          >
            <font-awesome-icon
              :icon="isDownloading ? 'fa-solid fa-spinner' : 'fa-solid fa-download'"
              :class="{ 'animate-spin': isDownloading, 'mr-2': true }"
            />
            Download File SK Surveyor
          </BaseButton>
          <!-- Step 1: SK Surveyor & Pemohon Bantuan -->
          <div v-if="currentStep === 1" class="space-y-6">
            <h3 class="text-lg font-semibold border-b pb-2">Pilih Pemohon Bantuan</h3>

            <div>
              <SelectField
                label="Pilih Nama Pemohon Bantuan"
                :options="[
                  { id: 0, name: '--- Silahkan Pilih Satu Pemohon Bantuan ---' },
                  ...dataInfo.member,
                ]"
                v-model="formData.member_id"
              />
            </div>

            <div class="text-center p-4 bg-gray-50 rounded">
              <p class="font-semibold">Silahkan Pilih Salah Satu Pemohon Bantuan</p>
            </div>
          </div>

          <!-- Step 2: Info Survey & Data Responden -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold border-b pb-2 mb-4">INFO SURVEY</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputText
                  v-model="dataInfoSurvey.lokasi.desa"
                  label="Desa"
                  placeholder="Desa"
                  readonly
                />
                <InputText
                  v-model="dataInfoSurvey.lokasi.kecamatan"
                  label="Kecamatan"
                  placeholder="Kecamatan"
                  readonly
                />
                <InputText
                  v-model="dataInfo.surveyor_name"
                  label="Nama Petugas"
                  placeholder="Nama Petugas"
                  readonly
                />
                <InputText
                  v-model="formData.tanggal_penilaian"
                  label="Tanggal Penilaian"
                  type="date"
                  :error="errors.tanggal_penilaian"
                  required
                />
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold border-b pb-2 mb-4">DATA RESPONDEN</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputText
                  v-model="formData.nomor_ktp"
                  label="Nomor KTP"
                  placeholder="Nomor KTP"
                  :error="errors.nomor_ktp"
                  required
                />
                <InputText
                  v-model="formData.tempat_lahir"
                  label="Tempat Lahir"
                  placeholder="Tempat Lahir"
                  :error="errors.tempat_lahir"
                  required
                />
                <InputText
                  v-model="formData.tanggal_lahir"
                  label="Tanggal Lahir"
                  type="date"
                  :error="errors.tanggal_lahir"
                  required
                />
                <InputText
                  v-model="formData.nama_suami_istri"
                  label="Nama Suami / Istri"
                  placeholder="Nama Suami / Istri"
                  :error="errors.nama_suami_istri"
                  required
                />
                <InputText
                  v-model="formData.pekerjaan_suami_istri"
                  label="Pekerjaan Suami / Istri"
                  placeholder="Pekerjaan Suami / Istri"
                  :error="errors.pekerjaan_suami_istri"
                  required
                />
                <InputText
                  v-model="formData.jumlah_tanggungan"
                  label="Jumlah Tanggungan Suami / Istri"
                  placeholder="Jumlah Tanggungan Suami / Istri"
                  type="number"
                  :error="errors.jumlah_tanggungan"
                  required
                />
              </div>

              <div class="mt-4">
                <TextArea
                  v-model="formData.alamat"
                  label="Alamat"
                  placeholder="Alamat"
                  rows="4"
                  :error="errors.alamat"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Step 3: Pertanyaan Saringan -->
          <div v-if="currentStep === 3" class="space-y-6">
            <h3 class="text-lg font-semibold border-b pb-2">PERTANYAAN SARINGAN</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputRadio
                  id="radio-jenis-kelamin"
                  v-model="formData.jenis_kelamin"
                  label="Jenis Kelamin"
                  :required="true"
                  :options="[
                    { value: 'laki_laki', label: 'Laki-laki' },
                    { value: 'perempuan', label: 'Perempuan' },
                  ]"
                  :error="errors.jenis_kelamin"
                />
              </div>

              <div>
                <InputRadio
                  id="radio-status-pernikahan"
                  v-model="formData.status_pernikahan"
                  label="Status Pernikahan"
                  :required="true"
                  :options="[
                    { value: 'belum_nikah', label: 'Belum Menikah' },
                    { value: 'menikah', label: 'Menikah' },
                    { value: 'cerai_mati', label: 'Cerai / Mati' },
                    { value: 'cerai_hidup', label: 'Cerai / Hidup' },
                  ]"
                  :error="errors.status_pernikahan"
                />
              </div>

              <div>
                <InputRadio
                  id="radio-usia25-60"
                  v-model="formData.usia_25_60"
                  label="Apakah Usia Anda saat ini 25 s.d 60 tahun?"
                  :required="true"
                  :options="[
                    { value: 'iya', label: 'Iya (Lanjut)' },
                    { value: 'tidak', label: 'Tidak (Selesai)' },
                  ]"
                  :error="errors.usia_25_60"
                />
              </div>

              <div>
                <InputRadio
                  id="radio-penduduk-tetap"
                  v-model="formData.penduduk_tetap"
                  label="Apakah Anda Penduduk tetap di Daerah ini?"
                  :required="true"
                  :options="[
                    { value: 'iya', label: 'Iya (Lanjut)' },
                    { value: 'tidak', label: 'Tidak (Selesai)' },
                  ]"
                  :error="errors.penduduk_tetap"
                />
              </div>

              <div>
                <InputRadio
                  id="radio-penghasilan-kepala-keluarga"
                  v-model="formData.penghasilan_kepala_keluarga"
                  label="Apakah penghasilan kepala keluarga Anda dalam sebulan kurang dari Rp. 2.000.000,-?"
                  :required="true"
                  :options="[
                    { value: 'iya', label: 'Iya (Lanjut)' },
                    { value: 'tidak', label: 'Tidak (Selesai)' },
                  ]"
                  :error="errors.penghasilan_kepala_keluarga"
                />
              </div>
            </div>
          </div>

          <!-- Step 4: Kondisi Peserta & Rumah -->
          <div v-if="currentStep === 4" class="space-y-6">
            <div>
              <h3 class="text-lg font-semibold border-b pb-2 mb-4">KONDISI PESERTA SAAT INI</h3>
              <div>
                <InputRadio
                  id="radio-kondisi-peserta"
                  v-model="formData.kondisi_fisik"
                  label="Kondisi Fisik"
                  :required="true"
                  :options="[
                    { value: 'disabilitas', label: 'Disabilitas' },
                    { value: 'non_disabilitas', label: 'Non Disabilitas' },
                    { value: 'pasca_odgj', label: 'Pasca ODGJ' },
                  ]"
                  :error="errors.kondisi_fisik"
                />
              </div>
            </div>

            <div>
              <h3 class="text-lg font-semibold border-b pb-2 mb-4">KONDISI RUMAH SAAT INI</h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <InputRadio
                    id="radio-atap"
                    v-model="formData.atap"
                    label="Atap"
                    :required="true"
                    :options="[
                      { value: 'genteng_seng', label: 'Genteng Seng' },
                      { value: 'genteng_beton', label: 'Genteng Beton' },
                    ]"
                    :error="errors.atap"
                  />
                </div>

                <div>
                  <InputRadio
                    id="radio-dinding"
                    v-model="formData.rangka_rumah"
                    label="Dinding"
                    :required="true"
                    :options="[
                      { value: 'kayu', label: 'Kayu' },
                      { value: 'beton', label: 'Beton' },
                    ]"
                    :error="errors.rangka_rumah"
                  />
                </div>

                <div>
                  <InputRadio
                    id="radio-dinding-rumah"
                    v-model="formData.dinding_rumah"
                    label="Dinding Rumah"
                    :required="true"
                    :options="[
                      { value: 'tembok_semen', label: 'Tembok Semen' },
                      { value: 'papan', label: 'Papan' },
                      { value: 'triplek', label: 'Triplek' },
                    ]"
                    :error="errors.dinding_rumah"
                  />
                </div>

                <div>
                  <InputRadio
                    id="radio-lantai"
                    v-model="formData.lantai"
                    label="Lantai"
                    :required="true"
                    :options="[
                      { value: 'tanah', label: 'Tanah' },
                      { value: 'keramik', label: 'Keramik' },
                      { value: 'ubin_semen', label: 'Ubin Semen' },
                    ]"
                    :error="errors.lantai"
                  />
                </div>

                <div>
                  <InputRadio
                    id="radio-mck"
                    v-model="formData.mck"
                    label="MCK"
                    :required="true"
                    :options="[
                      { value: 'sungai_jamban', label: 'Sungai Jamban' },
                      { value: 'mck_umum', label: 'MCK Umum' },
                      { value: 'k_mandi_pribadi', label: 'K. Mandi Pribadi' },
                    ]"
                    :error="errors.mck"
                  />
                </div>

                <div>
                  <InputRadio
                    id="radio-luas-rumah"
                    v-model="formData.luas_rumah"
                    label="Luas Rumah"
                    :required="true"
                    :options="[
                      { value: 'kecil', label: 'Kecil' },
                      { value: 'sedang', label: 'Sedang' },
                      { value: 'luas', label: 'Luas' },
                    ]"
                    :error="errors.luas_rumah"
                  />
                </div>
              </div>
            </div>
          </div>
          <!-- Step 4: Kondisi Peserta & Rumah -->
          <div v-if="currentStep === 5" class="space-y-6">
            <h3 class="text-lg font-semibold border-b pb-2 mb-4">HARTA YANG DIMILIKI</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputRadio
                  id="radio-aset"
                  v-model="formData.aset"
                  label="Aset"
                  :required="true"
                  :options="[
                    { value: 'kebun', label: 'Kebun' },
                    { value: 'emas', label: 'Emas' },
                    { value: 'Sawah', label: 'Sawah' },
                    { value: 'Tanah', label: 'Tanah' },
                  ]"
                  :error="errors.aset"
                />
              </div>

              <div>
                <InputRadio
                  id="radio-kendaraan"
                  v-model="formData.kendaraan"
                  label="Kendaraan"
                  :required="true"
                  :options="[
                    { value: 'sepeda', label: 'Sepeda' },
                    { value: 'sepeda_motor', label: 'Sepeda Motor' },
                    { value: 'mobil', label: 'Mobil' },
                  ]"
                  :error="errors.kendaraan"
                />
              </div>

              <div>
                <TextArea
                  v-model="formData.keterangan_kondisi_calon"
                  label="Keterangan Kondisi Calon"
                  placeholder="Keterangan Kondisi Calon"
                  :error="errors.keterangan_kondisi_calon"
                />
              </div>
              <div>
                <InputRadio
                  id="radio-pilih-mustahik"
                  v-model="formData.keterangan_pilih_mustahik"
                  label="Keterangan Pilihan Mustahik"
                  :options="[
                    { value: 'miskin', label: 'Kondisi Orang Miskin' },
                    { value: 'sederhana', label: 'Kondisi Orang Sederhana' },
                    { value: 'kaya', label: 'Kondisi Orang Kaya' },
                  ]"
                  :error="errors.keterangan_pilih_mustahik"
                  :required="true"
                />
              </div>
              <div>
                <TextArea
                  v-model="formData.kesimpulan"
                  label="Kesimpulan"
                  :required="true"
                  placeholder="Kesimpulan"
                  :error="errors.kesimpulan"
                />
              </div>
              <div>
                <InputRadio
                  id="radio-kesimpulan-survey"
                  v-model="formData.status"
                  label="Kesimpulan survey"
                  :options="[
                    { value: 'approve', label: 'Disetujui' },
                    { value: 'reject', label: 'Tolak Disetujui' },
                  ]"
                  :error="errors.status"
                  :required="true"
                />
              </div>

              <div class="flex flex-col gap-4">
                <div>
                  <InputFile
                    id="upload-form-survey"
                    label="Upload Form Survey"
                    buttonText="Pilih File"
                    :required="true"
                    accept=".jpg,.jpeg,.png"
                    :error="errors.form_survey"
                    :maxSize="1000"
                    @file-selected="(file) => handleFileChange('form_survey', file)"
                  />
                </div>

                <div>
                  <InputFile
                    id="upload-berita-acara"
                    label="Upload Berita Acara"
                    buttonText="Pilih File"
                    :required="true"
                    accept=".jpg,.jpeg,.png"
                    :error="errors.berita_acara"
                    :maxSize="1000"
                    @file-selected="(file) => handleFileChange('berita_acara', file)"
                  />
                </div>
              </div>
              <!-- Upload dokumentasi multiple -->
              <div>
                <InputFileList
                  id="dokumentasi"
                  label="Upload Dokumentasi"
                  button-text="Pilih File Gambar"
                  accept="image/*"
                  accept-text="jpg, jpeg, png"
                  :max-files="10"
                  :max-size-per-file="1024"
                  :required="true"
                  :error="errors.dokumentasi"
                  @files-changed="dokumentasiFiles = $event"
                />
              </div>
            </div>
          </div>

          <!-- Navigation Buttons -->
          <div class="flex justify-between pt-6 border-t">
            <BaseButton v-if="currentStep > 1" variant="secondary" @click="prevStep">
              Sebelumnya
            </BaseButton>
            <div v-else></div>

            <BaseButton
              v-if="currentStep < totalSteps"
              :disabled="!formData.member_id"
              variant="primary"
              @click="nextStep"
            >
              Selanjutnya
            </BaseButton>
            <BaseButton v-else variant="success" @click="handleSubmit"> Kirim Survey </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation -->
    <Confirmation
      :show-confirm-dialog="showConfirmDialog"
      :confirm-title="confirmTitle"
      :confirm-message="confirmMessage"
    >
      <BaseButton variant="secondary" @click="cancel">Tidak</BaseButton>
      <BaseButton variant="warning" @click="confirm">Ya</BaseButton>
    </Confirmation>

    <!-- Notification -->
    <Notification
      :show-notification="showNotification"
      :notification-type="notificationType"
      :notification-message="notificationMessage"
      @close="showNotification = false"
    />
  </div>
</template>
