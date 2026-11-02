<template>
  <div class="min-h-screen w-full flex flex-col md:flex-row bg-white">
    <div class="relative w-full md:w-1/2">
      <img src="/bg.png" alt="Haji Image" class="w-full h-auto object-cover bg-white" />
      <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
    </div>

    <div class="w-full md:w-1/2 p-6 flex flex-col justify-center bg-white md:-ml-4 md:pl-16">
      <div class="space-y-4 w-full px-4 max-w-lg">
        <h2 class="text-3xl font-bold text-center mb-5 text-primary">Silahkan Buat Akun Baru!</h2>
        <CompanyDataForm v-model="companyData" @update:otp="userData.token = $event" />
        <PackageSelection v-model="packageSelected" />
        <UserDataForm v-model="userData" />
        <Button class="w-full" label="Buat Akun" @click="registerCompany" />
        <p class="text-sm text-center text-primary">
          Dengan masuk, Anda menyetujui
          <span class="font-semibold">Syarat dan Ketentuan & Kebijakan Privasi kami</span>
        </p>
      </div>

      <!-- Notifikasi -->
      <div
        v-if="notification.show"
        :class="['fixed top-4 right-4 p-4 rounded-lg text-white shadow-lg', notification.type]"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import CompanyDataForm from '@/components/Register/widgets/CompanyDataForm.vue'
import PackageSelection from '@/components/Register/widgets/PackageSelection.vue'
import UserDataForm from '@/components/Register/widgets/UserDataForm.vue'
import Button from '@/components/Register/particles/Button.vue'

const router = useRouter()
const notification = ref({ show: false, message: '', type: '' })
const companyData = ref({ company_name: '', whatsapp_company_number: '' })
const packageSelected = ref('1')
const userData = ref({ username: '', password: '', token: '', email: '', confirmPassword: '' })

const showNotification = (message, type) => {
  notification.value = { show: true, message, type }
  setTimeout(() => (notification.value.show = false), 3000)
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const registerCompany = async () => {
  // Validasi input
  if (
    !companyData.value.company_name ||
    !companyData.value.whatsapp_company_number ||
    !userData.value.username ||
    !userData.value.password ||
    !userData.value.token ||
    !packageSelected.value ||
    !userData.value.confirmPassword
  ) {
    showNotification('⚠️ Semua field harus diisi!', 'warning')
    return
  }

  if (userData.value.username.length < 8) {
    showNotification('⚠️ Username minimal 8 karakter!', 'error')
    return
  }

  if (!isValidEmail(userData.value.email)) {
    showNotification('⚠️ Format email tidak valid!', 'error')
    return
  }

  if (userData.value.password !== userData.value.confirmPassword) {
    showNotification('⚠️ Password dan konfirmasi tidak cocok!', 'error')
    return
  }

  try {
    const response = await axios.post('http://localhost:3001/register/', {
      company_name: companyData.value.company_name,
      whatsapp_company_number: companyData.value.whatsapp_company_number,
      username: userData.value.username,
      email: userData.value.email,
      password: userData.value.password,
      token: userData.value.token,
      package: packageSelected.value,
    })

    console.log('🔥 Response dari backend:', response.data)


    if (response.data.message === 'Registrasi berhasil!') {
      showNotification('✅ Registrasi berhasil! Silakan lanjutkan ke pembayaran.', 'success')

      // Redirect ke halaman kwitansi dengan order_id setelah 3 detik
      setTimeout(() => {
        const orderId = response.data.order_id // Ambil order_id dari response backend
        console.log('Redirecting to kwitansi page with order ID:', orderId) // Debugging
        router.push(`/kwitansi?order_id=${orderId}`) // Gunakan path relatif
      }, 3000)
    } else {
      showNotification(response.data.message || '❌ Registrasi gagal!', 'error')
    }
  } catch (error) {
    showNotification(error.response.data.error_msg || '❌ Registrasi gagal!', 'error')
    // console.error('❌ Error saat registrasi:')
    // console.error(error.response.data.error_msg)
    // console.error('❌ Error saat registrasi:', error)
    // console.error('❌ Error saat registrasi:', error)
    // showNotification(error.response?.data?.error || 'Registrasi gagal!', 'error')
  }
}
</script>

<style scoped>
.success {
  background-color: #4caf50;
}
.error {
  background-color: #f44336;
}
.warning {
  background-color: #ff9800;
}
.text-primary {
  color: #175690;
}
</style>
