import api from '@/service/api_administrator';

export const get_riwayat_donasi = async (param: any) => {
  try {
    const response = await api.post('/riwayat_donasi/list', param);
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil riwayat donasi:', error);
    throw error;
  }
};

export const get_info_edit_riwayat_donasi = async (id: number) => {
  try {
    const response = await api.post('/riwayat_donasi/riwayat_donasi_by_id', { id: id });
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil informasi riwayat donasi:', error);
    throw error;
  }
};

export const delete_riwayat_donasi = async (id: number) => {
  try {
    const response = await api.post(`/riwayat_donasi/delete`, { id: id });
    return response.data;
  } catch (error) {
    console.error('Gagal menghapus riwayat donasi:', error);
    throw error;
  }
};

export const setujui_pembayaran_donasi = async (id: number) => {
  try {
    const response = await api.post('/riwayat_donasi/approve_online', {
      id: id,
    });
    return response.data;
  } catch (error) {
    console.error('Gagal menyetujui pembayaran donasi:', error);
    throw error;
  }
};

export const tolak_pembayaran_donasi = async (data: { id: number; alasan: string }) => {
  try {
    const response = await api.post('/riwayat_donasi/reject_online', data);
    return response.data;
  } catch (error) {
    console.error('Gagal menolak pembayaran donasi:', error);
    throw error;
  }
};

export const upload_bukti_transfer = async (param: any) => {
  try {
    const response = await api.post('/riwayat_donasi/upload_bukti_transfer', param, {
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
    const response = await api.post('/riwayat_donasi/upload_bukti_setoran', param, {
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

export const info_bukti_setoran = async (id: number) => {
  try {
    const response = await api.post('/riwayat_donasi/info_bukti_setoran', { id: id });
    return response.data;
  } catch (error) {
    console.error('Gagal menambahkan riwayat infaq:', error);
    throw error;
  }
};
