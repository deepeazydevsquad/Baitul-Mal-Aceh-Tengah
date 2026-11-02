import api from '@/service/api_member'

export const riwayat_permohonan = async (param: any) => {
  try {
    const response = await api.post('/riwayat_permohonan_member/list', param)
    return response.data
  } catch (error) {
    console.error('Gagal mengambil member:', error)
    throw error
  }
}

export const cancel_riwayat_permohonan = async (param: any) => {
  try {
    const response = await api.post('/riwayat_permohonan_member/delete', param)
    return response.data
  } catch (error) {
    console.error('Gagal membatalkan permohonan:', error)
    throw error
  }
}
