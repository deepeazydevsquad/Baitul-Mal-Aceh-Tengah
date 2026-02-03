import api from '@/service/api_administrator';

export const list_desa = async (param: { kecamatan_id: number }) => {
  try {
    const response = await api.post('/riwayat_zakat/list_desa', param);
    return response.data;
  } catch (error) {
    console.error('Gagal mendapatkan data desa', error);
    throw error;
  }
};

export const list_kecamatan = async () => {
  try {
    const response = await api.get('/riwayat_zakat/list_kecamatan');
    return response.data;
  } catch (error) {
    console.error('Gagal mendapatkan data kecamatan', error);
    throw error;
  }
};

export const list_member = async (param: { desa_id: number }) => {
  try {
    const response = await api.post('/riwayat_zakat/list_member', param);
    return response.data;
  } catch (error) {
    console.error('Gagal mendapatkan data member', error);
    throw error;
  }
};

export const list_wakalah = async (param: { desa_id: number }) => {
  try {
    const response = await api.post('/riwayat_zakat/list_wakalah', param);
    return response.data;
  } catch (error) {
    console.error('Gagal mendapatkan data wakalah', error);
    throw error;
  }
};

export const list = async (param: any) => {
  try {
    const response = await api.post('/riwayat_zakat/list', param);
    return response.data;
  } catch (error) {
    console.error('Gagal mendapatkan daftar zakat', error);
    throw error;
  }
};

export const add_riwayat_zakat = async (param: any) => {
  try {
    const response = await api.post('/riwayat_zakat/add', param);
    return response.data;
  } catch (error) {
    console.error('Gagal menambahkan riwayat:', error);
    throw error;
  }
};

export const setujui_pembayaran_zakat = async (id: number) => {
  try {
    const response = await api.post('/riwayat_zakat/approve_online', {
      id: id,
    });
    return response.data;
  } catch (error) {
    console.error('Gagal menyetujui pembayaran zakat:', error);
    throw error;
  }
};

export const tolak_pembayaran_zakat = async (data: { id: number; alasan: string }) => {
  try {
    const response = await api.post('/riwayat_zakat/reject_online', data);
    return response.data;
  } catch (error) {
    console.error('Gagal menolak pembayaran zakat:', error);
    throw error;
  }
};

export const upload_bukti_transfer = async (param: any) => {
  try {
    const response = await api.post('/riwayat_zakat/upload_bukti_transfer', param, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Gagal mengupload bukti transfer:', error);
    throw error;
  }
};

export const upload_bukti_setoran = async (param: any) => {
  try {
    const response = await api.post('/riwayat_zakat/upload_bukti_setoran', param, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Gagal mengupload bukti transfer:', error);
    throw error;
  }
};

export const delete_riwayat_zakat = async (id: number) => {
  try {
    const response = await api.post('/riwayat_zakat/delete', { id: id });
    return response.data;
  } catch (error) {
    console.error('Gagal menambahkan riwayat zakat:', error);
    throw error;
  }
};

export const info_bukti_setoran = async (id: any) => {
  try {
    const response = await api.post('/riwayat_zakat/info_bukti_setoran', { id: id });
    return response.data;
  } catch (error) {
    console.error('Gagal menambahkan riwayat zakat:', error);
    throw error;
  }
};
