import api from '@/service/api_administrator';

// fungsi named export
export const send_otp = async (param: {
  whatsappNumber: string;
  otpType: 'instansi' | 'perorangan'; // optional
}) => {
  try {
    const response = await api.post('/send_otp', param);
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil request keanggotaan:', error);
    throw error;
  }
};
