import api from '@/service/api_administrator';

// fungsi named export
export const list_desa = async (param: any) => {
  try {
    const response = await api.post('/register/daftar_desa', param);
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil request keanggotaan:', error);
    throw error;
  }
};

export const list_kecamatan = async (param: any) => {
  try {
    const response = await api.get('/register/daftar_kecamatan');
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil request keanggotaan:', error);
    throw error;
  }
};

export const register = async (param: any) => {
  try {
    const response = await api.post('/register', {
      ...param,
    });
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil request keanggotaan:', error);
    throw error;
  }
};

// export object sebagai default (ngumpulin semua fungsi)
const Register = {
  list_desa,
  list_kecamatan,
  register,
};

export default Register;
