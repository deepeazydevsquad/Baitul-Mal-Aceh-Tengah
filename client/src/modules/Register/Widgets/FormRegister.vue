<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Input from '@/components/Form/InputText.vue';
import InputDate from '@/components/Form/InputDate.vue';
import SelectField from '@/components/Form/SelectField.vue';
import Register from '@/service/register';
import Notification from '@/components/Modal/Notification.vue';
import { send_otp } from '@/service/otp';

const router = useRouter();
const timeoutId = ref<number | null>(null);

const resetNotificationTimeout = () => {
  if (timeoutId.value) clearTimeout(timeoutId.value);
  timeoutId.value = window.setTimeout(() => {
    showNotification.value = false;
  }, 3000);
};

const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('');

const displayNotification = (message: string, type: 'success' | 'error' = 'success') => {
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  resetNotificationTimeout();
};

// tipe akun
const tipeAkun = ref<'instansi' | 'perorangan' | ''>('');

const kecamatan = ref<any[]>([]);
const desa = ref<any[]>([]);
const errors = ref<Record<string, string>>({});

// form gabungan
const form = reactive({
  tipe_akun: '',
  fullname: '',
  kecamatan_id: '',
  desa_id: '',
  nomor_ktp: '',
  nomor_kk: '',
  birth_date: '',
  whatsapp_number: '',
  alamat: '',
  otp: '',
  username: '',
  password: '',
  confirm_password: '',
});

// Fetch desa tiap kali kecamatan_id berubah
watch(
  () => form.kecamatan_id,
  async (val) => {
    if (!val) {
      desa.value = [];
      form.desa_id = '';
      return;
    }
    try {
      desa.value = await Register.list_desa({ kecamatan_id: val });
      form.desa_id = ''; // reset desa kalau ganti kecamatan
    } catch (error) {
      console.error('Gagal fetch desa:', error);
    }
  },
);

// errors
// const errors = reactive<Record<string, string | null>>({});

// sync select tipe akun ke form
watch(tipeAkun, (v) => {
  form.tipe_akun = v || '';
});

async function getOtp() {
  // errors.whatsapp_number = null;

  // if (!form.whatsapp_number || form.whatsapp_number.length < 9) {
  //   errors.whatsapp_number = 'Nomor Whatsapp nggak valid';
  //   return;
  // }

  try {
    // panggil service backend
    const res = await send_otp({
      whatsappNumber: form.whatsapp_number,
      otpType: form.tipe_akun === 'instansi' ? 'instansi' : 'perorangan', // optional
    });

    displayNotification('OTP berhasil dikirim ke WhatsApp kamu 🚀', 'success');
    console.log('Respon backend OTP:', res);
  } catch (err) {
    displayNotification('Gagal kirim OTP, coba lagi!', 'error');
    console.error('Error kirim OTP:', err);
  }
}

// Validasi
const validateForm = () => {
  let isValid = true;
  errors.value = {};

  if (!form.tipe_akun) {
    errors.value.tipe_akun = 'Tipe akun wajib dipilih';
    isValid = false;
  }

  if (form.tipe_akun === 'instansi') {
    if (!form.fullname) {
      errors.value.fullname = 'Nama instansi wajib diisi';
      isValid = false;
    }
    if (!form.kecamatan_id) {
      errors.value.kecamatan_id = 'Pilih kecamatan';
      isValid = false;
    }
  } else if (form.tipe_akun === 'perorangan') {
    if (!form.fullname) {
      errors.value.fullname = 'Nama lengkap wajib diisi';
      isValid = false;
    }
    if (!form.nomor_ktp) {
      errors.value.nomor_ktp = 'Nomor KTP wajib diisi';
      isValid = false;
    }
    if (!form.birth_date) {
      errors.value.birth_date = 'Tanggal lahir wajib diisi';
      isValid = false;
    }
  } else {
    errors.value.tipe_akun = 'Tipe akun wajib diisi';
    isValid = false;
  }

  if (!form.whatsapp_number) {
    errors.value.whatsapp = 'Nomor Whatsapp wajib diisi';
    isValid = false;
  }

  if (!form.username) {
    errors.value.username = 'Username wajib diisi';
    isValid = false;
  }
  if (!form.password) {
    errors.value.password = 'Password wajib diisi';
    isValid = false;
  }
  if (form.password !== form.confirm_password) {
    errors.value.confirm_password = 'Password konfirmasi tidak cocok';
    isValid = false;
  }

  return isValid;
};

async function onSubmit(e: Event) {
  e.preventDefault();
  // Object.keys(errors).forEach((k) => (errors[k] = null));

  // if (!ok) return;
  if (!validateForm()) return;

  try {
    const payload = {
      desa_id: form.desa_id,
      tipe: form.tipe_akun, // ubah dari tipe_akun ke tipe
      fullname: form.fullname,
      nomor_ktp: form.nomor_ktp || null,
      nomor_kk: form.nomor_kk || null,
      whatsapp_number: form.whatsapp_number,
      otp: form.otp,
      birth_date: form.birth_date || null,
      alamat: form.alamat || '', // tambahin input alamat di form kalau belum ada
      username: form.username,
      password: form.password,
    };

    const res = await Register.register(payload);
    displayNotification('Pendaftaran berhasil!', 'success');

    setTimeout(() => {
      router.push('/');
    }, 2000);

    console.log('Respon server:', res);
  } catch (err) {
    displayNotification(err?.response?.data.message, 'error');
  }
}

onMounted(async () => {
  try {
    kecamatan.value = await Register.list_kecamatan({});
  } catch (error) {
    console.error('Gagal fetch kecamatan:', error);
  }
});
</script>

<template>
  <div class="bg-white min-h-screen flex items-start justify-center bg-gray-100 py-10 pt-10">
    <div class="w-full max-w-3xl bg-white rounded-2xl p-8">
      <h2 class="text-2xl text-center font-bold text-green-900 mb-4">Daftar Akun Member</h2>
      <p class="text-sm text-gray-600 italic text-center mb-10">
        "Untuk dapat menggunakan layanan kami secara penuh, silakan lengkapi proses registrasi
        dengan memasukkan data diri Anda pada form di bawah ini. Pastikan semua informasi yang Anda
        masukkan benar dan sesuai agar akun Anda dapat diverifikasi dengan baik."
      </p>
      <form @submit="onSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Select tipe akun -->
        <SelectField
          :required="true"
          v-model="tipeAkun"
          id="tipe_akun"
          label="Tipe Akun"
          placeholder="Pilih Tipe Akun"
          :error="errors.tipe_akun"
          :options="[
            { id: '', name: '-- Pilih Tipe Akun --' }, // opsi default
            { id: 'instansi', name: 'Instansi' },
            { id: 'perorangan', name: 'Perorangan' },
          ]"
          class="md:col-span-2"
          :note="`Silakan pilih jenis akun yang akan Anda daftarkan, apakah untuk perorangan atau instansi.`"
        />
        <!-- INSTANSI -->
        <template v-if="tipeAkun === 'instansi'">
          <Input
            v-model="form.fullname"
            id="fullname"
            label="Nama Instansi / Organisasi"
            placeholder="Nama Instansi / Organisasi"
            :error="errors.nama_instansi"
            class="md:col-span-2"
            :required="true"
          />
          <SelectField
            v-model="form.kecamatan_id"
            :required="true"
            id="kecamatan_instansi"
            label="Kecamatan"
            placeholder="Pilih Kecamatan"
            :error="errors.kecamatan_id"
            :options="[{ id: '', name: '-- Pilih Kecamatan --' }, ...kecamatan]"
          />
          <SelectField
            v-model="form.desa_id"
            :required="true"
            id="desa_instansi"
            label="Desa"
            placeholder="Pilih Desa"
            :error="errors.desa_id"
            :options="[{ id: '', name: '-- Pilih Desa --' }, ...desa]"
          />
        </template>
        <!-- PERORANGAN -->
        <template v-else-if="tipeAkun === 'perorangan'">
          <Input
            v-model="form.fullname"
            id="fullname"
            label="Nama Lengkap"
            placeholder="Nama Lengkap"
            :error="errors.nama_lengkap"
            class="md:col-span-2"
            :required="true"
          />
          <Input
            v-model="form.nomor_ktp"
            :required="true"
            id="nomor_ktp"
            label="Nomor KTP"
            placeholder="Nomor KTP"
            :error="errors.nomor_ktp"
          />
          <Input
            v-model="form.nomor_kk"
            :required="true"
            id="nomor_kk"
            label="Nomor KK"
            placeholder="Nomor KK"
            :error="errors.nomor_kk"
          />
          <InputDate
            v-model="form.birth_date"
            :required="true"
            id="birth_date"
            label="Tanggal Lahir"
            placeholder="mm/dd/yyyy"
            :error="errors.birth_date"
            class="md:col-span-2"
          />
          <SelectField
            v-model="form.kecamatan_id"
            :required="true"
            id="kecamatan_instansi"
            label="Kecamatan"
            placeholder="Pilih Kecamatan"
            :error="errors.kecamatan_id"
            :options="[{ id: '', name: '-- Pilih Kecamatan --' }, ...kecamatan]"
          />
          <SelectField
            v-model="form.desa_id"
            :required="true"
            id="desa_instansi"
            label="Desa"
            placeholder="Pilih Desa"
            :error="errors.desa_id"
            :options="[{ id: '', name: '-- Pilih Desa --' }, ...desa]"
          />
        </template>
        <!-- COMMON -->
        <Input
          v-model="form.whatsapp_number"
          id="whatsapp_number"
          label="Nomor Whatsapp"
          placeholder="Nomor Whatsapp"
          :error="errors.whatsapp"
          class="md:col-span-2"
          :required="true"
          :note="`Silakan masukkan nomor yang valid, karena semua informasi terkait bantuan akan dikirim melalui nomor ini.`"
        />
        <div class="md:col-span-2 grid grid-cols-3 gap-4 items-end align-top flex items-start">
          <Input
            :required="true"
            v-model="form.otp"
            id="otp"
            label="OTP"
            placeholder="Masukkan OTP"
            :error="errors.otp"
            class="col-span-2"
            :note="`OTP akan didapat setelah nomor whatsapp diisi dengan benar.`"
          />
          <button
            type="button"
            @click="getOtp"
            class="bg-[#0E561E] hover:bg-green-700 text-white px-4 py-2 rounded-lg transition align-top mt-7"
          >
            Dapatkan OTP
          </button>
        </div>
        <Input
          v-model="form.alamat"
          id="alamat"
          label="alamat"
          placeholder="alamat"
          class="md:col-span-2"
        />
        <Input
          v-model="form.username"
          id="username"
          label="Username"
          placeholder="Username"
          :required="true"
          :error="errors.username"
          class="md:col-span-2"
        />
        <Input
          v-model="form.password"
          :required="true"
          id="password"
          type="password"
          label="Password"
          placeholder="Password"
          :error="errors.password"
        />
        <Input
          v-model="form.confirm_password"
          :required="true"
          id="confirm_password"
          type="password"
          label="Konfirmasi Password"
          placeholder="Konfirmasi Password"
          :error="errors.confirm_password"
        />
        <div class="md:col-span-2 flex justify-end">
          <button
            type="submit"
            class="bg-[#0E561E] hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition"
          >
            Daftar
          </button>
        </div>
      </form>
    </div>
  </div>
  <Notification
    :showNotification="showNotification"
    :notificationType="notificationType"
    :notificationMessage="notificationMessage"
    @close="showNotification = false"
  />
</template>
